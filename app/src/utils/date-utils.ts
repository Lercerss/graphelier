/**
 * Date and time manipulation utilities for graphelier
 *
 *
 * Notes:
 * Local time of any given timestamp should fall between 09:30 and 16:00 (-1 for DST)
 */

import NanoDate from 'nano-date';
import moment from 'moment';
import bigInt from 'big-integer';

import { zeroLeftPad } from './number-utils';

import {
    NANOSECONDS_IN_ONE_SECOND,
    NANOSECONDS_IN_ONE_DAY,
    NANOSECONDS_IN_ONE_MILLISECOND,
    NANOSECONDS_IN_ONE_HOUR,
    NANOSECONDS_IN_ONE_MINUTE,
    NANOSECONDS_IN_ONE_MICROSECOND,
} from '../constants/Constants';
import { SplitNanosecondTimestamp } from '../models/OrderBook';

const EDT_TIMEZONE_OFFSET_IN_MINUTES = 240;


/**
 * @desc Given an amount of time in nanoseconds, returns time string in the format HH:mm:ssZ
 * @param nanosecondTimestamp {Number}
 * @returns {string}
 */
export const nanosecondsToString = (nanosecondTimestamp: number): string => {
    const nanoseconds = Math.floor(nanosecondTimestamp % NANOSECONDS_IN_ONE_SECOND);
    const seconds = Math.floor((nanosecondTimestamp / NANOSECONDS_IN_ONE_SECOND) % 60);
    const minutes = Math.floor((nanosecondTimestamp / (NANOSECONDS_IN_ONE_SECOND * 60)) % 60);
    let hours = Math.floor((nanosecondTimestamp / (NANOSECONDS_IN_ONE_SECOND * 60 * 60)) % 24);

    let period = 'AM';
    if (hours >= 12) {
        period = 'PM';
        if (hours > 12) {
            hours %= 12;
        }
    }

    return (
        `${hours.toString().padStart(2, '0')
        }:${
            minutes.toString().padStart(2, '0')
        }:${
            seconds.toString().padStart(2, '0')
        }.${
            nanoseconds.toString().padStart(9, '0')} ${period}`
    );
};


/**
 * @desc Given a nanosecond epoch timestamp, returns an object with date nanoseconds and time nanoseconds
 * @param nanosecondTimestamp {bigInt}
 * @returns {{timeNanoseconds: Number, dateNanoseconds: bigInt}} The timestamp split into its date
 * nanoseconds and its time in nanoseconds
 */
export const splitNanosecondEpochTimestamp = (nanosecondTimestamp: bigInt.BigInteger): SplitNanosecondTimestamp => {
    const timeNanoseconds = nanosecondTimestamp.mod(bigInt(NANOSECONDS_IN_ONE_DAY));
    const dateNanoseconds = nanosecondTimestamp.minus(timeNanoseconds);
    return {
        timeNanoseconds: timeNanoseconds.valueOf(),
        dateNanoseconds,
    };
};

/**
 * @desc Given a nanosecond timestamp as a bigInt, returns the bigInt with correct offset based on Date's timezone
 * This function only handles the correction of daylight saving time
 * Only needs to be used when handling JavaScript Date Object (Date, NanoDate)
 * @param nanosecondTimestamp
 * @return bigInt.BigInteger
 */
export const applyDSTOffset = (nanosecondTimestamp: bigInt.BigInteger):
    bigInt.BigInteger => {
    const localTimezoneDate = new NanoDate(nanosecondTimestamp.toString());
    const localTimezoneOffsetInMinutes = localTimezoneDate.getTimezoneOffset();
    return nanosecondTimestamp.plus(
        (localTimezoneOffsetInMinutes - EDT_TIMEZONE_OFFSET_IN_MINUTES) * NANOSECONDS_IN_ONE_MINUTE,
    );
};

