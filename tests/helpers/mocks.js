const nock = require('nock');
const querystring = require('querystring');

module.exports.token = () => nock('https://foo.auth0.local')
    .post('/oauth/token')
    .reply(200, { expires_in: 2000, access_token: 'token', id_token: 'id_token', ok: true });

module.exports.logs = (options = {}, callback) =>
   nock('https://foo.auth0.local', {
     reqheaders: {
       Authorization: 'Bearer token'
     }
   })
  .get('/api/v2/logs')
  .query(() => true)
  .times(options.times || 1)
  .reply(function(uri, requestBody) {
    if (options.error) {
      return [ 400, options.error ];
    }

    if (options.empty) {
      return [ 200, [] ];
    }

    const query = querystring.parse(uri);
    const logs = [];
    const from = (query.from) ? parseInt(query.from) : 0;
    const take = (query.take) ? parseInt(query.take) : 100;
    const logTypes = (query.q) ? query.q.replace(/type:/g, '').split(' OR ') : null;

    if (callback) {
      callback({
        from,
        take,
        logTypes
      });
    }

    for (let i = from + 1; i <= from + take; i++) {
      if (i <= 500 && (!logTypes || logTypes.indexOf(options.type) >= 0)) {
        logs.push({ _id: '' + i, date: (options.outdated) ? new Date('1999-10-10') : new Date(), type: options.type });
      }
    }

    return [
      200,
      logs,
      {
        'x-ratelimit-limit': 50,
        'x-ratelimit-remaining': (typeof options.limit === 'undefined') ? 49 : options.limit,
        'x-ratelimit-reset': 0
      }
    ];
  });

module.exports.slack = () =>
  nock('https://slack.local')
    .post('/')
    .reply(204);

module.exports.clear = () =>
  nock.cleanAll();
