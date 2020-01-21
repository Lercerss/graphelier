import React, { Component } from 'react';
import {
    withStyles,
    Typography,
    FormControl,
    TextField,
    Card, Select, MenuItem,
} from '@material-ui/core';
import { WithStyles, createStyles } from '@material-ui/core/styles';
import bigInt from 'big-integer';

import { Styles } from '../styles/OrderBookSnapshot';
import {
    dateStringToEpoch,
    nanosecondsToString,
    epochToDateString,
    splitNanosecondEpochTimestamp,
    convertNanosecondsToUTC,
    convertNanosecondsUTCToCurrentTimezone,
} from '../utils/date-utils';
import TimestampOrderBookScroller from './TimestampOrderBookScroller';
import TopOfBookGraphWrapper from './TopOfBookGraphWrapper';

import OrderBookService from '../services/OrderBookService';
import {
    NANOSECONDS_IN_NINE_AND_A_HALF_HOURS, NANOSECONDS_IN_SIXTEEN_HOURS,
} from '../constants/Constants';
import { processOrderBookFromScratch, processOrderBookWithDeltas } from '../utils/order-book-utils';
import MessageList from './MessageList';
import { ListItems, OrderBook } from '../models/OrderBook';

const styles = createStyles(Styles);

interface State {
    lastSodOffset: bigInt.BigInteger,
    selectedDateNano: bigInt.BigInteger,
    selectedDateTimeNano: bigInt.BigInteger,
    selectedTimeString: string,
    selectedDateString: string,
    selectedInstrument: string,
    instruments: Array<string>,
    listItems: ListItems,
    maxQuantity: number
}

class OrderBookSnapshot extends Component<WithStyles, State> {
    constructor(props) {
        super(props);

        this.state = {
            lastSodOffset: bigInt(0),
            selectedDateNano: bigInt(0),
            selectedDateTimeNano: bigInt(0),
            selectedTimeString: '00:00:00.000000000',
            selectedDateString: '',
            selectedInstrument: '',
            instruments: [],
            listItems: {},
            maxQuantity: -1,
        };
    }

    componentDidMount() {
        OrderBookService.getInstrumentsList().then(response => {
            const { instruments } = this.state;
            const newInstruments = instruments.slice();
            response.data.map(value => {
                newInstruments.push(value);
            });
            this.setState({ instruments: newInstruments });
        }).catch(err => {
            console.log(err);
        });
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        const { selectedInstrument } = this.state;
        if (prevState.selectedInstrument !== selectedInstrument) {
            this.updateOrderBook();
        }
    }

    /**
     * @desc Handles the change in instrument
     * @param event menu item that triggered change
     * @param child
     */
    handleInstrumentChange = (event: React.ChangeEvent<any>) => {
        this.setState(
            {
                selectedInstrument: event.target.value,
                selectedDateNano: bigInt(0),
                selectedDateTimeNano: bigInt(0),
                selectedTimeString: '00:00:00.000000000',
                selectedDateString: '',
            },
        );
    };

    /**
     * @desc Get appropriate number of data points to request for the graph
     * @returns {number}
     */
    getNumDataPoints = (): number => {
        // TODO find out how many points would be acceptable given the screen width
        return window.screen.width * window.devicePixelRatio;
    };

