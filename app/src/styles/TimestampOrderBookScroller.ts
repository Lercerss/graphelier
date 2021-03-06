import { ANIMATION_TIME } from '../constants/Constants';

export const Styles = {
    container: {
        width: '100%',
        display: 'flex',
        flexDirection: 'column' as const,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#ffffff',
    },
    topOfTheBookButton: {
        color: 'white',
    },
    scrollContainer: {
        width: '100%',
        height: '35vh',
        display: 'flex',
        flexDirection: 'row' as const,
        justifyContent: 'flex-start',
    },
    header: {
        display: 'flex',
        width: '100%',
        flexDirection: 'row' as const,
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
        flexDirection: 'column' as const,
        alignItems: 'center',
    },
    maxWidth: {
        width: '100%',
    },
    marginAuto: {
        margin: 'auto',
    },
    hide: {
        background: 'rgba(0,0,0,0.08)',
    },
    show: {
        display: 'inherit',
    },
    levelEnter: {
        lineHeight: 0,
        paddingTop: 0,
        paddingBottom: 0,
        opacity: 0,
    },
    levelEnterActive: {
        lineHeight: 1.5,
        opacity: 1,
        paddingTop: '5px',
        paddingBottom: '5px',
        transition: `padding-bottom ${ANIMATION_TIME}ms ease-in, padding-top ${ANIMATION_TIME}ms ease-in,`
        + `line-height ${ANIMATION_TIME}ms ease-in, opacity ${ANIMATION_TIME}ms ease-in`,
    },
    levelExit: {
        lineHeight: 1.5,
        opacity: 1,
        paddingTop: '5px',
        paddingBottom: '5px',
    },
    levelExitActive: {
        lineHeight: 0,
        opacity: 0,
        paddingTop: 0,
        paddingBottom: 0,
        transition: `padding-bottom ${ANIMATION_TIME}ms ease-in, padding-top ${ANIMATION_TIME}ms ease-in,`
        + `line-height ${ANIMATION_TIME}ms ease-in, opacity ${ANIMATION_TIME}ms ease-in`,
    },
};
