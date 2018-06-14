'use strict';

const _ = require('lodash');
const Promise = require('bluebird');

const expect = require('chai').expect;
const tools = require('auth0-extension-tools');

const helpers = require('../helpers');
const LogsProcessor = require('../../src/processor');
const webtaskStorage = require('../helpers/webtaskStorage');

const createProcessor = (data, settings, storage) => {
  const options = _.assign({ },
    {
      domain: 'foo.auth0.local',
      clientId: '1',
      clientSecret: 'secret',
      maxRunTimeSeconds: 1
    },
    settings
  );

  storage = storage || webtaskStorage(data);
  return new LogsProcessor(webtaskStorage.context(storage), options);
};

describe('LogsProcessor', () => {
  describe('#init', () => {
    it('should throw error if the storageContext is undefined', (done) => {
      const init = () => new LogsProcessor();

      expect(init).to.throw(tools.ArgumentError);
      done();
    });

    it('should throw error if the options are undefined', (done) => {
      const init = () => new LogsProcessor({});

      expect(init).to.throw(tools.ArgumentError);
      done();
    });

    it('should init logger', (done) => {
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

    afterEach(() => {
      helpers.mocks.cleanAll();
    });

    it('should process logs and send response', () => {
      helpers.mocks.logs({ times: 6 });

      const processor = createProcessor();
      return processor.run((logs, cb) => setTimeout(() => cb()))
        .then((result) => {
          expect(result).to.be.an('object');
          expect(result.status).to.be.an('object');
          expect(result.status.logsProcessed).to.equal(500);
          expect(result.checkpoint).to.equal('500');
        });
    });

    it('should process logs and done by timelimit', () => {
      helpers.mocks.logs({ times: 2 });

      const processor = createProcessor();
      return processor.run((logs, cb) => setTimeout(() => cb(), 450))
        .then((result) => {
          expect(result).to.be.an('object');
          expect(result.status).to.be.an('object');
          expect(result.status.logsProcessed).to.equal(200);
          expect(result.checkpoint).to.equal('200');
        });
    });

    it('should process logs and done by error', () => {
      helpers.mocks.logs();
      helpers.mocks.logs({ error: 'bad request' });

      const processor = createProcessor();
      return processor.run((logs, cb) => setTimeout(() => cb()))
        .then((result) => {
          expect(result).to.be.an('object');
          expect(result.status).to.be.an('object');
          expect(result.status.error).to.be.instanceof(Error, /bad request/);
          expect(result.status.logsProcessed).to.equal(100);
          expect(result.checkpoint).to.equal('100');
        });
    });

    it('should process logs and done with error by timeout', () => {
      helpers.mocks.logs();

      const processor = createProcessor();
      return processor.run((logs, cb) => setTimeout(() => cb(new Error('ERROR')), 500))
        .then((result) => {
          expect(result).to.be.an('object');
          expect(result.status).to.be.an('object');
          expect(result.status.error).to.be.an.instanceof(Error, /ERROR/);
          expect(result.status.logsProcessed).to.equal(0);
          expect(result.checkpoint).to.equal(null);
        });
    });

    it('should process logs and done by error in onLogsReceived', () => {
      helpers.mocks.logs();

      const processor = createProcessor();
      return processor.run((logs, cb) => cb(new Error('ERROR')))
        .then((result) => {
          expect(result).to.be.an('object');
          expect(result.status).to.be.an('object');
          expect(result.status.error.length).to.be.equal(2);
          expect(result.status.error[0]).to.be.an.instanceof(Error, /ERROR/);
          expect(result.status.logsProcessed).to.equal(0);
          expect(result.checkpoint).to.equal('100');
        });
    });

    it('should process large batch of logs', () => {
      helpers.mocks.logs({ times: 6 });

      let logsReceivedRuns = 0;
      const onLogsReceived = (logs, cb) => setTimeout(() => {
        logsReceivedRuns += 1;
        return cb();
      });

      const processor = createProcessor(null, { batchSize: 1000 });
      return processor.run(onLogsReceived)
        .then((result) => {
          expect(logsReceivedRuns).to.equal(1);
          expect(result).to.be.an('object');
          expect(result.status).to.be.an('object');
          expect(result.status.logsProcessed).to.equal(500);
          expect(result.checkpoint).to.equal('500');
        });
    });

    it('should add warning if logs are outdated', () => {
      helpers.mocks.logs({ outdated: true });
      helpers.mocks.logs({ empty: true });

      const processor = createProcessor();
      return processor.run((logs, cb) => setTimeout(() => cb()))
        .then((result) => {
          expect(result).to.be.an('object');
          expect(result.status).to.be.an('object');
          expect(result.status.warning).to.be.a('string');
          expect(result.status.logsProcessed).to.equal(100);
          expect(result.checkpoint).to.equal('100');
        });
    });

    it('shouldn\'t write anything to storage, if no logs processed', () => {
      helpers.mocks.logs({ empty: true });

      const processor = createProcessor();
      return processor.run((logs, cb) => setTimeout(() => cb()))
        .then((result) => {
          expect(result).to.be.an('object');
          expect(result.status).to.be.an('object');
          expect(result.status.logsProcessed).to.equal(0);
          expect(result.checkpoint).to.equal(null);
        });
    });

    it('should done by error in onLogsReceived', () => {
      helpers.mocks.logs({ empty: true });

      const processor = createProcessor();
      return processor.run((logs, cb) => cb(new Error('ERROR')))
        .then((result) => {
          expect(result).to.be.an('object');
          expect(result.status).to.be.an('object');
          expect(result.status.logsProcessed).to.equal(0);
          expect(result.checkpoint).to.equal(null);
        });
    });

    it('should work with logTypes', () => {
      helpers.mocks.logs({ times: 1, type: 's' });
      helpers.mocks.logs({ times: 1, type: 'ss' });
      helpers.mocks.logs({ times: 4, type: 'ssa' });

      const processor = createProcessor(null, { logTypes: [ 's', 'ss' ] });
      return processor.run((logs, cb) => cb())
        .then((result) => {
          expect(result).to.be.an('object');
          expect(result.status).to.be.an('object');
          expect(result.status.logsProcessed).to.equal(200);
          expect(result.checkpoint).to.equal('500');
        });
    });

    it('should work with logLevel', () => {
      helpers.mocks.logs({ times: 3, type: 'fcpro' });
      helpers.mocks.logs({ times: 3, type: 'ssa' });

      const processor = createProcessor(null, { logLevel: 4 });
      return processor.run((logs, cb) => cb())
        .then((result) => {
          expect(result).to.be.an('object');
          expect(result.status).to.be.an('object');
          expect(result.status.logsProcessed).to.equal(300);
          expect(result.checkpoint).to.equal('500');
        });
    });

    it('should make second logs API call if it will complete before maxRunTimeSeconds', () => {
      helpers.mocks.logs({delay: 300});
      helpers.mocks.logs({delay: 300});

      const processor = createProcessor();
      return processor.run((logs, cb) => setTimeout(() => cb()))
        .then((result) => {
          expect(result.status.logsProcessed).to.equal(200);
          expect(result.checkpoint).to.equal('200');
        });
    });

    it('should not make second logs API call if it will not complete before maxRunTimeSeconds', () => {
      helpers.mocks.logs({delay: 550});
      helpers.mocks.logs({delay: 550});

      const processor = createProcessor();
      return processor.run((logs, cb) => setTimeout(() => cb()))
        .then((result) => {
          expect(result.status.logsProcessed).to.equal(100);
          expect(result.checkpoint).to.equal('100');
        });
    });

    it('should return report', () => {
      const data = {
        logs: [
          {
            start: '2017-05-11T10:11:20.994Z',
            end: null,
            logsProcessed: 100,
            checkpoint: 'should-not-be-included-first'
          },
          {
            start: '2017-05-11T10:21:20.994Z',
            end: null,
            logsProcessed: 10,
            error: 1,
            checkpoint: '49570627966157796216769521870780578157584973688708530226'
          },
          {
            start: '2017-05-11T10:32:41.220Z',
            end: '2017-05-11T10:33:07.867Z',
            logsProcessed: 20,
            warning: 1,
            checkpoint: '49570627966157796216769522202815681292201819640208293938'
          },
          {
            start: '2017-05-11T10:42:41.220Z',
            end: '2017-05-11T10:43:07.867Z',
            logsProcessed: 120,
            checkpoint: '49570627966157796216770346582398146766474360110828224562'
          },
          {
            start: '2017-05-11T10:52:41.220Z',
            end: '2017-05-11T10:53:07.867Z',
            logsProcessed: 100,
            checkpoint: 'should-not-be-included-last'
          }
        ]
      };
      const processor = createProcessor(data);

      return processor.getReport('2017-05-11T10:20:00.000Z', '2017-05-11T10:50:00.000Z')
        .then((result) => {
          expect(result).to.be.an('object');
          expect(result.processed).to.equal(150);
          expect(result.warnings).to.equal(1);
          expect(result.errors).to.equal(1);
          expect(result.checkpoint).to.equal('49570627966157796216770346582398146766474360110828224562');
        });
    });
  });
});
