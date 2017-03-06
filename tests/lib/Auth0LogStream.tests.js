const expect = require('chai').expect;

const auth0Mock = require('../auth0');
const Auth0LogStream = require('../../src/Auth0LogStream');

const auth0Options = {
  domain: 'foo.auth0.local',
  clientId: '1',
  clientSecret: 'secret'
};

describe('Auth0 Log Stream', () => {
  describe('#init', () => {
    it('should throw error if auth0Options is undefined', (done) => {
      const init = () => {
        const logger = new Auth0LogStream();
      };

      expect(init).to.throw(Error, /auth0Options is required/);
      done();
    });

    it('should init logger', (done) => {
      const logger = new Auth0LogStream(auth0Options);

      expect(logger).to.be.an.instanceof(Auth0LogStream);
      done();
    });
  });

  describe('#stream', () => {
    before((done) => {
      auth0Mock.token();

      done();
    });

    it('should read logs', (done) => {
      auth0Mock.logs();

      const logger = new Auth0LogStream(auth0Options);

      logger.on('data', (logs) => {
        expect(logs).to.be.an('array');
        expect(logs.length).to.equal(100);
        expect(logger.status).to.be.an('object');
        done();
      });

      logger.next();
    });

    it('should done reading logs', (done) => {
      auth0Mock.logs();

      const logger = new Auth0LogStream(auth0Options);

      logger.on('data', (logs) => {
        logger.done();
      });

      logger.on('end', () => {
        logger.batchSaved();
        expect(logger.status).to.be.an('object');
        expect(logger.status.logsProcessed).to.equal(100);
        expect(logger.lastCheckpoint).to.equal('100');
        done();
      });

      logger.next();
    });

    it('should done reading logs, if no more logs can be fount', (done) => {
      auth0Mock.logs();
      auth0Mock.logs({ empty: true });

      const logger = new Auth0LogStream(auth0Options);

      logger.on('data', () => logger.next());
      logger.on('end', () => {
        logger.batchSaved();
        expect(logger.status).to.be.an('object');
        expect(logger.status.logsProcessed).to.equal(100);
        expect(logger.lastCheckpoint).to.equal('100');
        done();
      });

      logger.next();
    });

    it('should done reading logs, if ratelimit reached', (done) => {
      auth0Mock.logs({ limit: 0 });

      const logger = new Auth0LogStream(auth0Options, { types: [ 'test' ] });

      logger.on('data', () => logger.next());
      logger.on('end', () => {
        logger.batchSaved();
        expect(logger.status).to.be.an('object');
        expect(logger.status.logsProcessed).to.equal(100);
        expect(logger.status.warning).to.equal('Auth0 Management API rate limit reached.');
        expect(logger.lastCheckpoint).to.equal('100');
        done();
      });

      logger.next();
    });

    it('should emit error', (done) => {
      auth0Mock.logs({ error: 'bad request' });

      const logger = new Auth0LogStream(auth0Options, { types: [ 'test' ] });

      logger.on('data', () => logger.next());
      logger.on('error', (error) => {
        expect(error.response.text).to.equal('bad request');
        done();
      });

      logger.next();
    });
  });
});
