import React from 'react';
import { createMount, createShallow } from '@material-ui/core/test-utils';
import MessageList from '../../components/MessageList';
import OrderBookService from '../../services/OrderBookService';
import { MESSAGE_LIST, ORDER_BOOK_FROM_BACKEND } from '../utils/mock-data';

describe('MessageList', () => {
    let mount, shallow, messageList;
    const getMessageListSpy = jest.spyOn(OrderBookService, 'getMessageList')
        .mockClear((instrument, sodOffset, nMessages = 20) => Promise.resolve(
            {
                data: ORDER_BOOK_FROM_BACKEND,
            },
        )
            .catch(err => {
                console.log(err);
            }));
    beforeEach(() => {
        mount = createMount();
        shallow = createShallow({ dive: true });
        messageList = { ...MESSAGE_LIST };
    });

    afterEach(() => {
        getMessageListSpy.mockClear();
        mount.cleanUp();
    });

    it('should render a messageList without crashing', () => {
        mount(<MessageList />);
    });

    it('should not send a request to get message list when the date is not selected', () => {
        expect(getMessageListSpy).toHaveBeenCalledTimes(0);
    });

    it('should get the correct data when the messageList request is made', () => {
        const wrapper = shallow(<MessageList />);
        wrapper.instance().setState(
            {
                messageList,
            },
        );
        expect(Object.keys(wrapper.instance().state.messageList.messages).length).toEqual(2);

        expect(wrapper.instance().state.messageList.messages[0])
            .toEqual({
                instrument: 'SPY',
                timestamp: 1340280000000000000,
                message_type: 1,
                order_id: 20933587,
                share_qty: 598,
                price: 135.66,
                direction: -1,
                sod_offset: '3',
            });
    });
});
