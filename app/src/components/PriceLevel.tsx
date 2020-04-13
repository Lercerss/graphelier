import React, { Component } from 'react';
import { withStyles, WithStyles, createStyles } from '@material-ui/core/styles';
import classNames from 'classnames';
import bigInt from 'big-integer';
import { CSSTransition, TransitionGroup } from 'react-transition-group';

import { Box } from '@material-ui/core';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';
import { Styles } from '../styles/PriceLevel';
import Order from './Order';
import { ordersEquals } from '../utils/order-book-utils';
import { roundNumber } from '../utils/number-utils';
import { TransactionType, Order as OrderType } from '../models/OrderBook';
import { RootState } from '../store';
import { ANIMATION_TIME } from '../constants/Constants';

const styles = createStyles(Styles);

interface Props extends WithStyles<typeof styles> {
    orders: Array<OrderType>,
    maxQuantity: number,
    type: TransactionType,
    price: number,
    instrument: string,
    timestamp: bigInt.BigInteger,
    playback: boolean,
    disableTransitions: boolean,
}

class PriceLevel extends Component<Props> {
    shouldComponentUpdate(nextProps, nextState, nextContext) {
        const {
            orders, maxQuantity, playback, disableTransitions,
        } = this.props;

        return !ordersEquals(orders, nextProps.orders) || maxQuantity !== nextProps.maxQuantity
            || playback !== nextProps.playback || disableTransitions !== nextProps.disableTransitions;
    }

    render() {
        const {
            classes, type, price, orders, maxQuantity, instrument, timestamp, playback, disableTransitions,
        } = this.props;
        const formattedPrice = roundNumber(price, 2);

        return (
            <Box className={classNames(classes.row, type === TransactionType.Bid ? classes.bid : classes.ask)}>
                <span className={classes.price}>{formattedPrice}</span>
                {
                    !disableTransitions
                        ? (
                            <TransitionGroup className={classes.quantitiesBox}>
                                {
                                    orders.map((order: OrderType) => (
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
                                                key={order.id}
                                                type={type}
                                                quantity={order.quantity}
                                                orderId={order.id}
                                                maxQuantity={maxQuantity}
                                                instrument={instrument}
                                                timestamp={timestamp}
                                                playback={playback}
                                            />
                                        </CSSTransition>
                                    ))
                                }
                            </TransitionGroup>
                        )
                        : (
                            orders.map((order: OrderType) => (
                                <Order
                                    key={order.id}
                                    type={type}
                                    quantity={order.quantity}
                                    orderId={order.id}
                                    maxQuantity={maxQuantity}
                                    instrument={instrument}
                                    timestamp={timestamp}
                                    playback={playback}
                                />
                            ))
                        )
                }
            </Box>
        );
    }
}

export const NonConnectedPriceLevel = withStyles(styles)(PriceLevel);

const mapStateToProps = (state: RootState) => ({
    disableTransitions: state.general.disableTransitions,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
});

export default withStyles(styles)(connect(mapStateToProps, mapDispatchToProps)(PriceLevel));
