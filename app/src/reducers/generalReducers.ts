import { GeneralActions, GeneralState, SAVE_REACT_APP_NAME } from '../actions/types';

const initialState : GeneralState = {
    appName: '',
};

const generalReducers = (state = initialState, action : GeneralActions) : GeneralState => {
    switch (action.type) {
    case SAVE_REACT_APP_NAME:
        return {
            ...state,
            appName: action.payload,
        };
    default: return state;
    }
};

export default generalReducers;
