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
import { debounce } from 'lodash';
import { Styles } from '../styles/NewsTimeline';

import {
    ArticleCluster,
} from '../models/NewsTimeline';
import CustomLoader from './CustomLoader';
import ArticleItem from './ArticleItem';
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
    articleClusters: Array<ArticleCluster>,
    loadingTimeline: boolean,
    datePickerValue: moment.Moment | null,
    datePickerIsOpen: boolean,
    newestTimestamp: string | null,
    oldestTimestamp: string | null,
}

class NewsTimeline extends Component<Props, State> {
    /**
     * @desc Paging handler for upwards hitting of the timeline's top edge
     */
    handleHitTop = debounce(() => {
        const { articleClusters, oldestTimestamp } = this.state;
        if (oldestTimestamp !== null) {
            NewsService.getArticleClusters(oldestTimestamp, '-1')
                .then(response => {
                    // eslint-disable-next-line camelcase
                    const { clusters, next_timestamp } = response.data;
                    this.setState(
                        {
                            articleClusters: clusters.concat(articleClusters),
                            oldestTimestamp: next_timestamp,
                        },
                    );
                })
                .catch(err => {
                    console.log(err);
                });
        }
    }, 200);

    /**
     * @desc Paging handler for downwards hitting of the timeline's bottom edge
     */
    handleHitBottom = debounce(() => {
        const { articleClusters, newestTimestamp } = this.state;
        if (newestTimestamp !== null) {
            NewsService.getArticleClusters(newestTimestamp, '1')
                .then(response => {
                    // eslint-disable-next-line camelcase
                    const { clusters, next_timestamp } = response.data;
                    this.setState(
                        {
                            articleClusters: articleClusters.concat(clusters),
                            newestTimestamp: next_timestamp,
                        },
                    );
                })
                .catch(err => {
                    console.log(err);
                });
        }
    }, 200);

    constructor(props) {
        super(props);

        this.state = {
            articleClusters: [],
            loadingTimeline: false,
            datePickerValue: null,
            datePickerIsOpen: false,
            newestTimestamp: null,
            oldestTimestamp: null,
        };
    }

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
                const requestTimestamp = date.startOf('day').unix();
                NewsService.getArticleClusters(requestTimestamp, '1')
                    .then(response => {
                        // eslint-disable-next-line camelcase
                        const { clusters, timestamp, next_timestamp } = response.data;
                        this.setState(
                            {
                                articleClusters: clusters,
                                oldestTimestamp: timestamp,
                                newestTimestamp: next_timestamp,
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
            articleClusters,
            loadingTimeline,
            datePickerValue,
            datePickerIsOpen,
        } = this.state;

        let lastArticleClusterDateString = '';

        const opts = {
            layout: 'inline-evts',
        };

        const showPlaceholder = datePickerValue === null || loadingTimeline || articleClusters.length === 0;

        const PlaceholderElement = () => {
            if (loadingTimeline) {
                return (
                    <div className={classes.loaderDiv}>
                        <CustomLoader type={'circular'} />
                    </div>
                );
            }
            const messageText = datePickerValue === null
                ? 'Select a date to browse stock news'
                : 'No data to show, please select a different date';
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
                        onReachTop={() => { this.handleHitTop(); }}
                        onReachBottom={() => { this.handleHitBottom(); }}
                        position={30}
                    >
                        <Timeline
                            opts={opts}
                            theme={customTheme}
                        >
                            <Events>
                                {articleClusters.map(articleCluster => {
                                    const nanosecondTimestamp = bigInt(articleCluster.timestamp)
                                        .multiply(NANOSECONDS_IN_ONE_SECOND);
                                    const dateString = getDateStringFromTimestamp(nanosecondTimestamp);
                                    const hideDateAndMarker = lastArticleClusterDateString === dateString;
                                    lastArticleClusterDateString = dateString;
                                    return (
                                        <TextEvent
                                            date={hideDateAndMarker ? HiddenElement : dateString}
                                            text={''}
                                            card={MyCustomCard}
                                            marker={hideDateAndMarker && HiddenElement}
                                        >
                                            <div className={classes.articleCluster}>
                                                {articleCluster.articles.map((article, i) => {
                                                    return (
                                                        <ArticleItem
                                                            article={article}
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
