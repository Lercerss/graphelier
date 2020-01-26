export const ENVIRONMENT = 'DEV';
export const APP_NAME = 'Graphelier';
export const BACKEND_PORT = 5050;
let host = 'localhost';
if (process.env.NODE_ENV === 'production') {
    host = '18.218.121.174';
}
export const BACKEND_URL = `http://${host}:${BACKEND_PORT}`;

export const LEFT_ARROW_KEY_CODE = 37;
export const RIGHT_ARROW_KEY_CODE = 39;

export const MESSAGE_LIST_DEFAULT_PAGE_SIZE = 20;

export const NANOSECONDS_IN_NINE_AND_A_HALF_HOURS = 34200000000000;
export const NANOSECONDS_IN_SIXTEEN_HOURS = 57600000000000;
export const NANOSECONDS_IN_ONE_SECOND = 1000000000;
export const NANOSECONDS_IN_ONE_DAY = 86400000000000;
export const NANOSECONDS_IN_ONE_MILLISECOND = 1000000;
