---
name: forge-issue
description: Implement one explicitly assigned local issue inside a prepared isolated checkout. Use as the atomic implementation worker within forge-build when the execution mode, issue path, PRD path, worktree, and base SHA are already supplied.
---

# Forge Issue

Implement exactly one assigned issue. Do not select work, ask for implementation options, create worktrees, schedule siblings, update plan state, commit, push, or open pull requests.

## Required inputs

- absolute issue file path
- absolute parent PRD path
- absolute issue worktree path
- issue base SHA
- execution mode: `tasks` or `subagents`

Return `blocked` if any input is missing, the issue is already complete, a blocker is incomplete, or the issue is `hitl`.

Validate the isolated checkout by mode:

- `subagents`: require the assigned `wt/<plan-slug>/<local-id>` branch.
- `tasks`: require a dedicated Codex-managed worktree whose unchanged `HEAD` equals the issue base SHA. Accept its normal detached HEAD; reject the main feature checkout or any checkout containing pre-existing changes.

## Execute

1. Read the issue, PRD, applicable `AGENTS.md`, and only the blocking issue context needed to understand established contracts.
2. Inspect the owning code and nearby patterns. Treat the issue Acceptance Criteria and Approach as scope; treat the PRD as context, not permission to absorb sibling work.
3. Implement the complete issue behavior with production-quality structure.
4. Reuse canonical helpers and layers. Remove dead code exposed by the change and collapse duplication within scope.
5. Do not add compatibility shims, speculative abstractions, broad defensive fallbacks, or unrelated cleanup.
6. Do not run browser checks, targeted sanity checks, or full CI. `forge-build` owns final validation after integration.
7. Leave all implementation changes uncommitted for `$deslop` in the current worker and the fresh independent thermo reviewer.

Return `blocked` instead of guessing when acceptance behavior, a public contract, schema intent, permissions, security behavior, or required shared groundwork is unresolved.

## Output

Return only:

```yaml
status: done | blocked
local_id: <local-id>
summary: <one line>
changed_files:
  - <repo-relative path>
blocker: null | <specific blocker>
```
