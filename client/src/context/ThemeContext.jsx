import React, { createContext, useContext, useState, useMemo } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { brand, gradients, shadows, transitions } from '../theme/brandTokens';

const ThemeContext = createContext();

export const useThemeSettings = () => useContext(ThemeContext);

const defaultFontSize = localStorage.getItem('fontSize') || 'medium';
const defaultLang = localStorage.getItem('lang') || 'he';
const defaultDarkMode = localStorage.getItem('darkMode') === 'true';

export const CustomThemeProvider = ({ children }) => {
    const [darkMode, setDarkMode] = useState(defaultDarkMode);
    const [fontSize, setFontSize] = useState(defaultFontSize);
    const [lang, setLang] = useState(defaultLang);

    const theme = useMemo(() => {
        let fontSizePx = 16;
        if (fontSize === 'small') fontSizePx = 14;
        if (fontSize === 'large') fontSizePx = 18;
        return createTheme({
            direction: 'rtl',
            palette: {
                mode: darkMode ? 'dark' : 'light',
                primary: {
                    main: brand.primary, // טורקיז-כחול זוהר
                    light: brand.primarySoft,
                    dark: brand.primaryDark,
                },
                secondary: {
                    main: brand.textSecondary, // אפור-כחול
                    light: brand.textMuted,
                    dark: '#475569',
                },
                success: {
                    main: '#10B981', // ירוק
                    light: '#34D399',
                    dark: '#059669',
                },
                error: {
                    main: '#EF4444', // אדום
                    light: '#F87171',
                    dark: '#DC2626',
                },
                warning: {
                    main: '#F59E0B', // כתום
                    light: '#FBBF24',
                    dark: '#D97706',
                },
                info: {
                    main: brand.primary,
                    light: brand.primarySoft,
                    dark: brand.primaryDark,
                },
                background: {
                    default: darkMode ? '#0F172A' : brand.surfaceAlt,
                    paper: darkMode ? '#1E293B' : brand.surface,
                },
                text: {
                    primary: darkMode ? '#F1F5F9' : brand.text,
                    secondary: darkMode ? '#94A3B8' : brand.textSecondary,
                }
            },
            typography: {
                fontSize: fontSizePx,
                fontFamily: '"Segoe UI", "Roboto", "Helvetica Neue", "Arial", sans-serif',
            },
            components: {
                MuiButton: {
                    styleOverrides: {
                        root: {
                            borderRadius: 8,
                            textTransform: 'none',
                            fontWeight: 600,
                            transition: transitions.normal,
                        },
                        contained: {
                            backgroundColor: brand.primary,
                            color: '#FFFFFF',
                            boxShadow: shadows.small,
                            '&:hover': {
                                backgroundColor: brand.primaryDark,
                                boxShadow: shadows.medium,
                                transform: 'translateY(-1px)',
                            },
                        },
                        outlined: {
                            borderColor: brand.primary,
                            color: brand.primary,
                            '&:hover': {
                                backgroundColor: brand.primarySoft,
                                borderColor: brand.primaryDark,
                            },
                        },
                    },
                },
                MuiCard: {
                    styleOverrides: {
                        root: {
                            borderRadius: 12,
                            boxShadow: shadows.card,
                            border: `1px solid ${brand.surfaceAlt}`,
                        },
                    },
                },
                MuiAppBar: {
                    styleOverrides: {
                        root: {
                            background: gradients.primary,
                            boxShadow: shadows.small,
                        },
                    },
                },
                MuiFab: {
                    styleOverrides: {
                        root: {
                            backgroundColor: brand.primary,
                            color: '#FFFFFF',
                            '&:hover': {
                                backgroundColor: brand.primaryDark,
                                transform: 'scale(1.05)',
                            },
                        },
                    },
                },
                MuiChip: {
                    styleOverrides: {
                        root: {
                            backgroundColor: brand.primarySoft,
                            color: brand.primary,
                            '&.MuiChip-colorPrimary': {
                                backgroundColor: brand.primary,
                                color: '#FFFFFF',
                            },
                        },
                    },
                },
            },
        });
    }, [darkMode, fontSize]);

    const toggleDarkMode = () => {
        setDarkMode((prev) => {
            localStorage.setItem('darkMode', !prev);
            return !prev;
        });
    };

    const changeFontSize = (size) => {
        setFontSize(size);
        localStorage.setItem('fontSize', size);
    };

    const changeLang = (newLang) => {
        setLang(newLang);
        localStorage.setItem('lang', newLang);
        // כאן אפשר להפעיל i18n.changeLanguage(newLang) אם יש לך i18n
    };

    return (
        <ThemeContext.Provider value={{ darkMode, toggleDarkMode, fontSize, changeFontSize, lang, changeLang }}>
            <ThemeProvider theme={theme}>{children}</ThemeProvider>
        </ThemeContext.Provider>
    );
}; 