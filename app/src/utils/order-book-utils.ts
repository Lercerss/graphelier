import {
    Ask, Bid, ListItems, Order, TransactionType,
} from '../models/OrderBook';

/**
 * @desc creates data structure for orderbook with asks on top and bids on bottom
 * given data from the back-end
 * @param asks {Array<Ask>}
 * @param bids {Array<Bid>}
 */
export const processOrderBookFromScratch = (asks: Array<Ask>, bids: Array<Bid>) => {
    const listItems: ListItems = {};
    let firstBid = 0;
    let maxQuantity = 0;

    for (let i = asks.length - 1; i >= 0; i--) {
        let sum = 0;

        listItems[asks[i].price] = {
            ...asks[i],
            type: TransactionType.Ask,
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
            type: TransactionType.Bid,
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
 * @desc Given the orderBook list items stored as an object, returns a render-friendly array
 * @param listItemsObject {ListItems}
 * @returns {any[]}
 */
export const getOrderBookListItemsAsArray = (listItemsObject: ListItems) => {
    return Object.values(listItemsObject).sort((listItem1, listItem2) => listItem2.price - listItem1.price);
};


/**
 * @desc Checks whether two arrays are the same in terms of orders
 * @param ordersArray1 Array<Order>
 * @param ordersArray2 Array<Order>
 */
export const ordersEquals = (ordersArray1: Array<Order>, ordersArray2: Array<Order>) => {
    if (ordersArray1.length !== ordersArray2.length) return false;

    return ordersArray1.every((order, index) => {
        return order.id === ordersArray2[index].id && order.quantity === ordersArray2[index].quantity;
    });
};


/**
 * @desc Given the orderBook list items stored as an object, determines whether the contents are the same
 * @param listItemsObject1 {ListItems}
 * @param listItemsObject2 {ListItems}
 */
export const listItemsEquals = (listItemsObject1: ListItems, listItemsObject2: ListItems) => {
    const listItems1 = getOrderBookListItemsAsArray(listItemsObject1);
    const listItems2 = getOrderBookListItemsAsArray(listItemsObject2);

    if (listItems1.length !== listItems2.length) return false;

    return listItems1.every(listItem => {
        if (listItem) {
            const siblingListItem = listItemsObject2[listItem.price];
            const { orders } = listItem;
            if (!siblingListItem) return false;
            const siblingOrders = siblingListItem.orders;

            return (
                siblingListItem
                && listItem.type === siblingListItem.type
                && ordersEquals(siblingOrders, orders)
            );
        }
        return false;
    });
};

/**
 * @desc Given a single price with new orders, updates listItems object with new value for that price
 * @param type {TransactionType}
 * @param newArray {}
 * @param listItems {ListItems}
 * @returns {*}
 */
const updateListItems = (type: TransactionType, newArray: Array<Ask|Bid>, listItems: ListItems) => {
    const newListItems = listItems;

    if (!newArray) {
        return newListItems;
    }
    newArray.forEach(askOrBid => {
        const { price, orders } = askOrBid;
        if (orders.length === 0) delete newListItems[price]; // Remove price level
        else if (listItems[price]) {
            newListItems[price].orders = orders; // Modify price level
        } else {
            newListItems[price] = { // Add price level
                price,
                orders,
                type,
                isMiddle: false,
            };
        }
    });
    return newListItems;
};

/**
 * @desc Processes existing listItems to compute new max quantity and new middle
 * @param currentListItems {ListItems}
 * @param newAsks {Array<Ask>}
 * @param newBids {Array<Bid>}
 * @returns {{newMaxQuantity: number, newListItems: {ListItems}}}
 */
export const processOrderBookWithDeltas = (
    currentListItems: ListItems,
    newAsks: Array<Ask>,
    newBids: Array<Bid>,
) => {
    let firstBid = 0;
    let maxQuantity = 0;

    let updatedListItems = updateListItems(TransactionType.Ask, newAsks, currentListItems);
    updatedListItems = updateListItems(TransactionType.Bid, newBids, updatedListItems);

    Object.keys(updatedListItems).forEach(key => {
        const priceLevel = key;
        const sum = updatedListItems[priceLevel].orders.reduce(
            (totalQuantity, order) => (totalQuantity + parseInt(order.quantity)), 0,
        );
        if (sum > maxQuantity) maxQuantity = sum; // Compute max quantity

        if (updatedListItems[priceLevel].type === TransactionType.Bid) { // Determine middle element
            updatedListItems[priceLevel].isMiddle = firstBid++ === 0;
        } else updatedListItems[priceLevel].isMiddle = false;
    });

    return { newListItems: updatedListItems, newMaxQuantity: maxQuantity };
};

/**
 * @desc based on values for direction returned by the backend, returns verbose direction
 * @param direction {number}
 * @returns {string}
 */
export const getMessageDirection = (direction: number) => {
    return (direction === 1) ? 'Bid' : 'Ask';
};

/**
 * @desx Checks to see if price level exists
 * @param price {number}
 * @param listItems {ListItem}
 * @returns {boolean}
 */
export const priceLevelExists = (price: number, listItems: ListItems) => {
    return !!listItems[price];
};

/**
 * Checks to see if a price level exists, and creates the price level if it does not.
 *
 * @param price {number}
 * @param listItems {ListItems}
 * @param direction {TransactionType.Ask | TransactionType.Bid}
 * @returns {ListItems}
 */
export const checkCreatePriceLevel = (price: number, listItems: ListItems,
    type: TransactionType.Ask | TransactionType.Bid) => {
    const updatedListItems = { ...listItems };
    if (!priceLevelExists(price, updatedListItems)) {
        updatedListItems[price] = {
            price,
            orders: [],
            type,
            isMiddle: false,
        };
    }
    return updatedListItems;
};

/**
 * Checks to see if the price level needs to be removed from the ListItems because there are no more orders for that
 * level
 * @param price {number}
 * @param listItems {ListItems}
 * @returns {ListItems}
 */
export const checkDeletePriceLevel = (price: number, listItems: ListItems) => {
    const updatedListItems = { ...listItems };
    if (updatedListItems[price].orders.length === 0) delete updatedListItems[price];
    return updatedListItems;
};

const _ = require('lodash');

/**
 * @desc Processes existing listItems to compute new max quantity and new middle (for playback)
 * @param listItems {ListItems}
 * @returns {{newMaxQuantity: number, newListItems: {ListItems}}}
 */
export const processOrderBookPlayback = (listItems: ListItems) => {
    let maxQuantity = 0;
    let currentMiddlePriceLevel = 0;
    const updatedListItems = _.cloneDeep(listItems);
    Object.keys(updatedListItems).forEach(key => {
        const priceLevel = key;
        if (updatedListItems[priceLevel].type === TransactionType.Bid
            && parseFloat(priceLevel) > currentMiddlePriceLevel) currentMiddlePriceLevel = parseFloat(priceLevel);
        const sum = updatedListItems[priceLevel].orders.reduce(
            (totalQuantity, order) => (totalQuantity + parseInt(order.quantity)), 0,
        );
        if (sum > maxQuantity) maxQuantity = sum;
        updatedListItems[priceLevel].isMiddle = false;
    });
    if (updatedListItems[currentMiddlePriceLevel]) updatedListItems[currentMiddlePriceLevel].isMiddle = true;
    return { newListItems: updatedListItems, newMaxQuantity: maxQuantity };
};
