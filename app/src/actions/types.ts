import bigInt from 'big-integer';
import {
    LastModificationType,
    OrderDetails,
    OrderInformationDrawer,
    GlobalSelectedTimestampInfo,
} from '../models/OrderBook';

export const SAVE_REACT_APP_NAME = 'SAVE_REACT_APP_NAME';
export const SHOW_ORDER_INFO_DRAWER = 'SHOW_ORDER_INFO_DRAWER';
export const SAVE_ORDERBOOK_TIMESTAMP_INFO = 'SAVE_ORDERBOOK_TIMESTAMP_INFO';
export const SET_DISABLE_TRANSITIONS = 'SET_DISABLE_TRANSITIONS';
export const SET_PLAYBACK = 'SET_PLAYBACK';
export const SAVE_INSTRUMENTS = 'SAVE_INSTRUMENTS';

interface SaveReactAppName {
    type: typeof SAVE_REACT_APP_NAME,
    payload: string
}

interface ShowOrderInfoDrawer {
    type: typeof SHOW_ORDER_INFO_DRAWER,
    payload: OrderInformationDrawer
}

interface SaveOrderbookTimestampInfo {
    type: typeof SAVE_ORDERBOOK_TIMESTAMP_INFO,
    payload: GlobalSelectedTimestampInfo
}

interface SetDisableTransitions {
    type: typeof SET_DISABLE_TRANSITIONS,
    payload: boolean,
}

interface SetPlayback {
    type: typeof SET_PLAYBACK,
    payload: boolean,
}

interface SaveInstruments {
    type: typeof SAVE_INSTRUMENTS,
    payload: Array<string>,
}

// To expose generic actions:
// export type GenericActions = FirstAction | SecondAction | ThirdAction

export type GeneralActions = SaveReactAppName
    | ShowOrderInfoDrawer
    | SaveOrderbookTimestampInfo
    | SetDisableTransitions
    | SetPlayback
    | SaveInstruments;

export interface GeneralState {
    appName: string,
    showOrderInfoDrawer: boolean,
    orderDetails?: OrderDetails
    currentOrderbookTimestamp: string
    lastModificationType?: LastModificationType,
    timeString?: string,
    selectedDateNano: bigInt.BigInteger,
    disableTransitions: boolean,
    playback: boolean,
    instruments: Array<string>
}
