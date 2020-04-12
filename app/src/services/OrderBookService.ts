import bigInt from 'big-integer';
import { httpClient } from './HttpClient';
import { BACKEND_WS } from '../constants/Constants';

const WebSocket = require('isomorphic-ws');

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

    static getOrderInformation = (instrument: string, orderId: number, timestamp: string) => {
        return httpClient.get(`/order/${instrument}/${orderId}/${timestamp}`);
    };

    static getPlaybackWebSocket = (instrument: string, lastSodOffset: bigInt.BigInteger, queryParameter: string) => {
        return new WebSocket(`${BACKEND_WS}/playback/${instrument}/${lastSodOffset}/${queryParameter}`);
    };
}
