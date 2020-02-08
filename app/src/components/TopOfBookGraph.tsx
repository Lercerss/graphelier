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
import { getDateObjectForGraphScale, getLocalTimeString } from '../utils/date-utils';
import { Colors } from '../styles/App';
import { TopOfBookItem } from '../models/OrderBook';
import {
    NANOSECONDS_IN_ONE_MILLISECOND,
} from '../constants/Constants';

interface State {
    graphStartTime: bigInt.BigInteger,
    graphEndTime: bigInt.BigInteger,
}

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

class TopOfBookGraph extends Component<Props, State> {
    private chartCanvasRef: any;

    handleEvents = debounce((type, moreProps) => {
        if (type === 'panend' || type === 'zoom') {
            const { handlePanAndZoom, startOfDay, endOfDay } = this.props;

            const graphDomain = moreProps.xScale.domain();
            let graphStartTime = bigInt(graphDomain[0].getTime() * NANOSECONDS_IN_ONE_MILLISECOND);
            let graphEndTime = bigInt(graphDomain[1].getTime() * NANOSECONDS_IN_ONE_MILLISECOND);

            graphStartTime = graphStartTime.lesser(startOfDay) ? startOfDay : graphStartTime;
            graphEndTime = graphEndTime.greater(endOfDay) ? endOfDay : graphEndTime;

            this.setState(
                {
                    graphStartTime,
                    graphEndTime,
                }, () => {
                    handlePanAndZoom(graphStartTime, graphEndTime);
                },
            );
        }
    }, 200);

    constructor(props) {
        super(props);

        const { startOfDay, endOfDay } = props;

        this.state = {
            graphStartTime: startOfDay,
            graphEndTime: endOfDay,

        };
    }

    componentDidMount() {
        this.chartCanvasRef.subscribe('chartCanvasEvents', { listener: this.handleEvents });
    }

    componentWillUnmount() {
        this.chartCanvasRef.unsubscribe('chartCanvasEvents');
    }

    render() {
        const { graphStartTime, graphEndTime } = this.state;
        console.log(graphEndTime, graphStartTime);
        const {
            width, height, onTimeSelect, selectedDateTimeNano, topOfBookItems, startOfDay, endOfDay,
        } = this.props;

        let clampValue = '';
        if (startOfDay.equals(graphStartTime)) {
            clampValue = 'left';
            if (endOfDay.equals(graphEndTime)) {
                clampValue = 'both';
            }
        } else if (endOfDay.equals(graphEndTime)) {
            clampValue = 'right';
        }

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
                clamp={clampValue === '' ? false : clampValue}
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
