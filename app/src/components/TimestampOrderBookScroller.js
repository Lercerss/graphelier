import React, { Component, createRef } from 'react';
import { withStyles } from '@material-ui/core/styles';

import { Button, Box } from '@material-ui/core';
import { Styles } from '../styles/TimestampOrderBookScroller';
import MultiDirectionalScroll from './MultiDirectionalScroll';
import PriceLevel from './PriceLevel';
import { getOrderBookListItemsAsArray, listItemsEquals } from '../utils/order-book-utils';

const MIN_PERCENTAGE_FACTOR_FOR_BOX_SPACE = 0.35;

class TimestampOrderBookScroller extends Component {
    middleReferenceItem = null;

    shouldComponentUpdate(nextProps, nextState, nextContext) {
        const { listItems, maxQuantity } = this.props;

        if (!listItems || !nextProps.listItems) return true;
        return (!listItemsEquals(listItems, nextProps.listItems)
            || maxQuantity !== nextProps.maxQuantity);
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        const { listItems } = this.props;

        if (!listItemsEquals(prevProps.listItems || {}, listItems || {})) {
            this.handleScrollToTopOfTheBook();
        }
    }

    /**
     * @desc handler for the event of scrolling to the top of the book entity
     */
    handleScrollToTopOfTheBook = () => {
        this.middleReferenceItem
        && this.middleReferenceItem.current
        && this.middleReferenceItem.current.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
        });
    };

    render() {
        const { listItems, maxQuantity, classes } = this.props;
        const quantityBoxSize = maxQuantity + maxQuantity * (MIN_PERCENTAGE_FACTOR_FOR_BOX_SPACE);

        return (
            <Box className={classes.container}>
                <Box className={classes.header}>
                    <Button
                        variant={'contained'}
                        className={classes.topOfTheBookButton}
                        color={'primary'}
                        onClick={this.handleScrollToTopOfTheBook}
                    >
                        Top of the book
                    </Button>
                </Box>

                <Box className={classes.scrollContainer}>
                    {listItems
                        && (
                            <MultiDirectionalScroll position={50}>
                                {getOrderBookListItemsAsArray(listItems).map(listItem => {
                                    if (listItem.isMiddle) {
                                        this.middleReferenceItem = createRef();
                                    }
                                    return (
                                        <Box
                                            key={listItem.price}
                                            ref={listItem.isMiddle ? this.middleReferenceItem : null}
                                            className={classes.pricePoint}
                                        >
                                            <PriceLevel
                                                key={listItem.price}
                                                type={listItem.type}
                                                price={listItem.price}
                                                orders={listItem.orders}
                                                maxQuantity={quantityBoxSize}
                                            />
                                        </Box>
                                    );
                                })}
                            </MultiDirectionalScroll>
                        )}
                </Box>
            </Box>
        );
    }
}

export default withStyles(Styles)(TimestampOrderBookScroller);
