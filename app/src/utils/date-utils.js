import NanoDate from 'nano-date';
import moment from 'moment';

import { NANOSECONDS_IN_ONE_SECOND } from '../constants/Constants';

/**
 * @desc Given a utc date string in the format YYYY-MM-DD HH:mm:ssZ, returns epoch time in nanoseconds
 * @param date
 * @returns {string}
 */
export const dateStringToEpoch = date => {
    const dateObj = moment.utc(date);
    const nanoDate = new NanoDate(dateObj.valueOf());
    return nanoDate.getTime();
};

/**
 * @desc Given a time in nanoseconds, returns time string in the format HH:mm:ssZ
 * @param nanosecondTimestamp
 * @returns {string}
 */
export const nanosecondsToString = nanosecondTimestamp => {
    const nanoseconds = Math.floor(nanosecondTimestamp % NANOSECONDS_IN_ONE_SECOND);
    const seconds = Math.floor((nanosecondTimestamp / NANOSECONDS_IN_ONE_SECOND) % 60);
    const minutes = Math.floor((nanosecondTimestamp / (NANOSECONDS_IN_ONE_SECOND * 60)) % 60);
    const hours = Math.floor((nanosecondTimestamp / (NANOSECONDS_IN_ONE_SECOND * 60 * 60)) % 24);

    return (
        `${hours.toString().padStart(2, '0')
        }:${
            minutes.toString().padStart(2, '0')
        }:${
            seconds.toString().padStart(2, '0')
        }.${
            nanoseconds.toString().padStart(9, '0')}`
    );
};

/**
 * @desc Given a timestamp in nanoseconds, returns the timestamp converted to UTC
 * @param nanosecondTimestamp
 * @returns {Number}
 */
export const convertNanosecondsToUTC = nanosecondTimestamp => {
    const offsetNS = new Date().getTimezoneOffset() * 60 * 10 ** 9;
    return nanosecondTimestamp + offsetNS;
};
