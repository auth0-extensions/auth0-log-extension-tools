const Promise = require('bluebird');
const expect = require('chai').expect;

const Auth0LogStream = require('../../src/Auth0LogStream');

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

let trueLogger;

describe('Auth0 Log Stream', () => {
  describe('#init', () => {
    it('should throw error if client is undefined', (done) => {
      const init = () => {
        const logger = new Auth0LogStream();
      };

      expect(init).to.throw(Error, /client is required/);
      done();
    });

    it('should init logger', (done) => {
      const init = () => {
        trueLogger = new Auth0LogStream(fakeAuth0Client);
      };

      expect(init).to.not.throw(Error);
      expect(trueLogger).to.be.an.instanceof(Auth0LogStream);
      done();
    });
  });

  describe('#stream', () => {
    it('should read logs', (done) => {
      trueLogger.on('data', (logs) => {
        expect(logs).to.be.an('array');
        expect(logs.length).to.equal(20);
        expect(trueLogger.status).to.be.an('object');
        expect(trueLogger.status.logsProcessed).to.equal(20);
        done();
      });

      trueLogger.next();
    });

    it('should done reading logs', (done) => {
      trueLogger.on('end', () => {
        expect(trueLogger.status).to.be.an('object');
        expect(trueLogger.status.logsProcessed).to.equal(20);
        expect(trueLogger.lastCheckpoint).to.equal('20');
        done();
      });

      trueLogger.done();
    });

    it('should done reading logs, if no more logs can be fount', (done) => {
      const logger = new Auth0LogStream(fakeAuth0Client);

      logger.on('data', () => logger.next());
      logger.on('end', () => {
        expect(logger.status).to.be.an('object');
        expect(logger.status.logsProcessed).to.equal(50);
        expect(logger.lastCheckpoint).to.equal('50');
        done();
      });

      logger.next();
    });

    it('should emit error', (done) => {
      const logger = new Auth0LogStream(fakeAuth0Client, { types: [ 'test' ] });

      logger.on('data', () => logger.next());
      logger.on('error', (error) => {
        expect(error).to.be.an.instanceof(Error);
        expect(error.message).to.equal('bad request');
        done();
      });

      logger.next();
    });
  });
});
