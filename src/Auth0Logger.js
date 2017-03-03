const _ = require('lodash');

const Auth0LogStream = require('./Auth0LogStream');
const Auth0Storage = require('./Auth0Storage');
const logTypes = require('./logTypes');

function checkOptions(options) {
  if (!options || typeof options !== 'object') {
    throw new Error('options is required');
  }

  if (!options.domain || !options.clientId || !options.clientSecret) {
    throw new Error('domain, clientId and clientSecret are required');
  }

  if (!options.onLogsReceived || typeof options.onLogsReceived !== 'function') {
    throw new Error('onLogsReceived function is required');
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

    storage.getCheckpoint(options.startFrom)
      .then((startCheckpoint) => {
        const streamOptions = {
          checkpointId: startCheckpoint,
          types: getSelectedTypes()
        };

        const auth0Options = {
          domain: options.domain,
          clientId: options.clientId,
          clientSecret: options.clientSecret
        };

        const stream = new Auth0LogStream(auth0Options, streamOptions);
        let logsBatch = [];
        let lastLogDate = 0;

        function processError(error, status, checkpoint) {
          status.error = error;

          if (options.onError) {
            options.onError(status, checkpoint);
          }

          storage.done(status, checkpoint)
            .then(() => res.json({ status, checkpoint }))
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
              status.warning = 'Logs are outdated more than for week. Last processed log has date is ' + logsBatch[logsBatch.length - 1].date;
            }

            return storage.done(status, checkpoint)
              .then(() => res.json({ status, checkpoint }))
              .catch(next);
          }

          return res.json({ status, checkpoint });
        }

        function getSelectedTypes() {
          let types = options.logTypes || [];

          if (options.logLevel) {
            types = types.concat(Object.keys(_.filter(logTypes, (type) => (type.level >= options.logLevel))));
          }

          return _.uniq(types);
        }

        function getNextLimit() {
          let limit = batchSize;
          limit -= logsBatch.length;

          if (limit > 100) limit = 100;

          return limit;
        }

        stream.next(getNextLimit());

        stream.on('data', (logs) => {
          logsBatch = logsBatch.concat(logs);

          if (logs && logs.length) {
            lastLogDate = new Date(logs[logs.length - 1].date).getTime();
          }

          if (logsBatch.length < batchSize) {
            return stream.next(getNextLimit());
          }

          options.onLogsReceived(logsBatch, (err) => {
            if (err) {
              stream.status.logsProcessed -= logsBatch.length;
              return processError(err, stream.status, stream.previousCheckpoint);
            }

            logsBatch = [];

            if (checkTime(start, options.timeLimit || 20)) {
              stream.batchSaved();
              stream.next(getNextLimit());
            } else {
              stream.done();
            }
          });
        });

        stream.on('end', () => {
          options.onLogsReceived(logsBatch, (err) => {
            if (err) {
              stream.status.logsProcessed -= logsBatch.length;
              return processError(err, stream.status, stream.previousCheckpoint);
            }

            stream.batchSaved();
            processDone(stream.status, stream.lastCheckpoint);
          });
        });

        stream.on('error', (err) => {
          processError(err, stream.status, stream.previousCheckpoint);
        });
      })
      .catch(next);
  }
}

module.exports = Auth0Logger;
