/*
  main.js
  IRC Bot in node.js
*/
const tmi = require('tmi.js');
const mathjs = require('mathjs');
const _ = require('lodash');

const lib = require('./lib.js');
const conf = require('././config.json');

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
const startTime = Date.now();
const admins = conf.admins;

const messages = [];

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
    '!hug': hug
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
  var tmp = message.substr(message.indexOf(" ") + 1).split("\"").join("");
  if (tmp.indexOf('import') > -1 || tmp.indexOf('range') > -1 || tmp.indexOf('eye') > -1 || tmp.indexOf('ones') > -1 || tmp.indexOf('tojson') > -1 || tmp.indexOf('topolar') > -1) {
    return sendMessage(channel, `${user.username}, that function is not allowed OMGScoots`);
  }
  try {
    var result = mathjs.eval(tmp);
    if (result == "Infinity" || result == "-Infinity") {
      result = `WutFace it's '${result}'`;
    } else if (result == "NaN") {
      result = `NaM it's '${result}'`
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
