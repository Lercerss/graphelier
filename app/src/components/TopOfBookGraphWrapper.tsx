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
    private readonly divRef: React.RefObject<HTMLDivElement>;

    constructor(props) {
        super(props);

        this.state = {
            graphHeight: 0,
            graphWidth: 0,
        };

        this.divRef = React.createRef<HTMLDivElement>();
    }

    componentDidMount() {
        if (this.divRef.current) {
            this.setState({
                graphHeight: this.divRef.current.offsetHeight,
                graphWidth: this.divRef.current.offsetWidth,
            });
        }
        window.addEventListener('resize', this.updateDimensions);
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.updateDimensions);
    }

    updateDimensions = () => {
        if (this.divRef.current) {
            this.setState({
                graphHeight: this.divRef.current.offsetHeight,
                graphWidth: this.divRef.current.offsetWidth,
            }, () => this.render());
        }
    };

    render() {
        const {
            classes, onTimeSelect, selectedDateTimeNano, topOfBookItems,
        } = this.props;
        const { graphWidth, graphHeight } = this.state;
        console.log('dimensions', graphWidth, graphHeight);
        return (
            <div
                className={classes.graphWrapper}
                ref={this.divRef}
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
