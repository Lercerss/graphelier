import bigInt from 'big-integer';

export const ENVIRONMENT = 'DEV';
export const APP_NAME = 'Graphelier';
export const ORDERBOOK_SERVICE_BACKEND_PORT = 5050;
export const NEWS_SERVICE_BACKEND_PORT = 8080;
let host = 'localhost';
if (process.env.NODE_ENV === 'production') {
    host = '18.218.121.174';
}
export const BACKEND_WS = `ws://${host}:${ORDERBOOK_SERVICE_BACKEND_PORT}`;
export const ORDERBOOK_SERVICE_BACKEND_URL = `http://${host}:${ORDERBOOK_SERVICE_BACKEND_PORT}`;
export const NEWS_SERVICE_BACKEND_URL = `http://${host}:${NEWS_SERVICE_BACKEND_PORT}`;

export const LEFT_ARROW_KEY_CODE = 37;
export const RIGHT_ARROW_KEY_CODE = 39;
export const TILDE_KEY_CODE = 192;

export const MESSAGE_LIST_DEFAULT_PAGE_SIZE = 20;

export const NANOSECONDS_IN_ONE_MICROSECOND = 10 ** 3;
export const NANOSECONDS_IN_ONE_MILLISECOND = NANOSECONDS_IN_ONE_MICROSECOND * 10 ** 3;
export const NANOSECONDS_IN_ONE_SECOND = NANOSECONDS_IN_ONE_MILLISECOND * 10 ** 3;
export const NANOSECONDS_IN_ONE_MINUTE = NANOSECONDS_IN_ONE_SECOND * 60;
export const NANOSECONDS_IN_ONE_HOUR = NANOSECONDS_IN_ONE_MINUTE * 60;

export const NANOSECONDS_IN_NINE_AND_A_HALF_HOURS = bigInt(9.5 * NANOSECONDS_IN_ONE_HOUR);
export const NANOSECONDS_IN_SIXTEEN_HOURS = bigInt(16 * NANOSECONDS_IN_ONE_HOUR);

export const NANOSECONDS_IN_ONE_DAY = NANOSECONDS_IN_ONE_HOUR * 24;

export const NUM_DATA_POINTS_RATIO = 0.5;

export const TIME_UNITS = ['Messages', 'Seconds', 'Milliseconds', 'Microseconds', 'Nanoseconds'];
export const ANIMATION_TIME = 250;
export const MAXIMUM_PLAYBACK_REAL_TIME_RATE = '5';
export const MAXIMUM_DISABLE_TRANSITIONS_FOR_REAL_TIME_RATE = 1;
export const MAXIMUM_DISABLE_TRANSITIONS_FOR_MESSAGES = 100;
export const PLAYBACK_DELAY = 0.75;
