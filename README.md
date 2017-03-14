# auth0-log-extension-tools

## Usage 
`const Auth0Logger = require('auth0-log-extension-tools').Auth0Logger;`

``

````
const options = {
  domain: config('AUTH0_DOMAIN'),
  clientId: config('AUTH0_CLIENT_ID'),
  clientSecret: config('AUTH0_CLIENT_SECRET'),
  batchSize: config('BATCH_SIZE'),
  startFrom: config('START_FROM'),
  logTypes: config('LOG_TYPES'),
  logLevel: config('LOG_LEVEL'),
  onLogsReceived: onLogsReceived,
  onSuccess: onSuccess,
  onError: onError
};

function onLogsReceived (logs, cb) {
  sendLogsSomewhere(function(err, result) {
    if (err) {
      return cb(err);
    }
    
    cb();
  });
}

function onSuccess (status, checkpointId) {
  // do something with success message
}

function onError (status, checkpointId) {
  // do something with error message
}

const logger = Auth0Logger(storage, options);

logger(req, res, next);
````

Storage is webtask storage object with `read` and `write` methods.
Possible options:
- `domain` - auth0 domain, required
- `clientId` - auth0 client id, required
- `clientSecret` - auth0 client secret, required
- `onLogsReceived` - function (logs, callback), executes when full batch is received from auth0, required
- `batchSize` - size of logs batch, 100 by default
- `maxRetries` - describe how many times to retry sending logs, 5 by default
- `timeLimit` - describes in which time session should be completed, 20 seconds by default
- `startFrom` - auth0 log id to start from, optional
- `logTypes` - array of log types, that you want to process, optional
- `logLevel` - level of logs, that you want to process, optional
- `onError` - function (status, lastCheckpoint), executes in case of error, optional
- `onSuccess` - function (status, lastCheckpoint), executes in case of success, optional
