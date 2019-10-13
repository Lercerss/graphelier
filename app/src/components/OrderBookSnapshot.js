import React, {Component} from 'react';
import {withStyles, Container, Typography, Select, FormControl, InputLabel, TextField, Slider} from '@material-ui/core';
import {Styles} from '../styles/OrderBookSnapshot';
import {dateStringToEpoch, getFormattedDate, nanosecondsToEpoch} from '../utils/date-utils';
import TimestampOrderBookScroller from './TimestampOrderBookScroller';

import OrderBookService from '../services/OrderBookService';
import {SNAPSHOT_INSTRUMENT, SNAPSHOT_TIMESTAMP} from '../constants/Constants';


class OrderBookSnapshot extends Component {

    constructor(props) {
        super(props);

        this.state = {
            defaultTimestamp: SNAPSHOT_TIMESTAMP,
            selectedTimestamp: null,
            selectedDateNano: 0,
            selectedTimeNano: 0,
            selectedDateTimeString: 0,
            selectedDateTimeNano: 0,
            asks: [],
            bids: [],
        };
    }

    componentDidMount() {
        
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        const {selectedDateTimeNano} = this.state;

        if(prevState.selectedDateTimeNano !== selectedDateTimeNano){
            OrderBookService.getOrderBookPrices(SNAPSHOT_INSTRUMENT, selectedDateTimeNano)
                .then(response => {
                    console.log(response.data);
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

    handleChangeDate = (event) => {
        const {selectedTimeNano} = this.state;
        var selectedDateString = event.target.value;
        var selectedDateNano = parseInt(dateStringToEpoch(selectedDateString+" 00:00:000"));
        var selectedDateTimeNano = selectedTimeNano + selectedDateNano;

        this.setState({ 
            selectedDateNano: selectedDateNano,
            selectedDateTimeNano: selectedDateTimeNano,
            selectedDateTimeString: nanosecondsToEpoch(selectedDateTimeNano)
            });
    }

    handleChangeTime = (event, value) => {
        const {selectedDateNano} = this.state;
        var selectedTimeNano = parseInt(value);
        var selectedDateTimeNano = selectedTimeNano + selectedDateNano;

        this.setState({ 
            selectedTimeNano: selectedTimeNano,
            selectedDateTimeNano: selectedDateTimeNano,
            selectedDateTimeString: nanosecondsToEpoch(selectedDateTimeNano) 
        });
    }

    render() {
        const {classes} = this.props;
        const {asks, bids} = this.state;
        return (
            <Container
                maxWidth={'xl'}
                component={'div'}
                className={classes.root}>
                <Typography component="div" className={classes.container}>
                    <div id='ButtonHeader' className={classes.divTopBook}>
                        <FormControl className={classes.formControl}>
                            <TextField 
                                className={classes.datePicker}
                                id="time"
                                label="Date"
                                type="date"
                                defaultValue={'2012-06-21'}
                                onChange={this.handleChangeDate}
                                InputLabelProps={{
                                    shrink: true,
                                }}
                            />
                            <Typography 
                                variant="body1"
                                className={classes.timestampDisplay}>
                                Time: {this.state.selectedDateTimeString}
                            </Typography>
                            <Slider
                                aria-labelledby="timestamp-slider"
                                aria-label="Time"
                                min={9.5*60*60*1000000000} // nanoseconds between 12am and 9:30am
                                max={16*60*60*1000000000} // nanoseconds between 12am and 4pm
                                step={1}
                                className={classes.timestampSlider}
                                defaultValue={0}
                                onChange={this.handleChangeTime}
                            />
                            
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