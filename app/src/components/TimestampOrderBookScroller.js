import React, {Component, createRef} from 'react';
import {Styles} from '../styles/TimestampOrderBookScroller';
import {withStyles} from '@material-ui/core/styles';

import {Button, Box} from '@material-ui/core';
import MultiDirectionalScroll from './MultiDirectionalScroll';

class TimestampOrderBookScroller extends Component {

    middleReferenceItem = null;

    constructor(props) {
        super(props);

        this.state = {
            listItems: [{
                name: 'listItem1',
                isMiddle: false
            }, // ... }
            ]
        };
    }

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
        this.middleReferenceItem && this.middleReferenceItem.current.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
        });
    };

    render() {
        const {listItems} = this.state;
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
                                    <a>{listItem.name}</a>
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
