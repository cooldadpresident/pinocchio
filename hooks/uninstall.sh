#!/bin/bash
# pinocchio — uninstall hooks, flag, and statusline from Claude Code settings
# Usage: bash hooks/uninstall.sh
set -e

CLAUDE_DIR="${CLAUDE_CONFIG_DIR:-$HOME/.claude}"
HOOKS_DIR="$CLAUDE_DIR/hooks"
SETTINGS="$CLAUDE_DIR/settings.json"
FLAG="$CLAUDE_DIR/.pinocchio-active"

if ! command -v node >/dev/null 2>&1; then
  echo "ERROR: 'node' is required to uninstall (needed to edit settings.json safely)."
  exit 1
fi

echo "Uninstalling pinocchio hooks..."

# Remove hook files
for hook in package.json pinocchio-config.js pinocchio-activate.js pinocchio-mode-tracker.js pinocchio-statusline.sh pinocchio-statusline.ps1; do
  if [ -f "$HOOKS_DIR/$hook" ]; then
    rm "$HOOKS_DIR/$hook"
    echo "  Removed: $HOOKS_DIR/$hook"
  fi
done

# Remove flag file
if [ -f "$FLAG" ]; then
  rm "$FLAG"
  echo "  Removed flag: $FLAG"
fi

# Remove hook entries from settings.json
if [ -f "$SETTINGS" ]; then
  cp "$SETTINGS" "$SETTINGS.bak"
  PINOCCHIO_SETTINGS="$SETTINGS" node -e "
    const fs = require('fs');
    const settingsPath = process.env.PINOCCHIO_SETTINGS;
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));

    const stripPinocchio = (arr) => (arr || []).filter(entry =>
      !(entry.hooks && entry.hooks.some(h => h.command && h.command.includes('pinocchio')))
    );

    if (settings.hooks) {
      if (settings.hooks.SessionStart) {
        settings.hooks.SessionStart = stripPinocchio(settings.hooks.SessionStart);
        if (settings.hooks.SessionStart.length === 0) delete settings.hooks.SessionStart;
      }
      if (settings.hooks.UserPromptSubmit) {
        settings.hooks.UserPromptSubmit = stripPinocchio(settings.hooks.UserPromptSubmit);
        if (settings.hooks.UserPromptSubmit.length === 0) delete settings.hooks.UserPromptSubmit;
      }
      if (Object.keys(settings.hooks).length === 0) delete settings.hooks;
    }

    // Remove statusline only if it points to our script
    if (settings.statusLine) {
      const cmd = typeof settings.statusLine === 'string'
        ? settings.statusLine
        : (settings.statusLine.command || '');
      if (cmd.includes('pinocchio-statusline')) {
        delete settings.statusLine;
        console.log('  Removed statusline config');
      }
    }

    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n');
    console.log('  Cleaned settings.json');
  "
fi

echo ""
echo "Done. Restart Claude Code to deactivate."
echo "Backup saved at $SETTINGS.bak"
