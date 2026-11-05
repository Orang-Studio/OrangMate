import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.png', 'icons/*.svg', 'pieces/**/*.svg'],
      workbox: {
        // engine wasm is ~7.3MB
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,wasm,tsv}'],
        maximumFileSizeToCacheInBytes: 12 * 1024 * 1024,
        navigateFallbackDenylist: [/^\/engine\//],
      },
      manifest: {
        name: 'OrangMate',
        short_name: 'OrangMate',
        description: 'Client-side chess game reviewer - Stockfish runs in your browser.',
        theme_color: '#161616',
        background_color: '#161616',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
    }),
  ],
  worker: {
    format: 'es',
  },
  server: {
    port: 5174,
  },
})