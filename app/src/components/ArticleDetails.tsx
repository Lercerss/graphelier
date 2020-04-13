import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';
import { createStyles, WithStyles } from '@material-ui/styles';

import Img from 'react-image';
import {
    Typography,
    Box,
} from '@material-ui/core';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import { Link } from 'react-router-dom';
import bigInt from 'big-integer';
import { mdiEmoticonHappyOutline, mdiEmoticonNeutralOutline, mdiEmoticonSadOutline } from '@mdi/js';
import Icon from '@mdi/react';
import stc from 'string-to-color';
import classNames from 'classnames';
import { Styles } from '../styles/ArticleDetails';
import {
    Article,
} from '../models/NewsTimeline';
import { NANOSECONDS_IN_ONE_SECOND } from '../constants/Constants';
import {
    getHoursMinutesStringFromTimestamp,
    getDateStringFromTimestamp,
} from '../utils/date-utils';
import { Colors } from '../styles/App';

const styles = createStyles(Styles);

interface Props extends WithStyles<typeof styles>{
    article: Article,
    orderbookInstruments: Array<string>,
    articleInstruments: Array<string>,
}

interface State {}

class ArticleDetails extends Component<Props, State> {
    render() {
        const {
            article, classes, orderbookInstruments, articleInstruments,
        } = this.props;

        const nanosecondTimestamp = bigInt(article.timestamp).multiply(NANOSECONDS_IN_ONE_SECOND);
        const timePublishedString = getHoursMinutesStringFromTimestamp(nanosecondTimestamp);
        const datePublishedString = getDateStringFromTimestamp(nanosecondTimestamp);


        const sentimentOptions = {
            Positive: {
                path: mdiEmoticonHappyOutline,
                color: Colors.positiveGreen,
            },
            Neutral: {
                path: mdiEmoticonNeutralOutline,
                color: Colors.neutralGrey,
            },
            Negative: {
                path: mdiEmoticonSadOutline,
                color: Colors.negativeRed,
            },
        };

        return (
            <div
                className={classes.articleDiv}
            >
                <div
                    className={classes.title}
                >
                    <Typography
                        variant={'h5'}
                        color={'textPrimary'}
                        align={'left'}
                    >
                        {article.title}
                    </Typography>
                    <a
                        href={article.article_url}
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
                    {articleInstruments.map(instrument => {
                        const style = {
                            backgroundColor: orderbookInstruments.includes(instrument) ? stc(instrument) : Colors.grey,
                        };
                        if (orderbookInstruments.includes(instrument)) {
                            return (
                                <Link
                                    to={`/orderbook?instrument=${instrument}&timestamp=${nanosecondTimestamp}`}
                                    className={classes.graphLink}
                                >
                                    <Box
                                        className={classNames(classes.stockBox, classes.fadeOnHover)}
                                        id={'stockBox'}
                                        style={style}
                                    >
                                        <Typography className={classes.stock}>
                                            {instrument}
                                        </Typography>
                                    </Box>
                                </Link>
                            );
                        }
                        return (
                            <Box
                                className={classes.stockBox}
                                id={'stockBox'}
                                style={style}
                            >
                                <Typography className={classes.stock}>
                                    {instrument}
                                </Typography>
                            </Box>
                        );
                    })}
                    <Icon
                        path={sentimentOptions[article.sentiment].path}
                        color={sentimentOptions[article.sentiment].color}
                        className={classes.sentimentIcon}
                        size={1}
                    />
                    <Typography
                        className={classes.time}
                        id={'time'}
                    >
                        {`Published ${datePublishedString}, ${timePublishedString} | ${article.source_name}`}
                    </Typography>
                </div>
                <div className={classes.imageAndSummaryDiv}>
                    <Typography
                        variant={'body2'}
                        color={'textSecondary'}
                        className={classes.summary}
                        align={'justify'}
                    >
                        <Img
                            src={article.image_url}
                            className={classes.image}
                        />
                        {article.summary}
                    </Typography>
                </div>
            </div>
        );
    }
}

export default withStyles(styles)(ArticleDetails);
