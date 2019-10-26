import React, {Component} from 'react';
import {withStyles} from '@material-ui/core/styles';
import classNames from 'classnames';

import {Styles} from '../styles/Order';
import {Typography, Box, Tooltip} from '@material-ui/core';

class Order extends Component {

    render() {
        const {classes, type, quantity, maxQuantitySum} = this.props;
        const quantityBoxSize = (quantity / maxQuantitySum) * 100;
        const minQuantityTextSize = 1.5;

        return (
            quantityBoxSize > minQuantityTextSize ?
                <Box className={classNames(classes.rectangle, type === 'bid' ? classes.bid : classes.ask)} style={{ minWidth: `${quantityBoxSize}%`, maxWidth: `${quantityBoxSize}%` }}>
                    <Typography className={classes.text}>{quantity}</Typography>
                </Box> :
                <Tooltip title={quantity} placement='cursor'><span className={`${classes.quantity} ${classNames(classes.rectangle, type === 'bid' ? classes.bid : classes.ask)}`} style={{ minWidth: `${quantityBoxSize}%`, maxWidth: `${quantityBoxSize}%` }}/>
                </Tooltip>
        );
    }
}

export default withStyles(Styles)(Order);
