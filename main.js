/*
  main.js
  IRC Bot in node.js
*/
const tmi = require('tmi.js');
const mathjs = require('mathjs');

const timezoneJS = require("timezone-js");
const tzdata = require("tzdata");

var _tz = timezoneJS.timezone;
_tz.loadingScheme = _tz.loadingSchemes.MANUAL_LOAD;
_tz.loadZoneDataFromObject(tzdata);

const lib = require('./lib.js');
const conf = require('./config.json') || require('./config.example.json');

var identity;
if (conf.username && conf.password) {
    identity = {
        username: conf.username,
        password: conf.password
    };
}

const options = {
    options: {
        debug: true
    },
    connection: {
        reconnect: true
    },
    identity,
    channels: ["#" + process.argv[2]]
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
var startTime = Date.now();
const admins = conf.admins;

// Map a command to a function
var commands = {
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
    '!agdq': agdq,
    '!sgdq': agdq,
    '!gdq': agdq
};

// Message handler
var curr = 0;
function sendMessage(channel, message) {
    var padding = "";
    if (curr === 1) {
        curr = 0;
        padding = " \u206D";
    } else {
        curr = 1;
    }
    return client.say(channel, message + padding).catch(err => {
        console.error(`ERROR: ${err.message}`);
    });
}

client.on('chat', function (channel, user, message, self) {
    setTimeout(function() {
        if (self) return;

        const match = message.match(/(.[a-zA-Z0-9_-]+)(?:\s+(.*))?/);
        if (match !== null) {
            const command = match[1].toLowerCase();
            const args = match[2] ? match[2].trim().split(/\s+/) : [];

            if (commands.hasOwnProperty(command)) {
                channel = channel.substring(1);
                if (admins.includes(user.username)) {
                    user.admin = true;
                } else {
                    user.admin = false;
                }
                message = message.replace(/\u{206d}/ug, "");
                var args2 = [];
                for (let i = 0; i < args.length; i++) {
                    args2.push(args[i].replace(/\u{206d}/ug, ""));
                }
                commands[command](channel, user, message, args2);
            }
        }
    }, 10);
});

// Join / Leave
client.on("join", function (channel, username, self) {
    if (self) {
        sendMessage(channel, conf.messages.join);
    }
});

function gtfo(channel, user) {
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

function ping(channel) {
    return sendMessage(channel, "running for " + lib.msToTimeSting(Date.now() - startTime));
}

function list(channel, user, message, args) {
    if (args[0] && args[0] !== '') {
        channel = args[0];
    }
    client.whisper(user.username, `https://tmi.twitch.tv/group/user/${channel}/chatters`);
}

function node(channel) {
    return sendMessage(channel, "i run on node js FeelsGoodMan");
}

function sha512(channel, user, message, args) {
    return sendMessage(channel, require('crypto').createHash('sha512').update(args.join(" ")).digest('hex'));
}

function math(channel, user, message) {
    // escape strings
    var tmp = message.replace(/[\\$'"]/g, "\\$&");
    tmp = tmp.substr(message.indexOf(" ") + 1).split("\"").join("");
    if (tmp.indexOf('import') > -1 || tmp.indexOf('range') > -1 || tmp.indexOf('eye') > -1 ||
        tmp.indexOf('ones') > -1 || tmp.indexOf('tojson') > -1 || tmp.indexOf('topolar') > -1 || tmp.indexOf('zeros') > -1 || tmp.indexOf('distance') > -1 ||
        tmp.indexOf('help') > -1) {
        return sendMessage(channel, `${user.username}, that function is not allowed ariW`);
    }
    if (tmp.indexOf('isPrime') > -1) {
        var tmpP = tmp.replace(/ /g, "").split("isPrime(")[1];
        if (tmp.split("isPrime(")[2]) {
            return sendMessage(channel, `${user.username}, invalid input ariW`);
        } else if ((tmp.match(/\(/g) || []).length != (tmp.match(/\)/g) || []).length) {
            return sendMessage(channel, `${user.username}, invalid input ariW`);
        } else {
            var count;
            try {
                count = (tmpP.match(/\(/g) || []).length;
                count++;
            } catch (e) {
                return sendMessage(channel, `${user.username}, invalid input ariW`);
            }
            var rek = new RegExp("^(?:[^|\\)]*\\\)){" + count.toString() + "}([^|]*)", "gm");
            var keepo = rek.exec(tmpP);
            var vislaud = "";
            keepo.shift();
            for (var i = 0; i < keepo.length; i++) {
                vislaud += keepo[i];
            }
            tmpP = "(" + tmpP.replace(vislaud, "");
            var resultE = true;
            var resultP;
            try {
                resultP = mathjs.eval(tmpP);
                if (resultP == "Infinity" || resultP == "-Infinity" || resultP.toString() == "NaN") {
                    resultE = false;
                }
            } catch (e) {
                resultE = false;
            }
            if (!resultE || resultP.toString().length >= 15) {
                return sendMessage(channel, `${user.username}, can't check if it's a prime number WutFace`);
            } else {
                tmp = "isPrime(" + resultP + ")";
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
        if (result.toString().indexOf('function') > -1) {
            result = `you don't wanna know what that function does ;p`;
        }
        var tmpMess = `${user.username}, ${result}`;
        if (tmpMess.length >= conf.messages.maxLength) {
            return sendMessage(channel, `${user.username}, the result was too long WutFace`);
        } else {
            return sendMessage(channel, tmpMess);
        }
    } catch (e) {
        return sendMessage(channel, `${user.username}, invalid input ariW`);
    }
}

function hug(channel, user, message, args) {
    if (args[0]) {
        if (/^[a-zA-Z0-9_]{1,25}$/.test(args[0])) {
            return sendMessage(channel, `${user.username} hugs ${args[0]} <3`);
        } else {
            return sendMessage(channel, `${user.username}, that is not a valid username ariW`);
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

function version(channel) {
    const keepo = require('./package.json');
    return sendMessage(channel, `${keepo.name} running on v${keepo.version} for ${lib.msToTimeSting(Date.now() - startTime)}`);
}

function agdq(channel, user) {
    const now = new timezoneJS.Date('America/Los_Angeles');

    const E = "SGDQ";

    // Gonna make this better soon™
    const events = {
        "SGDQ": {
            _this: "SGDQ",
            start: new Date(2017, 6, 2, 17, 30),
            till: new Date(2017, 6, 9, 7, 15)
        }
    };

    if (events[E].start.getTime() > now.getTime()) {
        return sendMessage(channel, `${user.username}, ${events[E]._this} will start in ${lib.msToTimeSting(events[E].start.getTime() - now.getTime())} PagChomp`);
    } else if (events[E].till.getTime() > now.getTime()) {
        return lib.getUser.id("gamesdonequick").then(id => {
            lib.getUser.data(id).then(data => {
                return sendMessage(channel, `${user.username}, ${events[E]._this} is live with "${data.game}" PagChomp`);
            }).catch(err => {
                return err;
            });
        }).catch(err => {
            return err;
        });
    } else {
        return sendMessage(channel, `${user.username}, ${events[E]._this} ended FeelsBadMan`);
    }
}
