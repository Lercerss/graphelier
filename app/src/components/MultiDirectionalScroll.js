import React, { Component } from 'react';

import { withStyles } from '@material-ui/core/styles';
import { Box } from '@material-ui/core';
import { Styles } from '../styles/MultiDirectionalScroll';

class MultiDirectionalScroll extends Component {
    scroller = null;

    lastPosition = 0;

    static defaultProps = {
        onReachBottom: f => f,
        onReachTop: f => f,
        onScroll: f => f,
        position: 0,
    };

    componentDidMount() {
        const { position } = this.props;

        if (position) { this.setScrollPosition(position); }
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        const { position } = this.props;

        if (position !== prevProps.position) {
            this.setScrollPosition(position);
        }
    }

    /**
     * @desc sets position for scroller instance, as well as the previous scroller position
     * @param position
     */
    setScrollPosition(position = 0) {
        this.scroller.scrollTop = position;
        this.lastPosition = position;
    }

    /**
     * @desc assigns the reference of the scroll to an instance
     * @param reference
     */
    handleScrollerRef = reference => {
        this.scroller = reference;
    };

    /**
     * @desc keeps track of vertical position for the scroll
     */
    handleVerticalScroll = () => {
        const {
            firstChild, lastChild, scrollTop, offsetTop, offsetHeight,
        } = this.scroller;
        const { onReachTop, onReachBottom, children } = this.props;

        if (children) {
            const topEdge = firstChild.offsetTop;
            const bottomEdge = lastChild.offsetTop + lastChild.offsetHeight;
            const scrolledUp = scrollTop + offsetTop;
            const scrolledDown = scrolledUp + offsetHeight;

            if (scrolledDown >= bottomEdge) {
                onReachBottom();
            } else if (scrolledUp <= topEdge) {
                onReachTop();
            }
        }
    };

    /**
     * @desc handler for the native callback for a scroll in the main div
     */
    handleScroll = () => {
        const { onScroll } = this.props;
        let scrolledTo = 0;

        this.handleVerticalScroll();
        scrolledTo = this.scroller && this.scroller.scrollTop;

        onScroll(scrolledTo, this.lastPosition);
        this.lastPosition = scrolledTo;
    };

    render() {
        const { children } = this.props;

        return (
            <Box
                ref={this.handleScrollerRef}
                style={Styles.scroller}
                onScroll={this.handleScroll}
            >
                {children}
            </Box>
        );
    }
}

export default withStyles(Styles)(MultiDirectionalScroll);
