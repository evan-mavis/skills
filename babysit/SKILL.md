---
name: babysit
description: Keep a feature PR merge-ready after to-pr — monitor CI, resolve clear conflicts, address actionable review feedback. Never mark draft ready or merge without explicit user instruction.
---

# Babysit

Drive the existing PR to clean, green state. Preserve draft/ready status.

Construct repair `change_contract` per [change contract](../forge-build/references/change-contract.md)
with PR URL as `source`, actionable failure/feedback as `scope`, unrelated failures as `exclusions`,
pre-fix `HEAD` as `review_base`.

## Loop

1. Inspect mergeability, checks, unresolved review threads, and whether branch is behind base.
2. Fix only in-contract failures and feedback. Return `blocked` for semantic merge conflicts.
3. Run `$deslop`; replace contract with result.
4. Spawn fresh reviewer with worktree path, PR URL, failure/feedback, and contract only — no fixer
   context. Reviewer runs `$harden-architecture` once per [partial pipeline](../forge-build/references/capability-pipeline.md#partial-pipelines); no staging/committing/pushing.
5. After review `done`, confirm diff inside scope; commit with allowed prefix; push.
6. Recheck until CI green and actionable threads resolved, or a real blocker remains.

Do not weaken CI, dismiss valid feedback, mark draft ready, merge, deploy, or release. Return
`blocked` for product, security, architecture, or out-of-scope decisions.

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
