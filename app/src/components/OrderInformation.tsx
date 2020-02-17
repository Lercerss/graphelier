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
import { Message } from '../models/OrderBook';
import { Styles } from '../styles/OrderInformation';
import { MESSAGE_TYPE_ENUM } from '../constants/Enums';
import {
    convertNanosecondsUTCToCurrentTimezone, getLocalTimeString,
    nanosecondsToString,
    splitNanosecondEpochTimestamp,
} from '../utils/date-utils';

const styles = createStyles(Styles);

interface Props extends WithStyles<typeof styles>{
    orderId : number,
    quantity: number,
    lastModified: string,
    createdOn: string,
    price: number,
    messages: Array<Message>,
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

    /**
     * @desc Renders the Drawer slider when open is set to true.
     * @param side :can be set to 'left' 'right' 'top' 'bottom' setting the side of the screen the drawer is shown
     * @param open :boolean set to true when drawer is open
     */
    renderToggleDrawer(side, open) {
        return event => {
            if (event && event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
                return;
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
            <Table className={classes.messagesTable}>
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
                            // eslint-disable-next-line camelcase
                            timestamp, message_type, share_qty, order_id,
                        } = message;

                        const { timeNanoseconds } = splitNanosecondEpochTimestamp(bigInt(timestamp));
                        const time = nanosecondsToString(
                            convertNanosecondsUTCToCurrentTimezone(bigInt(timeNanoseconds)).valueOf(),
                        );

                        return (
                            // eslint-disable-next-line camelcase
                            <TableRow key={order_id}>
                                <TableCell>{time}</TableCell>
                                <TableCell>{MESSAGE_TYPE_ENUM[message_type].name}</TableCell>
                                {/* eslint-disable-next-line camelcase */}
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
                onClick={this.renderToggleDrawer(side, false)}
                onKeyDown={this.renderToggleDrawer(side, false)}
            >
                <Table
                    className={classes.orderInfo}
                >
                    <TableRow>
                        <TableCell className={classes.orderIdHeader}>
                            <h2 className={classes.orderId}>
                                {'ID:'}
                            </h2>
                        </TableCell>
                        <TableCell className={classes.orderIdHeader}>
                            <h2 className={classes.orderIdValue}>{orderId}</h2>
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell className={classes.basicOrderInfo}>
                            {'Quantity:'}
                        </TableCell>
                        <TableCell className={classes.basicOrderInfoValue}>
                            { quantity }
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell className={classes.basicOrderInfo}>
                            {'  Last Modified: '}
                        </TableCell>
                        <TableCell className={classes.basicOrderInfoValue}>
                            {getLocalTimeString(lastModified)}
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell className={classes.basicOrderInfo}>
                            {'  Created on: '}
                        </TableCell>
                        <TableCell className={classes.basicOrderInfoValue}>
                            {getLocalTimeString(createdOn)}
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell className={classes.basicOrderInfo}>
                            {'  Price:'}
                        </TableCell>
                        <TableCell className={classes.basicOrderInfoValue}>
                            {'$'}
                            {price}
                        </TableCell>
                    </TableRow>
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

export default withStyles(styles)(OrderInformation);
