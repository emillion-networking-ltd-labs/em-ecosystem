// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import pluginSecurity from 'eslint-plugin-security';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['eslint.config.mjs'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  pluginSecurity.configs.recommended,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      'prettier/prettier': ['error', { endOfLine: 'auto' }],
      // Security plugin rules — enforce critical, warn on noisy
      'security/detect-eval-with-expression': 'error',
      'security/detect-no-csrf-before-method-override': 'error',
      'security/detect-non-literal-require': 'warn',
      'security/detect-non-literal-regexp': 'warn',
      'security/detect-possible-timing-attacks': 'warn',
      'security/detect-unsafe-regex': 'error',
      'security/detect-buffer-noassert': 'error',
      'security/detect-child-process': 'error',
      'security/detect-new-buffer': 'error',
      'security/detect-pseudoRandomBytes': 'error',
      'security/detect-object-injection': 'off', // Too noisy for DTO-based NestJS
    },
  },
  {
    // SCRUM-359: test directories are not production code. E2E tests intentionally
    // operate on loosely-typed Jest mocks and supertest responses, so the unsafe-*
    // family is noise here. Production code under src/ remains at full strictness.
    files: [
      '**/tests/**/*.ts',
      '**/*.spec.ts',
      'test/**/*.ts',
      'test/**/*.e2e-spec.ts',
    ],
    rules: {
      '@typescript-eslint/unbound-method': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/no-misused-promises': 'off',
      // Allow Jest's dynamic require() pattern for re-loading modules with
      // mutated env or jest.isolateModules-style fresh imports.
      '@typescript-eslint/no-require-imports': 'off',
      // Relax security rules in test files
      'security/detect-non-literal-require': 'off',
      'security/detect-non-literal-regexp': 'off',
      'security/detect-possible-timing-attacks': 'off',
    },
  },
);
