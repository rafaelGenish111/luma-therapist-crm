// API Configuration
// Dynamic API URL based on environment
// Robust API base URL resolution with self-healing override
const OVERRIDE_KEY = 'API_BASE_URL_OVERRIDE';
const FAILED_MARKERS = ['-hnku.'];

function isBadUrl(url) {
  return FAILED_MARKERS.some(marker => typeof url === 'string' && url.includes(marker));
}

// בפרודקשן נשתמש בנתיב יחסי '/api' כדי לעבוד עם ה-rewrite של Vercel
const defaultProdUrl = '/api';
const envUrl = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) || '';
const storedOverride = (() => {
  try { return localStorage.getItem(OVERRIDE_KEY) || ''; } catch { return ''; }
})();

let resolvedBaseUrl = storedOverride || envUrl || (window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : defaultProdUrl);

// אם רץ על vercel.app וה-override מצביע ל-URL חיצוני — ננקה אותו
try {
  if (typeof window !== 'undefined' && /vercel\.app$/.test(window.location.host)) {
    if (storedOverride && /^https?:\/\//.test(storedOverride)) {
      localStorage.removeItem(OVERRIDE_KEY);
      resolvedBaseUrl = defaultProdUrl;
    }
  }
} catch {}

const API_BASE_URL = resolvedBaseUrl;

if (import.meta.env.DEV) {
  console.log('🔧 Current hostname:', window.location.hostname);
  console.log('🔧 Selected API_BASE_URL:', API_BASE_URL);
}

// יצירת instance של fetch מותאם
class ApiClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;

    if (import.meta.env.DEV) {
      console.log('API Request:', url, options);
    }

    // הוספת Authorization header אם יש token
    const token = localStorage.getItem('accessToken');

    // בדיקה אם זה FormData (להעלאת קבצים)
    const isFormData = options.body instanceof FormData;

    const headers = {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      ...options.headers,
    };

    // רק אם זה לא FormData, נוסיף Content-Type
    if (!isFormData && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      headers,
      credentials: 'include', // חשוב לCORS
      ...options,
    };

    // רק אם זה לא FormData, נהפוך לJSON
    if (config.body && typeof config.body === 'object' && !isFormData) {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);

      if (import.meta.env.DEV) {
        console.log('API Response:', response.status, response.statusText);
      }

      if (!response.ok) {
        // טיפול בשגיאות 401 - מחיקת token וניתוב להתחברות
        if (response.status === 401) {
          console.log('🔒 401 Unauthorized - Token expired or invalid');
          localStorage.removeItem('accessToken');
          localStorage.removeItem('lastActivity');

          // אם אנחנו לא בעמוד התחברות, נתן למשתמש אפשרות להתחבר מחדש
          if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
            if (confirm('ההתחברות פגה. האם תרצה להתחבר מחדש?')) {
              window.location.href = '/login';
            }
          }
        }

        // ננסה לקבל הודעת שגיאה מהשרת
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (e) {
          // אם לא ניתן לקרוא JSON, נשתמש בהודעה הבסיסית
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();
      if (import.meta.env.DEV) {
        console.log('API Response Data:', data);
      }
      return data;
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  // HTTP Methods
  get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: data,
    });
  }

  put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: data,
    });
  }

  delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }

  patch(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PATCH',
      body: data,
    });
  }
}

// יצירת instance יחיד
export const apiClient = new ApiClient(API_BASE_URL);

// Export נוסף לשימוש נוח
export default apiClient;
