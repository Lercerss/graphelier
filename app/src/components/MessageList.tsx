/* eslint-disable camelcase */
import React, { Component } from 'react';
import { withStyles, createStyles, WithStyles } from '@material-ui/core/styles';
import { Box } from '@material-ui/core';
import classNames from 'classnames';
import Button from '@material-ui/core/Button';
import bigInt from 'big-integer';

import OrderBookService from '../services/OrderBookService';
import {
    MESSAGE_LIST_DEFAULT_PAGE_SIZE,
} from '../constants/Constants';
import MultiDirectionalScroll from './MultiDirectionalScroll';
import { Styles } from '../styles/MessageList';
import { roundNumber } from '../utils/number-utils';
import { getMessageDirection } from '../utils/order-book-utils';
import { MESSAGE_TYPE_ENUM } from '../constants/Enums';
import {
    nanosecondsToString,
    splitNanosecondEpochTimestamp,
    convertNanosecondsUTCToCurrentTimezone,
} from '../utils/date-utils';
import { Message } from '../models/OrderBook';

const styles = createStyles(Styles);

interface Props extends WithStyles<typeof styles>{
    lastSodOffset: bigInt.BigInteger,
    instrument: string,
    handleUpdateWithDeltas: Function,
}

interface State {
    messages: Array<Message>,
    lastSodOffsetTop: bigInt.BigInteger,
    lastSodOffsetBottom: bigInt.BigInteger,
}

class MessageList extends Component<Props, State> {
    constructor(props) {
        super(props);

        this.state = {
            messages: [],
            lastSodOffsetTop: bigInt(0),
            lastSodOffsetBottom: bigInt(0),
        };
    }

    componentDidMount() {
        this.fetchInitialMessages();
    }

    shouldComponentUpdate(nextProps: Readonly<Props>, nextState: Readonly<State>, nextContext: any): boolean {
        const { lastSodOffset } = this.props;
        const { messages } = this.state;

        return (lastSodOffset.neq(nextProps.lastSodOffset) || messages !== nextState.messages);
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        const { lastSodOffset } = this.props;
        const { messages } = this.state;

        if (lastSodOffset.neq(prevProps.lastSodOffset)) {
            const messageIndex = this.getPotentialIndexOfLastSodOffsetFromProps();
            if (messageIndex !== -1) {
                const messagesLength = messages.length;
                const halfway = messagesLength / 2;
                const directionOfPotentialPaging = (messageIndex > halfway) ? 'bottom' : 'top';
                const diffFromEdge = directionOfPotentialPaging === 'bottom'
                    ? messagesLength - messageIndex : messageIndex;

                if (diffFromEdge < 5) {
                    this.handleHitEdge(directionOfPotentialPaging);
                }
            } else {
                this.fetchInitialMessages();
            }
        }
    }

    /**
     * @desc Helper that checks for existence of a message in the array of messages (from state)
     * that equals the latest lastSodOffset passed in props.
     * @returns {Number} returns -1 if not found
     */
    getPotentialIndexOfLastSodOffsetFromProps = () => {
        const { messages } = this.state;
        const { lastSodOffset } = this.props;

        if (!messages) return -1;

        return messages
            .map(message => message.sod_offset)
            .findIndex(sodOffset => sodOffset === lastSodOffset.toString());
    };

    /**
     * @desc function called to load initial message list; when there is no messages or the sodOffset is
     * significantly different from the current one
     */
    fetchInitialMessages = async () => {
        const { lastSodOffset, instrument } = this.props;
        const nMessages = MESSAGE_LIST_DEFAULT_PAGE_SIZE * 2 + 1;
        const lowerSodOffset = lastSodOffset.minus(bigInt(MESSAGE_LIST_DEFAULT_PAGE_SIZE - 1));

        try {
            const reverseMessagesResponse = await OrderBookService.getMessageList(
                instrument,
                lowerSodOffset.toString(),
                nMessages,
            );

            const { messages, pageInfo } = reverseMessagesResponse.data;

            this.setState({
                messages,
                lastSodOffsetTop: lowerSodOffset,
                lastSodOffsetBottom: bigInt(pageInfo.sod_offset),
            });
        } catch (e) {
            console.log(e);
        }
    };

