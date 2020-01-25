/* eslint-disable camelcase */
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
    date?: Date,
    best_ask: number,
    best_bid: number,
    timestamp: string,
}
