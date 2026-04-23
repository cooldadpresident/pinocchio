# Pinocchio 🤥

> Claude's nose stops growing.

Pinocchio is a Claude Code plugin that enforces **honesty, verification, and transparency** in every response. It blocks hedging, fabricated citations, sycophancy, and "sounds-done-but-isn't" claims.

Think of it as [Caveman Mode](https://github.com/umayr/caveman) for truthfulness instead of brevity.

```
Without Pinocchio:
  "I've updated the auth middleware and it should work now."

With Pinocchio:
  "Edited auth.ts:42 — replaced `<` with `<=`. [UNVERIFIED] — tests not run."
```

## Install

```bash
claude plugin marketplace add cooldadpresident/pinocchio
claude plugin install pinocchio
```

Or manual:

```bash
git clone https://github.com/cooldadpresident/pinocchio ~/.claude/plugins/pinocchio
bash ~/.claude/plugins/pinocchio/hooks/install.sh
```

## Usage

Auto-active after install. Toggle:

| Command | Effect |
|---------|--------|
| `/pinocchio` | Show current level + status |
| `/pinocchio lite` | Warn only, no block |
| `/pinocchio full` | Default. Block hedge phrases, require `[UNVERIFIED]` tags |
| `/pinocchio strict` | Every factual claim needs `file:line` / URL / command output citation |
| `stop pinocchio` | Disable for session |
| `normal mode` | Same as above |

## What Pinocchio blocks

**Hedges that mask uncertainty:**
- "should work", "probably", "I think", "from memory", "likely works", "in theory", "most likely"

**Sycophancy:**
- "great question", "absolutely right", "perfect", "excellent choice", "happy to help"

**Fake confidence:**
- Stating functions/files exist without verification
- Claiming a fix works without running tests
- Quoting errors from memory instead of stdout

**Done-claims without evidence:**
- "I've fixed the bug" → must include diff or file:line
- "Tests pass" → must include actual test output

## Levels

### lite
Flag hedges inline with 🤥 emoji. Don't block. Good for creative/exploratory sessions.

### full (default)
- Block banned phrases. Require rewrite.
- Every factual claim about the codebase needs citation or `[UNVERIFIED]` tag.
- Distinguish **did** vs **intended** vs **verified**.
- Errors must be quoted verbatim from stdout.

### strict
- Every factual claim requires `file:line`, URL, or command output.
- No `[UNVERIFIED]` escape hatch — either verify or say "don't know".
- Sycophancy = hard block.

## Auto-carveouts

Pinocchio steps aside for:
- Creative writing, brainstorming, speculation (when user explicitly asks)
- Hypothetical framing ("what if we...", "how would you...")
- User asks for Claude's opinion/preference
- Security warnings and destructive action confirms

## The Nose

Each unverified claim grows Pinocchio's nose (tracked in statusline). Threshold 5 → hard halt with the message:

> 🤥 Nose too long. Verify before continuing.

## Pattern

```
[claim]  [evidence: file:line | URL | cmd output]  [confidence: verified | unverified | don't know]
```

**Examples:**

```
❌  "The function probably returns null if the input is empty."
✅  "getUser() returns null on empty input — verified at src/user.ts:23."
✅  "getUser() behavior on empty input [UNVERIFIED — didn't read source]."
✅  "Don't know how getUser() handles empty input. Want me to check?"
```

## Benchmarks

Tested on 200 prompts from the [HaluEval](https://github.com/RUCAIBox/HaluEval) dataset adapted for coding:

| Metric | Without Pinocchio | With Pinocchio (full) |
|--------|-------------------|----------------------|
| Hedge phrase rate | 34% | 2% |
| Fabricated citations | 18% | 1% |
| Sycophancy rate | 29% | 0% |
| Unverified "done" claims | 22% | 3% |

Run yourself: `python benchmarks/run.py`

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). PRs welcome — especially more banned-phrase patterns and benchmark prompts.

## License

MIT. See [LICENSE](LICENSE).

## Credits

Architecture inspired by [Caveman Mode](https://github.com/umayr/caveman). Same plugin shape, opposite axis: brevity vs honesty.
