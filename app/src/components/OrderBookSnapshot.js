import React, { Component } from 'react';
import {
    withStyles,
    Typography,
    FormControl,
    TextField,
    Slider,
    Collapse,
    IconButton,
    Card
} from '@material-ui/core';
import { Styles } from '../styles/OrderBookSnapshot';
import {
    dateStringToEpoch,
    nanosecondsToString,
    convertNanosecondsToUTC
} from '../utils/date-utils';
import TimestampOrderBookScroller from './TimestampOrderBookScroller';
import classNames from 'classnames';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';

import OrderBookService from '../services/OrderBookService';
import {
    SNAPSHOT_INSTRUMENT,
    NANOSECONDS_IN_NINE_AND_A_HALF_HOURS,
    NANOSECONDS_IN_SIXTEEN_HOURS
} from '../constants/Constants';
import {processOrderBookFromScratch} from '../utils/order-book-utils';


class OrderBookSnapshot extends Component {
    constructor(props) {
        super(props);

        this.state = {
            selectedDateNano: 0,
            selectedTimeNano: 0,
            selectedDateTimeNano: 0,
            selectedTimeString: 'Select from slider',
            expanded: true
        };
    }

    /**
     * @desc Handles the date change for the TextField date picker
     * @param event The event object that caused the call
     */
    handleChangeDate = event => {
        let selectedDateNano = parseInt(dateStringToEpoch(event.target.value + ' 00:00:00'));

        this.setState(
            {
                selectedDateNano
            },
            () => {
                this.handleChangeDateTime();
            }
        );
    };

    /**
     * @desc Handles the time change when sliding the time Slider
     * @param event The event object that caused the call
     * @param value The new time value that represents the nanoseconds between 12 am and the chosen time of day.
     */
    handleChangeTime = (event, value) => {
        let selectedTimeNano = parseInt(value);

        this.setState({
            selectedTimeNano: selectedTimeNano,
            selectedTimeString: nanosecondsToString(selectedTimeNano)
        });
    };

    /**
     * @desc Handles the time change when the user stops sliding the time Slider
     * @param event The event object that caused the call
     * @param value The new time value that represents the nanoseconds between 12 am and the chosen time of day
     */
    handleCommitTime = (event, value) => {
        const { selectedDateNano } = this.state;

        let selectedTimeNano = parseInt(value);
        let selectedDateTimeNano = convertNanosecondsToUTC(selectedTimeNano + selectedDateNano);

        this.setState(
            {
                selectedTimeNano,
                selectedTimeString: nanosecondsToString(selectedTimeNano),
                selectedDateTimeNano
            },
            () => this.handleChangeDateTime()
        );
    };

    /**
     *  @desc Updates the selectedDateTimeNano state variable when there is a
     *  change in the date or when the user stops sliding the time Slider
     */
    handleChangeDateTime = () => {
        const { selectedDateTimeNano, selectedDateNano } = this.state;

        if (selectedDateTimeNano !== 0 && selectedDateNano !== 0) {
            OrderBookService.getOrderBookPrices(SNAPSHOT_INSTRUMENT, selectedDateTimeNano)
                .then(response => {
                    const {asks, bids} = response.data;
                    const {listItems, maxQuantity} = processOrderBookFromScratch(asks, bids);

                    this.setState({listItems, maxQuantity});
                })
                .catch(err => {
                    console.log(err);
                });
        }
    };

    /**
     * @desc Handles the expand button for showing or hiding the time settings for the orderbook
     */
    handleExpandClick = () => {
        this.setState({ expanded: !this.state.expanded });
    };

    render() {
        const { classes } = this.props;
        const { expanded, listItems, maxQuantity, selectedTimeNano, selectedDateNano, selectedTimeString } = this.state;

        return (
            <Typography
                component={'div'}
                className={classes.container}
            >
                <div className={classNames(classes.spaceBetween, classes.flex)}>
                    {(selectedTimeNano === 0 || selectedDateNano === 0) ? (
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
                                    className={classNames(classes.inputLabel)}
                                    color={'textSecondary'}
                                >
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
                                    defaultValue={0}
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
                    />
                </Card>
            </Typography>
        );
    }
}

export default withStyles(Styles)(OrderBookSnapshot);
