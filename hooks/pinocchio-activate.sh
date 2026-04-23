#!/usr/bin/env bash
# pinocchio-activate.sh
# Runs on SessionStart and UserPromptSubmit. Injects mode reminder into context.
# Reads ~/.claude/.pinocchio-state for current level + nose count.

set -euo pipefail

STATE_FILE="${HOME}/.claude/.pinocchio-state"

# Initialize state if missing
if [[ ! -f "${STATE_FILE}" ]]; then
  printf '{"level":"full","nose":0,"active":true}\n' > "${STATE_FILE}"
fi

# Parse state (no jq dependency — simple grep)
ACTIVE=$(grep -o '"active":[^,}]*' "${STATE_FILE}" | cut -d: -f2 | tr -d ' "')
LEVEL=$(grep -o '"level":"[^"]*"' "${STATE_FILE}" | cut -d: -f2 | tr -d '"')
NOSE=$(grep -o '"nose":[^,}]*' "${STATE_FILE}" | cut -d: -f2 | tr -d ' "')

# If disabled, exit silently
if [[ "${ACTIVE}" != "true" ]]; then
  exit 0
fi

# Emit additional context to be injected into the model's context window
case "${LEVEL}" in
  lite)
    printf 'PINOCCHIO MODE ACTIVE (lite). Flag hedges inline with 🤥. Do not block. Cite evidence when convenient.\n'
    ;;
  full)
    printf 'PINOCCHIO MODE ACTIVE (full). Rules:\n'
    printf '  - Every factual claim needs evidence (file:line, URL, or cmd output) OR [UNVERIFIED] tag.\n'
    printf '  - Distinguish did vs intended vs verified.\n'
    printf '  - Quote errors verbatim.\n'
    printf '  - No hedge words (probably/likely/should work/I think/from memory).\n'
    printf '  - No sycophancy (great question/absolutely right/perfect).\n'
    printf '  - Say "don'\''t know" instead of guessing.\n'
    printf 'Nose count: %s/5. At 5, halt and require verification.\n' "${NOSE}"
    ;;
  strict)
    printf 'PINOCCHIO MODE ACTIVE (strict). Rules:\n'
    printf '  - EVERY factual claim needs file:line / URL / command output citation.\n'
    printf '  - No [UNVERIFIED] escape hatch. Verify or say "don'\''t know".\n'
    printf '  - No hedges. No sycophancy. No fabricated citations.\n'
    printf '  - Quote errors verbatim.\n'
    printf 'Nose count: %s/5. At 5, halt.\n' "${NOSE}"
    ;;
  *)
    printf 'PINOCCHIO MODE ACTIVE (unknown level: %s). Defaulting to full rules.\n' "${LEVEL}"
    ;;
esac

printf 'Auto-carveouts: creative writing, hypothetical framing, opinion asks, security warnings.\n'
printf 'Toggle: /pinocchio [lite|full|strict|reset|off]. Disable: "stop pinocchio" or "normal mode".\n'
