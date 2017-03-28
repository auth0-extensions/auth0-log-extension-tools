function Auth0Storage(storage, limit) {
  if (!storage) {
    throw new Error('storage is required');
  }

  this.limit = typeof limit === 'undefined' ? 400 : limit;
  this.storage = storage;
}

Auth0Storage.prototype.getCheckpoint = function(startFrom) {
  const self = this;
  return self.storage.read().then(function(data) {
    data = data || {};

    if (startFrom !== data.startFrom) {
      data.startFrom = startFrom;
      data.checkpointId = startFrom;
    }

    return self.storage.write(data).then(function() {
      return data.checkpointId || startFrom || null;
    });
  });
};

Auth0Storage.prototype.getToken = function() {
  const self = this;
  return self.storage.read().then(function(data) {
    data = data || {};

    return data.auth0Token || null;
  });
};

Auth0Storage.prototype.setToken = function(token) {
  const self = this;
  return self.storage.read().then(function(data) {
    data = data || {};
    data.auth0Token = token;

    return self.storage.write(data);
  });
};

Auth0Storage.prototype.done = function(status, checkpoint) {
  const self = this;
  return self.storage.read().then(function(data) {
    const storageSize = Buffer.byteLength(JSON.stringify(data), 'utf8');

    if (!data.logs) {
      data.logs = [];
    }

    if (storageSize >= self.limit * 1024 && data.logs && data.logs.length) {
      data.logs.splice(0, 5);
    }

    status.checkpoint = checkpoint;
    data.logs.push(status);
    data.checkpointId = checkpoint;

    return self.storage.write(data);
  });
};

module.exports = Auth0Storage;
