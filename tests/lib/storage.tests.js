const Promise = require('bluebird');
const expect = require('chai').expect;
const tools = require('auth0-extension-tools');

const StorageProvider = require('../../src/storage');
const memoryStorage = require('../helpers').memoryStorage;

describe.only('StorageProvider', () => {
  describe('#init', () => {
    it('should throw error if storage is undefined', (done) => {
      const init = () => {
        const provider = new StorageProvider();
      };

      expect(init).to.throw(tools.ArgumentError);
      done();
    });

    it('should init the provider', (done) => {
      let provider;
      const init = () => {
        provider = new StorageProvider(memoryStorage());
      };

      expect(init).to.not.throw(Error);
      expect(provider).to.be.an.instanceof(StorageProvider);
      done();
    });
  });

  describe('#read-write', () => {
    it('should read the checkpointId', (done) => {
      const storage = memoryStorage({ checkpointId: 50505 });
      const provider = new StorageProvider(storage);
      provider.getCheckpoint()
        .then((checkpoint) => {
          expect(checkpoint).to.equal(50505);
          done();
        });
    });

    it('should read the checkpointId and not overwrite the startFrom if current is empty', (done) => {
      const storage = memoryStorage({ checkpointId: 50505 });
      const provider = new StorageProvider(storage);
      provider.getCheckpoint(0)
        .then((checkpoint) => {
          expect(checkpoint).to.equal(50505);
          done();
        });
    });

    it('should read the checkpointId and overwrite the startFrom', (done) => {
      const storage = memoryStorage({ checkpointId: 50505 });
      const provider = new StorageProvider(storage);
      provider.getCheckpoint(100)
          .then((checkpoint) => {
            expect(checkpoint).to.equal(100);
            done();
          });
    });

    it('should read the token', (done) => {
      const storage = memoryStorage({ logs_access_token: 'abc' });
      const provider = new StorageProvider(storage);
      provider.getToken()
          .then((token) => {
            expect(token).to.equal('abc');
            done();
          });
    });

    it('should write the token', (done) => {
      const storage = memoryStorage({ logs_access_token: 'abc' });
      const provider = new StorageProvider(storage);
      provider.setToken(5)
          .then(() => {
            expect(storage.data.logs_access_token).to.equal(5);
            done();
          });
    });

    it('should write status and checkpoint', (done) => {
      const storage = memoryStorage({ logs_access_token: 'abc' });
      const provider = new StorageProvider(storage);
      provider.done('status', 'newpoint').then(() => {
        expect(storage.data.logs_access_token).to.equal('abc');
        expect(storage.data.checkpointId).to.equal('newpoint');
        expect(storage.data.logs.length).to.equal(1);
        expect(storage.data.logs[0]).to.equal('status');
        done();
      });
    });

    it('should replace old logs if limit reached', (done) => {
      const storage = memoryStorage({
        logs: [ 'log1', 'log2', 'log3', 'log4', 'log5', 'log6' ]
      });

      const provider = new StorageProvider(storage, {
        limit: 0
      });
      provider.done('status', 'newpoint').then(() => {
        expect(storage.data.checkpointId).to.equal('newpoint');
        expect(storage.data.logs.length).to.equal(2);
        expect(storage.data.logs[0]).to.equal('log6');
        expect(storage.data.logs[1]).to.equal('status');
        done();
      });
    });
  });
});
