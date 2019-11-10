/* eslint-disable camelcase */
import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';
import OrderBookService from '../services/OrderBookService';
import {
    SNAPSHOT_INSTRUMENT,
    MESSAGE_LIST_DEFAULT_PAGE_SIZE,
} from '../constants/Constants';
import MultiDirectionalScroll from './MultiDirectionalScroll';
import { Styles } from '../styles/MessageList';

class MessageList extends Component {
    constructor(props) {
        super(props);

        this.state = {
            messages: [],
            lastSodOffsetTop: 0,
            lastSodOffsetBottom: 0,
        };
    }

    componentDidMount() {
        this.fetchInitialMessages();
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        const { lastSodOffset } = this.props;
        if (lastSodOffset !== prevProps.lastSodOffset) {
            this.fetchInitialMessages();
        }
    }

    fetchInitialMessages() {
        const { lastSodOffset } = this.props;
        OrderBookService.getMessageList(SNAPSHOT_INSTRUMENT, lastSodOffset)
            .then(response => {
                const { pageInfo, messages } = response.data;
                this.setState(
                    {
                        messages,
                        lastSodOffsetTop: pageInfo.sod_offset,
                        lastSodOffsetBottom: pageInfo.sod_offset,
                    },
                );
            })
            .catch(err => {
                console.log(err);
            });
    }

    handleHitEdge(direction) {
        const { lastSodOffsetTop, lastSodOffsetBottom } = this.state;
        if (direction === 'top') {
            const nMessages = -MESSAGE_LIST_DEFAULT_PAGE_SIZE;
            OrderBookService.getMessageList(SNAPSHOT_INSTRUMENT, lastSodOffsetTop, nMessages)
                .then(response => {
                    const { pageInfo, messages } = response.data;
                    this.setState({
                        messages,
                        lastSodOffsetTop: pageInfo.lastSodOffset,
                    });
                })
                .catch(err => {
                    console.log(err);
                });
        } else if (direction === 'bottom') {
            OrderBookService.getMessageList(SNAPSHOT_INSTRUMENT, lastSodOffsetBottom)
                .then(response => {
                    const { pageInfo, messages } = response.data;
                    this.setState({
                        messages,
                        lastSodOffsetBottom: pageInfo.lastSodOffset,
                    });
                })
                .catch(err => {
                    console.log(err);
                });
        }
    }

    renderTableData() {
        const { classes, lastSodOffset } = this.props;
        const { messages } = this.state;
        return messages.map(message => {
            const {
                timestamp, message_type, order_id, share_qty, price, direction, sod_offset,
            } = message;
            return (
                <tr className={lastSodOffset === sod_offset ? classes.currentMessageRow : classes.tableDataRow}>
                    <td>{timestamp}</td>
                    <td>{message_type}</td>
                    <td>{order_id}</td>
                    <td>{share_qty}</td>
                    <td>{price}</td>
                    <td>{direction}</td>
                </tr>
            );
        });
    }

    render() {
        const { classes } = this.props;

        return (
            <div className={classes.scrollContainer}>
                <MultiDirectionalScroll
                    onReachBottom={() => this.handleHitEdge('bottom')}
                    onReachTop={() => this.handleHitEdge('top')}
                    position={50}
                >
                    <table className={classes.messageTable}>
                        <tr className={classes.tableHeaderRow}>
                            <th>{'Timestamp'}</th>
                            <th>{'Type'}</th>
                            <th>{'Order ID'}</th>
                            <th>{'Quantity'}</th>
                            <th>{'Price'}</th>
                            <th>{'Direction'}</th>
                        </tr>
                        {this.renderTableData()}
                    </table>
                </MultiDirectionalScroll>
            </div>
        );
    }
}

export default withStyles(Styles)(MessageList);
