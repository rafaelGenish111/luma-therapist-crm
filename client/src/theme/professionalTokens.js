// Professional Design System for Luma Therapist CRM
// פלטת צבעים רגועה ומקצועית

export const professionalTokens = {
    // צבעים עיקריים
    colors: {
        // כחול עמוק (Header): #2B5A87 - כחול רגוע ומקצועי
        primary: '#2B5A87',
        // כחול בהיר (כותרות): #4A90E2 - נעים לעין ולא אגרסיבי
        primaryLight: '#4A90E2',
        // אפור כהה (טקסט ראשי): #2C3E50 - קריא ומקצועי
        textPrimary: '#2C3E50',
        // אפור בהיר (טקסט משני): #7F8C8D - עדין ונעים
        textSecondary: '#7F8C8D',
        // רקע לבן: #FFFFFF - נקי ובהיר
        background: '#FFFFFF',
        // רקע משני: #F8F9FA - לבן חם מעט
        backgroundSecondary: '#F8F9FA',

        // צבעים פונקציונליים
        success: '#27AE60', // ירוק רגוע
        warning: '#F39C12', // כתום מתון
        error: '#E74C3C',   // אדום לא אגרסיבי
        info: '#3498DB',    // כחול מידע

        // צבעי Header Dynamic Island
        headerBackground: 'rgba(43, 90, 135, 0.95)', // #2B5A87 עם שקיפות
        headerText: '#FFFFFF',
        headerHover: 'rgba(74, 144, 226, 0.1)', // #4A90E2 עם שקיפות
    },

    // Typography
    typography: {
        fontFamily: '"Assistant", "Rubik", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
        fontFamilyHebrew: '"Assistant", "Rubik", sans-serif',

        // גדלים
        fontSize: {
            h1: '2.5rem',
            h2: '2rem',
            h3: '1.5rem',
            h4: '1.25rem',
            body: '1rem',
            small: '0.875rem',
        },

        // משקלים
        fontWeight: {
            regular: 400,
            medium: 500,
            semibold: 600,
            bold: 700,
            extrabold: 800,
        },

        // גובה שורה
        lineHeight: {
            tight: 1.2,
            normal: 1.5,
            relaxed: 1.7,
        },
    },

    // Spacing
    spacing: {
        xs: '8px',
        sm: '16px',
        md: '24px',
        lg: '32px',
        xl: '48px',
        xxl: '64px',
        xxxl: '80px',
    },

    // Border Radius
    borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        xxl: '20px',
        full: '50px',
    },

    // Shadows
    shadows: {
        sm: '0 1px 3px rgba(0, 0, 0, 0.1)',
        md: '0 2px 10px rgba(0, 0, 0, 0.1)',
        lg: '0 4px 20px rgba(0, 0, 0, 0.1)',
        xl: '0 8px 32px rgba(0, 0, 0, 0.15)',
    },

    // Transitions
    transitions: {
        fast: '0.2s ease',
        normal: '0.3s ease',
        slow: '0.5s ease',
    },

    // Breakpoints
    breakpoints: {
        mobile: '576px',
        tablet: '768px',
        desktop: '992px',
        large: '1200px',
    },

    // Container
    container: {
        maxWidth: '1200px',
        padding: '0 24px',
    },

    // Header Styles
    header: {
        height: '80px',
        background: 'rgba(43, 90, 135, 0.95)',
        backdropFilter: 'blur(20px)',
        borderRadius: '50px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
        transition: 'all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)',

        // States
        expanded: {
            minWidth: '420px',
            padding: '18px 28px',
        },
        collapsed: {
            minWidth: '160px',
            padding: '14px 24px',
        }
    },

    // Button Styles
    buttons: {
        primary: {
            background: 'linear-gradient(135deg, #2B5A87, #4A90E2)',
            color: '#FFFFFF',
            padding: '12px 24px',
            borderRadius: '8px',
            fontSize: '1rem',
            fontWeight: 600,
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 2px 10px rgba(43, 90, 135, 0.3)',

            hover: {
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 20px rgba(43, 90, 135, 0.4)',
            }
        },

        secondary: {
            background: 'transparent',
            color: '#2B5A87',
            padding: '12px 24px',
            borderRadius: '8px',
            fontSize: '1rem',
            fontWeight: 600,
            border: '2px solid #2B5A87',
            cursor: 'pointer',
            transition: 'all 0.3s ease',

            hover: {
                background: '#2B5A87',
                color: '#FFFFFF',
                transform: 'translateY(-1px)',
            }
        }
    },

    // Card Styles
    cards: {
        background: '#FFFFFF',
        borderRadius: '12px',
        padding: '32px',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
        border: '1px solid rgba(43, 90, 135, 0.1)',
        transition: 'all 0.3s ease',

        hover: {
            transform: 'translateY(-4px)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
            borderColor: 'rgba(74, 144, 226, 0.2)',
        }
    },

    // Navigation Styles
    navigation: {
        item: {
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: 500,
            color: 'rgba(255, 255, 255, 0.8)',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',

            hover: {
                opacity: 1,
                background: 'rgba(74, 144, 226, 0.1)',
                transform: 'translateY(-1px)',
            },

            active: {
                opacity: 1,
                color: '#4A90E2',
                fontWeight: 600,
                background: 'rgba(74, 144, 226, 0.1)',
            }
        }
    }
};

// Utility functions
export const getResponsiveValue = (mobile, tablet, desktop) => {
    return `clamp(${mobile}, ${tablet}, ${desktop})`;
};

export const createGradient = (color1, color2, direction = '135deg') => {
    return `linear-gradient(${direction}, ${color1}, ${color2})`;
};

export const createShadow = (color, opacity = 0.1) => {
    return `0 2px 10px rgba(${color}, ${opacity})`;
};
