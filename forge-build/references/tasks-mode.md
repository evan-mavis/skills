# Tasks Mode

Use visible Codex issue-orchestrator tasks with app-managed worktrees. Each issue task stays
coordination-only and spawns four fresh sequential capability subagents in its managed worktree
before committing their final scoped diff.

## Availability

Require callable Codex tools to list projects, create a project task in a worktree, read task status and turns, send follow-up messages, and set task titles. Task creation must support a worktree starting from the current feature branch.

Do not use this mode in Cursor. Default to `subagents` there because Cursor does not provide the separate Codex task/worktree thread flow required by this contract.

The selected `tasks` mode is explicit user authorization to create these issue tasks. If any required capability is unavailable, return `blocked` before creating partial task state.

## Dispatch

For every eligible issue in the current wave:

1. Resolve the current project ID.
2. Record the current feature `HEAD` as the issue base SHA.
3. Create a project task with `environment: worktree` and the existing feature branch as its starting state.
4. Title it with the issue title only. Keep it short and plain so the full title is easy to read in the sidebar; omit `forge-build`, the plan slug, and the local ID.
5. Record its returned thread or client-thread ID in the canonical issue file.
6. Pass absolute main-workspace PRD, issue, and index paths because ignored plan files may be absent from the managed worktree.
7. Pass the persisted `data_profile` and, when needed, only the database environment-variable
   name and protected temporary environment-file path. Never include a connection string in the
   task prompt.

Give the issue task:

```text
Execute exactly <local-id> as a forge-build issue task.
Work only in your Codex-managed worktree, which must start at <issue-base-sha>.
Read the issue and PRD from the supplied absolute paths.
Use the supplied <change-contract> without widening scope or exclusions.
You are the issue orchestrator. Do not implement, clean, restructure, or review code yourself.
Use the supplied <data-profile> and database environment descriptor. Before any
database-dependent command, load the protected environment into that process and verify the
connected database matches the supplied isolated environment. Do not print, persist, or return
database credentials. Do not edit dotenv files or shell profiles. When querying through
$query-local-db, pass `--database-url-env <supplied-variable-name>` to its helper.

Run this exact sequential pipeline in the managed worktree:
1. Spawn a fresh subagent that invokes only $forge-issue.
2. After it exits done and its contract is validated, spawn a fresh subagent that invokes only
   $deslop.
3. After it exits done and its contract is validated, spawn a fresh subagent that invokes only
   $refactor-structure.
4. After it exits done and its contract is validated, spawn a fresh subagent that invokes only
   $thermo-nuclear-code-quality-review.

Give each subagent only the absolute worktree path, issue and PRD paths, current canonical
change_contract, and the minimum non-secret database descriptor it needs. Do not pass any prior
subagent conversation, rationale, or summary. Require each subagent not to spawn another agent,
update plan files, stage, commit, push, open a PR, or run full CI. Never run two of these
subagents concurrently.

After each subagent exits, require its standard terminal contract. Reject a changed source,
scope, exclusions, or review_base, or a changed_files manifest that does not exactly match the
worktree diff. Replace the canonical contract only after validation.

After all four subagents exit done, confirm the final diff is scoped, stage only issue code
changes, and create exactly one commit:
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
database_binding: verified | not_needed | blocked
change_contract:
  source: <absolute-issue-path>
  scope: []
  exclusions: []
  review_base: <issue-base-sha>
  changed_files:
    - <repo-relative path>
summary: <one line>
blocker: null | <specific blocker>
```

The task must return `blocked` without committing if any capability or required database binding
blocks.

## Task Retention

Keep every spawned issue task unarchived, whether it succeeds or blocks. Never auto-archive a task created by this mode, and never manually delete its Codex-managed worktree. Archiving and cleanup require a separate explicit user request.

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
6. Keep the successful issue task unarchived for later inspection.

Do not create a local issue branch in this mode.

## Resume

Record `thread_id`, `worktree`, `base_sha`, and `commit_sha` when available. Inspect the existing task first. Send it a focused follow-up to resume the failed phase; never recreate the task unless its managed worktree is irrecoverably unavailable.
