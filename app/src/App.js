import React, {Component} from 'react';
import {connect} from 'react-redux';
import {withStyles} from '@material-ui/core/styles';
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';

import {Styles, LightThemeColors} from './styles/App';

import {saveReactAppName} from './actions/actions';
import Dashboard from './components/template/Dashboard';

const lightTheme = createMuiTheme(LightThemeColors);

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
        return (
            <MuiThemeProvider theme={lightTheme}>
                <Dashboard/>
            </MuiThemeProvider>
        );
    }
}

const mapStateToProps = () => {
    return {};
};

const mapDispatchToProps = (dispatch) => {
    return {
        onAppMounted: (name) => dispatch(saveReactAppName(name)),
    };
};

export default withStyles(Styles)(connect(mapStateToProps, mapDispatchToProps)(App));
