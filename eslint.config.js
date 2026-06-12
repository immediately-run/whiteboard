import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

// reactRefresh.configs.vite enforces the React Fast Refresh rule: a module that
// exports a component must export ONLY components. This is what keeps the app
// HMR-safe inside immediately.run — keep it. Data goes in src/data/, hooks in
// src/hooks/.
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // `react-hooks/refs` is a new (v7) React-Compiler rule. The whiteboard's
      // controller (src/hooks/useWhiteboard.ts) installs document-level pointer
      // handlers that must read the LATEST camera/selection — the canonical
      // solution is a state-mirror ref read at *event* time, and the canvas
      // element is handed back via a callback ref. The rule can't see that those
      // reads never happen during render and false-positives on both. The
      // load-bearing lint for immediately.run — the Fast Refresh
      // `react-refresh/only-export-components` rule — stays fully enforced.
      'react-hooks/refs': 'off',
    },
  },
])
