import React, { Component } from 'react';
import {
    withStyles,
    Typography,
    FormControl,
    TextField,
    Slider,
    Collapse,
    IconButton,
    Card,
} from '@material-ui/core';
import classNames from 'classnames';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import { Styles } from '../styles/OrderBookSnapshot';
import {
    dateStringToEpoch,
    nanosecondsToString,
    epochToDateString,
    splitNanosecondEpochTimestamp,
    convertNanosecondsToUTC,
} from '../utils/date-utils';
import TimestampOrderBookScroller from './TimestampOrderBookScroller';

import OrderBookService from '../services/OrderBookService';
import {
    SNAPSHOT_INSTRUMENT,
    NANOSECONDS_IN_NINE_AND_A_HALF_HOURS,
    NANOSECONDS_IN_SIXTEEN_HOURS,
} from '../constants/Constants';
import { processOrderBookFromScratch, processOrderBookWithDeltas } from '../utils/order-book-utils';
import MessageList from './MessageList';


class OrderBookSnapshot extends Component {
    constructor(props) {
        super(props);

        this.state = {
            lastSodOffset: null,
            selectedDateNano: BigInt(0),
            selectedTimeNano: BigInt(0),
            selectedDateTimeNano: BigInt(0),
            selectedTimeString: 'Select from slider',
            selectedDateString: '',
            expanded: true,
        };
    }

    /**
     * @desc Handles the date change for the TextField date picker
     * @param event The event object that caused the call
     */
    handleChangeDate = event => {
        const { value } = event.target;
        if (value === '') { // If user clears the date input
            const { selectedDateNano, selectedDateString } = this.state;

            this.setState(
                {
                    selectedDateNano,
                    selectedDateString,
                },
            );
        } else {
            const { selectedTimeNano } = this.state;
            const selectedDateString = event.target.value;
            const selectedDateNano = dateStringToEpoch(`${selectedDateString} 00:00:00`);
            const selectedDateTimeNano = convertNanosecondsToUTC(selectedTimeNano + selectedDateNano);

            this.setState(
                {
                    selectedDateNano,
                    selectedDateString,
                    selectedDateTimeNano,
                },
                () => {
                    this.handleChangeDateTime();
                },
            );
        }
    };

    /**
     * @desc Handles the time change when sliding the time Slider
     * @param event The event object that caused the call
     * @param value The new time value that represents the nanoseconds between 12 am and the chosen time of day.
     */
    handleChangeTime = (event, value) => {
        if (value) {
            const selectedTimeNano = BigInt(value);
            const selectedTimeString = nanosecondsToString(parseInt(value));

            this.setState({
                selectedTimeNano,
                selectedTimeString,
            });
        }
    };

    /**
     * @desc Handles the time change when the user stops sliding the time Slider
     * @param event The event object that caused the call
     * @param value The new time value that represents the nanoseconds between 12 am and the chosen time of day
     */
    handleCommitTime = (event, value) => {
        const { selectedDateNano } = this.state;

        const selectedTimeNano = BigInt(value);
        const selectedTimeString = nanosecondsToString(parseInt(value));
        const selectedDateTimeNano = convertNanosecondsToUTC(selectedTimeNano + selectedDateNano);

        this.setState(
            {
                selectedTimeNano,
                selectedTimeString,
                selectedDateTimeNano,
            },
            () => this.handleChangeDateTime(),
        );
    };

    /**
     *  @desc Updates the selectedDateTimeNano state variable when there is a
     *  change in the date or when the user stops sliding the time Slider
     */
    handleChangeDateTime = () => {
        const { selectedDateTimeNano, selectedDateNano, selectedTimeNano } = this.state;

        // eslint-disable-next-line eqeqeq
        if (selectedTimeNano != 0 && selectedDateNano != 0) {
            OrderBookService.getOrderBookPrices(SNAPSHOT_INSTRUMENT, selectedDateTimeNano.toString())
                .then(response => {
                    // eslint-disable-next-line camelcase
                    const { asks, bids, last_sod_offset } = response.data;
                    const { listItems, maxQuantity } = processOrderBookFromScratch(asks, bids);

                    this.setState(
                        {
                            listItems,
                            maxQuantity,
                            lastSodOffset: BigInt(last_sod_offset),
                        },
                    );
                })
                .catch(err => {
                    console.log(err);
                });
        }
    };

