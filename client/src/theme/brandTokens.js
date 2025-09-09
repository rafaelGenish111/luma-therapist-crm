// טוקני צבעים לפי הלוגו של Luma
export const brand = {
    // צבעים ראשיים
    primary: '#3BB9FF',   // טורקיז-כחול זוהר
    primaryDark: '#2795D6',
    primarySoft: '#E8F7FF',

    // צבעי טקסט
    text: '#0F172A',
    textSecondary: '#64748B',
    textMuted: '#94A3B8',

    // צבעי רקע
    surface: '#FFFFFF',
    surfaceAlt: '#F8FAFC',
    surfaceHover: '#F1F5F9',

    // צבעי מערכת
    success: '#10B981',
    successLight: '#34D399',
    successDark: '#059669',

    error: '#EF4444',
    errorLight: '#F87171',
    errorDark: '#DC2626',

    warning: '#F59E0B',
    warningLight: '#FBBF24',
    warningDark: '#D97706',

    info: '#3BB9FF',
    infoLight: '#E8F7FF',
    infoDark: '#2795D6',
};

// גרדיאנטים
export const gradients = {
    primary: `linear-gradient(135deg, ${brand.primary} 0%, ${brand.primaryDark} 100%)`,
    soft: `linear-gradient(135deg, ${brand.primarySoft} 0%, ${brand.surface} 100%)`,
    surface: `linear-gradient(135deg, ${brand.surface} 0%, ${brand.surfaceAlt} 100%)`,
};

// צללים
export const shadows = {
    small: `0 2px 8px ${brand.primary}20`,
    medium: `0 4px 12px ${brand.primary}30`,
    large: `0 8px 24px ${brand.primary}40`,
    card: '0 4px 12px rgba(0, 0, 0, 0.08)',
};

// רדיוסים
export const radius = {
    small: 4,
    medium: 8,
    large: 12,
    xl: 16,
    round: '50%',
};

// מרווחים
export const spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
};

// טיפוגרפיה
export const typography = {
    fontFamily: '"Heebo", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", sans-serif',
    fontWeight: {
        light: 300,
        regular: 400,
        medium: 500,
        semiBold: 600,
        bold: 700,
    },
    fontSize: {
        xs: '0.75rem',
        sm: '0.875rem',
        base: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
        '4xl': '2.25rem',
    },
};

// אנימציות
export const transitions = {
    fast: '0.15s ease-in-out',
    normal: '0.2s ease-in-out',
    slow: '0.3s ease-in-out',
};

// breakpoints
export const breakpoints = {
    xs: 0,
    sm: 600,
    md: 960,
    lg: 1280,
    xl: 1920,
};


