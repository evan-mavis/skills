# Subagents Mode

Use orchestrator-created Git worktrees and automatic subagent result joins.

## Dispatch

Create each issue worktree from the current integrated feature branch:

```bash
git worktree add -b "wt/<plan-slug>/<local-id>" "<main-workspace>-wt-<local-id>" "<feature-branch>"
```

Pass absolute main-workspace PRD, issue, and index paths because ignored plan files may be absent from the worktree. Never let two agents use one worktree concurrently.

Give the implementation subagent:

```text
Implement exactly <local-id> in <absolute worktree path>.
Read the issue and PRD from the supplied absolute paths.
Run $forge-issue with execution_mode subagents, then $deslop inline.
Do not run thermo, update plan files, stage, commit, push, open a PR, or run full CI.
Leave the cleaned diff uncommitted and return only the implementation contract.
```

Require:

```yaml
status: done | blocked
local_id: <local-id>
branch: wt/<plan-slug>/<local-id>
summary: <one line>
blocker: null | <specific blocker>
```

## Independent issue review

After the implementation subagent returns `done` and exits, spawn a fresh reviewer subagent for the same worktree. Give it only the worktree, PRD, issue, and issue base SHA. Do not pass implementation conversation, rationale, or summary.

```text
Independently review exactly <local-id> in <absolute worktree path>.
Judge the resulting diff against the supplied issue and PRD.
Run $thermo-nuclear-code-quality-review with <issue-base-sha> as review_base.
Do not spawn another agent, update plan files, stage, commit, push, open a PR, or run full CI.
Return only the review contract.
```

Require:

```yaml
status: done | blocked
local_id: <local-id>
changed: true | false
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

Treat a missing result field, out-of-scope diff, dirty post-commit worktree, or commit-count mismatch as blocked.

## Resume

Inspect preserved worktrees and branches before spawning. Resume the failed phase in place; never duplicate an existing issue worktree or branch.
