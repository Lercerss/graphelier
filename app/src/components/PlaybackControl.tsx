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

import { connect } from 'react-redux';
import { Dispatch } from 'redux';
import { Styles } from '../styles/PlaybackControl';
import {
    TIME_UNITS,
    MAXIMUM_PLAYBACK_REAL_TIME_RATE,
    NANOSECONDS_IN_ONE_SECOND,
    NANOSECONDS_IN_ONE_MICROSECOND,
    NANOSECONDS_IN_ONE_MILLISECOND,
    PLAYBACK_DELAY,
    MAXIMUM_DISABLE_TRANSITIONS_FOR_REAL_TIME_RATE,
    MAXIMUM_DISABLE_TRANSITIONS_FOR_MESSAGES,
} from '../constants/Constants';
import OrderBookService from '../services/OrderBookService';
import { RootState } from '../store';
import { setDisableTransitions } from '../actions/actions';

const styles = theme => createStyles(Styles(theme));

interface PlaybackProps extends WithStyles<typeof styles>, WithSnackbarProps {
    selectedDateTimeNano: bigInt.BigInteger,
    selectedInstrument: string,
    lastSodOffset: bigInt.BigInteger,
    handlePlaybackModifications: Function,
    handlePlayback: Function,
    playback: boolean,
    disableTransitionsAction: Function,
}

interface PlaybackState {
    selectedUnit: string,
    unitSpeed: string,
}

class PlaybackControl extends PureComponent<PlaybackProps, PlaybackState> {
    constructor(props) {
        super(props);

        this.state = {
            selectedUnit: 'Messages',
            unitSpeed: '1',
        };
    }

    componentWillUnmount(): void {
        OrderBookService.clearPlayback();
    }

    /**
     * @desc Handles changing the selected unit for the playback
     */
    private handleUnitChange = (event: React.ChangeEvent<any>): void => {
        this.setState({ selectedUnit: event.target.value }, () => this.checkRealTimeRate());
    };

    /**
     * @desc Handles changing the speed for the units for playing back the orderbook
     */
    private handleUnitSpeedChange = (event: React.ChangeEvent<any>): void => {
        const { selectedUnit } = this.state;
        const { value } = event.target;
        let speed: number = 0;
        if (value === 'NaN') speed = Number.NaN;
        else speed = Number.parseFloat(value);
        if (speed && speed < 0) {
            this.showMessage('Please enter a positive unit # for playback.');
        } else if (speed && selectedUnit === 'Messages' && !(Number.isInteger(speed))) {
            this.showMessage('Please enter a whole number.');
            this.setState({ unitSpeed: Math.floor(speed).toString() });
        } else this.setState({ unitSpeed: value }, () => this.checkRealTimeRate());
    };

    /**
     * @desc Handles adding an event for starting playback and retrieving new data at specified speed
     */
    handlePlayOrderBook = (): void => {
        const {
            playback, handlePlayback, selectedInstrument, lastSodOffset, handlePlaybackModifications,
        } = this.props;
        const { unitSpeed } = this.state;
        if (!playback) {
            const speed: number = Number.parseFloat(unitSpeed);
            if (Number.isNaN(speed)) {
                this.showMessage('Please enter a number');
            } else if (speed === 0) {
                this.showMessage('0 is not a valid unit speed. Please select a strictly positive number');
            } else {
                handlePlayback(true);
                const parameter = this.getPlaybackParameter();
                this.checkDisableTransitions();
                OrderBookService.getPlaybackWebSocket(selectedInstrument, lastSodOffset, parameter,
                    handlePlaybackModifications);
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
        const maxPlaybackRTR: number = Number.parseFloat(MAXIMUM_PLAYBACK_REAL_TIME_RATE);
        if (realTimeRate > maxPlaybackRTR) {
            this.showMessage(`Please select a lower real time rate for playback. Maximum ratio is 5. `
             + `You entered: ${realTimeRate}`);
            this.setState({ unitSpeed: MAXIMUM_PLAYBACK_REAL_TIME_RATE });
            valid = false;
        }
        return valid;
    };

    /**
     * Checks current factor for speed in order to determine if transitions should be disabled or not
     */
    checkDisableTransitions = (): void => {
        const { selectedUnit, unitSpeed } = this.state;
        const { disableTransitionsAction } = this.props;
        const speed: number = Number.parseFloat(unitSpeed);
        if (selectedUnit === 'Messages' && speed >= MAXIMUM_DISABLE_TRANSITIONS_FOR_MESSAGES) {
            disableTransitionsAction(true);
        } else if (selectedUnit !== 'Messages'
            && this.getRealTimeRate() >= MAXIMUM_DISABLE_TRANSITIONS_FOR_REAL_TIME_RATE) {
            disableTransitionsAction(true);
        }
    };

    /**
     * @desc Gets the real time rate for playback, 0 if Messages is selected as unit
     * @returns {number}
     */
    getRealTimeRate = (): number => {
        const { unitSpeed, selectedUnit } = this.state;
        const speed: number = Number.parseFloat(unitSpeed);
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
        return (timeInNano / NANOSECONDS_IN_ONE_SECOND) * speed;
    };

    /**
     * @desc Gets playback speed parameter based on selected unit and unit speed
     */
    getPlaybackParameter = (): string => {
        const { unitSpeed, selectedUnit } = this.state;
        let parameter: string = `?delay=${PLAYBACK_DELAY}&`;
        const speed: number = Number.parseFloat(unitSpeed);
        if (selectedUnit === 'Messages') {
            parameter = `${parameter}rateMessages=${Math.ceil(speed * PLAYBACK_DELAY)}`;
        } else {
            parameter = `${parameter}rateRealtime=${this.getRealTimeRate()}`;
        }
        return parameter;
    };

    /**
     * @desc gets the title for displaying the # of units next to unit type selected
     */
    getUnitSpeedTitle = (): string => {
        const { selectedUnit } = this.state;
        if (selectedUnit === 'Messages') {
            return '# of Messages';
        }
        return `# of ${selectedUnit} per Second`;
    };

    /**
     * @desc Handles removing the event for starting playback and retrieving new data at specified speed
     */
    handlePauseOrderBook = (): void => {
        const { handlePlayback, disableTransitionsAction } = this.props;
        handlePlayback(false);
        disableTransitionsAction(false);
        OrderBookService.clearPlayback();
    };

    /**
     * @desc shows a message using snackbar
     * @param text {string}
     */
    showMessage = (text: string): void => {
        const { enqueueSnackbar } = this.props;
        enqueueSnackbar(text, { variant: 'warning', anchorOrigin: { vertical: 'bottom', horizontal: 'left' } });
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
                    label={this.getUnitSpeedTitle()}
                    className={classes.selectUnitSpeedInput}
                    disabled={playback}
                />
            </div>
        );
    }
}

export const NonConnectedPlaybackControl = withStyles(styles)(PlaybackControl);

const mapStateToProps = (state: RootState) => ({
    playback: state.general.playback,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    disableTransitionsAction: (disableTransitions: boolean) => dispatch(
        setDisableTransitions(disableTransitions),
    ),
});

export default withStyles(styles)(withSnackbar(connect(mapStateToProps, mapDispatchToProps)(PlaybackControl)));
