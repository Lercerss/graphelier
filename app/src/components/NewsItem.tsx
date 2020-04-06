import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';
import { createStyles, WithStyles } from '@material-ui/styles';
import classNames from 'classnames';

import Img from 'react-image';
import { Typography, Box } from '@material-ui/core';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import { Link } from 'react-router-dom';
import bigInt from 'big-integer';
import { Styles } from '../styles/NewsItem';

import {
    NewsItem,
} from '../models/NewsTimeline';
import { NANOSECONDS_IN_ONE_SECOND } from '../constants/Constants';
import { adaptTrueNanosecondsTimeToCurrentDateTimezone, getHoursMinutesStringFromTimestamp } from '../utils/date-utils';

const styles = createStyles(Styles);

interface Props extends WithStyles<typeof styles>{
    newsItem: NewsItem,
    isFirstItem: boolean,
}

interface State {}

class NewsTimeline extends Component<Props, State> {
    render() {
        const { newsItem, classes, isFirstItem } = this.props;

        const nanosecondTimestamp = bigInt(newsItem.timestamp).multiply(NANOSECONDS_IN_ONE_SECOND);
        const timePublishedString = getHoursMinutesStringFromTimestamp(nanosecondTimestamp);
        const nanosecondTimestampForGraph = adaptTrueNanosecondsTimeToCurrentDateTimezone(nanosecondTimestamp);

        return (
            <div
                className={classNames(classes.newsItemDiv, !isFirstItem && classes.marginLeft)}
            >
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
                                to={`/orderbook?instrument=${instrument}&timestamp=${nanosecondTimestampForGraph}`}
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
                        {timePublishedString}
                    </Typography>
                </div>
                <a
                    href={newsItem.article_url}
                    target={'_blank'}
                    className={classes.articleLink}
                >
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
                        <OpenInNewIcon
                            fontSize={'small'}
                            className={classes.linkIcon}
                        />
                    </div>
                    <Img
                        src={newsItem.image_url}
                        className={classes.image}
                    />
                </a>
                <Typography
                    variant={'body2'}
                    color={'textSecondary'}
                    className={classes.body}
                >
                    {newsItem.summary}
                </Typography>
            </div>
        );
    }
}

export default withStyles(styles)(NewsTimeline);
