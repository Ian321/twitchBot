/*
  Custom library
*/
const got = require('got');
const conf = require('./config.json');

function msToTimeString (ms) {
	// This functions converts ms to a human friendly string.
	var sec = Math.floor(ms / 1000);
	var days = Math.floor(sec / 86400);
	var hours = Math.floor(sec / 3600 % 60 % 60 % 24);
	var mins = Math.floor(sec / 60 % 60);
	var secs = Math.floor(sec % 60);
	var time = "";
	if (days >= 2) {
		time += days + " days";
	} else if (days >= 1) {
		time += days + " day";
	}
	if (days >= 1 && ((hours >= 1 && mins >= 1) || (hours >= 1 && secs >= 1) || (mins >= 1 && secs >= 1))) {
		time += ", ";
	} else if (days >= 1 && (hours >= 1 || mins >= 1 || secs >= 1)) {
		time += " and ";
	}
	if (hours >= 2) {
		time += hours + " hours";
	} else if (hours >= 1) {
		time += hours + " hour";
	}
	if (hours >= 1 && mins >= 1 && secs >= 1) {
		time += ", ";
	} else if (hours >= 1 && (mins >= 1 || secs >= 1)) {
		time += " and ";
	}
	if (mins >= 2) {
		time += mins + " minutes";
	} else if (mins >= 1) {
		time += mins + " minute";
	}
	if (mins >= 1 && secs >= 1) {
		time += " and ";
	}
	if (secs >= 2) {
		time += secs + " seconds";
	} else if (secs >= 1) {
		time += secs + " second";
	}
	return time;
}
function stringToHex (str) {
	var out = "";
	for (var i = 0, len = str.length; i < len; i++) {
		out = out + "\\x" + str.charCodeAt(i).toString(16);
	}
	return out;
}
const getUser =  {
	id: function (name) {
		return got.get(`https://api.twitch.tv/kraken/users?login=${name}`, {
			json: true,
			headers: {
				Accept: "application/vnd.twitchtv.v5+json",
				"client-id": conf.clientID || ""
			}
		}).then(res => {
			return res.body.users[0]._id;
		}).catch(err => {
			console.error(`Could not get id for '${name}'`);
			return err;
		});
	},
	data: function (id) {
		return got.get(`https://api.twitch.tv/kraken/streams/${id}`, {
			json: true,
			headers: {
				Accept: "application/vnd.twitchtv.v5+json",
				"client-id": conf.clientID || ""
			}
		}).then(res => {
			return res.body;
		}).catch(err => {
			console.error(`Could not get date for '${id}'`);
			return err;
		});
	}
}
function setLongTimeout (callback, timeout_ms) {
	if (timeout_ms > 2147483647) {
		setTimeout(function () {
			setLongTimeout(callback, (timeout_ms - 2147483647));
		}, 2147483647);
	} else {
		setTimeout(callback, timeout_ms);
	}
}

module.exports = {
	msToTimeString,
	stringToHex,
	getUser,
	setLongTimeout
};
