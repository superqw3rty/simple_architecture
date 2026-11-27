// Structural checks of Simple Architecture that ESLint cannot express.
// Rules: docs/ai/structure.md. Run: pnpm check:arch
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename, dirname, join, relative, sep } from 'node:path';

const SRC = 'src';
const MAX_STYLE_LINES = 120;
// Viewport width breakpoints live in src/styles/breakpoints.scss, modules use screen-from()/screen-below()/screen-between().
const RAW_WIDTH_MEDIA = /@media[^{]*\bwidth\b/;
// Spacing goes through the --space-* scale, see docs/ai/styles.md.
const RAW_SPACING = /^\s*(padding|margin|gap|row-gap|column-gap)[\w-]*\s*:[^;]*\d(px|rem)/m;
// Line height goes through the --leading-* scale, see docs/ai/styles.md.
const RAW_LINE_HEIGHT = /^\s*line-height\s*:(?!\s*var\(--leading-)/m;
const TOKENS_PATH = join(SRC, 'styles', 'tokens.scss');
const TOKENS_SOURCE = readFileSync(TOKENS_PATH, 'utf8');
const TOKENS = new Set(TOKENS_SOURCE.match(/--[\w-]+(?=\s*:)/g));
// Sizes live on the 4px grid (D-35). A pill radius means "as round as possible", not a size.
const OFF_GRID_ALLOWED = new Set(['--radius-pill']);
// Element sizes (poster, logo dot, max widths) may be off the grid (D-46); control heights may not.
const ELEMENT_SIZE_TOKEN = /^--(?!control-height-)[\w-]+-(size|width|height)(-\w+)?$/;
const errors = [];

const report = (path, message) => errors.push(`${relative('.', path)}: ${message}`);

const countLines = (file) =>
  readFileSync(file, 'utf8')
    .split('\n')
    .filter((line) => line.trim() !== '').length;

// The root of a component holds its public face and nothing that runs: the logic lives in logic/ (D-55).
const ROOT_TS_ALLOWED = new Set(['index.ts', 'constants.ts', 'types.ts']);
const ROOT_DIRS_ALLOWED = new Set(['logic', 'components']);
const LOGIC_HINT =
  'presenter in logic/useName.ts, hooks in logic/hooks/, pure functions in logic/utils/ (D-55)';
const HOOK_FILE = /^use[A-Z]\w*(\.test)?\.ts$/;

function checkComponentFolder(dir, files, dirs) {
  const name = basename(dir);
  const views = files.filter((file) => file.endsWith('.tsx'));

  if (views.length > 1) {
    report(dir, `one folder = one component, found ${views.join(', ')}`);
  }
  if (!files.includes(`${name}.tsx`)) {
    report(dir, `view file must be named ${name}.tsx`);
  }
  if (!files.includes('index.ts')) {
    report(dir, 'missing index.ts that re-exports the component');
  }
  if (!/^[A-Z][A-Za-z0-9]*$/.test(name)) {
    report(dir, 'component folder must be PascalCase');
  }

  for (const file of files.filter((item) => item.endsWith('.ts') && !ROOT_TS_ALLOWED.has(item))) {
    report(join(dir, file), `the root of a component holds no logic: ${LOGIC_HINT}`);
  }
  for (const sub of dirs.filter((item) => !/^[A-Z]/.test(item) && !ROOT_DIRS_ALLOWED.has(item))) {
    report(
      join(dir, sub),
      `only logic/, components/ and child components live here: ${LOGIC_HINT}`,
    );
  }

  if (files.includes('index.ts')) {
    checkComponentIndex(join(dir, 'index.ts'));
  }

  if (!dirs.includes('logic')) {
    return;
  }
  if (dir.split(sep).includes('ui')) {
    report(dir, 'components/ui are dumb: no logic/ allowed');
  }
  checkLogicFolder(join(dir, 'logic'), name);
}

// logic/: the presenter at the root, the rest sorted by kind into hooks/, utils/, tasks/ (D-55).
const LOGIC_KINDS = new Set(['hooks', 'utils', 'tasks']);

function checkLogicFolder(dir, component) {
  const presenter = new RegExp(`^use${component}(\\.test)?\\.ts$`);
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory() && !LOGIC_KINDS.has(entry.name)) {
      report(path, 'logic/ holds only hooks/, utils/ and tasks/ folders (D-55)');
    }
    if (entry.isFile() && !presenter.test(entry.name)) {
      report(path, `logic/ root holds only use${component}.ts and its test; ${LOGIC_HINT}`);
    }
  }
  for (const path of listFiles(dir).filter((item) => dirname(item) !== dir)) {
    const file = basename(path);
    const kind = relative(dir, path).split(sep)[0];
    if (file === 'index.ts' || file.endsWith('.tsx')) {
      report(path, 'logic/ has no index.ts and no views: import ./logic/useName directly (D-55)');
    } else if (kind === 'hooks' && !HOOK_FILE.test(file)) {
      report(path, 'logic/hooks/ holds only hooks useName.ts and their tests (D-55)');
    } else if (kind !== 'hooks' && /^use[A-Z]/.test(file)) {
      report(path, `a hook in logic/${kind}/: hooks live in logic/hooks/ (D-55)`);
    }
  }
}

