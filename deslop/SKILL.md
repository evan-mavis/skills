---
name: deslop
description: Proactively clean the current uncommitted issue-worktree diff without changing behavior. Use inline after forge-issue and before thermo-nuclear-code-quality-review to remove AI slop, dead code, duplication, type bloat, and unnecessary defensive complexity.
---

# Deslop

Clean the current issue diff inline. Do not spawn another agent when running inside a `forge-build` worker.

## Process

1. Inspect `git status --short`, tracked changes, untracked files, and every touched source, test, configuration, schema, and migration file. Skip generated artifacts and binaries; inspect lockfiles only for unintended churn.
2. Proactively remove:
   - narration comments and stale comments
   - dead code, unused exports, and obsolete branches
   - duplicated logic that should use an existing canonical helper
   - unnecessary casts, `any`, `unknown`, optionality, and fallback branches
   - bloated types, props, fields, parameters, and pass-through plumbing
   - deep nesting, identity wrappers, and abstractions that add no clarity
   - style or structure inconsistent with the surrounding file
3. Preserve behavior, acceptance criteria, public contracts, schemas, and externally required fields.
4. Re-read the resulting diff once and clean any slop exposed by the first pass.

Do not stage, commit, push, run full CI, edit plan files, or broaden the issue scope. Return `blocked` when cleanup requires an uncertain behavior or contract decision.

## Output

Return only:

```yaml
status: done | blocked
changed: true | false
summary: <one line>
blocker: null | <specific blocker>
```
