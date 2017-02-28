function Auth0Storage(storage, limit) {
  if (!storage) {
    throw new Error('storage is required');
  }

  this.limit = limit || 400;
  this.storage = storage;
}

Auth0Storage.prototype.getCheckpoint = function () {
  return this.storage.read()
    .then((data) => {
      return typeof data === 'undefined' ? null : data.checkpointId;
    });
};

Auth0Storage.prototype.done = function (status, checkpoint) {
  return this.storage.read()
    .then((data) => {
      const storageSize = Buffer.byteLength(JSON.stringify(data), 'utf8');

      if (storageSize >= this.limit * 1024 && data.logs && data.logs.lenght) {
        data.logs.splice(0, 5);
      }

      if (!data.logs) {
        data.logs = [];
      }

      status.checkpoint = checkpoint;
      data.logs.push(status);
      data.checkpointId = checkpoint;

      return this.storage.write(data);
    });
};

module.exports = Auth0Storage;
