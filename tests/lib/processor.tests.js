const Promise = require('bluebird');
const expect = require('chai').expect;
const tools = require('auth0-extension-tools');

const helpers = require('../helpers');
const LogsProcessor = require('../../src/processor');
const webtaskStorage = require('../helpers/webtaskStorage');

const createProcessor = (data) => {
  const options = {
    domain: 'foo.auth0.local',
    clientId: '1',
    clientSecret: 'secret'
  };

  const storage = webtaskStorage(data);
  return new LogsProcessor(webtaskStorage.context(storage), options);
};

describe('LogsProcessor', () => {
  describe('#init', () => {
    it.only('should throw error if the storageContext is undefined', (done) => {
      const init = () => {
        const processor = new LogsProcessor();
      };

      expect(init).to.throw(tools.ArgumentError);
      done();
    });

    it.only('should throw error if the options are undefined', (done) => {
      const init = () => {
        const processor = new LogsProcessor({ });
      };

      expect(init).to.throw(tools.ArgumentError);
      done();
    });

    it.only('should init logger', (done) => {
      let logger;
      const init = () => {
        logger = createProcessor();
      };

      expect(init).to.not.throw(Error);
      expect(logger).to.be.an.instanceof(LogsProcessor);
      done();
    });
  });

  describe('#run', () => {
    beforeEach((done) => {
      helpers.mocks.token();
      done();
    });

    it.only('should process logs and send response', (done) => {
      helpers.mocks.logs({ times: 5 });

      const processor = createProcessor();
      processor.run((logs, cb) => setTimeout(() => cb()))
        .then((result) => {
          expect(result).to.be.an('object');
          expect(result.status).to.be.an('object');
          expect(result.status.logsProcessed).to.equal(500);
          expect(result.checkpoint).to.equal('500');
          done();
        });
    });

    it('should process logs and done by timelimit', (done) => {
      helpers.mocks.logs({ times: 2 });

      data.checkpointId = null;
      loggerOptions.onLogsReceived = (logs, cb) => setTimeout(() => cb(), 500);
      loggerOptions.timeLimit = 1;

      const processor = createProcessor();
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
      helpers.mocks.logs();
      helpers.mocks.logs({ error: 'bad request' });

      const processor = createProcessor();
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
      helpers.mocks.logs();

      loggerOptions.timeLimit = 1;
      loggerOptions.maxRetries = 5;
      loggerOptions.onLogsReceived = (logs, cb) => setTimeout(() => cb(new Error('ERROR')), 500);

      const processor = createProcessor();
      processor.run((logs, cb) => cb(new Error('ERROR')))
        .catch((err) => {
          expect(err).to.be.an.instanceof(Error, /ERROR/);
          expect(result).to.be.an('object');
          expect(result.status).to.be.an('object');
          expect(result.status.error).to.be.an.instanceof(Error, /ERROR/);
          expect(result.status.logsProcessed).to.equal(0);
          expect(result.checkpoint).to.equal('300');
          done();
        });
    });

    it('should process logs and done by error in onLogsReceived', (done) => {
      helpers.mocks.logs();

      loggerOptions.maxRetries = 1;
      loggerOptions.onLogsReceived = (logs, cb) => cb(new Error('ERROR'));

      const processor = createProcessor();
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
      helpers.mocks.logs({ times: 5 });

      let logsReceivedRuns = 0;
      data.checkpointId = null;
      loggerOptions.onLogsReceived = (logs, cb) => setTimeout(() => {
        logsReceivedRuns++;
        return cb();
      });
      loggerOptions.batchSize = 500;

      const processor = createProcessor();
      processor.run((logs, cb) => setTimeout(() => cb()))
        .then((result) => {
          expect(logsReceivedRuns).to.equal(1);
          expect(result).to.be.an('object');
          expect(result.status).to.be.an('object');
          expect(result.status.logsProcessed).to.equal(500);
          expect(result.checkpoint).to.equal('500');
          done();
        });
    });

    it('should add warning if logs are outdated', (done) => {
      helpers.mocks.logs({ outdated: true });
      helpers.mocks.logs({ empty: true });

      data.checkpointId = null;
      loggerOptions.onLogsReceived = (logs, cb) => setTimeout(() => cb());
      loggerOptions.batchSize = 100;

      const processor = createProcessor();
      processor.run((logs, cb) => setTimeout(() => cb()))
        .then((result) => {
          expect(data.logs.length).to.equal(0);
          expect(result).to.be.an('object');
          expect(result.status).to.be.an('object');
          expect(result.status.warning).to.be.a('string');
          expect(result.status.logsProcessed).to.equal(100);
          expect(result.checkpoint).to.equal('100');
          done();
        });
    });

    it('shouldn\'t write anything to storage, if no logs processed', (done) => {
      auth0Mock.logs({ empty: true });

      data.checkpointId = null;
      data.logs = [];
      loggerOptions.onLogsReceived = (logs, cb) => setTimeout(() => cb());
      loggerOptions.logLevel = 1;

      const processor = createProcessor();
      processor.run((logs, cb) => setTimeout(() => cb()))
        .then((result) => {
          expect(data.logs.length).to.equal(0);
          expect(result).to.be.an('object');
          expect(result.status).to.be.an('object');
          expect(result.status.logsProcessed).to.equal(0);
          expect(result.checkpoint).to.equal(null);
          done();
        });
    });

    it('should done by error in onLogsReceived', (done) => {
      helpers.mocks.logs({ empty: true });

      loggerOptions.onLogsReceived = (logs, cb) => cb(new Error('ERROR'));

      const processor = createProcessor();
      processor.run((logs, cb) => cb(new Error('ERROR')))
        .catch((err) => {
          expect(err).to.be.an.instanceof(Error, /ERROR/);
          done();
        });
    });
  });
});
