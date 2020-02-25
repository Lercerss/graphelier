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
    Message, OrderInformationDrawer, TransactionType, OrderDetails,
} from '../models/OrderBook';
import OrderBookService from '../services/OrderBookService';
import { showOrderInfoDrawer } from '../actions/actions';

const styles = createStyles(Styles);

interface Props extends WithStyles<typeof styles> {
    type: TransactionType,
    quantity: number,
    maxQuantity: number,
    instrument: string,
    orderId: number,
    timestamp: bigInt.BigInteger,
    onOrderClicked: Function,
}

interface State {
    lastModified: string,
    createdOn: string,
    price: number,
    messages: Array<Message>,
    infoDrawerShown : boolean,
}

class Order extends Component<Props, State> {
    /**
     * @desc handles event for sending request to retrieve order information when order is clicked on
     */
    handleOnOrderClick = () => {
        const {
            instrument, timestamp, orderId, quantity, onOrderClicked,
        } = this.props;
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
    };

    render() {
        const {
            classes, type, quantity, maxQuantity,
        } = this.props;
        const quantityBoxSize = (quantity / maxQuantity) * 100;
        const minQuantityTextSize = 2;
        const orderClasses = classNames(
            classes.quantity,
            classes.rectangle,
            type === TransactionType.Bid ? classes.bid : classes.ask,
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
                    className={orderClasses}
                    style={{ width: `${quantityBoxSize}%` }}
                    onClick={this.handleOnOrderClick}
                >
                    {shouldShowQuantity && <Typography className={classes.text}>{quantity}</Typography>}
                </Box>
            </Tooltip>
        );
    }
}

const mapStateToProps = () => ({});

const mapDispatchToProps = (dispatch : Dispatch) => ({
    // eslint-disable-next-line max-len
    onOrderClicked: (orderInformationDrawer: OrderInformationDrawer) => dispatch(showOrderInfoDrawer(orderInformationDrawer)),
});

export default withStyles(styles)(connect(mapStateToProps, mapDispatchToProps)(Order));
