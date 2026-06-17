---
name: run-ci
description: Run local CI checks relevant to the current branch changes — typecheck, lint, test, format, and similar — before opening a PR. Use after merge-worktree and before to-pr.
---

# Run CI

Run the repo's local checks against the current branch changes before opening a PR.

Part of the AI dev workflow: `grill-me` → `to-prd` → `to-issues` → `to-linear` → `forge-issue` → `deslop` → `thermo-nuclear-code-quality-review` → `merge-worktree` → **run-ci** → `to-pr` → `babysit`

Run after the feature branch is ready. Fix failures before `to-pr`.

## Discover checks

Inspect the repo for how CI runs locally, in this order:

1. `package.json` scripts (`test`, `lint`, `typecheck`, `format:check`, `check`, `ci`, etc.)
2. Monorepo task runners (`turbo`, `nx`, `pnpm` filters) when present
3. `Makefile`, `justfile`, or repo docs/scripts that mirror CI
4. `.github/workflows/` — use the same commands the PR workflow runs when obvious

Prefer scoped commands when the repo supports them (changed packages, affected tests). Fall back to full-repo commands when scoping is unclear.

Typical checks to include when they exist: **typecheck**, **lint**, **test**, **format check**. Skip checks that don't apply to this repo.

## Git & GitHub

Use **`git`** for local working tree state. Resolve base branch with **`gh repo view --json defaultBranchRef`** when needed, then `git diff --stat <base>...HEAD` for change context.

## Run

1. Confirm branch and diff context (`git status`; base branch via tracking, `gh repo view`, or repo rules).
2. Run the discovered checks. Run all applicable checks — don't stop after the first failure.
3. Report pass/fail per check with the shortest useful error snippet for failures.
4. Do not open a PR, push, or auto-fix unless the user asks. This skill runs checks only.

If a check command is ambiguous or missing, ask before guessing.

## Output

Final reply only. No preamble or process narration.

```markdown
**CI**

- Result: pass | fail
- Checks: typecheck ✓, lint ✓, test ✓, format ✓
- Failed: <check> — <one-line reason> | None
- Next: [/to-pr](../to-pr/SKILL.md) | fix failures first
```

Use `Next: fix failures first` when any check failed. Use the skill link to `to-pr` only when all checks passed.

Rules: no preamble; one line per check in `Checks:`; `Next:` always last.
