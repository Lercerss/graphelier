export const ORDER_BOOK_FROM_BACKEND = {
    asks: [
        {
            'price': 135.66,
            'orders': [
                {
                    'id': 20933587,
                    'quantity': 598
                },
                {
                    'id': 20933637,
                    'quantity': 2100
                },
                {
                    'id': 20933660,
                    'quantity': 100
                },
                {
                    'id': 20933765,
                    'quantity': 500
                },
                {
                    'id': 20934279,
                    'quantity': 500
                },
                {
                    'id': 20935227,
                    'quantity': 200
                },
                {
                    'id': 20935254,
                    'quantity': 400
                },
                {
                    'id': 20940093,
                    'quantity': 300
                },
                {
                    'id': 20940094,
                    'quantity': 300
                }
            ]
        }],
    bids: [
        {
            'price': 135.67,
            'orders': [
                {
                    'id': 20893582,
                    'quantity': 500
                },
                {
                    'id': 20899019,
                    'quantity': 200
                },
                {
                    'id': 20918337,
                    'quantity': 200
                },
                {
                    'id': 20925989,
                    'quantity': 200
                },
                {
                    'id': 20932076,
                    'quantity': 200
                },
                {
                    'id': 20932681,
                    'quantity': 300
                },
                {
                    'id': 20933327,
                    'quantity': 500
                },
                {
                    'id': 20933369,
                    'quantity': 100
                },
                {
                    'id': 20933576,
                    'quantity': 800
                },
                {
                    'id': 20933674,
                    'quantity': 100
                },
                {
                    'id': 20933675,
                    'quantity': 100
                },
                {
                    'id': 20933736,
                    'quantity': 300
                },
                {
                    'id': 20933763,
                    'quantity': 5300
                }]
        }]
};

export const ORDER_BOOK_LIST_ITEMS = {
    [ORDER_BOOK_FROM_BACKEND.bids[0].price] : {
        price: ORDER_BOOK_FROM_BACKEND.bids[0].price,
        isMiddle: false,
        type: 'bid',
        orders: ORDER_BOOK_FROM_BACKEND.bids[0].orders
    },
    [ORDER_BOOK_FROM_BACKEND.asks[0].price] : {
        price: ORDER_BOOK_FROM_BACKEND.asks[0].price,
        isMiddle: true,
        type: 'ask',
        orders: ORDER_BOOK_FROM_BACKEND.asks[0].orders
    },

};

export const DATE_STRING = '2012-06-21';
export const DATE_VALUE = 1340236800000000000; // 2012-06-21 UTC in epoch nanoseconds
export const TIME_STRING = '12:00:00.000000000';
export const TIME_VALUE = 43200000000000; // number of nanoseconds in 12 hours
