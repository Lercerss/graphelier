export const SAVE_REACT_APP_NAME = 'SAVE_REACT_APP_NAME';
export const SET_PLAYBACK = 'SET_PLAYBACK';

interface SaveReactAppName {
    type: typeof SAVE_REACT_APP_NAME,
    payload: string
}

interface SetPlayback {
    type: typeof SET_PLAYBACK,
    payload: boolean
}

// To expose generic actions:
// export type GenericActions = FirstAction | SecondAction | ThirdAction

export type GeneralActions = SaveReactAppName | SetPlayback;

export interface GeneralState {
    appName: string,
    playback: boolean
}
