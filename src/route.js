const moment = require('moment');
const tools = require('auth0-extension-tools');

const loggingTools = require('./index');

function Route(storage, options) {
  if (!storage) {
    throw new tools.ArgumentError('Must provide a storage object');
  }

  if (!options) {
    throw new tools.ArgumentError('Must provide an options object');
  }

  if (typeof options.onLogsReceived !== 'function') {
    throw new tools.ArgumentError('Must provide options.onLogsReceived function');
  }

  return function(req, res, next) {
    const wtBody = (req.webtaskContext && req.webtaskContext.body) || req.body || {};
    const wtHead = (req.webtaskContext && req.webtaskContext.headers) || {};
    const isCron = (wtBody.schedule && wtBody.state === 'active') || (wtHead.referer === 'https://manage.auth0.com/' && wtHead['if-none-match']);

    if (!isCron) {
      return next();
    }

    const onLogsReceived = options.onLogsReceived;
    const maxBatchSize = options.maxBatchSize || 100;

    const slack = new loggingTools.reporters.SlackReporter({
      hook: options.slackWebhook,
      username: options.extensionName || 'auth0-logging-extension',
      title: options.extensionTitle || 'Auth0 Logging Extension'
    });

    const loggerOpts = {
      domain: options.domain,
      clientId: options.clientId,
      clientSecret: options.clientSecret,
      batchSize: parseInt(options.batchSize, 10),
      startFrom: options.startFrom,
      logTypes: options.logTypes,
      logLevel: options.logLevel
    };


    if (!loggerOpts.batchSize || loggerOpts.batchSize > maxBatchSize) {
      loggerOpts.batchSize = maxBatchSize;
    }

    if (loggerOpts.logTypes && !Array.isArray(loggerOpts.logTypes)) {
      loggerOpts.logTypes = loggerOpts.logTypes.replace(/\s/g, '').split(',');
    }

    const auth0logger = new loggingTools.LogsProcessor(storage, loggerOpts);

    const sendDailyReport = function(lastReportDate) {
      const current = new Date();

      const end = current.getTime();
      const start = end - 86400000;
      return auth0logger.getReport(start, end)
        .then(function(report) {
          return slack.send(report, report.checkpoint);
        })
        .then(function() {
          return storage.read();
        })
        .then(function(data) {
          data.lastReportDate = lastReportDate;
          return storage.write(data);
        });
    };

    const checkReportTime = function() {
      return storage.read()
        .then(function(data) {
          const now = moment().format('DD-MM-YYYY');
          const reportTime = options.reportTime || 16;

          if (data.lastReportDate !== now && new Date().getHours() >= reportTime) {
            sendDailyReport(now);
          }
        });
    };

    return auth0logger
      .run(onLogsReceived)
      .then(function(result) {
        if (result && result.status && result.status.error) {
          slack.send(result.status, result.checkpoint);
        } else if (options.sendSuccess === true || options.sendSuccess === 'true') {
          slack.send(result.status, result.checkpoint);
        }
        checkReportTime();
        return res.json(result);
      })
      .catch(function(err) {
        slack.send({ error: err, logsProcessed: 0 }, null);
        checkReportTime();
        return next(err);
      });
  };
}

module.exports = Route;
