/* eslint-disable camelcase */
import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';
import { Box } from '@material-ui/core';
import classNames from 'classnames';
import OrderBookService from '../services/OrderBookService';
import {
    SNAPSHOT_INSTRUMENT,
    MESSAGE_LIST_DEFAULT_PAGE_SIZE,
} from '../constants/Constants';
import MultiDirectionalScroll from './MultiDirectionalScroll';
import { Styles } from '../styles/MessageList';
import { roundNumber } from '../utils/number-utils';
import { getMessageDirection } from '../utils/order-book-utils';
import { MESSAGE_TYPE_ENUM } from '../constants/Enums';
import { nanosecondsToString, splitNanosecondEpochTimestamp, epochToDateString } from '../utils/date-utils';

class MessageList extends Component {
    constructor(props) {
        super(props);

        this.state = {
            messages: [],
            lastSodOffsetTop: BigInt(0),
            lastSodOffsetBottom: BigInt(0),
        };
    }

    componentDidMount() {
        this.fetchInitialMessages();
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        const { lastSodOffset } = this.props;
        const { messages } = this.state;

        if (typeof prevProps.lastSodOffset !== 'bigint' || (typeof lastSodOffset === 'bigint'
            && typeof prevProps.lastSodOffset === 'bigint'
            && lastSodOffset.toString() !== prevProps.lastSodOffset.toString())) {
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
     * @returns {*|number|never|boolean} returns -1 if not found
     */
    getPotentialIndexOfLastSodOffsetFromProps = () => {
        const { messages } = this.state;
        const { lastSodOffset } = this.props;

        if (!messages) return false;

        return messages
            .map(message => message.sod_offset)
            .findIndex(sodOffset => sodOffset === lastSodOffset.toString());
    };

    /**
     * @desc function called to load initial message list; when there is no messages or the sodOffset is
     * significantly different from the current one
     */
    fetchInitialMessages = async () => {
        const { lastSodOffset } = this.props;
        const nMessages = MESSAGE_LIST_DEFAULT_PAGE_SIZE * 2 + 1;
        const lowerSodOffset = lastSodOffset - BigInt(MESSAGE_LIST_DEFAULT_PAGE_SIZE - 1);

        try {
            const reverseMessagesResponse = await OrderBookService.getMessageList(
                SNAPSHOT_INSTRUMENT,
                lowerSodOffset.toString(),
                nMessages,
            );

            const { messages, pageInfo } = reverseMessagesResponse.data;

            this.setState({
                messages,
                lastSodOffsetTop: lowerSodOffset,
                lastSodOffsetBottom: BigInt(pageInfo.sod_offset),
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
        // eslint-disable-next-line react/destructuring-assignment
        const existingMessages = this.state.messages;

        if (direction === 'top') {
            const nMessages = -MESSAGE_LIST_DEFAULT_PAGE_SIZE;
            OrderBookService.getMessageList(SNAPSHOT_INSTRUMENT, lastSodOffsetTop.toString(), nMessages)
                .then(response => {
                    const { pageInfo, messages } = response.data;
                    this.setState({
                        messages: messages ? messages.concat(existingMessages) : existingMessages,
                        lastSodOffsetTop: BigInt(pageInfo.sod_offset),
                    });
                })
                .catch(err => {
                    console.log(err);
                });
        } else if (direction === 'bottom') {
            OrderBookService.getMessageList(SNAPSHOT_INSTRUMENT, lastSodOffsetBottom.toString())
                .then(response => {
                    const { pageInfo, messages } = response.data;
                    this.setState({
                        messages: messages ? existingMessages.concat(messages) : existingMessages,
                        lastSodOffsetBottom: BigInt(pageInfo.sod_offset),
                    });
                })
                .catch(err => {
                    console.log(err);
                });
        }
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

            const { timeNanoseconds, dateNanoseconds } = splitNanosecondEpochTimestamp(timestamp);
            const date = epochToDateString(dateNanoseconds);
            const time = nanosecondsToString(timeNanoseconds);

            return (
                <Box
                    key={`${sod_offset} ${timestamp}`}
                    className={lastSodOffset.toString() === sod_offset
                        ? classes.currentMessageRow
                        : classes.tableDataRow}
                >
                    <Box className={classNames(classes.tableColumn, classes.overrideTimestampColumn)}>
                        {`${date} ${time}`}
                    </Box>
                    <Box className={classes.tableColumn}>{MESSAGE_TYPE_ENUM[message_type].name}</Box>
                    <Box className={classes.tableColumn}>{order_id}</Box>
                    <Box className={classes.tableColumn}>{share_qty}</Box>
                    <Box className={classes.tableColumn}>{roundNumber(price, 2)}</Box>
                    <Box className={classes.tableColumn}>{getMessageDirection(direction)}</Box>
                </Box>
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

export default withStyles(Styles)(MessageList);
