import React, { Component } from 'react';
import {
    Button, Card,
} from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import { createStyles, WithStyles } from '@material-ui/styles';
import MomentUtils from '@date-io/moment';

import {
    Timeline,
    Events,
    TextEvent,
    themes,
    createTheme,
} from '@merc/react-timeline';
import { DatePicker, MuiPickersUtilsProvider } from '@material-ui/pickers';
import CalendarTodayOutlinedIcon from '@material-ui/icons/CalendarTodayOutlined';

import moment from 'moment';

import bigInt from 'big-integer';
import { Styles } from '../styles/NewsTimeline';

import {
    NewsCluster,
} from '../models/NewsTimeline';
import CustomLoader from './CustomLoader';
import NewsArticle from './NewsItem';
import {
    convertNanosecondsToUTC,
    dateStringToEpoch, getDateStringFromTimestamp,
} from '../utils/date-utils';
import MultiDirectionalScroll from './MultiDirectionalScroll';
import { NANOSECONDS_IN_ONE_SECOND } from '../constants/Constants';
import { LightThemeColors } from '../styles/App';

const styles = createStyles(Styles);

interface Props extends WithStyles<typeof styles> {}

interface State {
    newsClusters: Array<NewsCluster>,
    loadingTimeline: boolean,
    datePickerValue: moment.Moment | null,
    datePickerIsOpen: boolean,
}

class NewsTimeline extends Component<Props, State> {
    private readonly timelineDivRef: React.RefObject<HTMLElement>;

