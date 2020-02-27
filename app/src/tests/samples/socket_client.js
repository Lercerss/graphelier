// eslint-disable-next-line
const WebSocket = require('ws');

const endpoint = `ws://localhost:5050/playback/SPY/1577892050000000000/1.00?delay=2.0`;
console.log(`Connecting to ${endpoint}`);
const ws = new WebSocket(endpoint);

let count = 0;
ws.onopen = () => {
    console.log('opened');
};
ws.onmessage = m => {
    console.log(m.data);
    if (count++ > 10) {
        ws.close();
    }
};
ws.onclose = () => {
    console.log('closed');
};
