import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';
import { styles } from '../styles/Home';

class NotFound extends Component {
    constructor(props) {
        super(props);
        this.setState({});
    }


    render() {
        const { classes } = this.props;

        return (
            <img className={classes.notFound} src={'/404_cat.jpg'} alt={'404 derpy cat'} />
        );
    }
}

export default withStyles(styles)(NotFound);
