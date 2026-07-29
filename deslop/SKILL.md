---
name: deslop
description: Proactively clean mechanical AI slop from a scoped uncommitted code diff without changing behavior. Use directly on implementation or repair changes to remove narration, stale comments, unused code, redundant local types or casts, impossible fallbacks, and inconsistent local style before structural or architectural review.
---

# Deslop

Clean the current scoped diff inline. Do not spawn another agent; modify only the current
checkout.

## Change contract

Accept a caller-supplied contract or derive it from the current request and uncommitted diff:

```yaml
change_contract:
  source: <prompt-or-source-url-or-path>
  scope: []
  exclusions: []
  review_base: <sha>
  changed_files:
    - <repo-relative path>
```

Validate that every changed file belongs to `scope` and none belongs to `exclusions`. Preserve the
contract and update `changed_files` after cleanup. Return `blocked` rather than absorbing an
unexplained file.

## Process

1. Inspect `git status --short`, tracked changes, untracked files, and every touched source, test, configuration, schema, and migration file. Skip generated artifacts and binaries; inspect lockfiles only for unintended churn.
2. Proactively remove:
   - narration comments and stale comments
   - unused imports, locals, exports, and code made unreachable by the scoped change
   - redundant local types, annotations, casts, `any`, `unknown`, and optionality
   - impossible or duplicated local fallback branches
   - temporary scaffolding, placeholder code, and accidental debug output
   - local style inconsistent with the surrounding file
3. Preserve behavior, acceptance criteria, public contracts, schemas, and externally required fields.
4. Re-read the resulting diff once and clean any slop exposed by the first pass.

Do not move or rename files, split modules, relocate feature ownership, redesign control flow,
replace domain abstractions, or consolidate cross-file business logic. Those are structural or
architectural concerns.

Do not stage, commit, push, run full CI, edit plan files, or broaden the issue scope. Return `blocked` when cleanup requires an uncertain behavior or contract decision.

## Output

Return only:

```yaml
status: done | blocked
changed: true | false
change_contract:
  source: <prompt-or-source-url-or-path>
  scope: []
  exclusions: []
  review_base: <sha>
  changed_files:
    - <repo-relative path>
summary: <one line>
blocker: null | <specific blocker>
```