/**
 * @desc Given a NanoDate object (used in graph), returns bigInt timestamp needed for back-end interaction
 * Removes DST offset applied on timestamp for Date and NanoDate objects usage
 * @pre timestamp must have gone through applyDSTOffset
 * @return bigInt.BigInteger
 */
export const removeDSTOffsetFromNanoDate = (graphDate: NanoDate): bigInt.BigInteger => {
    return bigInt(graphDate.getTime())
        .minus((graphDate.getTimezoneOffset() - EDT_TIMEZONE_OFFSET_IN_MINUTES) * NANOSECONDS_IN_ONE_MINUTE);
};

/**
 * @desc Given a timestamp in nanoseconds, returns the timestamp converted to UTC (epoch)
 * @param nanosecondTimestamp {bigInt}
 * @returns {bigInt}
 */
export const convertNanosecondsToUTC = (nanosecondTimestamp: bigInt.BigInteger) : bigInt.BigInteger => {
    const offsetNS = bigInt(EDT_TIMEZONE_OFFSET_IN_MINUTES).times(bigInt(60 * 10 ** 9));
    return nanosecondTimestamp.plus(offsetNS);
};


/**
 * @desc Given a utc date string in the format YYYY-MM-DD HH:mm:ssZ, returns epoch time in nanoseconds
 * @param date: string
 * @returns {bigInt}
 */
export const dateStringToEpoch = (date: string): bigInt.BigInteger => {
    const dateObj = moment.utc(date);
    const nanoDate: NanoDate = new NanoDate(dateObj.valueOf());
    return convertNanosecondsToUTC(bigInt(nanoDate.getTime()));
};


/**
 * @desc Given a NanoDate object, recreates a string representation of format HH:mm:SS:llluuunnn
 * @param nanoDate
 * @return string
 */
export const buildTimeInTheDayStringFromNanoDate = (nanoDate: NanoDate): string => {
    return ''
        .concat(zeroLeftPad(nanoDate.getHours(), 2))
        .concat(':')
        .concat(zeroLeftPad(nanoDate.getMinutes(), 2))
        .concat(':')
        .concat(zeroLeftPad(nanoDate.getSeconds(), 2))
        .concat(':')
        .concat(zeroLeftPad(nanoDate.getMilliseconds(), 3))
        .concat(zeroLeftPad(nanoDate.getMicroseconds(), 3))
        .concat(zeroLeftPad(nanoDate.getNanoseconds(), 3));
};


/**
 * @desc Given an epoch timestamp, returns the local time string in the format HH:mm:SS:llluuunnn
 * Since this displays based on a Date object, requires DST offset handling
 * @param nanosecondTimestamp {string}
 * @returns {string}
 */
export const getLocalTimeString = (nanosecondTimestamp: string) : string => {
    const timestamp = applyDSTOffset(bigInt(nanosecondTimestamp));
    const nanoDateObj: NanoDate = new NanoDate(timestamp.toString());
    return buildTimeInTheDayStringFromNanoDate(nanoDateObj);
};


/**
 * @desc Given a full blown NanoDate object, returns the nanoseconds since the start of that day
 * @param exact {NanoDate}
 * @return {number} integer
 */
export const getNsSinceSod = (exact: NanoDate): number => {
    const nanoHours: number = exact.getHours() * NANOSECONDS_IN_ONE_HOUR;
    const nanoMins: number = exact.getMinutes() * NANOSECONDS_IN_ONE_MINUTE;
    const nanoSecs: number = exact.getSeconds() * NANOSECONDS_IN_ONE_SECOND;
    const nanoMillis: number = exact.getMilliseconds() * NANOSECONDS_IN_ONE_MILLISECOND;
    const nanoMicros: number = exact.getMicroseconds() * NANOSECONDS_IN_ONE_MICROSECOND;
    const nanos: number = exact.getNanoseconds();

    return nanoHours + nanoMins + nanoSecs + nanoMillis + nanoMicros + nanos;
};


