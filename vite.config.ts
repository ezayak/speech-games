import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  // GitHub Pages serves the app from /speech-games/.
  base: '/speech-games/',
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Speech Games',
        short_name: 'Speech Games',
        display: 'standalone',
        background_color: '#f6f4ef',
        theme_color: '#4f8cc9',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        // Cache every sound and picture so the app works offline.
        globPatterns: ['**/*.{js,css,html,svg,png,mp3}'],
      },
    }),
  ],
});
