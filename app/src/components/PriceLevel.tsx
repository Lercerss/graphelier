import React, { Component } from 'react';
import { withStyles, WithStyles, createStyles } from '@material-ui/core/styles';
import classNames from 'classnames';
import bigInt from 'big-integer';
import { CSSTransition, TransitionGroup } from 'react-transition-group';

import { Box } from '@material-ui/core';
import { Styles } from '../styles/PriceLevel';
import Order from './Order';
import { ordersEquals } from '../utils/order-book-utils';
import { roundNumber } from '../utils/number-utils';
import { TransactionType, Order as OrderType } from '../models/OrderBook';
import { ANIMATION_TIME } from '../constants/Constants';

const styles = createStyles(Styles);

interface Props extends WithStyles<typeof styles> {
    orders: Array<OrderType>,
    maxQuantity: number,
    type: TransactionType,
    price: number,
    instrument: string,
    timestamp: bigInt.BigInteger,
}

class PriceLevel extends Component<Props> {
    shouldComponentUpdate(nextProps, nextState, nextContext) {
        // eslint-disable-next-line no-unused-vars,@typescript-eslint/no-unused-vars
        const { orders, maxQuantity, instrument } = this.props;

        return !ordersEquals(orders, nextProps.orders) || maxQuantity !== nextProps.maxQuantity;
    }

    render() {
        const {
            classes, type, price, orders, maxQuantity, instrument, timestamp,
        } = this.props;
        const formattedPrice = roundNumber(price, 2);

        return (
            <Box className={classNames(classes.row, type === TransactionType.Bid ? classes.bid : classes.ask)}>
                <span className={classes.price}>{formattedPrice}</span>
                <TransitionGroup className={classes.quantitiesBox}>
                    {orders.map((order: OrderType) => (
                        <CSSTransition
                            key={order.id}
                            timeout={ANIMATION_TIME}
                            classNames={{
                                enter: classes.orderEnter,
                                enterActive: classes.orderEnterActive,
                                exit: classes.orderExit,
                                exitActive: classes.orderExitActive,
                            }}
                        >
                            <Order
                                type={type}
                                quantity={order.quantity}
                                orderId={order.id}
                                maxQuantity={maxQuantity}
                                instrument={instrument}
                                timestamp={timestamp}
                            />
                        </CSSTransition>
                    ))}
                </TransitionGroup>
            </Box>
        );
    }
}

export default withStyles(styles)(PriceLevel);
