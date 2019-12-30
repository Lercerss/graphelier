import * as React from 'react';
import { connect } from 'react-redux';
import {
    withStyles, MuiThemeProvider, createMuiTheme, createStyles, WithStyles,
} from '@material-ui/core/styles';


import { Dispatch } from 'redux';
import { Styles, LightThemeColors } from './styles/App';

import { saveReactAppName } from './actions/actions';
import Dashboard from './components/template/Dashboard';

const lightTheme = createMuiTheme(LightThemeColors);
const styles = createStyles(Styles);

interface Props extends WithStyles<typeof styles>{
    onAppMounted: Function,
}

class App extends React.Component<Props> {
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

const mapDispatchToProps = (dispatch : Dispatch) => ({
    onAppMounted: (name : string) => dispatch(saveReactAppName(name)),
});

export default withStyles(styles)(connect(mapStateToProps, mapDispatchToProps)(App));
