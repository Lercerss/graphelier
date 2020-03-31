import {
    GeneralActions, GeneralState, SAVE_REACT_APP_NAME, SET_PLAYBACK,
} from '../actions/types';

const initialState : GeneralState = {
    appName: '',
    playback: false,
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
    default: return state;
    }
};

export default generalReducers;
