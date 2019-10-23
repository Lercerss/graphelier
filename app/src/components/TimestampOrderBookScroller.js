import React, {Component, createRef} from 'react';
import {Styles} from '../styles/TimestampOrderBookScroller';
import {withStyles} from '@material-ui/core/styles';

import {Button, Box} from '@material-ui/core';
import MultiDirectionalScroll from './MultiDirectionalScroll';
import PriceLevel from './PriceLevel';

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

    componentDidUpdate(prevProps, prevState, snapshot) {
        const {orderBook} = this.props;

        if (prevProps.orderBook !== orderBook) {
            this.setState({
                asks: orderBook.asks,
                bids: orderBook.bids,
            }, () => {
                this.processOrderBook();
            });
        }

    }

    /**
     * @desc creates data structure for orderbook with asks on top and bids on bottom
     */
    processOrderBook = () => {
        const {asks, bids} = this.state;

        let listItems = [];
        let firstBid = 0;
        let maxQuantitySum = 0;

        for (let i=asks.length-1; i>=0; i--) {
            listItems.push({
                ...asks[i],
                type: 'ask',
                isMiddle: false,
            });
        }

        bids.map(bid => {
            listItems.push({
                ...bid,
                type: 'bid',
                isMiddle: firstBid++ === 0,
            });
        });

        if (listItems.length === asks.length + bids.length){
            for (let i=0; i < listItems.length; i++){
                let sum = 0;
                for (let j=0; j <listItems[i].orders.length; j++) {
                    sum += listItems[i].orders[j].quantity;
                }
                if (sum > maxQuantitySum){
                    maxQuantitySum = sum;
                }
            }
        }

        this.setState({listItems, maxQuantitySum}, () => {
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
                                        maxQuantitySum={maxQuantitySum}
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
