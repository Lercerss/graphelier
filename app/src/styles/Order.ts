import { Colors } from './App';

export const Styles = {
    rectangle: {
        marginLeft: 5,
        paddingLeft: 3,
        paddingRight: 3,
        borderRadius: 3,
        display: 'flex',
        flexDirection: 'row' as const,
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
    },
    bid: {
        backgroundColor: Colors.green,
    },
    ask: {
        backgroundColor: Colors.red,
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
