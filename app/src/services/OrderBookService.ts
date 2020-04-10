import { graphelierClient } from './HttpClient';

export default class OrderBookService {
    static getOrderBookPrices = (instrument: string, timestamp: string) => {
        return graphelierClient.get(`/orderbook/${instrument}/${timestamp}`);
    };

    static getPriceLevelsByMessageOffset = (instrument: string, sodOffset: string, offset: string) => {
        return graphelierClient.get(`/delta/${instrument}/${sodOffset}/${offset}`);
    };

    static getMessageList = (instrument: string, sodOffset: string, nMessages: number = 20) => {
        return graphelierClient.get(`/messages/${instrument}/${sodOffset}?nMessages=${nMessages}`);
    };

    static getInstrumentsList = () => {
        return graphelierClient.get(`/instruments/`);
    };

    static getTopOfBookOverTime = (instrument: string, startTime: string, endTime: string, nDataPoints: number) => {
        return graphelierClient.get(`/topbook/${instrument}/${startTime}/${endTime}/${nDataPoints}`);
    };

    static getOrderInformation = (instrument: string, orderId: number, timestamp: string) => {
        return graphelierClient.get(`/order/${instrument}/${orderId}/${timestamp}`);
    }
}
