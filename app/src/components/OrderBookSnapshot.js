import React, {Component} from 'react';
import {withStyles, Container, Typography, Select, FormControl, InputLabel} from '@material-ui/core';
import {Styles} from '../styles/OrderBookSnapshot';
import {dateStringToEpoch, getFormattedDate} from '../utils/date-utils';
import TimestampOrderBookScroller from './TimestampOrderBookScroller';

import OrderBookService from '../services/OrderBookService';
import {SNAPSHOT_INSTRUMENT, SNAPSHOT_TIMESTAMP} from '../constants/Constants';


class OrderBookSnapshot extends Component {

    constructor(props) {
        super(props);

        this.state = {
            defaultTimestamp: SNAPSHOT_TIMESTAMP,
            selectedTimestamp: null,
            asks: [],
            bids: [],
        };
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        const {selectedTimestamp} = this.state;

        if(prevState.selectedTimestamp !== selectedTimestamp && selectedTimestamp !== ''){
            OrderBookService.getOrderBookPrices(SNAPSHOT_INSTRUMENT, dateStringToEpoch(selectedTimestamp))
                .then(response => {
                    this.setState({
                        asks: response.data.asks,
                        bids: response.data.bids,
                    });
                })
                .catch(err => {
                    console.log(err);
                });
        }
    }

    /**
     * Handles the change for the timestamp select
     *
     * @param event The event object that caused the call
     */
    handleChange = (event) => {
        const {selectedTimestamp} = this.state;
        const value = event.target.value;
        if (value !== selectedTimestamp) {
            this.setState({selectedTimestamp: value});
        }
    };

    render() {
        const {classes} = this.props;
        const {defaultTimestamp, selectedTimestamp, asks, bids} = this.state;
        let time = selectedTimestamp ? selectedTimestamp : 'Please select a time';
        return (
            <Container
                maxWidth={'xl'}
                component={'div'}
                className={classes.root}>
                <Typography component="div" className={classes.container}>
                    <div id='ButtonHeader' className={classes.divTopBook}>

                        <FormControl className={classes.formControl}>
                            <InputLabel ref={this.timeSelector}>
                                Select a time
                            </InputLabel>
                            <Select
                                value={time}
                                onChange={this.handleChange}>
                                <option value="" disabled>
                                    Select a time
                                </option>
                                <option value={''} />
                                <option value={defaultTimestamp}>{getFormattedDate(defaultTimestamp)}</option>
                            </Select>
                        </FormControl>
                    </div>
                    <div className={classes.divTopBookBody}>
                        <TimestampOrderBookScroller
                            orderBook={{asks, bids}}
                        />
                    </div>
                </Typography>
            </Container>
        );
    }
}

export default withStyles(Styles)(OrderBookSnapshot);