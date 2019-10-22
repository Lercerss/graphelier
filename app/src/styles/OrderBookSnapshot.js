import {Colors} from './App';

export const Styles = {
    root:{
        backgroundColor: 'transparent'
    },
    container: {
        backgroundColor: 'transparent',
        fontSize: '1.5rem'
    },
    divTopBook: {
        display: 'flex',
        justifyContent: 'flex-end',
        backgroundColor: 'transparent'
    },
    NativeSelect: {
        margin: '1.5rem'
    },
    divTopBookBody: {
        backgroundColor: `${Colors.lightBlue} !important`,
        display: 'flex',
        justifyContent: 'center',
        padding: '1rem'
    },
    formControl: {
        minWidth: 350,
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
        alignItems: 'center',
    },
    transparentBackground: {
        backgroundColor: 'transparent'
    }
};
