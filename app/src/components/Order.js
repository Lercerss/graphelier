import React, {Component} from 'react';
import {withStyles} from '@material-ui/core/styles';
import classNames from 'classnames';

import {Styles} from '../styles/Order';

class Order extends Component {

    render() {
        const {classes, type, quantity} = this.props;
        const minimumBoxWidth = 20;
        const calculateQuantityBoxSize = minimumBoxWidth + (quantity/5);

        return (
            <span className={classNames(classes.rectangle, type === 'bid' ? classes.bid : classes.ask)} style={{ width:`${calculateQuantityBoxSize}px`}}>
                {quantity}
            </span>
        );
    }
}

export default withStyles(Styles)(Order);
