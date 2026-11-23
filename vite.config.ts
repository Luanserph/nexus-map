import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const isTauriBuild = Boolean(process.env.TAURI_ENV_PLATFORM);

// https://vite.dev/config/
export default defineConfig({
  clearScreen: false,
  server: {
    port: 5173,
    strictPort: true,
  },
  plugins: [
    react(),
    tailwindcss(),
    ...(!isTauriBuild
      ? [
          VitePWA({
            registerType: 'autoUpdate',
            includeAssets: [
              'favicon.svg',
              'apple-touch-icon.png',
              'pwa-192x192.png',
              'pwa-512x512.png',
            ],
            manifest: {
              name: 'Nexus Maps',
              short_name: 'Nexus Maps',
              description:
                'Central de Cartografia Gamer — Mapas Interativos Offline-First',
              theme_color: '#07090f',
              background_color: '#07090f',
              display: 'standalone',
              start_url: '/',
              scope: '/',
              icons: [
                {
                  src: '/pwa-192x192.png',
                  sizes: '192x192',
                  type: 'image/png',
                },
                {
                  src: '/pwa-512x512.png',
                  sizes: '512x512',
                  type: 'image/png',
                  purpose: 'any maskable',
                },
                {
                  src: '/favicon.svg',
                  sizes: 'any',
                  type: 'image/svg+xml',
                },
              ],
            },
            workbox: {
              // Cache only the lightweight app shell (never precache tiles or lazy per-game JSON chunks)
              globPatterns: ['**/*.{js,css,html,ico,svg}'],
              globIgnores: ['tiles/**', 'games/**', '**/*.webp', '**/markers-*.js', '**/regions-*.js', '**/guides-*.js'],
              maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
              navigateFallback: '/index.html',
              runtimeCaching: [
                {
                  urlPattern: ({ url }) => url.pathname.startsWith('/tiles/'),
                  handler: 'CacheFirst',
                  options: {
                    cacheName: 'nexus-map-tiles',
                    expiration: {
                      maxEntries: 400,
                      maxAgeSeconds: 60 * 60 * 24 * 30,
                    },
                    cacheableResponse: {
                      statuses: [0, 200],
                    },
                  },
                },
                {
                  urlPattern: ({ url }) => url.pathname.startsWith('/games/'),
                  handler: 'CacheFirst',
                  options: {
                    cacheName: 'nexus-game-assets',
                    expiration: {
                      maxEntries: 60,
                      maxAgeSeconds: 60 * 60 * 24 * 30,
                    },
                    cacheableResponse: {
                      statuses: [0, 200],
                    },
                  },
                },
              ],
            },
          }),
        ]
      : []),
  ],
});
