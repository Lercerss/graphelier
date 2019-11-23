import React from 'react';
import { createMount, createShallow } from '@material-ui/core/test-utils';
import { TextField, Slider, Select } from '@material-ui/core';
import OrderBookSnapshot from '../../components/OrderBookSnapshot';
import {
    DATE_STRING,
    TIME_VALUE,
    TIME_STRING,
    DATE_VALUE,
    ORDER_BOOK_LIST_ITEMS,
    MESSAGE_DELTAS_FROM_BACKEND_MODIFY,
    MESSAGE_DELTAS_FROM_BACKEND_ADD,
    MESSAGE_DELTAS_FROM_BACKEND_REMOVE, ORDER_BOOK_FROM_BACKEND,
} from '../utils/mock-data';
import OrderBookService from '../../services/OrderBookService';
import { convertNanosecondsToUTC } from '../../utils/date-utils';

describe('getting and selecting an instrument functionality', () => {
    let mount, shallow;

    const getInstrumentsListSpy = jest.spyOn(OrderBookService, 'getInstrumentsList')
        .mockClear(() => Promise.resolve({ data: ['SPY', 'AAPL', 'MSFT'] })
            .catch(err => {
                console.log(err);
            }));

    beforeEach(() => {
        mount = createMount();
        shallow = createShallow({ dive: true });
    });

    afterEach(() => {
        mount.cleanUp();
        getInstrumentsListSpy.mockClear();
    });

    it('renders a OrderBookSnapshot component and simulate selecting instruments', () => {
        const wrapper = shallow(<OrderBookSnapshot />);

        wrapper.find(Select).first().simulate('click');
        expect(getInstrumentsListSpy).toHaveBeenCalledTimes(1);
        expect(wrapper.state().selectedInstrument).toBe('');
        wrapper.find(Select).simulate('change', { target: { value: 'SPY' } });
        expect(wrapper.state().selectedInstrument).toBe('SPY');
    });
});

describe('date and time picker functionality', () => {
    let mount, shallow;
    const getOrderBookPricesSpy = jest.spyOn(OrderBookService, 'getOrderBookPrices')
        .mockImplementation((instrument, timestamp) => Promise.resolve(
            {
                data: ORDER_BOOK_FROM_BACKEND,
            },
        ));

    beforeEach(() => {
        mount = createMount();
        shallow = createShallow({ dive: true });
    });

    afterEach(() => {
        getOrderBookPricesSpy.mockClear();
        mount.cleanUp();
    });

    it('renders an OrderBookSnapshot component without crashing', () => {
        mount(<OrderBookSnapshot />);
    });

    it('makes database call once a date and time are selected, in order', () => {
        const wrapper = shallow(<OrderBookSnapshot />);

        wrapper.find(TextField).simulate('change', { target: { value: DATE_STRING } });
        expect(getOrderBookPricesSpy).toHaveBeenCalledTimes(0);

        wrapper.find(Slider).simulate('change', TIME_VALUE);
        expect(getOrderBookPricesSpy).toHaveBeenCalledTimes(0);

        wrapper.instance().handleCommitTime('change', TIME_VALUE);
        expect(getOrderBookPricesSpy).toHaveBeenCalledTimes(1);
    });

    it('makes database call once a time and date are selected, in order', () => {
        const wrapper = shallow(<OrderBookSnapshot />);

        wrapper.find(Slider).simulate('change', TIME_VALUE);
        expect(getOrderBookPricesSpy).toHaveBeenCalledTimes(0);

        wrapper.instance().handleCommitTime('change', TIME_VALUE);
        expect(getOrderBookPricesSpy).toHaveBeenCalledTimes(0);

        wrapper.find(TextField).simulate('change', { target: { value: DATE_STRING } });
        expect(getOrderBookPricesSpy).toHaveBeenCalledTimes(1);
    });

    it('should store the proper time string when the time is selected', () => {
        const wrapper = shallow(<OrderBookSnapshot />);

        wrapper.instance().handleCommitTime('change', TIME_VALUE);

        const { selectedTimeString } = wrapper.state();
        expect(selectedTimeString).toEqual(TIME_STRING);
    });

    it('should store the proper date value in nanoseconds when the date is selected', () => {
        const wrapper = shallow(<OrderBookSnapshot />);

        wrapper.find(TextField).simulate('change', { target: { value: DATE_STRING } });

        const { selectedDateNano } = wrapper.state();
        expect(selectedDateNano).toEqual(DATE_VALUE);
    });

    it('should store the proper epoch timestamp in nanoseconds when the date and time are selected', () => {
        const wrapper = shallow(<OrderBookSnapshot />);

        wrapper.find(TextField).simulate('change', { target: { value: DATE_STRING } });
        wrapper.instance().handleCommitTime('change', TIME_VALUE);

        const selectedDateNano = wrapper.state().selectedDateTimeNano;
        expect(selectedDateNano).toEqual(convertNanosecondsToUTC(DATE_VALUE + TIME_VALUE));
    });
});

describe('updating price level by message offset functionality', () => {
    let mount, shallow, listItems;

    beforeEach(() => {
        mount = createMount();
        shallow = createShallow({ dive: true });
        listItems = { ...ORDER_BOOK_LIST_ITEMS };
    });

    afterEach(() => {
        mount.cleanUp();
    });

    it('updates list items in state given a modified price level', () => {
        const wrapper = shallow(<OrderBookSnapshot />);
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
                type: 'ask',
                orders: MESSAGE_DELTAS_FROM_BACKEND_MODIFY.asks[0].orders,
            });

        expect(wrapper.instance().state.listItems[135.67])
            .toEqual(ORDER_BOOK_LIST_ITEMS[135.67]);
    });

    it('updates list items in state given an added price level', () => {
        const wrapper = shallow(<OrderBookSnapshot />);
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
                type: 'ask',
                orders: MESSAGE_DELTAS_FROM_BACKEND_ADD.asks[0].orders,
            });
    });

    it('updates list items in state given a removed price level', () => {
        const wrapper = shallow(<OrderBookSnapshot />);
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
