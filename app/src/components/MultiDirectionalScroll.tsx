import React, { Component } from 'react';

import { withStyles, createStyles, WithStyles } from '@material-ui/core/styles';
import { Box } from '@material-ui/core';
import { Styles } from '../styles/MultiDirectionalScroll';

const styles = createStyles(Styles);

interface Props extends WithStyles<typeof styles>{
    position: number,
    onScroll: Function,
    onReachTop: Function,
    onReachBottom: Function,
    children: any
}

class MultiDirectionalScroll extends Component<Props> {
    scroller;

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
    setScrollPosition(position: number = 0) {
        this.scroller.scrollTop = position;
        this.lastPosition = position;
    }

    /**
     * @desc assigns the reference of the scroll to an instance
     * @param reference
     */
    handleScrollerRef = (reference: HTMLElement) => {
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

        if (children && firstChild && lastChild) {
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
        const { children, classes } = this.props;

        return (
            <Box
                // TODO: investigate callback refs with TS
                // @ts-ignore
                ref={this.handleScrollerRef}
                className={classes.scroller}
                onScroll={this.handleScroll}
            >
                {children}
            </Box>
        );
    }
}

export default withStyles(styles)(MultiDirectionalScroll);
