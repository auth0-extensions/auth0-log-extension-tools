const util = require('util');
const Readable = require('stream').Readable;
const tools = require('auth0-extension-tools');

const LogsApiClient = require('./client');

const MS_PER_S = 1000;
const NS_PER_MS = 1000000;

function LogsApiStream(options) {
  if (options === null || options === undefined) {
    throw new tools.ArgumentError('Must provide an options object');
  }

  Readable.call(this, { objectMode: true });

  this.client = new LogsApiClient(options);
  this.options = options;
  this.remaining = 50;
  this.lastBatch = 0;
  this.retries = 0;
  this.previousCheckpoint = options.checkpointId || null;
  this.lastCheckpoint = options.checkpointId || null;
  this.status = {
    startCheckpoint: options.checkpointId || null,
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
  const logger = this.options.logger;
  const perPage = take;

  if (self.remaining < 1) {
    self.status.warning = 'Auth0 Management API rate limit reached.';
    self.done();
  } else {
    const params = self.lastCheckpoint
      ? { take: perPage, from: self.lastCheckpoint }
      : { per_page: perPage, page: 0 };
    params.q = self.getQuery(self.options.types);
    params.sort = 'date:1';

    if (logger) {
      const startPoint = params.from ? `checkpoint ${params.from}` : `page ${params.page}`;
      logger.debug(`Requesting logs from ${startPoint}`);
    }

    const startTime = process.hrtime();
    const getLogs = function() {
      self.client
        .getLogs(params)
        .then(function(data) {
          const elapsedTime = process.hrtime(startTime);
          const elapsedMillis = elapsedTime[0] * MS_PER_S + elapsedTime[1] / NS_PER_MS;

          if (logger) {
            logger.debug(`Retrieved logs in ${elapsedMillis}ms.`);
          }

          const logs = data.logs;
          self.remaining = data.limits.remaining;

          if (logs && logs.length) {
            var filtered = logs;
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
          const start = self.options.start;
          const limit = self.options.maxRunTimeSeconds;
          const now = new Date().getTime();
          const hasTime = start + (limit * 1000) >= now;

          if (self.options.maxRetries > self.retries && hasTime) {
            self.retries++;
            return getLogs();
          }

          return self.emit('error', err);
        });
    };

    getLogs();
  }
};

LogsApiStream.prototype.batchSaved = function() {
  this.status.logsProcessed += this.lastBatch;
  this.previousCheckpoint = this.lastCheckpoint;
  this.lastBatch = 0;
};

LogsApiStream.prototype._read = function read() {};

module.exports = LogsApiStream;
