import React, { Component } from 'react';
import { connect } from 'react-redux';
import {
    Typography,
    FormControl,
    Card, Select, MenuItem,
} from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import { createStyles, WithStyles } from '@material-ui/styles';
import MomentUtils from '@date-io/moment';
import { MuiPickersUtilsProvider, KeyboardDatePicker } from '@material-ui/pickers';
import bigInt from 'big-integer';
import { debounce } from 'lodash';

import moment from 'moment';
import { Dispatch } from 'redux';
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
    NANOSECONDS_IN_NINE_AND_A_HALF_HOURS, NANOSECONDS_IN_SIXTEEN_HOURS, NUM_DATA_POINTS_RATIO,
} from '../constants/Constants';
import { processOrderBookFromScratch, processOrderBookWithDeltas } from '../utils/order-book-utils';
import MessageList from './MessageList';
import {
    ListItems, OrderBook, OrderDetails, TopOfBookItem,
} from '../models/OrderBook';
import CustomLoader from './CustomLoader';
import { RootState } from '../store';
import OrderInformation from './OrderInformation';
import { saveOrderbookTimestamp } from '../actions/actions';

const styles = theme => createStyles(Styles(theme));

interface Props extends WithStyles<typeof styles>{
    orderDetails: OrderDetails,
    showOrderInfoDrawer: boolean,
    onTimestampSelected: Function,
    currentOrderbookTimestamp: string,
}

interface State {
    lastSodOffset: bigInt.BigInteger,
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
    loadingGraph: boolean,
    graphUnavailable: boolean,
    graphStartTime: bigInt.BigInteger,
    graphEndTime: bigInt.BigInteger,
}

class OrderBookSnapshot extends Component<Props, State> {
    /**
     * @desc Handles window resizing and requests a new number of data points appropriate for the new window width
     */
    handleResize = debounce(() => {
        const { selectedDateNano, graphStartTime, graphEndTime } = this.state;
        if (selectedDateNano.neq(0)) {
            this.updateGraphData(graphStartTime, graphEndTime);
        }
    }, 100);

    constructor(props) {
        super(props);

        this.state = {
            lastSodOffset: bigInt(0),
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
            loadingGraph: false,
            graphUnavailable: false,
            graphStartTime: bigInt(0),
            graphEndTime: bigInt(0),
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

        window.addEventListener('resize', this.handleResize);
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        const { selectedInstrument } = this.state;
        if (prevState.selectedInstrument !== selectedInstrument) {
            this.handleChangeDateTime();
        }
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.handleResize);
    }

    /**
     * @desc Handles the change in instrument
     * @param event menu item that triggered change
     */
    handleInstrumentChange = (event: React.ChangeEvent<any>) => {
        this.setState(
            {
                selectedInstrument: event.target.value,
            },
            () => {
                const { selectedDateNano } = this.state;
                if (selectedDateNano.neq(0)) {
                    const graphStartTime = selectedDateNano.plus(NANOSECONDS_IN_NINE_AND_A_HALF_HOURS);
                    const graphEndTime = selectedDateNano.plus(NANOSECONDS_IN_SIXTEEN_HOURS);
                    this.setState(
                        {
                            graphStartTime,
                            graphEndTime,
                        }, () => {
                            this.updateGraphData(graphStartTime, graphEndTime);
                        },
                    );
                }
            },
        );
    };

    /**
     * @desc Get appropriate number of data points to request for the graph
     * @returns {number}
     */
    getNumDataPoints = (): number => {
        return Math.trunc(window.innerWidth * NUM_DATA_POINTS_RATIO);
    };

    /**
     * @desc Handles the date change for the TextField date picker
     * @param date The selected date
     */
    handleChangeDate = (date: any) => {
        if (!moment(date).isValid()) return;

        this.setState(
            {
                loadingGraph: true,
                graphUnavailable: false,
            },
        );

        const { onTimestampSelected } = this.props;

        const selectedTimeNano = NANOSECONDS_IN_NINE_AND_A_HALF_HOURS;
        const selectedTimeString = nanosecondsToString(selectedTimeNano.valueOf());
        const selectedDateString = date.format('YYYY-MM-DD');
        const selectedDateNano = convertNanosecondsToUTC(dateStringToEpoch(`${selectedDateString} 00:00:00`));
        const selectedDateTimeNano = selectedDateNano.plus(selectedTimeNano);
        onTimestampSelected(selectedDateTimeNano.toString());

        const graphStartTime = selectedDateNano.plus(NANOSECONDS_IN_NINE_AND_A_HALF_HOURS);
        const graphEndTime = selectedDateNano.plus(NANOSECONDS_IN_SIXTEEN_HOURS);

        this.setState(
            {
                datePickerValue: date,
                selectedTimeString,
                selectedDateNano,
                graphStartTime,
                graphEndTime,
            },
            () => {
                this.handleChangeDateTime();
                this.updateGraphData(graphStartTime, graphEndTime);
            },
        );
    };

