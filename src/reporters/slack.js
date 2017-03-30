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
  const defaultText = status.error ? title + ' Error' : title + ' Success';
  const error = status.error ? status.error.message || status.error[0] || 'Error occurred' : null;

  const defaultTemplate = {
    fallback: options.fallback || defaultText,
    text: options.text || defaultText,
    fields: [
      { title: 'Start time', value: status.start, short: true },
      { title: 'End time', value: status.end, short: true },
      { title: 'Logs processed', value: status.logsProcessed, short: true },
      { title: 'Last checkpoint', value: checkpoint, short: true }
    ],
    error_field: { title: 'Error', value: error, short: false }
  };

  const details = options.url ? ' (<' + options.url + '|Details>)' : null;

  const fields = defaultTemplate.fields;

  if (status.error) {
    fields.push(defaultTemplate.error_field);
  }

  // Todo: this should handle error colors/warning colors also.
  msg.attachments.push({
    color: '#7CD197',
    fallback: defaultTemplate.fallback,
    text: defaultTemplate.fallback + (details || ''),
    fields: fields
  });

  return msg;
};

module.exports = SlackReporter;
