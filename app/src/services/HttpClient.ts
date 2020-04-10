import axios from 'axios';
import * as AxiosLogger from 'axios-logger';

import { ORDERBOOK_SERVICE_BACKEND_URL, ENVIRONMENT } from '../constants/Constants';

const orderbookConfig = {
    baseURL: ORDERBOOK_SERVICE_BACKEND_URL,
    timeout: 4000,
};

const graphelierClient = axios.create(orderbookConfig);

if (ENVIRONMENT === 'DEV') graphelierClient.interceptors.request.use(AxiosLogger.requestLogger);

graphelierClient.interceptors.response.use(
    response => response,
    error => Promise.reject(error),
);

const newsConfig = {
    baseURL: ORDERBOOK_SERVICE_BACKEND_URL,
    timeout: 4000,
};

const graphelierNews = axios.create(newsConfig);

if (ENVIRONMENT === 'DEV') graphelierNews.interceptors.request.use(AxiosLogger.requestLogger);

graphelierNews.interceptors.response.use(
    response => response,
    error => Promise.reject(error),
);

export { graphelierClient, graphelierNews };
