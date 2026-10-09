#!/usr/bin/env node
// PreToolUse hook for Edit|Write: blocks changes to data/exchange-rates.json.
// Exit code 2 blocks the tool call and shows stderr to Claude; 0 allows it; 1 is a non-blocking error.

const path = require('node:path');

const PROTECTED_FILE = path.join('data', 'exchange-rates.json');
const BLOCK_MESSAGE =
  'Blocked: data/exchange-rates.json is protected and must not be edited by Claude. ' +
  'It is the source of truth for currency conversion rates. ' +
  'If a rate really needs to change, ask the user to edit the file themselves ' +
  '(or to disable this hook in .claude/settings.json first).';

// Windows and macOS file systems are case-insensitive by default.
const caseInsensitive = process.platform === 'win32' || process.platform === 'darwin';
const normalize = (p) => (caseInsensitive ? path.resolve(p).toLowerCase() : path.resolve(p));

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
  input += chunk;
});
process.stdin.on('end', () => {
  let filePath;
  try {
    filePath = JSON.parse(input)?.tool_input?.file_path;
  } catch (err) {
    console.error(`protect-exchange-rates hook: could not parse hook input (${err.message}); not blocking.`);
    process.exit(1);
  }
  if (typeof filePath !== 'string') process.exit(0);

  const projectDir = path.resolve(process.env.CLAUDE_PROJECT_DIR || process.cwd());
  const target = normalize(path.resolve(projectDir, filePath)); // handles relative paths and ".." segments
  const protectedPath = normalize(path.resolve(projectDir, PROTECTED_FILE));

  if (target === protectedPath) {
    console.error(BLOCK_MESSAGE);
    process.exit(2);
  }
  process.exit(0);
});
