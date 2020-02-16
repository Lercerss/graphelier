import React, { Component } from 'react';
import { withStyles, WithStyles, createStyles } from '@material-ui/core/styles';
import classNames from 'classnames';

import {
    Typography, Tooltip, Box,
} from '@material-ui/core';
import Zoom from '@material-ui/core/Zoom';
import bigInt from 'big-integer';
import { Styles } from '../styles/Order';
import { Message, TransactionType } from '../models/OrderBook';
import OrderInformation from './OrderInformation';
import OrderBookService from '../services/OrderBookService';

const styles = createStyles(Styles);

interface Props extends WithStyles<typeof styles> {
    type: TransactionType,
    quantity: number,
    maxQuantity: number,
    instrument: string,
    orderId: number,
    timestamp: bigInt.BigInteger,
}

interface State {
    lastModified: string,
    createdOn: string,
    price: number,
    messages: Array<Message>,
    infoDrawerShown : boolean,
}

class Order extends Component<Props, State> {
    constructor(props) {
        super(props);

        this.state = {
            infoDrawerShown: false,
            lastModified: '',
            createdOn: '',
            price: 0,
            messages: [],
        };
    }

    handleOnOrderClick = () => {
        const { instrument, timestamp, orderId } = this.props;
        OrderBookService.getOrderInformation(instrument, orderId, timestamp.toString())
            .then(response => {
                const {
                    // eslint-disable-next-line camelcase
                    last_modified, created_on, price, messages,
                } = response.data;
                this.setState({
                    lastModified: last_modified,
                    createdOn: created_on,
                    price,
                    messages,
                    infoDrawerShown: true,
                });
            });
    };

    renderOrderInformation() {
        const {
            lastModified, createdOn, price, messages,
        } = this.state;
        const { quantity, orderId } = this.props;
        return (
            <OrderInformation
                orderId={orderId}
                quantity={quantity}
                lastModified={lastModified}
                createdOn={createdOn}
                price={price}
                messages={messages}
            />
        );
    }

    render() {
        const {
            classes, type, quantity, maxQuantity,
        } = this.props;
        const { infoDrawerShown } = this.state; // TODO: needs to be changed with redux
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
                    {infoDrawerShown && this.renderOrderInformation()}
                    {shouldShowQuantity && <Typography className={classes.text}>{quantity}</Typography>}
                </Box>
            </Tooltip>
        );
    }
}

export default withStyles(styles)(Order);
