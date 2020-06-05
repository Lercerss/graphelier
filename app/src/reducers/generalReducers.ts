import bigInt from 'big-integer';
import {
    GeneralActions,
    GeneralState,
    SAVE_ORDERBOOK_TIMESTAMP_INFO,
    SAVE_REACT_APP_NAME,
    SET_DISABLE_TRANSITIONS,
    SHOW_ORDER_INFO_DRAWER,
    SET_PLAYBACK,
    SAVE_INSTRUMENTS,
} from '../actions/types';
import {
    splitNanosecondEpochTimestamp,
    getLocalTimeString,
} from '../utils/date-utils';

const initialState : GeneralState = {
    appName: '',
    orderDetails: undefined,
    showOrderInfoDrawer: false,
    currentOrderbookTimestamp: '',
    lastModificationType: undefined,
    timeString: '00:00:00.000000000',
    selectedDateNano: bigInt(0),
    disableTransitions: false,
    playback: false,
    instruments: [],
};

const generalReducers = (state = initialState, action : GeneralActions) : GeneralState => {
    switch (action.type) {
    case SAVE_REACT_APP_NAME:
        return {
            ...state,
            appName: action.payload,
        };
    case SAVE_ORDERBOOK_TIMESTAMP_INFO: {
        const timestamp: string = action.payload.currentOrderbookTimestamp;
        const timestampNum: bigInt.BigInteger = bigInt(timestamp);
        const { dateNanoseconds } = splitNanosecondEpochTimestamp(timestampNum);
        return {
            ...state,
            currentOrderbookTimestamp: timestamp,
            lastModificationType: action.payload.lastModificationType,
            timeString: getLocalTimeString(timestamp),
            selectedDateNano: dateNanoseconds,
        };
    }
    case SHOW_ORDER_INFO_DRAWER:
        return {
            ...state,
            showOrderInfoDrawer: action.payload.showOrderInfoDrawer,
            orderDetails: action.payload.orderDetails,
        };
    case SET_DISABLE_TRANSITIONS:
        return {
            ...state,
            disableTransitions: action.payload,
        };
    case SET_PLAYBACK:
        return {
            ...state,
            playback: action.payload,
        };
    case SAVE_INSTRUMENTS:
        return {
            ...state,
            instruments: action.payload,
        };
    default: return state;
    }
};

export default generalReducers;
