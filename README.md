# auth0-log-extension-tools

## Logs API Client

The API client is a low level client allowing you to fetch logs from the Auth0 Management API. This client will get an access_token from the Management API and cache it in memory for as long as it is valid.

```js
const client = new LogsApiClient({
  domain: config('AUTH0_DOMAIN'),
  clientId: config('AUTH0_CLIENT_ID'),
  clientSecret: config('AUTH0_CLIENT_SECRET'),
  tokenCache: myTokenCache,
  apiFiltering: config('AUTH0_RTA').replace('https://', '') === 'auth0.auth0.com'
});

client.getLogs(query)
  .then(data => {
    // data.logs contains an array of logs.
    // data.limits contains the rate limit details for this request.
  });
```

A custom token cache provider can be supplied to persist the token somewhere (instead of in memory):

```js
{
  getToken: function() {
    return Promise.resolve('my token');
  },
  setToken: function(token) {
    // Save the token somewhere
    return Promise.resolve();
  }
}
```

## Logs API Stream

The stream client is a wrapper around the API client and allows you to fetch all logs from a specific point (the checkpoint ID).

```js
const stream = new LogsApiStream({
  domain: config('AUTH0_DOMAIN'),
  clientId: config('AUTH0_CLIENT_ID'),
  clientSecret: config('AUTH0_CLIENT_SECRET'),
  tokenCache: myTokenCache,
  checkpointId: startCheckpoint,
  types: [ 'ss', 'fn' ],
  apiFiltering: true
});

// Get the first batch of 50 items.
stream.next(50);

// Process batch of logs.
stream.on('data', function(data) {
  // data.logs contains an array of logs.
  // data.limits contains the rate limit details for this request.

  // You can now ask for the next batch.
  stream.next(50);

  // Or you can also stop the stream.
  stream.done();
});

// We've reached the end of the stream OR rate limiting kicked in.
stream.on('end', function() {

});

// An error occured when processing the stream.
stream.on('error', function(err) {
  console.log(err);
});
```

## Logs Processor

The logs processor will orchestrate everything to make log shipping and processing much easier. It will handle retries, timeouts etc..

 - `batchSize`: Size of the batch we'll make available in the handler
 - `maxRetries`: How many times the batch should be retried (the send part) before discarding the logs
 - `maxRunTimeSeconds`: How long the processor is allowed to run
 - `startFrom`: The Auth0 Log identifier to start from
 - `logTypes`: An array of log types to filter on
 - `logLevel`: The log level to filter on (0 = debug, 1 = info, 2 = warning, 3 = error, 4 = critical)

```js
const processor = new LogsProcessor(storageContext, {
  domain: config('AUTH0_DOMAIN'),
  clientId: config('AUTH0_CLIENT_ID'),
  clientSecret: config('AUTH0_CLIENT_SECRET'),
  batchSize: config('BATCH_SIZE'),
  startFrom: config('START_FROM'),
  logTypes: [ 'ss', 'fn' ],
  logLevel: config('LOG_LEVEL')
});

processor
  .run((logs, cb) => {
    sendLogsSomewhere(function(err, result) {
      if (err) {
        return cb(err);
      }

      cb();
    });
  })
  .then(status => console.log(status))
  .catch(err => console.log(err));
```
