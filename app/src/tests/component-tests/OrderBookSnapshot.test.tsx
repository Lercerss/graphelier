import React from 'react';
import { createMount, createShallow } from '@material-ui/core/test-utils';
import { Select } from '@material-ui/core';
import { KeyboardDatePicker } from '@material-ui/pickers';
import { NonConnectedOrderBookSnapshot as OrderBookSnapshot } from '../../components/OrderBookSnapshot';
import {
    TIME_STRING,
    DATE_VALUE_BIG_INT,
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
import { TransactionType } from '../../models/OrderBook';

describe('getting and selecting an instrument functionality', () => {
    let mount, shallow, props, enqueueSnackbar, closeSnackbar;

    const getInstrumentsListSpy = jest.spyOn(OrderBookService, 'getInstrumentsList')
        .mockImplementation((): Promise<any> => Promise.resolve({ data: ['SPY', 'AAPL', 'MSFT'] })
            .catch(err => {
                console.log(err);
            }));

    beforeEach(() => {
        mount = createMount();
        shallow = createShallow({ dive: true });
        enqueueSnackbar = jest.fn();
        closeSnackbar = jest.fn();
        props = {
            orderDetails: undefined,
            showOrderInfoDrawer: false,
            currentOrderbookTimestamp: TIMESTAMP,
            lastModificationType: undefined,
            onTimestampSelected: jest.fn(),
        };
    });

    afterEach(() => {
        mount.cleanUp();
        getInstrumentsListSpy.mockClear();
    });

    it('renders a OrderBookSnapshot component and simulate selecting instruments', () => {
        const wrapper = shallow(
            <OrderBookSnapshot
                orderDetails={props.orderDetails}
                showOrderInfoDrawer={props.showOrderInfoDrawer}
                currentOrderbookTimestamp={props.currentOrderbookTimestamp}
                lastModificationType={props.lastModificationType}
                onTimestampSelected={props.onTimestampSelected}
                enqueueSnackbar={enqueueSnackbar}
                closeSnackbar={closeSnackbar}
            />,
        );
        wrapper.instance().setState({
            loadingInstruments: false,
        });
        wrapper.find('#instrumentSelector').simulate('click');
        expect(getInstrumentsListSpy).toHaveBeenCalledTimes(1);
        expect(wrapper.state().selectedInstrument).toBe('');
        wrapper.find(Select).simulate('change', { target: { value: 'SPY' } });
        expect(wrapper.state().selectedInstrument).toBe('SPY');
    });
});

describe('date and time picker functionality', () => {
    let mount, shallow, props, enqueueSnackbar, closeSnackbar;
    const getOrderBookPricesSpy = jest.spyOn(OrderBookService, 'getOrderBookPrices')
        .mockImplementation((instrument, timestamp): Promise<any> => Promise.resolve(
            {
                data: ORDER_BOOK_FROM_BACKEND,
            },
        ));

    const getTopOfBookOverTimeSpy = jest.spyOn(OrderBookService, 'getTopOfBookOverTime')
        .mockImplementation((instrument, startTime, endTime, nDataPoints): Promise<any> => Promise.resolve(
            {
                data: [],
            },
        ));

    beforeEach(() => {
        mount = createMount();
        shallow = createShallow({ dive: true });
        enqueueSnackbar = jest.fn();
        closeSnackbar = jest.fn();
        props = {
            orderDetails: undefined,
            showOrderInfoDrawer: false,
            currentOrderbookTimestamp: TIMESTAMP,
            lastModificationType: undefined,
            onTimestampSelected: jest.fn(),
        };
    });

    afterEach(() => {
        getOrderBookPricesSpy.mockClear();
        getTopOfBookOverTimeSpy.mockClear();
        mount.cleanUp();
    });

    it('renders an OrderBookSnapshot component without crashing', () => {
        shallow(
            <OrderBookSnapshot
                orderDetails={props.orderDetails}
                showOrderInfoDrawer={props.showOrderInfoDrawer}
                currentOrderbookTimestamp={props.currentOrderbookTimestamp}
                lastModificationType={props.lastModificationType}
                onTimestampSelected={props.onTimestampSelected}
                enqueueSnackbar={enqueueSnackbar}
                closeSnackbar={closeSnackbar}
            />,
        );
    });

    it('makes database call once a date is selected', () => {
        const wrapper = shallow(
            <OrderBookSnapshot
                orderDetails={props.orderDetails}
                showOrderInfoDrawer={props.showOrderInfoDrawer}
                currentOrderbookTimestamp={props.currentOrderbookTimestamp}
                lastModificationType={props.lastModificationType}
                onTimestampSelected={props.onTimestampSelected}
                enqueueSnackbar={enqueueSnackbar}
                closeSnackbar={closeSnackbar}
            />,
        );

        wrapper.find(KeyboardDatePicker).simulate('change', DATE_MOMENT);
        expect(getOrderBookPricesSpy).toHaveBeenCalledTimes(1);
        expect(getTopOfBookOverTimeSpy).toHaveBeenCalledTimes(1);
    });

    it('makes database call when a time is selected from the graph', () => {
        const wrapper = shallow(
            <OrderBookSnapshot
                orderDetails={props.orderDetails}
                showOrderInfoDrawer={props.showOrderInfoDrawer}
                currentOrderbookTimestamp={props.currentOrderbookTimestamp}
                lastModificationType={props.lastModificationType}
                onTimestampSelected={props.onTimestampSelected}
                enqueueSnackbar={enqueueSnackbar}
                closeSnackbar={closeSnackbar}
            />,
        );

        wrapper.find(KeyboardDatePicker).simulate('change', DATE_MOMENT);
        expect(getOrderBookPricesSpy).toHaveBeenCalledTimes(1);
        expect(getTopOfBookOverTimeSpy).toHaveBeenCalledTimes(1);

        wrapper.instance().handleSelectGraphDateTime(TIMESTAMP.toString());
        expect(getOrderBookPricesSpy).toHaveBeenCalledTimes(2);
        expect(getTopOfBookOverTimeSpy).toHaveBeenCalledTimes(1);
    });

    it('should store the proper time string when the time is selected', () => {
        const wrapper = shallow(
            <OrderBookSnapshot
                orderDetails={props.orderDetails}
                showOrderInfoDrawer={props.showOrderInfoDrawer}
                currentOrderbookTimestamp={props.currentOrderbookTimestamp}
                lastModificationType={props.lastModificationType}
                onTimestampSelected={props.onTimestampSelected}
                enqueueSnackbar={enqueueSnackbar}
                closeSnackbar={closeSnackbar}
            />,
        );

        wrapper.instance().handleSelectGraphDateTime(TIMESTAMP_PM.toString());

        const { selectedTimeString } = wrapper.state();
        expect(selectedTimeString).toEqual(TIME_STRING);
    });

    it('should store the proper date value in nanoseconds when the date is selected', () => {
        const wrapper = shallow(
            <OrderBookSnapshot
                orderDetails={props.orderDetails}
                showOrderInfoDrawer={props.showOrderInfoDrawer}
                currentOrderbookTimestamp={props.currentOrderbookTimestamp}
                lastModificationType={props.lastModificationType}
                onTimestampSelected={props.onTimestampSelected}
                enqueueSnackbar={enqueueSnackbar}
                closeSnackbar={closeSnackbar}
            />,
        );

        wrapper.find(KeyboardDatePicker).simulate('change', DATE_MOMENT);

        const { selectedDateNano } = wrapper.state();
        expect(selectedDateNano).toEqual(DATE_VALUE_BIG_INT);
    });

    it('should store the proper epoch timestamp in nanoseconds when a timestamp is selected from the graph', () => {
        const wrapper = shallow(
            <OrderBookSnapshot
                orderDetails={props.orderDetails}
                showOrderInfoDrawer={props.showOrderInfoDrawer}
                currentOrderbookTimestamp={props.currentOrderbookTimestamp}
                lastModificationType={props.lastModificationType}
                onTimestampSelected={props.onTimestampSelected}
                enqueueSnackbar={enqueueSnackbar}
                closeSnackbar={closeSnackbar}
            />,
        );

        wrapper.instance().handleSelectGraphDateTime(TIMESTAMP.toString());
        expect(props.currentOrderbookTimestamp).toEqual(TIMESTAMP);
    });
});

describe('updating price level by message offset functionality', () => {
    let mount, shallow, listItems, props, enqueueSnackbar, closeSnackbar;

    beforeEach(() => {
        mount = createMount();
        shallow = createShallow({ dive: true });
        enqueueSnackbar = jest.fn();
        closeSnackbar = jest.fn();
        listItems = { ...ORDER_BOOK_LIST_ITEMS };
        props = {
            orderDetails: undefined,
            showOrderInfoDrawer: false,
            currentOrderbookTimestamp: TIMESTAMP,
            lastModificationType: undefined,
            onTimestampSelected: jest.fn(),
        };
    });

    afterEach(() => {
        mount.cleanUp();
    });

    it('updates list items in state given a modified price level', () => {
        const wrapper = shallow(
            <OrderBookSnapshot
                orderDetails={props.orderDetails}
                showOrderInfoDrawer={props.showOrderInfoDrawer}
                currentOrderbookTimestamp={props.currentOrderbookTimestamp}
                lastModificationType={props.lastModificationType}
                onTimestampSelected={props.onTimestampSelected}
                enqueueSnackbar={enqueueSnackbar}
                closeSnackbar={closeSnackbar}
            />,
        );
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
        const wrapper = shallow(
            <OrderBookSnapshot
                orderDetails={props.orderDetails}
                showOrderInfoDrawer={props.showOrderInfoDrawer}
                currentOrderbookTimestamp={props.currentOrderbookTimestamp}
                lastModificationType={props.lastModificationType}
                onTimestampSelected={props.onTimestampSelected}
                enqueueSnackbar={enqueueSnackbar}
                closeSnackbar={closeSnackbar}
            />,
        );
        wrapper.instance().setState(
            {
                listItems,
            },
        );
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
        const wrapper = shallow(
            <OrderBookSnapshot
                orderDetails={props.orderDetails}
                showOrderInfoDrawer={props.showOrderInfoDrawer}
                currentOrderbookTimestamp={props.currentOrderbookTimestamp}
                lastModificationType={props.lastModificationType}
                onTimestampSelected={props.onTimestampSelected}
                enqueueSnackbar={enqueueSnackbar}
                closeSnackbar={closeSnackbar}
            />,
        );
        wrapper.instance().setState(
            {
                listItems,
            },
        );
        wrapper.instance().handleUpdateWithDeltas(MESSAGE_DELTAS_FROM_BACKEND_REMOVE);

        expect(Object.keys(wrapper.instance().state.listItems).length).toEqual(1);

        expect(wrapper.instance().state.listItems[135.66])
            .toEqual(undefined);

        expect(wrapper.instance().state.listItems[135.67])
            .toEqual(ORDER_BOOK_LIST_ITEMS[135.67]);
    });
});

describe('graph zoom and pan data loading functionality', () => {
    let mount, shallow, props, enqueueSnackbar, closeSnackbar;

    const getTopOfBookOverTimeSpy = jest.spyOn(OrderBookService, 'getTopOfBookOverTime')
        .mockImplementation((instrument, startTime, endTime, nDataPoints): Promise<any> => Promise.resolve(
            {
                data: [],
            },
        ));

    beforeEach(() => {
        mount = createMount();
        shallow = createShallow({ dive: true });
        enqueueSnackbar = jest.fn();
        closeSnackbar = jest.fn();
        props = {
            orderDetails: undefined,
            showOrderInfoDrawer: false,
            currentOrderbookTimestamp: TIMESTAMP,
            lastModificationType: undefined,
            onTimestampSelected: jest.fn(),
        };
    });

    afterEach(() => {
        getTopOfBookOverTimeSpy.mockClear();
        mount.cleanUp();
    });

    it('makes database call when there is a zoom or pan event', () => {
        const wrapper = shallow(
            <OrderBookSnapshot
                orderDetails={props.orderDetails}
                showOrderInfoDrawer={props.showOrderInfoDrawer}
                currentOrderbookTimestamp={props.currentOrderbookTimestamp}
                lastModificationType={props.lastModificationType}
                onTimestampSelected={props.onTimestampSelected}
                enqueueSnackbar={enqueueSnackbar}
                closeSnackbar={closeSnackbar}
            />,
        );

        expect(getTopOfBookOverTimeSpy).toHaveBeenCalledTimes(0);
        wrapper.instance().handlePanAndZoom(TIMESTAMP_PM, TIMESTAMP_PM);
        expect(getTopOfBookOverTimeSpy).toHaveBeenCalledTimes(1);
    });
});
