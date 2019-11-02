import axios from 'axios';
import * as AxiosLogger from 'axios-logger';

import { BACKEND_URL, ENVIRONMENT } from '../constants/Constants';

const config = {
    baseURL: BACKEND_URL,
    timeout: 4000,
};

const httpClient = axios.create(config);

if (ENVIRONMENT === 'DEV') httpClient.interceptors.request.use(AxiosLogger.requestLogger);

httpClient.interceptors.response.use(
    response => response,
    error => Promise.reject(error),
);

export { httpClient };
