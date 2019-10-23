import React, {Component} from 'react';
import {withStyles} from '@material-ui/core/styles';
import classNames from 'classnames';

import {Styles} from '../styles/Order';

class Order extends Component {

    render() {
        const {classes, type, quantity, maxQuantitySum} = this.props;
        const quantityBoxSize = (quantity / maxQuantitySum) * 100;
        return (
            <span className={classNames(classes.rectangle, type === 'bid' ? classes.bid : classes.ask)} style={{width:`${quantityBoxSize}%`}}>
                {quantity}
            </span>
        );
    }
}

export default withStyles(Styles)(Order);
