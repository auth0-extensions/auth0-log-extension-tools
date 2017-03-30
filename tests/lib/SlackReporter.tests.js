const expect = require('chai').expect;

const auth0Mock = require('../auth0');
const SlackReporter = require('../../src/reporters/slack');

describe('Slack Reporter', () => {
  describe('#init', () => {
    it('should init reporter', (done) => {
      const repoter = new SlackReporter();

      expect(repoter).to.be.an.instanceof(SlackReporter);
      done();
    });
  });

  describe('#send', () => {
    it('should return error if no status', (done) => {
      const repoter = new SlackReporter();

      expect(repoter.send).to.throw(Error, /object status is required/);
      done();
    });

    it('should send do nothing if no hook provided', (done) => {
      const repoter = new SlackReporter();

      repoter.send({}, 'checkpoint')
        .then(done);
    });


    it('should send data to hook url', (done) => {
      auth0Mock.slack();

      const repoter = new SlackReporter({ hook: 'https://slack.local' });

      repoter.send({ error: 'some error' }, 'checkpoint')
        .then(done);
    });

    it('should catch error, if occurred', (done) => {
      const repoter = new SlackReporter({ hook: 'https://slack.local' });

      repoter.send({ error: 'some error' }, 'checkpoint')
        .then()
        .catch(err => done());
    });
  });
});
