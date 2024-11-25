// SPDX-FileCopyrightText: 2022 2023 by grow platform GmbH
// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import typescriptParser from '@typescript-eslint/parser';
import typescriptPlugin from '@typescript-eslint/eslint-plugin';
import prettierPlugin from 'eslint-plugin-prettier';

export default [
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: typescriptParser,
      // parserOptions: {
      //   ecmaVersion: 'latest',
      //   sourceType: 'module',
      //   project: './tsconfig.json',
      // },
    },
    plugins: {
      '@typescript-eslint': typescriptPlugin,
      prettier: prettierPlugin,
    },
    rules: {
      ...typescriptPlugin.configs.recommended.rules,
      ...prettierPlugin.configs.recommended.rules,
      'prettier/prettier': 'error',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      'no-sparse-arrays': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { destructuredArrayIgnorePattern: '^([.]{3})?_' },
      ],
    },
    settings: {
      next: {
        rootDir: ['apps/*/', 'packages/*/'],
      },
      env: {
        browser: true,
        es2021: true,
      },
    },
  },
  {
    ignores: ['node_modules/',
      '*/node_modules',
      '**/tsconfig.json',
      '**/dist',],
  },
];
