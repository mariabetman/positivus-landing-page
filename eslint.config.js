import js from '@eslint/js';
import cypress from 'eslint-plugin-cypress';

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: {
        window: 'readonly',
        document: 'readonly',
        customElements: 'readonly',
        HTMLElement: 'readonly',
        CSSStyleSheet: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': 'warn',
    },
  },
  {
    ...cypress.configs.recommended,
    files: ['cypress/**/*.js', 'cypress.config.js'],
  },
  {
    files: ['scripts/**/*.js'],
    languageOptions: {
      globals: {
        console: 'readonly',
        process: 'readonly',
      },
    },
  },
  {
    ignores: ['dist/', 'node_modules/', 'cypress/videos/', 'cypress/screenshots/', 'storybook-static/'],
  },
];
