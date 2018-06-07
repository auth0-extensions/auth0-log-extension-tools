const Promise = require('bluebird');
const request = require('superagent');
const querystring = require('querystring');
const tools = require('auth0-extension-tools');

function LogsApiClient(options) {
  if (options === null || options === undefined) {
    throw new tools.ArgumentError('Must provide an options object');
  }

  if (options.domain === null || options.domain === undefined) {
    throw new tools.ArgumentError('Must provide a valid domain');
  }

  if (typeof options.domain !== 'string' || options.domain.length === 0) {
    throw new tools.ArgumentError('The provided domain is invalid: ' + options.domain);
  }

  if (options.clientId === null || options.clientId === undefined) {
    throw new tools.ArgumentError('Must provide a valid clientId');
  }

  if (typeof options.clientId !== 'string' || options.clientId.length === 0) {
    throw new tools.ArgumentError('The provided clientId is invalid: ' + options.clientId);
  }

  if (options.clientSecret === null || options.clientSecret === undefined) {
    throw new tools.ArgumentError('Must provide a valid clientSecret');
  }

  if (typeof options.clientSecret !== 'string' || options.clientSecret.length === 0) {
    throw new tools.ArgumentError('The provided clientSecret is invalid: ' + options.clientSecret);
  }

  this.options = options;
  this.tokenCache = options.tokenCache || {
    getToken: function() {
      return Promise.resolve();
    },
    setToken: function() {
      return Promise.resolve();
    }
  };
}

LogsApiClient.prototype.getAccessToken = function() {
  var self = this;
  return new Promise(function(resolve, reject) {
    request
      .post('https://' + self.options.domain + '/oauth/token')
      .send({
        audience: 'https://' + self.options.domain + '/api/v2/',
        client_id: self.options.clientId,
        client_secret: self.options.clientSecret,
        grant_type: 'client_credentials'
      })
      .set('Accept', 'application/json')
      .end(function(err, res) {
        if (err && err.status === 401) {
          return reject(
            new tools.ManagementApiError(
              'unauthorized',
              'Invalid credentials for ' + self.options.clientId,
              err.status
            )
          );
        } else if (err && res && res.body && res.body.error) {
          return reject(
            new tools.ManagementApiError(
              res.body.error,
              res.body.error_description || res.body.error,
              err.status
            )
          );
        } else if (err) {
          return reject(err);
        }

        if (!res.ok || !res.body.access_token) {
          return reject(
            new tools.ManagementApiError(
              'unknown_error',
              'Unknown error from Management API or no access_token was provided: ' +
                (res.text || res.status)
            )
          );
        }

        const expiresAt = new Date();
        return resolve({
          token: res.body.access_token,
          expiresAt: expiresAt.setSeconds(expiresAt.getSeconds() + res.body.expires_in)
        });
      });
  });
};

LogsApiClient.prototype.getAccessTokenCached = function() {
  var self = this;
  return self.tokenCache.getToken()
    .then(function(cached) {
      if (cached && cached.token) {
        const now = new Date().valueOf();
        if (cached.expiresAt - now > 10000) {
          return cached;
        }
      }

      return self.getAccessToken(self.options)
        .then(function(res) {
          return self.tokenCache.setToken(res)
            .then(function() {
              return res;
            });
        });
    });
};

LogsApiClient.prototype.getLogs = function(params) {
  const self = this;
  return new Promise(function(resolve, reject) {
    self.getAccessTokenCached(self.options, self.storage)
      .then(function(data) {
        const jitter = Math.floor(Math.random() * 150000);
        setTimeout(function() {
          const query = querystring.stringify(params);
          request
            .get('https://' + self.options.domain + '/api/v2/logs?' + query)
            .set('Authorization', 'Bearer ' + data.token)
            .set('Content-Type', 'application/json')
            .end(function(err, res) {
              if (err && err.status === 403) {
                const returnError = function() {
                  return reject(
                    new tools.ManagementApiError(
                      res.body.error,
                      res.body.error_description || res.body.error,
                      err.status
                    )
                  );
                };

                // Clear the cached token.
                self.tokenCache.setToken(null)
                  .then(returnError)
                  .catch(returnError);
              }

              if (err && res && res.body && res.body.error) {
                return reject(
                  new tools.ManagementApiError(
                    res.body.error,
                    res.body.error_description || res.body.error,
                    err.status
                  )
                );
              }

              if (err) {
                return reject(err);
              }

              if (!res.ok) {
                return reject(
                  new tools.ManagementApiError(
                    'unknown_error',
                    'Unknown error from Management API: ' +
                      (res.text || res.status)
                  )
                );
              }

              return resolve({
                logs: res.body,
                limits: {
                  limit: res.headers['x-ratelimit-limit'],
                  remaining: res.headers['x-ratelimit-remaining'],
                  reset: res.headers['x-ratelimit-reset']
                }
              });
            });
        }, jitter);
      });
  });
};

module.exports = LogsApiClient;