// A hook lives in a component's logic/ or in src/hooks, nowhere else (D-55).
function checkHookPlacement(path) {
  const parts = relative(SRC, path).split(sep);
  if (/^use[A-Z]/.test(basename(path)) && !parts.includes('logic') && parts[0] !== 'hooks') {
    report(path, `a hook outside logic/: ${LOGIC_HINT}; shared hooks go to src/hooks/`);
  }
}

// src/hooks: one folder per hook, with the hook file and an index.ts inside.
function checkSharedHooks(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isFile()) {
      report(path, 'shared hook must live in its own folder: hooks/useName/useName.ts');
      continue;
    }
    const files = readdirSync(path);
    if (!files.includes(`${entry.name}.ts`)) {
      report(path, `missing ${entry.name}.ts`);
    }
    if (!files.includes('index.ts')) {
      report(path, 'missing index.ts that re-exports the hook');
    }
  }
}

// index.ts is the public face of a folder: re-exports only, no code.
const RE_EXPORT = /^export (type )?(\{[^}]*\}|\*) from '[^']+';$/;

function checkIndexFile(path) {
  const lines = readFileSync(path, 'utf8')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line !== '' && !line.startsWith('//'));
  if (lines.some((line) => !RE_EXPORT.test(line))) {
    report(path, "index.ts holds re-exports only: export { Name } from './Name'");
  }
}

// A component's index.ts exports components, their skeletons and props types — never helpers (D-45, D-52).
const EXPORT_LINE = /^export (?:type )?\{([^}]*)\} from '([^']+)';$/;

function checkComponentIndex(path) {
  for (const [, names, source] of readFileSync(path, 'utf8')
    .split(/\r?\n/)
    .map((line) => line.trim().match(EXPORT_LINE))
    .filter(Boolean)) {
    const exported = names.split(',').map((name) =>
      name
        .trim()
        .split(/\s+as\s+/)
        .pop(),
    );
    if (!/^\.\/[A-Z]\w*$/.test(source) || exported.some((name) => !/^[A-Z]/.test(name))) {
      report(
        path,
        `exports only components and props types from './Name'; a shared helper lives in logic/utils/ of the common ancestor (D-45)`,
      );
    }
  }
}

const toPx = (value, unit) => (unit === 'rem' ? Number(value) * 16 : Number(value));

// Every length token except element sizes is a multiple of 4px; a numbered scale step N is exactly N × 4px.
function checkTokenGrid() {
  for (const [, name, value, unit] of TOKENS_SOURCE.matchAll(/(--[\w-]+):\s*([\d.]+)(px|rem);/g)) {
    const px = toPx(value, unit);
    if (px % 4 !== 0 && !OFF_GRID_ALLOWED.has(name) && !ELEMENT_SIZE_TOKEN.test(name)) {
      report(TOKENS_PATH, `${name} is ${px}px, sizes must be multiples of 4px (docs/ai/styles.md)`);
    }
    const step = name.match(/^--(space|text|leading)-(\d+)$/);
    if (step && px !== Number(step[2]) * 4) {
      report(TOKENS_PATH, `${name} must be ${Number(step[2]) * 4}px (step × 4), found ${px}px`);
    }
  }
}

