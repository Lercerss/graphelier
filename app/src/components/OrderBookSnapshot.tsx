import React, { Component } from 'react';
import {
    withStyles,
    Typography,
    FormControl,
    Card, Select, MenuItem,
} from '@material-ui/core';
import { WithStyles, createStyles } from '@material-ui/core/styles';
import MomentUtils from '@date-io/moment';
import { MuiPickersUtilsProvider, KeyboardDatePicker } from '@material-ui/pickers';
import bigInt from 'big-integer';

import moment from 'moment';
import { Styles } from '../styles/OrderBookSnapshot';
import {
    dateStringToEpoch,
    nanosecondsToString,
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
import { ListItems, OrderBook, TopOfBookItem } from '../models/OrderBook';
import CustomLoader from './CustomLoader';

const styles = createStyles(Styles);

interface State {
    lastSodOffset: bigInt.BigInteger,
    selectedDateTimeNano: bigInt.BigInteger,
    selectedDateNano: bigInt.BigInteger,
    selectedTimeString: string,
    datePickerValue: moment.Moment | null,
    selectedInstrument: string,
    instruments: Array<string>,
    listItems: ListItems,
    maxQuantity: number,
    topOfBookItems: Array<TopOfBookItem>,
    loadingInstruments: boolean,
    loadingOrderbook: boolean,
}

class OrderBookSnapshot extends Component<WithStyles, State> {
    constructor(props) {
        super(props);

        this.state = {
            lastSodOffset: bigInt(0),
            selectedDateTimeNano: bigInt(0),
            selectedDateNano: bigInt(0),
            selectedTimeString: '00:00:00.000000000',
            datePickerValue: null,
            selectedInstrument: '',
            instruments: [],
            listItems: {},
            maxQuantity: -1,
            topOfBookItems: [],
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
        this.setState(
            {
                selectedInstrument: event.target.value,
            },
            () => {
                const { selectedDateNano } = this.state;
                if (selectedDateNano.neq(0)) {
                    const startTime = selectedDateNano.plus(NANOSECONDS_IN_NINE_AND_A_HALF_HOURS);
                    const endTime = selectedDateNano.plus(NANOSECONDS_IN_SIXTEEN_HOURS);
                    this.updateGraphData(startTime, endTime);
                }
            },
        );
    };

    /**
     * @desc Get appropriate number of data points to request for the graph
     * @returns {number}
     */
    getNumDataPoints = (): number => {
        return Math.trunc(window.screen.width * window.devicePixelRatio * 0.76);
    };

    /**
     * @desc Handles the date change for the TextField date picker
     * @param date The selected date
     */
    handleChangeDate = (date: any) => {
        if (!moment(date).isValid()) return;

        const selectedTimeNano = NANOSECONDS_IN_NINE_AND_A_HALF_HOURS;
        const selectedTimeString = nanosecondsToString(selectedTimeNano.valueOf());
        const selectedDateString = date.format('YYYY-MM-DD');
        const selectedDateNano = convertNanosecondsToUTC(dateStringToEpoch(`${selectedDateString} 00:00:00`));
        const selectedDateTimeNano = selectedDateNano.plus(selectedTimeNano);

        const startTime = selectedDateNano.plus(NANOSECONDS_IN_NINE_AND_A_HALF_HOURS);
        const endTime = selectedDateNano.plus(NANOSECONDS_IN_SIXTEEN_HOURS);

        this.setState(
            {
                datePickerValue: date,
                selectedTimeString,
                selectedDateNano,
                selectedDateTimeNano,
            },
            () => {
                this.handleChangeDateTime();
                this.updateGraphData(startTime, endTime);
            },
        );
    };

    /**
     * @desc Handles the time change when the user clicks on a time in the graph
     * @param value {number} The new datetime value that represents the date and time clicked on in the graph,
     * in utc nanoseconds
     */
    handleSelectGraphDateTime = (value: string) => {
        const selectedDateTimeNano = bigInt(value);
        const {
            timeNanoseconds,
        } = splitNanosecondEpochTimestamp(convertNanosecondsUTCToCurrentTimezone(selectedDateTimeNano));

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
     *  @desc Updates the selectedDateTimeNano state variable when the user selects a timestamp
     *  for viewing the orderbook
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
        const { timeNanoseconds } = splitNanosecondEpochTimestamp(bigInt(timestamp));
        const { newListItems, newMaxQuantity } = processOrderBookWithDeltas(listItems, asks, bids);

        this.setState(
            {
                lastSodOffset: bigInt(last_sod_offset),
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

    /**
     * @desc Updates the graph with tob values for new start time and end time bounds
     */
    updateGraphData = (startTime: bigInt.BigInteger, endTime: bigInt.BigInteger) => {
        const { selectedInstrument } = this.state;

        OrderBookService.getTopOfBookOverTime(selectedInstrument, startTime.toString(), endTime.toString(),
            this.getNumDataPoints())
            .then(response => {
                // eslint-disable-next-line camelcase
                const result = response.data;

                this.setState(
                    {
                        topOfBookItems: result,
                    },
                );
            })
            .catch(err => {
                console.log(err);

                this.setState(
                    {
                        topOfBookItems: [],
                    },
                );
            });
    };

    render() {
        const { classes } = this.props;
        const {
            listItems,
            maxQuantity,
            selectedDateTimeNano,
            datePickerValue,
            selectedTimeString,
            lastSodOffset,
            selectedInstrument,
            instruments,
            topOfBookItems,
            loadingInstruments,
            loadingOrderbook,
        } = this.state;

        let messageText;
        if (selectedDateTimeNano.equals(0)) {
            if (selectedInstrument.length === 0) messageText = 'Select an instrument';
            else { messageText = 'Select a date'; }
        }

        return (
            <MuiPickersUtilsProvider utils={MomentUtils}>
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
                        {messageText}
                    </Typography>
                )}
                    <FormControl className={classes.formControl}>

                        <div
                            className={classes.spaceBetween}
                        >
                            <div>
                                <Typography
                                    variant={'body1'}
                                    className={classes.inputLabel}
                                    color={'textSecondary'}
                                >
                                    {'Instrument'}
                                </Typography>
                                { loadingInstruments ? (
                                    <div className={classes.inlineFlex}>
                                        <CustomLoader
                                            size={'1rem'}
                                            type={'circular'}
                                        />
                                    </div>
                                ) : (
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
                            </div>
                            <div
                                className={classes.dateTimeSelect}
                            >
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
                                    <KeyboardDatePicker
                                        className={classes.datePicker}
                                        value={datePickerValue}
                                        onChange={date => this.handleChangeDate(date)}
                                        placeholder={'DD/MM/YYYY'}
                                        format={'DD/MM/YYYY'}
                                        views={['year', 'month', 'date']}
                                        openTo={'year'}
                                        disabled={selectedInstrument.length === 0}
                                        invalidDateMessage={''}
                                        disableFuture
                                        autoOk
                                    />
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
                            </div>
                        </div>
                    </FormControl>
                    {(selectedDateTimeNano.neq(0) && selectedInstrument.length !== 0)
                        && (
                            <div>
                                <Card className={classes.graphCard}>
                                    {topOfBookItems.length === 0
                                        ? (
                                            <Typography
                                                className={classes.noDataMessage}
                                                variant={'body1'}
                                                color={'textPrimary'}
                                            >
                                                {'Could not retrieve graph for this day.'}
                                            </Typography>
                                        )
                                        : (
                                            <TopOfBookGraphWrapper
                                                className={classes.graph}
                                                onTimeSelect={this.handleSelectGraphDateTime}
                                                selectedDateTimeNano={selectedDateTimeNano}
                                                topOfBookItems={topOfBookItems}
                                            />
                                        )}
                                </Card>
                                <Card>
                                    <TimestampOrderBookScroller
                                        listItems={listItems}
                                        maxQuantity={maxQuantity}
                                        lastSodOffset={lastSodOffset}
                                        timeOrDateIsNotSet={selectedDateTimeNano.equals(0)}
                                        handleUpdateWithDeltas={this.handleUpdateWithDeltas}
                                        instrument={selectedInstrument}
                                        loading={loadingOrderbook}
                                    />
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
                            </div>
                        )}
                </Typography>
            </MuiPickersUtilsProvider>
        );
    }
}

export default withStyles(styles)(OrderBookSnapshot);
