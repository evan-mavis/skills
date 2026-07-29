# Subagents Mode

Use orchestrator-created Git worktrees and automatic subagent result joins. Default to this mode in Cursor and on any surface without Codex task/worktree thread tools.

## Dispatch

Create each issue worktree from the current integrated feature branch:

```bash
git worktree add -b "wt/<plan-slug>/<local-id>" "<main-workspace>-wt-<local-id>" "<feature-branch>"
```

Pass absolute main-workspace PRD, issue, and index paths because ignored plan files may be absent from the worktree. Never let two agents use one worktree concurrently.
Pass the persisted `data_profile` and, when needed, only the database environment-variable name
and protected temporary environment-file path. Never include a connection string in a subagent
prompt.

Give the implementation subagent:

```text
Implement exactly <local-id> in <absolute worktree path>.
Read the issue and PRD from the supplied absolute paths.
Use the supplied <change-contract> without widening scope or exclusions.
Use the supplied <data-profile> and database environment descriptor. Before any
database-dependent command, load the protected environment into that process and verify the
connected database matches the supplied isolated environment. Do not print, persist, or return
database credentials. Do not edit dotenv files or shell profiles. When querying through
$query-local-db, pass `--database-url-env <supplied-variable-name>` to its helper.
Run $forge-issue with the issue as source and the PRD as context. Pass its returned contract to
$deslop, then pass that returned contract to $refactor-structure.
Do not run thermo, update plan files, stage, commit, push, open a PR, or run full CI.
Leave the cleaned diff uncommitted and return only the implementation contract.
```

Require:

```yaml
status: done | blocked
local_id: <local-id>
branch: wt/<plan-slug>/<local-id>
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

## Independent issue review

After the implementation subagent returns `done` and exits, spawn a fresh reviewer subagent for the same worktree. Give it only the worktree, PRD, issue, and issue base SHA. Do not pass implementation conversation, rationale, or summary.

```text
Independently review exactly <local-id> in <absolute worktree path>.
Judge the resulting diff against the supplied issue and PRD.
Run $thermo-nuclear-code-quality-review with the implementation result's change_contract.
Do not spawn another agent, update plan files, stage, commit, push, open a PR, or run full CI.
Return only the review contract.
```

Require:

```yaml
status: done | blocked
local_id: <local-id>
changed: true | false
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

After review exits:

1. Confirm the diff is scoped.
2. Stage only issue code changes.
3. Commit exactly once as `<prefix>: <issue title> (<local-id>)`.
4. Confirm the worktree is clean and the branch contains exactly one commit relative to the issue base.

Choose the prefix from `feat:`, `patch:`, `tech:`, `refactor:`, or `maintenance:`, subject to stricter repository rules.

## Integration

For each successful issue in dependency-safe order:

1. Rebase its private branch onto the latest feature branch:

   ```bash
   git -C "<worktree>" rebase "<feature-branch>"
   ```

2. Resolve only unambiguous mechanical conflicts. Return `blocked` for semantic conflicts.
3. Fast-forward the feature branch:

   ```bash
   git merge --ff-only "wt/<plan-slug>/<local-id>"
   ```

4. Apply the shared integrated-issue state procedure.
5. Remove the clean worktree and delete the fully merged local branch with non-forced commands.

Treat a missing result field, required database binding that is not `verified`, out-of-scope
diff, dirty post-commit worktree, or commit-count mismatch as blocked.

## Resume

Inspect preserved worktrees and branches before spawning. Resume the failed phase in place; never duplicate an existing issue worktree or branch.
