import React, { Component } from 'react';

import { format } from 'd3-format';
import { scaleTime } from 'd3-scale';

import { LineSeries, StraightLine } from 'react-stockcharts/lib/series';
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
import { debounce } from 'lodash';
import { getDateObjectForGraphScale, getLocalTimeString, getTimestampForBackend } from '../utils/date-utils';
import { Colors } from '../styles/App';
import { TopOfBookItem } from '../models/OrderBook';

interface Props {
    height: number,
    width: number,
    onTimeSelect: (any) => void,
    selectedDateTimeNano: bigInt.BigInteger,
    startOfDay: bigInt.BigInteger,
    endOfDay: bigInt.BigInteger,
    topOfBookItems: Array<TopOfBookItem>,
    handlePanAndZoom: (graphStartTime: bigInt.BigInteger, graphEndTime: bigInt.BigInteger) => void,
}

class TopOfBookGraph extends Component<Props> {
    private chartCanvasRef: any;

    handleEvents = debounce((type, moreProps) => {
        if (type === 'panend' || type === 'zoom') {
            const { handlePanAndZoom, startOfDay, endOfDay } = this.props;

            const graphDomain = moreProps.xScale.domain();
            let graphStartTime = getTimestampForBackend(graphDomain[0]);
            let graphEndTime = getTimestampForBackend(graphDomain[1]);

            graphStartTime = graphStartTime.lesser(startOfDay) ? startOfDay : graphStartTime;
            graphEndTime = graphEndTime.greater(endOfDay) ? endOfDay : graphEndTime;

            handlePanAndZoom(graphStartTime, graphEndTime);
        }
    }, 200);

    componentDidMount() {
        this.chartCanvasRef.subscribe('chartCanvasEvents', { listener: this.handleEvents });
    }

    componentWillUnmount() {
        this.chartCanvasRef.unsubscribe('chartCanvasEvents');
    }

    render() {
        const {
            width, height, onTimeSelect, selectedDateTimeNano, topOfBookItems,
        } = this.props;
        topOfBookItems.forEach(element => {
            // @ts-ignore
            // eslint-disable-next-line no-param-reassign
            element.date = getDateObjectForGraphScale(bigInt(element.timestamp));
        });

        const xScaleProvider = discontinuousTimeScaleProvider
            .inputDateAccessor(d => d.date);
        const {
            data,
        } = xScaleProvider(topOfBookItems);

        return (
            <ChartCanvas
                ref={node => { this.chartCanvasRef = node; }}
                width={width}
                height={height}
                ratio={width / height}
                seriesName={'topOfBook'}
                pointsPerPxThreshold={1}
                data={data}
                type={'svg'}
                displayXAccessor={d => d.timestamp}
                xAccessor={d => d.date}
                xScale={scaleTime()}
                xExtents={[data[0].date, data[data.length - 1].date]}
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
                        rectWidth={150}
                    />
                    <MouseCoordinateY
                        at={'right'}
                        orient={'bottom'}
                        displayFormat={format('.2f')}
                    />
                    <SingleValueTooltip
                        yLabel={'Ask'}
                        yAccessor={d => d.best_ask}
                        yDisplayFormat={format('.2f')}
                        labelStroke={Colors.red}
                        origin={[10, -10]}
                    />
                    <SingleValueTooltip
                        yLabel={'Bid'}
                        yAccessor={d => d.best_bid}
                        yDisplayFormat={format('.2f')}
                        labelStroke={Colors.green}
                        origin={[85, -10]}
                    />
                    <ClickCallback
                        onClick={(moreProps, e) => { onTimeSelect(moreProps.currentItem.timestamp); }}
                    />
                    <StraightLine
                        type={'vertical'}
                        stroke={Colors.lightBlue}
                        strokeWidth={2}
                        xValue={getDateObjectForGraphScale(selectedDateTimeNano)}
                    />
                </Chart>
                <CrossHairCursor />
            </ChartCanvas>
        );
    }
}

export default TopOfBookGraph;
