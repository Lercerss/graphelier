import { SET_PLAYBACK, GeneralActions, SHOW_ORDER_INFO_DRAWER, SAVE_REACT_APP_NAME } from './types';
import { OrderInformationDrawer } from '../models/OrderBook';

export const saveReactAppName = (name: string): GeneralActions => ({
    type: SAVE_REACT_APP_NAME,
    payload: name,
});

export const setPlayback = (playback: boolean) : GeneralActions => ({
    type: SET_PLAYBACK,
    payload: playback,
});

export const showOrderInfoDrawer = (orderInfoDrawer: OrderInformationDrawer): GeneralActions => ({
    type: SHOW_ORDER_INFO_DRAWER,
    payload: orderInfoDrawer,
});
