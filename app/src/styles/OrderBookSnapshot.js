import {Colors} from './App';

export const Styles = {
    root:{
        backgroundColor: Colors.empty,
        minHeight: '100vh',
    },
    container: {
        backgroundColor: Colors.lightBlue,
        fontSize: '1.5rem',
        paddingBottom: 20,
    },
    divTopBook: {
        display: 'flex',
        justifyContent: 'flex-end',
        backgroundColor: Colors.empty
    },
    NativeSelect: {
        margin: '1.5rem'
    },
    divTopBookBody: {
        display: 'flex',
        justifyContent: 'center',
        padding: '1rem'
    },
    formControl: {
        display: 'flex',
        width: '100%',
        marginTop: 20,
        marginBottom: 20,
    },
    datePicker: {
        width: 'min-content',
        alignSelf: 'flex-end',
    },
    timestampDisplay: {
        marginTop: 20,
        marginBottom: 10,
        alignSelf: 'flex-end',
    },
    timestampSlider: {
        marginTop: 0,
        width: '100%',
    },
    timestampsliderLaberl: {
        alignSelf: 'flex-end',
    },
};
