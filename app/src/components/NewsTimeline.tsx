import React, { Component } from 'react';
import {
    Button, Card, Typography,
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
    getDateStringFromTimestamp,
} from '../utils/date-utils';
import MultiDirectionalScroll from './MultiDirectionalScroll';
import { NANOSECONDS_IN_ONE_SECOND } from '../constants/Constants';
import { LightThemeColors } from '../styles/App';
import NewsService from '../services/NewsService';

const styles = theme => createStyles(Styles(theme));

interface Props extends WithStyles<typeof styles> {}

interface State {
    newsClusters: Array<NewsCluster>,
    loadingTimeline: boolean,
    datePickerValue: moment.Moment | null,
    datePickerIsOpen: boolean,
}

class NewsTimeline extends Component<Props, State> {
    constructor(props) {
        super(props);

        this.state = {
            newsClusters: [],
            loadingTimeline: false,
            datePickerValue: null,
            datePickerIsOpen: false,
        };
    }

    /**
    * @desc Paging handler for upwards and downwards hitting of the timeline
    * @param direction
    */
    handleHitEdge = (direction: string) => {
        const { newsClusters } = this.state;
        const requestDirection = direction === 'top' ? '1' : '-1';
        const timestamp = direction === 'top'
            ? newsClusters[0].timestamp : newsClusters[newsClusters.length - 1].timestamp;
        NewsService.getNewsClusters(timestamp, requestDirection)
            .then(response => {
                console.debug(response);
                // const { clusters } = response.data;
                // if (direction === 'top') {
                //     this.setState(
                //         {
                //             newsClusters: clusters.push(...newsClusters),
                //         },
                //     );
                // } else {
                //     this.setState(
                //         {
                //             newsClusters: newsClusters.push(...clusters),
                //         },
                //     );
                // }
            })
            .catch(err => {
                console.log(err);
            });
    };

    /**
     * @desc Handles the date change for the TextField date picker
     * @param date The selected date
     */
    handleChangeDate = (date: any) => {
        if (!moment(date).isValid()) return;

        this.setState(
            {
                loadingTimeline: true,
            },
            () => {
                const timestamp = date.startOf('day').unix();
                NewsService.getNewsClusters(timestamp, '1')
                    .then(response => {
                        const { clusters } = response.data;
                        this.setState(
                            {
                                newsClusters: clusters,
                            },
                        );
                    })
                    .catch(err => {
                        console.log(err);
                    })
                    .finally(() => {
                        this.setState(
                            {
                                loadingTimeline: false,
                                datePickerValue: date,
                            },
                        );
                    });
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

        const showPlaceholder = datePickerValue === null || loadingTimeline || newsClusters.length === 0;

        const PlaceholderElement = () => {
            if (loadingTimeline) {
                return (
                    <div className={classes.loaderDiv}>
                        <CustomLoader type={'circular'} />
                    </div>
                );
            }
            const messageText = datePickerValue === null
                ? 'Select a date' : 'No data to show, please select a different date';
            return (
                <Typography
                    variant={'body1'}
                    color={'textPrimary'}
                    className={classes.placeholderMessage}
                >
                    {messageText}
                </Typography>
            );
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
        console.debug(newsClusters);
        return (
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
                        {'Date Select'}
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
                { showPlaceholder ? <PlaceholderElement /> : (
                    <MultiDirectionalScroll
                        onReachBottom={() => { this.handleHitEdge('-1'); }}
                        onReachTop={() => { this.handleHitEdge('1'); }}
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
                )}
            </div>
        );
    }
}

export default withStyles(styles)(NewsTimeline);
