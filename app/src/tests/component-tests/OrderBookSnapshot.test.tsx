/* eslint-disable react/jsx-props-no-spreading */

import React from 'react';
import { createMount, createShallow } from '@material-ui/core/test-utils';
import { Select } from '@material-ui/core';
import { KeyboardDatePicker } from '@material-ui/pickers';
import bigInt from 'big-integer';
import { NonConnectedOrderBookSnapshot as OrderBookSnapshot } from '../../components/OrderBookSnapshot';
import {
    ORDER_BOOK_LIST_ITEMS,
    MESSAGE_DELTAS_FROM_BACKEND_MODIFY,
    MESSAGE_DELTAS_FROM_BACKEND_ADD,
    MESSAGE_DELTAS_FROM_BACKEND_REMOVE,
    ORDER_BOOK_FROM_BACKEND,
    DATE_MOMENT,
    TIMESTAMP,
    TIMESTAMP_PM,
} from '../utils/mock-data';
import OrderBookService from '../../services/OrderBookService';
import { TransactionType, LastModificationType } from '../../models/OrderBook';

const obsProps = {
    orderDetails: undefined,
    showOrderInfoDrawer: false,
    currentOrderbookTimestamp: TIMESTAMP.toString(),
    lastModificationType: undefined,
    timeString: 'some time',
    selectedDateNano: bigInt(0),
    playback: false,
    instruments: [],
};

describe('getting and selecting an instrument functionality', () => {
    let mount, shallow, props;

    beforeEach(() => {
        mount = createMount();
        shallow = createShallow({ dive: true });
        props = {
            ...obsProps,
            onTimestampSelected: jest.fn(),
            onPlayback: jest.fn(),
            enqueueSnackbar: jest.fn(),
            closeSnackbar: jest.fn(),
        };
    });

    afterEach(() => {
        mount.cleanUp();
    });

    it('renders a OrderBookSnapshot component and simulate selecting instruments', () => {
        props = {
            ...props,
            instruments: ['SPY', 'MSFT'],
        };
        const wrapper = shallow(<OrderBookSnapshot {...props} />);
        wrapper.instance().setState({
            loadingInstruments: false,
        });
        wrapper.find('#instrumentSelector').simulate('click');
        expect(wrapper.state().selectedInstrument).toBe('');
        wrapper.find(Select).simulate('change', { target: { value: 'SPY' } });
        expect(wrapper.state().selectedInstrument).toBe('SPY');
    });
});

describe('date and time picker functionality', () => {
    let mount, shallow, props;
    const getOrderBookPricesSpy = jest.spyOn(OrderBookService, 'getOrderBookPrices')
        .mockImplementation((instrument, timestamp): Promise<any> => Promise.resolve({
            data: ORDER_BOOK_FROM_BACKEND,
        }));

    const getTopOfBookOverTimeSpy = jest.spyOn(OrderBookService, 'getTopOfBookOverTime')
        .mockImplementation((instrument, startTime, endTime, nDataPoints): Promise<any> => Promise.resolve({
            data: [],
        }));

    beforeEach(() => {
        mount = createMount();
        shallow = createShallow({ dive: true });
        props = {
            ...obsProps,
            onTimestampSelected: jest.fn(),
            onPlayback: jest.fn(),
            enqueueSnackbar: jest.fn(),
            closeSnackbar: jest.fn(),
        };
    });

    afterEach(() => {
        getOrderBookPricesSpy.mockClear();
        getTopOfBookOverTimeSpy.mockClear();
        mount.cleanUp();
    });

    it('renders an OrderBookSnapshot component without crashing', () => {
        shallow(<OrderBookSnapshot {...props} />);
    });

    it('makes database call once a date is selected', () => {
        const wrapper = shallow(<OrderBookSnapshot {...props} />);
        wrapper.find(KeyboardDatePicker).simulate('change', DATE_MOMENT);
        expect(getTopOfBookOverTimeSpy).toHaveBeenCalledTimes(1);
    });

    it('makes database call when a time is selected from the graph', () => {
        const wrapper = shallow(<OrderBookSnapshot {...props} />);
        wrapper.find(KeyboardDatePicker).simulate('change', DATE_MOMENT);
        expect(getTopOfBookOverTimeSpy).toHaveBeenCalledTimes(1);
        wrapper.instance().handleSelectGraphDateTime(TIMESTAMP.toString());
        expect(getTopOfBookOverTimeSpy).toHaveBeenCalledTimes(1);
    });

    it('should store the proper epoch timestamp in nanoseconds when a timestamp is selected from the graph', () => {
        const wrapper = shallow(<OrderBookSnapshot {...props} />);
        wrapper.instance().handleSelectGraphDateTime(TIMESTAMP.toString());
        expect(props.currentOrderbookTimestamp).toEqual(TIMESTAMP.toString());
    });

    it('should call the backend for new orderbook prices on change of timestamp, graph or force refresh', () => {
        const wrapper = shallow(<OrderBookSnapshot {...props} />);
        wrapper.instance().handleSelectGraphDateTime(TIMESTAMP.toString());
        wrapper.setProps({
            currentOrderbookTimestamp: '1340280000000000001',
            lastModificationType: LastModificationType.GRAPH,
        });
        expect(getOrderBookPricesSpy).toHaveBeenCalledTimes(1);
        wrapper.setProps({
            currentOrderbookTimestamp: '1340280000000000002',
            lastModificationType: LastModificationType.FORCE_REFRESH,
        });
        expect(getOrderBookPricesSpy).toHaveBeenCalledTimes(2);
    });

    it('should call the backend for new orderbook prices on change of timestamp, message, playback', () => {
        const wrapper = shallow(<OrderBookSnapshot {...props} />);
        wrapper.instance().handleSelectGraphDateTime(TIMESTAMP.toString());
        wrapper.setProps({
            currentOrderbookTimestamp: '1340280000000000001',
            lastModificationType: LastModificationType.MESSAGE,
        });
        expect(getOrderBookPricesSpy).toHaveBeenCalledTimes(0);
        wrapper.setProps({
            currentOrderbookTimestamp: '1340280000000000002',
            lastModificationType: LastModificationType.PLAYBACK,
        });
        expect(getOrderBookPricesSpy).toHaveBeenCalledTimes(0);
    });

    it('should call the backend for new orderbook prices on navigation from news', () => {
        window.history.pushState({}, '', 'orderbook/?instrument=SPY&timestamp=1340280000000000005');
        shallow(<OrderBookSnapshot {...props} />);
        expect(getTopOfBookOverTimeSpy).toHaveBeenCalledTimes(1);
        window.history.pushState({}, '', 'orderbook/');
    });
});

