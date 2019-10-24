import React from 'react';
import TimestampOrderBookScroller from '../../components/TimestampOrderBookScroller';
import { createMount, createShallow } from '@material-ui/core/test-utils';
import { Box } from '@material-ui/core';
import {ORDERBOOK_FROM_BACKEND} from '../utils/mock-data';
import MultiDirectionalScroll from '../../components/MultiDirectionalScroll';
import PriceLevel from '../../components/PriceLevel';

describe('TimestampOrderbookScroller functionality', () => {
    let mount, shallow, orderbookProps;

    beforeEach(() => {
        mount = createMount();
        shallow = createShallow({dive: true});

        orderbookProps = {
            orderBook: ORDERBOOK_FROM_BACKEND
        };

    });

    afterEach(() => {
        mount.cleanUp();
    });

    it('renders a TimestampOrderbookScroller component with expected props', () => {
        const wrapper = mount(<TimestampOrderBookScroller {...orderbookProps} />);
        expect(wrapper.props().orderBook).toBeDefined();
        expect(wrapper.props().orderBook).toEqual(orderbookProps.orderBook);
    });

    it('renders a TimestampOrderbookScroller component with correct amount of material ui boxes', () => {
        const wrapper = shallow(<TimestampOrderBookScroller {...orderbookProps}/>);
        expect(wrapper.find(Box).length).toBeGreaterThanOrEqual(3);
    });

    it('renders a TimestampOrderbookScroller component with a single MultiDirectionalScroll', () => {
        const wrapper = mount(<TimestampOrderBookScroller {...orderbookProps}/>);
        expect(wrapper.find(MultiDirectionalScroll).length).toBe(1);
    });

    it('should detect minimal amounts of PriceLevel components given props and update in props', () => {
        let wrapper = shallow(<TimestampOrderBookScroller/>);

        wrapper.instance().middleReferenceItem = {
            current: {
                scrollIntoView: jest.fn(),
            }
        };

        const spy = jest.spyOn(wrapper.instance(), 'componentDidUpdate');

        wrapper.setProps(orderbookProps);

        expect(spy).toHaveBeenCalled();

        expect(wrapper.state().listItems.length).toBe(2);
        expect(wrapper.find(PriceLevel).length).toBeGreaterThanOrEqual(2);
    });

});