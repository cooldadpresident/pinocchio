#!/usr/bin/env node
// pinocchio — Claude Code SessionStart activation hook
//
// Runs on every session start:
//   1. Writes flag file at $CLAUDE_CONFIG_DIR/.pinocchio-active (statusline reads this)
//   2. Emits pinocchio ruleset as hidden SessionStart context
//   3. Detects missing statusline config and emits setup nudge

const fs = require('fs');
const path = require('path');
const os = require('os');
const { getDefaultMode, safeWriteFlag } = require('./pinocchio-config');

const claudeDir = process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude');
const flagPath = path.join(claudeDir, '.pinocchio-active');
const settingsPath = path.join(claudeDir, 'settings.json');

const mode = getDefaultMode();

// "off" mode — skip activation entirely
if (mode === 'off') {
  try { fs.unlinkSync(flagPath); } catch (e) {}
  process.stdout.write('OK');
  process.exit(0);
}

// 1. Write flag file (symlink-safe)
safeWriteFlag(flagPath, mode);

// 2. Emit full pinocchio ruleset, filtered to the active intensity level.
//    Reads SKILL.md at runtime so edits to the source of truth propagate.

const INDEPENDENT_MODES = new Set(['commit', 'review']);

if (INDEPENDENT_MODES.has(mode)) {
  process.stdout.write('PINOCCHIO MODE ACTIVE — level: ' + mode + '. Behavior defined by /pinocchio-' + mode + ' skill.');
  process.exit(0);
}

// Read SKILL.md — source of truth.
// Plugin install: __dirname = <plugin_root>/hooks/, SKILL.md at <plugin_root>/pinocchio/SKILL.md
// Standalone: __dirname = $CLAUDE_CONFIG_DIR/hooks/, SKILL.md won't exist — fallback below.
let skillContent = '';
try {
  skillContent = fs.readFileSync(
    path.join(__dirname, '..', 'pinocchio', 'SKILL.md'), 'utf8'
  );
} catch (e) { /* standalone install — fallback */ }

let output;

if (skillContent) {
  const body = skillContent.replace(/^---[\s\S]*?---\s*/, '');

  // Filter intensity table: keep header rows + only the active level's row
  const filtered = body.split('\n').reduce((acc, line) => {
    const tableRowMatch = line.match(/^\|\s*\*\*(\S+?)\*\*\s*\|/);
    if (tableRowMatch) {
      if (tableRowMatch[1] === mode) {
        acc.push(line);
      }
      return acc;
    }
    acc.push(line);
    return acc;
  }, []);

  output = 'PINOCCHIO MODE ACTIVE — level: ' + mode + '\n\n' + filtered.join('\n');
} else {
  // Fallback when SKILL.md isn't available (standalone install)
  output =
    'PINOCCHIO MODE ACTIVE — level: ' + mode + '\n\n' +
    'Enforce honesty. Each unverified claim grows the nose. Every factual claim needs evidence or [UNVERIFIED] tag.\n\n' +
    '## Persistence\n\n' +
    'ACTIVE EVERY RESPONSE. No revert after many turns. Off only: "stop pinocchio" / "normal mode".\n\n' +
    'Current level: **' + mode + '**. Switch: `/pinocchio lite|full|strict`.\n\n' +
    '## Rules\n\n' +
    '- Every factual claim needs evidence (file:line, URL, or cmd output) OR [UNVERIFIED] tag.\n' +
    '- Distinguish did vs intended vs verified.\n' +
    '- Quote errors verbatim from stdout.\n' +
    '- No hedge words (probably/likely/should work/I think/from memory/in theory/my best guess).\n' +
    '- No sycophancy (great question/absolutely right/perfect/excellent).\n' +
    '- Say "don\'t know" instead of guessing.\n\n' +
    '## Auto-Carveouts\n\n' +
    'Drop pinocchio for: creative writing, hypothetical framing, opinion asks, security warnings, destructive op confirms. Resume after.\n\n' +
    '## Boundaries\n\n' +
    'Code blocks: unchanged. Commit messages: still honest but normal prose. "stop pinocchio" or "normal mode": revert.';
}

// 3. Detect missing statusline config — nudge setup
try {
  let hasStatusline = false;
  if (fs.existsSync(settingsPath)) {
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    if (settings.statusLine) {
      hasStatusline = true;
    }
  }

  if (!hasStatusline) {
    const isWindows = process.platform === 'win32';
    const scriptName = isWindows ? 'pinocchio-statusline.ps1' : 'pinocchio-statusline.sh';
    const scriptPath = path.join(__dirname, scriptName);
    const command = isWindows
      ? `powershell -ExecutionPolicy Bypass -File "${scriptPath}"`
      : `bash "${scriptPath}"`;
    const statusLineSnippet =
      '"statusLine": { "type": "command", "command": ' + JSON.stringify(command) + ' }';
    output += "\n\n" +
      "STATUSLINE SETUP NEEDED: The pinocchio plugin includes a statusline badge showing active mode " +
      "(e.g. [PINOCCHIO], [PINOCCHIO:STRICT]). It is not configured yet. " +
      "To enable, add this to " + path.join(claudeDir, 'settings.json') + ": " +
      statusLineSnippet + " " +
      "Proactively offer to set this up for the user on first interaction.";
  }
} catch (e) {
  // Silent fail — don't block session start
}

process.stdout.write(output);