    constructor(props) {
        super(props);

        this.timelineDivRef = React.createRef<HTMLElement>();

        this.state = {
            newsClusters: [
                {
                    size: 3,
                    timestamp: '1578333979',
                    articles: [
                        {
                            sentiment: '1',
                            source_name: 'LA Times',
                            title: 'Coronavirus Strikes Back',
                            summary: 'Lots of stock issues',
                            article_url: 'https://www.latimes.com/politics/story/2020-03-09/economic-'
                                + 'impact-coronavirus-oil-'
                    + 'prices-stock-markets',
                            image_url: 'https://ca-times.brightspotcdn.com/dims4/default/44028c2/'
                                + '2147483647/strip/true/crop/'
                    + '2000x1293+0+0/resize/840x543!/quality/90/?url=https%3A%2F%2Fcalifornia-times-brightspot.s3.'
                    + 'amazonaws.com%2Fd6%2Fbc%2F7cdd7eec921ac9be79f835a9e6cc%2Fla-me-lawmakers-grill-oil-regulators-'
                    + '20150310-001',
                            tickers: ['SPY', 'AAPL'],
                            timestamp: '1578333979',
                        },
                        {
                            sentiment: '1',
                            source_name: 'LA Times',
                            title: 'Coronavirus Strikes Back',
                            summary: 'Lots of stock issues',
                            article_url: 'https://www.latimes.com/politics/story/2020-03-09/economic-'
                                + 'impact-coronavirus-oil-'
                                + 'prices-stock-markets',
                            image_url: 'https://ca-times.brightspotcdn.com/dims4/default/44028c2/'
                                + '2147483647/strip/true/crop/2000x1293+0+0/resize/840x543!/qualit'
                                + 'y/90/?url=https%3A%2F%2Fcalifornia-times-brightspot.s3.'
                                + 'amazonaws.com%2Fd6%2Fbc%2F7cdd7eec921ac9be79f835a9e6cc%2'
                                + 'Fla-me-lawmakers-grill-oil-regulators-'
                                + '20150310-001',
                            tickers: ['SPY'],
                            timestamp: '1578333979',
                        },
                        {
                            sentiment: '1',
                            source_name: 'LA Times',
                            title: 'Coronavirus Strikes Back',
                            summary: 'Lots of stock issues',
                            article_url: 'https://www.latimes.com/politics/story/2020-03-09/economic-'
                                + 'impact-coronavirus-oil-'
                                + 'prices-stock-markets',
                            image_url: 'https://ca-times.brightspotcdn.com/dims4/default/44028c2/'
                                + '2147483647/strip/true/crop/2000x1293+0+0/resize/840x543!/qualit'
                                + 'y/90/?url=https%3A%2F%2Fcalifornia-times-brightspot.s3.'
                                + 'amazonaws.com%2Fd6%2Fbc%2F7cdd7eec921ac9be79f835a9e6cc%2'
                                + 'Fla-me-lawmakers-grill-oil-regulators-'
                                + '20150310-001',
                            tickers: ['SPY'],
                            timestamp: '1578333979',
                        },
                        {
                            sentiment: '1',
                            source_name: 'LA Times',
                            title: 'Coronavirus Strikes Back',
                            // eslint-disable-next-line max-len
                            summary: '(Reuters) - Apple Inc on Saturday said it would shut all of its official stores and corporate offices in mainland China until Feb 9. as fears over the coronavirus outbreak mounted and the death toll more than doubled to over 250 from a week ago. "Out of an abundance of caution and based on the latest advice from leading health experts, we\'re closing all our corporate offices, stores, and contact centers in mainland China through February 9," Apple said in a statement. The company said looked forward to re-opening stores "as soon as possible". Earlier this week, Apple closed three stores in China due to concerns about the spread of the virus. It\'s joining a handful of overseas retailers, including Starbucks Corp and McDonald\'s Corp to temporarily shut storefronts as a precautionary measure. Many other companies, meanwhile, have called for employees in China to work from home and cease non-essential business travel in the first week of February. Normally, businesses in China would be preparing to return to normal operations following the end of the week-long Lunar New Year Holiday. Apple remains heavily reliant on China both for smartphone sales as well as for its supply chain and manufacturing. Many factories in Hubei province, including plants run by AB InBev and General Motors Co, have temporarily suspended production due to the virus. In a recent earnings call, Apple CEO Tim Cook said the company was working out mitigation plans to deal with possible production loss from its suppliers in Wuhan. The city where the virus outbreak originated is home to several Apple suppliers.',
                            article_url: 'https://www.latimes.com/politics/story/2020-03-09/economic-'
                                + 'impact-coronavirus-oil-'
                                + 'prices-stock-markets',
                            image_url: 'https://ca-times.brightspotcdn.com/dims4/default/44028c2/'
                                + '2147483647/strip/true/crop/2000x1293+0+0/resize/840x543!/qualit'
                                + 'y/90/?url=https%3A%2F%2Fcalifornia-times-brightspot.s3.'
                                + 'amazonaws.com%2Fd6%2Fbc%2F7cdd7eec921ac9be79f835a9e6cc%2'
                                + 'Fla-me-lawmakers-grill-oil-regulators-'
                                + '20150310-001',
                            tickers: ['SPY'],
                            timestamp: '1578333979',
                        },
                    ],
                },
                {
                    size: 3,
                    timestamp: '1578333979',
                    articles: [
                        {
                            sentiment: '1',
                            source_name: 'LA Times',
                            title: 'Coronavirus Strikes Back',
                            summary: 'Lots of stock issues',
                            article_url: 'https://www.latimes.com/politics/story/2020-03-09/economic-'
                                + 'impact-coronavirus-oil-'
                                + 'prices-stock-markets',
                            image_url: 'https://ca-times.brightspotcdn.com/dims4/default/44028c2/'
                                + '2147483647/strip/true/crop/'
                                + '2000x1293+0+0/resize/840x543!/quality/90/?url=https%3A%2F%2Fcalifornia-times-'
                                + 'brightspot.s3.'
                                + 'amazonaws.com%2Fd6%2Fbc%2F7cdd7eec921ac9be79f835a9e6cc%2Fla-me-lawmakers-'
                                + 'grill-oil-regulators-'
                                + '20150310-001',
                            tickers: ['SPY', 'AAPL'],
                            timestamp: '1578333979',
                        },
                    ],
                },
                {
                    size: 3,
                    timestamp: '1578333979',
                    articles: [
                        {
                            sentiment: '1',
                            source_name: 'LA Times',
                            title: 'Coronavirus Strikes Back',
                            summary: 'Lots of stock issues',
                            article_url: 'https://www.latimes.com/politics/story/2020-03-09/economic-'
                                + 'impact-coronavirus-oil-'
                                + 'prices-stock-markets',
                            image_url: 'https://ca-times.brightspotcdn.com/dims4/default/44028c2/'
                                + '2147483647/strip/true/crop/'
                                + '2000x1293+0+0/resize/840x543!/quality/90/?url=https%3A%2F%2Fcalifornia-times-'
                                + 'brightspot.s3.'
                                + 'amazonaws.com%2Fd6%2Fbc%2F7cdd7eec921ac9be79f835a9e6cc%2Fla-me-lawmakers-'
                                + 'grill-oil-regulators-'
                                + '20150310-001',
                            tickers: ['SPY', 'AAPL'],
                            timestamp: '1578333979',
                        },
                    ],
                },
                {
                    size: 3,
                    timestamp: '1578333979',
                    articles: [
                        {
                            sentiment: '1',
                            source_name: 'LA Times',
                            title: 'Coronavirus Strikes Back',
                            summary: 'Lots of stock issues',
                            article_url: 'https://www.latimes.com/politics/story/2020-03-09/economic-'
                                + 'impact-coronavirus-oil-'
                                + 'prices-stock-markets',
                            image_url: 'https://ca-times.brightspotcdn.com/dims4/default/44028c2/'
                                + '2147483647/strip/true/crop/'
                                + '2000x1293+0+0/resize/840x543!/quality/90/?url=https%3A%2F%2Fcalifornia-times-'
                                + 'brightspot.s3.'
                                + 'amazonaws.com%2Fd6%2Fbc%2F7cdd7eec921ac9be79f835a9e6cc%2Fla-me-lawmakers-'
                                + 'grill-oil-regulators-'
                                + '20150310-001',
                            tickers: ['SPY', 'AAPL'],
                            timestamp: '1578333979',
                        },
                    ],
                },
            ],
            loadingTimeline: false,
            datePickerValue: null,
            datePickerIsOpen: false,
        };
    }

