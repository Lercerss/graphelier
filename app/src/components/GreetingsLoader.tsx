import React, { Component } from 'react';
import { createStyles, withStyles, WithStyles } from '@material-ui/core';
import classNames from 'classnames';
import CustomLoader from './CustomLoader';

import { Styles } from '../styles/CustomLoader';
import { APP_NAME } from '../constants/Constants';

const styles = createStyles(Styles);

interface GreetingsLoaderProps extends WithStyles<typeof styles> {
    hideGreeting: Function
}

interface GreetingsLoaderState {
    showTransition: boolean;
}
class GreetingsLoader extends Component<GreetingsLoaderProps, GreetingsLoaderState> {
    timeoutCall;

    timeoutTransition;

    constructor(props) {
        super(props);

        this.state = {
            showTransition: false,
        };
    }

    componentDidMount(): void {
        const { hideGreeting } = this.props;
        this.timeoutCall = window.setTimeout(() => hideGreeting(), 1100);
        this.timeoutTransition = window.setTimeout(() => { this.setState({ showTransition: true }); }, 50);
    }

    componentWillUnmount(): void {
        clearTimeout(this.timeoutCall);
        clearTimeout(this.timeoutTransition);
    }

    render() {
        const { classes } = this.props;
        const { showTransition } = this.state;
        return (
            <div className={classes.centerLoading}>
                <h2 className={!showTransition
                    ? classNames(classes.squarePointColor)
                    : classNames(classes.transition, classes.squarePointColor)}
                >
                    {APP_NAME}
                </h2>
                <div className={classes.transitionVertialSpace}>
                    <CustomLoader type={'circular'} />
                </div>
            </div>
        );
    }
}

export default withStyles(styles)(GreetingsLoader);
