const Readable = require('stream').Readable;
const util = require('util');

const Auth0Client = require('./Auth0Client');

function Auth0LogStream(auth0Options, options) {
  if (!auth0Options) {
    throw new Error('auth0Options is required');
  }

  const client = new Auth0Client(auth0Options);
  const self = this;
  var remaining = 50;

  options = options || {};

  Readable.call(this, { objectMode: true });

  this.previousCheckpoint = options.checkpointId || null;
  this.lastCheckpoint = options.checkpointId || null;
  this.lastBatch = 0;
  this.status = {
    start: new Date(),
    end: null,
    logsProcessed: 0
  };

  this.done = function() {
    self.status.end = new Date();
    self.push(null);
  };

  this.next = function(take) {
    if (remaining < 1) {
      self.status.warning = 'Auth0 Management API rate limit reached.';
      return self.done();
    }

    const params = (self.lastCheckpoint) ? { take: take || 100, from: self.lastCheckpoint } : { per_page: take || 100, page: 0 };
    params.q = getQuery(options.types);
    params.sort = 'date:1';

    client.getLogs(params)
      .then(function(data) {
        const logs = data.logs;
        remaining = data.limits.remaining;

        if (logs && logs.length) {
          self.lastCheckpoint = logs[logs.length - 1]._id;
          self.lastBatch += logs.length;
          self.push(logs);
        } else {
          self.status.end = new Date();
          self.push(null);
        }
      })
      .catch(function(err) { self.emit('error', err); });
  };

  this.batchSaved = function() {
    self.previousCheckpoint = self.lastCheckpoint;
    self.status.logsProcessed += self.lastBatch;
    self.lastBatch = 0;
  };
}

util.inherits(Auth0LogStream, Readable);

Auth0LogStream.prototype._read = function read() {};

function getQuery (types) {
  if (!types || !types.length) {
    return '';
  }

  return 'type:' + types.join(' OR type:');
}

module.exports = Auth0LogStream;
