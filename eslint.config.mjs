import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  tseslint.configs.recommended,
  eslintPluginPrettierRecommended,
  {
    ignores: ['node_modules', 'dist'],
  },
  {
    rules: {
      'prettier/prettier': [
        'error',
        {
          singleQuote: true,
          jsxSingleQuote: true,
        },
      ],
    },
  },
);
