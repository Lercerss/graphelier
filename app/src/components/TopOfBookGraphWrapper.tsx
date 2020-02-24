import React, { Component } from 'react';
import bigInt from 'big-integer';
import { WithStyles, createStyles, withStyles } from '@material-ui/core/styles';
import NanoDate from 'nano-date';
import TopOfBookGraph from './TopOfBookGraph';
import { TopOfBookItem, TopOfBookPackage } from '../models/OrderBook';
import { Styles } from '../styles/TopOfBookGraphWrapper';
import {
    adaptTrueNanosecondsTimeToCurrentDateTimezone,
    getNsSinceSod,
    getSodNanoDate,
} from '../utils/date-utils';

const styles = createStyles(Styles);

interface Props extends WithStyles<typeof styles> {
    className: string,
    onTimeSelect: (any) => void,
    selectedDateTimeNano: bigInt.BigInteger,
    startOfDay: bigInt.BigInteger,
    endOfDay: bigInt.BigInteger,
    topOfBookItems: Array<TopOfBookItem>,
    handlePanAndZoom: (graphStartTime: bigInt.BigInteger, graphEndTime: bigInt.BigInteger) => void,
}

interface State {
    graphWidth: number,
    graphHeight: number,
}


class TopOfBookGraphWrapper extends Component<Props, State> {
    private readonly graphContainerRef: React.RefObject<HTMLDivElement>;

    constructor(props) {
        super(props);

        this.state = {
            graphHeight: 0,
            graphWidth: 0,
        };

        this.graphContainerRef = React.createRef<HTMLDivElement>();
    }

    componentDidMount() {
        if (this.graphContainerRef.current) {
            this.setState({
                graphHeight: this.graphContainerRef.current.offsetHeight,
                graphWidth: this.graphContainerRef.current.offsetWidth,
            });
        }
        window.addEventListener('resize', this.updateDimensions);
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.updateDimensions);
    }

    /**
     * @desc Prepares the structure sent down to graph
     * @private
     */
    private prepareTobPackage = (): TopOfBookPackage => {
        const { topOfBookItems } = this.props;
        let sodNanoDate: NanoDate = new NanoDate();

        const adaptedTopOfBookItems = topOfBookItems.map((topOfBookItem: TopOfBookItem) => {
            const bigIntegerTimestamp: bigInt.BigInteger = adaptTrueNanosecondsTimeToCurrentDateTimezone(
                bigInt(topOfBookItem.timestamp),
            );
            const exact: NanoDate = new NanoDate(bigIntegerTimestamp.toString());
            const nsSinceStartOfDay: number = getNsSinceSod(exact);

            sodNanoDate = getSodNanoDate(exact);
            return {
                ...topOfBookItem,
                date: exact,
                nsSinceStartOfDay,
            };
        });

        return {
            topOfBookItems: adaptedTopOfBookItems,
            sodNanoDate,
        };
    };

    /**
     * @function updateDimensions
     * @desc Updates state following a resize of the window
     */
    updateDimensions = () => {
        if (this.graphContainerRef.current) {
            this.setState({
                graphHeight: this.graphContainerRef.current.offsetHeight,
                graphWidth: this.graphContainerRef.current.offsetWidth,
            }, () => this.render());
        }
    };

    render() {
        const {
            classes, onTimeSelect, selectedDateTimeNano, handlePanAndZoom, startOfDay, endOfDay,
        } = this.props;
        const { graphWidth, graphHeight } = this.state;
        const topOfBookPackage: TopOfBookPackage = this.prepareTobPackage();

        return (
            <div
                className={classes.graphWrapper}
                ref={this.graphContainerRef}
            >
                {graphWidth !== 0
                 && (
                     <TopOfBookGraph
                         height={graphHeight}
                         width={graphWidth}
                         onTimeSelect={onTimeSelect}
                         selectedDateTimeNano={selectedDateTimeNano}
                         startOfDay={startOfDay}
                         endOfDay={endOfDay}
                         topOfBookItems={topOfBookPackage.topOfBookItems}
                         sodNanoDate={topOfBookPackage.sodNanoDate}
                         handlePanAndZoom={handlePanAndZoom}
                     />
                 )}

            </div>
        );
    }
}

export default withStyles(styles)(TopOfBookGraphWrapper);
