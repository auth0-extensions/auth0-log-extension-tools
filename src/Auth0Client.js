const jwt = require('jsonwebtoken');
const Promise = require('bluebird');
const request = require('superagent');
const memoizer = require('lru-memoizer');
const querystring = require('querystring');

const getAccessToken = function (options) {
  return new Promise((resolve, reject) => {
    request
      .post(`https://${options.domain}/oauth/token`)
      .send({
        audience: `https://${options.domain}/api/v2/`,
        client_id: options.clientId,
        client_secret: options.clientSecret,
        grant_type: 'client_credentials'
      })
      .set('Accept', 'application/json')
      .end((err, res) => {
        if (err) {
          return reject(err);
        }

        if (!res.ok || !res.body.access_token) {
          return reject(new Error(`Unknown error from Management Api or no access token was provided: ${res.text || res.status}`));
        }

        return resolve(res.body.access_token);
      });
  });
};

const getAccessTokenCached = Promise.promisify(
  memoizer({
      load(options, callback) {
        getAccessToken(options)
          .then(accessToken => callback(null, accessToken))
          .catch(err => callback(err));
      },
      hash(domain, clientId, clientSecret) {
        return `${domain}-${clientId}-${clientSecret}`;
      },
      itemMaxAge(domain, clientId, clientSecret, accessToken) {
        try {
          const decodedToken = jwt.decode(accessToken);
          const expiresIn = new Date(0);
          expiresIn.setUTCSeconds(decodedToken.exp);
          const now = new Date().valueOf();
          return (expiresIn.valueOf() - now) - 10000;
        } catch (e) {
          return 1000;
        }
      },
      max: 100,
      maxAge: 60 * 60000
    }
  ));

function Auth0Client(options) {
  if (!options || !options.domain || !options.clientId || !options.clientSecret) {
    throw new Error('domain, clientId and clientSecret are required');
  }

  this.options = options;
}

Auth0Client.prototype.getLogs = function (params) {
  return new Promise((resolve, reject) =>
    getAccessTokenCached(this.options)
      .then((token) => {
        const query = querystring.stringify(params);

        request
          .get(`https://${this.options.domain}/api/v2/logs?${query}`)
          .set('Authorization', `Bearer ${token}`)
          .set('Content-Type', 'application/json')
          .end((err, res) => {
            if (err) {
              return reject(err);
            }

            const limits = {
              limit: res.headers['x-ratelimit-limit'],
              remaining: res.headers['x-ratelimit-remaining'],
              reset: res.headers['x-ratelimit-reset']
            };

            return resolve({ logs: res.body, limits });
          });
      }));
};

module.exports = Auth0Client;
