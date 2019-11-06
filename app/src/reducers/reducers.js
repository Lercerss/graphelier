import * as ACTION_TYPES from '../actions/types';

const reducers = (state = {}, action) => {
    switch (action.type) {
    case ACTION_TYPES.SAVE_REACT_APP_NAME:
        return {
            ...state,
            appName: action.payload,
        };
    default: return state;
    }
};

export default reducers;
