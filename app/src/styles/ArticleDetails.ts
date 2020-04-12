import { Colors } from './App';

export const Styles = {
    articleDiv: {
        width: 'fit-content',
        maxWidth: '60vw',
        display: 'flex',
        flexDirection: 'column' as 'column',
        height: 'fit-content',
        maxHeight: '90vh',
        overflow: 'auto',
    },
    imageAndSummaryDiv: {
        display: 'flex-inline',
        flexDirection: 'row' as 'row',
        overflow: 'auto',
    },
    image: {
        height: '200px',
        float: 'left' as 'left',
        marginRight: '10px',
        marginBottom: '10px',
    },
    title: {
        display: 'inline-flex',
        alignItems: 'flex-start',
        marginBottom: '10px',
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
        marginBottom: '10px',
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
    time: {
        color: Colors.grey,
        fontSize: 11,
    },
    summary: {
        width: 'fit-content',
        maxWidth: '60vw',
    },
    sentimentIcon: {
        marginRight: '5px',
    },
};
