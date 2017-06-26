const Promise = require('bluebird');
const request = require('superagent');

function SlackReporter(options) {
  this.options = options || {};
}

SlackReporter.prototype.send = function(status, checkpoint) {
  if (!status || typeof status !== 'object') {
    throw new Error('object status is required');
  }

  const options = this.options;
  const msg = this.createMessage(this.options, status, checkpoint);

  return new Promise(function(resolve, reject) {
    if (!options.hook) {
      return resolve();
    }

    return request.post(options.hook)
      .send(msg)
      .set('Accept', 'application/json')
      .end(function(err) {
        if (err) {
          return reject(err);
        }

        return resolve();
      });
  });
};

SlackReporter.prototype.createMessage = function(options, status, checkpoint) {
  const msg = {
    username: options.username || 'auth0-logger',
    icon_emoji: options.icon || ':rocket:',
    attachments: []
  };

  const title = options.title || 'Auth0 Logger';
  const defaultText = (status.type === 'report') ? title + ' Daily Report' : status.error ? title + ' Error' : title + ' Success';
  const error = status.error || null;

  const defaultTemplate = {
    fallback: options.fallback || defaultText,
    text: options.text || defaultText,
    error_field: { title: 'Error', value: JSON.stringify(error), short: false }
  };

  if (status.type === 'report') {
    defaultTemplate.fields = [
      { title: 'Logs processed', value: status.processed, short: true },
      { title: 'Warnings', value: status.warnings, short: true },
      { title: 'Errors', value: status.errors, short: true },
      { title: 'Next checkpoint', value: status.checkpoint, short: true }
    ];
  } else {
    defaultTemplate.fields = [
      { title: 'Start time', value: status.start, short: true },
      { title: 'End time', value: status.end, short: true },
      { title: 'Logs processed', value: status.logsProcessed, short: true },
      { title: 'Next checkpoint', value: checkpoint, short: true }
    ];
  }

  const details = options.url ? ' (<' + options.url + '|Details>)' : null;

  const fields = defaultTemplate.fields;

  if (status.error) {
    fields.push(defaultTemplate.error_field);
  }

  // Todo: this should handle error colors/warning colors also.
  msg.attachments.push({
    color: (status.error) ? '#d13f42' : '#7cd197',
    fallback: defaultTemplate.fallback,
    text: defaultTemplate.fallback + (details || ''),
    fields: fields
  });

  return msg;
};

module.exports = SlackReporter;
