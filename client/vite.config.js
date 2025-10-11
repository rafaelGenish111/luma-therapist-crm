import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import manifest from './public/manifest.json'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'auto',
        includeAssets: [
          '/icons/icon-192.png',
          '/icons/icon-512.png',
          '/icons/icon-512-maskable.png',
          '/icons/shortcut-appointments.png',
          '/icons/shortcut-clients.png',
        ],
        manifest,
        workbox: {
          skipWaiting: true,
          clientsClaim: true,
          cleanupOutdatedCaches: true,
          navigateFallback: '/index.html',
          globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
          runtimeCaching: [
            {
              urlPattern: ({ request }) => request.destination === 'document',
              handler: 'NetworkFirst',
            },
            {
              urlPattern: ({ request }) => ['style', 'script', 'worker'].includes(request.destination),
              handler: 'StaleWhileRevalidate',
            },
            {
              urlPattern: ({ request }) => ['image', 'font'].includes(request.destination),
              handler: 'CacheFirst',
              options: {
                cacheName: 'assets',
                expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
              },
            },
          ],
        },
      }),
    ],
    server: {
      port: 8000,
      host: '0.0.0.0',
      strictPort: true, // אל תחליף פורט אוטומטית – ימנע מעבר ל-8001
      proxy: mode === 'development' ? {
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:5000',
          changeOrigin: true,
          secure: false,
        },
      } : undefined,
    },
    preview: {
      host: true,
      port: 4173,
      allowedHosts: true,
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-mui': ['@mui/material', '@mui/icons-material', '@mui/x-data-grid', '@mui/x-date-pickers'],
            'vendor-charts': ['recharts', '@mui/x-charts'],
            'vendor-calendar': ['react-big-calendar', 'moment', 'date-fns'],
            'vendor-forms': ['formik', 'yup', 'react-hook-form'],
            'vendor-utils': ['axios', 'lodash'],
          },
        },
      },
    },
    define: {
      global: 'globalThis',
    },
    esbuild: {
      loader: 'jsx',
      include: /src\/.*\.jsx?$/,
      exclude: [],
    },
    optimizeDeps: {
      esbuildOptions: {
        loader: {
          '.js': 'jsx',
        },
      },
    },
  };
});