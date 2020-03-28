import { OrderDetails, OrderInformationDrawer } from '../models/OrderBook';

export const SAVE_REACT_APP_NAME = 'SAVE_REACT_APP_NAME';
export const SHOW_ORDER_INFO_DRAWER = 'SHOW_ORDER_INFO_DRAWER';
export const SAVE_ORDERBOOK_TIMESTAMP = 'SAVE_ORDERBOOK_TIMESTAMP';

interface SaveReactAppName {
    type: typeof SAVE_REACT_APP_NAME,
    payload: string
}

interface ShowOrderInfoDrawer {
    type: typeof SHOW_ORDER_INFO_DRAWER,
    payload: OrderInformationDrawer
}

interface SaveOrderbookTimestamp {
    type: typeof SAVE_ORDERBOOK_TIMESTAMP,
    payload: string
}

// To expose generic actions:
// export type GenericActions = FirstAction | SecondAction | ThirdAction

export type GeneralActions = SaveReactAppName | ShowOrderInfoDrawer | SaveOrderbookTimestamp;

export interface GeneralState {
    appName: string
    showOrderInfoDrawer: boolean
    orderDetails?: OrderDetails
    currentOrderbookTimestamp: string
}
