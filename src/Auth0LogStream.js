const Readable = require('stream').Readable;
const util = require('util');

function Auth0LogStream(client, options) {
  if (!client) {
    throw new Error('client is required');
  }

  const self = this;

  options = options || {};

  Readable.call(this, { objectMode: true });

  this.previousCheckpoint = options.checkpointId || null;
  this.lastCheckpoint = options.checkpointId || null;
  this.status = {
    start: new Date(),
    end: null,
    logsProcessed: 0
  };

  this.done = function() {
    self.status.end = new Date();
    self.push(null);
  };

  this.next = function() {
    client.logs.getAll({
      q: getQuery(options.types),
      take: options.take || 20,
      from: self.lastCheckpoint
    })
      .then(logs => {
        if (logs && logs.length) {
          self.previousCheckpoint = self.lastCheckpoint;
          self.lastCheckpoint = logs[logs.length - 1]._id;
          self.status.logsProcessed += logs.length;
          self.push(logs);
        } else {
          self.status.end = new Date();
          self.push(null);
        }
      })
      .catch(err => self.emit('error', err));
  };
}

util.inherits(Auth0LogStream, Readable);

Auth0LogStream.prototype._read = function read() {};

function getQuery (types) {
  if (!types || !types.length) {
    return '';
  }

  return `type:${types.join(' OR type:')}`;
}

module.exports = Auth0LogStream;
