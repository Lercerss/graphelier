import React, {Component} from 'react';
import {withStyles} from '@material-ui/core/styles';
import classNames from 'classnames';

import {Styles} from '../styles/Order';
import {Typography, Box, Tooltip} from '@material-ui/core';

class Order extends Component {

    render() {
        const {classes, type, quantity, maxQuantitySum} = this.props;
        const quantityBoxSize = (quantity / maxQuantitySum) * 100;

        return (
            <Box className={classNames(classes.rectangle, type === 'bid' ? classes.bid : classes.ask)} style={{minWidth:`${quantityBoxSize}%`, maxWidth: `${quantityBoxSize}%`}}>
                {quantityBoxSize > 1.5 ?
                    (
                        <Typography className={classes.text}>{quantity}</Typography>
                    ) : (
                        <Tooltip title={quantity} placement='cursor'><span style={{width: '100%', height: '100%'}}/></Tooltip>
                    )
                }
            </Box>
        );
    }
}

export default withStyles(Styles)(Order);
