import React, { Component } from 'react';
import {
    withStyles,
    Typography,
    FormControl,
    TextField,
    Slider,
    Collapse,
    IconButton,
    Card, InputLabel, Select, MenuItem,
} from '@material-ui/core';
import classNames from 'classnames';
import { WithStyles, createStyles } from '@material-ui/core/styles';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
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

import OrderBookService from '../services/OrderBookService';
import {
    NANOSECONDS_IN_NINE_AND_A_HALF_HOURS,
    NANOSECONDS_IN_SIXTEEN_HOURS,
} from '../constants/Constants';
import { processOrderBookFromScratch, processOrderBookWithDeltas } from '../utils/order-book-utils';
import MessageList from './MessageList';
import { ListItems, OrderBook } from '../models/OrderBook';
import CustomLoader from './CustomLoader';

const styles = createStyles(Styles);

interface State {
    lastSodOffset: bigInt.BigInteger,
    selectedDateNano: bigInt.BigInteger,
    selectedTimeNano: bigInt.BigInteger,
    selectedDateTimeNano: bigInt.BigInteger,
    selectedTimeString: string,
    selectedDateString: string,
    expanded: boolean,
    selectedInstrument: string,
    instruments: Array<string>,
    listItems: ListItems,
    maxQuantity: number,
    loadingInstruments: boolean,
    loadingOrderbook: boolean,
}

class OrderBookSnapshot extends Component<WithStyles, State> {
    constructor(props) {
        super(props);

        this.state = {
            lastSodOffset: bigInt(0),
            selectedDateNano: bigInt(0),
            selectedTimeNano: bigInt(0),
            selectedDateTimeNano: bigInt(0),
            selectedTimeString: 'Select from slider',
            selectedDateString: '',
            expanded: true,
            selectedInstrument: '',
            instruments: [],
            listItems: {},
            maxQuantity: -1,
            loadingInstruments: true,
            loadingOrderbook: false,
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
        }).finally(() => {
            this.setState({ loadingInstruments: false });
        });
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        const { selectedInstrument } = this.state;
        if (prevState.selectedInstrument !== selectedInstrument) {
            this.handleChangeDateTime();
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
            const { selectedTimeNano } = this.state;
            const selectedDateString = event.target.value;
            const selectedDateNano = dateStringToEpoch(`${selectedDateString} 00:00:00`);
            const selectedDateTimeNano = convertNanosecondsToUTC(selectedTimeNano.plus(selectedDateNano));

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
     * @param value {number} The new time value that represents the nanoseconds between 12 am and the chosen time of
     * day.
     */
    handleChangeTime = (event: React.ChangeEvent<any>, value: any) => {
        if (value) {
            const selectedTimeNano = bigInt(value);
            const selectedTimeString = nanosecondsToString(value);

            this.setState({
                selectedTimeNano,
                selectedTimeString,
            });
        }
    };

    /**
     * @desc Handles the time change when the user stops sliding the time Slider
     * @param event The event object that caused the call
     * @param value {number} The new time value that represents the nanoseconds between 12 am and the chosen time of day
     */
    handleCommitTime = (event: React.ChangeEvent<any>, value: any) => {
        const { selectedDateNano } = this.state;

        const selectedTimeNano = bigInt(value);
        const selectedTimeString = nanosecondsToString(value);
        const selectedDateTimeNano = convertNanosecondsToUTC(selectedTimeNano.plus(selectedDateNano));

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
        const { selectedDateNano, selectedTimeNano } = this.state;
        if (selectedTimeNano.neq(0) && selectedDateNano.neq(0)) {
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
        const { timeNanoseconds, dateNanoseconds } = splitNanosecondEpochTimestamp(timestamp);
        const { newListItems, newMaxQuantity } = processOrderBookWithDeltas(listItems, asks, bids);

        this.setState(
            {
                lastSodOffset: bigInt(last_sod_offset),
                selectedDateNano: dateNanoseconds,
                selectedDateString: epochToDateString(dateNanoseconds),
                selectedTimeNano: convertNanosecondsUTCToCurrentTimezone(bigInt(timeNanoseconds)),
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
        this.setState({ loadingOrderbook: true });
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
            })
            .finally(() => {
                this.setState({ loadingOrderbook: false });
            });
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
            selectedInstrument,
            instruments,
            loadingInstruments,
            loadingOrderbook,
        } = this.state;

        return (
            <Typography
                component={'div'}
                className={classes.container}
            >
                <InputLabel
                    className={classes.selectInstrumentLabel}
                    id={'selectInstrumentLabel'}
                >
                    Select Instrument
                </InputLabel>
                { loadingInstruments ? (
                    <div className={classes.inlineFlex}>
                        <CustomLoader
                            size={'1rem'}
                            type={'circular'}
                        />
                    </div>
                )
                    : (
                        <Select
                            id={'instrumentSelector'}
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
                    )}
                <div className={classNames(classes.expandRow, classes.flex)}>
                    {(selectedTimeNano.equals(0) || selectedDateNano.equals(0)) ? (
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
                                    InputProps={{ inputProps: { max: '2100-01-01' } }}
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
                                    value={selectedTimeNano.valueOf()}
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
                    <div>
                        <TimestampOrderBookScroller
                            listItems={listItems}
                            maxQuantity={maxQuantity}
                            lastSodOffset={lastSodOffset}
                            timeOrDateIsNotSet={selectedTimeNano.equals(0) || selectedDateNano.equals(0)}
                            handleUpdateWithDeltas={this.handleUpdateWithDeltas}
                            instrument={selectedInstrument}
                            loading={loadingOrderbook}
                        />
                    </div>
                </Card>
                {(lastSodOffset.neq(0)) && (
                    <Card className={classes.messageListCard}>
                        <MessageList
                            lastSodOffset={lastSodOffset}
                            instrument={selectedInstrument}
                            handleUpdateWithDeltas={this.handleUpdateWithDeltas}
                            loading={loadingOrderbook}
                        />
                    </Card>
                )}
            </Typography>
        );
    }
}

export default withStyles(styles)(OrderBookSnapshot);