describe('updating price level by message offset functionality', () => {
    let mount, shallow, listItems, props;

    beforeEach(() => {
        mount = createMount();
        shallow = createShallow({ dive: true });
        listItems = { ...ORDER_BOOK_LIST_ITEMS };
        props = {
            ...obsProps,
            onTimestampSelected: jest.fn(),
            onPlayback: jest.fn(),
            enqueueSnackbar: jest.fn(),
            closeSnackbar: jest.fn(),
        };
    });

    afterEach(() => {
        mount.cleanUp();
    });

    it('updates list items in state given a modified price level', () => {
        const wrapper = shallow(<OrderBookSnapshot {...props} />);
        wrapper.instance().setState(
            {
                listItems,
            },
        );
        wrapper.instance().handleUpdateWithDeltas(MESSAGE_DELTAS_FROM_BACKEND_MODIFY);

        expect(Object.keys(wrapper.instance().state.listItems).length).toEqual(2);
        expect(wrapper.instance().state.listItems[135.66])
            .toEqual({
                price: 135.66,
                isMiddle: false,
                type: TransactionType.Ask,
                orders: MESSAGE_DELTAS_FROM_BACKEND_MODIFY.asks[0].orders,
            });

        expect(wrapper.instance().state.listItems[135.67])
            .toEqual(ORDER_BOOK_LIST_ITEMS[135.67]);
    });

    it('updates list items in state given an added price level', () => {
        const wrapper = shallow(<OrderBookSnapshot {...props} />);
        wrapper.instance().setState({
            listItems,
        });
        wrapper.instance().handleUpdateWithDeltas(MESSAGE_DELTAS_FROM_BACKEND_ADD);

        expect(Object.keys(wrapper.instance().state.listItems).length).toEqual(3);
        expect(wrapper.instance().state.listItems[135.66])
            .toEqual(ORDER_BOOK_LIST_ITEMS[135.66]);
        expect(wrapper.instance().state.listItems[135.67])
            .toEqual(ORDER_BOOK_LIST_ITEMS[135.67]);
        expect(wrapper.instance().state.listItems[135.68])
            .toEqual({
                price: 135.68,
                isMiddle: false,
                type: TransactionType.Ask,
                orders: MESSAGE_DELTAS_FROM_BACKEND_ADD.asks[0].orders,
            });
    });

    it('updates list items in state given a removed price level', () => {
        const wrapper = shallow(<OrderBookSnapshot {...props} />);
        wrapper.instance().setState({
            listItems,
        });
        wrapper.instance().handleUpdateWithDeltas(MESSAGE_DELTAS_FROM_BACKEND_REMOVE);

        expect(Object.keys(wrapper.instance().state.listItems).length).toEqual(1);
        expect(wrapper.instance().state.listItems[135.66])
            .toEqual(undefined);
        expect(wrapper.instance().state.listItems[135.67])
            .toEqual(ORDER_BOOK_LIST_ITEMS[135.67]);
    });
});

describe('graph zoom and pan data loading functionality', () => {
    let mount, shallow, props;

    const getTopOfBookOverTimeSpy = jest.spyOn(OrderBookService, 'getTopOfBookOverTime')
        .mockImplementation((instrument, startTime, endTime, nDataPoints): Promise<any> => Promise.resolve({
            data: [],
        }));

    beforeEach(() => {
        mount = createMount();
        shallow = createShallow({ dive: true });
        props = {
            ...obsProps,
            onTimestampSelected: jest.fn(),
            onPlayback: jest.fn(),
            enqueueSnackbar: jest.fn(),
            closeSnackbar: jest.fn(),
        };
    });

    afterEach(() => {
        getTopOfBookOverTimeSpy.mockClear();
        mount.cleanUp();
    });

    it('makes database call when there is a zoom or pan event', () => {
        const wrapper = shallow(<OrderBookSnapshot {...props} />);
        expect(getTopOfBookOverTimeSpy).toHaveBeenCalledTimes(0);
        wrapper.instance().updateGraphData(TIMESTAMP_PM, TIMESTAMP_PM);
        expect(getTopOfBookOverTimeSpy).toHaveBeenCalledTimes(1);
    });
});
