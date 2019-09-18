import React from 'react';
import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import reducers from '../reducers/reducers';

export const getStore = (initialState) => {
    const middleware = applyMiddleware(thunk);

    return createStore(reducers, initialState, middleware);
};