    /**
     * @desc handler for the native callback for a scroll in the main div
     */
    handleScroll = () => {
        // const {
        //     firstChild, lastChild, scrollTop, offsetTop, offsetHeight,
        // } = this.timelineDivRef;
        //
        // console.debug(firstChild, lastChild, scrollTop, offsetTop, offsetHeight);
        //
        // if (firstChild) {
        //     const topEdge = firstChild.offsetTop;
        //     const bottomEdge = topEdge + lastChild.offsetHeight;
        //     const scrolledUp = scrollTop + offsetTop;
        //     const scrolledDown = scrolledUp + offsetHeight;
        //
        //     if (scrolledDown >= (bottomEdge - 5)) {
        //         this.handleHitEdge('bottom');
        //     } else if (scrolledUp <= topEdge + 5) {
        //         this.handleHitEdge('top');
        //     }
        // }
    };

    /**
    * @desc Paging handler for upwards and downwards hitting of the timeline
    * @param direction
    */
    handleHitEdge = (direction: string) => {
        console.debug(direction);
    };

    handleOnScroll = (position, previousPosition) => {
        const diffScroll = position - previousPosition;
        const direction = diffScroll > 0 ? 'down' : 'up';

        console.debug(`Scroll ${direction} to ${position}`);
    };

    /**
     * @desc Handles the date change for the TextField date picker
     * @param date The selected date
     */
    handleChangeDate = (date: any) => {
        if (!moment(date).isValid()) return;

        // this.setState(
        //     {
        //         loadingTimeline: true,
        //     },
        // );

        const selectedDateString = date.format('YYYY-MM-DD');
        // eslint-disable-next-line no-unused-vars
        const selectedDateNano = convertNanosecondsToUTC(dateStringToEpoch(`${selectedDateString} 00:00:00`));

        // TODO fetch timeline items

        this.setState(
            {
                datePickerValue: date,
                // loadingTimeline: false,
            },
        );
    };

