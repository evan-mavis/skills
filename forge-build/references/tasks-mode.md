# Tasks Mode

Use visible Codex tasks with app-managed worktrees. The issue task implements directly so this mode does not add an implementation-subagent hop; it still spawns a fresh reviewer subagent before committing.

## Availability

Require callable Codex tools to list projects, create a project task in a worktree, read task status and turns, send follow-up messages, set task titles, and archive completed tasks. Task creation must support a worktree starting from the current feature branch.

Do not use this mode in Cursor. Default to `subagents` there because Cursor does not provide the separate Codex task/worktree thread flow required by this contract.

The selected `tasks` mode is explicit user authorization to create these issue tasks. If any required capability is unavailable, return `blocked` before creating partial task state.

## Dispatch

For every eligible issue in the current wave:

1. Resolve the current project ID.
2. Record the current feature `HEAD` as the issue base SHA.
3. Create a project task with `environment: worktree` and the existing feature branch as its starting state.
4. Title it `forge-build: <plan-slug> <local-id>`.
5. Record its returned thread or client-thread ID in the canonical issue file.
6. Pass absolute main-workspace PRD, issue, and index paths because ignored plan files may be absent from the managed worktree.

Give the issue task:

```text
Execute exactly <local-id> as a forge-build issue task.
Work only in your Codex-managed worktree, which must start at <issue-base-sha>.
Read the issue and PRD from the supplied absolute paths.
Run $forge-issue with execution_mode tasks, then $deslop inline.
Do not update plan files, modify the main feature workspace, push, open a PR, or run full CI.

After implementation and deslop, stop editing and spawn one fresh reviewer subagent with no inherited implementation turns. Give it only your absolute worktree path, the PRD, the issue, and <issue-base-sha>. Have it run $thermo-nuclear-code-quality-review with that SHA as review_base. The reviewer must not stage, commit, push, or spawn another agent.

After the reviewer exits done, confirm the diff is scoped, stage only issue code changes, and create exactly one commit:
<prefix>: <issue title> (<local-id>)

Remain on the managed detached checkout. Return only the issue-task result contract.
```

Choose the prefix from `feat:`, `patch:`, `tech:`, `refactor:`, or `maintenance:`, subject to stricter repository rules.

Require:

```yaml
status: done | blocked
local_id: <local-id>
worktree: <absolute-managed-worktree-path>
base_sha: <issue-base-sha>
commit_sha: <sha-or-null>
summary: <one line>
blocker: null | <specific blocker>
```

The task must return `blocked` without committing if implementation or review blocks.

## Monitoring

Task results do not automatically join the parent task.

- Track every created task ID.
- Read each task with modest backoff until its terminal result contract appears. Do not tight-poll or narrate unchanged state.
- Use follow-up messages to resume a blocked task after its blocker is resolved.
- Treat a missing or malformed terminal contract as blocked.
- Do not create a duplicate task on resume.

## Integration

For each successful task in dependency-safe global order:

1. Confirm `commit_sha` exists, its parent is exactly `base_sha`, and its diff is scoped to the issue.
2. Confirm its commit message matches `<prefix>: <issue title> (<local-id>)`.
3. Cherry-pick it onto the latest feature branch:

   ```bash
   git cherry-pick "<commit-sha>"
   ```

4. Resolve only unambiguous mechanical conflicts. For semantic conflicts, abort the cherry-pick, preserve the issue task, and return `blocked`.
5. Apply the shared integrated-issue state procedure using the resulting integrated commit SHA.
6. Archive the successful issue task after integration and let Codex manage its worktree cleanup. Never manually delete a Codex-managed worktree.

Do not create a local issue branch in this mode.

## Resume

Record `thread_id`, `worktree`, `base_sha`, and `commit_sha` when available. Inspect the existing task first. Send it a focused follow-up to resume the failed phase; never recreate the task unless its managed worktree is irrecoverably unavailable.
