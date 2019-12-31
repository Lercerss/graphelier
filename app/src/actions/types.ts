export const SAVE_REACT_APP_NAME = 'SAVE_REACT_APP_NAME';

interface SaveReactAppName {
    type: typeof SAVE_REACT_APP_NAME,
    payload: string
}

// To expose generic actions:
// export type GenericActions = FirstAction | SecondAction | ThirdAction

export type GeneralActions = SaveReactAppName;

export interface GeneralState {
    appName: string
}
