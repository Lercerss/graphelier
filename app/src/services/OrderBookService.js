import { httpClient } from './HttpClient';

export default class OrderBookService {
    static getOrderBookPrices = (instrument, timestamp) => httpClient.get(`/orderbook/${instrument}/${timestamp}`);

    static getPriceLevelsByMessageOffset = (instrument, timestamp, offset) => httpClient
        .get(`/delta/${instrument}/${timestamp}/${offset}`);
}
