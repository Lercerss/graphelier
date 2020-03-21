import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';
import { createStyles, WithStyles } from '@material-ui/styles';
import classNames from 'classnames';

import Img from 'react-image';
import { Typography, Box } from '@material-ui/core';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import { Link } from 'react-router-dom';
import { Styles } from '../styles/NewsItem';

import {
    NewsItemInfo,
} from '../models/NewsTimeline';

const styles = createStyles(Styles);

interface Props extends WithStyles<typeof styles>{
    newsItemInfo: NewsItemInfo,
}

interface State {}

class NewsTimeline extends Component<Props, State> {
    render() {
        const { newsItemInfo, classes } = this.props;

        let instrumentClassName;
        switch (newsItemInfo.instrument) {
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
            <div
                className={classes.newsItemDiv}
            >
                <Link
                    to={`/orderbook?instrument=${newsItemInfo.instrument}&timestamp=1577897152000000000`}
                    // 11:45:52 01/01/2020 local, in utc nanoseconds
                    className={classes.graphLink}
                >
                    <div className={classes.stockTimeDiv}>
                        <Box
                            className={classNames(classes.stockBox, instrumentClassName)}
                            id={'stockBox'}
                        >
                            <Typography className={classes.stock}>
                                {newsItemInfo.instrument}
                            </Typography>
                        </Box>
                        <Typography
                            className={classes.time}
                            id={'time'}
                        >
                            {'11:32 AM'}
                        </Typography>
                    </div>
                </Link>
                <a
                    href={newsItemInfo.url}
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
                            {newsItemInfo.title}
                        </Typography>
                        <OpenInNewIcon
                            fontSize={'small'}
                            className={classes.linkIcon}
                        />
                    </div>
                    <Img
                        src={newsItemInfo.image}
                        className={classes.image}
                    />
                    <Typography
                        variant={'body2'}
                        color={'textSecondary'}
                        className={classes.body}
                    >
                        {newsItemInfo.body}
                    </Typography>
                </a>
            </div>
        );
    }
}

export default withStyles(styles)(NewsTimeline);
