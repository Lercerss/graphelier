/* eslint-disable camelcase */
import React, { Component } from 'react';
import { Box } from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import { Styles } from '../styles/App';
import OrderBookService from '../services/OrderBookService';
import { SNAPSHOT_INSTRUMENT } from '../constants/Constants';
import MultiDirectionalScroll from './MultiDirectionalScroll';

class MessageList extends Component {
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
                // const { pageInfo, messages } = response.data;
                const { pageInfo } = response.data;
                this.setState(
                    {
                        // messages,
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
    //
    // handleHitEdge(){
    //     OrderBookService.getMessageList(())
    // }

    renderTableData() {
        const { classes } = this.props;
        // const { messages } = this.state;
        const messages = [
            {
                instrument: 'ins',
                timestamp: 67500,
                message_type: 1,
                order_id: 23444,
                share_qty: 10000,
                price: 123.4,
                direction: 1,
                sod_offset: 1,
            },
            {
                instrument: 'ins 2',
                timestamp: 23399,
                message_type: 3,
                order_id: 988888,
                share_qty: 6777777,
                price: 111900.45,
                direction: -1,
                sod_offset: 1,
            }];
        return messages.map(message => {
            const {
                timestamp, message_type, order_id, share_qty, price, direction,
            } = message;
            return (
                <tr
                    className={classes.messageTableRow}
                    style={{ border: '1px solid black' }}
                >
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
        // const { messages, lastSodOffsetTop, lastSodBottom } = this.state;
        const lastSodOffsetTop = 1;
        const lastSodOffsetBottom = 20;
        console.log(lastSodOffsetTop + lastSodOffsetBottom);

        return (
            <Box className={classes.scrollContainer}>
                <MultiDirectionalScroll
                    // onReachBottom={() => this.handleHitEdge('bottom')}
                    // onReachTop={() => this.handleHitEdge('top')}
                    position={50}
                >
                    <table>
                        <tr
                            className={classes.tableHeaderRow}
                            style={{ border: '1px solid black' }}
                        >
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
            </Box>
        );
    }
}

export default withStyles(Styles)(MessageList);
