import { defineConfig } from "vite";
import dyadComponentTagger from "@dyad-sh/react-vite-component-tagger";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    dyadComponentTagger(),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Barber Booking',
        short_name: 'Barber',
        start_url: '.',
        display: 'standalone',
        background_color: '#18181b',
        theme_color: '#18181b',
        description: 'מערכת זימון תורים לברבר/מספרה',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/logo-splash.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
        ],
        screenshots: [
          {
            src: '/welcome-background.png',
            sizes: '1920x1080',
            type: 'image/png',
            form_factor: 'wide',
          },
          {
            src: '/welcome-background-narrow.png',
            sizes: '1080x1920',
            type: 'image/png',
            form_factor: 'narrow',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,ico}'],
        globIgnores: ['**/welcome-background*.png'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
