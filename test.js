const chai = require('chai');
const tmi = require('tmi.js');
const lib = require('./lib');
const mathjs = require('mathjs');

const { expect } = chai;

const options = {
  options: {
    debug: false
  },
  connection: {
    reconnect: true
  },
  channels: ['#ian678']
};
const client = tmi.client(options);

describe('Library', () => {
  it('lib.stringToHex("Kappa 123") should return "4b6170706120313233"', () => {
    expect(lib.stringToHex('Kappa 123').replace(/\\x/g, '')).to.equal('4b6170706120313233');
  });
  it('lib.msToTimeString(<1000) should return ""', () => {
    expect(lib.msToTimeString(1)).to.equal('');
    expect(lib.msToTimeString(500)).to.equal('');
    expect(lib.msToTimeString(999)).to.equal('');
  });
  it('lib.msToTimeString(1000) should return "1 second"', () => {
    expect(lib.msToTimeString(1000)).to.equal('1 second');
  });
});

describe('TMI.js', () => {
  it('Test connect', () => {
    client.connect().catch(err => {
      expect(err).to.equal(undefined);
    });
    client.disconnect();
  });
  it('Test disconnect', () => {
    client.connect();
    client.disconnect().catch(err => {
      expect(err).to.equal(undefined);
    });
  });
});

describe('MATH', () => {
  describe('mathjs', () => {
    it('1+1**2-4 === -2', () => {
      try {
        expect(mathjs.eval('1+1^2-4')).to.equal(-2);
      } catch (err) {
        expect(err).to.equal(undefined);
      }
    });
  });
  describe('node', () => {
    it('1+1**2-4 === -2', () => {
      try {
        expect((1 + (1 ** 2)) - 4).to.equal(-2);
      } catch (err) {
        expect(err).to.equal(undefined);
      }
    });
  });
});

describe('Twitch API', () => {
  describe('Get ID by username', () => {
    it('nuuls => 100229878', async () => {
      const id = await lib.getUser.id('nuuls');
      expect(id).to.eql('100229878');
    });
  });
  describe('Get data by id', () => {
    it('100229878 => nuuls', async () => {
      const data = lib.getUser.data('100229878');
      expect(data.created_at).to.eql('2015-08-22T13:43:40Z');
    });
  });
});
