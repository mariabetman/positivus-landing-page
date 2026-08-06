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
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      reportsDirectory: 'coverage',
      include: ['src/**/*.js'],
      exclude: ['src/**/*.test.js', 'src/**/*.stories.js'],
    },
  },
});
