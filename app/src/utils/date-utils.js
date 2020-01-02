import NanoDate from 'nano-date';
import moment from 'moment';
import bigInt from 'big-integer';

import {
    NANOSECONDS_IN_ONE_SECOND,
    NANOSECONDS_IN_ONE_DAY,
    NANOSECONDS_IN_ONE_MILLISECOND,
} from '../constants/Constants';

const EDT_TIMEZONE_OFFSET_IN_MINUTES = 240;

/**
 * @desc Given a utc date string in the format YYYY-MM-DD HH:mm:ssZ, returns epoch time in nanoseconds
 * @param date
 * @returns {bigInt}
 */
export const dateStringToEpoch = date => {
    const dateObj = moment.utc(date);
    const nanoDate = new NanoDate(dateObj.valueOf());
    return bigInt(nanoDate.getTime());
};

/**
 * @desc Given an amount of time in nanoseconds, returns time string in the format HH:mm:ssZ
 * @param nanosecondTimestamp {Number}
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
 * @param nanosecondTimestamp {bigInt}
 * @returns {bigInt}
 */
export const convertNanosecondsToUTC = nanosecondTimestamp => {
    const offsetNS = bigInt(EDT_TIMEZONE_OFFSET_IN_MINUTES) * bigInt(60 * 10 ** 9);
    return nanosecondTimestamp + offsetNS;
};

/**
 * @desc Given a timestamp in nanoseconds UTC, returns the timestamp for current timezone
 * @param nanosecondTimestamp {bigInt}
 * @returns {bigInt}
 */
export const convertNanosecondsUTCToCurrentTimezone = nanosecondTimestamp => {
    const offsetNS = bigInt(EDT_TIMEZONE_OFFSET_IN_MINUTES) * bigInt(60 * 10 ** 9);
    return nanosecondTimestamp - offsetNS;
};

/**
 * @desc Given a nanosecond epoch date, returns time string in the format YYYY-MM-DD
 * @param nanosecondDate {bigInt}
 * @returns {string}
 */
export const epochToDateString = nanosecondDate => {
    // We only need day precision, so get the date in milliseconds
    const millisecondDate = nanosecondDate.over(bigInt(NANOSECONDS_IN_ONE_MILLISECOND));
    return moment.utc(Number(millisecondDate)).format('YYYY-MM-DD');
};

/**
 * @desc Given a nanosecond epoch timestamp, returns an object with date nanoseconds and time nanoseconds
 * @param nanosecondTimestamp string
 * @returns {{timeNanoseconds: Number, dateNanoseconds: bigInt}} The timestamp split into its date
 * nanoseconds and its time in nanoseconds
 */
export const splitNanosecondEpochTimestamp = nanosecondTimestamp => {
    const timestamp = bigInt(nanosecondTimestamp);
    const timeNanoseconds = timestamp.mod(bigInt(NANOSECONDS_IN_ONE_DAY));
    const dateNanoseconds = timestamp.minus(timeNanoseconds);
    return {
        timeNanoseconds: Number(timeNanoseconds),
        dateNanoseconds,
    };
};
