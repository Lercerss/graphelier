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
        justifyContent: 'flex-end',
    },
    datePicker: {
        width: 'min-content',
        alignSelf: 'flex-end',
        display: 'inline',
    },
    timestampSlider: {
        marginTop: 20,
        width: '100%',
    },
    selectMessage: {
        alignSelf: 'flex-end',
        color: '#9F6000',
        backgroundColor: '#FEEFB3',
        borderRadius: '5px',
        padding: '2px',
        marginTop: 15
    },
    inputLabel: {
        display: 'inline',
        marginRight: 10
    },
    timestampDisplay: {
        display: 'inline',
    },
    inline: {
        display: 'flex',
        justifyContent: 'flex-end',
        marginTop: 10,
    },
};
