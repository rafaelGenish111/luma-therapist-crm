import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import manifest from './public/manifest.json'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isProduction = mode === 'production';
  
  return {
    resolve: {
      dedupe: ['react', 'react-dom']
    },
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: null, // ידני - נרשום אחרי הטעינה
        includeAssets: [
          '/icons/icon-192.png',
          '/icons/icon-512.png',
          '/icons/icon-512-maskable.png',
          '/icons/shortcut-appointments.png',
          '/icons/shortcut-clients.png',
        ],
        manifest,
        workbox: {
          navigateFallback: '/index.html',
          globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
          runtimeCaching: [
            {
              urlPattern: ({ request }) => request.destination === 'document',
              handler: 'NetworkFirst',
              options: {
                cacheName: 'documents',
                networkTimeoutSeconds: 3
              }
            },
            {
              urlPattern: ({ request }) => ['style', 'script', 'worker'].includes(request.destination),
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'assets'
              }
            },
            {
              urlPattern: ({ request }) => ['image', 'font'].includes(request.destination),
              handler: 'CacheFirst',
              options: {
                cacheName: 'media',
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
      fs: {
        strict: false
      },
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
      sourcemap: !isProduction,
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: isProduction,
          drop_debugger: true,
          pure_funcs: isProduction ? ['console.log', 'console.info'] : []
        }
      },
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (id.includes('node_modules')) {
              if (id.includes('@mui/material')) {
                return 'mui-material';
              }
              if (id.includes('@mui/icons-material')) {
                return 'mui-icons';
              }
              if (id.includes('@mui/x-')) {
                return 'mui-x';
              }
              if (id.includes('react') || id.includes('react-dom')) {
                return 'react-vendor';
              }
              if (id.includes('react-router')) {
                return 'react-router';
              }
              if (id.includes('framer-motion')) {
                return 'framer-motion';
              }
              if (id.includes('@emotion')) {
                return 'emotion';
              }
              if (id.includes('date-fns')) {
                return 'date-fns';
              }
              if (id.includes('axios')) {
                return 'axios';
              }
              return 'vendor';
            }
          },
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
          assetFileNames: 'assets/[ext]/[name]-[hash].[ext]'
        }
      },
      chunkSizeWarningLimit: 1000,
      assetsInlineLimit: 4096
    },
    define: {
      global: 'globalThis',
    },
    esbuild: {
      loader: 'jsx',
      include: /src\/.*\.jsx?$/,
      exclude: [],
      logOverride: { 'this-is-undefined-in-esm': 'silent' }
    },
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        '@mui/material',
        '@mui/icons-material',
        '@emotion/react',
        '@emotion/styled'
      ],
      esbuildOptions: {
        loader: {
          '.js': 'jsx',
        },
      },
    },
  };
});