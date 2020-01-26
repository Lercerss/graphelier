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
            <div className={showTransition
                ? classNames(classes.centerLoading) : classNames(classes.centerLoading, classes.transition)}
            >
                <h2 className={classNames(classes.squarePointColor)}>{APP_NAME}</h2>
                <CustomLoader type={'circular'} />
            </div>
        );
    }
}

export default withStyles(styles)(GreetingsLoader);
