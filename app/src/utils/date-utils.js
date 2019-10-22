import NanoDate from 'nano-date';
import moment from 'moment';

import {NANOSECONDS_IN_ONE_SECOND} from '../constants/Constants';

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
 * @desc Given a utc date string in the format YYYY-MM-DD HH:mm:ssZ, returns epoch time in nanoseconds
 * @param date
 * @returns {string}
 */
export const dateStringToEpoch = (date) => {
    const dateObj = moment.utc(date);
    const nanoDate = new NanoDate(dateObj.valueOf());
    return nanoDate.getTime();
};

/**
 * @desc Given a time in nanoseconds, returns time string in the format HH:mm:ssZ
 * @param nanosecondTimestamp
 * @returns {string}
 */
export const nanosecondsToString = (nanosecondTimestamp) => {

    let nanoseconds = Math.floor(nanosecondTimestamp%NANOSECONDS_IN_ONE_SECOND);
    let seconds = Math.floor((nanosecondTimestamp/NANOSECONDS_IN_ONE_SECOND)%60);
    let minutes = Math.floor((nanosecondTimestamp/(NANOSECONDS_IN_ONE_SECOND*60))%60);
    let hours = Math.floor((nanosecondTimestamp/(NANOSECONDS_IN_ONE_SECOND*60*60))%24);

    return hours.toString().padStart(2, '0') + ':' + minutes.toString().padStart(2, '0') + ':' + seconds.toString().padStart(2, '0') + '.' + nanoseconds.toString().padStart(9, '0');
};
