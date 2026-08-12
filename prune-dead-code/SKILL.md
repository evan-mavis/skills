---
name: prune-dead-code
description: Remove unused symbols, orphaned files, and unreachable paths introduced or exposed on a feature branch without changing behavior. Use when cleaning up a branch before review or merge, or when the user asks to prune dead code on a feature branch.
---

# Prune Dead Code

Remove dead code across the current feature branch inline. Do not spawn another agent.

Accept or derive `change_contract` per [change contract](../forge-build/references/change-contract.md).
Default `review_base` to the merge base with the repository's default branch when the caller does not supply one.

## Scope

Work across the branch diff (`git diff <review_base>`, `git status --short`, and untracked files in scope). Prefer removals that became dead because of branch changes. Do not hunt unrelated legacy code outside the branch footprint unless it is an obvious orphan of code the branch removed.

## Process

1. Resolve `review_base`, the default branch, and every file touched on the branch. Map added, modified, deleted, and renamed paths.
2. Find high-confidence dead code within scope:
   - unused exports, functions, methods, hooks, components, types, constants, and env/config keys
   - orphaned files or modules with no remaining importers or callers
   - stale imports, re-exports, barrel entries, and wiring to removed symbols
   - unreachable branches, duplicate implementations, and helpers only referenced from deleted code
   - commented-out blocks and scaffolding left behind by branch refactors
3. Grep the repository for references before deleting exports, files, or public symbols. Treat dynamic imports, reflection, codegen, test-only usage, and cross-package boundaries as potential callers.
4. Remove only when behavior and external contracts stay unchanged. Preserve acceptance criteria, schemas, migrations, permissions, and required public APIs.
5. Re-read the resulting diff once.

Do not remove narration, stale comments, redundant casts, or local style issues — that is `$deslop`. Do not move/rename files for organization — that is `$refactor-structure`. Do not redesign control flow or domain boundaries. Do not stage, commit, push, run full CI, or edit plan files. Return `blocked` when removal might break external callers or behavior you cannot verify.

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
