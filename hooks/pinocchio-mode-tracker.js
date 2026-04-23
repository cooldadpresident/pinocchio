#!/usr/bin/env node
// pinocchio — UserPromptSubmit hook to track which pinocchio mode is active
// Inspects user input for /pinocchio commands and writes mode to flag file

const fs = require('fs');
const path = require('path');
const os = require('os');
const { getDefaultMode, safeWriteFlag, readFlag } = require('./pinocchio-config');

const claudeDir = process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude');
const flagPath = path.join(claudeDir, '.pinocchio-active');

let input = '';
process.stdin.on('data', chunk => { input += chunk; });
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    const prompt = (data.prompt || '').trim().toLowerCase();

    // Natural language activation (e.g. "activate pinocchio", "be honest",
    // "turn on honesty mode", "stop hedging").
    if (/\b(activate|enable|turn on|start)\b.*\bpinocchio\b/i.test(prompt) ||
        /\bpinocchio\b.*\b(mode|activate|enable|turn on|start)\b/i.test(prompt) ||
        /\b(be honest|stop hedging|honesty mode|cite sources)\b/i.test(prompt)) {
      if (!/\b(stop|disable|turn off|deactivate)\b/i.test(prompt)) {
        const mode = getDefaultMode();
        if (mode !== 'off') {
          safeWriteFlag(flagPath, mode);
        }
      }
    }

    // Match /pinocchio commands
    if (prompt.startsWith('/pinocchio')) {
      const parts = prompt.split(/\s+/);
      const cmd = parts[0]; // /pinocchio, /pinocchio-commit, /pinocchio-review
      const arg = parts[1] || '';

      let mode = null;

      if (cmd === '/pinocchio-commit') {
        mode = 'commit';
      } else if (cmd === '/pinocchio-review') {
        mode = 'review';
      } else if (cmd === '/pinocchio' || cmd === '/pinocchio:pinocchio') {
        if (arg === 'lite') mode = 'lite';
        else if (arg === 'strict') mode = 'strict';
        else if (arg === 'full') mode = 'full';
        else if (arg === 'off' || arg === 'stop') mode = 'off';
        else if (arg === 'reset') {
          // reset keeps current mode but clears nose counter
          // nose counter lives in config.json — out of scope here, handled by skill
          mode = readFlag(flagPath) || getDefaultMode();
        } else mode = getDefaultMode();
      }

      if (mode && mode !== 'off') {
        safeWriteFlag(flagPath, mode);
      } else if (mode === 'off') {
        try { fs.unlinkSync(flagPath); } catch (e) {}
      }
    }

    // Detect deactivation — natural language
    if (/\b(stop|disable|deactivate|turn off)\b.*\bpinocchio\b/i.test(prompt) ||
        /\bpinocchio\b.*\b(stop|disable|deactivate|turn off)\b/i.test(prompt) ||
        /\bnormal mode\b/i.test(prompt)) {
      try { fs.unlinkSync(flagPath); } catch (e) {}
    }

    // Per-turn reinforcement: emit a structured reminder when pinocchio is active.
    // The SessionStart hook injects the full ruleset once, but models lose it
    // when other plugins inject competing style instructions every turn.
    //
    // Skip independent modes (commit, review) — they have their own skill behavior.
    const INDEPENDENT_MODES = new Set(['commit', 'review']);
    const activeMode = readFlag(flagPath);
    if (activeMode && !INDEPENDENT_MODES.has(activeMode)) {
      process.stdout.write(JSON.stringify({
        hookSpecificOutput: {
          hookEventName: "UserPromptSubmit",
          additionalContext: "PINOCCHIO MODE ACTIVE (" + activeMode + "). " +
            "Every factual claim needs evidence (file:line / URL / cmd output) or [UNVERIFIED] tag. " +
            "Distinguish did/intended/verified. No hedges. No sycophancy. Say 'don't know' over guessing."
        }
      }));
    }
  } catch (e) {
    // Silent fail
  }
});
