import React, { Component } from 'react';
import { Box } from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import { Styles } from '../styles/App';
import OrderBookService from '../services/OrderBookService';
import { SNAPSHOT_INSTRUMENT } from '../constants/Constants';
import MultiDirectionalScroll from './MultiDirectionalScroll';

class MessageList extends Component {
    componentDidMount() {
        const { lastSodOffset } = this.props;
        OrderBookService.getMessageList(SNAPSHOT_INSTRUMENT, lastSodOffset)
            .then(response => {
                const { pageInfo, messages } = response.data;

                // this.setState(
                //     {
                //         pageInfo,
                //         messages,
                //     },
                // );
            })
            .catch(err => {
                console.log(err);
            });
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        const { lastSodOffset } = this.props;

        if (lastSodOffset !== prevProps.lastSodOffset){

        }
    }

    render() {
        const { classes } = this.props;

        return (
            <Box className={classes.scrollContainer}>
                <MultiDirectionalScroll
                    onReachBottom={() => this.handleHitEdge('bottom')}
                    onReachTop={() => this.handleHitEdge('top')}
                    position={50}
                >
                    <Box>{'hi'}</Box>
                </MultiDirectionalScroll>
            </Box>
        );
    }
}

export default withStyles(Styles)(MessageList);
