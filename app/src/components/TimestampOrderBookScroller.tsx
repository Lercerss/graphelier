import React, { Component, createRef } from 'react';
import { withStyles, WithStyles, createStyles } from '@material-ui/core/styles';

import {
    Button, Box, Typography, ButtonGroup,
} from '@material-ui/core';
import ChevronLeftSharpIcon from '@material-ui/icons/ChevronLeftSharp';
import ChevronRightSharpIcon from '@material-ui/icons/ChevronRightSharp';
import bigInt from 'big-integer';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import { Styles } from '../styles/TimestampOrderBookScroller';
import MultiDirectionalScroll from './MultiDirectionalScroll';
import PriceLevel from './PriceLevel';
import { getOrderBookListItemsAsArray, listItemsEquals } from '../utils/order-book-utils';

import { LEFT_ARROW_KEY_CODE, RIGHT_ARROW_KEY_CODE, ANIMATION_TIME } from '../constants/Constants';
import OrderBookService from '../services/OrderBookService';
import { ListItems } from '../models/OrderBook';

const MIN_PERCENTAGE_FACTOR_FOR_BOX_SPACE = 0.35;

const styles = createStyles(Styles);

interface Props extends WithStyles<typeof styles> {
    listItems: ListItems,
    maxQuantity: number
    timeOrDateIsNotSet: boolean,
    lastSodOffset: bigInt.BigInteger,
    handleUpdateWithDeltas: Function,
    instrument: string,
    loading: boolean,
}


class TimestampOrderBookScroller extends Component<Props> {
    middleReferenceItem;

    componentDidMount() {
        window.addEventListener('keyup', this.onKeyUp);
    }

    shouldComponentUpdate(nextProps, nextState, nextContext) {
        const { lastSodOffset, loading } = this.props;
        if (loading !== nextProps.loading) {
            return true;
        }
        if (lastSodOffset && nextProps.lastSodOffset) {
            return (lastSodOffset.neq(nextProps.lastSodOffset));
        }
        return true;
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        const { listItems } = this.props;

        if (!listItemsEquals(prevProps.listItems || {}, listItems || {})) {
            this.handleScrollToTopOfTheBook();
        }
    }

    componentWillUnmount() {
        window.removeEventListener('keyup', this.onKeyUp);
    }

    /**
     * @desc handles the key up action while moving messages
     * @param e
     */
    onKeyUp = e => {
        if (e.keyCode === LEFT_ARROW_KEY_CODE) this.handleGoToPreviousMessage();
        else if (e.keyCode === RIGHT_ARROW_KEY_CODE) this.handleGoToNextMessage();
    };

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

    /**
     * @desc Gets the next immediate message for the current timestamp, and updates the orderbook with
     * the message's timestamp
     */
    handleGoToNextMessage = () => {
        this.handleGoToMessageByOffset(1);
    };

    /**
     * @desc Gets the previous immediate message for the current timestamp, and updates the orderbook with
     * the message's timestamp
     */
    handleGoToPreviousMessage = () => {
        this.handleGoToMessageByOffset(-1);
    };

    /**
     * @desc Gets the message for the given offset and updates the order book with the message's timestamp
     * @param offset The number of messages to skip forward or backward to
     */
    handleGoToMessageByOffset = (offset: number) => {
        const {
            lastSodOffset, handleUpdateWithDeltas, instrument,
        } = this.props;
        OrderBookService.getPriceLevelsByMessageOffset(
            instrument,
            lastSodOffset.toString(),
            offset.toString(),
        )
            .then(response => {
                handleUpdateWithDeltas(response.data);
            })
            .catch(err => {
                console.log(err);
            });
    };

    render() {
        const {
            listItems, maxQuantity, classes, timeOrDateIsNotSet, loading,
        } = this.props;
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
                    <div className={classes.messagesDiv}>
                        <Typography
                            variant={'body1'}
                            color={timeOrDateIsNotSet ? 'textSecondary' : 'textPrimary'}
                            className={classes.messagesText}
                        >
                            Messages
                        </Typography>
                        <ButtonGroup
                            variant={'contained'}
                            color={'primary'}
                            size={'small'}
                            aria-label={'small outlined button group'}
                        >
                            <Button
                                id={'previousMessage'}
                                onClick={this.handleGoToPreviousMessage}
                                disabled={timeOrDateIsNotSet}
                            >
                                <ChevronLeftSharpIcon htmlColor={timeOrDateIsNotSet ? '#a6a6a6' : 'white'} />
                            </Button>
                            <Button
                                id={'nextMessage'}
                                onClick={this.handleGoToNextMessage}
                                disabled={timeOrDateIsNotSet}
                            >
                                <ChevronRightSharpIcon htmlColor={timeOrDateIsNotSet ? '#a6a6a6' : 'white'} />
                            </Button>
                        </ButtonGroup>
                    </div>
                </Box>
                <Box className={classes.scrollContainer}>
                    {
                        listItems
                    && (
                        <MultiDirectionalScroll position={50}>

                            <TransitionGroup
                                id={'orderbookListItems'}
                                className={loading ? classes.hide : classes.show}
                            >
                                {getOrderBookListItemsAsArray(listItems).map(listItem => {
                                    if (listItem.isMiddle) {
                                    // TODO: Investigate callback refs in TS
                                    // @ts-ignore
                                        this.middleReferenceItem = createRef();
                                    }
                                    return (
                                        <CSSTransition
                                            key={listItem.price}
                                            timeout={ANIMATION_TIME}
                                            classNames={{
                                                enter: classes.levelEnter,
                                                enterActive: classes.levelEnterActive,
                                                exit: classes.levelExit,
                                                exitActive: classes.levelExitActive,
                                            }}
                                        >
                                            <Box
                                                // @ts-ignore
                                                ref={listItem.isMiddle ? this.middleReferenceItem : null}
                                                className={classes.pricePoint}
                                            >
                                                <PriceLevel
                                                    type={listItem.type}
                                                    price={listItem.price}
                                                    orders={listItem.orders}
                                                    maxQuantity={quantityBoxSize}
                                                />
                                            </Box>
                                        </CSSTransition>
                                    );
                                })}
                            </TransitionGroup>
                        </MultiDirectionalScroll>
                    )
                    }
                </Box>
            </Box>
        );
    }
}

export default withStyles(styles)(TimestampOrderBookScroller);
