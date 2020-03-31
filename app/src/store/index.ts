import {
    createStore, applyMiddleware, combineReducers, compose,
} from 'redux';
import thunk from 'redux-thunk';
import generalReducers from '../reducers/generalReducers';

const rootReducer = combineReducers({
    general: generalReducers,
});

export const getStore = (initialState = {}) => {
    // @ts-ignore
    const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
    const middleware = composeEnhancers(applyMiddleware(thunk));
    return createStore(rootReducer, initialState, middleware);
};

export type RootState = ReturnType<typeof rootReducer>;
