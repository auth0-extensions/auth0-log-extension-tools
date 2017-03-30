const Promise = require('bluebird');
const expect = require('chai').expect;

const auth0Mock = require('../helpers/mocks');
const Auth0Logger = require('../../src/processor');

const data = { checkpointId: null };

const fakeStorage = {
  read: () => new Promise(resolve => resolve(data)),
  write: obj => new Promise((resolve) => {
    data.logs = obj.logs;
    data.checkpointId = obj.checkpointId;
    data.auth0Token = obj.auth0Token;
    resolve();
  })
};

const loggerOptions = {
  onLogsReceived: (logs, cb) => setTimeout(() => cb()),
  onSuccess: () => null,
  onError: () => null,
  domain: 'foo.auth0.local',
  clientId: '1',
  clientSecret: 'secret'
};

describe('Auth0 Logger', () => {
  describe('#init', () => {
    it('should throw error if options is undefined', (done) => {
      const init = () => {
        const logger = new Auth0Logger();
      };

      expect(init).to.throw(Error, /options is required/);
      done();
    });

    it('should throw error if options.onLogsReceived is not a function', (done) => {
      const init = () => {
        const logger = new Auth0Logger(null, {});
      };

      expect(init).to.throw(Error, /onLogsReceived function is required/);
      done();
    });

    it('should throw error if auth0 options is undefined', (done) => {
      const init = () => {
        const logger = new Auth0Logger(null, { onLogsReceived: (logs, cb) => cb() });
      };

      expect(init).to.throw(Error, /domain, clientId and clientSecret are required/);
      done();
    });

    it('should init logger', (done) => {
      let logger;
      const init = () => {
        logger = new Auth0Logger(fakeStorage, loggerOptions);
      };

      expect(init).to.not.throw(Error);
      expect(logger).to.be.a('function');
      done();
    });
  });

  describe('#middleware', () => {
    before((done) => {
      auth0Mock.token();

      done();
    });

    it('should process logs and send response', (done) => {
      auth0Mock.logs({ times: 5 });

      const logger = new Auth0Logger(fakeStorage, loggerOptions);
      const response = {
        json: (result) => {
          expect(result).to.be.an('object');
          expect(result.status).to.be.an('object');
          expect(result.status.logsProcessed).to.equal(500);
          expect(result.checkpoint).to.equal('500');
          done();
        }
      };

      logger({}, response, {});
    });

    it('should process logs and done by timelimit', (done) => {
      auth0Mock.logs({ times: 2 });

      data.checkpointId = null;
      loggerOptions.onLogsReceived = (logs, cb) => setTimeout(() => cb(), 500);
      loggerOptions.timeLimit = 1;

      const logger = new Auth0Logger(fakeStorage, loggerOptions);

      const response = {
        json: (result) => {
          expect(result).to.be.an('object');
          expect(result.status).to.be.an('object');
          expect(result.status.logsProcessed).to.equal(200);
          expect(result.checkpoint).to.equal('200');
          done();
        }
      };

      logger({}, response, {});
    });

    it('should process logs and done by error', (done) => {
      auth0Mock.logs();
      auth0Mock.logs({ error: 'bad request' });

      const logger = new Auth0Logger(fakeStorage, loggerOptions);
      const response = {
        json: (result) => {
          expect(result).to.be.an('object');
          expect(result.status).to.be.an('object');
          expect(result.status.error).to.be.an.instanceof(Error, /bad request/);
          expect(result.status.logsProcessed).to.equal(100);
          expect(result.checkpoint).to.equal('300');
          done();
        }
      };

      logger({}, response, {});
    });

    it('should process logs and done with error by timeout', (done) => {
      auth0Mock.logs();

      loggerOptions.timeLimit = 1;
      loggerOptions.maxRetries = 5;
      loggerOptions.onLogsReceived = (logs, cb) => setTimeout(() => cb(new Error('ERROR')), 500);

      const logger = new Auth0Logger(fakeStorage, loggerOptions);
      const response = {
        json: (result) => {
          expect(result).to.be.an('object');
          expect(result.status).to.be.an('object');
          expect(result.status.error).to.be.an.instanceof(Error, /ERROR/);
          expect(result.status.logsProcessed).to.equal(0);
          expect(result.checkpoint).to.equal('300');
          done();
        }
      };

      logger({}, response, {});
    });

    it('should process logs and done by error in onLogsReceived', (done) => {
      auth0Mock.logs();

      loggerOptions.maxRetries = 1;
      loggerOptions.onLogsReceived = (logs, cb) => cb(new Error('ERROR'));

      const logger = new Auth0Logger(fakeStorage, loggerOptions);
      const response = {
        json: (result) => {
          expect(result).to.be.an('object');
          expect(result.status).to.be.an('object');
          expect(result.status.logsProcessed).to.equal(0);
          expect(result.status.error).to.be.an('array');
          expect(result.checkpoint).to.equal('400');
          done();
        }
      };

      logger({}, response, {});
    });

    it('should process large batch of logs', (done) => {
      auth0Mock.logs({ times: 5 });

      let logsReceivedRuns = 0;
      data.checkpointId = null;
      loggerOptions.onLogsReceived = (logs, cb) => setTimeout(() => {
        logsReceivedRuns++;
        return cb();
      });
      loggerOptions.batchSize = 500;

      const logger = new Auth0Logger(fakeStorage, loggerOptions);

      const response = {
        json: (result) => {
          expect(logsReceivedRuns).to.equal(1);
          expect(result).to.be.an('object');
          expect(result.status).to.be.an('object');
          expect(result.status.logsProcessed).to.equal(500);
          expect(result.checkpoint).to.equal('500');
          done();
        }
      };

      logger({}, response, {});
    });

    it('should add warning if logs are outdated', (done) => {
      auth0Mock.logs({ outdated: true });
      auth0Mock.logs({ empty: true });

      data.checkpointId = null;
      loggerOptions.onLogsReceived = (logs, cb) => setTimeout(() => cb());
      loggerOptions.batchSize = 100;

      const logger = new Auth0Logger(fakeStorage, loggerOptions);

      const response = {
        json: (result) => {
          expect(result).to.be.an('object');
          expect(result.status).to.be.an('object');
          expect(result.status.warning).to.be.a('string');
          expect(result.status.logsProcessed).to.equal(100);
          expect(result.checkpoint).to.equal('100');
          done();
        }
      };

      logger({}, response, {});
    });

    it('shouldn\'t write anything to storage, if no logs processed', (done) => {
      auth0Mock.logs({ empty: true });

      data.checkpointId = null;
      data.logs = [];
      loggerOptions.onLogsReceived = (logs, cb) => setTimeout(() => cb());
      loggerOptions.logLevel = 1;

      const logger = new Auth0Logger(fakeStorage, loggerOptions);

      const response = {
        json: (result) => {
          expect(data.logs.length).to.equal(0);
          expect(result).to.be.an('object');
          expect(result.status).to.be.an('object');
          expect(result.status.logsProcessed).to.equal(0);
          expect(result.checkpoint).to.equal(null);
          done();
        }
      };

      logger({}, response, {});
    });

    it('should done by error in onLogsReceived', (done) => {
      auth0Mock.logs({ empty: true });

      loggerOptions.onLogsReceived = (logs, cb) => cb(new Error('ERROR'));

      const logger = new Auth0Logger(fakeStorage, loggerOptions);
      const response = {
        json: (result) => {
          expect(result).to.be.an('object');
          expect(result.status).to.be.an('object');
          expect(result.status.logsProcessed).to.equal(0);
          expect(result.status.error).to.be.an.instanceof(Error, /ERROR/);
          expect(result.checkpoint).to.equal(null);
          done();
        }
      };

      logger({}, response, {});
    });
  });
});
