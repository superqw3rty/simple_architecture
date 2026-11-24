// Claude Code PostToolUse hook: reminds Claude to propose a commit when the working tree grows.
// Rule: docs/ai/git.md. It warns once per step of THRESHOLD files (25, 50, 75…) and stays silent
// otherwise. It never commits and never fails the tool call.
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const THRESHOLD = Number(process.env.DIFF_WATCH_THRESHOLD) || 25;
const GROUP_DEPTH = 3;
const MAX_GROUPS = 8;
const STATE_FILE = 'claude-diff-size';

const cwd = process.env.CLAUDE_PROJECT_DIR || process.cwd();

function git(args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
}

function changedFiles() {
  return git(['status', '--porcelain', '--untracked-files=all'])
    .split('\n')
    .filter(Boolean)
    .map((line) => line.slice(3).split(' -> ').pop().replace(/^"|"$/g, ''));
}

function groupByFolder(files) {
  const groups = new Map();
  for (const file of files) {
    const folders = file.split('/').slice(0, -1).slice(0, GROUP_DEPTH);
    const key = folders.length > 0 ? folders.join('/') : '(root)';
    groups.set(key, (groups.get(key) ?? 0) + 1);
  }
  return [...groups].sort((a, b) => b[1] - a[1]);
}

function readStep(path) {
  try {
    return Number(readFileSync(path, 'utf8')) || 0;
  } catch {
    return 0;
  }
}

function buildMessage(files) {
  const groups = groupByFolder(files);
  const lines = groups.slice(0, MAX_GROUPS).map(([folder, count]) => `  - ${folder}: ${count}`);
  if (groups.length > MAX_GROUPS) {
    lines.push(`  - …and ${groups.length - MAX_GROUPS} more folders`);
  }
  return [
    `Uncommitted changes: ${files.length} files (threshold ${THRESHOLD}, see docs/ai/git.md).`,
    'By folder:',
    ...lines,
    'Finish the current logical step, make `pnpm check` green, then propose to the user',
    'one or more commits split by these groups. Do not commit without the user asking.',
  ].join('\n');
}

function main() {
  const stateFile = resolve(cwd, git(['rev-parse', '--git-dir']).trim(), STATE_FILE);
  const files = changedFiles();
  const step = Math.floor(files.length / THRESHOLD);
  const lastStep = readStep(stateFile);

  if (step !== lastStep) {
    writeFileSync(stateFile, String(step));
  }
  if (step === 0 || step <= lastStep) {
    return;
  }

  const output = {
    hookSpecificOutput: { hookEventName: 'PostToolUse', additionalContext: buildMessage(files) },
  };
  process.stdout.write(JSON.stringify(output));
}

try {
  main();
} catch {
  // No git or not a repository: the reminder is optional, so stay silent.
}
