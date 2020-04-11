import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';
import { createStyles, WithStyles } from '@material-ui/styles';
import classNames from 'classnames';

import Img from 'react-image';
import {
    Typography,
    Box,
    ButtonBase,
    Modal,
    Backdrop,
    Fade,
    CircularProgress,
} from '@material-ui/core';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import { Link } from 'react-router-dom';
import bigInt from 'big-integer';
import { Styles } from '../styles/NewsItem';

import {
    NewsItem,
} from '../models/NewsTimeline';
import { NANOSECONDS_IN_ONE_SECOND } from '../constants/Constants';
import { getHoursMinutesStringFromTimestamp } from '../utils/date-utils';
import NewsItemDetails from './NewsItemDetails';

const styles = createStyles(Styles);

interface Props extends WithStyles<typeof styles>{
    newsItem: NewsItem,
    isFirstItem: boolean,
}

interface State {
    modalIsOpen: boolean,
}

class NewsTimeline extends Component<Props, State> {
    constructor(props) {
        super(props);

        this.state = {
            modalIsOpen: false,
        };
    }

    /**
     * @desc Handles closing the modal
     */
    handleCloseModal = () => {
        this.setState({
            modalIsOpen: false,
        });
    };

    render() {
        const { newsItem, classes, isFirstItem } = this.props;
        const { modalIsOpen } = this.state;

        const nanosecondTimestamp = bigInt(newsItem.timestamp).multiply(NANOSECONDS_IN_ONE_SECOND);
        const timePublishedString = getHoursMinutesStringFromTimestamp(nanosecondTimestamp);

        return (
            <div
                className={classNames(classes.newsItemDiv, !isFirstItem && classes.marginLeft)}
            >
                <ButtonBase
                    onClick={() => { this.setState({ modalIsOpen: true }); }}
                    className={classes.buttonBase}
                >
                    <div>
                        <div
                            className={classes.title}
                        >
                            <Typography
                                variant={'subtitle1'}
                                color={'textPrimary'}
                                noWrap
                            >
                                {newsItem.title}
                            </Typography>
                            <a
                                href={newsItem.article_url}
                                target={'_blank'}
                                className={classes.articleLink}
                            >
                                <OpenInNewIcon
                                    fontSize={'small'}
                                    className={classes.linkIcon}
                                    color={'primary'}
                                />
                            </a>
                        </div>
                        <div className={classes.stockTimeDiv}>
                            {newsItem.tickers.map(instrument => {
                                let instrumentClassName;
                                switch (instrument) {
                                case 'AAPL':
                                    instrumentClassName = classes.aapl;
                                    break;
                                case 'SPY':
                                    instrumentClassName = classes.spy;
                                    break;
                                case 'MSFT':
                                    instrumentClassName = classes.msft;
                                    break;
                                default:
                                    instrumentClassName = classes.other;
                                }

                                return (
                                    <Link
                                        to={`/orderbook?instrument=${instrument}&timestamp=${nanosecondTimestamp}`}
                                        className={classes.graphLink}
                                    >
                                        <Box
                                            className={classNames(classes.stockBox, instrumentClassName)}
                                            id={'stockBox'}
                                        >
                                            <Typography className={classes.stock}>
                                                {instrument}
                                            </Typography>
                                        </Box>
                                    </Link>
                                );
                            })}
                            <Typography
                                className={classes.time}
                                id={'time'}
                            >
                                {`${timePublishedString} | ${newsItem.source_name}`}
                            </Typography>
                        </div>
                        <Img
                            src={newsItem.image_url}
                            className={classes.image}
                            loader={<CircularProgress />}
                        />
                    </div>
                </ButtonBase>
                <Modal
                    open={modalIsOpen}
                    onClose={this.handleCloseModal}
                    aria-labelledby={'simple-modal-title'}
                    aria-describedby={'simple-modal-description'}
                    BackdropComponent={Backdrop}
                    className={classes.modal}
                >
                    <Fade in={modalIsOpen}>

                        <div className={classes.paper}>
                            <NewsItemDetails newsItem={newsItem} />
                        </div>
                    </Fade>
                </Modal>
            </div>
        );
    }
}

export default withStyles(styles)(NewsTimeline);
