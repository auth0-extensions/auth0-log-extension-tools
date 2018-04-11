const _ = require('lodash');
const tools = require('auth0-extension-tools');

const logTypes = require('./logTypes');
const LogsApiStream = require('./stream');
const StorageProvider = require('./storage');

function LogsProcessor(storageContext, options) {
  if (options === null || options === undefined) {
    throw new tools.ArgumentError('Must provide an options object');
  }

  this.storage = new StorageProvider(storageContext);
  this.options = _.assign({ },
    {
      batchSize: 100,
      maxRetries: 5,
      maxRunTimeSeconds: 20
    },
    options
  );
}

LogsProcessor.prototype.hasTimeLeft = function(start) {
  const now = new Date().getTime();
  const limit = this.options.maxRunTimeSeconds;
  return start + (limit * 1000) >= now;
};

LogsProcessor.prototype.getLogFilter = function(options) {
  var types = options.logTypes || [];
  if (options.logLevel) {
    const typesFromLevel = _.map(logTypes, function(data, type) {
      const logType = data;
      logType.type = type;
      return logType;
    });

    types = types.concat(
      _.map(
        _.filter(typesFromLevel, function(type) {
          return type.level >= options.logLevel;
        }),
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
    .then(function(data) {
      return _.filter(data.logs, function(log) {
        const logStart = new Date(log.start).getTime();
        const logEnd = new Date(log.end).getTime();

        return (logStart >= startStamp && logEnd <= endStamp);
      });
    })
    .then(function(logs) {
      const result = {
        type: 'report',
        processed: 0,
        warnings: 0,
        errors: 0,
        checkpoint: ''
      };

      _.each(logs, function(log) {
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
  const self = this;
  return self.storage
    .getCheckpoint(options.startFrom)
    .then(function(startCheckpoint) {
      if (options.logger) {
        options.logger.debug('Starting logs processor from checkpoint:', startCheckpoint);
      }

      return new LogsApiStream({
        checkpointId: startCheckpoint,
        types: self.getLogFilter(options),
        domain: options.domain,
        clientId: options.clientId,
        clientSecret: options.clientSecret,
        tokenCache: self.storage
      });
    });
};

LogsProcessor.prototype.run = function(handler) {
  const self = this;
  return new Promise(function(resolve, reject) {
    const start = new Date().getTime();
    var retries = 0;
    var lastLogDate = 0;
    var logsBatch = [];
    const storage = self.storage;
    const options = self.options;
    const batchSize = options.batchSize;
    const maxRetries = options.maxRetries;

    // Stop the run because it failed.
    const runFailed = function(error, status, checkpoint) {
      if (options.logger) {
        options.logger.debug('Processor failed:', error);
      }

      status.error = error;

      storage
        .done(status, checkpoint)
        .then(function() {
          return resolve({ status: status, checkpoint: checkpoint });
        })
        .catch(reject);
    };

    // The run ended successfully.
    const runSuccess = function(status, checkpoint) {
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
          .then(function() {
            return resolve({ status: status, checkpoint: checkpoint });
          })
          .catch(reject);
      }

      return resolve({ status: status, checkpoint: checkpoint });
    };

    // Figure out how big we want the batch of logs to be.
    const getNextLimit = function() {
      var limit = batchSize;
      limit -= logsBatch.length;
      if (limit > 100) {
        limit = 100;
      }
      return limit;
    };

    // Retry the process if it failed.
    const retryProcess = function(err, stream, handleError) {
      if (!self.hasTimeLeft(start)) {
        return runFailed(err, stream.status, stream.previousCheckpoint);
      }

      if (retries < maxRetries) {
        retries += 1;
        return handler(logsBatch, handleError);
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
      return runFailed(error, stream.status, stream.lastCheckpoint);
    };

    self.createStream(options)
      .then(function(stream) {
        const nextLimit = getNextLimit();

        if (options.logger) {
          options.logger.debug('Loading next batch of logs. Next limit:', nextLimit);
        }

        // Get the first batch.
        stream.next(nextLimit);

        // Process batch of logs.
        stream.on('data', function(data) {
          const logs = data.logs;
          logsBatch = logsBatch.concat(logs);

          if (logs && logs.length) {
            lastLogDate = new Date(logs[logs.length - 1].date).getTime();
          }

          // TODO: At some point, even if the batch is too small, we need to ship the logs.
          if (logsBatch.length < batchSize && self.hasTimeLeft(start)) {
            return stream.next(getNextLimit());
          }

          const processComplete = function(err) {
            if (err) {
              return retryProcess(err, stream, processComplete);
            }

            logsBatch = [];

            if (!self.hasTimeLeft(start)) {
              return stream.done();
            }

            stream.batchSaved();
            return stream.next(getNextLimit());
          };
          return handler(logsBatch, processComplete);
        });

        // We've reached the end of the stream.
        stream.on('end', function() {
          const processComplete = function(err) {
            if (err) {
              return retryProcess(err, stream, processComplete);
            }

            stream.batchSaved();
            return runSuccess(stream.status, stream.lastCheckpoint);
          };
          handler(logsBatch, processComplete);
        });

        // An error occured when processing the stream.
        stream.on('error', function(err) {
          runFailed(err, stream.status, stream.previousCheckpoint);
        });
      })
      .catch(reject);
  });
};

module.exports = LogsProcessor;
