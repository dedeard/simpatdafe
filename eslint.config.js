//  @ts-check

import { tanstackConfig } from '@tanstack/eslint-config'
import prettierConfig from 'eslint-config-prettier/flat'
import reactHooks from 'eslint-plugin-react-hooks'
import globals from 'globals'

export default [
  {
    ignores: [
      'dist',
      '.output',
      '.nitro',
      '.tanstack',
      '.vinxi',
      '.agents',
      'node_modules',
      'src/routeTree.gen.ts',
      'eslint.config.js',
      'prettier.config.js',
    ],
  },
  ...tanstackConfig,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
    },
  },
  {
    rules: {
      'import/no-cycle': 'off',
      'import/order': 'off',
      'import/consistent-type-specifier-style': 'off',
      'sort-imports': 'off',
      '@typescript-eslint/array-type': 'off',
      '@typescript-eslint/require-await': 'off',
      'pnpm/json-enforce-catalog': 'off',
    },
  },
  // Must be last: turns off rules that conflict with Prettier
  prettierConfig,
]
