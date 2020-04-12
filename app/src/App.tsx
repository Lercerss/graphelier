import React from 'react';
import { connect } from 'react-redux';
import {
    withStyles, MuiThemeProvider, createMuiTheme, createStyles, WithStyles,
} from '@material-ui/core/styles';
import { Helmet } from 'react-helmet';

import { Dispatch } from 'redux';
import { SnackbarProvider } from 'notistack';
import { Styles, LightThemeColors } from './styles/App';

import { saveReactAppName } from './actions/actions';
import Dashboard from './components/template/Dashboard';
import { RootState } from './store';
import GreetingsLoader from './components/GreetingsLoader';

const lightTheme = createMuiTheme(LightThemeColors);
const styles = createStyles(Styles);

interface Props extends WithStyles<typeof styles>{
    onAppMounted: Function,
    appName: string
}

interface State {
    showGreeting: boolean,
}

class App extends React.Component<Props, State> {
    constructor(props) {
        super(props);
        this.state = {
            showGreeting: true,
        };
    }

    componentDidMount() {
        const { onAppMounted } = this.props;
        onAppMounted('graphelier');
    }

    /**
     * @desc Changes state in order to no longer show the greeting message
     * @returns {void}
     */
    private hideGreeting = () => {
        this.setState({ showGreeting: false });
    }

    render() {
        const { appName } = this.props;
        const { showGreeting } = this.state;

        return (
            <MuiThemeProvider theme={lightTheme}>
                <Helmet>
                    <title>{appName}</title>
                </Helmet>
                {
                    showGreeting
                        ? (
                            <GreetingsLoader
                                hideGreeting={this.hideGreeting}
                            />
                        ) : (
                            <SnackbarProvider>
                                <Dashboard />
                            </SnackbarProvider>
                        )
                }
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
