import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  css: {
    modules: { localsConvention: 'camelCaseOnly' },
  },
  build: {
    target: 'es2020',
    // three.js is only reached through the lazy SceneRoot import, so it lands in
    // its own async chunk automatically (no manualChunks needed).
    chunkSizeWarningLimit: 1100,
  },
});
