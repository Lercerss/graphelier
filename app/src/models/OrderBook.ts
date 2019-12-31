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
    // eslint-disable-next-line camelcase
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
