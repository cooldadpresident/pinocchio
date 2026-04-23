---
name: pinocchio-review
description: Honest PR/code review. Flags unfounded claims in the diff's commit messages, PR description, and inline comments. Checks every "this fixes X" / "this improves Y" claim against the actual diff. Use when user says "review this PR honestly", "pinocchio review", "/pinocchio-review", or when reviewing a pull request that makes strong claims. Auto-triggers on PR review requests when Pinocchio mode is active.
---

# Pinocchio Review

Review changes for **honesty gaps** between what the author claims and what the diff actually does.

## What to check

### 1. Title vs diff
Does the PR title describe the diff accurately?

- Title says "fix X" → does the diff actually fix X? Or does it only work around X?
- Title says "refactor" → any behavior change? If yes, it's not a pure refactor.
- Title says "performance improvement" → is there a benchmark in the PR, or is it speculative?

### 2. Commit message vs commit diff
Per-commit:
- Claims like "add caching" → is cache actually used? Grep for cache hits/misses in tests.
- "Fix race condition" → where's the proof the race existed? Repro or test?
- "Improve readability" → did readability actually improve, or did the diff just move code around?

### 3. PR description vs diff
Line-by-line on every claim in the description:
- "Tested on production-like data" → commit includes test data or CI log?
- "No behavior change" → scan for API surface changes, default value changes, error handling changes
- "Backward compatible" → check removed exports, changed signatures, dropped params

### 4. Inline comments the author left
- TODO comments without an issue link
- `// this should work` / `// probably` / `// I think` → review flag
- "Temporary workaround" without a tracking issue

### 5. Tests
- Does the PR claim a bug is fixed? Is there a regression test?
- Does the test actually fail before the fix and pass after? Or does it test a different path?
- Snapshot tests: is the snapshot update justified or rubber-stamped?

## Output format

For each gap, output:

```
🤥 [severity]  file:line
   claim:     "<quoted from PR/commit/comment>"
   reality:   <what diff actually shows>
   fix:       <how to reconcile — rewrite claim, add test, or adjust scope>
```

Severity:
- **high** — claim contradicts diff or hides breaking change
- **med** — claim overstates scope (e.g. "fix" that's actually a workaround)
- **low** — vague wording, missing tests, TODO without tracking

## Boundaries

- Don't review code style unless asked.
- Don't rewrite commit messages — flag them, let the author decide.
- Don't block on low-severity findings; list them as observations.
- Use exact quotes from the PR. No paraphrasing.

## Example output

```
🤥 high  src/auth.ts:42
   claim:     "Fix race condition in token refresh (commit 3f2a1b)"
   reality:   Added a retry loop but no lock or CAS. Race still possible under concurrent refresh.
   fix:       Rewrite commit msg to "mitigate" not "fix", or add mutex/CAS.

🤥 med   PR description line 8
   claim:     "No behavior change for existing callers."
   reality:   src/user.ts:67 — removed default param `role='user'`. Callers relying on default now pass undefined.
   fix:       Either restore default or document breaking change in PR.

🤥 low   src/api.ts:112
   claim:     "// temporary — revisit after v2"
   reality:   No tracking issue linked. Will rot.
   fix:       Link issue or delete comment.
```

## Integration

Runs on:
- `/pinocchio-review` — reviews current branch vs main
- `/pinocchio-review <PR#>` — fetches PR via `gh pr view` and reviews
- Auto-invoked by `/review` when Pinocchio mode is active
