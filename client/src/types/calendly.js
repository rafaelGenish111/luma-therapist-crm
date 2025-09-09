/**
 * Calendly Types and Constants
 * Type definitions and enums for Calendly integration
 */

export const CalendlySetupStatus = {
    NOT_STARTED: 'not_started',
    UNCONFIGURED: 'unconfigured',
    IN_PROGRESS: 'in_progress',
    CONNECTED: 'connected',
    COMPLETED: 'completed',
    ERROR: 'error',
    // Aliases for backward compatibility
    ACTIVE: 'completed'
};

export const CalendlyConnectionSteps = {
    FEATURE_ACCESS: 'feature_access',
    OAUTH_REDIRECT: 'oauth_redirect',
    OAUTH_CALLBACK: 'oauth_callback',
    WEBHOOK_SETUP: 'webhook_setup',
    CONFIGURATION: 'configuration',
    ACTIVE: 'active'
};

export const CalendlyErrors = {
    NO_FEATURE_ACCESS: 'NO_FEATURE_ACCESS',
    OAUTH_FAILED: 'OAUTH_FAILED',
    TOKEN_EXPIRED: 'TOKEN_EXPIRED',
    WEBHOOK_FAILED: 'WEBHOOK_FAILED',
    CONFIG_INVALID: 'CONFIG_INVALID',
    CONNECTION_LOST: 'CONNECTION_LOST'
};

export const CalendlyFeatures = {
    INLINE_EMBED: 'inline_embed',
    POPUP_WIDGET: 'popup_widget',
    EVENT_TYPES: 'event_types',
    CUSTOM_BRANDING: 'custom_branding',
    ANALYTICS: 'analytics'
};

/**
 * Default embed configuration
 */
export const defaultEmbedConfig = {
    hideEventTypeDetails: false,
    hideGdprBanner: true,
    primaryColor: '#4A90E2',
    textColor: '#333333',
    backgroundColor: '#FFFFFF',
    hideGitcamFooter: true,
    hideCalendlyFooter: false,
    height: 630,
    branding: true,
    inlineEmbed: true,
    popupWidget: false
};

/**
 * Setup status display names in Hebrew
 */
export const setupStatusLabels = {
    [CalendlySetupStatus.NOT_STARTED]: 'לא הוגדר',
    [CalendlySetupStatus.UNCONFIGURED]: 'לא מוגדר',
    [CalendlySetupStatus.IN_PROGRESS]: 'בתהליך הגדרה',
    [CalendlySetupStatus.CONNECTED]: 'מחובר',
    [CalendlySetupStatus.COMPLETED]: 'פעיל',
    [CalendlySetupStatus.ERROR]: 'שגיאה'
};

/**
 * Setup status colors for UI
 */
export const setupStatusColors = {
    [CalendlySetupStatus.NOT_STARTED]: 'gray',
    [CalendlySetupStatus.UNCONFIGURED]: 'orange',
    [CalendlySetupStatus.IN_PROGRESS]: 'blue',
    [CalendlySetupStatus.CONNECTED]: 'green',
    [CalendlySetupStatus.COMPLETED]: 'green',
    [CalendlySetupStatus.ERROR]: 'red'
};

/**
 * Connection step labels
 */
export const connectionStepLabels = {
    [CalendlyConnectionSteps.FEATURE_ACCESS]: 'בדיקת הרשאות',
    [CalendlyConnectionSteps.OAUTH_REDIRECT]: 'הפניה ל-Calendly',
    [CalendlyConnectionSteps.OAUTH_CALLBACK]: 'קבלת הרשאות',
    [CalendlyConnectionSteps.WEBHOOK_SETUP]: 'הגדרת webhooks',
    [CalendlyConnectionSteps.CONFIGURATION]: 'הגדרת תצורה',
    [CalendlyConnectionSteps.ACTIVE]: 'פעיל'
};

/**
 * Error messages in Hebrew
 */
export const errorMessages = {
    [CalendlyErrors.NO_FEATURE_ACCESS]: 'אין הרשאה לגשת ל-Calendly. יש לשדרג את התוכנית.',
    [CalendlyErrors.OAUTH_FAILED]: 'שגיאה בחיבור ל-Calendly. נסה שוב.',
    [CalendlyErrors.TOKEN_EXPIRED]: 'פג תוקף החיבור ל-Calendly. יש להתחבר מחדש.',
    [CalendlyErrors.WEBHOOK_FAILED]: 'שגיאה בהגדרת webhooks של Calendly.',
    [CalendlyErrors.CONFIG_INVALID]: 'הגדרות Calendly לא תקינות.',
    [CalendlyErrors.CONNECTION_LOST]: 'החיבור ל-Calendly אבד. יש להתחבר מחדש.'
};

