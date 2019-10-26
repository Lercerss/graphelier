import * as ACTION_TYPES from './types';

export const saveReactAppName = (name) => {
    return {
        type: ACTION_TYPES.SAVE_REACT_APP_NAME,
        payload: name
    };
};

export const saveOrderBook = (orderBook) => {
    return {
        type: ACTION_TYPES.SAVE_ORDER_BOOK,
        payload: {orderBook}
    };
};

export const saveSinglePriceLevel = (price, priceLevelObject) => {
    return {
        type: ACTION_TYPES.SAVE_SINGLE_PRICE_LEVEL,
        payload: {price, priceLevelObject}
    };
};
