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
    dateStringToEpoch,
    splitNanosecondEpochTimestamp,
} from '../utils/date-utils';
import TimestampOrderBookScroller from './TimestampOrderBookScroller';
import TopOfBookGraphWrapper from './TopOfBookGraphWrapper';

import OrderBookService from '../services/OrderBookService';
import {
    NANOSECONDS_IN_NINE_AND_A_HALF_HOURS, NANOSECONDS_IN_ONE_MILLISECOND,
    NANOSECONDS_IN_SIXTEEN_HOURS,
    NUM_DATA_POINTS_RATIO,
} from '../constants/Constants';
import {
    processOrderBookFromScratch,
    processOrderBookWithDeltas,
    checkCreatePriceLevel,
    checkDeletePriceLevel,
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
import { saveOrderbookTimestampInfo, setPlayback } from '../actions/actions';

const styles = theme => createStyles(Styles(theme));

interface Props extends WithStyles<typeof styles>, WithSnackbarProps {
    orderDetails: OrderDetails,
    showOrderInfoDrawer: boolean,
    onTimestampSelected: Function,
    currentOrderbookTimestamp: string,
    lastModificationType: LastModificationType,
    timeString: string,
    selectedDateNano: bigInt.BigInteger,
    onPlayback: Function,
    playback: boolean,
    instruments: Array<string>,
}

interface State {
    lastSodOffset: bigInt.BigInteger,
    datePickerValue: moment.Moment | null,
    selectedInstrument: string,
    listItems: ListItems,
    maxQuantity: number,
    topOfBookItems: Array<TopOfBookItem>,
    loadingOrderbook: boolean,
    loadingGraph: boolean,
    graphUnavailable: boolean,
    clickedGraph: boolean,
}

class OrderBookSnapshot extends Component<Props, State> {
    /**
     * @desc Handles window resizing and requests a new number of data points appropriate for the new window width
     */
    handleResize = debounce(() => {
        const { selectedDateNano } = this.props;
        if (selectedDateNano.neq(0)) {
            const start: bigInt.BigInteger = selectedDateNano.plus(NANOSECONDS_IN_NINE_AND_A_HALF_HOURS);
            const end: bigInt.BigInteger = selectedDateNano.plus(NANOSECONDS_IN_SIXTEEN_HOURS);
            this.updateGraphData(start, end);
        }
    }, 100);

    constructor(props) {
        super(props);
        this.state = {
            lastSodOffset: bigInt(0),
            datePickerValue: null,
            selectedInstrument: '',
            listItems: {},
            maxQuantity: -1,
            topOfBookItems: [],
            loadingOrderbook: false,
            loadingGraph: false,
            graphUnavailable: false,
            clickedGraph: false,
        };
    }

    componentDidMount() {
        window.addEventListener('resize', this.handleResize);
        this.handleFromNews();
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        const { selectedInstrument } = this.state;
        const { currentOrderbookTimestamp, lastModificationType } = this.props;
        if (prevState.selectedInstrument !== selectedInstrument
            || prevProps.currentOrderbookTimestamp !== currentOrderbookTimestamp) {
            if (lastModificationType === LastModificationType.GRAPH
                || lastModificationType === LastModificationType.FORCE_REFRESH) {
                this.handleNewTimestamp();
            }
        }
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.handleResize);
    }

    /**
     * @desc Handles the change in instrument, keeps the selected time from the previous instrument
     * @param event menu item that triggered change
     */
    handleInstrumentChange = (event: React.ChangeEvent<any>) => {
        this.setState({
            selectedInstrument: event.target.value,
        }, () => {
            const { selectedDateNano, currentOrderbookTimestamp } = this.props;
            if (selectedDateNano.neq(0)) {
                const graphStartTime: bigInt.BigInteger = selectedDateNano.plus(NANOSECONDS_IN_NINE_AND_A_HALF_HOURS);
                const graphEndTime: bigInt.BigInteger = selectedDateNano.plus(NANOSECONDS_IN_SIXTEEN_HOURS);
                this.updateGraphData(graphStartTime, graphEndTime);
                if (currentOrderbookTimestamp !== '') {
                    this.handleNewTimestamp();
                }
            }
        });
    };

    /**
     * @desc Get appropriate number of data points to request for the graph
     * @returns {number}
     */
    getNumDataPoints = (): number => {
        return Math.trunc(window.innerWidth * NUM_DATA_POINTS_RATIO);
    };

    /**
     * @desc Handles the date change for the TextField date picker MM/DD/YYYY
     * @param date The selected date
     */
    handleChangeDate = (date: any) => {
        if (!moment(date).isValid()) return;

        this.setState({
            loadingGraph: true,
            graphUnavailable: false,
        }, () => {
            const { onTimestampSelected } = this.props;
            const selectedTimeNano: bigInt.BigInteger = NANOSECONDS_IN_NINE_AND_A_HALF_HOURS;
            const selectedDateString: string = date.format('YYYY-MM-DD');
            const selectedDateNano: bigInt.BigInteger = dateStringToEpoch(`${selectedDateString} 00:00:00`);
            const selectedDateTimeNano: bigInt.BigInteger = selectedDateNano.plus(selectedTimeNano);
            const selectedTimestampInfo: SelectedTimestampInfo = {
                currentOrderbookTimestamp: selectedDateTimeNano.toString(),
                lastModificationType: LastModificationType.FORCE_REFRESH,
            };
            const graphStartTime: bigInt.BigInteger = selectedDateNano.plus(NANOSECONDS_IN_NINE_AND_A_HALF_HOURS);
            const graphEndTime: bigInt.BigInteger = selectedDateNano.plus(NANOSECONDS_IN_SIXTEEN_HOURS);

            this.setState({
                datePickerValue: date,
                clickedGraph: false,
            }, () => {
                onTimestampSelected(selectedTimestampInfo);
                this.updateGraphData(graphStartTime, graphEndTime);
            });
        });
    };

    /**
     * @desc Handles the time change when the user clicks on a time in the graph
     * @param value {number} The new datetime value that represents the date and time clicked on in the graph,
     * in utc nanoseconds
     */
    handleSelectGraphDateTime = (value: string) => {
        const { onTimestampSelected, playback } = this.props;
        const selectedTimestampInfo: SelectedTimestampInfo = {
            currentOrderbookTimestamp: value,
            lastModificationType: LastModificationType.GRAPH,
        };
        if (!playback) {
            onTimestampSelected(selectedTimestampInfo);
            this.setState({
                clickedGraph: true,
            });
        }
    };

    /**
     *  @desc When current timestamp changes, requests for new orderbook prices for top of the book
     *  @pre assumes redux's `currentOrderBookTimestamp` was updated
     */
    handleNewTimestamp = () => {
        const { currentOrderbookTimestamp } = this.props;
        const selectedDateTimeNano = bigInt(currentOrderbookTimestamp);
        if (selectedDateTimeNano.neq(0)) {
            const { selectedInstrument } = this.state;
            this.setState({
                loadingOrderbook: true,
            }, () => {
                OrderBookService.getOrderBookPrices(selectedInstrument, currentOrderbookTimestamp)
                    .then(response => {
                        // eslint-disable-next-line camelcase
                        const { asks, bids, last_sod_offset } = response.data;
                        const { listItems, maxQuantity } = processOrderBookFromScratch(asks, bids);
                        this.setState({
                            listItems,
                            maxQuantity,
                            lastSodOffset: bigInt(last_sod_offset),
                        }, () => {
                            this.setState({
                                loadingOrderbook: false,
                            });
                        });
                    })
                    .catch(err => {
                        console.warn(err);
                    });
            });
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
            lastModificationType: LastModificationType.PLAYBACK,
        };
        onTimestampSelected(selectedTimestampInfo);
        const modificationsLength = playbackData.modifications.length;
        let ctr: number = 0;
        const data = processOrderBookPlayback(listItems);
        let { newListItems } = data;
        const { newMaxQuantity } = data;
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

        const sodOffset = playbackData.last_sod_offset === '0' ? lastSodOffset : bigInt(playbackData.last_sod_offset);
        this.setState({
            listItems: newListItems,
            lastSodOffset: sodOffset,
            maxQuantity: newMaxQuantity,
        });
    };

    /**
     * @desc handles updating state for playback feature
     */
    handlePlayback = (playback: boolean) => {
        const { onPlayback } = this.props;
        onPlayback(playback);
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
        const { newListItems, newMaxQuantity } = processOrderBookWithDeltas(listItems, asks, bids);
        const selectedTimestampInfo: SelectedTimestampInfo = {
            currentOrderbookTimestamp: timestamp,
            lastModificationType: LastModificationType.MESSAGE,
        };
        onTimestampSelected(selectedTimestampInfo);
        this.setState({
            lastSodOffset: bigInt(last_sod_offset),
            listItems: newListItems,
            maxQuantity: newMaxQuantity,
        });
    };

    /**
     * @desc Updates the graph with top of book values (best bids/asks curves)
     *  for new start time and end time bounds
     */
    updateGraphData = (
        graphStartTime: bigInt.BigInteger,
        graphEndTime: bigInt.BigInteger,
        selectedTimestampInfo?: SelectedTimestampInfo,
    ) => {
        const { selectedInstrument } = this.state;
        const { onTimestampSelected } = this.props;
        OrderBookService.getTopOfBookOverTime(selectedInstrument, graphStartTime.toString(), graphEndTime.toString(),
            this.getNumDataPoints())
            .then(response => {
                // eslint-disable-next-line camelcase
                const result = response.data;
                this.setState({
                    topOfBookItems: result || [],
                    loadingGraph: false,
                }, () => {
                    if (selectedTimestampInfo) {
                        onTimestampSelected(selectedTimestampInfo);
                    }
                });
            })
            .catch(err => {
                console.warn(err);
                this.setState({
                    topOfBookItems: [],
                    loadingGraph: false,
                    graphUnavailable: true,
                });
            });
    };

    /**
     * @desc handles updating the graph on a navigation from news
     * @pre url query params must have:
     *  - instrument
     *  - timestamp
     */
    handleFromNews = () => {
        const { search } = window.location;
        const params = new URLSearchParams(search);
        const instrument = params.get('instrument');
        const timestamp = params.get('timestamp');

        if (instrument && timestamp) {
            const selectedDateTimeNano = bigInt(timestamp);
            const datePickerValue = moment(selectedDateTimeNano.divide(NANOSECONDS_IN_ONE_MILLISECOND).valueOf());
            const {
                dateNanoseconds,
            } = splitNanosecondEpochTimestamp(selectedDateTimeNano);
            const selectedDateNano: bigInt.BigInteger = bigInt(dateNanoseconds);
            const graphStartTime: bigInt.BigInteger = selectedDateNano.plus(NANOSECONDS_IN_NINE_AND_A_HALF_HOURS);
            const graphEndTime: bigInt.BigInteger = selectedDateNano.plus(NANOSECONDS_IN_SIXTEEN_HOURS);

            this.setState({
                selectedInstrument: instrument,
                datePickerValue,
                loadingGraph: true,
                clickedGraph: true,
            }, () => {
                const selectedTimestampInfo: SelectedTimestampInfo = {
                    currentOrderbookTimestamp: timestamp,
                    lastModificationType: LastModificationType.FORCE_REFRESH,
                };
                this.updateGraphData(graphStartTime, graphEndTime, selectedTimestampInfo);
            });
        }
    }

    /*  RENDERS  */

    /**
     * @desc Renders dropdown for selecting an instrument
     */
    renderInstrumentPicker = () => {
        const { classes, instruments, playback } = this.props;
        const { selectedInstrument } = this.state;
        return (
            <div>
                <Typography
                    variant={'body1'}
                    className={classes.inputLabel}
                    color={'textSecondary'}
                >
                    {'Instrument'}
                </Typography>
                {instruments.length === 0 ? (
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
        );
    }

    /**
     * @desc Renders date time picker on top right of the component
     */
    renderDateTimePicker = () => {
        const { classes, playback, timeString } = this.props;
        const { datePickerValue, selectedInstrument } = this.state;
        return (
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
                        placeholder={'MM/DD/YYYY'}
                        format={'MM/DD/YYYY'}
                        views={['year', 'month', 'date']}
                        openTo={'year'}
                        disabled={selectedInstrument.length === 0 || playback}
                        invalidDateMessage={'invalid date'}
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
                        {timeString}
                    </Typography>
                </div>
            </div>
        );
    }

    /**
     * @desc Renders the graph portion of the component
     */
    renderGraph = () => {
        const { classes } = this.props;
        const { graphUnavailable, loadingGraph, topOfBookItems } = this.state;
        return (
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
                        handlePanAndZoom={this.updateGraphData}
                        topOfBookItems={topOfBookItems}
                    />
                )}
            </Card>
        );
    }

    /**
     * @desc Renders the orderbook and message list portions of the component
     */
    renderOrderBookAndMessages = () => {
        const { classes, currentOrderbookTimestamp } = this.props;
        const {
            listItems,
            maxQuantity,
            lastSodOffset,
            selectedInstrument,
            loadingOrderbook,
            clickedGraph,
        } = this.state;
        const selectedDateTimeNano = bigInt(currentOrderbookTimestamp);
        return (clickedGraph ? (
            <div>
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
        ) : <div />);
    }

    render() {
        const {
            classes,
            orderDetails,
            showOrderInfoDrawer,
            currentOrderbookTimestamp,
        } = this.props;
        const {
            lastSodOffset,
            selectedInstrument,
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
                            {this.renderInstrumentPicker()}
                            <PlaybackControl
                                selectedDateTimeNano={selectedDateTimeNano}
                                lastSodOffset={lastSodOffset}
                                selectedInstrument={selectedInstrument}
                                handlePlaybackModifications={this.handlePlaybackModifications}
                                handlePlayback={this.handlePlayback}
                            />
                            {this.renderDateTimePicker()}
                        </div>
                    </FormControl>
                    {selectedInstrument.length !== 0 && currentOrderbookTimestamp !== '' && (
                        <div>
                            {this.renderGraph()}
                            {this.renderOrderBookAndMessages()}
                        </div>
                    )}
                    {orderDetails && showOrderInfoDrawer && (
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
    timeString: state.general.timeString,
    selectedDateNano: state.general.selectedDateNano,
    playback: state.general.playback,
    instruments: state.general.instruments,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    onTimestampSelected: (selectedTimestampInfo: SelectedTimestampInfo) => dispatch(
        saveOrderbookTimestampInfo(selectedTimestampInfo),
    ),
    onPlayback: (playback: boolean) => dispatch(
        setPlayback(playback),
    ),
});

export const NonConnectedOrderBookSnapshot = withStyles(styles)(OrderBookSnapshot);

export default withStyles(styles)(withSnackbar(connect(mapStateToProps, mapDispatchToProps)(OrderBookSnapshot)));
