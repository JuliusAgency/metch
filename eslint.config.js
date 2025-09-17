import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default [
  { ignores: ['dist'] },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
        ...globals.node,
        __dirname: 'readonly',
        module: 'readonly',
        require: 'readonly',
      },
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    settings: { react: { version: '18.3' } },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      'react/jsx-no-target-blank': 'off',
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      // Disable prop-types validation for UI components
      'react/prop-types': 'off',
      // Allow unused vars that start with underscore
      'no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }],
      // Allow unescaped entities in JSX
      'react/no-unescaped-entities': 'off',
      // Allow unknown properties (for CSS-in-JS)
      'react/no-unknown-property': 'off',
      // Allow duplicate props (sometimes needed for conditional rendering)
      'react/jsx-no-duplicate-props': 'off',
    },
  },
]
