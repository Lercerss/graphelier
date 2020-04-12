import { Colors } from './App';

export const Styles = theme => ({
    contentDiv: {
        height: '85vh',
        overflow: 'auto',
    },
    loaderDiv: {
        marginTop: '30px',
        marginLeft: '0px',
        marginRight: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        width: '100%',
    },
    headerDiv: {
        right: '30px',
        position: 'fixed' as 'fixed',
        zIndex: 1,
    },
    datePickerDiv: {
        width: '0px',
        height: '0px',
    },
    dateButton: {
        color: Colors.white,
    },
    calendarIcon: {
        marginLeft: '5px',
    },
    timelineScroller: {
        height: '100%',
        overflow: 'auto',
    },
    articleCluster: {
        display: 'inline-flex',
        maxWidth: '100%',
        overflow: 'auto',
    },
    timelineEvent: {
        width: 'fit-content',
        maxWidth: '75vw',
        height: 'fit-content',
        padding: '10px 10px',
    },
    placeholderMessage: {
        textAlign: 'center' as const,
        marginTop: theme.spacing(2),
        marginBottom: theme.spacing(3),
        borderRadius: '5px',
        backgroundColor: Colors.paleBlue,
        width: 'fit-content',
        padding: '0px 5px',
        margin: '0 auto',
    },
});
