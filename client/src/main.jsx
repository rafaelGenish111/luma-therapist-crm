import React from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from 'react-query'
import App from './App'
import './index.css'
import './theme.css'
import './styles/dashboard.css'
import { AuthProvider } from './context/AuthContext'
import { CustomThemeProvider } from './context/ThemeContext'

// יצירת QueryClient
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 1,
            refetchOnWindowFocus: false,
            staleTime: 5 * 60 * 1000, // 5 דקות
        },
    },
});

// Force-unregister any existing Service Workers and clear caches (production only)
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  try {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      registrations.forEach(reg => reg.unregister());
    });
    if (window.caches) {
      caches.keys().then(keys => keys.forEach(key => caches.delete(key)));
    }
  } catch (e) {
    // swallow cleanup errors silently
  }
}

createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <QueryClientProvider client={queryClient}>
            <CustomThemeProvider>
                <AuthProvider>
                    <App />
                </AuthProvider>
            </CustomThemeProvider>
        </QueryClientProvider>
    </React.StrictMode>
) 