module.exports = {
  extends: ['@B-S-F/eslint-config/eslint-preset'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-non-null-assertion': 'off',
    'no-sparse-arrays': 'off',
    '@typescript-eslint/no-unused-vars': [
      'error',
      { destructuredArrayIgnorePattern: '^([.]{3})?_' },
    ],
    'no-control-regex': 0,
    "no-restricted-imports": ["error", {
      "patterns": ["*.js"]
    }]
  },
}
