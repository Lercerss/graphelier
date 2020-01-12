export const Colors = {
    navyBlue: '#282c34',
    white: '#FFFFFF',
    empty: '#dcdcdc',
    lightBlue: '#2196f3',
    green: '#159027',
    red: '#943e30',
    darkGrey: '#343434',
    black: '#000000',
    yellow: '#ffff00',
};

export const LightThemeColors = {
    palette: {
        primary: {
            main: '#41aeff',
        },
    },
};

export const Styles = {
    app: {
        textAlign: 'center' as const,
        minWidth: '100%',
        backgroundColor: Colors.empty,
        display: 'flex',
        flexDirection: 'column' as const,
        flex: 1,
        width: '100%',
        justifyContent: 'center',
    },
};
