import { Colors, LightThemeColors } from './App';

export const Styles = {
    orderInfo: {
        textAlign: 'center' as const,
        padding: 40,
    },
    orderIdHeader: {
        color: Colors.white,
        textAlign: 'center' as const,
        backgroundColor: LightThemeColors.palette.primary.main,
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