    handleUpdateWithDeltas = deltas => {
        const { listItems } = this.state;
        const {
            // eslint-disable-next-line camelcase
            asks, bids, timestamp, last_sod_offset,
        } = deltas;
        const { timeNanoseconds, dateNanoseconds } = splitNanosecondEpochTimestamp(timestamp);
        const { newListItems, newMaxQuantity } = processOrderBookWithDeltas(listItems, asks, bids);

        this.setState(
            {
                lastSodOffset: BigInt(last_sod_offset),
                selectedDateNano: dateNanoseconds,
                selectedDateString: epochToDateString(dateNanoseconds),
                selectedTimeNano: BigInt(timeNanoseconds),
                selectedTimeString: nanosecondsToString(timeNanoseconds),
                selectedDateTimeNano: BigInt(timestamp),
                listItems: newListItems,
                maxQuantity: newMaxQuantity,
            },
        );
    };

    /**
     * @desc Handles the expand button for showing or hiding the time settings for the orderbook
     */
    handleExpandClick = () => {
        const { expanded } = this.state;
        this.setState({ expanded: !expanded });
    };

    render() {
        const { classes } = this.props;
        const {
            expanded,
            listItems,
            maxQuantity,
            selectedTimeNano,
            selectedDateNano,
            selectedDateString,
            selectedTimeString,
            lastSodOffset,
        } = this.state;

        return (
            <Typography
                component={'div'}
                className={classes.container}
            >
                <div className={classNames(classes.expandRow, classes.flex)}>
                    {/* eslint-disable-next-line eqeqeq */}
                    {(selectedTimeNano == 0 || selectedDateNano == 0) ? (
                        <Typography
                            variant={'body1'}
                            className={classNames(classes.pleaseSelectMessage, classes.flex)}
                        >
                            Please select Date and Time
                        </Typography>
                    ) : (
                        <Typography
                            variant={'body1'}
                            color={'textPrimary'}
                            className={classNames(classes.selectMessage, classes.flex)}
                        >
                            Select Date and Time
                        </Typography>
                    )}
                    <IconButton
                        className={classNames(classes.expand, expanded && classes.expandOpen)}
                        onClick={this.handleExpandClick}
                        aria-expanded={expanded}
                        aria-label={'show more'}
                    >
                        <ExpandMoreIcon />
                    </IconButton>
                </div>
                <Collapse in={expanded}>
                    <div
                        id={'ButtonHeader'}
                        className={classes.divTopBook}
                    >
                        <FormControl className={classes.formControl}>
                            <div className={classes.inline}>
                                <Typography
                                    variant={'body1'}
                                    className={classes.inputLabel}
                                    color={'textSecondary'}
                                >
                                    {'Date'}
                                </Typography>
                                <TextField
                                    className={classes.datePicker}
                                    type={'date'}
                                    value={selectedDateString}
                                    onChange={this.handleChangeDate}
                                />
                            </div>
                            <div className={classes.inline}>
                                <Typography
                                    variant={'body1'}
                                    className={classes.inputLabel}
                                    color={'textSecondary'}
                                >
                                    {'Time'}
                                </Typography>
                                <Typography
                                    variant={'body1'}
                                    className={classes.timestampDisplay}
                                >
                                    {selectedTimeString}
                                </Typography>
                            </div>
                            <div className={classes.inline}>
                                <Typography
                                    variant={'body1'}
                                    color={'textSecondary'}
                                >
                                    9:30
                                </Typography>
                                <Slider
                                    className={classes.timestampSlider}
                                    min={NANOSECONDS_IN_NINE_AND_A_HALF_HOURS} // nanoseconds between 12am and 9:30am
                                    max={NANOSECONDS_IN_SIXTEEN_HOURS} // nanoseconds between 12am and 4pm
                                    step={1}
                                    value={Number(selectedTimeNano)}
                                    onChange={this.handleChangeTime}
                                    onChangeCommitted={this.handleCommitTime}
                                />
                                <Typography
                                    variant={'body1'}
                                    color={'textSecondary'}
                                >
                                    16:00
                                </Typography>
                            </div>
                        </FormControl>
                    </div>
                </Collapse>
                <Card>
                    <TimestampOrderBookScroller
                        listItems={listItems}
                        maxQuantity={maxQuantity}
                        lastSodOffset={lastSodOffset}
                        timeOrDateIsNotSet={selectedTimeNano === 0 || selectedDateNano === 0}
                        handleUpdateWithDeltas={this.handleUpdateWithDeltas}
                    />
                </Card>
                <div style={{ height: `10px` }}> </div>
                <Card>
                    <MessageList
                        lastSodOffset={lastSodOffset}
                    />
                </Card>
            </Typography>
        );
    }
}

export default withStyles(Styles)(OrderBookSnapshot);
