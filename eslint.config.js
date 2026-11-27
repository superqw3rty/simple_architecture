// ESLint "flat config": an array of config objects applied top to bottom.
// Each object says "for these files, use these rules"; later objects override earlier ones.
import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import react from 'eslint-plugin-react';
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
  'View (.tsx) holds JSX only. Move logic to the presenter logic/useComponentName.ts (docs/ai/architecture.md).';

// D-52: raw server types never leave src/api.
const RAW_API_TYPES = {
  group: ['@/types/api', '@/types/api/*'],
  message: 'Raw API types stay inside src/api. Use domain types (docs/ai/api-layer.md).',
};

// D-56: data changes go through a task and the queryClient singleton, not through a hook.
const NO_MUTATION = {
  name: '@tanstack/react-query',
  importNames: ['useMutation'],
  message:
    'Write data in a task with queryClient from @/api, not useMutation (docs/ai/tasks.md, D-56).',
};

// D-68: outside src/api everything comes from '@/api'; its index.ts decides what is public.
// '@/api/tvmaze' is the old flat client, allowed until step 6.4 of docs/homework/hw2-plan.md deletes it.
const API_INTERNALS = {
  group: ['@/api/*', '!@/api/tvmaze'],
  message: "Import from '@/api', not from its folders (docs/ai/api-layer.md, D-68).",
};

const TASK_MESSAGE =
  'A task is a plain function without React: no hooks, no components (docs/ai/tasks.md, D-54).';

// D-63: Node resolves only the "imports" field of package.json, not tsconfig paths or Vite aliases.
const NO_ALIAS = {
  group: ['@/*', '@shared', '@shared/*', '@server', '@server/*', '@client', '@client/*', '../../*'],
  message:
    'server/ and shared/ import other folders via #server/* or #shared, nearby files via ./ or ../ (docs/ai/backend.md, D-63).',
};

const HONO = {
  group: ['hono', 'hono/*', '@hono/*'],
  message: 'Hono only in server/main.ts, server/app.ts and server/routes/ (docs/ai/backend.md).',
};

const SERVER_REACT_MESSAGE = 'server/ and shared/ do not depend on React (docs/ai/backend.md).';

