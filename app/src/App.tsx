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
import GreetingsLoader from './components/GreetingsLoader';

const lightTheme = createMuiTheme(LightThemeColors);
const styles = createStyles(Styles);

interface Props extends WithStyles<typeof styles>{
    onAppMounted: Function,
    appName: string
}

interface State {
    futureTime: Date;
}

class App extends React.Component<Props, State> {
    intervalCall = window.setInterval(() => this.changeTime(), 100);

    constructor(props) {
        super(props);
        this.state = {
            futureTime: new Date(Date.now() + 2000),
        };
    }

    componentDidMount() {
        const { onAppMounted } = this.props;
        onAppMounted('graphelier');
    }

    /**
     * @desc changes the time in order to determine when to hide the
     */
    private changeTime = (): void => {
        const { futureTime } = this.state;
        if (futureTime.getTime() > Date.now()) {
            this.setState({ futureTime: new Date(futureTime.getTime() - 100) });
        } else {
            clearInterval(this.intervalCall);
        }
    }

    render() {
        const { appName } = this.props;
        const { futureTime } = this.state;
        const showGreeting: boolean = futureTime.getTime() > Date.now();
        const showTransition: boolean = futureTime.getTime() - 1600 > Date.now();

        return (
            <MuiThemeProvider theme={lightTheme}>
                <Helmet>
                    <title>{appName}</title>
                </Helmet>
                {
                    showGreeting
                        ? (
                            <GreetingsLoader
                                showTransition={showTransition}
                            />
                        ) : <Dashboard />
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
