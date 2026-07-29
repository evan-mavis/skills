---
name: deslop
description: Clean mechanical AI slop and dead code from a scoped uncommitted diff without changing behavior. Removes narration, stale comments, unused symbols, unreachable paths, redundant types/casts, and inconsistent local style before structural or architectural review.
---

# Deslop

Clean the current scoped diff inline. Do not spawn another agent.

Accept or derive `change_contract` per [change contract](../forge-build/references/change-contract.md).

## Process

1. Inspect `git status --short`, tracked changes, untracked files, and every touched source, test, config, schema, and migration file. Skip generated artifacts and binaries.
2. Remove slop and dead code within scope: narration and stale comments; unused imports, locals, parameters, exports, and unreachable code; orphaned helpers and commented-out blocks the diff left behind; stale re-exports or wiring to removed symbols; redundant types, casts, `any`, `unknown`, and optionality; impossible or duplicated fallbacks; scaffolding, placeholders, and debug output; local style inconsistent with the surrounding file. Grep in-scope references before deleting exports. Return `blocked` when removal might break external callers or behavior you cannot verify.
3. Preserve behavior, acceptance criteria, public contracts, schemas, and externally required fields.
4. Re-read the resulting diff once.

Do not move/rename files, split modules, redesign control flow, consolidate cross-file business logic, or hunt dead code outside the scoped diff. Do not stage, commit, push, run full CI, or edit plan files. Return `blocked` when cleanup needs an uncertain behavior decision.

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
