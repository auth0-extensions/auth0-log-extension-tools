const Auth0LogStream = require('./Auth0LogStream');
const Auth0Storage = require('./Auth0Storage');

function checkOptions(options) {
  if (!options || typeof options !== 'object') {
    throw new Error('options is required');
  }

  if (!options.onLogsReceived || typeof options.onLogsReceived !== 'function') {
    throw new Error('onLogsReceived function is required');
  }
}

function checkTime(start, limit) {
  const now = new Date().getTime();
  return start + limit * 1000 >= now;
}

function Auth0Logger(client, wtStorage, options) {
  checkOptions(options);
  return function (req, res, next) {
    const storage = new Auth0Storage(wtStorage);
    const start = new Date().getTime();

    storage.getCheckpoint()
      .then((startCheckpoint) => {
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

          storage.done(status, checkpoint)
            .then(() => res.json({ status, checkpoint }))
            .catch(next);
        }

        const streamOptions = {
          checkpointId: startCheckpoint,
          take: options.batchSize || 20,
          types: options.logTypes || null
        };
        const stream = new Auth0LogStream(client, streamOptions);

        stream.next();

        stream.on('data', (logs) => {
          options.onLogsReceived(logs, (err) => {
            if (err) {
              stream.status.logsProcessed -= stream.lastBatch;
              return processError(err, stream.status, stream.previousCheckpoint);
            }

            if (checkTime(start, options.timeLimit || 20)) {
              stream.next();
            } else {
              stream.done();
            }
          });
        });

        stream.on('end', () => {
          processDone(stream.status, stream.lastCheckpoint);
        });

        stream.on('error', (err) => {
          processError(err, stream.status, stream.lastCheckpoint);
        });
      })
      .catch(next);
  }
}

module.exports = Auth0Logger;
