/*
  Custom library
*/
module.exports = {
  msToTimeSting: function (ms) {
    // This functions converts ms to a human friendly string.
    sec = Math.floor(ms / 1000);
    days = Math.floor(sec / 86400);
		hours= Math.floor(sec / 3600 % 60 % 60 % 24);
		mins = Math.floor(sec / 60 % 60);
		secs = Math.floor(sec % 60);
		time = "";
		if (days >= 2) {
			time += days+" days";
		} else if (days >= 1) {
			time += days+" day";
		}
		if (days >= 1 && ((hours >= 1 && mins >= 1) || (hours >= 1 && secs >= 1) || (mins >= 1 && secs >= 1))) {
			time += ", ";
		} else if (days >= 1 && (hours >= 1 || mins >= 1 || secs >= 1)) {
			time += " and ";
		}
		if (hours >= 2) {
			time += hours+" hours";
		} else if (hours >= 1) {
			time += hours+" hour";
		}
		if (hours >= 1 && mins >= 1 && secs >= 1) {
			time += ", ";
		} else if (hours >= 1 && (mins >= 1 || secs >= 1)) {
			time += " and ";
		}
		if (mins >= 2) {
			time += mins+" minutes";
		} else if (mins >= 1) {
			time += mins+" minute";
		}
		if (mins >= 1 && secs >= 1) {
			time += " and ";
		}
		if (secs >= 2) {
			time += secs+" seconds";
		} else if (secs >= 1) {
			time += secs+" second";
		}
		return time;
  }
};
