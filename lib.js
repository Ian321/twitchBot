/*
  Custom library
*/
const got = require('got');
const {create, all} = require('mathjs');

const conf = require('./config.json') || require('./config.example.json'); // eslint-disable-line

const mathjs = create(all);
mathjs.config({ number: 'BigNumber' });

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
async function getUserData(id) {
  const { body } = await got.get(`https://api.twitch.tv/kraken/streams/${id}`, {
    json: true,
    headers: {
      Accept: 'application/vnd.twitchtv.v5+json',
      'client-id': conf.clientID || ''
    }
  });
  if (!body.stream) {
    const data = await got.get(`https://api.twitch.tv/kraken/users/${id}`, {
      json: true,
      headers: {
        Accept: 'application/vnd.twitchtv.v5+json',
        'client-id': conf.clientID || ''
      }
    });
    const body2 = data.body;
    body.stream = {
      channel: body2
    };
  }
  return body;
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
  data: getUserData
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
/**
 * @param {string} e
 */
function mathEval(e) {
  // escape strings
  let tmp = e.replace(/[\\$'"]/g, '\\$&');
  tmp = tmp.substr(e.indexOf(' ') + 1).split('"').join('');
  if (tmp.indexOf('import') > -1 || tmp.indexOf('range') > -1 || tmp.indexOf('eye') > -1 ||
        tmp.indexOf('ones') > -1 || tmp.indexOf('tojson') > -1 || tmp.indexOf('topolar') > -1 ||
        tmp.indexOf('zeros') > -1 || tmp.indexOf('distance') > -1 || tmp.indexOf('help') > -1) {
    return 'that function is not allowed ariW';
  }
  // Fix multiple isPrime
  if (tmp.indexOf('isPrime') > -1) {
    let tmpP = tmp.replace(/ /g, '').split('isPrime(')[1];
    if (tmp.split('isPrime(')[2]) {
      return 'invalid input ariW';
    } else if ((tmp.match(/\(/g) || []).length !== (tmp.match(/\)/g) || []).length) {
      return 'invalid input ariW';
    }
    let count;
    try {
      count = (tmpP.match(/\(/g) || []).length;
      count++;
    } catch (err) {
      return 'invalid input ariW';
    }
    const rek = new RegExp(`^(?:[^|\\)]*\\)){${count.toString()}}([^|]*)`, 'gm');
    const keepo = rek.exec(tmpP);
    let vislaud = '';
    keepo.shift();
    for (let i = 0; i < keepo.length; i++) {
      vislaud += keepo[i];
    }
    tmpP = `(${tmpP.replace(vislaud, '')}`;
    let resultE = true;
    let resultP;
    try {
      resultP = mathjs.eval(tmpP);
      if (resultP.toString() === 'Infinity' || resultP.toString() === '-Infinity' || resultP.toString() === 'NaN') {
        resultE = false;
      }
    } catch (err) {
      resultE = false;
    }
    if (!resultE || resultP.toString().length >= 15) {
      return 'can\'t check if it\'s a prime number WutFace';
    }
    tmp = `isPrime(${resultP})`;
  }
  // Evaluate the equation
  try {
    let result = mathjs.eval(tmp);
    result = result.toString();
    // Check if its repeating the same number (twitch chat doesn't like that)
    if (result.match(/(.)\1+$/) && result.match(/(.)\1+$/)[0] && result.match(/(.)\1+$/)[0].length >= 8) {
      result = result.replace(/(.)\1+$/, (f, $1) => `${$1}${$1}${$1}...`);
    } else {
      const tmp1 = result.split('');
      tmp1.pop();
      const tmp2 = tmp1.join('');
      if (tmp2.match(/(.)\1+$/) && tmp2.match(/(.)\1+$/)[0] && tmp2.match(/(.)\1+$/)[0].length >= 8) {
        result = tmp2.replace(/(.)\1+$/, (f, $1) => `${$1}${$1}${$1}...`);
      }
    }
    if (result === 'Infinity' || result === '-Infinity') {
      result = `WutFace it's '${result}'`;
    } else if (result === 'NaN') {
      result = `NaM it's '${result}'`;
    }
    if (result.indexOf('function') > -1) {
      result = 'you don\'t wanna know what that function does ;p';
    }
    if (result.length + 40 >= conf.messages.maxLength) {
      return 'the result was too long WutFace';
    }
    return result;
  } catch (err) {
    return 'invalid input ariW';
  }
}

module.exports = {
  msToTimeString,
  stringToHex,
  getUser,
  setLongTimeout,
  uniqueObjArray,
  mathEval
};
