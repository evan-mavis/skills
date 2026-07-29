---
name: babysit
description: Keep the single feature PR merge-ready after to-pr by monitoring CI, resolving clear conflicts, and addressing actionable review feedback. Use on draft or ready PRs; never mark a draft ready or merge without explicit user instruction.
---

# Babysit

Drive the existing PR to a clean, green state. Preserve its draft/ready state.

## Loop

1. Resolve the PR and inspect mergeability, checks, unresolved review threads, and whether the branch is behind its base.
2. For each repair cycle, construct a `change_contract` with the PR URL as `source`, the
   actionable branch-caused failure or feedback as `scope`, unrelated failures as `exclusions`,
   pre-fix `HEAD` as `review_base`, and an empty `changed_files` manifest.
3. Fix only failures and feedback inside that contract.
4. Resolve merge conflicts when both intents are clear. Return `blocked` for semantic conflicts.
5. Update `changed_files`, then run `$deslop` with the contract and replace it with the returned
   contract.
6. Stop editing and spawn a fresh reviewer agent in the same worktree. Give it only the worktree
   path, PR URL, actionable failure or feedback, and returned contract; do not pass the fixer's
   conversation, rationale, or summary.
7. Have the reviewer run `$harden-architecture` once with the contract, return that
   skill's standard result contract, and exit without staging, committing, or pushing. Never let
   the fixer and reviewer edit concurrently.
8. After review returns `done`, confirm the diff remains inside `scope` and `changed_files`,
   commit with the repository's allowed prefix, and push. If review blocks, preserve the
   uncommitted diff and return `blocked`.
9. Recheck until CI is green and actionable threads are resolved, or a real blocker remains.

Do not weaken CI, dismiss valid feedback, change unrelated workflows, mark a draft ready, merge, deploy, or publish a release. Return `blocked` for product, security, architecture, or out-of-scope decisions.

## Output

Return only:

```yaml
status: done | blocked
pr: <url>
change_contract:
  source: <pr-url>
  scope: []
  exclusions: []
  review_base: <sha-or-null>
  changed_files:
    - <repo-relative path>
review_state: draft | ready
ci: green | failing
comments: resolved | pending
mergeable: true | false
blocker: null | <specific blocker>
```
