import React, {Component} from 'react';
import {connect} from 'react-redux';
import {withStyles} from '@material-ui/core/styles';
import classNames from 'classnames';

import {Styles} from '../styles/Order';
import {saveReactAppName} from '../actions/actions';

class Order extends Component {

    constructor(props) {
        super(props);

        this.state = {};
    }

    render() {
        const {classes, type, quantity} = this.props;

        return (
            <span className={classNames(classes.rectangle, type === 'bid' ? classes.bid : classes.ask)}>
                {quantity}
            </span>
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

export default withStyles(Styles)(connect(mapStateToProps, mapDispatchToProps)(Order));
