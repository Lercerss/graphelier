import {
    GeneralActions, SAVE_ORDERBOOK_TIMESTAMP_INFO, SAVE_REACT_APP_NAME, SET_DISABLE_TRANSITIONS, SHOW_ORDER_INFO_DRAWER,
} from './types';
import { OrderInformationDrawer, SelectedTimestampInfo } from '../models/OrderBook';

export const saveReactAppName = (name: string): GeneralActions => ({
    type: SAVE_REACT_APP_NAME,
    payload: name,
});

export const showOrderInfoDrawer = (orderInfoDrawer: OrderInformationDrawer): GeneralActions => ({
    type: SHOW_ORDER_INFO_DRAWER,
    payload: orderInfoDrawer,
});

export const saveOrderbookTimestampInfo = (selectedOrderbookTimestampInfo: SelectedTimestampInfo): GeneralActions => ({
    type: SAVE_ORDERBOOK_TIMESTAMP_INFO,
    payload: selectedOrderbookTimestampInfo,
});

export const setDisableTransitions = (disableTransitions: boolean): GeneralActions => ({
    type: SET_DISABLE_TRANSITIONS,
    payload: disableTransitions,
});
