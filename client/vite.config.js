import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In development, /api requests are proxied to the Express server (port 4000).
// In production, the browser calls the Render API URL directly via VITE_API_BASE_URL.
export default defineConfig({
  plugins: [react()],
  // Down-level JavaScript so the app also works on old browsers / budget phones
  // (Android WebView 61+, Safari 11+, iOS 11+). Prevents white screens from
  // "SyntaxError: Unexpected token" on older devices.
  build: {
    target: ['es2017', 'chrome62', 'safari11', 'ios11', 'edge79', 'firefox60'],
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true,
    proxy: {
      // API_PORT lets you point the dev UI at a different API instance
      // (e.g. a demo-mode server on port 4000). Default: 4000.
      '/api': `http://127.0.0.1:${process.env.API_PORT || 4000}`,
    },
  },
});
