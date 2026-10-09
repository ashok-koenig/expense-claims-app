#!/usr/bin/env node
// PostToolUse hook for Edit|Write: appends "<ISO timestamp>\t<file path>" to dev-audit.log in the
// project root. It only observes: every path ends in exit code 0, so it can never block or fail a tool call.
// (Edits that a PreToolUse hook blocked never reach PostToolUse, so only real changes are logged.)

const fs = require('node:fs');
const path = require('node:path');

const LOG_FILE = 'dev-audit.log';

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
  input += chunk;
});
process.stdin.on('end', () => {
  try {
    const payload = JSON.parse(input);
    const filePath = payload?.tool_input?.file_path ?? payload?.tool_response?.filePath;
    if (typeof filePath === 'string' && filePath !== '') {
      const projectDir = path.resolve(process.env.CLAUDE_PROJECT_DIR || process.cwd());
      fs.appendFileSync(path.join(projectDir, LOG_FILE), `${new Date().toISOString()}\t${filePath}\n`);
    }
  } catch {
    // Auditing is best-effort: bad input or an unwritable log must not affect the edit.
  }
  process.exit(0);
});
