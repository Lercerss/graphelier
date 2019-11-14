import { getOrderBookScrollerHeight } from '../utils/order-book-utils';

export const Styles = {
    container: {
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#ffffff',
    },
    topOfTheBookButton: {
        color: 'white',
    },
    scrollContainer: {
        width: '100%',
        height: getOrderBookScrollerHeight,
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'flex-start',
    },
    header: {
        display: 'flex',
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        borderBottom: '0.5px solid #cacaca',
        paddingRight: 30,
        paddingLeft: 30,
        paddingTop: 10,
        paddingBottom: 20,
    },
    pricePoint: {
        display: 'flex',
        flex: 1,
    },
    messagesText: {
        display: 'inline',
        marginBottom: 5,
    },
    messagesDiv: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
    },
};
