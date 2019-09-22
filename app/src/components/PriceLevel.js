import React, {Component} from 'react';
import {connect} from 'react-redux';
import {withStyles} from '@material-ui/core/styles';

import {Styles} from '../styles/PriceLevel';
import {saveReactAppName} from '../actions/actions';
import Order from './Order';
import classNames from 'classnames';

class PriceLevel extends Component {

    constructor(props) {
        super(props);

        this.state = {};
    }

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

const mapStateToProps = (state) => {
    return {};
};

const mapDispatchToProps = (dispatch) => {
    return {
        onAppMounted: (name) => dispatch(saveReactAppName(name)),
    };
};

export default withStyles(Styles)(connect(mapStateToProps, mapDispatchToProps)(PriceLevel));
