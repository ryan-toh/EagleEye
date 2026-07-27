import js from '@eslint/js';
import prettierConfig from 'eslint-config-prettier/flat';
import globals from 'globals';

export default [
  {
    ignores: [
      'node_modules/',
      'dist/',
      'build/',
      'js/lib/',
      '*.min.js',
      '*.config.js',
    ],
  },
  js.configs.recommended,
  prettierConfig,
  {
    files: ['js/**/*.js'],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    rules: {
      'no-unused-vars': 'warn',
    },
  },
];
