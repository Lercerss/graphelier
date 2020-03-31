import React, { Component } from 'react';
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
import { Dispatch } from 'redux';
import { connect } from 'react-redux';
import bigInt from 'big-integer';
import { setPlayback } from '../actions/actions';
import { RootState } from '../store';

import { Styles } from '../styles/PlaybackControl';
import { TIME_UNITS } from '../constants/Constants';

// const WebSocket = require('isomorphic-ws');

const styles = theme => createStyles(Styles(theme));

interface PlaybackProps extends WithStyles<typeof styles> {
    selectedInstrument: string,
    selectedDateTimeNano: bigInt.BigInteger,
    handleTimeChange: Function,
}

interface PlaybackState {
    selectedUnit: string,
    unitSpeed: number,
}

interface PropsFromState {
    playback: boolean,
}

interface PropsFromDispatch {
    setPlaybackAction: Function,
}

type AllProps = PlaybackProps & PropsFromState & PropsFromDispatch;

class PlaybackControl extends Component<AllProps, PlaybackState> {
    playbackWS;

    constructor(props) {
        super(props);

        this.state = {
            selectedUnit: 'Messages',
            unitSpeed: 10,
        };
    }

    componentWillUnmount(): void {
        this.clearPlayback();
    }

    /**
     * @desc Handles changing the selected unit for the playback
     */
    handleUnitChange = (event: React.ChangeEvent<any>): void => {
        const { playback } = this.props;
        this.setState({ selectedUnit: event.target.value }, () => {
            if (playback) this.handlePlayOrderBook();
        });
    }

    /**
     * @desc Handles changing the speed for the units for playing back the orderbook
     */
    handleUnitSpeedChange = (event: React.ChangeEvent<any>): void => {
        const { playback } = this.props;
        this.setState({ unitSpeed: event.target.value }, () => {
            if (playback) this.handlePlayOrderBook();
        });
    }

    /**
     * @desc Handles adding an event for starting playback and retrieving new data at specified speed
     */
    handlePlayOrderBook = (): void => {
        const { playback, setPlaybackAction } = this.props;
        if (playback) {
            this.clearPlayback();
        }
        setPlaybackAction(true);
        this.getPlaybackOrderBookData();
    }

    /**
     * @desc Gets playback speed parameter based on selected unit and unit speed
     */
    getPlaybackParameter = (): string => {
        const { unitSpeed, selectedUnit } = this.state;
        let parameter: string = '?';
        if (selectedUnit === 'Messages') parameter = `${parameter}rateMessages=${unitSpeed}`;
        else {
            let timeInNano: bigInt.BigInteger;
            switch (selectedUnit) {
            case 'Minutes':
                timeInNano = bigInt(60000000000);
                break;
            case 'Seconds':
                timeInNano = bigInt(1000000000);
                break;
            case 'Milliseconds':
                timeInNano = bigInt(1000000);
                break;
            case 'Microseconds':
                timeInNano = bigInt(1000);
                break;
            case 'Nanoseconds':
                timeInNano = bigInt(1);
                break;
            default:
                timeInNano = bigInt(1000000000);
            }
            const numerator = timeInNano.times(bigInt(unitSpeed)).divide(bigInt(1000000000));
            parameter = `${parameter}rateRealTime=${numerator}`;
        }
        return parameter;
    }

    /**
     * @desc Calls the backend service to get new data to feed OrderBook, graph
     */
    getPlaybackOrderBookData = (): void => {
        const { selectedDateTimeNano, handleTimeChange } = this.props;
        // const { selectedInstrument, selectedDateTimeNano } = this.props;
        // const parameter = this.getPlaybackParameter();
        //
        // const endPoint = `ws://localhost:5050/playback/${selectedInstrument}/${selectedDateTimeNano}/${parameter}`;
        // this.playbackWS = new WebSocket(endPoint);

        // this.playbackWS.onopen = () => {
        //     console.log('opened');
        // };
        // this.playbackWS.onmessage = m => {
        //     console.log(m.data);
        // };
        // this.playbackWS.onclose = () => {
        //     console.log('closed');
        // };

        this.playbackWS = new WebSocket('wss://echo.websocket.org/');

        this.playbackWS.onopen = () => {
            console.log('connected');
            this.playbackWS.send(Date.now().toString());
        };

        this.playbackWS.onclose = () => {
            console.log('disconnected');
        };

        this.playbackWS.onmessage = data => {
            console.log(`Roundtrip time: ${Date.now() - data.data} ms`);

            setTimeout(() => {
                this.playbackWS.send(Date.now().toString());
                if (selectedDateTimeNano.valueOf() > 0) handleTimeChange(selectedDateTimeNano.plus(1000000000));
            }, 1000);
        };
    }

    /**
     * @desc Handles removing the event for starting playback and retrieving new data at specified speed
     */
    handlePauseOrderBook = (): void => {
        const { setPlaybackAction } = this.props;
        setPlaybackAction(false);
        this.clearPlayback();
        // this.setState({ playback: false }, () => this.clearPlayback());
    }

    /**
     * @desc Stops the websocket from processing more information.
     */
    clearPlayback = (): void => {
        if (this.playbackWS) this.playbackWS.close();
    }

    render() {
        const { classes, playback } = this.props;
        const { selectedUnit, unitSpeed } = this.state;
        return (
            <div
                id={'playbackSection'}
                className={classes.centerContent}
            >
                <div
                    onClickCapture={() => { if (!playback) this.handlePlayOrderBook(); }}
                    className={playback ? classNames(classes.button, classes.marginRight, classes.selectedButton)
                        : classNames(classes.button, classes.marginRight)}
                >
                    PLAY
                </div>
                <div
                    onClickCapture={this.handlePauseOrderBook}
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
                    type={'number'}
                    value={unitSpeed}
                    onChange={this.handleUnitSpeedChange}
                    label={'# of Units'}
                    className={classes.selectUnitSpeedInput}
                />
            </div>
        );
    }
}

const mapDispatchToProps = (dispatch : Dispatch) => ({
    setPlaybackAction: (playback: boolean) => dispatch(
        setPlayback(playback),
    ),
});

const mapStateToProps = (state: RootState) => ({
    playback: state.general.playback,
});

export default connect(mapStateToProps, mapDispatchToProps)(withStyles(styles)(PlaybackControl));
