import React from 'react';
import { createMount, createShallow } from '@material-ui/core/test-utils';
import { Box } from '@material-ui/core';
import bigInt from 'big-integer';
import TimestampOrderBookScroller from '../../components/TimestampOrderBookScroller';
import {
    INSTRUMENT, MAX_QUANTITY,
    ORDER_BOOK_FROM_BACKEND,
    ORDER_BOOK_LIST_ITEMS,
} from '../utils/mock-data';
import MultiDirectionalScroll from '../../components/MultiDirectionalScroll';
import PriceLevel from '../../components/PriceLevel';
import OrderBookService from '../../services/OrderBookService';
import { TransactionType } from '../../models/OrderBook';

describe('TimestampOrderbookScroller functionality', () => {
    let mount, shallow;
    const timeOrDateIsNotSet = false;
    const handleUpdateWithDeltas = jest.fn();
    const loadingOrderbook: boolean = false;

    beforeEach(() => {
        mount = createMount();
        shallow = createShallow({ dive: true });
    });

    afterEach(() => {
        mount.cleanUp();
    });

    it('renders a TimestampOrderbookScroller component with expected props', () => {
        const wrapper = mount(<TimestampOrderBookScroller
            timeOrDateIsNotSet={timeOrDateIsNotSet}
            handleUpdateWithDeltas={handleUpdateWithDeltas}
            lastSodOffset={bigInt(0)}
            instrument={INSTRUMENT}
            listItems={ORDER_BOOK_LIST_ITEMS}
            maxQuantity={MAX_QUANTITY}
            loading={loadingOrderbook}
            timestamp={bigInt(0)}
        />);
        expect(wrapper.props().timeOrDateIsNotSet).toBeDefined();
        expect(wrapper.props().timeOrDateIsNotSet).toEqual(false);
        expect(wrapper.props().handleUpdateWithDeltas).toBeDefined();
        expect(wrapper.props().lastSodOffset).toBeDefined();
        expect(wrapper.props().instrument).toBeDefined();
        expect(wrapper.props().instrument).toEqual('SPY');
        expect(wrapper.props().listItems).toBeDefined();
        expect(wrapper.props().timeOrDateIsNotSet).toEqual(timeOrDateIsNotSet);
        expect(wrapper.props().maxQuantity).toBeDefined();
        expect(wrapper.props().maxQuantity).toEqual(20000);
        expect(wrapper.props().loading).toBeDefined();
    });

    it('renders a TimestampOrderbookScroller component with correct amount of material ui boxes', () => {
        const wrapper = shallow(<TimestampOrderBookScroller
            timeOrDateIsNotSet={timeOrDateIsNotSet}
            handleUpdateWithDeltas={handleUpdateWithDeltas}
            lastSodOffset={bigInt(0)}
            instrument={INSTRUMENT}
            listItems={ORDER_BOOK_LIST_ITEMS}
            maxQuantity={MAX_QUANTITY}
            loading={loadingOrderbook}
            timestamp={bigInt(0)}
        />);
        expect(wrapper.find(Box).length).toBeGreaterThanOrEqual(3);
    });

    it('renders a TimestampOrderbookScroller component with no MultiDirectionalScroll '
        + 'if listItems is undefined', () => {
        // @ts-ignore
        const wrapper = mount(<TimestampOrderBookScroller
            timeOrDateIsNotSet={timeOrDateIsNotSet}
            handleUpdateWithDeltas={handleUpdateWithDeltas}
            lastSodOffset={bigInt(0)}
            instrument={INSTRUMENT}
            maxQuantity={MAX_QUANTITY}
            loading={loadingOrderbook}
            timestamp={bigInt(0)}
        />);
        expect(wrapper.find(MultiDirectionalScroll).length).toBe(0);
    });

    it('renders a TimestampOrderbookScroller component with a MultiDirectionalScroll if listItems is defined', () => {
        const wrapper = mount(<TimestampOrderBookScroller
            timeOrDateIsNotSet={timeOrDateIsNotSet}
            handleUpdateWithDeltas={handleUpdateWithDeltas}
            lastSodOffset={bigInt(0)}
            instrument={INSTRUMENT}
            listItems={ORDER_BOOK_LIST_ITEMS}
            maxQuantity={MAX_QUANTITY}
            loading={loadingOrderbook}
            timestamp={bigInt(0)}
        />);

        expect(wrapper.find(MultiDirectionalScroll).length).toBe(1);
    });

    it('should detect minimal amounts of PriceLevel components given props and update in props', () => {
        const wrapper = shallow(<TimestampOrderBookScroller
            timeOrDateIsNotSet={timeOrDateIsNotSet}
            handleUpdateWithDeltas={handleUpdateWithDeltas}
            lastSodOffset={bigInt(0)}
            instrument={INSTRUMENT}
            listItems={{}}
            maxQuantity={MAX_QUANTITY}
            loading={loadingOrderbook}
            timestamp={bigInt(0)}
        />);

        wrapper.instance().middleReferenceItem = {
            current: {
                scrollIntoView: jest.fn(),
            },
        };

        const cduSpy = jest.spyOn(wrapper.instance(), 'componentDidUpdate');
        wrapper.setProps({ listItems: ORDER_BOOK_LIST_ITEMS, lastSodOffset: bigInt(1) });
        expect(cduSpy).toHaveBeenCalled();

        expect(wrapper.find(PriceLevel).length).toBeGreaterThanOrEqual(2);
    });

    it('should detect a scroll to top of the book given props and update in props', () => {
        const wrapper = shallow(<TimestampOrderBookScroller
            timeOrDateIsNotSet={timeOrDateIsNotSet}
            handleUpdateWithDeltas={handleUpdateWithDeltas}
            lastSodOffset={bigInt(0)}
            instrument={INSTRUMENT}
            listItems={ORDER_BOOK_LIST_ITEMS}
            maxQuantity={MAX_QUANTITY}
            loading={loadingOrderbook}
            timestamp={bigInt(0)}
        />);

        wrapper.instance().middleReferenceItem = {
            current: {
                scrollIntoView: jest.fn(),
            },
        };
        const scrollSpy = jest.spyOn(wrapper.instance(), 'handleScrollToTopOfTheBook');

        wrapper.setProps({ listItems: ORDER_BOOK_LIST_ITEMS });
        expect(scrollSpy).toHaveBeenCalledTimes(0);
        wrapper.setProps({
            listItems: {
                ...ORDER_BOOK_LIST_ITEMS,
                100: {
                    price: ORDER_BOOK_FROM_BACKEND.bids[0].price,
                    isMiddle: false,
                    type: TransactionType.Bid,
                    orders: ORDER_BOOK_FROM_BACKEND.bids[0].orders,
                },
            },
            lastSodOffset: bigInt(1),
        });
        expect(scrollSpy).toHaveBeenCalledTimes(1);
    });

    it('calls the function for changing the loading props to false', () => {
        const newLoadingOrderbook: boolean = true;
        const wrapper = shallow(<TimestampOrderBookScroller
            timeOrDateIsNotSet={timeOrDateIsNotSet}
            handleUpdateWithDeltas={handleUpdateWithDeltas}
            lastSodOffset={bigInt(0)}
            instrument={INSTRUMENT}
            listItems={ORDER_BOOK_LIST_ITEMS}
            maxQuantity={MAX_QUANTITY}
            loading={newLoadingOrderbook}
            timestamp={bigInt(0)}
        />);

        const div = () => wrapper.find('#orderbookListItems');
        expect(div().hasClass(/TimestampOrderBookScroller-hide-\d*/)).toBe(true);
        wrapper.setProps({ loading: false });
        expect(div().hasClass(/TimestampOrderBookScroller-hide-\d*/)).toBe(false);
    });
});

