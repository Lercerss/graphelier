import { SAVE_REACT_APP_NAME, SET_PLAYBACK, GeneralActions } from './types';

export const saveReactAppName = (name : string) : GeneralActions => ({
    type: SAVE_REACT_APP_NAME,
    payload: name,
});

export const setPlayback = (playback: boolean) : GeneralActions => ({
    type: SET_PLAYBACK,
    payload: playback,
});
