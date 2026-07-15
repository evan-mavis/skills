---
name: babysit
description: Keep the single feature PR merge-ready after to-pr by monitoring CI, resolving clear conflicts, and addressing actionable review feedback. Use on draft or ready PRs; never mark a draft ready or merge without explicit user instruction.
---

# Babysit

Drive the existing PR to a clean, green state. Preserve its draft/ready state.

## Loop

1. Resolve the PR and inspect mergeability, checks, unresolved review threads, and whether the branch is behind its base.
2. Fix only failures and feedback caused by this feature branch.
3. Resolve merge conflicts when both intents are clear. Return `blocked` for semantic conflicts.
4. Run `$deslop` inline against the uncommitted fix.
5. Stop editing and spawn a fresh reviewer agent in the same worktree. Give it only the worktree path, PR URL, actionable failure or feedback, and `HEAD` as `review_base`; do not pass the fixer's conversation, rationale, or summary.
6. Have the reviewer run `$thermo-nuclear-code-quality-review` once, return that skill's standard result contract, and exit without staging, committing, or pushing. Never let the fixer and reviewer edit concurrently.
7. After review returns `done`, confirm the diff remains scoped, commit with the repository's allowed prefix, and push. If review blocks, preserve the uncommitted diff and return `blocked`.
8. Recheck until CI is green and actionable threads are resolved, or a real blocker remains.

Do not weaken CI, dismiss valid feedback, change unrelated workflows, mark a draft ready, merge, deploy, or publish a release. Return `blocked` for product, security, architecture, or out-of-scope decisions.

## Output

Return only:

```yaml
status: done | blocked
pr: <url>
review_state: draft | ready
ci: green | failing
comments: resolved | pending
mergeable: true | false
blocker: null | <specific blocker>
```