describe('navigating by message functionality', () => {
    let mount, shallow;
    const timeOrDateIsNotSet = false;
    const handleUpdateWithDeltas = jest.fn();
    const loadingOrderbook: boolean = false;
    const getOrderBookPricesByMessageOffsetSpy = jest.spyOn(OrderBookService, 'getPriceLevelsByMessageOffset')
        .mockImplementation((instrument, timestamp, offset): Promise<any> => Promise.resolve(
            {
                data: ORDER_BOOK_FROM_BACKEND,
            },
        ));

    beforeEach(() => {
        mount = createMount();
        shallow = createShallow({ dive: true });
    });

    afterEach(() => {
        getOrderBookPricesByMessageOffsetSpy.mockClear();
        mount.cleanUp();
    });

    it('makes appropriate database call when the previous and next message arrows are clicked', () => {
        const wrapper = shallow(<TimestampOrderBookScroller
            timeOrDateIsNotSet={timeOrDateIsNotSet}
            handleUpdateWithDeltas={handleUpdateWithDeltas}
            lastSodOffset={bigInt(0)}
            instrument={INSTRUMENT}
            listItems={ORDER_BOOK_LIST_ITEMS}
            maxQuantity={MAX_QUANTITY}
            loading={loadingOrderbook}
            timestamp={bigInt(0)}
        />);

        expect(getOrderBookPricesByMessageOffsetSpy).toHaveBeenCalledTimes(0);

        wrapper.find('#previousMessage').simulate('click');
        expect(getOrderBookPricesByMessageOffsetSpy).toHaveBeenCalledTimes(1);
        expect(getOrderBookPricesByMessageOffsetSpy.mock.calls[0][2]).toEqual('-1');

        wrapper.find('#nextMessage').simulate('click');
        expect(getOrderBookPricesByMessageOffsetSpy).toHaveBeenCalledTimes(2);
        expect(getOrderBookPricesByMessageOffsetSpy.mock.calls[1][2]).toEqual('1');
    });
});
