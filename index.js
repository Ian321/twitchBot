/*
  main.js
  IRC Bot in node.js
*/
const tmi = require('tmi.js');
const crypto = require('crypto');
const mathjs = require('mathjs');
const Datastore = require('nedb');
const metadata = require('./package.json');
const conf = require('./config.json') || require('./config.example.json'); // eslint-disable-line
const lib = require('./lib.js');

const db = new Datastore({ filename: 'commands', autoload: true });

const timezoneJS = require('timezone-js');
const tzdata = require('tzdata');

const _tz = timezoneJS.timezone;
_tz.loadingScheme = _tz.loadingSchemes.MANUAL_LOAD;
_tz.loadZoneDataFromObject(tzdata);


let identity;
if (conf.username && conf.password) {
  identity = {
    username: conf.username,
    password: conf.password
  };
}

const joinThem = process.argv.slice();
joinThem.splice(0, 2);

const options = {
  options: {
    debug: true
  },
  connection: {
    reconnect: true
  },
  identity,
  channels: joinThem
};

const client = tmi.client(options);

function _start() {
  client.connect().catch(err => {
    console.error(`ERROR: ${err.message}`);
    setTimeout(() => {
      _start();
    }, 1000 * 8);
  });
}
_start();
const startTime = Date.now();
const { admins } = conf;

// Map a command to a function
const commands = {
  '!say': say,
  '*ping': ping,
  '!pingall': ping,
  '!list': list,
  '!node': node,
  '*gtfo': gtfo,
  '!sha512': sha512,
  '*math': math,
  '!hug': hug,
  '*eval': myEval,
  '*version': version,
  '*cmd': cmd,
  '!agdq': agdq,
  '!sgdq': agdq,
  '!gdq': agdq
};

db.find({}, (err, docs) => {
  if (err) {
    console.error(err);
  }
  for (let i = 0; i < docs.length; i++) {
    commands[docs[i].trigger] = function (channel) {
      try {
        sendMessage(channel, eval(`\`${docs[i].command}\``)); // eslint-disable-line
      } catch (err2) {
        sendMessage(channel, `${err2.message} WutFace`);
      }
    };
  }
});

// Message handler
let messageQ = [];
let curr = 0;
let lastMessage = new Date().getTime();
function _sendMessage(channel, message) {
  let padding = '';
  if (curr === 1) {
    curr = 0;
    padding = ' \u206D';
  } else {
    curr = 1;
  }
  return client.say(channel, message + padding).catch(err => {
    console.error(`ERROR: ${err.message}`);
  });
}
setInterval(() => {
  if (messageQ.length > 0) {
    const x = messageQ.shift();
    _sendMessage(x.channel, x.message);
  }
  if (messageQ.length > 9) {
    messageQ = [messageQ[0]];
  }
}, ((30 * 999) / 20));
function sendMessage(channel, message, skipQ = false) {
  if (new Date().getTime() - lastMessage >= 1000 * 2 || skipQ) {
    _sendMessage(channel, message);
  } else {
    messageQ.push({ channel, message });
    console.log(messageQ);
    messageQ = lib.uniqueObjArray(messageQ);
    console.log(messageQ);
  }
  lastMessage = new Date().getTime();
}

client.on('chat', (channel, user, message, self) => {
  setTimeout(() => {
    if (self) return;

    const match = message.match(/(.[a-zA-Z0-9_-]+)(?:\s+(.*))?/);
    if (match !== null) {
      const command = match[1].toLowerCase();
      const args = match[2] ? match[2].trim().split(/\s+/) : [];

      if (commands[command]) {
        channel = channel.substring(1);
        if (admins.includes(user.username)) {
          user.admin = true;
        } else {
          user.admin = false;
        }
        message = message.replace(/\u{206d}/ug, '');
        const args2 = [];
        for (let i = 0; i < args.length; i++) {
          args2.push(args[i].replace(/\u{206d}/ug, ''));
        }
        commands[command](channel, user, message, args2);
      }
    }
  }, 10);
});

// Join / Leave
client.on('join', (channel, username, self) => {
  if (self) {
    sendMessage(channel, conf.messages.join);
  }
});

function gtfo(channel, user) {
  if (user.admin) {
    sendMessage(channel, conf.messages.leave);
    process.exit(0);
  }
}


// Commands as function
function say(channel, user, message, args) {
  if (user.admin) {
    sendMessage(channel, args.join(' '));
  }
}

function ping(channel) {
  return sendMessage(channel, `running for ${lib.msToTimeString(Date.now() - startTime)}`);
}

function list(channel, user, message, args) {
  if (args[0] && args[0] !== '') {
    [channel] = args;
  }
  client.whisper(user.username, `https://tmi.twitch.tv/group/user/${channel}/chatters`);
}

function node(channel) {
  return sendMessage(channel, 'i run on node js FeelsGoodMan');
}

