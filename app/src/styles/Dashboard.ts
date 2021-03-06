const DRAWER_WIDTH = 240;

export const Styles = theme => ({
    root: {
        display: 'flex',
    },
    toolbar: {
        paddingRight: 24, // keep right padding when  drawer closed
    },
    toolbarIcon: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        padding: '0 8px',
        ...theme.mixins.toolbar,
    },
    appBar: {
        zIndex: theme.zIndex.drawer + 1,
        transition:
            theme.transitions.create(['width', 'margin'], {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.leavingScreen,
            }),
        backgroundColor: `#41aeff !important`,
    },
    appBarShift: {
        marginLeft: DRAWER_WIDTH,
        width: `calc(100% - ${DRAWER_WIDTH}px)`,
        transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
        }),
    },
    menuButton: {
        marginRight: 36,
        color: 'white',
    },
    menuButtonHidden: {
        display: 'none',
    },
    title: {
        display: 'contents',
        textAlign: 'center' as const,
        '& a': {
            paddingTop: '0.4rem',
            color: 'white',
        },
        '& a:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.08)',
        },
    },
    drawerPaper: {
        position: 'relative' as const,
        whiteSpace: 'nowrap' as const,
        width: DRAWER_WIDTH,
        transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
        }),
        '& div': {
            '& button': {
                color: 'black',
            },
        },
    },
    drawerPaperClose: {
        overflowX: 'hidden' as const,
        transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
        }),
        width: theme.spacing(7),
        [theme.breakpoints.up('sm')]: {
            width: theme.spacing(9),
        },
    },
    appBarSpacer: theme.mixins.toolbar,
    content: {
        flexGrow: 1,
        height: '100vh',
        overflow: 'auto',
    },
    container: {
        paddingTop: theme.spacing(2),
        paddingBottom: theme.spacing(2),
        paddingLeft: '0px !important',
        paddingRight: '0px !important',
        maxWidth: 'unset',
    },
    paper: {
        display: 'flex',
        overflow: 'auto',
        flexDirection: 'column' as const,
    },
    fixedHeight: {
        height: 240,
    },
    maxHeight: {
        height: '100%',
    },
    paddingCopyright: {
        paddingBottom: theme.spacing(1),
    },
});
