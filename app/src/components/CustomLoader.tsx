import React, { Component } from 'react';
import { withStyles, WithStyles, createStyles } from '@material-ui/core/styles';
import classNames from 'classnames';
import { CircularProgress, LinearProgress } from '@material-ui/core';
import { Styles } from '../styles/CustomLoader';

const styles = createStyles(Styles);

interface CustomLoaderProps extends WithStyles<typeof styles> {
    color?: 'primary'
        | 'secondary'
        | 'inherit',
    size?: string | number,
    type: string,
}

class CustomLoader extends Component<CustomLoaderProps> {
    render() {
        const {
            color, classes, type, size,
        } = this.props;

        return (
            // eslint-disable-next-line no-nested-ternary
            type === 'circular'
                ? (
                    <CircularProgress
                        className={classNames(classes.squarePointColor, classes.centerLoading)}
                        color={color}
                        size={size}
                    />
                )
                : (type === 'linear'
                    ? (
                        <LinearProgress
                            className={classNames(classes.squarePointColor, classes.maxWidth)}
                        />
                    )
                    : <p>hello</p>)
        );
    }
}

export default withStyles(styles)(CustomLoader);