export default defineConfig([
  // 1. Folders ESLint never looks into.
  globalIgnores(['dist', 'coverage']),

  // 2. Ready-made rule sets: JS basics, strict TypeScript, Rules of Hooks.
  js.configs.recommended,
  tseslint.configs.strict,
  reactHooks.configs.flat.recommended,

  // 3. Code style for every file: a block always gets braces, even a one-liner.
  {
    rules: { curly: ['error', 'all'], 'prefer-const': 'error' },
  },

  // 4. Simple Architecture rules for application code.
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: { globals: globals.browser },
    rules: {
      // Files stay short. Blank lines and comments are free.
      'max-lines': ['error', { max: 120, skipBlankLines: true, skipComments: true }],
      // D-40: every function states its return type; only contextually typed callbacks are exempt.
      '@typescript-eslint/explicit-function-return-type': [
        'error',
        {
          allowExpressions: false,
          allowTypedFunctionExpressions: true,
          allowHigherOrderFunctions: false,
        },
      ],
      // Debug output does not ship; an error, because pnpm check passes on warnings (D-52).
      'no-console': 'error',
      // All network access goes through request() in src/api/core/http (D-68).
      'no-restricted-globals': [
        'error',
        {
          name: 'fetch',
          message:
            'Network goes through src/api: request() in src/api/core/http (docs/ai/api-layer.md).',
        },
      ],
    },
  },

  // 5. The single exception to the fetch ban: the HTTP client itself.
  {
    files: ['src/api/core/http/http.ts'],
    rules: { 'no-restricted-globals': 'off' },
  },

  // 5a. The API layer knows nothing about React. From TanStack Query it takes only
  // the framework-free parts: the client and the queryOptions() helper.
  {
    files: ['src/api/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            { name: 'react', message: 'src/api does not depend on React (docs/ai/api-layer.md).' },
            {
              name: '@tanstack/react-query',
              allowImportNames: ['QueryClient', 'queryOptions'],
              message: 'src/api uses only QueryClient and queryOptions (docs/ai/api-layer.md).',
            },
          ],
          patterns: [
            {
              group: ['@/hooks', '@/hooks/*', '@/components', '@/components/*'],
              message: 'src/api does not depend on UI (docs/ai/api-layer.md).',
            },
          ],
        },
      ],
    },
  },

  // 5b. Raw server types stay inside src/api: hooks and presenters work with domain types (D-52).
  // No useMutation: writes are tasks (D-56). Views (.tsx) and tasks get the same bans
  // in blocks 5c and 6: each block replaces no-restricted-imports, it does not merge it.
  {
    files: ['src/**/*.ts'],
    ignores: ['src/api/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        { paths: [NO_MUTATION], patterns: [RAW_API_TYPES, API_INTERNALS] },
      ],
    },
  },

  // 5c. Tasks know nothing about React (D-54): the cache is the queryClient singleton from @/api.
  {
    files: ['**/tasks/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [{ name: 'react', message: TASK_MESSAGE }],
          patterns: [
            { group: ['react-dom', 'react-dom/*', '@tanstack/react-*'], message: TASK_MESSAGE },
            {
              group: ['@/hooks', '@/hooks/*', '@/components', '@/components/*'],
              message: TASK_MESSAGE,
            },
            RAW_API_TYPES,
            API_INTERNALS,
          ],
        },
      ],
    },
  },

  // 6. View layer: every .tsx is a view, and a view has no logic.
  {
    files: ['src/**/*.tsx'],
    plugins: { react },
    // An explicit version: "detect" reads package.json through APIs that ESLint 10 removed.
    settings: { react: { version: '19' } },
    rules: {
      // Every element of a list has a stable key; <></> in a list must become <Fragment key>.
      'react/jsx-key': ['error', { checkFragmentShorthand: true, warnOnDuplicates: true }],
      // No React hooks, no shared hooks, no API calls: only the component's own presenter.
      'no-restricted-imports': [
        'error',
        {
          paths: [
            { name: 'react', importNames: REACT_HOOKS, message: VIEW_MESSAGE },
            // useQuery & co. are hooks: a view gets data from its presenter.
            {
              name: '@tanstack/react-query',
              allowImportNames: ['QueryClientProvider'],
              message: VIEW_MESSAGE,
            },
          ],
          patterns: [
            { group: ['@/api', '@/api/*', '@/hooks', '@/hooks/*'], message: VIEW_MESSAGE },
            { group: ['@/tasks', '@/tasks/*'], message: VIEW_MESSAGE },
            RAW_API_TYPES,
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
        // onClick={() => onSelect(label)} is a handler with a body: the presenter returns a ready one.
        {
          selector:
            'JSXAttribute[name.name=/^on[A-Z]/] > JSXExpressionContainer > :matches(ArrowFunctionExpression, FunctionExpression)',
          message: VIEW_MESSAGE,
        },
        // D-28: one way to declare a component.
        {
          selector: 'ExportNamedDeclaration > FunctionDeclaration',
          message:
            'Declare a component as export const Name: FC<NameProps> = (props) => … (docs/ai/code-style.md, D-28).',
        },
      ],
    },
  },

  // 7. Accessibility of the markup (D-44): alt texts, ARIA roles and attributes, labels.
  {
    files: ['src/**/*.tsx'],
    ...jsxA11y.flatConfigs.recommended,
    rules: {
      ...jsxA11y.flatConfigs.recommended.rules,
      // role="list" on <ul> is not redundant: Safari drops list semantics with list-style: none.
      'jsx-a11y/no-redundant-roles': ['error', { ul: ['list'] }],
    },
  },

  // 8. Backend and API contract (D-58). Node runs these files as is, so the only aliases are
  // #server/* and #shared from package.json "imports" (D-63), always with .ts. Hono lives in the transport layer only, tasks never see it.
  // This block replaces 5c for server/tasks, so it repeats the React ban.
  {
    files: ['server/**/*.ts', 'shared/**/*.ts'],
    languageOptions: { globals: globals.node },
    rules: {
      'max-lines': ['error', { max: 120, skipBlankLines: true, skipComments: true }],
      '@typescript-eslint/explicit-function-return-type': [
        'error',
        {
          allowExpressions: false,
          allowTypedFunctionExpressions: true,
          allowHigherOrderFunctions: false,
        },
      ],
      'no-restricted-imports': [
        'error',
        { paths: [{ name: 'react', message: SERVER_REACT_MESSAGE }], patterns: [NO_ALIAS, HONO] },
      ],
    },
  },

  // 8a. The transport layer may import Hono; aliases stay banned.
  {
    files: ['server/main.ts', 'server/app.ts', 'server/routes/**/*.ts', 'server/**/*.test.ts'],
    rules: { 'no-restricted-imports': ['error', { patterns: [NO_ALIAS] }] },
  },

  // 9. Tooling files run in Node, not in the browser.
  {
    files: ['*.{js,ts}', 'scripts/**/*.mjs', '.claude/hooks/**/*.mjs'],
    languageOptions: { globals: globals.node },
  },
]);
