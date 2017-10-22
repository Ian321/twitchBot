/*
  Custom library
*/
const got = require('got');
const conf = require('./config.json');

function msToTimeString(ms) {
  // This functions converts ms to a human friendly string.
  const sec = Math.floor(ms / 1000);
  const days = Math.floor(sec / 86400);
  const hours = Math.floor((sec / 3600) % 60 % 60 % 24);
  const mins = Math.floor((sec / 60) % 60);
  const secs = Math.floor(sec % 60);
  let time = '';
  if (days >= 2) {
    time += `${days} days`;
  } else if (days >= 1) {
    time += `${days} day`;
  }
  if (days >= 1 && ((hours >= 1 && mins >= 1) || (hours >= 1 && secs >= 1) || (mins >= 1 && secs >= 1))) {
    time += ', ';
  } else if (days >= 1 && (hours >= 1 || mins >= 1 || secs >= 1)) {
    time += ' and ';
  }
  if (hours >= 2) {
    time += `${hours} hours`;
  } else if (hours >= 1) {
    time += `${hours} hour`;
  }
  if (hours >= 1 && mins >= 1 && secs >= 1) {
    time += ', ';
  } else if (hours >= 1 && (mins >= 1 || secs >= 1)) {
    time += ' and ';
  }
  if (mins >= 2) {
    time += `${mins} minutes`;
  } else if (mins >= 1) {
    time += `${mins} minute`;
  }
  if (mins >= 1 && secs >= 1) {
    time += ' and ';
  }
  if (secs >= 2) {
    time += `${secs} seconds`;
  } else if (secs >= 1) {
    time += `${secs} second`;
  }
  return time;
}
function stringToHex(str) {
  let out = '';
  for (let i = 0, len = str.length; i < len; i++) {
    out = `${out}\\x${str.charCodeAt(i).toString(16)}`;
  }
  return out;
}
const getUser = {
  id(name) {
    return got.get(`https://api.twitch.tv/kraken/users?login=${name}`, {
      json: true,
      headers: {
        Accept: 'application/vnd.twitchtv.v5+json',
        'client-id': conf.clientID || ''
      }
    }).then(res => res.body.users[0]._id).catch(err => {
      console.error(`Could not get id for '${name}'`);
      return err;
    });
  },
  data(id) {
    return got.get(`https://api.twitch.tv/kraken/streams/${id}`, {
      json: true,
      headers: {
        Accept: 'application/vnd.twitchtv.v5+json',
        'client-id': conf.clientID || ''
      }
    }).then(res => res.body).catch(err => {
      console.error(`Could not get date for '${id}'`);
      return err;
    });
  }
};
function setLongTimeout(callback, timeoutMs) {
  if (timeoutMs > 2147483647) {
    setTimeout(() => {
      setLongTimeout(callback, (timeoutMs - 2147483647));
    }, 2147483647);
  } else {
    setTimeout(callback, timeoutMs);
  }
}
function uniqueObjArray(array) {
  const out = [];
  for (let i = 0; i < array.length; i++) {
    const x = JSON.stringify(array[i]);
    if (!out.includes(x)) {
      out.push(x);
    }
  }

  return out.map(element => JSON.parse(element));
}

module.exports = {
  msToTimeString,
  stringToHex,
  getUser,
  setLongTimeout,
  uniqueObjArray
};
