# Subagents Mode

Use orchestrator-created Git worktrees and automatic subagent result joins. The main Forge Build
orchestrator stays coordination-only and runs four fresh sequential capability subagents in each
issue worktree. Default to this mode in Cursor and on any surface without Codex task/worktree
thread tools.

## Dispatch

Create each issue worktree from the current integrated feature branch:

```bash
git worktree add -b "wt/<plan-slug>/<local-id>" "<main-workspace>-wt-<local-id>" "<feature-branch>"
```

Pass absolute main-workspace PRD, issue, and index paths because ignored plan files may be absent from the worktree. Never let two agents use one worktree concurrently.
Pass the persisted `data_profile` and, when needed, only the database environment-variable name
and protected temporary environment-file path. Never include a connection string in a subagent
prompt.

For every capability subagent, pass only the absolute worktree path, issue and PRD paths, current
canonical `change_contract`, and the minimum non-secret database descriptor it needs. Do not
pass any earlier subagent conversation, rationale, or summary. Require it not to spawn another
agent, update plan files, stage, commit, push, open a PR, or run full CI. Never run two
capability subagents concurrently in one worktree.

Give the first fresh subagent:

```text
Implement exactly <local-id> in <absolute worktree path>.
Read the issue and PRD from the supplied absolute paths.
Use the supplied <change-contract> without widening scope or exclusions.
Use the supplied <data-profile> and database environment descriptor. Before any
database-dependent command, load the protected environment into that process and verify the
connected database matches the supplied isolated environment. Do not print, persist, or return
database credentials. Do not edit dotenv files or shell profiles. When querying through
$query-local-db, pass `--database-url-env <supplied-variable-name>` to its helper.
Invoke only $forge-issue with the issue as source and the PRD as context.
Do not invoke another capability or spawn another agent.
Leave the implementation diff uncommitted and return only $forge-issue's standard contract.
```

After it exits `done`, validate the immutable contract fields and exact `changed_files` manifest,
then replace the canonical contract. Spawn the second fresh subagent:

```text
Clean exactly <local-id> in <absolute worktree path>.
Read the issue and PRD from the supplied absolute paths.
Invoke only $deslop with the supplied current change_contract.
Do not invoke another capability or spawn another agent.
Leave the cleaned diff uncommitted and return only $deslop's standard contract.
```

After it exits `done`, validate and replace the contract. Spawn the third fresh subagent:

```text
Structurally refactor exactly <local-id> in <absolute worktree path>.
Read the issue and PRD from the supplied absolute paths.
Invoke only $refactor-structure with the supplied current change_contract.
Do not invoke another capability or spawn another agent.
Leave the reviewed diff uncommitted and return only $refactor-structure's standard contract.
```

After it exits `done`, validate and replace the contract. Spawn the fourth fresh subagent:

```text
Independently review exactly <local-id> in <absolute worktree path>.
Judge the resulting diff against the supplied issue and PRD.
Invoke only $thermo-nuclear-code-quality-review with the supplied current change_contract.
Do not invoke another capability or spawn another agent.
Leave the reviewed diff uncommitted and return only the review skill's standard contract.
```

Require every joined subagent result to preserve `source`, `scope`, `exclusions`, and
`review_base`, and require its `changed_files` to exactly match the current worktree diff. The
final issue result is:

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

After all four subagents exit:

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
