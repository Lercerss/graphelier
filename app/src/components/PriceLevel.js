import React, {Component} from 'react';
import {withStyles} from '@material-ui/core/styles';
import classNames from 'classnames';

import {Styles} from '../styles/PriceLevel';

import Order from './Order';
import {Box} from '@material-ui/core';

class PriceLevel extends Component {

    render() {
        const {classes, type, price, orders, maxQuantitySum} = this.props;
        return (
            <Box className={classNames(classes.row, type === 'bid' ? classes.bid : classes.ask)}>
                <span className={classes.price}>{price}</span>
                <Box className={classes.quantitiesBox}>
                    {orders.map(order =>
                        <Order
                            type={type}
                            quantity={order.quantity}
                            maxQuantitySum={maxQuantitySum}
                        />)}
                </Box>
            </Box>
        );
    }
}

export default withStyles(Styles)(PriceLevel);
