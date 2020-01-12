import * as React from 'react';
import { render } from 'react-dom';

import { Provider } from 'react-redux';
import * as serviceWorker from './env/serviceWorker';

import './styles/index.css';
import App from './App';
import { getStore } from './store';

render(
    <Provider store={getStore()}>
        <App />
    </Provider>,
    document.getElementById('root'),
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below.
serviceWorker.unregister();
