'use strict';

const _ = require('lodash');
const Promise = require('bluebird');
const tools = require('auth0-extension-tools');

const logTypes = require('./logTypes');
const LogsApiStream = require('./stream');
const StorageProvider = require('./storage');

function LogsProcessor(storageContext, options) {
  if (options === null || options === undefined) {
    throw new tools.ArgumentError('Must provide an options object');
  }

  this.start = new Date().getTime();
  this.storage = new StorageProvider(storageContext);
  this.options = _.assign({ },
    {
      batchSize: 100,
      maxRetries: 5,
      maxRunTimeSeconds: 22
    },
    options
  );
}

LogsProcessor.prototype.hasTimeLeft = function(start, responseCount) {
  const now = new Date().getTime();
  const averageTime = (now - start) / responseCount;
  const limit = this.options.maxRunTimeSeconds;
  const timeLeft = (start + (limit * 1000)) - now; 

  if (this.options.logger) {
    this.options.logger.debug(`${timeLeft/1000} seconds run time left, average response time is ${averageTime/1000} seconds.`);
  }

  return timeLeft >= averageTime;
};

LogsProcessor.prototype.getLogFilter = function(options) {
  var types = options.logTypes || [];
  if (options.logLevel) {
    const typesFromLevel = _.map(logTypes, (data, type) => {
      const logType = data;
      logType.type = type;
      return logType;
    });

    types = types.concat(
      _.map(
        _.filter(typesFromLevel, type => type.level >= options.logLevel),
        'type'
      )
    );
  }

  return _.uniq(types);
};

LogsProcessor.prototype.getReport = function(start, end) {
  const startStamp = new Date(start).getTime();
  const endStamp = (end) ? new Date(end).getTime() : new Date().getTime();

  return this.storage.read()
    .then(data => _.filter(data.logs, (log) => {
      const logStart = new Date(log.start).getTime();
      const logEnd = new Date(log.end).getTime();

      return (logStart >= startStamp && logEnd <= endStamp);
    }))
    .then((logs) => {
      const result = {
        type: 'report',
        processed: 0,
        warnings: 0,
        errors: 0,
        checkpoint: ''
      };

      _.each(logs, (log) => {
        result.processed += log.logsProcessed;
        result.checkpoint = log.checkpoint;

        if (log.error) {
          result.errors += 1;
        }

        if (log.warning) {
          result.warnings += 1;
        }
      });

      return result;
    });
};

LogsProcessor.prototype.createStream = function(options) {
  return this.storage
    .getCheckpoint(options.startFrom)
    .then((startCheckpoint) => {
      if (options.logger) {
        options.logger.debug('Starting logs processor from checkpoint:', startCheckpoint);
      }

      return new LogsApiStream({
        checkpointId: startCheckpoint,
        types: this.getLogFilter(options),
        start: this.start,
        maxRetries: options.maxRetries,
        maxRunTimeSeconds: options.maxRunTimeSeconds,
        domain: options.domain,
        clientId: options.clientId,
        clientSecret: options.clientSecret,
        tokenCache: this.storage,
        logger: options.logger
      });
    });
};

