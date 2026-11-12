// Structural checks of Simple Architecture that ESLint cannot express.
// Rules: docs/ai/structure.md. Run: pnpm check:arch
import { readdirSync, readFileSync } from 'node:fs';
import { basename, join, relative, sep } from 'node:path';

const SRC = 'src';
const MAX_STYLE_LINES = 120;
const errors = [];

const report = (path, message) => errors.push(`${relative('.', path)}: ${message}`);

const countLines = (file) =>
  readFileSync(file, 'utf8')
    .split('\n')
    .filter((line) => line.trim() !== '').length;

function checkComponentFolder(dir, files) {
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

  const isUi = dir.split(sep).includes('ui');
  const hooks = files.filter((file) => /^use[A-Z].*\.ts$/.test(file));
  if (isUi && hooks.length > 0) {
    report(dir, 'components/ui are dumb: no hooks allowed');
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

function walk(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files = entries.filter((entry) => entry.isFile()).map((entry) => entry.name);

  const isComponent = files.some((file) => file.endsWith('.tsx')) && dir !== SRC;
  if (isComponent) {
    checkComponentFolder(dir, files);
  }

  for (const file of files.filter((name) => name.endsWith('.scss'))) {
    const lines = countLines(join(dir, file));
    if (lines > MAX_STYLE_LINES) {
      report(join(dir, file), `${lines} lines, max ${MAX_STYLE_LINES}`);
    }
  }

  for (const entry of entries.filter((item) => item.isDirectory())) {
    walk(join(dir, entry.name));
  }
}

walk(SRC);
checkSharedHooks(join(SRC, 'hooks'));

if (errors.length > 0) {
  console.error(`Architecture check failed (${errors.length}):\n`);
  for (const error of errors) {
    console.error(`  - ${error}`);
  }
  process.exit(1);
}

console.log('Architecture check passed.');
