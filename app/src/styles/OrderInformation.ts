import { Colors, LightThemeColors } from './App';

export const Styles = {
    orderInfo: {
        padding: 40,
    },
    orderIdHeader: {
        color: Colors.white,
        textAlign: 'center' as const,
        backgroundColor: LightThemeColors.palette.primary.main,
    },
    orderId: {
        marginTop: 5,
        marginBottom: 5,
        marginLeft: 100,
        marginRight: -50,
        paddingLeft: 10,
        borderTop: 0,
    },
    orderIdValue: {
        marginTop: 5,
        marginBottom: 5,
        paddingRight: 50,
    },
    basicOrderInfo: {
        textAlign: 'left' as const,
    },
    basicOrderInfoValue: {
        textAlign: 'right!important' as any,
    },
    messageHeader: {
        textAlign: 'center' as const,
        backgroundColor: LightThemeColors.palette.primary.main,
        color: Colors.white,
        padding: 20,
        marginTop: -5,
    },
    messagesTable: {
        marginTop: -20,
    },
};