function sha512(channel, user, message, args) {
  return sendMessage(channel, crypto.createHash('sha512').update(args.join(' ')).digest('hex'));
}

function math(channel, user, message) {
  return sendMessage(channel, `${user.username}, ${lib.mathEval(message)}`);
}

function hug(channel, user, message, args) {
  if (args[0]) {
    if (/^[a-zA-Z0-9_]{1,25}$/.test(args[0])) {
      sendMessage(channel, `${user.username} hugs ${args[0]} <3`);
      return;
    }
    sendMessage(channel, `${user.username}, that is not a valid username ariW`);
  }
}

function myEval(channel, user, message, args) {
  if (user.admin) {
    try {
      sendMessage(channel, `${eval(args.join(' '))}`, true); // eslint-disable-line
    } catch (e) {
      sendMessage(channel, e, true);
    }
  }
}

function version(channel) {
  return sendMessage(channel, `${metadata.name} running on v${metadata.version} ` +
    `for ${lib.msToTimeString(Date.now() - startTime)}`);
}

let agdqT = new Date().getTime();
function agdq(channel, user) {
  if (agdqT > Date().getTime() - (1000 * 60 * 2)) {
    return;
  }
  agdqT = new Date().getTime();
  lib.getUser.id('gamesdonequick').then(id => {
    lib.getUser.data(id).then(data => {
      if (data.stream.stream_type === 'live') {
        sendMessage(channel, `${user.username}, GDQ is live with "${data.stream.game}" PagChomp Here is the schedule: https://gamesdonequick.com/schedule`);
        return;
      }
      sendMessage(channel, `${user.username}, GDQ is offline FeelsBadMan`);
    }).catch(err => err);
  }).catch(err => err);
}

function cmd(channel, user, message, args) {
  if (user.admin) {
    if (args.length > 1) {
      switch (args[0]) {
        case 'rm':
        case 'remove':
          db.remove({ trigger: args[1] }, {}, (err, numRem) => {
            if (err) {
              sendMessage(channel, `${user.username}, ${err.message} WutFace`, true);
            } else if (numRem === 0) {
              sendMessage(channel, `${user.username}, no command with trigger "${args[1]}" found`, true);
            } else {
              delete commands[args[1]];
              sendMessage(channel, `${user.username}, successfully removed command "${args[1]}"`, true);
            }
          });
          break;
        case 'add':
          db.findOne({ trigger: args[1] }, (err, doc) => {
            if (err) {
              sendMessage(channel, `${user.username}, ${err.message} WutFace`, true);
            } else if (doc) {
              sendMessage(channel, `${user.username}, command with the trigger "${args[1]}" already exists`, true);
            } else {
              const tmp1 = args.slice();
              tmp1.splice(0, 2);
              db.insert({ trigger: args[1], command: tmp1.join(' ') }, err2 => {
                if (err2) {
                  sendMessage(channel, `${user.username}, ${err2.message} WutFace`, true);
                } else {
                  commands[args[1]] = function () {
                    try {
                      sendMessage(channel, eval(`\`${tmp1.join(' ')}\``), true); // eslint-disable-line
                    } catch (err3) {
                      sendMessage(channel, `${err3.message} WutFace`, true);
                    }
                  };
                  sendMessage(channel, `${user.username}, successfully added command "${args[1]}"`, true);
                }
              });
            }
          });
          break;
        case 'edit':
        case 'update':
          db.findOne({ trigger: args[1] }, (err, doc) => {
            if (err) {
              sendMessage(channel, `${user.username}, ${err.message} WutFace`, true);
            } else if (!doc) {
              sendMessage(channel, `${user.username}, no command with trigger "${args[1]}" found`, true);
            } else {
              const tmp1 = args.slice();
              tmp1.splice(0, 2);
              db.update({ trigger: args[1] }, { $set: { command: tmp1.join(' ') } }, {}, err2 => {
                if (err2) {
                  sendMessage(channel, `${user.username}, ${err2.message} WutFace`, true);
                } else {
                  commands[args[1]] = function () {
                    try {
                      sendMessage(channel, eval(`\`${tmp1.join(' ')}\``), true); // eslint-disable-line
                    } catch (err3) {
                      sendMessage(channel, `${err3.message} WutFace`, true);
                    }
                  };
                  sendMessage(channel, `${user.username}, successfully updated command "${args[1]}"`, true);
                }
              });
            }
          });
          break;
        case 'info':
        case 'show':
          db.findOne({ trigger: args[1] }, (err, doc) => {
            if (err) {
              sendMessage(channel, `${user.username}, ${err.message} WutFace`, true);
            } else if (!doc) {
              sendMessage(channel, `${user.username}, no command with trigger "${args[1]}" found`, true);
            } else {
              sendMessage(channel, `${user.username}, "${args[1]}": ${doc.command}`, true);
            }
          });
          break;
        default:
          break;
      }
    }
  }
}
