import { OrderDetails, OrderInformationDrawer } from '../models/OrderBook';

export const SAVE_REACT_APP_NAME = 'SAVE_REACT_APP_NAME';
export const SET_PLAYBACK = 'SET_PLAYBACK';
export const SHOW_ORDER_INFO_DRAWER = 'SHOW_ORDER_INFO_DRAWER';

interface SaveReactAppName {
    type: typeof SAVE_REACT_APP_NAME,
    payload: string
}

interface SetPlayback {
    type: typeof SET_PLAYBACK,
    payload: boolean
}

interface ShowOrderInfoDrawer {
    type: typeof SHOW_ORDER_INFO_DRAWER,
    payload: OrderInformationDrawer
}

// To expose generic actions:
// export type GenericActions = FirstAction | SecondAction | ThirdAction

export type GeneralActions = SaveReactAppName | SetPlayback | ShowOrderInfoDrawer;

export interface GeneralState {
    appName: string,
    playback: boolean,
    showOrderInfoDrawer: boolean,
    orderDetails?: OrderDetails
}
