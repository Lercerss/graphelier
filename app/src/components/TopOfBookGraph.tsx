import React, { Component } from 'react';
import { withStyles, WithStyles, createStyles } from '@material-ui/core/styles';


import bigInt from 'big-integer';
import { nanosecondsToString } from '../utils/date-utils';
import { Styles } from '../styles/TopOfBookGraph';

const styles = createStyles(Styles);


interface Props extends WithStyles<typeof styles> {
    className: string
}

class TopOfBookGraph extends Component<Props> {
    formatTime = value => {
        const label = nanosecondsToString(parseInt(value));
        const arr = label.split(':');
        return `${arr[0]}:${arr[1]}`;
    };

    render() {
        const bids = [
            {
                key: bigInt(32400000000000).toString(),
                data: 130.2,
            },
            {
                key: bigInt(37800000000000).toString(),
                data: 131.5,
            },
            {
                key: bigInt(43200000000000).toString(),
                data: 132.5,
            },
            {
                key: bigInt(48600000000000).toString(),
                data: 133.2,
            },
            {
                key: bigInt(54000000000000).toString(),
                data: 134.0,
            },
            {
                key: bigInt(59400000000000).toString(),
                data: 131.3,
            },
        ];

        const asks = [
            {
                key: bigInt(32400000000000).toString(),
                data: 129.1,
            },
            {
                key: bigInt(37800000000000).toString(),
                data: 130.5,
            },
            {
                key: bigInt(43200000000000).toString(),
                data: 130.9,
            },
            {
                key: bigInt(48600000000000).toString(),
                data: 132.7,
            },
            {
                key: bigInt(54000000000000).toString(),
                data: 132.9,
            },
            {
                key: bigInt(59400000000000).toString(),
                data: 131.0,
            },
        ];

        // eslint-disable-next-line no-unused-vars
        const multi = [
            {
                key: 'bids',
                data: bids,
            },
            {
                key: 'asks',
                data: asks,
            },
        ];

        return (
            <div />
        );
    }
}

export default withStyles(Styles)(TopOfBookGraph);
