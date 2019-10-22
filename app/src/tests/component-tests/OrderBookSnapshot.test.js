import React from 'react';
import OrderBookSnapshot from '../../components/OrderBookSnapshot';
import {createMount, createShallow} from '@material-ui/core/test-utils';
import { TextField } from '@material-ui/core';
import {DATE_STRING, TIME_VALUE, TIME_STRING, DATE_VALUE} from '../utils/mock-data';
import OrderBookService from '../../services/OrderBookService';

describe('date and time picker functionality', () => {
    let mount, shallow;
    const orderBookServiceSpy = jest.spyOn(OrderBookService, 'getOrderBookPrices').mockImplementation((instrument, timestamp) => Promise.resolve({ data: () => [] }));

    beforeEach(() => {
        mount = createMount();
        shallow = createShallow({dive: true});
    });

    afterEach(() => {
        orderBookServiceSpy.mockClear();
        mount.cleanUp();
    });

    it('renders an OrderBookSnapshot component without crashing', () => {
        const wrapper = mount(<OrderBookSnapshot/>);
    });

    it('makes database call once a date and time are selected, in order', () => {
        const wrapper = shallow(<OrderBookSnapshot/>);

        wrapper.find(TextField).simulate('change', { target: { value: DATE_STRING } });
        expect(orderBookServiceSpy).toHaveBeenCalledTimes(0);

        wrapper.instance().handleCommitTime('change', TIME_VALUE);
        expect(orderBookServiceSpy).toHaveBeenCalledTimes(1);
    });

    it('makes database call once a time and date are selected, in order', () => {
        const wrapper = shallow(<OrderBookSnapshot/>);

        wrapper.instance().handleCommitTime('change', TIME_VALUE);
        expect(orderBookServiceSpy).toHaveBeenCalledTimes(0);

        wrapper.find(TextField).simulate('change', { target: { value: DATE_STRING } });
        expect(orderBookServiceSpy).toHaveBeenCalledTimes(1);
    });

    it('should store the proper time string when the time is selected', () => {
        const wrapper = shallow(<OrderBookSnapshot/>);

        wrapper.instance().handleCommitTime('change', TIME_VALUE);

        const selectedTimeString = wrapper.state().selectedTimeString;
        expect(selectedTimeString).toEqual(TIME_STRING);
    });

    it('should store the proper date value in nanoseconds when the date is selected', () => {
        const wrapper = shallow(<OrderBookSnapshot/>);

        wrapper.find(TextField).simulate('change', { target: { value: DATE_STRING } });

        const selectedDateNano = wrapper.state().selectedDateNano;
        expect(selectedDateNano).toEqual(DATE_VALUE);
    });

    it('should store the proper epoch timestamp in nanoseconds when the date and time are selected', () => {
        const wrapper = shallow(<OrderBookSnapshot/>);

        wrapper.find(TextField).simulate('change', { target: { value: DATE_STRING } });
        wrapper.instance().handleCommitTime('change', TIME_VALUE);

        const selectedDateNano = wrapper.state().selectedDateTimeNano;
        expect(selectedDateNano).toEqual(DATE_VALUE+TIME_VALUE);
    });
});
