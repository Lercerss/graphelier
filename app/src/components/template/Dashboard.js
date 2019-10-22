import React from 'react';
import clsx from 'clsx';
// import { makeStyles } from '@material-ui/core/styles';
import CssBaseline from '@material-ui/core/CssBaseline';
import { Drawer, AppBar, Toolbar, List, Typography, Divider, IconButton, Container, Link } from '@material-ui/core';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import MenuIcon from '@material-ui/icons/Menu';
import { mainListItems } from './listItems';
import { Styles as OBStyles } from '../../styles/OrderBookSnapshot';
import OrderBookSnapshot from '../OrderBookSnapshot';
// import {Colors} from '../../styles/App'
import { Styles } from '../../styles/Dashboard';

function Copyright() {
    const classes = Styles();
    return (
        <Typography variant="body2" color="textSecondary" align="center" className={classes.paddingCopyright}>
            {'Copyright © '}
            <Link color="inherit" href="https://github.com/Lercerss/graphelier">
                TFBAG
            </Link>{' '}
            {new Date().getFullYear()}
            {'.'}
        </Typography>
    );
}

export default function Dashboard() {
    const classes = Styles();
    const [open, setOpen] = React.useState(false);
    const handleDrawerOpen = () => {
        setOpen(true);
    };
    const handleDrawerClose = () => {
        setOpen(false);
    };

    return (
        <div className={classes.root}>
            <CssBaseline />
            <AppBar position="absolute" className={clsx(classes.appBar, open && classes.appBarShift)} theme={OBStyles.themeBackground}>
                <Toolbar className={classes.toolbar}>
                    <IconButton
                        edge="start"
                        color="inherit"
                        aria-label="open drawer"
                        onClick={handleDrawerOpen}
                        className={clsx(classes.menuButton, open && classes.menuButtonHidden)}
                    >
                        <MenuIcon />
                    </IconButton>
                    <Typography component="h1" variant="h6" color="inherit" noWrap className={classes.title}>
                        Graphelier
                    </Typography>
                </Toolbar>
            </AppBar>
            <Drawer
                variant="permanent"
                classes={{
                    paper: clsx(classes.drawerPaper, !open && classes.drawerPaperClose),
                }}
                open={open}
            >
                <div className={classes.toolbarIcon}>
                    <IconButton onClick={handleDrawerClose}>
                        <ChevronLeftIcon />
                    </IconButton>
                </div>
                <Divider />
                <List>{mainListItems}</List>
            </Drawer>
            <main className={classes.content}>
                <div className={classes.appBarSpacer} />
                <Container className={classes.container}>
                    <OrderBookSnapshot />
                </Container>
            </main>
        </div>
    );
}
