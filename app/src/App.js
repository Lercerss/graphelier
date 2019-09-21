import React, {Component} from 'react';
import {connect} from 'react-redux';
import {withStyles} from '@material-ui/core/styles';

import logo from './assets/logo.svg';

import {Styles} from './styles/App';

import {saveReactAppName} from './actions/actions';
import WelcomeCard from './components/WelcomeCard';
import {Container} from '@material-ui/core';

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
        const {helloMessage} = this.state;

        return (
            <Container className={classes.app}>
                <header className={classes.appHeader}>
                    <img src={logo} className={classes.appLogo} alt={'logo'} />
                    <p>{helloMessage}</p>
                    <WelcomeCard/>
                </header>
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
