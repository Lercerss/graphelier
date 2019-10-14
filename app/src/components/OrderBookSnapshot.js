import React, {Component} from 'react';
import {withStyles, Container, Typography, FormControl, TextField, Slider} from '@material-ui/core';
import {Styles} from '../styles/OrderBookSnapshot';
import {dateStringToEpoch, nanosecondsToEpochTime} from '../utils/date-utils';
import TimestampOrderBookScroller from './TimestampOrderBookScroller';
import classNames from 'classnames';


import OrderBookService from '../services/OrderBookService';
import {SNAPSHOT_INSTRUMENT} from '../constants/Constants';


class OrderBookSnapshot extends Component {

    constructor(props) {
        super(props);

        this.state = {
            selectedTimestamp: null,
            selectedDateNano: 0,
            selectedTimeNano: 0,
            selectedDateTimeNano: 0,
            selectedTimeString: 'select from slider',
            asks: [],
            bids: [],
        };
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        const {selectedDateTimeNano, selectedTimeNano, selectedDateNano} = this.state;

        if(prevState.selectedDateTimeNano !== selectedDateTimeNano && selectedDateNano !== 0 && 
            selectedTimeNano !== 0 && selectedDateTimeNano !== 0){
            OrderBookService.getOrderBookPrices(SNAPSHOT_INSTRUMENT, selectedDateTimeNano)
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

    handleChangeDate = (event) => {
        var selectedDateNano = parseInt(dateStringToEpoch(event.target.value + ' 00:00:00'));

        this.setState({ 
            selectedDateNano: selectedDateNano,
        }, () => {this.handleChangeDateTime();});
    }

    handleChangeTime = (event, value) => {
        var selectedTimeNano = parseInt(value);

        this.setState({ 
            selectedTimeNano: selectedTimeNano,
            selectedTimeString: nanosecondsToEpochTime(selectedTimeNano),
        });
    }

    handleCommitTime = (event, value) => {
        var selectedTimeNano = parseInt(value);

        this.setState({ 
            selectedTimeNano: selectedTimeNano,
            selectedTimeString: nanosecondsToEpochTime(selectedTimeNano),
        }, () => {this.handleChangeDateTime();});
    }

    handleChangeDateTime = () => {
        const {selectedDateNano, selectedTimeNano} = this.state;
        var selectedDateTimeNano = selectedTimeNano+selectedDateNano;

            this.setState({ 
                selectedDateTimeNano: selectedDateTimeNano,
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
                                    {this.state.selectedTimeString}
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
                                        label: '9:30AM',
                                    },
                                    {
                                        value: 16*60*60*1000000000,
                                        label: '4:00PM',
                                    },
                                ]}
                                onChangeCommitted={this.handleCommitTime}
                            />
                            {this.state.selectedDateTimeNano === 0 && 
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