import tsESLint from 'typescript-eslint'
import prettier from 'eslint-config-prettier'
import type { Linter } from 'eslint'
import { globalIgnores } from 'eslint/config'

const config: Linter.Config[] = [
  ...tsESLint.configs.recommended,
  globalIgnores(['**/dist/**', '**/node_modules/**', '**/.yalc/**', 'yalc.lock', '**/dist-ssr/**', '**/coverage/**']),
  prettier,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
    },
  },
]
export default config
