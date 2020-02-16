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

    renderToggleDrawer(side, open) {
        return event => {
            if (event && event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
                return;
            }

            this.setState({ right: true, [side]: open });
        };
    }

    renderSlideList(side) {
        const {
            orderId, quantity, lastModified, createdOn, price, messages, classes,
        } = this.props;
        return (
            <div
                role={'presentation'}
                onClick={this.renderToggleDrawer(side, false)}
                onKeyDown={this.renderToggleDrawer(side, false)}
            >
                <Table className={classes.orderInfo}>
                    <TableHead className={classes.orderIdHeader}>
                        <h2>
                            {'ID: '}
                            {orderId}
                        </h2>
                    </TableHead>
                    <TableRow>
                        <TableCell>
                            {'Quantity: '}
                            {quantity}
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell>
                            {'Last Modified: '}
                            {getLocalTimeString(lastModified)}
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell>
                            {'Created on: '}
                            {getLocalTimeString(createdOn)}
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell>
                            {'Price: $'}
                            {price}
                        </TableCell>
                    </TableRow>
                </Table>
                <Divider />
                <h2 className={classes.messageHeader}>Messages</h2>
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
