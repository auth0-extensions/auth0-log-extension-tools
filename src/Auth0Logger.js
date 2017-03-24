const _ = require('lodash');

const Auth0LogStream = require('./Auth0LogStream');
const Auth0Storage = require('./Auth0Storage');
const logTypes = require('./logTypes');

function checkOptions(options) {
  if (!options || typeof options !== 'object') {
    throw new Error('options is required');
  }

  if (!options.onLogsReceived || typeof options.onLogsReceived !== 'function') {
    throw new Error('onLogsReceived function is required');
  }

  if (!options.domain || !options.clientId || !options.clientSecret) {
    throw new Error('domain, clientId and clientSecret are required');
  }
}

function checkTime(start, limit) {
  const now = new Date().getTime();
  return start + limit * 1000 >= now;
}

function Auth0Logger(wtStorage, options) {
  checkOptions(options);
  return function (req, res, next) {
    const storage = new Auth0Storage(wtStorage);
    const start = new Date().getTime();
    const batchSize = options.batchSize || 100;
    const maxRetries = options.maxRetries || 5;

    storage.getCheckpoint(options.startFrom)
      .then(function(startCheckpoint) {
        const streamOptions = {
          checkpointId: startCheckpoint,
          types: getSelectedTypes()
        };

        const auth0Options = {
          domain: options.domain,
          clientId: options.clientId,
          clientSecret: options.clientSecret
        };

        const stream = new Auth0LogStream(auth0Options, streamOptions, storage);
        var logsBatch = [];
        var lastLogDate = 0;
        var retries = 0;

        function processError(error, status, checkpoint) {
          status.error = error;

          if (options.onError) {
            options.onError(status, checkpoint);
          }

          storage.done(status, checkpoint)
            .then(function () { return res.json({ status: status, checkpoint: checkpoint }); })
            .catch(next);
        }

        function processDone(status, checkpoint) {
          if (options.onSuccess) {
            options.onSuccess(status, checkpoint);
          }

          if (status.logsProcessed > 0) {
            const currentDate = new Date().getTime();
            const timeDiff = currentDate - lastLogDate;
            const week = 604800000;

            if (timeDiff >= week) {
              status.warning = 'Logs are outdated more than for week. Last processed log has date is ' + new Date(lastLogDate);
            }

            return storage.done(status, checkpoint)
              .then(function() { res.json({ status: status, checkpoint: checkpoint }); })
              .catch(next);
          }

          return res.json({ status: status, checkpoint: checkpoint });
        }

        function getSelectedTypes() {
          var types = options.logTypes || [];

          if (options.logLevel) {
            types = types.concat(Object.keys(_.filter(logTypes, function (type) { return (type.level >= options.logLevel); })));
          }

          return _.uniq(types);
        }

        function getNextLimit() {
          var limit = batchSize;
          limit -= logsBatch.length;

          if (limit > 100) limit = 100;

          return limit;
        }

        stream.next(getNextLimit());

        stream.on('data', function(logs) {
          logsBatch = logsBatch.concat(logs);

          if (logs && logs.length) {
            lastLogDate = new Date(logs[logs.length - 1].date).getTime();
          }

          if (logsBatch.length < batchSize) {
            return stream.next(getNextLimit());
          }

          const handleError = function(err) {
            if (err) {
              if (!checkTime(start, options.timeLimit || 20)) {
                return processError(err, stream.status, stream.previousCheckpoint);
              }

              if (retries < maxRetries) {
                retries++;
                return options.onLogsReceived(logsBatch, handleError);
              }

              const error = [
                'Skipping logs from ' + stream.previousCheckpoint + ' to ' + stream.lastCheckpoint + ' after ' + maxRetries + ' retries.',
                err
              ];

              return processError(error, stream.status, stream.lastCheckpoint);
            }

            logsBatch = [];

            if (checkTime(start, options.timeLimit || 20)) {
              stream.batchSaved();
              stream.next(getNextLimit());
            } else {
              stream.done();
            }
          };

          options.onLogsReceived(logsBatch, handleError);
        });

        stream.on('end', function() {
          options.onLogsReceived(logsBatch, function(err) {
            if (err) {
              return processError(err, stream.status, stream.previousCheckpoint);
            }

            stream.batchSaved();
            processDone(stream.status, stream.lastCheckpoint);
          });
        });

        stream.on('error', function(err) {
          processError(err, stream.status, stream.previousCheckpoint);
        });
      })
      .catch(next);
  }
}

module.exports = Auth0Logger;
