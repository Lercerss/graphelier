import React, { Component } from 'react';
import {
    Typography,
} from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import { createStyles, WithStyles } from '@material-ui/styles';

import { Styles } from '../styles/NewsTimeline';

import {
    NewsItemInfo,
} from '../models/NewsTimeline';

const styles = theme => createStyles(Styles(theme));

interface Props extends WithStyles<typeof styles>{
    newsItemInfo: NewsItemInfo,
}

interface State {}

class NewsTimeline extends Component<Props, State> {
    render() {
        const { newsItemInfo } = this.props;
        return (
            <Typography
                component={'div'}
            >
                {newsItemInfo.title}
            </Typography>
        );
    }
}

export default withStyles(styles)(NewsTimeline);
