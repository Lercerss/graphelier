import {
    GeneralActions, GeneralState, SAVE_REACT_APP_NAME, SAVE_ORDERBOOK_TIMESTAMP, SHOW_ORDER_INFO_DRAWER,
} from '../actions/types';

const initialState : GeneralState = {
    appName: '',
    orderDetails: undefined,
    showOrderInfoDrawer: false,
    currentOrderbookTimestamp: '',
};

const generalReducers = (state = initialState, action : GeneralActions) : GeneralState => {
    switch (action.type) {
    case SAVE_REACT_APP_NAME:
        return {
            ...state,
            appName: action.payload,
        };
    case SAVE_ORDERBOOK_TIMESTAMP:
        return {
            ...state,
            currentOrderbookTimestamp: action.payload,
        };
    case SHOW_ORDER_INFO_DRAWER:
        return {
            ...state,
            showOrderInfoDrawer: action.payload.showOrderInfoDrawer,
            orderDetails: action.payload.orderDetails,
        };
    default: return state;
    }
};

export default generalReducers;
