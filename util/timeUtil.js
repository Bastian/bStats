/*
 * NOTE:
 * tms2000 means 'Thirty minutes since 2000'.
 * It's the same idea like timestamps, but an other starting point and a different interval.
 */

/**
 * Converts a date to a tms2000 value.
 *
 * @param {Date} date The date to convert.
 * @returns {number} The tms2000 value.
 */
function dateToTms2000(date) {
    let past = new Date(2000, 1, 1, 0, 0, 0, 0).getTime();
    return ((date - past) / (1000*60*30) | 0);
}

/**
 * Converts tms2000 tp date.
 *
 * @param tms2000 The tms2000 value.
 * @returns {Date} The date.
 */
function tms2000ToDate(tms2000) {
    let past = new Date(2000, 1, 1, 0, 0, 0, 0).getTime();
    return new Date(past + tms2000 * 1000*60*30);
}

// Exports
module.exports.dateToTms2000 = dateToTms2000;
module.exports.tms2000ToDate = tms2000ToDate;