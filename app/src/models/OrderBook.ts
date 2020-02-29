/* eslint-disable camelcase */
import NanoDate from 'nano-date';

export enum TransactionType { Ask, Bid }

export interface Order {
    id: number,
    quantity: number,
}

export interface Ask {
    price: number,
    orders: Array<Order>
}

export interface Bid {
    price: number,
    orders: Array<Order>
}

export interface OrderBook {
    bids: Array<Bid>,
    asks: Array<Ask>,
    instrument: string,
    timestamp: string,
    last_sod_offset: string
}

export interface ListItems {
    [index: number]: {
        price: number,
        orders: Array<Order>,
        type: TransactionType.Ask | TransactionType.Bid,
        isMiddle: boolean
    }
}

export interface Message {
    instrument: string,
    timestamp: string,
    message_type: number,
    order_id: number,
    share_qty: number,
    price: number,
    direction: number,
    sod_offset: string
}

export interface TopOfBookItem {
    date?: NanoDate,
    nsSinceStartOfDay: number,
    best_ask: number,
    best_bid: number,
    timestamp: string,
}

export interface TopOfBookPackage {
    topOfBookItems: Array<TopOfBookItem>,
    sodNanoDate: NanoDate
}

export interface OrderDetails {
    instrument: string,
    id: number,
    quantity: number,
    price: number,
    last_modified: string,
    created_on: string,
    messages: Array<Message>,
}

export interface OrderInformationDrawer {
    orderDetails?: OrderDetails,
    showOrderInfoDrawer: boolean,
}
