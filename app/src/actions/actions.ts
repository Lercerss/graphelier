import {
    GeneralActions, SHOW_ORDER_INFO_DRAWER, SAVE_REACT_APP_NAME, SAVE_ORDERBOOK_TIMESTAMP,
} from './types';
import { OrderInformationDrawer } from '../models/OrderBook';

export const saveReactAppName = (name: string): GeneralActions => ({
    type: SAVE_REACT_APP_NAME,
    payload: name,
});

export const showOrderInfoDrawer = (orderInfoDrawer: OrderInformationDrawer): GeneralActions => ({
    type: SHOW_ORDER_INFO_DRAWER,
    payload: orderInfoDrawer,
});

export const saveOrderbookTimestamp = (currentOrderbookTimestamp: string): GeneralActions => ({
    type: SAVE_ORDERBOOK_TIMESTAMP,
    payload: currentOrderbookTimestamp,
});
