import { SAVE_REACT_APP_NAME, GeneralActions } from './types';

export const saveReactAppName = (name : string) : GeneralActions => ({
    type: SAVE_REACT_APP_NAME,
    payload: name,
});