LogsProcessor.prototype.run = function(handler) {
  const handlerAsync = Promise.promisify(handler);

  return new Promise((resolve, reject) => {
    const start = this.start;
    let responseCount = 0;
    let retries = 0;
    let lastLogDate = 0;
    let logsBatch = [];
    const storage = this.storage;
    const options = this.options;
    const batchSize = options.batchSize;
    const maxRetries = options.maxRetries;

    // Stop the run because it failed.
    const runFailed = (error, status, checkpoint) => {
      if (options.logger) {
        options.logger.debug('Processor failed:', error);
      }

      status.error = error;

      storage
        .done(status, checkpoint)
        .then(() => resolve({ status: status, checkpoint: checkpoint }))
        .catch(reject);
    };

    // The run ended successfully.
    const runSuccess = (status, checkpoint) => {
      if (options.logger) {
        options.logger.debug('Processor run complete. Logs processed:', status.logsProcessed);
      }

      if (status.logsProcessed > 0) {
        const week = 604800000;
        const currentDate = new Date().getTime();
        const timeDiff = currentDate - lastLogDate;

        if (timeDiff >= week) {
          status.warning = 'Logs are outdated more than for week. Last processed log has date is ' +
            new Date(lastLogDate);
        }

        return storage
          .done(status, checkpoint)
          .then(() => resolve({ status: status, checkpoint: checkpoint }))
          .catch(reject);
      }

      return resolve({ status: status, checkpoint: checkpoint });
    };

    // Figure out how big we want the batch of logs to be.
    const getNextLimit = () => {
      var limit = batchSize;
      limit -= logsBatch.length;
      if (limit > 100) {
        limit = 100;
      }
      return limit;
    };

    // Retry the process if it failed.
    const retryProcess = (err, stream) => {
      if (!this.hasTimeLeft(start, responseCount)) {
        return Promise.reject({
          err,
          status: stream.status,
          checkpoint: stream.previousCheckpoint,
          unrecoverable: true
        });
      }

      if (retries < maxRetries) {
        retries += 1;
        return handlerAsync(logsBatch);
      }

      const error = [
        err,
        'Skipping logs from ' +
        stream.previousCheckpoint +
        ' to ' +
        stream.lastCheckpoint +
        ' after ' +
        maxRetries +
        ' retries.'
      ];

      if (options.logger) {
        options.logger.error(error[0], error[1]);
      }

      // We're giving up.
      return Promise.reject({
        err: error,
        status: stream.status,
        checkpoint: stream.lastCheckpoint,
        unrecoverable: true
      });
    };

    this.createStream(options)
      .then(stream => new Promise((streamResolve, streamReject) => {
        const nextLimit = getNextLimit();
        let timedOut = false;

        if (options.logger) {
          options.logger.debug('Loading next batch of logs. Next limit:', nextLimit);
        }

        // Get the first batch.
        stream.next(nextLimit);

        // Process batch of logs.
        stream.on('data', (data) => {
          const logs = data.logs;
          logsBatch = logsBatch.concat(logs);

          responseCount++;

          if (logs && logs.length) {
            lastLogDate = new Date(logs[logs.length - 1].date).getTime();
          }

          // TODO: At some point, even if the batch is too small, we need to ship the logs.
          if (logsBatch.length < batchSize && this.hasTimeLeft(start, responseCount)) {
            return stream.next(getNextLimit());
          }

          const processComplete = (err) => {
            if (err) {
              if (err.unrecoverable) {
                return streamReject(err);
              }

              return retryProcess(err.err || err, stream)
                .then(() => processComplete())
                .catch(err => processComplete(err));
            }

            logsBatch = [];

            if (!this.hasTimeLeft(start, responseCount)) {
              if (options.logger) {
                options.logger.debug('No time left for additional requests');
              }
              
              return stream.done();
            }

            stream.batchSaved();
            return stream.next(getNextLimit());
          };

          return handlerAsync(logsBatch)
            .then(() => processComplete())
            .catch(err => processComplete(err));
        });

        const handleEnd = () => {
          const processComplete = (err) => {
            if (err) {
              if (err.unrecoverable) {
                return streamReject(err);
              }

              return retryProcess(err.err || err, stream)
                .then(() => processComplete())
                .catch(err => processComplete(err));
            }

            stream.batchSaved();
            return streamResolve({
              status: stream.status,
              checkpoint: stream.lastCheckpoint
            });
          };

          return handlerAsync(logsBatch)
            .then(() => processComplete())
            .catch(err => processComplete(err));
        };

        new Promise((endResolve) => {
          stream.on('end', endResolve);
        })
        .then(handleEnd);

        // An error occured when processing the stream.
        stream.on('error', err => streamReject({
          err,
          status: stream.status,
          checkpoint: stream.previousCheckpoint
        }));
      })
      )
      .then(result => runSuccess(result.status, result.checkpoint))
      .catch(result => runFailed(result.err, result.status, result.checkpoint));
  });
};

module.exports = LogsProcessor;
