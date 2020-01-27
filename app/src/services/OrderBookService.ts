import { httpClient } from './HttpClient';

export default class OrderBookService {
    static getOrderBookPrices = (instrument: string, timestamp: string) => {
        return httpClient.get(`/orderbook/${instrument}/${timestamp}`);
    };

    static getPriceLevelsByMessageOffset = (instrument: string, sodOffset: string, offset: string) => {
        return httpClient.get(`/delta/${instrument}/${sodOffset}/${offset}`);
    };

    static getMessageList = (instrument: string, sodOffset: string, nMessages: number = 20) => {
        return httpClient.get(`/messages/${instrument}/${sodOffset}?nMessages=${nMessages}`);
    };

    static getInstrumentsList = () => {
        return httpClient.get(`/instruments/`);
    };

    static getTopOfBookOverTime = (instrument: string, startTime: string, endTime: string, nDataPoints: number) => {
        return httpClient.get(`/topbook/${instrument}/${startTime}/${endTime}/${nDataPoints}`);
    };
}
