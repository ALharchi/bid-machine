import { createTheme, alpha } from '@mui/material/styles';

const colors = {
    black: '#000000',
    white: '#ffffff',
    greyDark: '#333333',
    grey: '#666666',
    greyMid: '#888888',
    greyLight: '#cccccc',
    greyLighter: '#e0e0e0',
    greyLightest: '#f5f5f5',
};

const theme = createTheme({
    palette: {
        primary: {
            main: colors.black,
            light: colors.greyDark,
            dark: colors.black,
            contrastText: colors.white,
        },
        secondary: {
            main: colors.grey,
            light: colors.greyMid,
            dark: colors.greyDark,
            contrastText: colors.white,
        },
        background: {
            default: colors.greyLightest,
            paper: colors.white,
        },
        text: {
            primary: colors.black,
            secondary: colors.grey,
            disabled: colors.greyLight,
        },
        divider: alpha(colors.black, 0.12),
    },

    typography: {
        fontFamily: '"Inter", "Roboto", "Arial", sans-serif',
        h1: { fontWeight: 700, fontSize: '3rem' },
        h2: { fontWeight: 700, fontSize: '2.5rem' },
        h3: { fontWeight: 600, fontSize: '2rem' },
        h4: { fontWeight: 600, fontSize: '1.5rem' },
        h5: { fontWeight: 600, fontSize: '1.25rem' },
        h6: { fontWeight: 600, fontSize: '1.125rem' },
        body1: { fontWeight: 400, fontSize: '1rem' },
        body2: { fontWeight: 400, fontSize: '0.875rem' },
        button: { fontWeight: 600, fontSize: '0.875rem', textTransform: 'none' as const },
    },

    shape: { borderRadius: 0 },

    components: {
        MuiCssBaseline: {
            styleOverrides: {
                'html, body, #root': { margin: 0, padding: 0, minHeight: '100vh' },
                '*': { boxSizing: 'border-box' },
            },
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    fontWeight: 600,
                    padding: '8px 20px',
                    boxShadow: 'none',
                    '&:hover': { boxShadow: 'none' },
                },
                sizeLarge: { padding: '12px 28px', fontSize: '1rem' },
                sizeSmall: { padding: '6px 12px', fontSize: '0.8125rem' },
            },
        },
        MuiAppBar: {
            styleOverrides: {
                root: {
                    boxShadow: `0 1px 3px ${alpha(colors.black, 0.08)}`,
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    boxShadow: `0 2px 8px ${alpha(colors.black, 0.08)}`,
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    boxShadow: `0 2px 4px ${alpha(colors.black, 0.06)}`,
                },
            },
        },
    },
});

export default theme;