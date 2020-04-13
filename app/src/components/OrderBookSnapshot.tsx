import React, { Component } from 'react';
import {
    Typography,
    FormControl,
    Card, Select, MenuItem, createStyles, WithStyles, withStyles,
} from '@material-ui/core';
import MomentUtils from '@date-io/moment';
import { KeyboardDatePicker, MuiPickersUtilsProvider } from '@material-ui/pickers';
import bigInt from 'big-integer';
import { debounce } from 'lodash';

import moment from 'moment';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';
import { withSnackbar, WithSnackbarProps } from 'notistack';
import { Styles } from '../styles/OrderBookSnapshot';
import {
    convertNanosecondsToUTC,
    convertNanosecondsUTCToCurrentTimezone,
    dateStringToEpoch,
    nanosecondsToString,
    splitNanosecondEpochTimestamp,
} from '../utils/date-utils';
import TimestampOrderBookScroller from './TimestampOrderBookScroller';
import TopOfBookGraphWrapper from './TopOfBookGraphWrapper';

import OrderBookService from '../services/OrderBookService';
import {
    NANOSECONDS_IN_NINE_AND_A_HALF_HOURS,
    NANOSECONDS_IN_SIXTEEN_HOURS,
    NUM_DATA_POINTS_RATIO,
} from '../constants/Constants';
import {
    processOrderBookFromScratch, processOrderBookWithDeltas, checkCreatePriceLevel, checkDeletePriceLevel,
    processOrderBookPlayback,
}
    from '../utils/order-book-utils';
import MessageList from './MessageList';
import {
    PlaybackData,
    LastModificationType,
    ListItems,
    OrderBook,
    OrderDetails,
    SelectedTimestampInfo,
    TopOfBookItem,
} from '../models/OrderBook';
import CustomLoader from './CustomLoader';
import PlaybackControl from './PlaybackControl';
import { RootState } from '../store';
import OrderInformation from './OrderInformation';
import { saveOrderbookTimestampInfo } from '../actions/actions';

const styles = theme => createStyles(Styles(theme));

