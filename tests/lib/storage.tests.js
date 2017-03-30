const Promise = require('bluebird');
const expect = require('chai').expect;

const StorageProvider = require('../../src/storage');

const data = { checkpointId: 'checkpoint' };

const fakeStorage = {
  read: () => new Promise(resolve => resolve(data)),
  write: obj =>
    new Promise((resolve) => {
      data.logs = obj.logs;
      data.checkpointId = obj.checkpointId;
      resolve();
    })
};

describe('Auth0 Storage', () => {
  describe('#init', () => {
    it('should throw error if storage is undefined', (done) => {
      const init = () => {
        const a0Storage = new StorageProvider();
      };

      expect(init).to.throw(Error, /storage is required/);
      done();
    });

    it('should init storage', (done) => {
      let a0Storage;

      const init = () => {
        a0Storage = new StorageProvider(fakeStorage);
      };

      expect(init).to.not.throw(Error);
      expect(a0Storage).to.be.an.instanceof(StorageProvider);
      done();
    });
  });

  describe('#read-write', () => {
    it('should read checkpointId', (done) => {
      const a0Storage = new StorageProvider(fakeStorage);
      a0Storage.getCheckpoint().then((checkpoint) => {
        expect(checkpoint).to.equal(data.checkpointId);
        done();
      });
    });

    it('should write status and checkpoint', (done) => {
      const a0Storage = new StorageProvider(fakeStorage);
      a0Storage.done('status', 'newpoint').then(() => {
        expect(data.checkpointId).to.equal('newpoint');
        expect(data.logs.length).to.equal(1);
        expect(data.logs[0]).to.equal('status');
        done();
      });
    });

    it('should replace old logs if limit reached', (done) => {
      data.logs = [ 'log1', 'log2', 'log3', 'log4', 'log5', 'log6' ];
      const a0Storage = new StorageProvider(fakeStorage, 0);
      a0Storage.done('status', 'newpoint').then(() => {
        expect(data.checkpointId).to.equal('newpoint');
        expect(data.logs.length).to.equal(2);
        expect(data.logs[0]).to.equal('log6');
        expect(data.logs[1]).to.equal('status');
        done();
      });
    });
  });
});
