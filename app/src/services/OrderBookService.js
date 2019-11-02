import { httpClient } from './HttpClient';

export default class OrderBookService {
    static getOrderBookPrices = (instrument, timestamp) => httpClient.get(`/orderbook/${instrument}/${timestamp}`);
}
