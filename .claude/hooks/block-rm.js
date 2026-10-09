#!/usr/bin/env node
// PreToolUse hook for Bash: blocks commands that actually delete files, to prevent accidental deletions.
// Exit code 2 blocks the call and shows stderr to Claude; 0 allows it; 1 is a non-blocking error.
//
// A command is blocked when one of these is *run* (not merely mentioned in an argument or a word):
//   rm ...            rmdir ...         git rm ...         find ... -delete
//   find ... -exec rm ...               and wrappers/paths/shells around them, e.g.
//   sudo rm -rf x     xargs rm          /bin/rm x          \rm x        bash -c "rm -rf x"
// Words that only contain the letters (format, form, term, platform, confirm...) are allowed.
//
// Known limits: it reads the command text, it does not run a real shell parser. It does not know other ways
// to delete (unlink, shred, fs.rmSync in a script, Remove-Item in PowerShell, `git clean`...), and `sudo -u user rm`
// style wrapper options that take a value are not understood.

const DELETE_COMMANDS = new Set(['rm', 'rmdir']);
// Commands that run the next command: skip over them (and their flags) to find what actually runs.
const WRAPPERS = new Set(['sudo', 'doas', 'xargs', 'env', 'command', 'exec', 'time', 'nice', 'nohup', 'builtin', 'then', 'do', 'else', '!']);
const SHELLS = new Set(['sh', 'bash', 'zsh', 'dash', 'ksh']);
const FIND_EXEC_FLAGS = new Set(['-exec', '-execdir', '-ok', '-okdir']);
const MAX_DEPTH = 3; // how deep to look inside `bash -c "..."` / eval

const BLOCK_MESSAGE =
  'Blocked: this looks like a file-deletion command (rm, rmdir, git rm, or find -delete / -exec rm). ' +
  'This project blocks those to prevent accidental deletions. ' +
  'Ask the user to run it themselves (they can use the ! prefix) or to disable this hook in .claude/settings.json.';

// Splits on shell separators that are not inside quotes or escaped: ; | & newline ( ) `
function splitSegments(text) {
  const segments = [];
  let current = '';
  let quote = null;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '\\' && quote !== "'") {
      current += ch + (text[i + 1] ?? '');
      i++;
    } else if (quote) {
      current += ch;
      if (ch === quote) quote = null;
    } else if (ch === "'" || ch === '"') {
      quote = ch;
      current += ch;
    } else if (';|&\n()`'.includes(ch)) {
      segments.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  segments.push(current);
  return segments;
}

// Splits one segment into words like a shell would: whitespace separates, quotes group, backslash escapes.
function tokenize(segment) {
  const tokens = [];
  let current = '';
  let has = false; // so "" counts as an (empty) word
  let quote = null;
  for (let i = 0; i < segment.length; i++) {
    const ch = segment[i];
    if (ch === '\\' && quote !== "'") {
      const next = segment[i + 1] ?? '';
      has = true;
      if (quote === '"' && !'"\\$`'.includes(next)) {
        current += ch; // inside double quotes a backslash is literal unless it escapes " \ $ or `
      } else {
        current += next;
        i++;
      }
    } else if (quote) {
      if (ch === quote) quote = null;
      else current += ch;
    } else if (ch === "'" || ch === '"') {
      quote = ch;
      has = true;
    } else if (/\s/.test(ch)) {
      if (has) tokens.push(current);
      current = '';
      has = false;
    } else {
      current += ch;
      has = true;
    }
  }
  if (has) tokens.push(current);
  return tokens;
}

// "/usr/bin/rm" -> "rm", "C:\\tools\\rm.exe" -> "rm"
const baseName = (word) => word.split(/[\\/]/).pop().replace(/\.exe$/i, '');

function runsDeletion(tokens, depth) {
  let i = 0;
  while (i < tokens.length) {
    if (/^[A-Za-z_][A-Za-z0-9_]*=/.test(tokens[i])) {
      i++; // VAR=value prefix
    } else if (WRAPPERS.has(baseName(tokens[i]))) {
      i++;
      while (i < tokens.length && tokens[i].startsWith('-')) i++; // the wrapper's own flags
    } else {
      break;
    }
  }
  if (i >= tokens.length) return false;

  const word = baseName(tokens[i]);
  const rest = tokens.slice(i + 1);

  if (DELETE_COMMANDS.has(word)) return true;
  if (word === 'git') return rest[0] === 'rm';
  if (word === 'find') {
    if (rest.includes('-delete')) return true;
    const exec = rest.findIndex((t) => FIND_EXEC_FLAGS.has(t));
    return exec !== -1 && runsDeletion(rest.slice(exec + 1), depth);
  }
  if (depth < MAX_DEPTH && SHELLS.has(word)) {
    const flag = rest.findIndex((t) => /^-[a-z]*c[a-z]*$/.test(t)); // -c, -lc, -ec ...
    return flag !== -1 && rest[flag + 1] !== undefined && containsDeletion(rest[flag + 1], depth + 1);
  }
  if (depth < MAX_DEPTH && word === 'eval') return containsDeletion(rest.join(' '), depth + 1);
  return false;
}

function containsDeletion(command, depth = 0) {
  return splitSegments(command).some((segment) => runsDeletion(tokenize(segment), depth));
}

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
  input += chunk;
});
process.stdin.on('end', () => {
  let command;
  try {
    command = JSON.parse(input)?.tool_input?.command;
  } catch (err) {
    console.error(`block-rm hook: could not parse hook input (${err.message}); not blocking.`);
    process.exit(1);
  }
  if (typeof command === 'string' && containsDeletion(command)) {
    console.error(BLOCK_MESSAGE);
    process.exit(2);
  }
  process.exit(0);
});
