import React from 'react';
import { createMount, createShallow } from '@material-ui/core/test-utils';
import { NonConnectedOrderInformation as OrderInformation } from '../../components/OrderInformation';
import OrderBookService from '../../services/OrderBookService';
import { MESSAGE_INFORMATION } from '../utils/mock-data';

describe('OrderInformation', () => {
    let mount, shallow, messages, orderId, quantity, lastModified, createdOn, price, onOrderInfoMounted;
    const getOrderInformation = jest.spyOn(OrderBookService, 'getOrderInformation')
        .mockImplementation((instrument, id, timestamp): Promise<any> => Promise.resolve(
            {
                data: MESSAGE_INFORMATION,
            },
        )
            .catch(err => {
                console.log(err);
            }));
    beforeEach(() => {
        mount = createMount();
        shallow = createShallow({ dive: true });
        messages = MESSAGE_INFORMATION.messages;
        orderId = MESSAGE_INFORMATION.id;
        quantity = MESSAGE_INFORMATION.quantity;
        lastModified = MESSAGE_INFORMATION.last_modified;
        createdOn = MESSAGE_INFORMATION.created_on;
        price = MESSAGE_INFORMATION.price;
        onOrderInfoMounted = jest.fn();
    });

    it('should render the OrderInformation component without crashing', () => {
        mount(<OrderInformation
            orderId={orderId}
            quantity={quantity}
            lastModified={lastModified}
            createdOn={createdOn}
            price={price}
            messages={messages}
            onOrderInfoMounted={onOrderInfoMounted}
        />);
    });

    it('should render orderInformation with the correct data', () => {
        const wrapper = shallow(<OrderInformation
            orderId={orderId}
            quantity={quantity}
            lastModified={lastModified}
            createdOn={createdOn}
            price={price}
            messages={messages}
            onOrderInfoMounted={onOrderInfoMounted}
        />);
        expect(wrapper.find('#orderDetailsTable')).toHaveLength(1);
        expect(wrapper.find('#orderDetailsRow')).toHaveLength(5);
        expect(wrapper.find('#orderMessageListTable')).toHaveLength(1);
        expect(wrapper.find('#orderMessageListRow')).toHaveLength(2);
    });

    it('should not send a request to get orderInformation as it is sent in order component', () => {
        expect(getOrderInformation).toHaveBeenCalledTimes(0);
    });
});
