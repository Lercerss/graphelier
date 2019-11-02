import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withStyles, MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';


import { Styles, LightThemeColors } from './styles/App';

import { saveReactAppName } from './actions/actions';
import Dashboard from './components/template/Dashboard';

const lightTheme = createMuiTheme(LightThemeColors);

class App extends Component {
    componentDidMount() {
        const { onAppMounted } = this.props;
        onAppMounted('graphelier');
    }

    render() {
        return (
            <MuiThemeProvider theme={lightTheme}>
                <Dashboard />
            </MuiThemeProvider>
        );
    }
}

const mapStateToProps = () => ({});

const mapDispatchToProps = dispatch => ({
    onAppMounted: name => dispatch(saveReactAppName(name)),
});

export default withStyles(Styles)(connect(mapStateToProps, mapDispatchToProps)(App));