    /**
     * @desc Handles the time change when the user clicks on a time in the graph
     * @param value {number} The new datetime value that represents the date and time clicked on in the graph,
     * in utc nanoseconds
     */
    handleSelectGraphDateTime = (value: string) => {
        const { onTimestampSelected, currentOrderbookTimestamp } = this.props;
        onTimestampSelected(value);
        // const selectedDateTimeNano = bigInt(value);
        const selectedDateTimeNano = bigInt(currentOrderbookTimestamp);
        const {
            timeNanoseconds,
        } = splitNanosecondEpochTimestamp(convertNanosecondsUTCToCurrentTimezone(selectedDateTimeNano));

        const selectedTimeString = nanosecondsToString(timeNanoseconds);

        this.setState(
            {
                selectedTimeString,
            },
            () => this.handleChangeDateTime(),
        );
    };

    /**
     *  @desc Updates the selectedDateTimeNano state variable when the user selects a timestamp
     *  for viewing the orderbook
     */
    handleChangeDateTime = () => {
        const { currentOrderbookTimestamp } = this.props;
        const selectedDateTimeNano = bigInt(currentOrderbookTimestamp);
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
                listItems: newListItems,
                maxQuantity: newMaxQuantity,
            },
        );
    };

    /**
     * @desc Updates the Orderbook with new prices
     */
    updateOrderBook = () => {
        const { selectedInstrument } = this.state;
        const { currentOrderbookTimestamp } = this.props;
        this.setState({ loadingOrderbook: true });
        OrderBookService.getOrderBookPrices(selectedInstrument, currentOrderbookTimestamp)
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
    updateGraphData = (graphStartTime: bigInt.BigInteger, graphEndTime: bigInt.BigInteger) => {
        const { selectedInstrument } = this.state;

        OrderBookService.getTopOfBookOverTime(selectedInstrument, graphStartTime.toString(), graphEndTime.toString(),
            this.getNumDataPoints())
            .then(response => {
                // eslint-disable-next-line camelcase
                const result = response.data;

                this.setState(
                    {
                        graphStartTime,
                        graphEndTime,
                        topOfBookItems: result,
                        loadingGraph: false,
                    },
                );
            })
            .catch(err => {
                console.log(err);

                this.setState(
                    {
                        topOfBookItems: [],
                        loadingGraph: false,
                        graphUnavailable: true,
                    },
                );
            });
    };

    /**
     * @desc handles updating the graph when zooming or panning the graph
     * @param graphStartTime the new start time on the graph
     * @param graphEndTime the new end time on the graph
     */
    handlePanAndZoom = (graphStartTime: bigInt.BigInteger, graphEndTime: bigInt.BigInteger) => {
        this.updateGraphData(graphStartTime, graphEndTime);
    };

    render() {
        const {
            classes, orderDetails, showOrderInfoDrawer, currentOrderbookTimestamp,
        } = this.props;
        const {
            listItems,
            maxQuantity,
            selectedDateNano,
            datePickerValue,
            selectedTimeString,
            lastSodOffset,
            selectedInstrument,
            instruments,
            topOfBookItems,
            loadingInstruments,
            loadingOrderbook,
            loadingGraph,
            graphUnavailable,
        } = this.state;
        const selectedDateTimeNano = bigInt(currentOrderbookTimestamp);
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
                                    {graphUnavailable && (
                                        <Typography
                                            className={classes.noDataMessage}
                                            variant={'body1'}
                                            color={'textPrimary'}
                                        >
                                            {'Could not retrieve graph for this day.'}
                                        </Typography>
                                    )}
                                    {loadingGraph && (
                                        <div className={classes.graphLoader}>
                                            <CustomLoader
                                                size={'5rem'}
                                                type={'circular'}
                                            />
                                        </div>
                                    )}
                                    { !loadingGraph && !graphUnavailable && topOfBookItems.length !== 0 && (
                                        <TopOfBookGraphWrapper
                                            className={classes.graph}
                                            onTimeSelect={this.handleSelectGraphDateTime}
                                            handlePanAndZoom={this.handlePanAndZoom}
                                            selectedDateTimeNano={selectedDateTimeNano}
                                            startOfDay={selectedDateNano.plus(NANOSECONDS_IN_NINE_AND_A_HALF_HOURS)}
                                            endOfDay={selectedDateNano.plus(NANOSECONDS_IN_SIXTEEN_HOURS)}
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
                                        timestamp={selectedDateTimeNano}
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
                    { orderDetails && showOrderInfoDrawer && (
                        <OrderInformation
                            orderId={orderDetails.id}
                            quantity={orderDetails.quantity}
                            lastModified={orderDetails.last_modified}
                            createdOn={orderDetails.created_on}
                            price={orderDetails.price}
                            messages={orderDetails.messages}
                        />
                    )}
                </Typography>
            </MuiPickersUtilsProvider>
        );
    }
}

const mapStateToProps = (state: RootState) => ({
    showOrderInfoDrawer: state.general.showOrderInfoDrawer,
    orderDetails: state.general.orderDetails,
    currentOrderbookTimestamp: state.general.currentOrderbookTimestamp,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    onTimestampSelected: (currentOrderBookTimestamp: string) => dispatch(
        saveOrderbookTimestamp(currentOrderBookTimestamp),
    ),
});

export const NonConnectedOrderBookSnapshot = withStyles(styles)(OrderBookSnapshot);

export default withStyles(styles)(connect(mapStateToProps, mapDispatchToProps)(OrderBookSnapshot));
