import React from 'react';
import { createMount } from '@material-ui/core/test-utils';
import { NonConnectedOrderInformation as OrderInformation } from '../../components/OrderInformation';
import { MESSAGE_INFORMATION } from '../utils/mock-data';
import OrderBookService from '../../services/OrderBookService';

describe('OrderInformation', () => {
    let mount, props;
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
        props = {
            messages: MESSAGE_INFORMATION.messages,
            orderId: MESSAGE_INFORMATION.id,
            quantity: MESSAGE_INFORMATION.quantity,
            lastModified: MESSAGE_INFORMATION.last_modified,
            createdOn: MESSAGE_INFORMATION.created_on,
            price: MESSAGE_INFORMATION.price,
            onOrderInfoClosed: jest.fn(),
        };
    });

    it('should render the OrderInformation component without crashing', () => {
        mount(<OrderInformation
            orderId={props.orderId}
            quantity={props.quantity}
            lastModified={props.lastModified}
            createdOn={props.createdOn}
            price={props.price}
            messages={props.messages}
            onOrderInfoClosed={props.onOrderInfoClosed}
        />);
    });

    it('should not send a request to get orderInformation as it is sent in order component', () => {
        expect(getOrderInformation).toHaveBeenCalledTimes(0);
    });
});
