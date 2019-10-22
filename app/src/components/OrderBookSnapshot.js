import React, { Component } from 'react';
import { withStyles, Container, Typography, FormControl, TextField, Slider, Collapse, IconButton } from '@material-ui/core';
import {Styles} from '../styles/OrderBookSnapshot';
import {dateStringToEpoch, nanosecondsToString} from '../utils/date-utils';
import TimestampOrderBookScroller from './TimestampOrderBookScroller';
import classNames from 'classnames';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';


import OrderBookService from '../services/OrderBookService';
import { SNAPSHOT_INSTRUMENT, NANOSECONDS_IN_NINE_AND_A_HALF_HOURS, NANOSECONDS_IN_SIXTEEN_HOURS, CURRENT_TIME_PLACEHOLDER } from '../constants/Constants';


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
            expanded: true
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


    /**
     * Handles the date change for the TextField date picker
     *
     * @param event The event object that caused the call
     */
    handleChangeDate = (event) => {
        let selectedDateNano = parseInt(dateStringToEpoch(event.target.value + ' 00:00:00'));

        this.setState({
            selectedDateNano: selectedDateNano,
        }, () => {this.handleChangeDateTime();});
    }

    /**
     * Handles the time change when sliding the time Slider
     *
     * @param event The event object that caused the call
     *
     * @param value The new time value that represents the nanoseconds between 12 am and the chosen time of day.
     */
    handleChangeTime = (event, value) => {
        let selectedTimeNano = parseInt(value);

        this.setState({
            selectedTimeNano: selectedTimeNano,
            selectedTimeString: nanosecondsToString(selectedTimeNano),
        });
    }

    /**
     * Handles the time change when the user stops sliding the time Slider
     *
     * @param event The event object that caused the call
     * @param value The new time value that represents the nanoseconds between 12 am and the chosen time of day
     */
    handleCommitTime = (event, value) => {
        let selectedTimeNano = parseInt(value);

        this.setState({
            selectedTimeNano: selectedTimeNano,
            selectedTimeString: nanosecondsToString(selectedTimeNano),
        }, () => {this.handleChangeDateTime();});
    }

    /**
     * Updates the selectedDateTimeNano state variable when there is a change in the date or when the user stops sliding the time Slider
     */
    handleChangeDateTime = () => {
        const {selectedDateNano, selectedTimeNano} = this.state;
        let selectedDateTimeNano = selectedTimeNano+selectedDateNano;

        this.setState({
            selectedDateTimeNano: selectedDateTimeNano,
        });
    }

    handleExpandClick = () => {
        this.setState({ expanded: !this.state.expanded })
    }

    render() {
        const {classes} = this.props;
        const {asks, bids, expanded} = this.state;
        return (
            <Typography component={'div'} className={classes.container}>
                {(this.state.selectedTimeNano === 0 || this.state.selectedDateNano === 0) ?
                    <Typography
                        variant={'body1'}
                        color={'error'}
                        className={classes.pleaseSelectMessage}>
                       Please select Date and Time
                    </Typography>
                    : <Typography
                        variant={'body1'}
                        color={'textPrimary'}
                        className={classes.selectMessage}>
                        Select Date and Time
                    </Typography>
                }
                <IconButton
                    className={`${classes.expand} ${expanded ? classes.expandOpen : ''}`}
                    onClick={this.handleExpandClick}
                    aria-expanded={expanded}
                    aria-label="show more"
                >
                    <ExpandMoreIcon />
                </IconButton>
                <Collapse in={expanded}>
                    <div id={'ButtonHeader'} className={classes.divTopBook}>
                        <FormControl className={classes.formControl}>
                            <div className={classes.inline}>
                                <Typography
                                    variant={'body1'}
                                    className={classNames(classes.inputLabel, classes.alignEnd)}
                                    color={'textSecondary'}>
                                    {'Date'}
                                </Typography>
                                <TextField
                                    className={classes.datePicker}
                                    type={'date'}
                                    onChange={this.handleChangeDate}
                                />
                            </div>
                            <div className={classes.inline}>
                                <Typography
                                    variant={'body1'}
                                    className={classes.inputLabel}
                                    color={'textSecondary'}>
                                    {'Time'}
                                </Typography>
                                <Typography
                                    variant={'body1'}
                                    className={classes.timestampDisplay}>
                                    {this.state.selectedTimeString}
                                </Typography>
                            </div>
                            <Slider
                                className={classes.timestampSlider}
                                min={NANOSECONDS_IN_NINE_AND_A_HALF_HOURS} // nanoseconds between 12am and 9:30am
                                max={NANOSECONDS_IN_SIXTEEN_HOURS} // nanoseconds between 12am and 4pm
                                step={1}
                                defaultValue={0}
                                onChange={this.handleChangeTime}
                                marks={[
                                    {
                                        value: NANOSECONDS_IN_NINE_AND_A_HALF_HOURS,
                                        label: '9:30AM',
                                    },
                                    {
                                        value: NANOSECONDS_IN_SIXTEEN_HOURS,
                                        label: '4:00PM',
                                    },
                                ]}
                                onChangeCommitted={this.handleCommitTime}
                            />
                        </FormControl>
                    </div>
                </Collapse>
                    <div className={classes.divTopBookBody}>
                        <TimestampOrderBookScroller
                            orderBook={{asks, bids}}
                        />
                    </div>
                </Typography>
        );
    }
}

export default withStyles(Styles)(OrderBookSnapshot);
