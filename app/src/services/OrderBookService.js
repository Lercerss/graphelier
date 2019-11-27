import { httpClient } from './HttpClient';

export default class OrderBookService {
    static getOrderBookPrices = (instrument, timestamp) => httpClient.get(`/orderbook/${instrument}/${timestamp}`);

    static getPriceLevelsByMessageOffset = (instrument, sodOffset, offset) => httpClient
        .get(`/delta/${instrument}/${sodOffset}/${offset}`);

    static getMessageList = (instrument, sodOffset, nMessages = 20) => httpClient
        .get(`/messages/${instrument}/${sodOffset}?nMessages=${nMessages}`);

    static getInstrumentsList = () => httpClient.get(`/instruments/`);
}
