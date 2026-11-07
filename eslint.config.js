const { defineConfig } = require('eslint/config');
const ts = require('@typescript-eslint/eslint-plugin');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,

  {
    rules: {
      // In React Native these strings live in <Text>, not HTML; escaping
      // apostrophes only makes copy harder to read.
      'react/no-unescaped-entities': 'off',
    },
  },

  {
    files: ['**/*.ts', '**/*.tsx'],
    plugins: { '@typescript-eslint': ts },
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-unused-vars': 'off',
    },
  },

  {
    ignores: [
      'node_modules/',
      'dist/',
      'web-build/',
      '.expo/',
      'android/',
      'ios/',
      'expo-env.d.ts',
      'uniwind-types.d.ts',
    ],
  },
]);
