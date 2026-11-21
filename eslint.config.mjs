// @ts-check
import eslint from '@eslint/js';
import angular from 'angular-eslint';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig([
  {
    ignores: ['dist/**', '.angular/**', 'coverage/**', 'node_modules/**', 'mock-api/**'],
  },
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommended,
      tseslint.configs.stylistic,
      angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        { type: 'attribute', prefix: 'app', style: 'camelCase' },
      ],
      '@angular-eslint/component-selector': [
        'error',
        { type: 'element', prefix: 'app', style: 'kebab-case' },
      ],
      // CLAUDE.md: every component sets OnPush explicitly.
      '@angular-eslint/prefer-on-push-component-change-detection': 'error',
      // CLAUDE.md: no `any`, use `unknown` when the type is uncertain.
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
  {
    // Specs and test helpers: stubs may be empty classes.
    files: ['**/*.spec.ts', 'src/app/testing/**/*.ts'],
    rules: {
      '@typescript-eslint/no-extraneous-class': 'off',
      // Stubs copy the selector of the component they replace, e.g. PrimeNG's p-chart.
      '@angular-eslint/component-selector': 'off',
    },
  },
  {
    files: ['**/*.html'],
    extends: [angular.configs.templateRecommended, angular.configs.templateAccessibility],
    rules: {},
  },
]);
