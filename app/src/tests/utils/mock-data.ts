import bigInt from 'big-integer';
import moment from 'moment';
import { TransactionType } from '../../models/OrderBook';

export const DATE_STRING = '21/06/2012';
export const DATE_MOMENT = moment('2012-06-21');
export const INSTRUMENT = 'SPY';
export const DATE_VALUE_BIG_INT = bigInt(1340251200000000000); // 2012-06-21 (local 12 AM) nanoseconds (bigInt)
export const TIME_STRING = '03:00:00.000000000 PM';
export const TIME_VALUE_BIG_INT = bigInt(54000000000000); // number of nanoseconds in 15 hours (bigInt)
export const TIMESTAMP_PM = bigInt(1340305200000000000); // 2012-06-21 at 3:00 pm (local) nanoseconds (bigInt)
export const TIMESTAMP = 1340280000000000000; // 2012-06-21 at 12 pm
export const LAST_SOD_OFFSET = '3';
export const LAST_SOD_OFFSET_CLIENT = bigInt(3);
export const MAX_QUANTITY = 20000;

export const ORDER_BOOK_FROM_BACKEND = {
    timestamp: TIMESTAMP,
    last_sod_offset: LAST_SOD_OFFSET,
    asks: [
        {
            price: 135.66,
            orders: [
                {
                    id: 20933587,
                    quantity: 598,
                },
                {
                    id: 20933637,
                    quantity: 2100,
                },
                {
                    id: 20933660,
                    quantity: 100,
                },
                {
                    id: 20933765,
                    quantity: 500,
                },
                {
                    id: 20934279,
                    quantity: 500,
                },
                {
                    id: 20935227,
                    quantity: 200,
                },
                {
                    id: 20935254,
                    quantity: 400,
                },
                {
                    id: 20940093,
                    quantity: 300,
                },
                {
                    id: 20940094,
                    quantity: 300,
                },
            ],
        }],
    bids: [
        {
            price: 135.67,
            orders: [
                {
                    id: 20893582,
                    quantity: 500,
                },
                {
                    id: 20899019,
                    quantity: 200,
                },
                {
                    id: 20918337,
                    quantity: 200,
                },
                {
                    id: 20925989,
                    quantity: 200,
                },
                {
                    id: 20932076,
                    quantity: 200,
                },
                {
                    id: 20932681,
                    quantity: 300,
                },
                {
                    id: 20933327,
                    quantity: 500,
                },
                {
                    id: 20933369,
                    quantity: 100,
                },
                {
                    id: 20933576,
                    quantity: 800,
                },
                {
                    id: 20933674,
                    quantity: 100,
                },
                {
                    id: 20933675,
                    quantity: 100,
                },
                {
                    id: 20933736,
                    quantity: 300,
                },
                {
                    id: 20933763,
                    quantity: 5300,
                }],
        }],
};

export const MESSAGE_DELTAS_FROM_BACKEND_MODIFY = {
    timestamp: TIMESTAMP,
    last_sod_offset: LAST_SOD_OFFSET,
    asks: [
        {
            price: 135.66,
            orders: [
                {
                    id: 20933587,
                    quantity: 9000,
                },
            ],
        }],
    bids: [],
};

export const MESSAGE_DELTAS_FROM_BACKEND_REMOVE = {
    timestamp: TIMESTAMP,
    last_sod_offset: LAST_SOD_OFFSET,
    asks: [
        {
            price: 135.66,
            orders: [],
        }],
    bids: [],
};

export const MESSAGE_DELTAS_FROM_BACKEND_ADD = {
    timestamp: TIMESTAMP,
    last_sod_offset: LAST_SOD_OFFSET,
    asks: [
        {
            price: 135.68,
            orders: [
                {
                    id: 20933587,
                    quantity: 598,
                },
            ],
        }],
    bids: [],
};

export const ORDER_BOOK_LIST_ITEMS = {
    [ORDER_BOOK_FROM_BACKEND.bids[0].price]: {
        price: ORDER_BOOK_FROM_BACKEND.bids[0].price,
        isMiddle: false,
        type: TransactionType.Bid,
        orders: ORDER_BOOK_FROM_BACKEND.bids[0].orders,
    },
    [ORDER_BOOK_FROM_BACKEND.asks[0].price]: {
        price: ORDER_BOOK_FROM_BACKEND.asks[0].price,
        isMiddle: true,
        type: TransactionType.Ask,
        orders: ORDER_BOOK_FROM_BACKEND.asks[0].orders,
    },
};

export const MESSAGE_LIST = {
    pageInfo: {
        nMessages: 30,
        sod_offset: LAST_SOD_OFFSET,
    },
    messages: [
        {
            instrument: 'SPY',
            timestamp: TIMESTAMP,
            message_type: 1,
            order_id: 20933587,
            share_qty: 598,
            price: 135.66,
            direction: -1,
            sod_offset: LAST_SOD_OFFSET,
        },
        {
            instrument: 'SPY',
            timestamp: TIMESTAMP,
            message_type: 1,
            order_id: 20933587,
            share_qty: 2100,
            price: 135.66,
            direction: -1,
            sod_offset: LAST_SOD_OFFSET,
        },
    ],
};

export const MESSAGE_INFORMATION = {
    instrument: 'SPY',
    id: 20933587,
    quantity: 598,
    price: 135.66,
    last_modified: '1577896319710937222',
    created_on: '1577896319710937222',
    messages: [
        {
            instrument: 'SPY',
            timestamp: TIMESTAMP,
            message_type: 1,
            order_id: 20933587,
            share_qty: 598,
            price: 135.66,
            direction: -1,
            sod_offset: LAST_SOD_OFFSET,
        },
        {
            instrument: 'SPY',
            timestamp: TIMESTAMP,
            message_type: 1,
            order_id: 20933587,
            share_qty: 2100,
            price: 135.66,
            direction: -1,
            sod_offset: LAST_SOD_OFFSET,
        },
    ],
};