// Line heights are fixed lengths and inherit as is, so a block that sets font-size sets line-height too.
function checkFontPairs(path, source) {
  const stack = [''];
  for (const char of source.replace(/\/\/[^\n]*/g, '')) {
    if (char === '{') {
      stack.push('');
    } else if (char === '}') {
      const block = stack.pop();
      if (/(^|[\s;])font-size\s*:/.test(block) && !/(^|[\s;])line-height\s*:/.test(block)) {
        report(
          path,
          `font-size without line-height in the same block: "${block.trim().slice(0, 50)}…"`,
        );
      }
    } else {
      stack[stack.length - 1] += char;
    }
  }
}

function checkStyleModule(path) {
  const source = readFileSync(path, 'utf8');
  checkFontPairs(path, source);
  if (RAW_WIDTH_MEDIA.test(source)) {
    report(
      path,
      'width media query must use @include screen-from(name), screen-below(name) or screen-between(from, to), see docs/ai/styles.md',
    );
  }
  if (RAW_SPACING.test(source)) {
    report(path, 'padding/margin/gap must use var(--space-*), see docs/ai/styles.md');
  }
  if (RAW_LINE_HEIGHT.test(source)) {
    report(path, 'line-height must use var(--leading-*), see docs/ai/styles.md');
  }
  for (const [, name] of source.matchAll(/var\((--[\w-]+)/g)) {
    if (!TOKENS.has(name)) {
      report(path, `unknown token ${name}, not declared in src/styles/tokens.scss`);
    }
  }
}

const JSDOC_ALLOWED = [join(SRC, 'api'), join(SRC, 'types', 'api')];

function checkJsDoc(path) {
  if (JSDOC_ALLOWED.some((dir) => path.startsWith(dir))) {
    return;
  }
  if (readFileSync(path, 'utf8').includes('/**')) {
    report(path, 'JSDoc only in src/api and src/types/api, see docs/ai/code-style.md (D-39)');
  }
}

function walk(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files = entries.filter((entry) => entry.isFile()).map((entry) => entry.name);
  const dirs = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);

  // A stray .tsx inside logic/ is reported by checkLogicFolder, logic/ is not a component.
  const inLogic = relative(SRC, dir).split(sep).includes('logic');
  const isComponent = files.some((file) => file.endsWith('.tsx')) && dir !== SRC && !inLogic;
  if (isComponent) {
    checkComponentFolder(dir, files, dirs);
  }
  if (files.includes('index.ts')) {
    checkIndexFile(join(dir, 'index.ts'));
  }

  for (const file of files.filter((name) => /\.tsx?$/.test(name))) {
    checkJsDoc(join(dir, file));
    checkHookPlacement(join(dir, file));
  }

  for (const file of files.filter((name) => name.endsWith('.scss'))) {
    const lines = countLines(join(dir, file));
    if (lines > MAX_STYLE_LINES) {
      report(join(dir, file), `${lines} lines, max ${MAX_STYLE_LINES}`);
    }
    if (file.endsWith('.module.scss')) {
      checkStyleModule(join(dir, file));
    }
  }

  for (const entry of entries.filter((item) => item.isDirectory())) {
    walk(join(dir, entry.name));
  }
}

// A nested components/ folder holds only what is shared inside its subtree (D-42).
// A component with a single importing folder lives directly in that folder instead.
const SHARED_ROOT = join(SRC, 'components');
const IMPORT_SPEC = /(?:from|import)\s+'([^']+)'/g;

function listFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? listFiles(path) : [path];
  });
}

const listSourceFiles = (dir) => listFiles(dir).filter((path) => /\.tsx?$/.test(path));

function checkSharedFolders() {
  const files = listSourceFiles(SRC);
  const importers = new Map();
  for (const file of files) {
    for (const [, spec] of readFileSync(file, 'utf8').matchAll(IMPORT_SPEC)) {
      const target = spec.startsWith('@/')
        ? join(SRC, spec.slice(2))
        : spec.startsWith('.')
          ? join(dirname(file), spec)
          : null;
      if (target && !dirname(file).startsWith(target)) {
        importers.set(target, (importers.get(target) ?? new Set()).add(dirname(file)));
      }
    }
  }
  const sharedFolders = files
    .map((file) => dirname(dirname(file)))
    .filter((dir, index, all) => basename(dir) === 'components' && all.indexOf(dir) === index);
  for (const shared of sharedFolders.filter((dir) => !dir.startsWith(SHARED_ROOT))) {
    for (const entry of readdirSync(shared, { withFileTypes: true })) {
      const path = join(shared, entry.name);
      if (entry.isDirectory() && (importers.get(path)?.size ?? 0) < 2) {
        report(
          path,
          'used by one folder: move it into that folder, components/ is for shared ones (D-42)',
        );
      }
    }
  }
}

