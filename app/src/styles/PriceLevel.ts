import { Colors } from './App';

export const Styles = {
    row: {
        flex: 1,
        display: 'flex',
        flexDirection: 'row' as const,
        alignContent: 'flex-start',
        padding: '5px 0px',
        margin: '0px 10px',
    },
    price: {
        float: 'left' as const,
        width: '50px',
        textAlign: 'left' as const,
        paddingRight: 15,
        color: Colors.darkGrey,
    },
    bid: {
        display: 'flex',
        flex: 1,
        borderTop: '0.5px solid #cacaca',
    },
    ask: {
        display: 'flex',
        flex: 1,
        borderBottom: '0.5px solid #cacaca',
    },
    quantitiesBox: {
        display: 'flex',
        flexDirection: 'row' as const,
        paddingLeft: 30,
        width: '100%',
    },
};
