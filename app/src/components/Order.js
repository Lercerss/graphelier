import React, {Component} from 'react';
import {withStyles} from '@material-ui/core/styles';
import classNames from 'classnames';

import {Styles} from '../styles/Order';

class Order extends Component {

    render() {
        const {classes, type, quantity} = this.props;

        return (
            <span className={classNames(classes.rectangle, type === 'bid' ? classes.bid : classes.ask)}>
                {quantity}
            </span>
        );
    }
}

export default withStyles(Styles)(Order);