    /**
     * @desc Handles the date change for the TextField date picker
     * @param event The event object that caused the call
     */
    handleChangeDate = (event: React.ChangeEvent<any>) => {
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
            const { selectedInstrument } = this.state;

            const selectedTimeNano = NANOSECONDS_IN_NINE_AND_A_HALF_HOURS;
            const selectedTimeString = nanosecondsToString(selectedTimeNano.valueOf());
            const selectedDateString = event.target.value;
            const selectedDateNano = convertNanosecondsToUTC(dateStringToEpoch(`${selectedDateString} 00:00:00`));
            const selectedDateTimeNano = convertNanosecondsToUTC(selectedDateNano.plus(selectedTimeNano));

            const startTime = selectedDateNano.plus(NANOSECONDS_IN_NINE_AND_A_HALF_HOURS);
            const endTime = selectedDateNano.plus(NANOSECONDS_IN_SIXTEEN_HOURS);

            // TODO request TOB over time with the following arguments
            console.log(selectedInstrument, startTime, endTime, this.getNumDataPoints());

            this.setState(
                {
                    selectedTimeString,
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
     * @desc Handles the datetime change when the user clicks on a time in the graph
     * @param value {number} The new datetime value that represents the date and time clicked on in the graph,
     * in utc nanoseconds
     */
    handleSelectGraphDateTime = (value: string) => {
        // TODO the graph allows you to select a date AND time, so selectedTimeNano/String are no longer needed.
        //  Also update the selectedDateString when this is selected. SelectedDateNano may also no longer be needed.
        const selectedDateTimeNano = bigInt(value);
        const {
            timeNanoseconds,
            dateNanoseconds,
        } = splitNanosecondEpochTimestamp(convertNanosecondsUTCToCurrentTimezone(selectedDateTimeNano));

        const selectedTimeString = nanosecondsToString(timeNanoseconds);
        const selectedDateString = epochToDateString(dateNanoseconds);

        this.setState(
            {
                selectedTimeString,
                selectedDateString,
                selectedDateTimeNano,
            },
            () => this.handleChangeDateTime(),
        );
    };

    /**
     *  @desc Updates the selectedDateTimeNano state variable when the user selects a timestamp
     *  for viewing the orderbook
     */
    handleChangeDateTime = () => {
        // TODO add line annotation onto graph that shows selected timestamp as a vertical line
        const { selectedDateTimeNano } = this.state;
        if (selectedDateTimeNano.neq(0)) {
            this.updateOrderBook();
        }
    };

    /**
     * @desc handles the updates with deltas once a message is moved by a certain amount
     * @param deltas
     */
    handleUpdateWithDeltas = (deltas: OrderBook) => {
        const { listItems } = this.state;
        const {
            // eslint-disable-next-line camelcase
            asks, bids, timestamp, last_sod_offset,
        } = deltas;
        const { timeNanoseconds, dateNanoseconds } = splitNanosecondEpochTimestamp(bigInt(timestamp));
        const { newListItems, newMaxQuantity } = processOrderBookWithDeltas(listItems, asks, bids);

        this.setState(
            {
                lastSodOffset: bigInt(last_sod_offset),
                selectedDateNano: dateNanoseconds,
                selectedDateString: epochToDateString(dateNanoseconds),
                selectedTimeString: nanosecondsToString(convertNanosecondsUTCToCurrentTimezone(
                    bigInt(timeNanoseconds),
                ).valueOf()),
                selectedDateTimeNano: bigInt(timestamp),
                listItems: newListItems,
                maxQuantity: newMaxQuantity,
            },
        );
    };

    /**
     * @desc Updates the Orderbook with new prices
     */
    updateOrderBook = () => {
        const { selectedDateTimeNano, selectedInstrument } = this.state;
        OrderBookService.getOrderBookPrices(selectedInstrument, selectedDateTimeNano.toString())
            .then(response => {
                // eslint-disable-next-line camelcase
                const { asks, bids, last_sod_offset } = response.data;
                const { listItems, maxQuantity } = processOrderBookFromScratch(asks, bids);

                this.setState(
                    {
                        listItems,
                        maxQuantity,
                        lastSodOffset: bigInt(last_sod_offset),
                    },
                );
            })
            .catch(err => {
                console.log(err);
            });
    };

    render() {
        const { classes } = this.props;
        const {
            listItems,
            maxQuantity,
            selectedDateTimeNano,
            selectedDateString,
            selectedTimeString,
            lastSodOffset,
            selectedInstrument,
            instruments,
        } = this.state;

        return (
            <Typography
                component={'div'}
                className={classes.container}
            >
                {(selectedDateTimeNano.equals(0) || selectedInstrument.length === 0)
                && (
                    <Typography
                        variant={'body1'}
                        color={'textPrimary'}
                        className={classes.selectMessage}
                    >
                        {'Select an instrument and date:'}
                    </Typography>
                )}
                <FormControl className={classes.formControl}>

                    <div
                        className={classes.spaceBetween}
                    >
                        <div
                            className={classes.inputSelect}
                        >
                            <Typography
                                variant={'body1'}
                                className={classes.inputLabel}
                                color={'textSecondary'}
                            >
                                {'Instrument'}
                            </Typography>
                            <Select
                                value={selectedInstrument}
                                onChange={this.handleInstrumentChange}
                                className={classes.selectInstrumentInput}
                            >
                                {
                                    instruments.map(value => {
                                        return (
                                            <MenuItem
                                                key={`menuitem-${value}`}
                                                value={value}
                                            >
                                                {value}
                                            </MenuItem>

                                        );
                                    })
                                }
                            </Select>
                        </div>
                        <div
                            className={classes.inputSelect}
                        >
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
                                disabled={selectedInstrument.length === 0}
                                InputProps={{ inputProps: { max: '2100-01-01' } }}
                            />
                        </div>
                    </div>
                    <div className={classes.inlineFlexEnd}>
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
                            color={selectedInstrument.length !== 0 ? 'textPrimary' : 'textSecondary'}
                        >
                            {selectedTimeString}
                        </Typography>
                    </div>
                </FormControl>
                {(selectedDateTimeNano.neq(0) && selectedInstrument.length !== 0)
                    && (
                        <TopOfBookGraphWrapper
                            className={classes.graph}
                            onTimeSelect={this.handleSelectGraphDateTime}
                        />
                    )}
                {(selectedDateTimeNano.neq(0) && selectedInstrument.length !== 0)
                && (
                    <Card>
                        <TimestampOrderBookScroller
                            listItems={listItems}
                            maxQuantity={maxQuantity}
                            lastSodOffset={lastSodOffset}
                            timeOrDateIsNotSet={selectedDateTimeNano.equals(0)}
                            handleUpdateWithDeltas={this.handleUpdateWithDeltas}
                            instrument={selectedInstrument}
                        />
                    </Card>
                )}
                {(lastSodOffset.neq(0)) && (
                    <Card className={classes.messageListCard}>
                        <MessageList
                            lastSodOffset={lastSodOffset}
                            instrument={selectedInstrument}
                            handleUpdateWithDeltas={this.handleUpdateWithDeltas}
                        />
                    </Card>
                )}
            </Typography>
        );
    }
}

export default withStyles(styles)(OrderBookSnapshot);