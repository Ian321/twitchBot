/*
  main.js
  IRC Bot in node.js
*/
const tmi = require('tmi.js');
const mathjs = require('mathjs');
const _ = require('lodash');
const got = require('got');

const lib = require('./lib.js');
const conf = require('./config.json');

const options = {
    options: {
        debug: true
    },
    connection: {
        cluster: "aws",
        reconnect: true
    },
    identity: {
        username: conf.username,
        password: conf.password
    },
    channels: ["#" + process.argv[2]]
};

const client = tmi.client(options);
client.connect();
var startTime = Date.now();
const admins = conf.admins;

var messages = [];

setInterval(() => {
    if (messages.length > 0) {
        client.say(channel, message);
    }
}, 5000);

// Map a command to a function
const commands = {
    '!say': say,
    '*ping': ping,
    '!list': list,
    '!node': node,
    '*gtfo': gtfo,
    '!sha512': sha512,
    '*math': math,
    '!hug': hug,
    '*eval': myEval,
    '*version': version
};

// Message handler
function sendMessage(channel, message) {
    return client.say(channel, message + " ").catch(err => console.log('Message not send.'));
}

client.on('chat', function(channel, user, message, self) {
    if (self) return;

    const match = message.match(/(.[a-zA-Z0-9_-]+)(?:\s+(.*))?/);
    if (match !== null) {
        const command = match[1].toLowerCase();
        const args = match[2] ? match[2].trim().split(/\s+/) : [];

        //console.log(command, args);
        if (commands.hasOwnProperty(command)) {
            channel = channel.substring(1);
            if (admins.includes(user.username)) {
                user.admin = true;
            } else {
                user.admin = false;
            }
            commands[command](channel, user, message, args);
        }
    }
});

// Join / Leave
client.on("join", function(channel, username, self) {
    if (username === conf.username) {
        sendMessage(channel, conf.messages.join);
    }
});

function gtfo(channel, user, message, args) {
    if (user.admin) {
        return sendMessage(channel, conf.messages.leave) && process.exit(0);
    }
}


// Commands as function
function say(channel, user, message, args) {
    if (user.admin) {
        return sendMessage(channel, args.join(" "));
    }
}

function ping(channel, user, message, args) {
    return sendMessage(channel, "running for " + lib.msToTimeSting(Date.now() - startTime));
}

function list(channel, user, message, args) {
    if (args[0] && args[0] !== '') {
        channel = args[0];
    }
    client.whisper(user.username, `https://tmi.twitch.tv/group/user/${channel}/chatters`);
}

function node(channel, user, message, args) {
    return sendMessage(channel, "i run on node js FeelsGoodMan");
}

function sha512(channel, user, message, args) {
  return sendMessage(channel, require('crypto').createHash('sha512').update(args.join(" ")).digest('hex'));
}

function math(channel, user, message, args) {
  // escape strings
  var tmp = message.replace(/[\\$'"]/g, "\\$&");
  tmp = tmp.substr(message.indexOf(" ") + 1).split("\"").join("");
  if (tmp.indexOf('import') > -1 || tmp.indexOf('range') > -1 || tmp.indexOf('eye') > -1 ||
  tmp.indexOf('ones') > -1 || tmp.indexOf('tojson') > -1 || tmp.indexOf('topolar') > -1 || tmp.indexOf('zeros') > -1 || tmp.indexOf('distance') > -1) {
    return sendMessage(channel, `${user.username}, that function is not allowed OMGScoots`);
  }
  if (tmp.indexOf('isPrime') > -1) {
      var tmpP = tmp.replace(/ /g, "").split("isPrime(")[1];
      if (tmp.split("isPrime(")[2]) {
        return sendMessage(channel, `${user.username}, invalid input OMGScoots`);
      } else if ((tmp.match(/\(/g) || []).length != (tmp.match(/\)/g) || []).length) {
        return sendMessage(channel, `${user.username}, invalid input OMGScoots`);
      } else {
        var count;
        try {
          count = (tmpP.match(/\(/g) || []).length;
          count++;
        } catch (e) {
          return sendMessage(channel, `${user.username}, invalid input OMGScoots`);
        }
        var rek = new RegExp("^(?:[^|\\)]*\\\)){"+count.toString()+"}([^|]*)", "gm");
        var keepo = rek.exec(tmpP);
        var pogchamp = keepo[0];
        var vislaud = "";
        keepo.shift();
        for (var i = 0; i < keepo.length; i++) {
          vislaud += keepo[i];
        }
        tmpP = "("+tmpP.replace(vislaud, "");
        var resultE = false;
        var resultP;
        try {
          resultP = mathjs.eval(tmpP);
          if (!(resultP == "Infinity" || resultP == "-Infinity" || resultP.toString() == "NaN")) {
            resultE = true;
          }
        } catch (e) {

        }
        if (!resultE) {
          return sendMessage(channel, `${user.username}, can't check if it's a prime number WutFace`);
        } else {
          tmp = "isPrime("+resultP+")";
        }
      }
  }
  try {
    var result = mathjs.eval(tmp);
    if (result == "Infinity" || result == "-Infinity") {
      result = `WutFace it's '${result}'`;
    } else if (result.toString() == "NaN") {
      result = `NaM it's '${result}'`;
    }
    return sendMessage(channel, `${user.username}, ${result}`);
  } catch (e) {
    return sendMessage(channel, `${user.username}, invalid input OMGScoots`);
  }
}

function hug(channel, user, message, args) {
  if (args[0]) {
    if (/^[a-zA-Z0-9_]{1,25}$/.test(args[0])) {
      return sendMessage(channel, `${user.username} hugs ${args[0]} <3`);
    } else {
      return sendMessage(channel, `${user.username}, that is not a valid username OMGScoots`);
    }
  } else {
    return;
  }
}

function myEval(channel, user, message, args) {
  if (user.admin) {
    try {
      return sendMessage(channel, `${eval(args.join(" "))}`);
    } catch (e) {
      return sendMessage(channel, e);
    }
  }
}

function version(channel, user, message, args) {
  var keepo = require('./package.json');
  return sendMessage(channel, `${keepo.name} running on v${keepo.version} for ${lib.msToTimeSting(Date.now() - startTime)}`);
}
