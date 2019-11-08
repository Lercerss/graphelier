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
import { mainListItems } from './listItems';
import { Styles as OBStyles } from '../../styles/OrderBookSnapshot';
import OrderBookSnapshot from '../OrderBookSnapshot';
import Home from '../Home';
import NotFound from '../NotFound';
import { styles } from '../../styles/Dashboard';

class Dashboard extends Component {
    constructor(props) {
        super(props);

        this.state = {
            open: false,
        };
    }

    /**
     * @description Handles opening the left menu drawer
     */
    handleOpenCloseDrawer = () => {
        const { open } = this.state;
        this.setState({ open: !open });
    };

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
                        theme={OBStyles.themeBackground}
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
                                    Graphelier
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
                                    component={OrderBookSnapshot}
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

export default withStyles(styles)(Dashboard);
