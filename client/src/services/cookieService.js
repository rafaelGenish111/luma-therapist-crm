// שירות לניהול קוקיז
class CookieService {
    // שמירת קוקי
    setCookie(name, value, days = 30) {
        const expires = new Date();
        expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
        document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
    }

    // קריאת קוקי
    getCookie(name) {
        const nameEQ = name + "=";
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    }

    // מחיקת קוקי
    deleteCookie(name) {
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
    }

    // בדיקה אם המשתמש נתן הסכמה לקוקיז
    hasConsent() {
        const consent = localStorage.getItem('cookie_consent_v1');
        if (!consent) return false;

        try {
            const consentData = JSON.parse(consent);
            return consentData.necessary === true;
        } catch {
            return false;
        }
    }

    // קבלת סוג ההסכמה
    getConsentType() {
        const consent = localStorage.getItem('cookie_consent_v1');
        if (!consent) return null;

        try {
            const consentData = JSON.parse(consent);
            return {
                necessary: consentData.necessary || false,
                analytics: consentData.analytics || false,
                date: consentData.date || null
            };
        } catch {
            return null;
        }
    }

    // שמירת העדפות משתמש
    saveUserPreferences(preferences) {
        if (this.hasConsent()) {
            this.setCookie('userPreferences', JSON.stringify(preferences), 365);
        }
    }

    // קריאת העדפות משתמש
    getUserPreferences() {
        const preferences = this.getCookie('userPreferences');
        if (preferences) {
            try {
                return JSON.parse(preferences);
            } catch {
                return null;
            }
        }
        return null;
    }

    // שמירת נתוני אנליטיקס (אם המשתמש הסכים)
    saveAnalyticsData(data) {
        const consent = this.getConsentType();
        if (consent && consent.analytics) {
            this.setCookie('analyticsData', JSON.stringify(data), 30);
        }
    }

    // קריאת נתוני אנליטיקס
    getAnalyticsData() {
        const data = this.getCookie('analyticsData');
        if (data) {
            try {
                return JSON.parse(data);
            } catch {
                return null;
            }
        }
        return null;
    }

    // ניקוי כל הקוקיז (למקרה של דחייה)
    clearAllCookies() {
        const cookies = document.cookie.split(";");
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i];
            const eqPos = cookie.indexOf("=");
            const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
            this.deleteCookie(name.trim());
        }
    }

    // בדיקה אם זה הפעם הראשונה שהמשתמש מבקר
    isFirstVisit() {
        return !this.getCookie('firstVisit');
    }

    // סימון ביקור ראשון
    markFirstVisit() {
        this.setCookie('firstVisit', 'true', 365);
    }

    // שמירת הסכמה לקוקיז
    saveConsent(necessary = true, analytics = false) {
        const consentData = {
            necessary,
            analytics,
            date: Date.now()
        };
        localStorage.setItem('cookie_consent_v1', JSON.stringify(consentData));

        // אם המשתמש דחה אנליטיקס, נקה קוקיז לא הכרחיים
        if (!analytics) {
            this.clearNonEssentialCookies();
        }
    }

    // ניקוי קוקיז לא הכרחיים
    clearNonEssentialCookies() {
        const nonEssentialCookies = [
            'analyticsData',
            'userPreferences',
            'firstVisit'
        ];

        nonEssentialCookies.forEach(cookieName => {
            this.deleteCookie(cookieName);
        });
    }

    // בדיקה אם הסכמה פגה (לאחר שנה)
    isConsentExpired() {
        const consent = this.getConsentType();
        if (!consent || !consent.date) return true;

        const oneYear = 365 * 24 * 60 * 60 * 1000; // שנה במילישניות
        return (Date.now() - consent.date) > oneYear;
    }

    // איפוס הסכמה (לצורך הצגה מחדש)
    resetConsent() {
        localStorage.removeItem('cookie_consent_v1');
        this.clearAllCookies();
    }
}

export default new CookieService();
