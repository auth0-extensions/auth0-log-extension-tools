const assign = require('lodash').assign;
const ArgumentError = require('auth0-extension-tools').ArgumentError;

function StorageProvider(storageContext, options) {
  if (!storageContext) {
    throw new ArgumentError('The storageContext is required');
  }

  this.storageContext = storageContext;
  this.options = assign({ }, { limit: 400 }, options);
}

StorageProvider.prototype.read = function() {
  const self = this;
  return self.storageContext.read()
    .then(function(contents) {
      const data = contents || {};
      data.logs = data.logs || [];
      return data;
    });
};

StorageProvider.prototype.write = function(data) {
  const self = this;
  return self.storageContext.write(data);
};

StorageProvider.prototype.getCheckpoint = function(startFrom) {
  const self = this;
  return self.read()
    .then(function(data) {
      if (startFrom && startFrom !== data.startFrom) {
        data.startFrom = startFrom;
        data.checkpointId = startFrom;

        return self.write(data)
          .then(function() {
            return data.checkpointId || startFrom || null;
          });
      }

      return data.checkpointId;
    });
};

StorageProvider.prototype.getToken = function() {
  return this.read()
    .then(function(data) {
      return data.logs_access_token || null;
    });
};

StorageProvider.prototype.setToken = function(token) {
  const self = this;
  return self.read()
    .then(function(data) {
      data.logs_access_token = token;
      return self.write(data);
    });
};

StorageProvider.prototype.done = function(status, checkpointId) {
  const self = this;
  return self.read().then(function(data) {
    const storageSize = Buffer.byteLength(JSON.stringify(data), 'utf8');
    if (storageSize >= self.options.limit * 1024 && data.logs && data.logs.length) {
      data.logs.splice(0, 5);
    }

    status.checkpoint = checkpointId;

    data.logs.push(status);
    data.checkpointId = checkpointId;

    return self.write(data);
  });
};

module.exports = StorageProvider;
