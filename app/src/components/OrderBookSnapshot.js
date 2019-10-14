import React, {Component} from 'react';
import {withStyles, Container, Typography, Select, FormControl, InputLabel, TextField, Slider} from '@material-ui/core';
import {Styles} from '../styles/OrderBookSnapshot';
import {dateStringToEpoch, getFormattedDate, nanosecondsToEpoch} from '../utils/date-utils';
import TimestampOrderBookScroller from './TimestampOrderBookScroller';
import classNames from 'classnames';


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
            selectedDateTimeNano: 0,
            selectedDateTimeString: 'select from slider',
            asks: [],
            bids: [],
        };
    }

    updateTimestampOrderBookScroller = () => {
        const {selectedDateTimeNano} = this.state;
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

    handleChangeDate = (event) => {
        const {selectedTimeNano} = this.state;
        var selectedDateNano = parseInt(dateStringToEpoch(event.target.value + ' 00:00:000'));

        this.setState({ 
            selectedDateNano: selectedDateNano,
        });

        if(selectedTimeNano != 0){
            this.handleChangeDateTime();
            this.updateTimestampOrderBookScroller();
        }
    }

    handleChangeTime = (event, value) => {
        const {selectedDateNano} = this.state;
        var selectedTimeNano = parseInt(value);

        this.setState({ 
            selectedTimeNano: selectedTimeNano,
        });

        if(selectedDateNano != 0)
            this.handleChangeDateTime();
    }

    handleCommitTime = (event, value) => {
        const {selectedDateNano} = this.state;
        if(selectedDateNano != 0){
            this.handleChangeDateTime();
            this.updateTimestampOrderBookScroller();
        }
    }

    handleChangeDateTime = () => {
        const {selectedDateNano, selectedTimeNano} = this.state;
        var selectedDateTimeNano = selectedTimeNano+selectedDateNano;
            this.setState({ 
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
                <Typography component='div' className={classes.container}>
                    <div id='ButtonHeader' className={classes.divTopBook}>
                        <FormControl className={classes.formControl}>
                            <div className={classes.inline}>
                                <Typography
                                    variant='body1'
                                    className={classNames(classes.inputLabel, classes.alignEnd)}
                                    color='textSecondary'>
                                    {'Date'}  
                                </Typography>
                                <TextField 
                                    className={classes.datePicker}
                                    id='time'
                                    type='date'
                                    onChange={this.handleChangeDate}
                                />
                            </div>
                            <div className={classes.inline}>
                                <Typography
                                    variant='body1'
                                    className={classes.inputLabel}
                                    color='textSecondary'>
                                    {'Time'}  
                                </Typography>
                                <Typography 
                                    variant='body1'
                                    className={classes.timestampDisplay}>
                                    {this.state.selectedDateTimeString}
                                </Typography>
                            </div>
                            <Slider
                                className={classes.timestampSlider}
                                min={9.5*60*60*1000000000} // nanoseconds between 12am and 9:30am
                                max={16*60*60*1000000000} // nanoseconds between 12am and 4pm
                                step={1}
                                defaultValue={0}
                                onChange={this.handleChangeTime}
                                marks={[
                                    {
                                        value: 9.5*60*60*1000000000,
                                        label: '9:30 AM',
                                    },
                                    {
                                        value: 16*60*60*1000000000,
                                        label: '4:00 PM',
                                    },
                                ]}
                                onChangeCommitted={this.handleCommitTime}
                            />
                            {this.state.selectedDateTimeNano == 0 && 
                                <Typography 
                                    variant='body1'
                                    color='error'
                                    className={classes.selectMessage}>
                                    Please select a date and time
                                </Typography>
                            }
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