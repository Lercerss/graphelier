import { Colors } from './App';

export const Styles = {
    newsItemDiv: {
        width: 'fit-content',
        maxWidth: '60vw',
        display: 'flex',
        flexDirection: 'column' as 'column',
    },
    imageAndSummaryDiv: {
        display: 'flex-inline',
        flexDirection: 'row' as 'row',
    },
    image: {
        height: '200px',
        display: 'inline',
    },
    title: {
        display: 'inline-flex',
        maxWidth: '80%',
        alignItems: 'flex-start',
    },
    linkIcon: {
        marginTop: '3px',
        marginLeft: '5px',
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
        alignItems: 'center',
        marginBottom: '5px',
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
    summary: {
        width: 'fit-content',
        maxWidth: '60vw',
    },
};
