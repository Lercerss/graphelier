import React, { Component } from 'react';
import {
    withStyles,
    Typography,
    FormControl,
    TextField,
    // Slider,
    // Collapse,
    // IconButton,
    Card, Select, MenuItem,
} from '@material-ui/core';
// import classNames from 'classnames';
import { WithStyles, createStyles } from '@material-ui/core/styles';
// import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
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
    NANOSECONDS_IN_NINE_AND_A_HALF_HOURS,
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
    expanded: boolean,
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
            expanded: true,
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
        this.setState({ selectedInstrument: event.target.value });
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
            // TODO request TOB over time, set selectedDateTimeNano to selected day at 9:30 edt (epoch nanoseconds)
            // (this means 1:30 pm)
            // eslint-disable-next-line max-len
            const selectedTimeNano = NANOSECONDS_IN_NINE_AND_A_HALF_HOURS;
            const selectedTimeString = nanosecondsToString(selectedTimeNano.valueOf());
            const selectedDateString = event.target.value;
            const selectedDateNano = dateStringToEpoch(`${selectedDateString} 00:00:00`);
            const selectedDateTimeNano = convertNanosecondsToUTC(selectedDateNano.plus(selectedTimeNano));

            console.log('handleChangeDate selectedTimeNano', selectedTimeNano);
            console.log('handleChangeDate selectedTimeString', selectedTimeString);
            console.log('handleChangeDate selectedDateNano', selectedDateNano);
            console.log('handleChangeDate selectedDateString', selectedDateString);
            console.log('handleChangeDate selectedDateTimeNano', selectedDateTimeNano);


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
        // eslint-disable-next-line no-unused-vars
        const {
            dateNanoseconds,
            timeNanoseconds,
        } = splitNanosecondEpochTimestamp(convertNanosecondsUTCToCurrentTimezone(selectedDateTimeNano));
        console.log('handleSelectGraphDateTime date', dateNanoseconds);
        console.log('handleSelectGraphDateTime time', timeNanoseconds);

        const selectedTimeString = nanosecondsToString(timeNanoseconds);

        this.setState(
            {
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
     * @desc Handles the expand button for showing or hiding the time settings for the orderbook
     */
    handleExpandClick = () => {
        const { expanded } = this.state;
        this.setState({ expanded: !expanded });
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
