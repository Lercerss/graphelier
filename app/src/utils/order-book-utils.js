/**
 * @desc creates data structure for orderbook with asks on top and bids on bottom
 * given data from the back-end
 * @param asks
 * @param bids
 */
export const processOrderBookFromScratch = (asks, bids) => {
    const listItems = {};
    let firstBid = 0;
    let maxQuantity = 0;

    for (let i = asks.length - 1; i >= 0; i--) {
        let sum = 0;

        listItems[asks[i].price] = {
            ...asks[i],
            type: 'ask',
            isMiddle: false,
        };

        asks[i].orders.map(order => {
            sum += order.quantity;
            if (sum > maxQuantity) { maxQuantity = sum; }
        });
    }

    bids.map(bid => {
        let sum = 0;

        listItems[bid.price] = {
            ...bid,
            type: 'bid',
            isMiddle: firstBid++ === 0,
        };

        bid.orders.map(order => {
            sum += order.quantity;
            if (sum > maxQuantity) { maxQuantity = sum; }
        });
    });

    return { listItems, maxQuantity };
};


/**
 * @desc Given the orderBook list items stored as an object in the redux store, return
 * a render-friendly array
 * @param listItemsObject
 * @returns {any[]}
 */
export const getOrderBookListItemsAsArray = listItemsObject => {
    return Object.values(listItemsObject).sort((listItem1, listItem2) => listItem2.price - listItem1.price);
};


/**
 * @desc Give the orderBook list items stored as an object in the redux store, determines whether
 * or not the contents are the same
 * @param listItemsObject1 {}
 * @param listItemsObject2 {}
 */
export const listItemsEquals = (listItemsObject1, listItemsObject2) => {
    const listItems1 = getOrderBookListItemsAsArray(listItemsObject1);
    const listItems2 = getOrderBookListItemsAsArray(listItemsObject2);

    if (listItems1.length !== listItems2.length) return false;

    return !listItems1.some(listItem => {
        if (listItem) {
            const siblingListItem = listItemsObject2[listItem.price];
            const { orders } = listItem;
            const siblingOrders = siblingListItem.orders;

            return (
                !siblingListItem
                || listItem.type !== siblingListItem.type
                || orders.length !== siblingOrders.length);
        }
        return false;
    });
};


/**
 * @desc Checks whether two arrays are the same in terms of orders
 * @param ordersArray1
 * @param ordersArray2
 */
export const ordersEquals = (ordersArray1, ordersArray2) => {
    if (ordersArray1.length !== ordersArray2.length) return false;

    return ordersArray1.every((order, index) => {
        return order.id === ordersArray2[index].id && order.quantity === ordersArray2[index].quantity;
    });
};
