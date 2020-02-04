import React, { Component } from 'react';
import bigInt from 'big-integer';
import { WithStyles, createStyles, withStyles } from '@material-ui/core/styles';
import TopOfBookGraph from './TopOfBookGraph';
import { TopOfBookItem } from '../models/OrderBook';
import { Styles } from '../styles/TopOfBookGraphWrapper';

const styles = createStyles(Styles);

interface Props extends WithStyles<typeof styles> {
    className: string,
    onTimeSelect: (any) => void,
    selectedDateTimeNano: bigInt.BigInteger,
    topOfBookItems: Array<TopOfBookItem>,
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
            classes, onTimeSelect, selectedDateTimeNano, topOfBookItems,
        } = this.props;
        const { graphWidth, graphHeight } = this.state;
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
                         topOfBookItems={topOfBookItems}
                     />
                 )}

            </div>
        );
    }
}

export default withStyles(styles)(TopOfBookGraphWrapper);
