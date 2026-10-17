import js from '@eslint/js';
import html from 'eslint-plugin-html';
import globals from 'globals';

export default [
  {
    ignores: [
      'assets/vendor/**',
      'node_modules/**',
      'dist/**',
      'coverage/**',
      'playwright-report/**',
      'test-results/**',
      'work/**',
    ],
  },
  {
    files: ['**/*.{js,cjs,mjs,html}'],
    plugins: { html },
    languageOptions: { globals: { ...globals.browser, ...globals.node, DemoMotion: 'readonly' } },
    rules: {
      ...js.configs.recommended.rules,
      'no-unused-vars': ['error', { vars: 'local', args: 'none', caughtErrors: 'none' }],
      'no-empty': ['error', { allowEmptyCatch: true }],
    },
  },
  { files: ['*.html', 'assets/motion/motion.js'], languageOptions: { sourceType: 'script' } },
];
