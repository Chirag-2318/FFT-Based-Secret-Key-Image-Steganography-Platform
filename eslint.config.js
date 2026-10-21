import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'node_modules'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
  {
    // Privacy and zero-persistence rules for application code
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/lib/privacy.ts'],
    rules: {
      'no-restricted-globals': [
        'error',
        {
          name: 'localStorage',
          message:
            'Zero persistence rule: do not use localStorage. Veil forbids persisting keys, payloads, or images.',
        },
        {
          name: 'sessionStorage',
          message:
            'Zero persistence rule: do not use sessionStorage. Veil operates with in-memory sessions only.',
        },
        {
          name: 'indexedDB',
          message: 'Zero persistence rule: do not use indexedDB in client code.',
        },
      ],
      'no-restricted-properties': [
        'error',
        {
          object: 'console',
          property: 'log',
          message:
            'Do not use console.log. Never log keys, payloads, or images to console (AGENTS.md standing rules).',
        },
        {
          object: 'window',
          property: 'localStorage',
          message: 'Zero persistence rule: do not access window.localStorage.',
        },
        {
          object: 'window',
          property: 'sessionStorage',
          message: 'Zero persistence rule: do not access window.sessionStorage.',
        },
        {
          object: 'window',
          property: 'indexedDB',
          message: 'Zero persistence rule: do not access window.indexedDB.',
        },
      ],
    },
  }
);
