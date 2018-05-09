const SlackReporter = require('./reporters/slack');

module.exports.LogsProcessor = require('./processor');

module.exports.LogsApiClient = require('./client');

module.exports.LogsApiStream = require('./stream');

module.exports.logTypes = require('./logTypes');

module.exports.Route = require('./route');

module.exports.reporters = {
  SlackReporter: SlackReporter
};