interface Props extends WithStyles<typeof styles>, WithSnackbarProps{
    orderDetails: OrderDetails,
    showOrderInfoDrawer: boolean,
    onTimestampSelected: Function,
    currentOrderbookTimestamp: string,
    lastModificationType: LastModificationType,
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
    playback: boolean,
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
            playback: false,
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
        const { currentOrderbookTimestamp, lastModificationType } = this.props;
        if (prevState.selectedInstrument !== selectedInstrument) {
            this.handleChangeDateTime();
        }
        if (prevProps.currentOrderbookTimestamp !== currentOrderbookTimestamp
            && lastModificationType === LastModificationType.ORDER_INFO) {
            this.handleSelectGraphDateTime(currentOrderbookTimestamp);
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
        const selectedTimestampInfo: SelectedTimestampInfo = {
            currentOrderbookTimestamp: selectedDateTimeNano.toString(),
        };
        onTimestampSelected(selectedTimestampInfo);

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
        const { onTimestampSelected } = this.props;
        const { playback } = this.state;
        const selectedTimestampInfo: SelectedTimestampInfo = {
            currentOrderbookTimestamp: value,
            lastModificationType: LastModificationType.GRAPH,
        };
        if (!playback) {
            onTimestampSelected(selectedTimestampInfo);
            const selectedDateTimeNano = bigInt(selectedTimestampInfo.currentOrderbookTimestamp);
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
        }
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
     * @desc Handles changes to orderbook from playbackModifications data
     */
    handlePlaybackModifications = (playbackData: PlaybackData) => {
        const { listItems, lastSodOffset } = this.state;
        const { onTimestampSelected, enqueueSnackbar } = this.props;
        const selectedTimestampInfo: SelectedTimestampInfo = {
            currentOrderbookTimestamp: playbackData.timestamp,
            lastModificationType: LastModificationType.GRAPH,
        };
        onTimestampSelected(selectedTimestampInfo);
        const modificationsLength = playbackData.modifications.length;
        let ctr: number = 0;
        const data = processOrderBookPlayback(listItems);
        let { newListItems } = data;
        const { newMaxQuantity } = data;
        console.log(playbackData);
        while (ctr < modificationsLength) {
            const playbackModification = playbackData.modifications[ctr];
            const { price, from, to } = playbackModification;

            switch (playbackModification.type) {
            case 'add':
                if (price && playbackModification.quantity) {
                    newListItems = checkCreatePriceLevel(price, newListItems, playbackModification.direction);
                    newListItems[price].orders.push({
                        id: playbackModification.order_id,
                        quantity: playbackModification.quantity,
                    });
                }
                break;
            case 'drop':
                if (price) {
                    newListItems[price].orders.splice(newListItems[price].orders.findIndex(
                        order => order.id === playbackModification.order_id,
                    ), 1);
                    newListItems = checkDeletePriceLevel(price, newListItems);
                }
                break;
            case 'update':
                if (price && playbackModification.quantity) {
                    const order = newListItems[price].orders
                        .find(o => o.id === playbackModification.order_id);
                    if (order) {
                        order.quantity = playbackModification.quantity;
                    } else {
                        enqueueSnackbar(`Could not update. ID: ${playbackModification.order_id}.`
                            + `Not found @priceLevel: ${playbackModification.price}`, { variant: 'error' });
                        console.log(playbackModification);
                    }
                }
                break;
            case 'move':
                if (from && to) {
                    const orderToMove = newListItems[from].orders.splice(newListItems[from].orders.findIndex(
                        order => order.id === playbackModification.order_id,
                    ), 1)[0];
                    if (orderToMove) {
                        if (playbackModification.new_id) {
                            newListItems = checkCreatePriceLevel(to, newListItems, playbackModification.direction);
                            newListItems[to].orders.push({
                                id: playbackModification.new_id,
                                quantity: orderToMove.quantity,
                            });
                            newListItems = checkDeletePriceLevel(from, newListItems);
                        } else {
                            enqueueSnackbar(`Could not move. ID: ${playbackModification.order_id}.`
                             + `No new ID.`, { variant: 'error' });
                            console.log(playbackModification);
                        }
                    } else {
                        enqueueSnackbar(`Could not move. ID: ${playbackModification.order_id}.`
                            + `Order not found.`, { variant: 'error' });
                        console.log(playbackModification);
                    }
                }
                break;
            default:
                console.log(`Default: wrong type -> ${playbackModification.type}`);
                break;
            }
            ctr++;
        }

        const selectedDateTimeNano = bigInt(playbackData.timestamp);
        const {
            timeNanoseconds,
        } = splitNanosecondEpochTimestamp(convertNanosecondsUTCToCurrentTimezone(selectedDateTimeNano));
        const sodOffset = playbackData.last_sod_offset === '0' ? lastSodOffset : bigInt(playbackData.last_sod_offset);
        this.setState({
            listItems: newListItems,
            lastSodOffset: sodOffset,
            maxQuantity: newMaxQuantity,
            selectedTimeString: nanosecondsToString(timeNanoseconds),
        });
    };

    /**
     * @desc handles updating state for playback feature
     */
    handlePlayback = (playback: boolean) => {
        this.setState({ playback });
    }

    /**
     * @desc handles the updates with deltas once a message is moved by a certain amount
     * @param deltas
     */
    handleUpdateWithDeltas = (deltas: OrderBook) => {
        const { listItems } = this.state;
        const { onTimestampSelected } = this.props;
        const {
            // eslint-disable-next-line camelcase
            asks, bids, timestamp, last_sod_offset,
        } = deltas;
        const { timeNanoseconds } = splitNanosecondEpochTimestamp(bigInt(timestamp));
        const { newListItems, newMaxQuantity } = processOrderBookWithDeltas(listItems, asks, bids);
        const selectedTimestampInfo: SelectedTimestampInfo = {
            currentOrderbookTimestamp: timestamp,
            lastModificationType: LastModificationType.MESSAGE,
        };
        onTimestampSelected(selectedTimestampInfo);
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
            playback,
        } = this.state;
        const selectedDateTimeNano = bigInt(currentOrderbookTimestamp);
        let messageText;
        if (selectedDateTimeNano.equals(0)) {
            if (selectedInstrument.length === 0) messageText = 'Select an instrument';
            else {
                messageText = 'Select a date';
            }
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
                                {loadingInstruments ? (
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
                                        disabled={playback}
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
                            <PlaybackControl
                                selectedDateTimeNano={selectedDateTimeNano}
                                lastSodOffset={lastSodOffset}
                                selectedInstrument={selectedInstrument}
                                handlePlaybackModifications={this.handlePlaybackModifications}
                                handlePlayback={this.handlePlayback}
                                playback={playback}
                            />
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
                                        disabled={selectedInstrument.length === 0 || playback}
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
                                {!loadingGraph && !graphUnavailable && topOfBookItems.length !== 0 && (
                                    <TopOfBookGraphWrapper
                                        className={classes.graph}
                                        onTimeSelect={this.handleSelectGraphDateTime}
                                        handlePanAndZoom={this.handlePanAndZoom}
                                        selectedDateTimeNano={selectedDateTimeNano}
                                        startOfDay={selectedDateNano.plus(NANOSECONDS_IN_NINE_AND_A_HALF_HOURS)}
                                        endOfDay={selectedDateNano.plus(NANOSECONDS_IN_SIXTEEN_HOURS)}
                                        topOfBookItems={topOfBookItems}
                                        playback={playback}
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
                                    playback={playback}
                                />
                            </Card>
                            {(lastSodOffset.neq(0)) && (
                                <Card className={classes.messageListCard}>
                                    <MessageList
                                        lastSodOffset={lastSodOffset}
                                        instrument={selectedInstrument}
                                        handleUpdateWithDeltas={this.handleUpdateWithDeltas}
                                        loading={loadingOrderbook}
                                        playback={playback}
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
    lastModificationType: state.general.lastModificationType,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    onTimestampSelected: (selectedTimestampInfo: SelectedTimestampInfo) => dispatch(
        saveOrderbookTimestampInfo(selectedTimestampInfo),
    ),
});

export const NonConnectedOrderBookSnapshot = withStyles(styles)(OrderBookSnapshot);

export default withStyles(styles)(withSnackbar(connect(mapStateToProps, mapDispatchToProps)(OrderBookSnapshot)));
