const Promise = require('bluebird');
const request = require('superagent');

const createPayload = function(options, status, checkpoint) {
  const msg = {
    username: options.username || 'auth0-logger',
    icon_emoji: options.icon || ':rocket:',
    attachments: []
  };

  const defaultText = (status.error) ? 'Auth0 Logger Error' : 'Auth0 Logger Success';
  const error = (status.error) ? status.error.message || status.error[0] || 'Error occurred' : null;

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

  const details = (options.url) ? ` (<${options.url}|Details>)` : null;

  const fields = defaultTemplate.fields;

  if (status.error) {
    fields.push(defaultTemplate.error_field);
  }

  msg.attachments.push({
    color: '#7CD197',
    fallback: defaultTemplate.fallback,
    text: defaultTemplate.fallback + (details || ''),
    fields: fields
  });

  return msg;
};

function SlackReporter(options) {
  options = options || {};

  if (SlackReporter.instance) {
    return SlackReporter.instance
  }

  this.send = function (status, checkpoint) {
    const msg = createPayload(options, status, checkpoint);

    return new Promise((resolve) => {
      if (!options.hook) {
        return resolve();
      }

      request
        .post(options.hook)
        .send(msg)
        .set('Accept', 'application/json')
        .end(function(err, res) {
          if (err && err.status === 401) {
            console.log('Error sending to Slack: ' + err.status);
          } else if (err && res && res.body) {
            console.log('Error sending to Slack: ' + err.status + ' - ' + res.body);
          } else if (err) {
            console.log('Error sending to Slack: ' + err.status + ' - ' + err.message);
          }

          return resolve();
        });
    });
  };

  SlackReporter.instance = this;
}

module.exports = SlackReporter;
