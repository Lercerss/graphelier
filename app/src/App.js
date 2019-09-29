import React, {Component} from 'react';
import {connect} from 'react-redux';
import {withStyles} from '@material-ui/core/styles';

import {Styles} from './styles/App';

import {saveReactAppName} from './actions/actions';
import {Container} from '@material-ui/core';
import TimestampOrderBookScroller from './components/TimestampOrderBookScroller';

class App extends Component {

    constructor(props) {
        super(props);

        this.state = {
            helloMessage: 'Welcome to React',
        };
    }

    componentDidMount() {
        this.props.onAppMounted('graphelier');
    }

    render() {
        const {classes} = this.props;

        return (
            <Container className={classes.app}>
                <TimestampOrderBookScroller/>
            </Container>
        );
    }
}

const mapStateToProps = (state) => {
    return {};
};

const mapDispatchToProps = (dispatch) => {
    return {
        onAppMounted: (name) => dispatch(saveReactAppName(name)),
    };
};

export default withStyles(Styles)(connect(mapStateToProps, mapDispatchToProps)(App));
