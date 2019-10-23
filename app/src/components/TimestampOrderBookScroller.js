import React, {Component, createRef} from 'react';
import {Styles} from '../styles/TimestampOrderBookScroller';
import {withStyles} from '@material-ui/core/styles';

import {Button, Box} from '@material-ui/core';
import MultiDirectionalScroll from './MultiDirectionalScroll';
import PriceLevel from './PriceLevel';

const MIN_PERCENTAGE_FACTOR_FOR_BOX_SPACE = 0.35;

class TimestampOrderBookScroller extends Component {

    middleReferenceItem = null;

    constructor(props) {
        super(props);

        this.state = {
            asks: [],
            bids: [],
            listItems: []
        };
    }

    shouldComponentUpdate(nextProps, nextState, nextContext) {
        const {orderBook} = this.props;
        const {asks, bids} = this.state;

        return asks.length === 0|| bids.length === 0 ||
            (orderBook ? orderBook.asks !== nextProps.orderBook.asks || orderBook.bids !== nextProps.orderBook.bids : true);
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        const {orderBook} = this.props;

        if (!prevProps.orderBook || (prevProps.orderBook.asks !== orderBook.asks || prevProps.orderBook.bids !== orderBook.bids)) {
            this.processOrderBook(orderBook.asks, orderBook.bids);
        }
    }

    /**
     * @desc creates data structure for orderbook with asks on top and bids on bottom
     * @param asks
     * @param bids
     */
    processOrderBook = (asks, bids) => {
        let listItems = [];
        let firstBid = 0;
        let maxQuantitySum = 0;

        for (let i=asks.length-1; i>=0; i--) {
            listItems.push({
                ...asks[i],
                type: 'ask',
                isMiddle: false,
            });
            let sum = 0;
            asks[i].orders.map(order =>{
                sum += order.quantity;
                if (sum > maxQuantitySum){
                    maxQuantitySum = sum;
                }
            });
        }

        bids.map(bid => {
            listItems.push({
                ...bid,
                type: 'bid',
                isMiddle: firstBid++ === 0,
            });
            let sum = 0;
            bid.orders.map(order =>{
                sum += order.quantity;
                if (sum > maxQuantitySum){
                    maxQuantitySum = sum;
                }
            });
        });

        this.setState({listItems, asks, bids, maxQuantitySum}, () => {
            this.handleScrollToTopOfTheBook();
        });
    };

    /**
     * @desc handler for the event of hitting the bottom or top of the scroll list
     * @param direction
     */
    handleHitEdge = (direction) => {
        //TODO: implement the necessary async calls for paging
    };

    /**
     * @desc handler for the event of scrolling to the top of the book entity
     */
    handleScrollToTopOfTheBook = () => {
        this.middleReferenceItem && this.middleReferenceItem.current && this.middleReferenceItem.current.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
        });
    };

    render() {
        const {listItems, maxQuantitySum} = this.state;
        const quantityBoxSize = maxQuantitySum + maxQuantitySum*(MIN_PERCENTAGE_FACTOR_FOR_BOX_SPACE);
        const {classes} = this.props;

        return (
            <Box className={classes.container}>
                <Box className={classes.header}>
                    <Button
                        variant={'contained'}
                        className={classes.topOfTheBookButton}
                        onClick={this.handleScrollToTopOfTheBook}
                    >
                        Top of the book
                    </Button>
                </Box>

                <Box className={classes.scrollContainer}>
                    <MultiDirectionalScroll
                        onReachBottom={() => this.handleHitEdge('bottom')}
                        onReachTop={() => this.handleHitEdge('top')}
                        position={50}
                    >
                        {listItems.map(listItem => {
                            if (listItem.isMiddle) {this.middleReferenceItem = createRef();}
                            return (
                                <Box
                                    ref={listItem.isMiddle ? this.middleReferenceItem : null}
                                    className={classes.pricePoint}
                                >
                                    <PriceLevel
                                        type={listItem.type}
                                        price={listItem.price}
                                        orders={listItem.orders}
                                        maxQuantitySum={quantityBoxSize}
                                    />
                                </Box>
                            );
                        })}
                    </MultiDirectionalScroll>
                </Box>
            </Box>
        );
    }
}

export default withStyles(Styles)(TimestampOrderBookScroller);
