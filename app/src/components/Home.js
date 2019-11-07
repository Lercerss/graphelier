import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';
import { styles } from '../styles/Home';

class Home extends Component {
    constructor(props) {
        super(props);
        this.setState({});
    }


    render() {
        const { classes } = this.props;

        return (
            <div>
                <h1 className={classes.root}>Welcome to Graphelier</h1>
                <div className={classes.center}>
                    <p>The tool for all your order book needs.</p>
                    <p>It currently provides</p>
                    <ul className={classes.ul}>
                        <li>An order book snapshot with granular message and timestamp control</li>
                        <li>A graph for asks and bids over time (In progress)</li>
                    </ul>
                </div>
            </div>
        );
    }
}

export default withStyles(styles)(Home);
