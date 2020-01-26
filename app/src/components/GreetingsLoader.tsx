import React, { Component } from 'react';
import { createStyles, withStyles, WithStyles } from '@material-ui/core';
import classNames from 'classnames';
import CustomLoader from './CustomLoader';

import { Styles } from '../styles/CustomLoader';
import { APP_NAME } from '../constants/Constants';

const styles = createStyles(Styles);

interface GreetingsLoaderProps extends WithStyles<typeof styles> {
    showTransition: boolean
}
class GreetingsLoader extends Component<GreetingsLoaderProps> {
    render() {
        const { classes, showTransition } = this.props;
        return (
            <div className={classes.centerLoading}>
                <h2 className={showTransition
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
