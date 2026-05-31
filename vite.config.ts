
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'Flowify: Rap Simülatörü',
        short_name: 'Flowify',
        description: 'Kendi rap kariyerini yönet, şarkılar yap ve zirveye tırman!',
        theme_color: '#000000',
        background_color: '#000000',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'https://i.ibb.co/XxZ9Ft3Z/logobeyaz2.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'https://i.ibb.co/XxZ9Ft3Z/logobeyaz2.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'https://i.ibb.co/XxZ9Ft3Z/logobeyaz2.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,mp3,wav}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/i\.ibb\.co\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'external-images',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 Days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-stylesheets',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 Year
              }
            }
          }
        ]
      }
    })
  ],
  server: {
    host: true // Network üzerinden erişime izin verir
  }
})
