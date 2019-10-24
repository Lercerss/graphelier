import {httpClient} from './HttpClient';

export default class OrderBookService {

    static getOrderBookPrices = (instrument, timestamp) => {
        return httpClient.get(`/orderbook/${instrument}/${timestamp}`);
        //return httpClient.get(`/orderbook/SPY/1340285560000000000`);
    };
};