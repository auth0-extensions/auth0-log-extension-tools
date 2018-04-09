const util = require('util');
const Readable = require('stream').Readable;
const tools = require('auth0-extension-tools');

const LogsApiClient = require('./client');

function LogsApiStream(options) {
  if (options === null || options === undefined) {
    throw new tools.ArgumentError('Must provide an options object');
  }

  Readable.call(this, { objectMode: true });

  this.client = new LogsApiClient(options);
  this.options = options;
  this.remaining = 50;
  this.lastBatch = 0;
  this.previousCheckpoint = options.checkpointId || null;
  this.lastCheckpoint = options.checkpointId || null;
  this.status = {
    start: new Date(),
    end: null,
    logsProcessed: 0
  };
}

util.inherits(LogsApiStream, Readable);

LogsApiStream.prototype.getQuery = function(types) {
  if (!types || !types.length) {
    return '';
  }

  return 'type:' + types.join(' OR type:');
};

LogsApiStream.prototype.done = function() {
  this.status.end = new Date();
  this.push(null);
};

LogsApiStream.prototype.next = function(take) {
  const self = this;
  if (self.remaining < 1) {
    self.status.warning = 'Auth0 Management API rate limit reached.';
    self.done();
  } else {
    const params = self.lastCheckpoint
      ? { take: 100, from: self.lastCheckpoint }
      : { per_page: 100, page: 0 };
    params.q = self.getQuery(self.options.types);
    params.sort = 'date:1';

    self.client
      .getLogs(params)
      .then(function(data) {
        const logs = data.logs;
        self.remaining = data.limits.remaining;

        if (logs && logs.length) {
          let filtered = logs;
          if (self.options.types && self.options.types.length) {
            filtered = logs.filter(function(log) {
              return self.options.types.indexOf(log.type) >= 0;
            }).slice(0, take || 100);
          }

          if (filtered.length) {
            self.lastCheckpoint = filtered[filtered.length - 1]._id;
            self.lastBatch += filtered.length;
            self.push({ logs: filtered, limits: data.limits });
          } else {
            self.lastCheckpoint = logs[logs.length - 1]._id;
            self.lastBatch += 0;
            self.push({ logs: [], limits: data.limits });
          }
        } else {
          self.status.end = new Date();
          self.push(null);
        }

        return logs;
      })
      .catch(function(err) {
        self.emit('error', err);
      });
  }
};

LogsApiStream.prototype.batchSaved = function() {
  this.status.logsProcessed += this.lastBatch;
  this.previousCheckpoint = this.lastCheckpoint;
  this.lastBatch = 0;
};

LogsApiStream.prototype._read = function read() {};

module.exports = LogsApiStream;
