import { defineConfig } from 'vitest/config';
import { positivusDevComponentIndex } from './vite-plugins/positivus-dev-component-index.js';

export default defineConfig({
  root: '.',
  base: '/positivus-landing-page/',
  publicDir: 'public',
  plugins: [positivusDevComponentIndex()],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
  server: {
    open: '__components',
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.js'],
  },
});
