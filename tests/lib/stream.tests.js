const expect = require('chai').expect;
const assign = require('lodash').assign;
const tools = require('auth0-extension-tools');

const helpers = require('../helpers');
const LogsApiStream = require('../../src/stream');

const createStream = (filters) => {
  const options = {
    types: filters,
    maxRetries: 2,
    domain: 'foo.auth0.local',
    clientId: '1',
    clientSecret: 'secret',
    tokenCache: helpers.tokenCache()
  };
  return new LogsApiStream(options);
};

describe('LogsApiStream', () => {
  describe('#init', () => {
    it('should throw error if options is undefined', (done) => {
      const init = () => {
        const logger = new LogsApiStream();
      };

      expect(init).to.throw(tools.ArgumentError);
      done();
    });

    it('should initialize the stream', (done) => {
      const logger = createStream();
      expect(logger).to.be.an.instanceof(LogsApiStream);
      done();
    });
  });

  describe('#stream', () => {
    beforeEach((done) => {
      helpers.mocks.token();
      done();
    });

    it('should read logs', (done) => {
      helpers.mocks.logs();

      const logger = createStream();
      logger.on('data', (data) => {
        expect(data.logs).to.be.an('array');
        expect(data.logs.length).to.equal(100);
        expect(logger.status).to.be.an('object');
        done();
      });

      logger.next();
    });

    it('should done reading logs', (done) => {
      helpers.mocks.logs();

      const logger = createStream();
      logger.on('data', () => {
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

    it('should retry reading logs', (done) => {
      helpers.mocks.logs({ error: 'testing retry' });
      helpers.mocks.logs();

      const logger = createStream();
      logger.on('data', () => {
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
      helpers.mocks.logs();
      helpers.mocks.logs({ empty: true });

      const logger = createStream();
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
      helpers.mocks.logs({ limit: 0 });

      const logger = createStream({ types: [ 'test' ] });
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

    it('should emit errors correctly', (done) => {
      helpers.mocks.logs({ error: 'bad request', times: 3 });

      const logger = createStream({ types: [ 'test' ] });
      logger.on('data', () => logger.next());
      logger.on('error', (error) => {
        expect(error.response.text).to.equal('bad request');
        done();
      });

      logger.next();
    });
  });
});
