// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

module.exports = {
  root: true,
  parserOptions: {
    ecmaFeatures: {
      jsx: false,
    },
  },
  extends: [
    'plugin:vue/vue3-recommended',
    'eslint:recommended',
    '@vue/eslint-config-typescript',
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': [
      'warn', // or "error"
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      },
    ],
    // opinionated rules to force ts-typing and keep things consistent accross the project
    'vue/block-lang': ['error', { script: { lang: 'ts' } }],
    'vue/define-emits-declaration': ['error', 'type-based'],
    'vue/define-props-declaration': ['error', 'type-based'],
    'vue/define-macros-order': [
      'error',
      { order: ['defineProps', 'defineEmits'] },
    ],
    'vue/match-component-file-name': [
      'error',
      { extensions: ['vue'], shouldMatchCase: true },
    ],
    // avoid conflict with Volar
    'vue/multi-word-component-names': 'off',
    'vue/max-attributes-per-line': 'off',
    'vue/first-attribute-linebreak': 'off',
    'vue/html-indent': 'off',
    'vue/html-closing-bracket-newlin': 'off',
    'vue/html-closing-bracket-newline': 'off',
    'vue/v-on-event-hyphenation': 'off',
    'vue/attribute-hyphenation': 'off',
    'vue/require-default-prop': 'off', // default value is expected to be undefined
    'vue/no-setup-props-destructure ': 'off', // now possible with vue 3.3
  },
}
