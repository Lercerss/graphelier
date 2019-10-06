import axios from 'axios';
import * as AxiosLogger from 'axios-logger';

import {BACKEND_URL, ENVIRONMENT} from '../constants/Constants';

let config = {
    baseURL: BACKEND_URL,
    timeout: 4000,
};

const httpClient = axios.create(config);

if (ENVIRONMENT === 'DEV') httpClient.interceptors.request.use(AxiosLogger.requestLogger);

httpClient.interceptors.response.use(
    response => {
        return response;
    },
    error => {
        return Promise.reject(error);
    }
);

export {httpClient};