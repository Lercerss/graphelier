import bigInt from 'big-integer';
import { httpClient } from './HttpClient';
import { BACKEND_WS } from '../constants/Constants';
import { PlaybackData } from '../models/OrderBook';

const WebSocket = require('isomorphic-ws');

export default class OrderBookService {
    private static playbackWS;

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

    static getPlaybackWebSocket = (instrument: string, lastSodOffset: bigInt.BigInteger, queryParameter: string,
        onMessageHandler: Function) => {
        OrderBookService.playbackWS = new WebSocket(`${BACKEND_WS}/playback/${instrument}/${lastSodOffset}/`
            + `${queryParameter}`);
        OrderBookService.playbackWS.onopen = () => {
            console.log('opened playback websocket');
        };
        OrderBookService.playbackWS.onmessage = m => {
            const data: PlaybackData = JSON.parse(m.data);
            onMessageHandler(data);
        };
        OrderBookService.playbackWS.onclose = () => {
            console.log('closed playback websocket');
        };
    };

    /**
     * @desc Stops the websocket from processing more information.
     */
    static clearPlayback = (): void => {
        if (OrderBookService.playbackWS) OrderBookService.playbackWS.close();
    };
}