/**
 * Helper functions
 */
export const CalendlyHelpers = {
    /**
     * Check if setup status indicates an active connection
     */
    isActive: (status) => {
        return status === CalendlySetupStatus.COMPLETED ||
            status === CalendlySetupStatus.CONNECTED;
    },

    /**
     * Check if setup status indicates an error state
     */
    hasError: (status) => {
        return status === CalendlySetupStatus.ERROR;
    },

    /**
     * Check if setup status indicates setup is in progress
     */
    isInProgress: (status) => {
        return status === CalendlySetupStatus.IN_PROGRESS;
    },

    /**
     * Check if setup hasn't started yet
     */
    notStarted: (status) => {
        return status === CalendlySetupStatus.NOT_STARTED ||
            status === CalendlySetupStatus.UNCONFIGURED;
    },

    /**
     * Get next step in setup process
     */
    getNextStep: (currentStatus) => {
        switch (currentStatus) {
            case CalendlySetupStatus.NOT_STARTED:
            case CalendlySetupStatus.UNCONFIGURED:
                return CalendlyConnectionSteps.OAUTH_REDIRECT;
            case CalendlySetupStatus.IN_PROGRESS:
                return CalendlyConnectionSteps.OAUTH_CALLBACK;
            case CalendlySetupStatus.CONNECTED:
                return CalendlyConnectionSteps.CONFIGURATION;
            case CalendlySetupStatus.COMPLETED:
                return CalendlyConnectionSteps.ACTIVE;
            default:
                return CalendlyConnectionSteps.FEATURE_ACCESS;
        }
    },

    /**
     * Format scheduling URL
     */
    formatSchedulingUrl: (username) => {
        return username ? `https://calendly.com/${username}` : null;
    },

    /**
     * Validate embed config
     */
    validateEmbedConfig: (config) => {
        const errors = [];

        if (config.height && (config.height < 400 || config.height > 1200)) {
            errors.push('גובה חייב להיות בין 400 ל-1200 פיקסלים');
        }

        if (config.primaryColor && !/^#[0-9A-Fa-f]{6}$/.test(config.primaryColor)) {
            errors.push('צבע ראשי לא תקין');
        }

        if (config.textColor && !/^#[0-9A-Fa-f]{6}$/.test(config.textColor)) {
            errors.push('צבע טקסט לא תקין');
        }

        if (config.backgroundColor && !/^#[0-9A-Fa-f]{6}$/.test(config.backgroundColor)) {
            errors.push('צבע רקע לא תקין');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }
};

/**
 * JSDoc type definitions for better IDE support
 */

/**
 * @typedef {Object} CalendlyState
 * @property {string} setupStatus - Current setup status
 * @property {boolean} connected - Whether Calendly is connected
 * @property {Object} embedConfig - Embed configuration
 * @property {string|null} schedulingLink - Calendly scheduling URL
 * @property {string|null} username - Calendly username
 * @property {boolean} isEnabled - Whether Calendly is enabled
 * @property {boolean} isVerified - Whether connection is verified
 * @property {string|null} lastSyncAt - Last sync timestamp
 */

/**
 * @typedef {Object} CalendlyConnectResponse
 * @property {string} redirectUrl - OAuth redirect URL
 * @property {string} state - Encrypted state data
 * @property {string} setupStatus - Updated setup status
 * @property {Date} expiresAt - URL expiration time
 */

/**
 * @typedef {Object} EmbedConfig
 * @property {boolean} hideEventTypeDetails
 * @property {boolean} hideGdprBanner
 * @property {string} primaryColor
 * @property {string} textColor
 * @property {string} backgroundColor
 * @property {boolean} hideGitcamFooter
 * @property {boolean} hideCalendlyFooter
 * @property {number} height
 * @property {boolean} branding
 * @property {boolean} inlineEmbed
 * @property {boolean} popupWidget
 */

export default {
    CalendlySetupStatus,
    CalendlyConnectionSteps,
    CalendlyErrors,
    CalendlyFeatures,
    defaultEmbedConfig,
    setupStatusLabels,
    setupStatusColors,
    connectionStepLabels,
    errorMessages,
    CalendlyHelpers
};
