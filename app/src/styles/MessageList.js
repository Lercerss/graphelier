import { Colors } from './App';

export const Styles = {
    scrollContainer: {
        height: 300,
        width: '100%',
    },
    currentMessageRow: {
        backgroundColor: Colors.yellow,
        display: 'flex',
        width: '100%',
        border: '3px',
        borderColor: Colors.black,
        textAlign: 'center',
    },
    tableDataRow: {
        display: 'flex',
        width: '100%',
        border: '3px',
        borderColor: Colors.black,
        textAlign: 'center',
    },
    tableHeaderRow: {
        display: 'flex',
        width: '100%',
        border: '5px',
        textAlign: 'center',
        paddingTop: 10,
        paddingBottom: 10,
    },
    tableColumn: {
        maxWidth: '16.66%',
        width: '16.66%',
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingLeft: 20,
        paddingRight: 20,
        wordWrap: 'break-word',
        wordBreak: 'break-word',
        overflowWrap: 'break-word',
    },
    overrideTimestampColumn: {
        maxWidth: '30%',
        width: '30%',
    },
};
