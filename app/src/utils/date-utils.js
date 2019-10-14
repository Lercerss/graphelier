import NanoDate from 'nano-date';
import moment from 'moment';

/**
 * @desc formats given date in the format YYYY-MM-DD HH:mm:ssZ into human readable at nanosecond precision
 * Strips last information about timezone
 * @param date
 * @returns {string}
 */
export const getFormattedDate = (date) => {

    const dateObj = moment(date);
    const nanoDate = new NanoDate(dateObj.valueOf());
    let entries = nanoDate.toString().split(' ');

    return entries.slice(0, entries.length - 4).join(' ');
};

/**
 * @desc Given a date string in the format YYYY-MM-DD HH:mm:ssZ, returns epoch time in nanoseconds
 * @param date
 * @returns {string}
 */
export const dateStringToEpoch = (date) => {
    const dateObj = moment(date);
    const nanoDate = new NanoDate(dateObj.valueOf());
    return nanoDate.getTime();
};

/**
 * @desc Given a epoch time in nanoseconds, returns time string in the format HH:mm:ssZ
 * @param nanoseconds
 * @returns {string}
 */
export const nanosecondsToEpochTime = (nanoseconds) => {
    const nanoDate = new NanoDate((nanoseconds+5*60*60*1000000000).toString());
    let entries = nanoDate.toString().split(' ');

    return entries[4];
};