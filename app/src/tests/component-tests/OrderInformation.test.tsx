import React from 'react';
import { createMount, createShallow } from '@material-ui/core/test-utils';
import OrderInformation from '../../components/OrderInformation';
import { LAST_SOD_OFFSET, MESSAGE_INFORMATION, TIMESTAMP } from '../utils/mock-data';
import OrderBookService from '../../services/OrderBookService';

describe('OrderInformation', () => {
    let mount, shallow, messages, orderId, quantity, lastModified, createdOn, price, orderInformation;
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
        orderInformation = MESSAGE_INFORMATION;
    });

    it('should render the OrderInformation component without crashing', () => {
        mount(<OrderInformation
            orderId={orderId}
            quantity={quantity}
            lastModified={lastModified}
            createdOn={createdOn}
            price={price}
            messages={messages}
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
        />);
        wrapper.instance().setState(
            {
                orderInformation,
            },
        );
        expect(Object.keys(wrapper.instance().state.orderInformation.messages).length).toEqual(2);
        expect(wrapper.instance().state.orderInformation)
            .toEqual({
                instrument: 'SPY',
                id: 20933587,
                quantity: 598,
                price: 135.66,
                last_modified: '1577896319710937222',
                created_on: '1577896319710937222',
                messages: [
                    {
                        instrument: 'SPY',
                        timestamp: TIMESTAMP,
                        message_type: 1,
                        order_id: 20933587,
                        share_qty: 598,
                        price: 135.66,
                        direction: -1,
                        sod_offset: LAST_SOD_OFFSET,
                    },
                    {
                        instrument: 'SPY',
                        timestamp: TIMESTAMP,
                        message_type: 1,
                        order_id: 20933587,
                        share_qty: 2100,
                        price: 135.66,
                        direction: -1,
                        sod_offset: LAST_SOD_OFFSET,
                    },
                ],
            });
    });

    it('should not send a request to get orderInformation as it is sent in order component', () => {
        expect(getOrderInformation).toHaveBeenCalledTimes(0);
    });
});
