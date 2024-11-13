module.exports = {
  extends: ['@B-S-F/eslint-config/eslint-preset'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    'no-sparse-arrays': 'off',
    '@typescript-eslint/no-unused-vars': [
      'error',
      { destructuredArrayIgnorePattern: '^([.]{3})?_' },
    ],
    'no-control-regex': 0,
  },
}
