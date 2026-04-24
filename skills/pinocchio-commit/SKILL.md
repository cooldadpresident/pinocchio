---
name: pinocchio-commit
description: Honest commit message generator. Describes what the diff actually does, not what it aspires to. Bans vague verbs (improve, enhance, optimize, update) without concrete evidence. Requires verbs match diff (add/remove/rename/replace/move). Use when user says "write commit message", "commit this", "/commit", "/pinocchio-commit", or when staging changes. Auto-triggers on commit requests when Pinocchio mode is active.
---

# Pinocchio Commit

Commit messages that describe the diff **as it is**, not as the author wishes it were.

## Core rule

**The verb must match what the diff does.**

| Diff does | Verb |
|-----------|------|
| Adds new code | `add` |
| Removes code | `remove` / `drop` |
| Renames symbol | `rename` |
| Replaces implementation | `replace` |
| Moves code to another file | `move` |
| Fixes broken behavior | `fix` |
| Changes default/behavior | `change` |
| Reformats without behavior change | `reformat` / `style` |
| Extracts function/module | `extract` |
| Inlines function/module | `inline` |

## Banned verbs (without evidence)

These lie by omission. Reject unless evidence is included:

- **improve** — prove it. Benchmark, before/after, or reject.
- **enhance** — what changed concretely?
- **optimize** — benchmark numbers or drop the word.
- **update** — too vague. Say what was updated.
- **refactor** — only if there's truly no behavior change. Scan for API changes first.
- **clean up** — describe what was actually removed/renamed.
- **better** — state the measurable way it's better.
- **various** — list them.
- **minor fixes** — list them.

## Format

Conventional Commits:

```
<type>(<scope>): <subject>

<body — only when the "why" isn't obvious from the subject>
```

Types: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`, `style`, `perf`, `ci`, `build`.

Rules:
- Subject ≤ 72 chars
- Imperative mood (`add`, not `added` / `adds`)
- No period at end of subject
- Body wraps at 72 cols, explains *why*, not *what* (diff shows what)

## Anti-patterns

```
❌  fix: various improvements to auth module
❌  chore: update dependencies
❌  refactor: clean up the codebase
❌  feat: better error handling
```

```
✅  fix(auth): accept tokens issued ≤5s in future to tolerate clock skew
✅  chore(deps): bump lodash 4.17.20 → 4.17.21 (CVE-2021-23337)
✅  refactor(user): extract validateEmail() from createUser(), no behavior change
✅  feat(api): return 422 instead of 500 on malformed JSON body
```

## Workflow

1. `git diff --staged` — read the actual diff.
2. Classify: what verb fits? Reject any banned verb.
3. Identify scope: smallest logical module touched.
4. Draft subject: `<type>(<scope>): <imperative verb> <what> <why if short>`.
5. If *why* needs explaining, add body. Otherwise skip body.
6. Present to user. Don't commit without confirmation.

## Body guidelines

Add a body when:
- The *why* isn't obvious from the diff
- The change has non-local consequences (breaks callers, changes contract)
- There's a CVE, incident, or issue number to reference

Skip body when:
- Subject already conveys what + why
- Diff is self-explanatory (typo fix, formatting, rename)

## Boundaries

- **Never amend** a commit unless the user explicitly asks
- **Never** add Co-Authored-By unless user configured that preference
- **Never** claim tests pass in the commit msg unless tests were actually run
- **Don't** invent issue numbers. If no issue exists, omit the reference.

## Example session

```
$ git diff --staged
-  if (user.role < requiredRole) throw new ForbiddenError();
+  if (user.role <= requiredRole - 1) throw new ForbiddenError();
```

❌ `refactor(auth): improve role check`
✅ `refactor(auth): rewrite role check without changing semantics`

(Only valid if the two expressions are truly equivalent. If `role` is a string, they're not — verb must change.)
