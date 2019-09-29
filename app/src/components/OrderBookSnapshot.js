import React, {Component} from 'react';
import {connect} from 'react-redux';
import {withStyles, Container, Typography, Button, NativeSelect} from '@material-ui/core';
import {Styles} from '../styles/OrderBookSnapshot';
import {getFormattedDate} from '../utils/helpers';


class OrderBookSnapshot extends Component {

    constructor(props) {
        super(props);

        this.state = {
            defaultTimestamp: getFormattedDate(new Date()),
            selectedTimestamp: null,
        };
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        const {selectedTimestamp} = this.state;

        if(prevState.selectedTimestamp != selectedTimestamp){
            //TODO call backend service to set orderbook object
        }
    }

    /**
     * Handles the change for the timestamp select
     *
     * @param event The event object that caused the call
     */
    handleChange = (event) => {
        const {selectedTimestamp} = this.state;
        const value = event.target.value;
        if(value != selectedTimestamp) {
            this.setState({selectedTimestamp: value});
        }
    }

    render() {
        const {classes} = this.props;
        const {defaultTimestamp, selectedTimestamp} = this.state;
        let time = selectedTimestamp ? selectedTimestamp : 'Please select a time';
        return (
            <Container
                maxWidth={'lg'}
                component={'div'}
                className={classes.root}>
                <Typography component="div" className={classes.container}>
                    <div id='ButtonHeader' className={classes.divTopBook}>
                        <NativeSelect
                            className={classes.NativeSelect}
                            value={time}
                            onChange={this.handleChange}>
                            <option value={'placeholder'}>Please select a time</option>
                            <option value={defaultTimestamp}>{defaultTimestamp}</option>
                        </NativeSelect>
                    </div>
                    <div className={classes.divTopBookBody}>
                        Component coming soon &trade;
                    </div>
                </Typography>
            </Container>
        );
    }
}

export default withStyles(Styles)(OrderBookSnapshot);