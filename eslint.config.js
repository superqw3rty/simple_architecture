// ESLint "flat config": an array of config objects applied top to bottom.
// Each object says "for these files, use these rules"; later objects override earlier ones.
import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// Every hook exported by React. A view file may not import any of them.
const REACT_HOOKS = [
  'use',
  'useActionState',
  'useCallback',
  'useContext',
  'useDebugValue',
  'useDeferredValue',
  'useEffect',
  'useEffectEvent',
  'useId',
  'useImperativeHandle',
  'useInsertionEffect',
  'useLayoutEffect',
  'useMemo',
  'useOptimistic',
  'useReducer',
  'useRef',
  'useState',
  'useSyncExternalStore',
  'useTransition',
];

const VIEW_MESSAGE =
  'View (.tsx) holds JSX only. Move logic to the presenter useComponentName.ts (docs/ai/architecture.md).';

export default defineConfig([
  // 1. Folders ESLint never looks into.
  globalIgnores(['dist', 'coverage']),

  // 2. Ready-made rule sets: JS basics, strict TypeScript, Rules of Hooks.
  js.configs.recommended,
  tseslint.configs.strict,
  reactHooks.configs.flat.recommended,

  // 3. Code style for every file: a block always gets braces, even a one-liner.
  {
    rules: { curly: ['error', 'all'] },
  },

  // 4. Simple Architecture rules for application code.
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: { globals: globals.browser },
    rules: {
      // Files stay short. Blank lines and comments are free.
      'max-lines': ['error', { max: 120, skipBlankLines: true, skipComments: true }],
      // All network access goes through src/api/http.ts.
      'no-restricted-globals': [
        'error',
        { name: 'fetch', message: 'Use request() from @/api/http (docs/ai/api-layer.md).' },
      ],
    },
  },

  // 5. The single exception to the fetch ban: the HTTP client itself.
  {
    files: ['src/api/http.ts'],
    rules: { 'no-restricted-globals': 'off' },
  },

  // 6. View layer: every .tsx is a view, and a view has no logic.
  {
    files: ['src/**/*.tsx'],
    rules: {
      // No React hooks, no shared hooks, no API calls: only the component's own presenter.
      'no-restricted-imports': [
        'error',
        {
          paths: [{ name: 'react', importNames: REACT_HOOKS, message: VIEW_MESSAGE }],
          patterns: [
            { group: ['@/api', '@/api/*', '@/hooks', '@/hooks/*'], message: VIEW_MESSAGE },
            {
              group: ['@/types/api', '@/types/api/*'],
              message: 'Raw API types stay inside src/api. A view works with domain types.',
            },
          ],
        },
      ],
      // Closes the loophole React.useState(...) without a named import.
      'no-restricted-syntax': [
        'error',
        {
          selector: "MemberExpression[object.name='React'][property.name=/^use([A-Z]|$)/]",
          message: VIEW_MESSAGE,
        },
      ],
    },
  },

  // 7. Tooling files run in Node, not in the browser.
  {
    files: ['*.{js,ts}', 'scripts/**/*.mjs'],
    languageOptions: { globals: globals.node },
  },
]);
