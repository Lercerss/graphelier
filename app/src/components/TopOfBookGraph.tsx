import React, { Component } from 'react';

import { format } from 'd3-format';
import { scaleLinear } from 'd3-scale';

import { LineSeries, StraightLine } from 'react-stockcharts/lib/series';
import { ChartCanvas, Chart } from 'react-stockcharts';
import { ClickCallback } from 'react-stockcharts/lib/interactive';
import { XAxis, YAxis } from 'react-stockcharts/lib/axes';
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
import NanoDate from 'nano-date';
import {
    adaptCurrentDateTimezoneToTrueNanoseconds, adaptTrueNanosecondsTimeToCurrentDateTimezone,
    buildTimeInTheDayStringFromNanoDate,
    getNanoDateFromNsSinceSod, getNsSinceSod,
} from '../utils/date-utils';
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
    sodNanoDate: NanoDate,
}

class TopOfBookGraph extends Component<Props> {
    private chartCanvasRef: any;

    /**
     * @function handleEvents
     * @description Asynchronous behaviour for user interaction (pan and zoom) with the graph
     */
    handleEvents = debounce((type, moreProps) => {
        const { sodNanoDate } = this.props;
        if (type === 'panend' || type === 'zoom') {
            const { handlePanAndZoom, startOfDay, endOfDay } = this.props;
            const graphDomain: Array<number> = moreProps.xScale.domain();
            const leftBoundNano: NanoDate = getNanoDateFromNsSinceSod(graphDomain[0], sodNanoDate);
            const rightBoundNano: NanoDate = getNanoDateFromNsSinceSod(graphDomain[1], sodNanoDate);
            const graphNanoDateDomain: Array<NanoDate> = [leftBoundNano, rightBoundNano];

            let graphStartTime: bigInt.BigInteger = adaptCurrentDateTimezoneToTrueNanoseconds(graphNanoDateDomain[0]);
            let graphEndTime: bigInt.BigInteger = adaptCurrentDateTimezoneToTrueNanoseconds(graphNanoDateDomain[1]);

            graphStartTime = graphStartTime.lesser(startOfDay) ? startOfDay : graphStartTime;
            graphEndTime = graphEndTime.greater(endOfDay) ? endOfDay : graphEndTime;

            handlePanAndZoom(graphStartTime, graphEndTime);
        }
    }, 100);

    componentDidMount() {
        this.chartCanvasRef.subscribe('chartCanvasEvents', { listener: this.handleEvents });
    }

    componentWillUnmount() {
        this.chartCanvasRef.unsubscribe('chartCanvasEvents');
    }

    render() {
        const {
            width, height, onTimeSelect, topOfBookItems, sodNanoDate, selectedDateTimeNano,
        } = this.props;

        const xAccessor = (tobItem: TopOfBookItem) => tobItem.nsSinceStartOfDay;
        const xScale = scaleLinear()
            .domain([topOfBookItems[0].nsSinceStartOfDay, topOfBookItems[topOfBookItems.length - 1].nsSinceStartOfDay])
            .range([0, topOfBookItems.length - 1]);
        const nanoDateForSelection: NanoDate = new NanoDate(
            adaptTrueNanosecondsTimeToCurrentDateTimezone(selectedDateTimeNano).toString(),
        );
        const nanoSinceSodForSelection: number = getNsSinceSod(nanoDateForSelection);

        return (
            <ChartCanvas
                ref={node => { this.chartCanvasRef = node; }}
                width={width}
                height={height}
                ratio={width / height}
                seriesName={'topOfBook'}
                pointsPerPxThreshold={10}
                data={topOfBookItems}
                type={'svg'}
                xAccessor={xAccessor}
                displayXAccessor={a => a.date}
                xScale={xScale}
                xExtents={[
                    topOfBookItems[0].nsSinceStartOfDay,
                    topOfBookItems[topOfBookItems.length - 1].nsSinceStartOfDay,
                ]}
            >
                <Chart
                    id={0}
                    yExtents={d => [d.best_bid, d.best_ask]}
                >
                    <XAxis
                        axisAt={'bottom'}
                        orient={'bottom'}
                        ticks={6}
                        tickFormat={(nsSinceStartOfDay: number) => {
                            const recreatedNanoDate: NanoDate = getNanoDateFromNsSinceSod(
                                nsSinceStartOfDay, sodNanoDate,
                            );

                            return buildTimeInTheDayStringFromNanoDate(recreatedNanoDate);
                        }}
                    />
                    <YAxis
                        axisAt={'left'}
                        orient={'left'}
                    />
                    <MouseCoordinateX
                        at={'bottom'}
                        orient={'bottom'}
                        displayFormat={(nanoDate: NanoDate) => {
                            return buildTimeInTheDayStringFromNanoDate(nanoDate);
                        }}
                        rectWidth={170}
                    />
                    <MouseCoordinateY
                        at={'right'}
                        orient={'right'}
                        displayFormat={format('.2f')}
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
                        xValue={nanoSinceSodForSelection}
                    />
                </Chart>
                <CrossHairCursor />
            </ChartCanvas>
        );
    }
}

export default TopOfBookGraph;
