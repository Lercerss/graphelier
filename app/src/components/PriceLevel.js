import React, {Component} from 'react';
import {withStyles} from '@material-ui/core/styles';
import classNames from 'classnames';

import {Styles} from '../styles/PriceLevel';

import Order from './Order';
import {Box} from '@material-ui/core';
import {ordersEquals} from '../utils/order-book-utils';
import {roundNumber} from '../utils/number-utils';

class PriceLevel extends Component {

    shouldComponentUpdate(nextProps, nextState, nextContext) {
        const {orders, maxQuantity} = this.props;

        return !ordersEquals(orders, nextProps.orders) || maxQuantity !== nextProps.maxQuantity;
    }

    render() {
        const { classes, type, price, orders, maxQuantity } = this.props;
        const formattedPrice = roundNumber(price, 2);

        return (
            <Box className={classNames(classes.row, type === 'bid' ? classes.bid : classes.ask)}>
                <span className={classes.price}>{formattedPrice}</span>
                <Box className={classes.quantitiesBox}>
                    {orders.map((order, index) =>
                        <Order
                            key={index}
                            type={type}
                            quantity={order.quantity}
                            maxQuantity={maxQuantity}
                        />)}
                </Box>
            </Box>
        );
    }
}

export default withStyles(Styles)(PriceLevel);
