#!/bin/bash
# pinocchio — statusline badge script for Claude Code
# Reads the pinocchio mode flag file and outputs a colored badge.
#
# Usage in ~/.claude/settings.json:
#   "statusLine": { "type": "command", "command": "bash /path/to/pinocchio-statusline.sh" }

FLAG="${CLAUDE_CONFIG_DIR:-$HOME/.claude}/.pinocchio-active"

# Refuse symlinks — local attacker could point flag at ~/.ssh/id_rsa and have
# statusline render its bytes (including ANSI escape sequences) to terminal.
[ -L "$FLAG" ] && exit 0
[ ! -f "$FLAG" ] && exit 0

# Hard-cap read at 64 bytes, strip anything outside [a-z0-9-] — blocks terminal
# escape injection and OSC hyperlink spoofing via flag contents.
MODE=$(head -c 64 "$FLAG" 2>/dev/null | tr -d '\n\r' | tr '[:upper:]' '[:lower:]')
MODE=$(printf '%s' "$MODE" | tr -cd 'a-z0-9-')

# Whitelist. Anything else → render nothing.
case "$MODE" in
  off|lite|full|strict|commit|review) ;;
  *) exit 0 ;;
esac

# Orange color — nose-growing wooden boy
if [ -z "$MODE" ] || [ "$MODE" = "full" ]; then
  printf '\033[38;5;172m[PINOCCHIO]\033[0m'
else
  SUFFIX=$(printf '%s' "$MODE" | tr '[:lower:]' '[:upper:]')
  printf '\033[38;5;172m[PINOCCHIO:%s]\033[0m' "$SUFFIX"
fi
