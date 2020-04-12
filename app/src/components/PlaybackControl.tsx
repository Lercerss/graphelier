import React, { PureComponent } from 'react';
import {
    createStyles,
    FormControl,
    InputLabel,
    MenuItem,
    Select, TextField,
    withStyles,
    WithStyles,
} from '@material-ui/core';
import classNames from 'classnames';
import bigInt from 'big-integer';
import { withSnackbar, WithSnackbarProps } from 'notistack';

import { PlaybackData } from '../models/OrderBook';

import { Styles } from '../styles/PlaybackControl';
import {
    TIME_UNITS, MAXIMUM_PLAYBACK_REAL_TIME_RATE, NANOSECONDS_IN_ONE_SECOND, NANOSECONDS_IN_ONE_MICROSECOND,
    NANOSECONDS_IN_ONE_MILLISECOND,
} from '../constants/Constants';

const styles = theme => createStyles(Styles(theme));
const WebSocket = require('isomorphic-ws');

interface PlaybackProps extends WithStyles<typeof styles>, WithSnackbarProps {
    selectedDateTimeNano: bigInt.BigInteger,
    selectedInstrument: string,
    lastSodOffset: bigInt.BigInteger,
    handlePlaybackModifications: Function,
    handlePlayback: Function,
    playback: boolean,
}

interface PlaybackState {
    selectedUnit: string,
    unitSpeed: number,
}

class PlaybackControl extends PureComponent<PlaybackProps, PlaybackState> {
    playbackWS;

    constructor(props) {
        super(props);

        this.state = {
            selectedUnit: 'Messages',
            unitSpeed: 1,
        };
    }

    componentWillUnmount(): void {
        this.clearPlayback();
    }

    /**
     * @desc Handles changing the selected unit for the playback
     */
    private handleUnitChange = (event: React.ChangeEvent<any>): void => {
        this.setState({ selectedUnit: event.target.value });
    };

    /**
     * @desc Handles changing the speed for the units for playing back the orderbook
     */
    private handleUnitSpeedChange = (event: React.ChangeEvent<any>): void => {
        const { selectedUnit } = this.state;
        const unitSpeed: number = Number.parseFloat(event.target.value);
        if (unitSpeed && unitSpeed < 0) {
            this.showMessage('Please enter a positive unit # for playback.');
        } else if (unitSpeed && selectedUnit === 'Messages' && !(Number.isInteger(unitSpeed))) {
            this.showMessage('Please enter a whole number.');
        } else this.setState({ unitSpeed }, () => this.checkRealTimeRate());
    };

    /**
     * @desc Handles adding an event for starting playback and retrieving new data at specified speed
     */
    handlePlayOrderBook = (): void => {
        const { playback, handlePlayback } = this.props;
        const { unitSpeed } = this.state;
        if (!playback) {
            if (unitSpeed === 0) {
                this.showMessage('0 is not a valid unit speed. Please select a strictly positive number');
            } else {
                handlePlayback(true);
                this.getPlaybackOrderBookData();
            }
        }
    };

    /**
     * Checks the real time rate to see whether it is valid or not.
     * @returns {boolean}
     */
    checkRealTimeRate = (): boolean => {
        let valid: boolean = true;
        const realTimeRate = this.getRealTimeRate();
        if (realTimeRate > MAXIMUM_PLAYBACK_REAL_TIME_RATE) {
            this.showMessage(`Please select a lower real time rate for playback. Maximum ratio is 5. `
             + `You entered: ${realTimeRate}`);
            this.setState({ unitSpeed: MAXIMUM_PLAYBACK_REAL_TIME_RATE });
            valid = false;
        }
        return valid;
    };

    /**
     * @desc Gets the real time rate for playback, 0 if Messages is selected as unit
     * @returns {number}
     */
    getRealTimeRate = (): number => {
        const { unitSpeed, selectedUnit } = this.state;
        if (selectedUnit === 'Messages') return 0;

        let timeInNano: number;
        switch (selectedUnit) {
        case 'Seconds':
            timeInNano = NANOSECONDS_IN_ONE_SECOND;
            break;
        case 'Milliseconds':
            timeInNano = NANOSECONDS_IN_ONE_MILLISECOND;
            break;
        case 'Microseconds':
            timeInNano = NANOSECONDS_IN_ONE_MICROSECOND;
            break;
        case 'Nanoseconds':
            timeInNano = 1;
            break;
        default:
            timeInNano = NANOSECONDS_IN_ONE_SECOND;
        }
        return (timeInNano / NANOSECONDS_IN_ONE_SECOND) * unitSpeed;
    };

