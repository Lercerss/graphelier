import { httpClient } from './HttpClient';

export default class OrderBookService {
    static getOrderBookPrices = (instrument, timestamp) => {
        return httpClient.get(`/orderbook/SPY/1340285560000000000`);
    };

    static getPriceLevelsByMessageOffset = (instrument, timestamp, offset) => httpClient
        .get(`/delta/${instrument}/${timestamp}/${offset}`);

    static getMessageList = (instrument, sodOffset, nMessages = 20) => httpClient
        .get(`/messages/${instrument}/${sodOffset}?nMessages=${nMessages}`);
}
