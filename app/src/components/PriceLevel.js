import React, {Component} from 'react';
import {withStyles} from '@material-ui/core/styles';
import classNames from 'classnames';

import {Styles} from '../styles/PriceLevel';

import Order from './Order';
import {Box} from '@material-ui/core';
import {connect} from 'react-redux';
import {ordersEquals} from '../utils/order-book-utils';

const MIN_PERCENTAGE_FACTOR_FOR_BOX_SPACE = 0.25;

class PriceLevel extends Component {

    constructor(props) {
        super(props);

        this.state = {
            maxQuantity: 0,
            orders: [],
        };
    }

    componentDidMount() {
        const {orderBook} = this.props;

        if (orderBook) this.setNewOrders(orderBook);

    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        const {price, orderBook} = this.props;
        if (orderBook) {
            if (!prevProps.orderBook) {
                this.setNewOrders(orderBook);
            } else {
                const currentOrders = this.state.orders;
                const newOrders = orderBook.listItems[price].orders;

                if (!ordersEquals(currentOrders, newOrders)) {
                    this.setNewOrders(orderBook);
                }
            }
        }
    }

    /**
     * @desc Given a new order book detected in data store, re-renders the whole component
     * @param orderBook
     */
    setNewOrders = (orderBook) => {
        const {price} = this.props;

        this.setState({
            orders: orderBook.listItems[price].orders,
            maxQuantity: orderBook.maxQuantity + orderBook.maxQuantity * (MIN_PERCENTAGE_FACTOR_FOR_BOX_SPACE),
        });
    };

    render() {
        const { classes, type, price } = this.props;
        const { maxQuantity, orders } = this.state;
        const formattedPrice = price.toFixed(2);

        return (
            <Box className={classNames(classes.row, classes.bidsAndAsks)}>
                <span className={classes.price}>{formattedPrice}</span>

                {orders.length !== 0 &&
                    <Box className={classes.quantitiesBox}>
                        {orders.map(order =>
                            <Order
                                type={type}
                                quantity={order.quantity}
                                maxQuantity={maxQuantity}
                            />)}
                    </Box>
                }
            </Box>
        );
    }
}

const mapStateToProps = (state) => {
    return {
        orderBook: state.orderBook
    };
};

export default connect(mapStateToProps)(withStyles(Styles)(PriceLevel));
