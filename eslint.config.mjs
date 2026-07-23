import tsParser from '@typescript-eslint/parser';

export default [
  { ignores: ['.next/**', 'dist/**', 'coverage/**', 'node_modules/**'] },
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: { parser: tsParser },
  },
];
