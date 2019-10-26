import React, {Component, createRef} from 'react';
import {Styles} from '../styles/TimestampOrderBookScroller';
import {withStyles} from '@material-ui/core/styles';

import {Button, Box} from '@material-ui/core';
import MultiDirectionalScroll from './MultiDirectionalScroll';
import PriceLevel from './PriceLevel';
import {connect} from 'react-redux';
import {getOrderBookListItemsAsArray, listItemsEquals} from '../utils/order-book-utils';

class TimestampOrderBookScroller extends Component {

    middleReferenceItem = null;

    constructor(props) {
        super(props);

        this.state = {
            listItems: {},
        };
    }

    shouldComponentUpdate(nextProps, nextState, nextContext) {
        const {orderBook} = this.props;
        const {listItems, maxQuantity} = this.state;

        const currentListItems = orderBook ? orderBook.listItems : {};
        const newListItems = nextProps.orderBook ? nextProps.orderBook.listItems : {};


        if (!listItemsEquals(currentListItems, newListItems)) {
            return true;
        } else {
            const shouldReRender = (!listItemsEquals(listItems, nextState.listItems) || maxQuantity !== nextState.maxQuantity);
            console.log('TimestampOrderBookScroller::shouldComponentUpdate - New listItems differ: ', shouldReRender);
            return shouldReRender;
        }
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        const {orderBook} = this.props;

        const currentListItems = prevProps.orderBook ? prevProps.orderBook.listItems : {};
        const newListItems = orderBook ? orderBook.listItems : {};

        if (!listItemsEquals(currentListItems, newListItems)) {

            console.log('TimestampOrderBookScroller::componentDidUpdate - current listItems: ', currentListItems);
            console.log('TimestampOrderBookScroller::componentDidUpdate - new listItems: ', newListItems);

            this.setState({
                listItems : newListItems,
                maxQuantity: orderBook.maxQuantity
            }, () => {
                this.handleScrollToTopOfTheBook();
            });
        }
    }

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
        const {listItems} = this.state;
        const {classes, orderBook} = this.props;

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
                    {orderBook &&
                        <MultiDirectionalScroll
                            position={50}
                        >
                            {getOrderBookListItemsAsArray(listItems).map(listItem => {
                                if (listItem.isMiddle) {this.middleReferenceItem = createRef();}
                                return (
                                    <Box
                                        ref={listItem.isMiddle ? this.middleReferenceItem : null}
                                        className={classes.pricePoint}
                                    >
                                        <PriceLevel
                                            type={listItem.type}
                                            price={listItem.price}
                                        />
                                    </Box>
                                );
                            })}
                        </MultiDirectionalScroll>
                    }
                </Box>
            </Box>
        );
    }
}

const mapStateToProps = (state) => {
    return {
        orderBook: state.orderBook
    };
};

export default connect(mapStateToProps)(withStyles(Styles)(TimestampOrderBookScroller));