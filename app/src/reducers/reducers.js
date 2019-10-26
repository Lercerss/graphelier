import * as ACTION_TYPES from '../actions/types';
import {updateMaxQuantityInOrderBook} from '../utils/order-book-utils';

const reducers = (state = {}, action) => {

    switch (action.type) {

    case ACTION_TYPES.SAVE_REACT_APP_NAME:
        return {
            ...state,
            appName: action.payload
        };

    case ACTION_TYPES.SAVE_ORDER_BOOK:
        return {
            ...state,
            orderBook: action.payload.orderBook
        };

    case ACTION_TYPES.SAVE_SINGLE_PRICE_LEVEL:
        const newOrderBook = {
            ...state.orderBook,
            listItems: {
                ...state.orderBook.listItems,
                [action.payload.price]: action.payload.priceLevelObject
            }
        };

        updateMaxQuantityInOrderBook(newOrderBook);

        return {
            ...state,
            orderBook: newOrderBook
        };

    default: return state;
    }
};

export default reducers;
