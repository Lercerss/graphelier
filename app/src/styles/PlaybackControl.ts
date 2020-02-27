import { Colors, LightThemeColors } from './App';

export const Styles = theme => ({
    test: {
        color: Colors.red,
    },
    selectUnitInput: {
        width: '7rem',
    },
    selectUnitSpeedInput: {
        width: '6rem',
    },
    centerContent: {
        display: 'flex',
        justifyContent: 'center',
    },
    marginRight: {
        marginRight: theme.spacing(2),
    },
    marginLeft: {
        marginLeft: theme.spacing(2),
    },
    buttonColor: {
        backgroundColor: LightThemeColors.palette.primary.main,
        color: Colors.white,
        height: '2rem',
        marginTop: 'auto',
    },
});
