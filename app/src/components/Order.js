import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';
import classNames from 'classnames';

import { Typography, Box, Tooltip } from '@material-ui/core';
import Zoom from '@material-ui/core/Zoom';
import { Styles } from '../styles/Order';

class Order extends Component {
    render() {
        const {
            classes, type, quantity, maxQuantity,
        } = this.props;
        const quantityBoxSize = (quantity / maxQuantity) * 100;
        const minQuantityTextSize = 1.5;

        return (
            quantityBoxSize > minQuantityTextSize ? (
                <Box
                    className={classNames(classes.rectangle, type === 'bid' ? classes.bid : classes.ask)}
                    style={{ minWidth: `${quantityBoxSize}%`, maxWidth: `${quantityBoxSize}%` }}
                >
                    <Typography className={classes.text}>{quantity}</Typography>
                </Box>
            ) : (
                <Tooltip
                    title={quantity}
                    placement={'bottom'}
                    TransitionComponent={Zoom}
                    classes={{ tooltip: classes.offsetTooltip }}
                >
                    <span
                        className={`${classes.quantity} ${classNames(
                            classes.rectangle, type === 'bid' ? classes.bid : classes.ask,
                        )}`}
                        style={{ minWidth: `${quantityBoxSize}%`, maxWidth: `${quantityBoxSize}%` }}
                    />
                </Tooltip>
            )
        );
    }
}

export default withStyles(Styles)(Order);