/**
 * @desc Given a NanoDate object, returns a new NanoDate corresponding to the start of that day
 * @param nanoDate {NanoDate}
 * @return sodNanoDate {NanoDate}
 */
export const getSodNanoDate = (nanoDate: NanoDate): NanoDate => {
    const sodNanoDate: NanoDate = new NanoDate(nanoDate);
    sodNanoDate.setHours(0);
    sodNanoDate.setMinutes(0);
    sodNanoDate.setSeconds(0);
    sodNanoDate.setMilliseconds(0);
    sodNanoDate.setMicroseconds(0);
    sodNanoDate.setNanoseconds(0);
    return sodNanoDate;
};


/**
 * @desc Given an integer representing nanoseconds since start of the day and the NanoDate object
 * for that start of day, returns exact NanoDate
 * @param nsSinceSod {number}
 * @param sodNanoDate {NanoDate}
 * @return nanoDate {NanoDate}
 */
export const getNanoDateFromNsSinceSod = (nsSinceSod: number, sodNanoDate: NanoDate): NanoDate => {
    let nsSinceSodAgg: number = nsSinceSod;

    const hours: number = Math.floor(nsSinceSodAgg / NANOSECONDS_IN_ONE_HOUR);
    nsSinceSodAgg -= (hours * NANOSECONDS_IN_ONE_HOUR);

    const mins: number = Math.floor(nsSinceSodAgg / NANOSECONDS_IN_ONE_MINUTE);
    nsSinceSodAgg -= (mins * NANOSECONDS_IN_ONE_MINUTE);

    const secs: number = Math.floor(nsSinceSodAgg / NANOSECONDS_IN_ONE_SECOND);
    nsSinceSodAgg -= (secs * NANOSECONDS_IN_ONE_SECOND);

    const millis: number = Math.floor(nsSinceSodAgg / NANOSECONDS_IN_ONE_MILLISECOND);
    nsSinceSodAgg -= (millis * NANOSECONDS_IN_ONE_MILLISECOND);

    const micros: number = Math.floor(nsSinceSodAgg / NANOSECONDS_IN_ONE_MICROSECOND);
    nsSinceSodAgg -= (micros * NANOSECONDS_IN_ONE_MICROSECOND);

    const nanos: number = Math.floor(nsSinceSodAgg);

    const nanoDate = new NanoDate(sodNanoDate);
    nanoDate.setHours(hours);
    nanoDate.setMinutes(mins);
    nanoDate.setSeconds(secs);
    nanoDate.setMilliseconds(millis);
    nanoDate.setMicroseconds(micros);
    nanoDate.setNanoseconds(nanos);

    return nanoDate;
};

/**
 * @desc Given a timestamp, recreates a string representation of format HH:mm
 * @param timestamp
 * @return string
 */
export const getHoursMinutesStringFromTimestamp = (timestamp: bigInt.BigInteger): string => {
    const nanoDate = new NanoDate(applyDSTOffset(timestamp).toString());

    let hours = nanoDate.getHours();
    let period = 'AM';
    if (hours >= 12) {
        period = 'PM';
        if (hours > 12) {
            hours %= 12;
        }
    }

    return ''
        .concat(zeroLeftPad(hours, 2))
        .concat(':')
        .concat(zeroLeftPad(nanoDate.getMinutes(), 2))
        .concat(` `)
        .concat(period);
};

/**
 * @desc Given a epoch timestamp, recreates a string representation of format MM DD YYYY
 * @param timestamp
 * @return string
 */
export const getDateStringFromTimestamp = (timestamp: bigInt.BigInteger): string => {
    const nanoDate = new NanoDate(applyDSTOffset(timestamp).toString());
    const month = nanoDate.toLocaleString('default', { month: 'short' });

    return ''
        .concat(month)
        .concat(' ')
        .concat(zeroLeftPad(nanoDate.getDate(), 2))
        .concat(' ')
        .concat(nanoDate.getFullYear().toString());
};
