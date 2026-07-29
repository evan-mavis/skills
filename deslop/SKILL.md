---
name: deslop
description: Clean mechanical AI slop from a scoped uncommitted diff without changing behavior. Removes narration, stale comments, unused code, redundant types/casts, and inconsistent local style before structural or architectural review.
---

# Deslop

Clean the current scoped diff inline. Do not spawn another agent.

Accept or derive `change_contract` per [change contract](../forge-build/references/change-contract.md).

## Process

1. Inspect `git status --short`, tracked changes, untracked files, and every touched source, test, config, schema, and migration file. Skip generated artifacts and binaries.
2. Remove: narration and stale comments; unused imports, locals, exports, and unreachable code; redundant local types, casts, `any`, `unknown`, and optionality; impossible or duplicated fallbacks; scaffolding, placeholders, and debug output; local style inconsistent with the surrounding file.
3. Preserve behavior, acceptance criteria, public contracts, schemas, and externally required fields.
4. Re-read the resulting diff once.

Do not move/rename files, split modules, redesign control flow, or consolidate cross-file business logic. Do not stage, commit, push, run full CI, or edit plan files. Return `blocked` when cleanup needs an uncertain behavior decision.

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
