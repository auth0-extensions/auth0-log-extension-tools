const Promise = require('bluebird');
const expect = require('chai').expect;

const Auth0Logger = require('../../src/Auth0Logger');

const data = { checkpointId: null };

const fakeAuth0Client = {
  logs: {
    getAll: (options) =>
      new Promise((resolve, reject) => {
        if (options.q) {
          return reject(new Error('bad request'));
        }

        const logs = [];
        const from = (options.from) ? parseInt(options.from) : 0;
        const take = options.take || 20;

        for (let i = from + 1; i<=from+take; i++) {
          if (i <= 50) {
            logs.push({ _id: '' + i });
          }
        }

        return resolve(logs);
      })
  }
};

const fakeStorage = {
  read: () => new Promise((resolve) => resolve(data)),
  write: (obj) => new Promise((resolve) => {
    data.logs = obj.logs;
    data.checkpointId = obj.checkpointId;
    resolve();
  })
};

const loggerOptions = {
  onLogsReceived: (logs, cb) => setTimeout(() => cb()),
  onSuccess: () => null,
  onError: () => null
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
        const logger = new Auth0Logger(null, null, {});
      };

      expect(init).to.throw(Error, /onLogsReceived function is required/);
      done();
    });

    it('should init logger', (done) => {
      let logger;
      const init = () => {
        logger = new Auth0Logger(fakeAuth0Client, fakeStorage, loggerOptions);
      };

      expect(init).to.not.throw(Error);
      expect(logger).to.be.a('function');
      done();
    });
  });

  describe('#middleware', () => {
    it('should process logs and send response', (done) => {
      const logger = new Auth0Logger(fakeAuth0Client, fakeStorage, loggerOptions);
      const response = {
        json: (result) => {
          expect(result).to.be.an('object');
          expect(result.status).to.be.an('object');
          expect(result.checkpoint).to.equal('50');
          done();
        }
      };

      logger({}, response, {});
    });

    it('should process logs and done by timelimit', (done) => {
      data.checkpointId = null;
      loggerOptions.onLogsReceived = (logs, cb) => setTimeout(() => cb(), 500);
      loggerOptions.timeLimit = 1;
      loggerOptions.batchSize = 5;
      const logger = new Auth0Logger(fakeAuth0Client, fakeStorage, loggerOptions);
      const response = {
        json: (result) => {
          expect(result).to.be.an('object');
          expect(result.status).to.be.an('object');
          expect(result.checkpoint).to.equal('10');
          done();
        }
      };

      logger({}, response, {});
    });

    it('should process logs and done by error', (done) => {
      loggerOptions.logTypes = [ 'test' ];
      const logger = new Auth0Logger(fakeAuth0Client, fakeStorage, loggerOptions);
      const response = {
        json: (result) => {
          expect(result).to.be.an('object');
          expect(result.status).to.be.an('object');
          expect(result.status.error).to.be.an.instanceof(Error, /bad request/);
          expect(result.checkpoint).to.equal('10');
          done();
        }
      };

      logger({}, response, {});
    });

    it('should process logs and done by error in onLogsReceived', (done) => {
      loggerOptions.onLogsReceived = (logs, cb) => cb(new Error('ERROR'));
      loggerOptions.logTypes = null;
      const logger = new Auth0Logger(fakeAuth0Client, fakeStorage, loggerOptions);
      const response = {
        json: (result) => {
          expect(result).to.be.an('object');
          expect(result.status).to.be.an('object');
          expect(result.status.logsProcessed).to.equal(0);
          expect(result.status.error).to.be.an.instanceof(Error, /ERROR/);
          expect(result.checkpoint).to.equal('10');
          done();
        }
      };

      logger({}, response, {});
    });
  });
});
