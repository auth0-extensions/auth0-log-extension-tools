const nock = require('nock');
const expect = require('chai').expect;
const tools = require('auth0-extension-tools');

const LogsApiClient = require('../../src/client');

const tokenCache = () => {
  var cached = null;
  return {
    getToken: function() {
      return Promise.resolve(cached);
    },
    setToken: function(token) {
      cached = token;
      return Promise.resolve();
    }
  };
};

describe.only('LogsApiClient', () => {
  describe('#init', () => {
    it('should throw error if options is undefined', (done) => {
      const init = () => {
        const client = new LogsApiClient();
      };

      expect(init).to.throw(tools.ArgumentError, /Must provide an options object/);
      done();
    });
    it('should validate options', (done) => {
      try {
        const client = new LogsApiClient();
      } catch (err) {
        expect(err).to.be.an.instanceof(tools.ArgumentError);
      }

      try {
        const client = new LogsApiClient({ });
      } catch (err) {
        expect(err).to.be.an.instanceof(tools.ArgumentError);
      }

      try {
        const client = new LogsApiClient({ domain: 1 });
      } catch (err) {
        expect(err).to.be.an.instanceof(tools.ArgumentError);
      }

      try {
        const client = new LogsApiClient({ domain: 'foo' });
      } catch (err) {
        expect(err).to.be.an.instanceof(tools.ArgumentError);
      }

      try {
        const client = new LogsApiClient({ domain: 'foo', clientId: 123 });
      } catch (err) {
        expect(err).to.be.an.instanceof(tools.ArgumentError);
      }

      try {
        const client = new LogsApiClient({ domain: 'foo', clientId: 'abc' });
      } catch (err) {
        expect(err).to.be.an.instanceof(tools.ArgumentError);
      }

      try {
        const client = new LogsApiClient({ domain: 'foo', clientId: 'abc', clientSecret: 456 });
      } catch (err) {
        expect(err).to.be.an.instanceof(tools.ArgumentError);
      }

      done();
    });
  });

  describe('#getAccessToken', () => {
    it('should handle network errors correctly', (done) => {
      const client = new LogsApiClient({
        domain: 'foo.some.domain.tld',
        clientId: 'myclient',
        clientSecret: 'mysecret'
      });
      client.getAccessToken().catch(function(err) {
        expect(err.code).to.equal('ENOTFOUND');
        done();
      });
    });

    it('should handle unauthorized errors correctly', (done) => {
      nock('https://tenant.auth0cluster.com')
        .post('/oauth/token')
        .reply(401, 'Unauthorized');

      const client = new LogsApiClient({
        domain: 'tenant.auth0cluster.com',
        clientId: 'myclient',
        clientSecret: 'mysecret'
      });
      client.getAccessToken().catch(function(err) {
        expect(err.code).to.equal('unauthorized');
        expect(err).to.be.an.instanceof(tools.ManagementApiError);
        nock.cleanAll();
        done();
      });
    });

    it('should handle unknown errors correctly', (done) => {
      nock('https://tenant.auth0cluster.com')
        .post('/oauth/token')
        .reply(200, 'foo');

      const client = new LogsApiClient({
        domain: 'tenant.auth0cluster.com',
        clientId: 'myclient',
        clientSecret: 'mysecret'
      });
      client.getAccessToken().catch(function(err) {
        expect(err.code).to.equal('unknown_error');
        expect(err).to.be.an.instanceof(tools.ManagementApiError);
        nock.cleanAll();
        done();
      });
    });

    it('should handle forbidden errors correctly', (done) => {
      nock('https://tenant.auth0cluster.com')
        .post('/oauth/token')
        .reply(403, {
          error: 'access_denied',
          error_description: 'Client is not authorized to access .... You might probably want to create a .. associated to this API.'
        });

      const client = new LogsApiClient({
        domain: 'tenant.auth0cluster.com',
        clientId: 'myclient',
        clientSecret: 'mysecret'
      });
      client.getAccessToken().catch(function(err) {
        expect(err.code).to.equal('access_denied');
        expect(err).to.be.an.instanceof(tools.ManagementApiError);
        nock.cleanAll();
        done();
      });
    });

    it('should return access token', (done) => {
      nock('https://tenant.auth0cluster.com')
        .post('/oauth/token')
        .reply(200, {
          access_token: 'abc',
          expires_in: 200
        });

      const client = new LogsApiClient({
        domain: 'tenant.auth0cluster.com',
        clientId: 'myclient',
        clientSecret: 'mysecret'
      });
      client.getAccessToken()
        .then(function(res) {
          expect(res.token).to.equal('abc');
          expect(res.expiresAt).to.be.an.number;
          done();
        });
    });
  });

  describe('#getAccessTokenCached', () => {
    it('should cache the access token', (done) => {
      nock('https://tenant.auth0cluster.com')
        .post('/oauth/token')
        .reply(200, {
          access_token: 'abc',
          expires_in: 200000
        });

      const client = new LogsApiClient({
        domain: 'tenant.auth0cluster.com',
        clientId: 'myclient',
        clientSecret: 'mysecret',
        tokenCache: tokenCache()
      });
      client.getAccessTokenCached()
        .then(function(data) {
          expect(data.token).to.equal('abc');

          client.getAccessTokenCached()
            .then(function(data2) {
              expect(data2.token).to.equal('abc');
              nock.cleanAll();
              done();
            });
        });
    });

    it('should handle errors correctly', (done) => {
      nock('https://tenant.auth0cluster.com')
        .post('/oauth/token')
        .reply(400, {
          error: 'foo'
        });

      const client = new LogsApiClient({
        domain: 'tenant.auth0cluster.com',
        clientId: 'myclient',
        clientSecret: 'mysecret',
        tokenCache: tokenCache()
      });
      client.getAccessTokenCached()
        .catch(function(err) {
          expect(err.code).to.equal('foo');

          nock('https://tenant.auth0cluster.com')
            .post('/oauth/token')
            .reply(200, {
              access_token: 'abc'
            });

          client.getAccessTokenCached()
            .then(function(data) {
              expect(data.token).to.equal('abc');
              done();
            });
        });
    });

    it('should cache the access token based on its expiration', (done) => {
      nock('https://tenant.auth0cluster.com')
        .post('/oauth/token')
        .reply(200, {
          access_token: 'abc',
          expires_in: 2
        });

      const client = new LogsApiClient({
        domain: 'tenant.auth0cluster.com',
        clientId: 'myclient',
        clientSecret: 'mysecret',
        tokenCache: tokenCache()
      });
      client.getAccessTokenCached()
        .then(function(data) {
          expect(data.token).to.equal('abc');


          setTimeout(function() {
            nock('https://tenant.auth0cluster.com')
              .post('/oauth/token')
              .reply(200, {
                access_token: 'def',
                expires_in: 2
              });
            client.getAccessTokenCached()
              .then(function(data2) {
                expect(data2.token).to.equal('def');
                done();
              });
          }, 2500);
        });
    }).timeout(3000);
  });
});
