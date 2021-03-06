import { Colors } from './App';

export const Styles = {
    articleDiv: {
        maxWidth: '300px',
        minWidth: '300px',
    },
    image: {
        width: '100%',
    },
    title: {
        display: 'inline-flex',
        width: '100%',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '5px',
    },
    headline: {
        lineHeight: '1.4',
    },
    linkIcon: {
        marginTop: '3px',
    },
    articleLink: {
        textDecoration: 'none',
        transition: 'opacity 0.2s',
        '&:hover': {
            opacity: 0.7,
            transition: 'opacity 0.2s',
        },
    },
    graphLink: {
        textDecoration: 'none',
    },
    stockTimeDiv: {
        display: 'inline-flex',
        width: '100%',
        alignItems: 'center',
        marginBottom: '5px',
        flexWrap: 'wrap' as 'wrap',
    },
    stockBox: {
        height: '100%',
        padding: '0px 3px',
        borderRadius: '3px',
        marginRight: '5px',
        transition: 'opacity 0.2s',
    },
    fadeOnHover: {
        '&:hover': {
            opacity: 0.7,
            transition: 'opacity 0.2s',
        },
    },
    stock: {
        color: Colors.white,
        fontSize: 11,
        '&:hover': {
            textDecoration: 'none',
        },
    },
    AAPL: {
        backgroundColor: Colors.indigo,
    },
    SPY: {
        backgroundColor: Colors.orange,
    },
    MSFT: {
        backgroundColor: Colors.emerald,
    },
    other: {
        backgroundColor: Colors.grey,
    },
    time: {
        color: Colors.grey,
        fontSize: 11,
    },
    marginLeft: {
        marginLeft: '15px',
    },
    buttonBase: {
        width: '100%',
    },
    modal: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    paper: {
        backgroundColor: Colors.white,
        borderRadius: '8px',
        padding: '15px',
    },
};
