import React, { Component } from 'react';
import {
    Button,
    Typography,
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

import { Styles } from '../styles/NewsTimeline';

import {
    NewsItemInfo,
} from '../models/NewsTimeline';
import CustomLoader from './CustomLoader';
import NewsItem from './NewsItem';
import { convertNanosecondsToUTC, dateStringToEpoch } from '../utils/date-utils';

const styles = createStyles(Styles);

interface Props extends WithStyles<typeof styles> {}

interface State {
    newsItems: Array<NewsItemInfo>,
    loadingTimeline: boolean,
    datePickerValue: moment.Moment | null,
    datePickerIsOpen: boolean,
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
                    published_date: '2/1/2020',
                },
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
                    published_date: '3/1/2020',
                },
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
                    published_date: '4/1/2020',
                },
            ],
            loadingTimeline: false,
            datePickerValue: null,
            datePickerIsOpen: false,
        };
    }

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
            newsItems,
            loadingTimeline,
            datePickerValue,
            datePickerIsOpen,
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
            <MuiPickersUtilsProvider utils={MomentUtils}>
                <Typography
                    component={'div'}
                >
                    {loadingTimeline
                        ? (
                            <div className={classes.loaderDiv}>
                                <CustomLoader type={'circular'} />
                            </div>
                        )
                        : (
                            <div>
                                <div className={classes.headerDiv}>
                                    <Button
                                        onClick={() => this.setState({ datePickerIsOpen: true })}
                                        variant={'contained'}
                                        color={'secondary'}
                                        endIcon={<CalendarTodayOutlinedIcon />}
                                    >
                                        {'Pick a date'}
                                    </Button>
                                    <div className={classes.datePickerDiv}>
                                        <DatePicker
                                            variant={'dialog'}
                                            open={datePickerIsOpen}
                                            onOpen={() => this.setState({ datePickerIsOpen: true })}
                                            onClose={() => this.setState({ datePickerIsOpen: false })}
                                            views={['year', 'month', 'date']}
                                            openTo={'year'}
                                            format={'DD/MM/YYYY'}
                                            value={datePickerValue}
                                            onChange={date => this.handleChangeDate(date)}
                                            invalidDateMessage={''}
                                            disableFuture
                                        />
                                    </div>
                                </div>
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
                            </div>
                        )}
                </Typography>
            </MuiPickersUtilsProvider>
        );
    }
}

export default withStyles(styles)(NewsTimeline);
