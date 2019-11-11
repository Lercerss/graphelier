export const DATE_STRING = '2012-06-21';
export const DATE_VALUE = BigInt(1340236800000000000); // 2012-06-21 UTC in epoch nanoseconds
export const TIME_STRING = '12:00:00.000000000';
export const TIME_VALUE = BigInt(43200000000000); // number of nanoseconds in 12 hours
export const TIMESTAMP = 1340280000000000000; // 2012-06-21 at 12 pm
export const LAST_SOD_OFFSET = '3';

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
        type: 'bid',
        orders: ORDER_BOOK_FROM_BACKEND.bids[0].orders,
    },
    [ORDER_BOOK_FROM_BACKEND.asks[0].price]: {
        price: ORDER_BOOK_FROM_BACKEND.asks[0].price,
        isMiddle: true,
        type: 'ask',
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