    /**
     * @desc Paging handler for upwards and downwards hitting of the multidirectional scroll
     * @param direction
     */
    handleHitEdge(direction) {
        const { lastSodOffsetTop, lastSodOffsetBottom } = this.state;
        const { instrument } = this.props;
        // eslint-disable-next-line react/destructuring-assignment
        const existingMessages = this.state.messages;

        if (direction === 'top') {
            const nMessages = -MESSAGE_LIST_DEFAULT_PAGE_SIZE;
            OrderBookService.getMessageList(instrument, lastSodOffsetTop.toString(), nMessages)
                .then(response => {
                    const { pageInfo, messages } = response.data;
                    this.setState({
                        messages: messages ? messages.concat(existingMessages) : existingMessages,
                        lastSodOffsetTop: bigInt(pageInfo.sod_offset),
                    });
                })
                .catch(err => {
                    console.log(err);
                });
        } else if (direction === 'bottom') {
            OrderBookService.getMessageList(instrument, lastSodOffsetBottom.toString())
                .then(response => {
                    const { pageInfo, messages } = response.data;
                    this.setState({
                        messages: messages ? existingMessages.concat(messages) : existingMessages,
                        lastSodOffsetBottom: bigInt(pageInfo.sod_offset),
                    });
                })
                .catch(err => {
                    console.log(err);
                });
        }
    }

    handleOnMessageClick(sodOffset) {
        const { handleUpdateWithDeltas, lastSodOffset, instrument } = this.props;
        const currentSodOffset = bigInt(sodOffset).minus(lastSodOffset);
        OrderBookService.getPriceLevelsByMessageOffset(
            instrument,
            lastSodOffset.toString(),
            currentSodOffset.toString(),
        )
            .then(response => {
                handleUpdateWithDeltas(response.data);
            })
            .catch(err => {
                console.log(err);
            });
    }

    /**
     * @desc Renders every row of the message list table. every row corresponds to a message
     * @returns {*}
     */
    renderTableData() {
        const { classes, lastSodOffset } = this.props;
        const { messages } = this.state;
        return messages.map(message => {
            const {
                timestamp, message_type, order_id, share_qty, price, direction, sod_offset,
            } = message;

            const { timeNanoseconds } = splitNanosecondEpochTimestamp(bigInt(timestamp));
            const time = nanosecondsToString(convertNanosecondsUTCToCurrentTimezone(bigInt(timeNanoseconds)).valueOf());

            return (
                <Button
                    key={`${sod_offset} ${timestamp}`}
                    className={lastSodOffset.toString() === sod_offset
                        ? classes.currentMessageRow
                        : classes.tableDataRow}
                    onClick={() => { this.handleOnMessageClick(sod_offset); }}
                >
                    <Box className={classNames(classes.tableColumn, classes.overrideTimestampColumn)}>
                        {time}
                    </Box>
                    <Box className={classes.tableColumn}>{MESSAGE_TYPE_ENUM[message_type].name}</Box>
                    <Box className={classes.tableColumn}>{order_id}</Box>
                    <Box className={classes.tableColumn}>{share_qty}</Box>
                    <Box className={classes.tableColumn}>{roundNumber(price, 2)}</Box>
                    <Box className={classes.tableColumn}>{getMessageDirection(direction)}</Box>
                </Button>
            );
        });
    }

    render() {
        const { classes } = this.props;

        return (
            <div className={classes.scrollContainer}>
                <Box className={classes.tableHeaderRow}>
                    <Box className={classNames(classes.tableColumn, classes.overrideTimestampColumn)}>
                        <div>{'Timestamp'}</div>
                    </Box>
                    <Box className={classes.tableColumn}><div>{'Type'}</div></Box>
                    <Box className={classes.tableColumn}><div>{'OrderID'}</div></Box>
                    <Box className={classes.tableColumn}><div>{'Quantity'}</div></Box>
                    <Box className={classes.tableColumn}><div>{'Price'}</div></Box>
                    <Box className={classes.tableColumn}><div>{'Direction'}</div></Box>
                </Box>
                <MultiDirectionalScroll
                    onReachBottom={() => this.handleHitEdge('bottom')}
                    onReachTop={() => this.handleHitEdge('top')}
                    position={50}
                >
                    {this.renderTableData()}
                </MultiDirectionalScroll>
            </div>
        );
    }
}

export default withStyles(styles)(MessageList);
