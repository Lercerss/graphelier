import { Colors } from './App';

export const Styles = {
    newsItemDiv: {
        overflow: 'auto',
        minWidth: '20vw',
        maxWidth: '20vw',
    },
    image: {
        width: '100%',
    },
    title: {
        display: 'inline-flex',
        width: '100%',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    linkIcon: {
        marginTop: '3px',
    },
    body: {
        marginTop: '2px',
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
    },
    stockBox: {
        height: '100%',
        padding: '0px 3px',
        borderRadius: '3px',
        marginRight: '5px',
        transition: 'opacity 0.2s',
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
    aapl: {
        backgroundColor: Colors.indigo,
    },
    spy: {
        backgroundColor: Colors.orange,
    },
    msft: {
        backgroundColor: Colors.emerald,
    },
    other: {
        backgroundColor: Colors.purple,
    },
    time: {
        color: Colors.grey,
        fontSize: 11,
    },
    marginLeft: {
        marginLeft: '15px',
    },
};
