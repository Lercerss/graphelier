import React, { Component } from 'react';
import classNames from 'classnames';
import CssBaseline from '@material-ui/core/CssBaseline';
import {
    Drawer, AppBar, Toolbar, List, Typography, Divider, IconButton, Container,
} from '@material-ui/core';

import {
    Route, BrowserRouter as Router, Switch, NavLink,
} from 'react-router-dom';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import MenuIcon from '@material-ui/icons/Menu';
import { withStyles } from '@material-ui/core/styles';
import { createStyles, WithStyles } from '@material-ui/styles';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';
import logo from '../../assets/graphelierLogoWhite.png';
import { mainListItems } from './listItems';
import OrderBookSnapshot from '../OrderBookSnapshot';
import NewsTimeline from '../NewsTimeline';
import Home from '../Home';
import NotFound from '../NotFound';
import { Styles } from '../../styles/Dashboard';
import OrderBookService from '../../services/OrderBookService';
import { RootState } from '../../store';
import { saveInstruments } from '../../actions/actions';


const styles = theme => createStyles(Styles(theme));

interface Props extends WithStyles<typeof styles> {
    onInstrumentsReceived: Function,
}

interface State {
    open: boolean
}

class Dashboard extends Component<Props, State> {
    constructor(props) {
        super(props);

        this.state = {
            open: false,
        };
    }

    componentDidMount = () => {
        this.fetchInstruments();
    }

    /**
     * @description Handles opening the left menu drawer
     */
    handleOpenCloseDrawer = () => {
        const { open } = this.state;
        this.setState({ open: !open });
    };

    /**
     * @desc Fetches instruments to store into redux
     */
    fetchInstruments = () => {
        const { onInstrumentsReceived } = this.props;
        OrderBookService.getInstrumentsList()
            .then(response => {
                onInstrumentsReceived(response.data);
            }).catch(err => {
                console.warn(err);
            });
    }

    render() {
        const { open } = this.state;
        const { classes } = this.props;

        return (
            <div className={classes.root}>
                <CssBaseline />
                <Router>
                    <AppBar
                        position={'absolute'}
                        className={classNames(classes.appBar, open && classes.appBarShift)}
                    >
                        <Toolbar className={classes.toolbar}>
                            <IconButton
                                edge={'start'}
                                color={'inherit'}
                                aria-label={'open drawer'}
                                onClick={this.handleOpenCloseDrawer}
                                className={classNames(classes.menuButton, open && classes.menuButtonHidden)}
                            >
                                <MenuIcon />
                            </IconButton>
                            <Typography
                                component={'h1'}
                                variant={'h6'}
                                color={'inherit'}
                                noWrap
                                className={classes.title}
                            >
                                <NavLink
                                    exact
                                    to={'/'}
                                    className={classNames('mainItemsList-removeLink')}
                                >
                                    <img
                                        src={(logo)}
                                        alt={'Graphelier'}
                                        width={'200px'}
                                    />

                                </NavLink>
                            </Typography>
                        </Toolbar>
                    </AppBar>
                    <Drawer
                        variant={'permanent'}
                        classes={{
                            paper: classNames(classes.drawerPaper, !open && classes.drawerPaperClose),
                        }}
                        open={open}
                    >
                        <div className={classes.toolbarIcon}>
                            <IconButton onClick={this.handleOpenCloseDrawer}>
                                <ChevronLeftIcon />
                            </IconButton>
                        </div>
                        <Divider />
                        <List>{mainListItems}</List>
                    </Drawer>
                    <main className={classes.content}>
                        <div className={classes.appBarSpacer} />
                        <Container className={classes.container}>
                            <Switch>
                                <Route
                                    exact
                                    path={'/'}
                                    component={Home}
                                />
                                <Route
                                    path={'/orderbook'}
                                    render={() => (
                                        <OrderBookSnapshot />
                                    )}
                                />
                                <Route
                                    path={'/timeline'}
                                    render={() => (
                                        <NewsTimeline />
                                    )}
                                />
                                <Route component={NotFound} />
                            </Switch>
                        </Container>
                    </main>
                </Router>
            </div>
        );
    }
}

const mapStateToProps = (state: RootState) => ({});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    onInstrumentsReceived: (instruments: Array<string>) => dispatch(
        saveInstruments(instruments),
    ),
});

export const NonConnectedDashboard = withStyles(styles)(Dashboard);

export default connect(mapStateToProps, mapDispatchToProps)(withStyles(styles)(Dashboard));
