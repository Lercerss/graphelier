import React from 'react';
import bigInt from 'big-integer';
import { createMount, createShallow } from '@material-ui/core/test-utils';
import { Select, TextField } from '@material-ui/core';
import { NonConnectedPlaybackControl as PlaybackControl } from '../../components/PlaybackControl';
import { PLAYBACKCONTROL_INFORMATION } from '../utils/mock-data';
import OrderBookService from '../../services/OrderBookService';

describe('Playback control functionality', () => {
    // eslint-disable-next-line no-unused-vars
    let mount, shallow, selectedDateTimeNano, lastSodOffset, selectedInstrument, handlePlaybackModifications,
        handlePlayback, playback, enqueueSnackbar, closeSnackbar;

    beforeEach(() => {
        mount = createMount();
        shallow = createShallow({ dive: true });
        selectedDateTimeNano = PLAYBACKCONTROL_INFORMATION.selectedDateTimeNano;
        lastSodOffset = PLAYBACKCONTROL_INFORMATION.lastSodOffset;
        selectedInstrument = PLAYBACKCONTROL_INFORMATION.selectedInstrument;
        handlePlaybackModifications = jest.fn();
        handlePlayback = jest.fn();
        playback = PLAYBACKCONTROL_INFORMATION.playback;
        enqueueSnackbar = jest.fn();
        closeSnackbar = jest.fn();
    });

    afterEach(() => {
        mount.cleanUp();
    });

    it('renders a Playback control component and changes selected unit', () => {
        const wrapper = shallow(
            <PlaybackControl
                selectedDateTimeNano={selectedDateTimeNano}
                lastSodOffset={lastSodOffset}
                selectedInstrument={selectedInstrument}
                handlePlaybackModifications={handlePlaybackModifications}
                handlePlayback={handlePlayback}
                playback={playback}
                enqueueSnackbar={enqueueSnackbar}
                closeSnackbar={closeSnackbar}
            />,
        );

        const handleUnitChangeSpy = jest.spyOn(wrapper.instance(), 'handleUnitChange');
        wrapper.instance().forceUpdate(); // see https://github.com/enzymejs/enzyme/issues/
        expect(wrapper.state().selectedUnit).toBe('Messages');
        wrapper.find(Select).simulate('change', { target: { value: 'Seconds' } });
        expect(handleUnitChangeSpy).toHaveBeenCalledTimes(1);
        expect(wrapper.state().selectedUnit).toBe('Seconds');
    });
    it('renders a Playback control component and changes selected unit speed', () => {
        const wrapper = shallow(
            <PlaybackControl
                selectedDateTimeNano={selectedDateTimeNano}
                lastSodOffset={lastSodOffset}
                selectedInstrument={selectedInstrument}
                handlePlaybackModifications={handlePlaybackModifications}
                handlePlayback={handlePlayback}
                playback={playback}
                enqueueSnackbar={enqueueSnackbar}
                closeSnackbar={closeSnackbar}
            />,
        );

        const handleUnitSpeedChangeSpy = jest.spyOn(wrapper.instance(), 'handleUnitSpeedChange');
        wrapper.instance().forceUpdate(); // see https://github.com/enzymejs/enzyme/issues/
        expect(wrapper.state().unitSpeed).toBe(1);
        wrapper.find(TextField).simulate('change', { target: { value: 5 } });
        expect(handleUnitSpeedChangeSpy).toHaveBeenCalledTimes(1);
        expect(wrapper.state().unitSpeed).toBe(5);
    });
    it('renders a Playback control component and starts playback and pauses', () => {
        const wrapper = shallow(
            <PlaybackControl
                selectedDateTimeNano={selectedDateTimeNano}
                lastSodOffset={lastSodOffset}
                selectedInstrument={selectedInstrument}
                handlePlaybackModifications={handlePlaybackModifications}
                handlePlayback={handlePlayback}
                playback={playback}
                enqueueSnackbar={enqueueSnackbar}
                closeSnackbar={closeSnackbar}
            />,
        );
        const mockClearPlayback = jest.spyOn(OrderBookService, 'clearPlayback');
        const mockHandlePlayOrderBook = jest.spyOn(OrderBookService, 'getPlaybackWebSocket')
            .mockImplementation(() => {
                wrapper.setProps({
                    playback: true,
                    selectedDateTimeNano: bigInt(PLAYBACKCONTROL_INFORMATION.data.timestamp),
                    lastSodOffset: PLAYBACKCONTROL_INFORMATION.data.last_sod_offset,
                });
            });
        const mockHandlePauseOrderBook = jest.spyOn(wrapper.instance(), 'handlePauseOrderBook')
            .mockImplementation(() => {
                wrapper.setProps({
                    playback: false,
                });
                OrderBookService.clearPlayback();
            });
        expect(wrapper.instance().props.playback).toBe(false);
        wrapper.find('#playButton').simulate('clickCapture');
        wrapper.instance().forceUpdate();
        expect(wrapper.instance().props.playback).toBe(true);
        expect(mockHandlePlayOrderBook).toHaveBeenCalledTimes(1);
        expect(mockHandlePlayOrderBook).toHaveBeenCalledTimes(1);
        wrapper.find('#pauseButton').simulate('clickCapture');
        wrapper.instance().forceUpdate();
        expect(wrapper.instance().props.playback).toBe(false);
        expect(mockHandlePauseOrderBook).toHaveBeenCalledTimes(1);
        expect(mockClearPlayback).toHaveBeenCalledTimes(1);
    });
});
