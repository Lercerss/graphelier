import { Colors } from './App';

export const Styles = {
    newsItemDiv: {
        width: 300,
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
        maxHeight: '33%',
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
        '&:hover #stockBox': {
            opacity: 0.7,
            transition: 'opacity 0.2s',
        },
        '&:hover #time': {
            textDecoration: 'underline',
            textDecorationColor: Colors.grey,
        },
    },
    stockBox: {
        height: '100%',
        padding: '0px 3px',
        borderRadius: '3px',
        marginRight: '5px',
        transition: 'opacity 0.2s',
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
        textDecoration: 'none',
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
    articleLinkIcon: {

    },
};
