import { createStore, applyMiddleware, combineReducers } from 'redux';
import thunk from 'redux-thunk';
import generalReducers from '../reducers/generalReducers';

const rootReducer = combineReducers({
    general: generalReducers,
});

export const getStore = (initialState = {}) => {
    const middleware = applyMiddleware(thunk);
    return createStore(rootReducer, initialState, middleware);
};

export type RootState = ReturnType<typeof rootReducer>;
