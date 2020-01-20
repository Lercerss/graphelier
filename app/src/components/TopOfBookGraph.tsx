import React, { Component } from 'react';
import { withStyles, WithStyles, createStyles } from '@material-ui/core/styles';

import { format } from 'd3-format';
import dateFormat from 'dateformat';

import { LineSeries } from 'react-stockcharts/lib/series';
import { ChartCanvas, Chart } from 'react-stockcharts';
import { ClickCallback } from 'react-stockcharts/lib/interactive';
import { XAxis, YAxis } from 'react-stockcharts/lib/axes';
import { discontinuousTimeScaleProvider } from 'react-stockcharts/lib/scale';
import {
    SingleValueTooltip,
} from 'react-stockcharts/lib/tooltip';
import {
    CrossHairCursor,
    MouseCoordinateX,
    MouseCoordinateY,
} from 'react-stockcharts/lib/coordinates';

import bigInt from 'big-integer';
import { getLocalTimeString, nanosecondsToString } from '../utils/date-utils';
import { Styles } from '../styles/TopOfBookGraph';
import { Colors } from '../styles/App';

const numberFormat = format('.2f');

const styles = createStyles(Styles);


interface Props extends WithStyles<typeof styles> {
    className: string
    height: number
    width: number
    onTimeSelect: (any) => void
}

class TopOfBookGraph extends Component<Props> {
    formatTime = value => {
        const label = nanosecondsToString(parseInt(value));
        const arr = label.split(':');
        return `${arr[0]}:${arr[1]}`;
    };

    tooltipContent = () => {
        return ({ currentItem, xAccessor }) => {
            return {
                x: dateFormat(xAccessor(currentItem)),
                y: [
                    {
                        label: 'best bid',
                        value: currentItem.best_bid && numberFormat(currentItem.best_bid),
                    },
                    {
                        label: 'best ask',
                        value: currentItem.best_ask && numberFormat(currentItem.best_ask),
                    },
                ],
            };
        };
    };

    render() {
        const {
            width, height, classes, onTimeSelect,
        } = this.props;

        const initialData = [
            {
                date: '1340285400000000000',
                best_ask: 130.2,
                best_bid: 129.1,
            },
            {
                date: '1340289300000000000',
                best_ask: 131.5,
                best_bid: 130.5,
            },
            {
                date: '1340293200000000000',
                best_ask: 132.5,
                best_bid: 130.9,
            },
            {
                date: '1340297100000000000',
                best_ask: 133.2,
                best_bid: 132.7,
            },
            {
                date: '1340301000000000000',
                best_ask: 134.0,
                best_bid: 132.9,
            },
            {
                date: '1340304900000000000',
                best_ask: 131.3,
                best_bid: 131.0,
            },
            {
                date: '1340308800000000000',
                best_ask: 130.3,
                best_bid: 130.1,
            },
        ];

        initialData.forEach(element => {
            // @ts-ignore
            // eslint-disable-next-line no-param-reassign
            element.key = new Date(Number(bigInt(element.date).divide(1000000)));
        });

        const xScaleProvider = discontinuousTimeScaleProvider
            .inputDateAccessor(d => d.key);
        const {
            data,
            xScale,
        } = xScaleProvider(initialData);

        return (
            <ChartCanvas
                width={width}
                height={height}
                seriesName={'topOfBook'}
                pointsPerPxThreshold={1}
                data={data}
                type={'svg'}
                displayXAccessor={d => d.date}
                xAccessor={d => d.key}
                xScale={xScale}
                panEvent={false}
                zoomEvent={false}
                xExtents={[data[0].key, data[data.length - 1].key]}
                className={classes.graph}
            >
                <Chart
                    id={0}
                    yExtents={d => [d.best_bid, d.best_ask]}
                >
                    <XAxis
                        axisAt={'bottom'}
                        orient={'bottom'}
                        ticks={6}
                    />
                    <YAxis
                        axisAt={'left'}
                        orient={'left'}
                    />
                    <LineSeries
                        yAccessor={d => d.best_bid}
                        stroke={Colors.green}
                        strokeWidth={1}
                    />
                    <LineSeries
                        yAccessor={d => d.best_ask}
                        stroke={Colors.red}
                        strokeWidth={1}
                    />
                    <MouseCoordinateX
                        at={'bottom'}
                        orient={'bottom'}
                        displayFormat={getLocalTimeString}
                        rectWidth={130}
                    />
                    <MouseCoordinateY
                        at={'right'}
                        orient={'bottom'}
                        displayFormat={format('.2f')}
                    />
                    <SingleValueTooltip
                        yLabel={'Time'}
                        yAccessor={d => d.date}
                        yDisplayFormat={getLocalTimeString}
                        origin={[10, -10]}
                    />
                    <SingleValueTooltip
                        yLabel={'Ask'}
                        yAccessor={d => d.best_ask}
                        yDisplayFormat={format('.2f')}
                        labelStroke={Colors.red}
                        origin={[10, 10]}
                    />
                    <SingleValueTooltip
                        yLabel={'Bid'}
                        yAccessor={d => d.best_bid}
                        yDisplayFormat={format('.2f')}
                        labelStroke={Colors.green}
                        origin={[85, 10]}
                    />
                    <ClickCallback
                        onClick={(moreProps, e) => { onTimeSelect(moreProps.currentItem.date); }}
                    />
                </Chart>
                <CrossHairCursor />
            </ChartCanvas>
        );
    }
}

export default withStyles(Styles)(TopOfBookGraph);
