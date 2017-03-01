const expect = require('chai').expect;

const SlackReporter = require('../../src/SlackReporter');

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
      const repoter = new SlackReporter({ hook: 'http://127.0.0.1' });

      repoter.send({ error: 'some error' }, 'checkpoint')
        .then(done);
    });
  });
});
