import React from 'react';
import { connect } from 'react-redux';
import {
    withStyles, MuiThemeProvider, createMuiTheme, createStyles, WithStyles,
} from '@material-ui/core/styles';
import { Helmet } from 'react-helmet';

import { Dispatch } from 'redux';
import { Styles, LightThemeColors } from './styles/App';

import { saveReactAppName } from './actions/actions';
import Dashboard from './components/template/Dashboard';
import { RootState } from './store';

const lightTheme = createMuiTheme(LightThemeColors);
const styles = createStyles(Styles);

interface Props extends WithStyles<typeof styles>{
    onAppMounted: Function,
    appName: string
}

interface State {
    appName: string
}

class App extends React.Component<Props, State> {
    componentDidMount() {
        const { onAppMounted } = this.props;
        onAppMounted('graphelier');
    }

    render() {
        const { appName } = this.props;

        return (
            <MuiThemeProvider theme={lightTheme}>
                <Helmet>
                    <title>{appName}</title>
                </Helmet>
                <Dashboard />
            </MuiThemeProvider>
        );
    }
}

const mapStateToProps = (state : RootState) => ({
    appName: state.general.appName,
});

const mapDispatchToProps = (dispatch : Dispatch) => ({
    onAppMounted: (name : string) => dispatch(saveReactAppName(name)),
});

export default withStyles(styles)(connect(mapStateToProps, mapDispatchToProps)(App));
