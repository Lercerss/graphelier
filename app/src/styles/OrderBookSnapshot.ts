export const Styles = theme => ({
    root: {
        backgroundColor: 'transparent',
    },
    container: {
        backgroundColor: 'transparent',
    },
    divTopBook: {
        display: 'flex',
        justifyContent: 'flex-end',
        backgroundColor: 'transparent',
    },
    NativeSelect: {
        margin: '1.5rem',
    },
    divTopBookBody: {
        backgroundColor: `#41aeff !important`,
        display: 'flex',
        justifyContent: 'center',
        padding: '1rem',
    },
    formControl: {
        minWidth: 350,
        display: 'flex',
        width: '100%',
        marginBottom: 20,
        justifyContent: 'flex-end',
    },
    datePicker: {
        width: 'min-content',
        alignSelf: 'flex-end',
        display: 'inline',
    },
    timestampSlider: {
        width: '100%',
        marginRight: 20,
        marginLeft: 20,
    },
    pleaseSelectMessage: {
        display: 'inline',
        color: '#9F6000',
        backgroundColor: '#FEEFB3',
        borderRadius: '5px',
        padding: '2px',
    },
    selectMessage: {
        display: 'inline',
        padding: '2px',
    },
    inputLabel: {
        display: 'inline',
        marginRight: 10,
    },
    timestampDisplay: {
        display: 'inline',
    },
    inlineFlexEnd: {
        display: 'flex',
        justifyContent: 'flex-end',
        marginTop: 15,
        alignItems: 'center',
    },
    transparentBackground: {
        backgroundColor: 'transparent',
    },
    expand: {
        transform: 'rotate(0deg)',
        marginLeft: 'auto',
        transition: 'transform 0.25s',
        fontSize: '1rem',
    },
    expandOpen: {
        transform: 'rotate(180deg)',
    },
    flex: {
        display: 'flex',
    },
    expandRow: {
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '10px',
    },
    messageListCard: {
        marginTop: '15px',
    },
    selectInstrumentLabel: {
        marginTop: theme.spacing(2),
        marginBottom: theme.spacing(3),
        marginRight: theme.spacing(2),
        display: 'inline',
        color: 'black',
    },
    selectInstrumentInput: {
        width: '10vh',
    },
    graph: {
        width: '100%',
    },
    spaceBetween: {
        display: 'flex',
        justifyContent: 'space-between',
    },
    inline: {
        display: 'flex',
        marginTop: 15,
        alignItems: 'center',
    },
    inputSelect: {
        display: 'flex',
        alignItems: 'center',
    },
});
