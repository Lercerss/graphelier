/* eslint-disable camelcase */
import React, { Component } from 'react';
import { createStyles, WithStyles } from '@material-ui/core/styles';
import SwipeableDrawer from '@material-ui/core/SwipeableDrawer';
import Divider from '@material-ui/core/Divider';
import { withStyles } from '@material-ui/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import bigInt from 'big-integer';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';
import { Message, OrderInformationDrawer } from '../models/OrderBook';
import { Styles } from '../styles/OrderInformation';
import { MESSAGE_TYPE_ENUM } from '../constants/Enums';
import {
    convertNanosecondsUTCToCurrentTimezone, getLocalTimeString,
    nanosecondsToString,
    splitNanosecondEpochTimestamp,
} from '../utils/date-utils';
import { saveOrderbookTimestamp, showOrderInfoDrawer } from '../actions/actions';

const styles = createStyles(Styles);

interface Props extends WithStyles<typeof styles>{
    orderId : number,
    quantity: number,
    lastModified: string,
    createdOn: string,
    price: number,
    messages: Array<Message>,
    onOrderInfoClosed: Function,
    onMessageSelectedSetTimestamp: Function,
}

interface State {
    right: boolean,
}

class OrderInformation extends Component<Props, State> {
    constructor(props) {
        super(props);

        this.state = {
            right: true,
        };
    }

    handleOnMessageClick(timestamp) {
        const { onOrderInfoClosed, onMessageSelectedSetTimestamp } = this.props;
        const orderInformationDrawer: OrderInformationDrawer = {
            showOrderInfoDrawer: false,
        };
        onOrderInfoClosed(orderInformationDrawer);
        onMessageSelectedSetTimestamp(timestamp);
    }

    /**
     * @desc Renders the Drawer slider when open is set to true.
     * @param side :can be set to 'left' 'right' 'top' 'bottom' setting the side of the screen the drawer is shown
     * @param open :boolean set to true when drawer is open
     */
    renderToggleDrawer(side, open) {
        const { onOrderInfoClosed } = this.props;
        return event => {
            if (event && event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
                return;
            }
            if (!open) {
                const orderInformationDrawer: OrderInformationDrawer = {
                    showOrderInfoDrawer: false,
                };
                onOrderInfoClosed(orderInformationDrawer);
            }

            this.setState({ right: true, [side]: open });
        };
    }

    /**
     * @desc Renders the message list table inside the drawer with 3 columns: timestamp, type and quantity.
     * @returns {*}
     */
    renderMessageListTable() {
        const { messages, classes } = this.props;
        return (
            <Table
                className={classes.messagesTable}
                id={'orderMessageListTable'}
            >
                <TableHead>
                    <TableRow>
                        <TableCell>Timestamp</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Quantity</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {messages.map(message => {
                        const {
                            timestamp, message_type, share_qty, sod_offset,
                        } = message;

                        const { timeNanoseconds } = splitNanosecondEpochTimestamp(bigInt(timestamp));
                        const time = nanosecondsToString(
                            convertNanosecondsUTCToCurrentTimezone(bigInt(timeNanoseconds)).valueOf(),
                        );

                        return (
                            <TableRow
                                key={sod_offset}
                                id={'orderMessageListRow'}
                                className={classes.orderMessageListRow}
                                onClick={() => this.handleOnMessageClick(timestamp)}
                            >
                                <TableCell>{time}</TableCell>
                                <TableCell>{MESSAGE_TYPE_ENUM[message_type].name}</TableCell>
                                <TableCell>{share_qty}</TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        );
    }

    /**
     * @desc Renders the Drawer with a list of order information conatining order ID, quantity, last modified date,
     * created on date and price
     * @param side :side of the screen the Drawer opens from
     */
    renderSlideList(side) {
        const {
            orderId, quantity, lastModified, createdOn, price, classes,
        } = this.props;
        return (
            <div
                role={'presentation'}
                id={'orderDetailsTable'}
                onClick={this.renderToggleDrawer(side, false)}
                onKeyDown={this.renderToggleDrawer(side, false)}
            >
                <Table
                    className={classes.orderInfo}
                >
                    <TableBody>
                        <TableRow id={'orderDetailsRow'}>
                            <TableCell className={classes.orderIdHeader}>
                                <h2 className={classes.orderId}>
                                    {'ID:'}
                                </h2>
                            </TableCell>
                            <TableCell className={classes.orderIdHeader}>
                                <h2 className={classes.orderIdValue}>{orderId}</h2>
                            </TableCell>
                        </TableRow>
                        <TableRow id={'orderDetailsRow'}>
                            <TableCell className={classes.basicOrderInfo}>
                                {'Quantity:'}
                            </TableCell>
                            <TableCell className={classes.basicOrderInfoValue}>
                                { quantity }
                            </TableCell>
                        </TableRow>
                        <TableRow id={'orderDetailsRow'}>
                            <TableCell className={classes.basicOrderInfo}>
                                {'  Last Modified: '}
                            </TableCell>
                            <TableCell className={classes.basicOrderInfoValue}>
                                {getLocalTimeString(lastModified)}
                            </TableCell>
                        </TableRow>
                        <TableRow id={'orderDetailsRow'}>
                            <TableCell className={classes.basicOrderInfo}>
                                {'  Created on: '}
                            </TableCell>
                            <TableCell className={classes.basicOrderInfoValue}>
                                {getLocalTimeString(createdOn)}
                            </TableCell>
                        </TableRow>
                        <TableRow id={'orderDetailsRow'}>
                            <TableCell className={classes.basicOrderInfo}>
                                {'  Price:'}
                            </TableCell>
                            <TableCell className={classes.basicOrderInfoValue}>
                                {'$'}
                                {price}
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
                <Divider />
                <h2 className={classes.messageHeader}>Messages</h2>
                {this.renderMessageListTable()}
            </div>
        );
    }

    render() {
        const { right } = this.state;
        return (
            <div>
                <SwipeableDrawer
                    anchor={'right'}
                    open={right}
                    onClose={this.renderToggleDrawer('right', false)}
                    onOpen={this.renderToggleDrawer('right', true)}
                >
                    {this.renderSlideList('right')}
                </SwipeableDrawer>
            </div>
        );
    }
}

const mapDispatchToProps = (dispatch : Dispatch) => ({
    onOrderInfoClosed: (orderInformationDrawer: OrderInformationDrawer) => dispatch(
        showOrderInfoDrawer(orderInformationDrawer),
    ),
    onMessageSelectedSetTimestamp: (currentOrderbookTimestamp: string) => dispatch(
        saveOrderbookTimestamp(currentOrderbookTimestamp),
    ),
});

export const NonConnectedOrderInformation = withStyles(styles)(OrderInformation);

export default withStyles(styles)(connect(null, mapDispatchToProps)(OrderInformation));