    /**
     * @desc Gets playback speed parameter based on selected unit and unit speed
     */
    getPlaybackParameter = (): string => {
        const { unitSpeed, selectedUnit } = this.state;
        let parameter: string = '?delay=2.5&';
        if (selectedUnit === 'Messages') parameter = `${parameter}rateMessages=${unitSpeed}`;
        else {
            parameter = `${parameter}rateRealtime=${this.getRealTimeRate()}`;
        }
        return parameter;
    };

    /**
     * @desc Calls the backend service to get new data to feed OrderBook, graph
     */
    getPlaybackOrderBookData = (): void => {
        const {
            selectedInstrument, lastSodOffset, handlePlaybackModifications,
        } = this.props;
        const parameter = this.getPlaybackParameter();

        const endPoint = `ws://localhost:5050/playback/${selectedInstrument}/${lastSodOffset}/${parameter}`;

        this.playbackWS = new WebSocket(endPoint);
        this.playbackWS.onopen = () => {
            console.log('opened playback websocket');
        };
        this.playbackWS.onmessage = m => {
            const data: PlaybackData = JSON.parse(m.data);
            handlePlaybackModifications(data);
        };
        this.playbackWS.onclose = () => {
            console.log('closed playback websocket');
        };
    };

    /**
     * @desc Handles removing the event for starting playback and retrieving new data at specified speed
     */
    handlePauseOrderBook = (): void => {
        const { handlePlayback } = this.props;
        const playback = false;
        handlePlayback(playback);
        this.clearPlayback();
    };

    /**
     * @desc shows a message using snackbar
     * @param text {string}
     */
    showMessage = (text: string): void => {
        const { enqueueSnackbar } = this.props;
        enqueueSnackbar(text, { variant: 'warning', anchorOrigin: { vertical: 'bottom', horizontal: 'left' } });
    };

    /**
     * @desc Stops the websocket from processing more information.
     */
    clearPlayback = (): void => {
        if (this.playbackWS) this.playbackWS.close();
    };

    render() {
        const {
            classes, playback, selectedDateTimeNano, selectedInstrument,
        } = this.props;
        const { selectedUnit, unitSpeed } = this.state;
        let disabledButtons: boolean = true;
        if (selectedDateTimeNano.neq(0) && selectedInstrument.length !== 0) {
            disabledButtons = false;
        }
        return (
            <div
                id={'playbackSection'}
                className={classes.centerContent}
            >
                <div
                    id={'playButton'}
                    onClickCapture={() => { if (!playback && !disabledButtons) this.handlePlayOrderBook(); }}
                    className={playback ? classNames(classes.button, classes.marginRight, classes.selectedButton)
                        : classNames(classes.button, classes.marginRight)}
                >
                    PLAY
                </div>
                <div
                    id={'pauseButton'}
                    onClickCapture={() => { if (!disabledButtons) this.handlePauseOrderBook(); }}
                    className={classNames(classes.button, classes.marginRight)}
                >
                    PAUSE
                </div>
                <FormControl>
                    <InputLabel id={'UnitSelectorLabel'}>Unit</InputLabel>
                    <Select
                        id={'unitSelector'}
                        labelId={'UnitSelectorLabel'}
                        value={selectedUnit}
                        onChange={this.handleUnitChange}
                        className={classNames(classes.selectUnitInput, classes.marginRight)}
                        disabled={playback}
                    >
                        {TIME_UNITS.map(time => {
                            return (
                                <MenuItem
                                    key={`menuitem-${time}`}
                                    value={time}
                                >
                                    {time}
                                </MenuItem>
                            );
                        })}
                    </Select>
                </FormControl>
                <TextField
                    id={'unitSpeedSelector'}
                    type={'number'}
                    value={unitSpeed}
                    onChange={this.handleUnitSpeedChange}
                    label={'# of Units'}
                    className={classes.selectUnitSpeedInput}
                    disabled={playback}
                />
            </div>
        );
    }
}

export const NonConnectedPlaybackControl = withStyles(styles)(PlaybackControl);

export default withStyles(styles)(withSnackbar(PlaybackControl));
