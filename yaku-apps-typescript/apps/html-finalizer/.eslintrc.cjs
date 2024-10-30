module.exports = {
    extends: [
      'eslint:recommended',
      'plugin:@typescript-eslint/recommended',
      'prettier',
    ],
    // parser: '@typescript-eslint/parser',
    // parserOptions: {
    //   ecmaVersion: 12,
    //   sourceType: module,
    // },
    plugins: ['@typescript-eslint'],
    settings: {
      next: {
        rootDir: ['apps/*/', 'packages/*/'],
      },
    },
    env: {
      browser: true,
      es2021: true,
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      'no-sparse-arrays': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { destructuredArrayIgnorePattern: '^([.]{3})?_' },
      ],
    },
    ignorePatterns: [
      'node_modules/',
      '*/node_modules',
      '**/tsconfig.json',
      '**/dist',
    ],
  }
