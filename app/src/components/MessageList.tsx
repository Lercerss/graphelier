/* eslint-disable camelcase */
import React, { Component, createRef } from 'react';
import { withStyles, createStyles, WithStyles } from '@material-ui/core/styles';
import { Box, Tooltip } from '@material-ui/core';
import InfoIcon from '@material-ui/icons/Info';
import classNames from 'classnames';
import Button from '@material-ui/core/Button';
import bigInt from 'big-integer';

import OrderBookService from '../services/OrderBookService';
import {
    MESSAGE_LIST_DEFAULT_PAGE_SIZE, TILDE_KEY_CODE,
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
    loading: boolean,
}

interface State {
    messages: Array<Message>,
    lastSodOffsetTop: bigInt.BigInteger,
    lastSodOffsetBottom: bigInt.BigInteger,
}

const CustomTooltip = withStyles({
    tooltip: {
        fontSize: '0.75rem',
    },
})(Tooltip);

class MessageList extends Component<Props, State> {
    selectedMessageItem;

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
        window.addEventListener('keyup', this.onKeyUp);
    }

    shouldComponentUpdate(nextProps: Readonly<Props>, nextState: Readonly<State>, nextContext: any): boolean {
        const { lastSodOffset, loading } = this.props;
        const { messages } = this.state;

        return (lastSodOffset.neq(nextProps.lastSodOffset) || messages !== nextState.messages
            || loading !== nextProps.loading);
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
            this.handleScrollBackToSelectedMessage();
        } else if ((messages[0] && !prevState.messages[0]) // need to check for first time messages loaded
            // need to check for new messages from new date and time, not from continuous scrolling
            || (messages[0] && prevState.messages[0]
                && (messages[0].timestamp !== prevState.messages[0].timestamp
                    && messages[messages.length - 1].timestamp
                    !== prevState.messages[prevState.messages.length - 1].timestamp))) {
            this.handleScrollBackToSelectedMessage();
        }
    }

    componentWillUnmount() {
        window.removeEventListener('keyup', this.onKeyUp);
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
     * @desc handles event for scrolling back to the selected message that is being used to determine the orderbook
     * @returns {void}
     */
    private handleScrollBackToSelectedMessage = () => {
        this.selectedMessageItem && this.selectedMessageItem.current
        && this.selectedMessageItem.current.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
        });
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
     * Handles keypress up in the browser window. Checks for ` in order to center to selected message
     * @param e
     */
    private onKeyUp = e => {
        if (e.keyCode === TILDE_KEY_CODE) this.handleScrollBackToSelectedMessage();
    }

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

            if (lastSodOffset.toString() === sod_offset) {
                // TODO look into reference callbacks for Typescript
                this.selectedMessageItem = createRef();
            }
            return (
                <Button
                    key={`${sod_offset} ${timestamp}`}
                    ref={lastSodOffset.toString() === sod_offset ? this.selectedMessageItem : null}
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
        const { classes, loading } = this.props;

        return (
            <div className={classNames(loading ? classes.hide : null, classes.scrollContainer)}>
                <Box className={classes.tableHeaderRow}>
                    <Box className={classNames(classes.tableColumn, classes.overrideTimestampColumn)}>
                        <CustomTooltip
                            title={'Press the tilde key to center the selected message'}
                            className={classes.marginRight}
                        >
                            <InfoIcon />
                        </CustomTooltip>
                        <div>{'Timestamp'}</div>
                    </Box>
                    <Box className={classes.tableColumn}><div>{'Type'}</div></Box>
                    <Box className={classes.tableColumn}><div>{'OrderID'}</div></Box>
                    <Box className={classes.tableColumn}><div>{'Quantity'}</div></Box>
                    <Box className={classes.tableColumn}><div>{'Price'}</div></Box>
                    <Box className={classes.tableColumn}><div>{'Direction'}</div></Box>
                </Box>
                <div className={classes.messageListContainer}>
                    <MultiDirectionalScroll
                        onReachBottom={() => this.handleHitEdge('bottom')}
                        onReachTop={() => this.handleHitEdge('top')}
                        position={50}
                    >
                        {this.renderTableData()}
                    </MultiDirectionalScroll>
                </div>
            </div>
        );
    }
}

export default withStyles(styles)(MessageList);
