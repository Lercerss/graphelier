import * as ACTION_TYPES from './types';

export const saveReactAppName = (name) => {
    return {
        type: ACTION_TYPES.SAVE_REACT_APP_NAME,
        payload: name
    };
};