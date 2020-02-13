import { Colors } from './App';

export const Styles = {
    rectangle: {
        marginLeft: 3,
        paddingLeft: 4,
        paddingRight: 4,
        borderRadius: 3,
        display: 'flex',
        flexDirection: 'row' as const,
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        transition: 'width 500ms ease-in',
        cursor: 'pointer',
    },
    bid: {
        backgroundColor: Colors.green,
    },
    ask: {
        backgroundColor: Colors.red,
    },
    getOrderInfo: {
        backgroundColor: Colors.yellow,
    },
    text: {
        color: Colors.white,
        fontSize: 13,
    },
    quantity: {
        width: '100%',
        height: '100%',
    },
    offsetTooltip: {
        marginTop: -1,
    },
};
