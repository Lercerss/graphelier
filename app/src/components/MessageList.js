/* eslint-disable camelcase */
import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';
import OrderBookService from '../services/OrderBookService';
import { SNAPSHOT_INSTRUMENT } from '../constants/Constants';
import MultiDirectionalScroll from './MultiDirectionalScroll';
import { Styles } from '../styles/MessageList';

class MessageList extends Component {
    constructor(props) {
        super(props);

        this.state = {
            messages: [],
            lastSodOffsetTop: 0,
            // eslint-disable-next-line react/no-unused-state
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
                        // eslint-disable-next-line react/no-unused-state
                        lastSodOffsetTop: pageInfo.sod_offset,
                        // eslint-disable-next-line react/no-unused-state
                        lastSodOffsetBottom: pageInfo.sod_offset,
                    },
                );
            })
            .catch(err => {
                console.log(err);
            });
    }

    handleHitEdge(direction) {
        const { lastSodOffsetTop, lastSofOffsetBottom } = this.state;
        if (direction === 'top') {
            OrderBookService.getMessageList(SNAPSHOT_INSTRUMENT, lastSodOffsetTop)
                .then(response => {
                    // eslint-disable-next-line no-unused-vars
                    const { pageInfo, meesages } = response.data;
                })
                .catch(err => {
                    console.log(err);
                });
        } else if (direction === 'bottom') {
            OrderBookService.getMessageList(SNAPSHOT_INSTRUMENT, lastSofOffsetBottom)
                .then(response => {
                    // eslint-disable-next-line no-unused-vars
                    const { pageInfo, message } = response.data;
                })
                .catch(err => {
                    console.log(err);
                });
        }
    }

    renderTableData() {
        const { classes } = this.props;
        const { messages } = this.state;
        // const messages = [
        //     {
        //         instrument: 'ins',
        //         timestamp: 67500,
        //         message_type: 1,
        //         order_id: 2344909090909094,
        //         share_qty: 10000,
        //         price: 123.4,
        //         direction: 1,
        //         sod_offset: 1,
        //     },
        //     {
        //         instrument: 'ins 2',
        //         timestamp: 23399,
        //         message_type: 3,
        //         order_id: 988888,
        //         share_qty: 6777777,
        //         price: 111900.45,
        //         direction: -1,
        //         sod_offset: 1,
        //     }];
        return messages.map(message => {
            const {
                timestamp, message_type, order_id, share_qty, price, direction,
            } = message;
            return (
                <tr className={classes.tableDataRow}>
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
        // const { lastSodOffsetTop, lastSodBottom } = this.state;

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
