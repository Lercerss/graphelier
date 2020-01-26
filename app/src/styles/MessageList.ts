import { Colors, LightThemeColors } from './App';

export const Styles = {
    scrollContainer: {
        width: '100%',
        height: '35vh',
    },
    currentMessageRow: {
        backgroundColor: Colors.yellow,
        display: 'flex',
        width: '100%',
        textAlign: 'center' as const,
    },
    tableDataRow: {
        display: 'flex',
        width: '100%',
        textAlign: 'center' as const,
    },
    tableHeaderRow: {
        display: 'flex',
        width: '100%',
        textAlign: 'center' as const,
        color: Colors.white,
        paddingTop: 10,
        paddingBottom: 10,
        backgroundColor: LightThemeColors.palette.primary.main,
    },
    tableColumn: {
        maxWidth: '16.66%',
        width: '16.66%',
        display: 'flex',
        flexDirection: 'row' as const,
        justifyContent: 'center',
        alignItems: 'center',
        paddingLeft: 20,
        paddingRight: 20,
        wordWrap: 'break-word' as const,
        wordBreak: 'break-word' as const,
        overflowWrap: 'break-word' as const,
    },
    overrideTimestampColumn: {
        maxWidth: '30%',
        width: '30%',
    },
    hide: {
        background: 'rgba(0,0,0,0.08)',
    },
};
