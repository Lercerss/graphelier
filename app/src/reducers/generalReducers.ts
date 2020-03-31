import {
    GeneralActions, GeneralState, SAVE_REACT_APP_NAME, SET_PLAYBACK, SHOW_ORDER_INFO_DRAWER,
} from '../actions/types';

const initialState : GeneralState = {
    appName: '',
    playback: false,
    orderDetails: undefined,
    showOrderInfoDrawer: false,
};

const generalReducers = (state = initialState, action : GeneralActions) : GeneralState => {
    switch (action.type) {
    case SAVE_REACT_APP_NAME:
        return {
            ...state,
            appName: action.payload,
        };
    case SET_PLAYBACK:
        return {
            ...state,
            playback: action.payload,
        };
    case SHOW_ORDER_INFO_DRAWER:
        return {
            ...state,
            showOrderInfoDrawer: action.payload.showOrderInfoDrawer,
            orderDetails: action.payload.orderDetails,
        };
    default: return state;
    }
};

export default generalReducers;
