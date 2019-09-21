import React, {Component} from 'react';
import {connect} from 'react-redux';
import { withStyles } from '@material-ui/core/styles';

import {Styles} from '../styles/WelcomeCard';
import {Card} from '@material-ui/core';

class WelcomeCard extends Component {

    constructor(props) {
        super(props);

        this.state = {
            appName: ''
        };
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        const {appName} = this.props;

        if (prevProps.appName !== appName) {
            this.setState({appName});
        }
    }

    render() {
        const {classes} = this.props;
        const {appName} = this.state;

        return (
            <Card
                className={classes.card}
                raised={true}>
                <a
                    className={classes.appLink}
                    href={'https://github.com/Lercerss/graphelier'}
                    target={'_blank'}>
                    Welcome to {appName}</a>
            </Card>
        );
    }
}

const mapStateToProps = (state) => {
    return {
        appName: state.appName
    };
};

export default withStyles(Styles)(connect(mapStateToProps,)(WelcomeCard));
