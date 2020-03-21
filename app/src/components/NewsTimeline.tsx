import React, { Component } from 'react';
import {
    Typography,
} from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import { createStyles, WithStyles } from '@material-ui/styles';

import {
    Timeline,
    Events,
    TextEvent,
    themes,
    createTheme,
} from '@merc/react-timeline';
import { Styles } from '../styles/NewsTimeline';

import {
    NewsItemInfo,
} from '../models/NewsTimeline';
import CustomLoader from './CustomLoader';
import NewsItem from './NewsItem';

const styles = createStyles(Styles);

interface Props extends WithStyles<typeof styles> {}

interface State {
    newsItems: Array<NewsItemInfo>,
}

class NewsTimeline extends Component<Props, State> {
    constructor(props) {
        super(props);

        this.state = {
            newsItems: [
                {
                    title: 'Coronavirus Strikes Back',
                    body: 'Lots of stock issues',
                    url: 'https://www.latimes.com/politics/story/2020-03-09/economic-impact-coronavirus-oil-'
                    + 'prices-stock-markets',
                    image: 'https://ca-times.brightspotcdn.com/dims4/default/44028c2/2147483647/strip/true/crop/'
                    + '2000x1293+0+0/resize/840x543!/quality/90/?url=https%3A%2F%2Fcalifornia-times-brightspot.s3.'
                    + 'amazonaws.com%2Fd6%2Fbc%2F7cdd7eec921ac9be79f835a9e6cc%2Fla-me-lawmakers-grill-oil-regulators-'
                    + '20150310-001',
                    instrument: 'SPY',
                    published_date: '1/1/2020',
                },
            ],
        };
    }

    render() {
        const { classes } = this.props;
        const {
            newsItems,
        } = this.state;

        const opts = {
            layout: 'inline-evts',
        };

        const customTheme = createTheme(themes.default, {
            card: {
                width: 'fit-content',
                height: 'fit-content',
            },
        });

        return (
            <Typography
                component={'div'}
            >
                {newsItems.length === 0
                    ? (
                        <div className={classes.container}>
                            <CustomLoader type={'circular'} />
                        </div>
                    )
                    : (
                        <div>
                            <Timeline
                                opts={opts}
                                theme={customTheme}
                            >
                                <Events>
                                    {newsItems.map(newsItem => (
                                        <TextEvent
                                            date={newsItem.published_date}
                                            text={''}
                                        >
                                            <NewsItem
                                                newsItemInfo={newsItem}
                                            />
                                        </TextEvent>
                                    ))}
                                </Events>
                            </Timeline>
                            <div className={classes.fade} />
                        </div>
                    )}
            </Typography>
        );
    }
}

export default withStyles(styles)(NewsTimeline);