// server/tasks: a folder per task, a folder per util of a task; each holds its file, its test
// and an index.ts that re-exports it (D-65, docs/ai/backend.md).
const SERVER_TASKS = join('server', 'tasks');

// The same folder shape serves server tasks (D-65) and src/api modules (D-68): `rule` names the decision.
function checkUnitFolder(dir, kind, rule) {
  const name = basename(dir);
  const entries = readdirSync(dir, { withFileTypes: true });
  const files = entries.filter((entry) => entry.isFile()).map((entry) => entry.name);
  const expected = [`${name}.ts`, `${name}.test.ts`, 'index.ts'];
  const helperHint = kind === 'module' ? '' : '; a helper goes to utils/<name>/';

  for (const file of expected.filter((item) => !files.includes(item))) {
    report(dir, `${kind} folder needs ${file} (${rule})`);
  }
  for (const file of files.filter((item) => !expected.includes(item))) {
    report(
      join(dir, file),
      `${kind} folder holds only ${expected.join(', ')}${helperHint} (${rule})`,
    );
  }
  if (files.includes('index.ts')) {
    checkIndexFile(join(dir, 'index.ts'));
  }

  for (const sub of entries.filter((entry) => entry.isDirectory())) {
    const path = join(dir, sub.name);
    if (kind === 'task' && sub.name === 'utils') {
      checkUnitFolders(path, 'util', 'a util lives in its own folder: utils/name/name.ts', rule);
    } else {
      report(
        path,
        kind === 'task'
          ? `a task folder holds only utils/ (${rule})`
          : `a ${kind} folder has no subfolders (${rule})`,
      );
    }
  }
}

function checkUnitFolders(dir, kind, looseFileMessage, rule, allowedFiles = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      checkUnitFolder(path, kind, rule);
    } else if (!allowedFiles.includes(entry.name)) {
      report(path, `${looseFileMessage} (${rule})`);
    }
  }
}

// src/api: only index.ts, core/ and resource folders at the root. core/ holds module folders,
// a resource holds module folders and its index.ts (D-68, docs/ai/api-layer.md).
// tvmaze/ is the old flat client, deleted in step 6.4 of docs/homework/hw2-plan.md.
const API = join(SRC, 'api');
const API_LEGACY = new Set(['tvmaze']);
const API_LOOSE_FILE =
  'a module lives in its own folder: core/name/name.ts or resource/name/name.ts';

function checkApiLayout() {
  for (const entry of readdirSync(API, { withFileTypes: true })) {
    const path = join(API, entry.name);
    if (!entry.isDirectory()) {
      if (entry.name !== 'index.ts') {
        report(path, 'src/api holds only index.ts, core/ and resource folders (D-68)');
      }
    } else if (entry.name === 'core') {
      checkUnitFolders(path, 'module', API_LOOSE_FILE, 'D-68');
    } else if (!API_LEGACY.has(entry.name)) {
      checkUnitFolders(path, 'module', API_LOOSE_FILE, 'D-68', ['index.ts']);
      if (!existsSync(join(path, 'index.ts'))) {
        report(path, 'a resource needs index.ts that re-exports its modules (D-68)');
      }
    }
  }
}

walk(SRC);
checkSharedFolders();
checkUnitFolders(
  SERVER_TASKS,
  'task',
  'a task lives in its own folder: tasks/name/name.ts',
  'D-65',
);
checkApiLayout();
checkTokenGrid();
checkSharedHooks(join(SRC, 'hooks'));

if (errors.length > 0) {
  console.error(`Architecture check failed (${errors.length}):\n`);
  for (const error of errors) {
    console.error(`  - ${error}`);
  }
  process.exit(1);
}

console.log('Architecture check passed.');
