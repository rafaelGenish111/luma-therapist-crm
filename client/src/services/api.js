import axios from 'axios';

// Robust base URL resolution aligned with config/api.js
const OVERRIDE_KEY = 'API_BASE_URL_OVERRIDE';
const FAILED_MARKERS = ['-hnku.'];

const fixBadUrl = (url) => {
    if (!url) return url;
    return FAILED_MARKERS.some(m => url.includes(m))
        ? 'https://luma-therapist-cu4gmw082-rafaelgenish111s-projects.vercel.app/api'
        : url;
};

const getBaseURL = () => {
    if (import.meta.env.DEV) {
        const stored = (() => { try { return localStorage.getItem(OVERRIDE_KEY) || ''; } catch { return ''; } })();
        if (stored) return fixBadUrl(stored);
        // בפיתוח - דרך ה-proxy
        return '/api';
    }
    // בפרודקשן: השתמש בנתיב יחסי '/api' כדי לנצל את ה-rewrite של Vercel
    // ננקה override ישן שמצביע לדומיין חיצוני כדי למנוע CORS/SSO
    const envUrl = (import.meta.env.VITE_API_URL || '').toString();
    const stored = (() => { try { return localStorage.getItem(OVERRIDE_KEY) || ''; } catch { return ''; } })();

    // אם רץ על vercel.app ויש override מוחלט (http/https) — נבטל אותו
    try {
        if (typeof window !== 'undefined' && /vercel\.app$/.test(window.location.host)) {
            if (stored && /^https?:\/\//.test(stored)) {
                localStorage.removeItem(OVERRIDE_KEY);
            }
        }
    } catch {}

    // אם הוגדר במפורש VITE_API_URL נשתמש בו, אחרת ברירת מחדל יחסית
    const defaultUrl = '/api';
    const candidate = envUrl || defaultUrl;
    const fixed = fixBadUrl(candidate);
    try { if (fixed !== stored) localStorage.setItem(OVERRIDE_KEY, fixed); } catch {}
    return fixed;
};

const api = axios.create({
    baseURL: getBaseURL(),
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 60000 // 60 שניות timeout
});

// Request interceptor - הוספת token לכל בקשה
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - טיפול בשגיאות ורענון טוקן
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // אם קיבלנו 401 ולא ניסינו כבר לרענן
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                // נסה לרענן את הטוקן
                const refreshResponse = await axios.post(
                    `${getBaseURL()}/auth/refresh`,
                    {},
                    { withCredentials: true }
                );

                if (refreshResponse.data?.success) {
                    const newToken = refreshResponse.data.data.accessToken;
                    localStorage.setItem('accessToken', newToken);
                    originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
                    return api(originalRequest);
                }
            } catch (refreshError) {
                localStorage.removeItem('accessToken');
                if (window.location.pathname !== '/login') {
                    window.location.href = '/login';
                }
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;