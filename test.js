var chai = require('chai');
var tmi = require('tmi.js');
var lib = require('./lib');
var mathjs = require('mathjs');
var expect = chai.expect;

const options = {
    options: {
        debug: false
    },
    connection: {
        reconnect: true
    },
    channels: ["#" + process.argv[2]]
};
const client = tmi.client(options);

describe('Library', function() {
  it('lib.stringToHex("Kappa 123") should return "4b6170706120313233"', function() {
    expect(lib.stringToHex("Kappa 123").replace(/\\x/g, "")).to.equal("4b6170706120313233");
  });
  it('lib.msToTimeString(<1000) should return ""', function() {
    expect(lib.msToTimeString(1)).to.equal("");
    expect(lib.msToTimeString(500)).to.equal("");
    expect(lib.msToTimeString(999)).to.equal("");
  });
  it('lib.msToTimeString(1000) should return "1 second"', function() {
    expect(lib.msToTimeString(1000)).to.equal("1 second");
  });
});

describe('TMI.js', function() {
  it('Test connect', function() {
    client.connect().catch(function(err) {
      expect(err).to.equal(undefined);
    });
    client.disconnect();
  });
  it('Test disconnect', function() {
    client.connect();
    client.disconnect().catch(function(err) {
      expect(err).to.equal(undefined);
    });
  });
});

describe('MATH', function() {
  describe('mathjs', function() {
    it('1+1^2-4 === -2', function() {
      try {
        expect(mathjs.eval("1+1^2-4")).to.equal(-2);
      } catch (err) {
        expect(err).to.equal(undefined);
      }
    });
  });
  describe('node', function() {
    it('1+1^2-4 === -2', function() {
      try {
        expect(eval("1+Math.pow(1,2)-4")).to.equal(-2);
      } catch (err) {
        expect(err).to.equal(undefined);
      }
    });
  });
});

describe('Twitch API', function() {
  describe('Get ID by username', function() {
    it('nuuls => 100229878', function () {
      lib.getUser.id("nuuls").then(id => {
          expect(id).to.eql("100229878");
      });
    });
  });
  describe('Get data by id', function() {
    it('100229878 => nuuls', function () {
      lib.getUser.data("100229878").then(data => {
          expect(data.created_at).to.eql("2015-08-22T13:43:40Z");
      });
    });
  });
});
