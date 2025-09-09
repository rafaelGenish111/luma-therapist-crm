import api from './api';

const calendlyService = {
    // קבלת הגדרות Calendly של המטפלת
    getSettings: () => api.get('/calendly/settings'),

    // עדכון הגדרות Calendly
    updateSettings: (settings) => api.put('/calendly/settings', settings),

    // הוספת סוג אירוע חדש
    createEventType: (eventType) => api.post('/calendly/event-types', eventType),

    // עדכון סוג אירוע
    updateEventType: (eventId, eventType) => api.put(`/calendly/event-types/${eventId}`, eventType),

    // מחיקת סוג אירוע
    deleteEventType: (eventId) => api.delete(`/calendly/event-types/${eventId}`),

    // אימות חיבור Calendly
    verifyConnection: () => api.post('/calendly/verify'),

    // קבלת נתוני Calendly ציבוריים לאתר האישי
    getPublicData: (therapistId) => api.get(`/calendly/public/${therapistId}`),

    // פונקציות עזר
    generateEmbedCode: (username, eventType = null, options = {}) => {
        const baseUrl = `https://calendly.com/${username}`;
        const eventUrl = eventType ? `${baseUrl}/${eventType}` : baseUrl;

        const defaultOptions = {
            height: '630',
            hideEventTypeDetails: false,
            hideGdprBanner: true,
            primaryColor: '#4A90E2',
            textColor: '#333333',
            backgroundColor: '#ffffff'
        };

        const finalOptions = { ...defaultOptions, ...options };

        return `<div class="calendly-inline-widget" data-url="${eventUrl}?hide_event_type_details=${finalOptions.hideEventTypeDetails ? '1' : '0'}&hide_gdpr_banner=${finalOptions.hideGdprBanner ? '1' : '0'}&primary_color=${finalOptions.primaryColor.replace('#', '')}&text_color=${finalOptions.textColor.replace('#', '')}&background_color=${finalOptions.backgroundColor.replace('#', '')}" style="min-width:320px;height:${finalOptions.height}px;"></div>
<script type="text/javascript" src="https://assets.calendly.com/assets/external/widget.js" async></script>`;
    },

    // בדיקת תקינות שם משתמש Calendly
    validateUsername: (username) => {
        const usernameRegex = /^[a-z0-9-_]{3,50}$/;
        return usernameRegex.test(username);
    },

    // בדיקת תקינות קוד הטמעה
    validateEmbedCode: (embedCode) => {
        if (!embedCode) return false;
        return embedCode.includes('calendly.com') &&
            (embedCode.includes('iframe') || embedCode.includes('script') || embedCode.includes('calendly-inline-widget'));
    },

    // חילוץ שם משתמש מכתובת Calendly
    extractUsernameFromUrl: (url) => {
        const match = url.match(/calendly\.com\/([a-z0-9-_]+)/);
        return match ? match[1] : null;
    },

    // יצירת קישור לניהול Calendly
    getManagementUrl: (username) => {
        return username ? `https://calendly.com/${username}` : 'https://calendly.com';
    },

    // פורמט נתוני אירוע לתצוגה
    formatEventType: (eventType) => {
        const hours = Math.floor(eventType.duration / 60);
        const minutes = eventType.duration % 60;

        let durationText = '';
        if (hours > 0) {
            durationText += `${hours} שעות`;
            if (minutes > 0) durationText += ` ו-${minutes} דקות`;
        } else {
            durationText = `${minutes} דקות`;
        }

        return {
            ...eventType,
            formattedDuration: durationText,
            formattedPrice: eventType.price ? `₪${eventType.price}` : 'ללא עלות'
        };
    },

    // יצירת הגדרות ברירת מחדל
    getDefaultSettings: () => ({
        isEnabled: false,
        username: '',
        embedCode: '',
        eventTypes: [],
        settings: {
            hideEventTypesDetails: false,
            hideGdprBanner: true,
            primaryColor: '#4A90E2',
            textColor: '#333333',
            backgroundColor: '#FFFFFF'
        },
        isVerified: false
    }),

    // יצירת אירוע ברירת מחדל
    getDefaultEventType: () => ({
        name: '',
        duration: 60,
        price: 0,
        description: '',
        calendlyUrl: '',
        isActive: true
    })
};

export default calendlyService;
