export const Styles = {
    container: {
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
    },
    topOfTheBookButton: {
        marginTop: 20,
        marginBottom: 20,
        backgroundColor: '#41aeff',
        color: 'white',
        '&:hover': {
            backgroundColor: '#417dff'
        }
    },
    scrollContainer: {
        width: '100%',
        height: 700,
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'flex-start',
    },
    header: {
        display: 'flex',
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'flex-end',
        paddingRight: 50,
        paddingLeft: 50
    },
    pricePoint: {
        display: 'flex',
        flex: 1,
    },
};