    render() {
        const { classes } = this.props;
        const {
            newsClusters,
            loadingTimeline,
            datePickerValue,
            datePickerIsOpen,
        } = this.state;

        let lastNewsClusterDateString = '';

        const opts = {
            layout: 'inline-evts',
        };

        const HiddenElement = () => <span />;

        const customTheme = createTheme(themes.default, {
            card: {
                width: 'fit-content',
                height: 'fit-content',
            },
            date: {
                backgroundColor: LightThemeColors.palette.primary.main,
            },
            marker: {
                borderColor: LightThemeColors.palette.primary.main,
            },
            timelineTrack: {
                backgroundColor: LightThemeColors.palette.primary.main,
            },
        });

        const MyCustomCard = ({ children }) => (
            <Card
                className={classes.timelineEvent}
                variant={'outlined'}
            >
                {children}
            </Card>
        );

        // @ts-ignore
        return (
            loadingTimeline
                ? (
                    <div className={classes.loaderDiv}>
                        <CustomLoader type={'circular'} />
                    </div>
                )
                : (
                    <div
                        className={classes.contentDiv}
                    >
                        <div className={classes.headerDiv}>
                            <Button
                                onClick={() => this.setState({ datePickerIsOpen: true })}
                                variant={'contained'}
                                color={'primary'}
                                endIcon={<CalendarTodayOutlinedIcon />}
                                className={classes.dateButton}
                            >
                                {'Pick a date'}
                            </Button>
                            <div className={classes.datePickerDiv}>
                                <MuiPickersUtilsProvider utils={MomentUtils}>
                                    <DatePicker
                                        variant={'dialog'}
                                        open={datePickerIsOpen}
                                        onOpen={() => this.setState({ datePickerIsOpen: true })}
                                        onClose={() => this.setState({ datePickerIsOpen: false })}
                                        views={['month', 'date']}
                                        openTo={'month'}
                                        format={'DD/MM/YYYY'}
                                        value={datePickerValue}
                                        onChange={date => this.handleChangeDate(date)}
                                        invalidDateMessage={''}
                                        minDate={moment('2020-01-01')}
                                        maxDate={moment('2020-02-29')}
                                    />
                                </MuiPickersUtilsProvider>
                            </div>
                        </div>
                        <MultiDirectionalScroll
                            // @ts-ignore
                            ref={this.timelineDivRef}
                            onReachBottom={() => { console.debug('bot'); }}
                            onReachTop={() => { console.debug('top'); }}
                        >
                            <Timeline
                                opts={opts}
                                theme={customTheme}
                            >
                                <Events>
                                    {newsClusters.map(newsCluster => {
                                        const nanosecondTimestamp = bigInt(newsCluster.timestamp)
                                            .multiply(NANOSECONDS_IN_ONE_SECOND);
                                        const dateString = getDateStringFromTimestamp(nanosecondTimestamp);
                                        const hideDateAndMarker = lastNewsClusterDateString === dateString;
                                        lastNewsClusterDateString = dateString;
                                        return (
                                            <TextEvent
                                                date={hideDateAndMarker ? HiddenElement : dateString}
                                                text={''}
                                                card={MyCustomCard}
                                                marker={hideDateAndMarker && HiddenElement}
                                            >
                                                <div className={classes.newsCluster}>
                                                    {newsCluster.articles.map((newsItem, i) => {
                                                        return (
                                                            <NewsArticle
                                                                newsItem={newsItem}
                                                                isFirstItem={i === 0}
                                                            />
                                                        );
                                                    })}
                                                </div>
                                            </TextEvent>
                                        );
                                    })}
                                </Events>
                            </Timeline>
                        </MultiDirectionalScroll>
                    </div>
                )
        );
    }
}

export default withStyles(styles)(NewsTimeline);
