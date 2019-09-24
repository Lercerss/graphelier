import React, {Component} from 'react';
import {withStyles} from '@material-ui/core/styles';
import classNames from 'classnames';

import {Styles} from '../styles/PriceLevel';

import Order from './Order';

class PriceLevel extends Component {

    render() {
        const {classes, key, type, price, orderQuantities} = this.props;

        return (
            <div className={classNames(classes.row, type === 'bid' ? classes.bid : classes.ask)}>
                <span className={classes.price}>{price}</span>
                {orderQuantities.map(orderQuantity => <Order type={type} quantity={orderQuantity}/>)}
            </div>
        );
    }
}

export default withStyles(Styles)(PriceLevel);
