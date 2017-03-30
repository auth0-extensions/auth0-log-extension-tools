const expect = require('chai').expect;

const logTypes = require('../../src/logTypes');

describe.only('logTypes', () => {
  it('should contain all log events', () => {
    expect(Object.keys(logTypes).length > 10).to.equal(true);
  });

  describe('#get', () => {
    it('should return the correct log type', () => {
      const name = logTypes.get('fsa');
      expect(name).to.equal('Failed Silent Auth');
    });

    it('getting an unknown log type should return the default name', () => {
      const name = logTypes.get('xyz');
      expect(name).to.equal('Unknown Log Type: xyz');
    });
  });
});
