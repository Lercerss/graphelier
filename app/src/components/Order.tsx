import React, { Component } from 'react';
import { withStyles, WithStyles, createStyles } from '@material-ui/core/styles';
import classNames from 'classnames';
import { Dispatch } from 'redux';
import {
    Typography, Tooltip, Box,
} from '@material-ui/core';
import Zoom from '@material-ui/core/Zoom';
import bigInt from 'big-integer';
import { connect } from 'react-redux';
import { Styles } from '../styles/Order';
import {
    OrderInformationDrawer, TransactionType, OrderDetails,
} from '../models/OrderBook';
import OrderBookService from '../services/OrderBookService';
import { showOrderInfoDrawer } from '../actions/actions';
import { RootState } from '../store';

const styles = createStyles(Styles);

interface Props extends WithStyles<typeof styles> {
    type: TransactionType,
    quantity: number,
    maxQuantity: number,
    instrument: string,
    orderId: number,
    timestamp: bigInt.BigInteger,
    onOrderClicked: Function,
    orderIdFromState: number,
    orderInfoDrawerShown: boolean,
    playback: boolean,
}

class Order extends Component<Props> {
    /**
     * @desc handles event for sending request to retrieve order information when order is clicked on
     */
    handleOnOrderClick = () => {
        const {
            instrument, timestamp, orderId, quantity, onOrderClicked, playback,
        } = this.props;
        if (!playback) {
            OrderBookService.getOrderInformation(instrument, orderId, timestamp.toString())
                .then(response => {
                    const {
                        // eslint-disable-next-line camelcase
                        last_modified, created_on, price, messages,
                    } = response.data;
                    const orderDetails: OrderDetails = {
                        instrument,
                        id: orderId,
                        quantity,
                        price,
                        last_modified,
                        created_on,
                        messages,
                    };
                    const orderInformationDrawer: OrderInformationDrawer = {
                        orderDetails,
                        showOrderInfoDrawer: true,
                    };
                    onOrderClicked(orderInformationDrawer);
                });
        }
    };

    render() {
        const {
            classes, type, quantity, maxQuantity, orderId, orderIdFromState, orderInfoDrawerShown,
        } = this.props;
        const quantityBoxSize = (quantity / maxQuantity) * 100;
        const minQuantityTextSize = 2;
        const orderClasses = classNames(
            classes.quantity,
            classes.rectangle,
            type === TransactionType.Bid ? classes.bid : classes.ask,
        );
        const clickedOrderClass = classNames(
            classes.quantity,
            classes.rectangle,
            classes.getOrderInfo,
        );
        const shouldShowQuantity = quantityBoxSize > minQuantityTextSize;
        return (
            <Tooltip
                title={!shouldShowQuantity ? quantity : ''}
                placement={'bottom'}
                TransitionComponent={Zoom}
                classes={{ tooltip: classes.offsetTooltip }}
            >
                <Box
                    className={orderInfoDrawerShown
                    && orderIdFromState === orderId ? clickedOrderClass : orderClasses}
                    style={{ width: `${quantityBoxSize}%` }}
                    onClick={this.handleOnOrderClick}
                >
                    {shouldShowQuantity && (
                        <Typography className={orderInfoDrawerShown
                    && orderIdFromState === orderId ? classes.orderTextOnClick : classes.text}
                        >
                            {quantity}
                        </Typography>
                    )}
                </Box>
            </Tooltip>
        );
    }
}

const mapStateToProps = (state: RootState) => ({
    orderInfoDrawerShown: state.general.showOrderInfoDrawer,
    orderIdFromState: state.general.orderDetails ? state.general.orderDetails.id : -1,
});

const mapDispatchToProps = (dispatch : Dispatch) => ({
    onOrderClicked: (orderInformationDrawer: OrderInformationDrawer) => dispatch(
        showOrderInfoDrawer(orderInformationDrawer),
    ),
});

export default withStyles(styles)(connect(mapStateToProps, mapDispatchToProps)(Order));
