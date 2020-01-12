import React, { Component } from 'react';
import { withStyles, WithStyles, createStyles } from '@material-ui/core/styles';
import classNames from 'classnames';

import { Box } from '@material-ui/core';
import { Styles } from '../styles/PriceLevel';
import Order from './Order';

import { ordersEquals } from '../utils/order-book-utils';
import { roundNumber } from '../utils/number-utils';
import { TransactionType, Order as OrderType } from '../models/OrderBook';

const styles = createStyles(Styles);

interface Props extends WithStyles<typeof styles>{
    orders: Array<OrderType>,
    maxQuantity: number,
    type: TransactionType,
    price: number,
}

class PriceLevel extends Component<Props> {
    shouldComponentUpdate(nextProps, nextState, nextContext) {
        const { orders, maxQuantity } = this.props;

        return !ordersEquals(orders, nextProps.orders) || maxQuantity !== nextProps.maxQuantity;
    }

    render() {
        const {
            classes, type, price, orders, maxQuantity,
        } = this.props;
        const formattedPrice = roundNumber(price, 2);

        return (
            <Box className={classNames(classes.row, type === TransactionType.Bid ? classes.bid : classes.ask)}>
                <span className={classes.price}>{formattedPrice}</span>
                <Box className={classes.quantitiesBox}>
                    {orders.map((order, index) => (
                        <Order
                            key={index.toString()}
                            type={type}
                            quantity={order.quantity}
                            maxQuantity={maxQuantity}
                        />
                    ))}
                </Box>
            </Box>
        );
    }
}

export default withStyles(styles)(PriceLevel);
