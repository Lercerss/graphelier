import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';
import { createStyles, WithStyles } from '@material-ui/styles';
import classNames from 'classnames';

import Img from 'react-image';
import {
    Typography,
    Box,
} from '@material-ui/core';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import { Link } from 'react-router-dom';
import bigInt from 'big-integer';
import { Styles } from '../styles/NewsItemDetails';
import {
    NewsItem,
} from '../models/NewsTimeline';
import { NANOSECONDS_IN_ONE_SECOND } from '../constants/Constants';
import {
    getHoursMinutesStringFromTimestamp,
    getDateStringFromTimestamp,
} from '../utils/date-utils';

const styles = createStyles(Styles);

interface Props extends WithStyles<typeof styles>{
    newsItem: NewsItem,
}

interface State {}

class NewsTimeline extends Component<Props, State> {
    render() {
        const { newsItem, classes } = this.props;

        const nanosecondTimestamp = bigInt(newsItem.timestamp).multiply(NANOSECONDS_IN_ONE_SECOND);
        const timePublishedString = getHoursMinutesStringFromTimestamp(nanosecondTimestamp);
        const datePublishedString = getDateStringFromTimestamp(nanosecondTimestamp);

        return (
            <div
                className={classes.newsItemDiv}
            >
                <div
                    className={classes.title}
                >
                    <Typography
                        variant={'h5'}
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
                            fontSize={'default'}
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
                        {`Published ${datePublishedString}, ${timePublishedString} | ${newsItem.source_name}`}
                    </Typography>
                </div>
                <div className={classes.imageAndSummaryDiv}>
                    <Typography
                        variant={'body2'}
                        color={'textSecondary'}
                        className={classes.summary}
                    >
                        <Img
                            src={newsItem.image_url}
                            className={classes.image}
                        />
                        {newsItem.summary}
                    </Typography>
                </div>
            </div>
        );
    }
}

export default withStyles(styles)(NewsTimeline);
