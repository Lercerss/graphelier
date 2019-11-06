import React from 'react';
import { createMount, createShallow } from '@material-ui/core/test-utils';
import { Box } from '@material-ui/core';
import TimestampOrderBookScroller from '../../components/TimestampOrderBookScroller';
import { ORDER_BOOK_FROM_BACKEND, ORDER_BOOK_LIST_ITEMS } from '../utils/mock-data';
import MultiDirectionalScroll from '../../components/MultiDirectionalScroll';
import PriceLevel from '../../components/PriceLevel';

describe('TimestampOrderbookScroller functionality', () => {
    let mount, shallow;

    beforeEach(() => {
        mount = createMount();
        shallow = createShallow({ dive: true });
    });

    afterEach(() => {
        mount.cleanUp();
    });

    it('renders a TimestampOrderbookScroller component with expected props', () => {
        const wrapper = mount(<TimestampOrderBookScroller orderBook={ORDER_BOOK_FROM_BACKEND} />);
        expect(wrapper.props().orderBook).toBeDefined();
        expect(wrapper.props().orderBook).toEqual(ORDER_BOOK_FROM_BACKEND);
    });

    it('renders a TimestampOrderbookScroller component with correct amount of material ui boxes', () => {
        const wrapper = shallow(<TimestampOrderBookScroller orderBook={ORDER_BOOK_FROM_BACKEND} />);
        expect(wrapper.find(Box).length).toBeGreaterThanOrEqual(3);
    });

    it('renders a TimestampOrderbookScroller component with no MultiDirectionalScroll '
        + 'if listItems is undefined', () => {
        const wrapper = mount(<TimestampOrderBookScroller orderBook={ORDER_BOOK_FROM_BACKEND} />);
        expect(wrapper.find(MultiDirectionalScroll).length).toBe(0);
    });

    it('renders a TimestampOrderbookScroller component with a MultiDirectionalScroll if listItems is defined', () => {
        const wrapper = mount(
            <TimestampOrderBookScroller
                orderBook={ORDER_BOOK_FROM_BACKEND}
                listItems={ORDER_BOOK_LIST_ITEMS}
            />,
        );

        expect(wrapper.find(MultiDirectionalScroll).length).toBe(1);
    });

    it('should detect minimal amounts of PriceLevel components given props and update in props', () => {
        const wrapper = shallow(<TimestampOrderBookScroller />);

        wrapper.instance().middleReferenceItem = {
            current: {
                scrollIntoView: jest.fn(),
            },
        };

        const cduSpy = jest.spyOn(wrapper.instance(), 'componentDidUpdate');
        wrapper.setProps({ listItems: ORDER_BOOK_LIST_ITEMS });
        expect(cduSpy).toHaveBeenCalled();

        expect(wrapper.find(PriceLevel).length).toBeGreaterThanOrEqual(2);
    });

    it('should detect a scroll to top of the book given props and update in props', () => {
        const wrapper = shallow(<TimestampOrderBookScroller />);

        wrapper.instance().middleReferenceItem = {
            current: {
                scrollIntoView: jest.fn(),
            },
        };
        const scrollSpy = jest.spyOn(wrapper.instance(), 'handleScrollToTopOfTheBook');

        wrapper.setProps({ listItems: ORDER_BOOK_LIST_ITEMS });
        expect(scrollSpy).toHaveBeenCalled();
    });
});
