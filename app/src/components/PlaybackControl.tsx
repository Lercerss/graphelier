import React, { Component } from 'react';
import {
    Button,
    createStyles,
    FormControl,
    InputLabel,
    MenuItem,
    Select, TextField,
    withStyles,
    WithStyles,
} from '@material-ui/core';
import classNames from 'classnames';


import { Styles } from '../styles/PlaybackControl';
import { TIME_UNITS } from '../constants/Constants';

const styles = theme => createStyles(Styles(theme));

interface PlaybackProps extends WithStyles<typeof styles> {
}

interface PlaybackState {
    selectedUnit: string,
    unitSpeed: number,
    playback: boolean,
}
class PlaybackControl extends Component<WithStyles, PlaybackState> {
    playOrderBook;

    constructor(props) {
        super(props);

        this.state = {
            selectedUnit: 'Messages',
            unitSpeed: 10,
            playback: false,
        };
    }

    componentWillUnmount(): void {
        this.clearPlayback();
    }

    /**
     * @desc Handles changing the selected unit for the playback
     */
    handleUnitChange = (event: React.ChangeEvent<any>): void => {
        this.setState({ selectedUnit: event.target.value }, () => this.handlePlayOrderBook());
    }

    /**
     * @desc Handles changing the speed for the units for playing back the orderbook
     */
    handleUnitSpeedChange = (event: React.ChangeEvent<any>): void => {
        this.setState({ unitSpeed: event.target.value }, () => this.handlePlayOrderBook());
    }

    /**
     * @desc Handles adding an event for starting playback and retrieving new data at specified speed
     */
    handlePlayOrderBook = (): void => {
        const { playback } = this.state;
        if (playback) {
            this.clearPlayback();
        }
        this.setState({ playback: true }, () => {
            const interval = this.getPlaybackSpeedInterval();
            this.playOrderBook = window.setInterval(() => this.getPlaybackOrderBookData(), interval);
        });
    }

    /**
     * @desc Gets playback speed interval based on selected unit speed
     */
    getPlaybackSpeedInterval = (): number => {
        const { unitSpeed } = this.state;
        return 1000 / unitSpeed;
    }

    /**
     * @desc Calls the backend service to get new data to feed OrderBook, graph
     */
    getPlaybackOrderBookData = (): void => {
        console.log('Hello world');
    }

    /**
     * @desc Handles removing the event for starting playback and retrieving new data at specified speed
     */
    handlePauseOrderBook = (): void => {
        this.setState({ playback: false }, () => this.clearPlayback());
    }

    /**
     * @desc Clears the interval window event for playback
     */
    clearPlayback = (): void => {
        clearInterval(this.playOrderBook);
    }

    render() {
        const { classes } = this.props;
        const { selectedUnit, unitSpeed } = this.state;
        return (
            <div
                id={'playbackSection'}
                className={classes.centerContent}
            >
                <Button
                    className={classNames(classes.marginRight, classes.buttonColor)}
                    onClick={this.handlePlayOrderBook}
                >
                    Play
                </Button>
                <Button
                    className={classNames(classes.marginRight, classes.buttonColor)}
                    onClick={this.handlePauseOrderBook}
                >
                    Pause
                </Button>
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
                                    key={`menuitem-messages`}
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

export default withStyles(styles)(PlaybackControl);
