const StorageProvider = require('../../src/storage');

module.exports.mocks = require('./mocks');

module.exports.tokenCache = () => {
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

module.exports.memoryStorage = (data = { }) => {
  const storage = {
    data
  };
  storage.read = () => new Promise(resolve => resolve(storage.data));
  storage.write = obj => new Promise((resolve) => {
    storage.data = obj;
    resolve();
  });

  return storage;
};

module.exports.storageProvider = (data = { }) => new StorageProvider(module.exports.memoryStorage(data));
