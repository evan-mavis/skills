# Execution

One orchestrator thread. One Git worktree per slice. Four fresh sequential capability subagents per
worktree. Main orchestrator runs the [capability pipeline](capability-pipeline.md), commits in the
application repo, integrates, and tracks canonical planning state in `specs/<slug>/` issue files and
the index on the feature branch.

## Dispatch

Create each worktree from the current integrated feature branch in the application repo:

```bash
git worktree add -b "wt/<plan-slug>/<local-id>" "<main-workspace>-wt-<local-id>" "<feature-branch>"
```

Pass absolute paths for PRD, issue, and index files under `<app-repo>/specs/<slug>/`. Never let two agents use one worktree.
Pass `data_profile`, `host`, and when needed only env var name and non-secret handoff metadata —
never a connection string.

When the scheduler marks same-stage slices `parallelizable` with disjoint write areas, create and
run separate worktrees concurrently up to host subagent capacity. Never run two capability
subagents in the same checkout at once.

Spawn four fresh subagents sequentially per capability-pipeline.md. Example first subagent prompt:

```text
Implement exactly <local-id> in <absolute worktree path>.
Read issue and PRD from supplied absolute paths under specs/<slug>/.
Use supplied change_contract without widening scope or exclusions.
Follow database runtime binding from supplied descriptor.
Invoke only $implement-slice. Leave diff uncommitted; return only its standard contract.
```

Subsequent prompts invoke only `$deslop`, `$refactor-structure`, then `$harden-architecture` with
the current contract. Validate immutable fields after each exit.

After all four exit:

1. Confirm diff is scoped.
2. Stage issue code changes only.
3. Commit once as `<prefix>: <issue title> (<local-id>)`.
4. Confirm clean worktree with exactly one commit relative to issue base.

Prefix: `feat:`, `patch:`, `tech:`, `refactor:`, or `maintenance:` per repository rules.

Terminal issue result:

```yaml
status: done | blocked
local_id: <local-id>
branch: wt/<plan-slug>/<local-id>
database_binding: verified | not_needed | blocked
change_contract:
  source: <absolute-issue-path-under-specs-slug>
  scope: []
  exclusions: []
  review_base: <issue-base-sha>
  changed_files:
    - <repo-relative path>
summary: <one line>
blocker: null | <specific blocker>
```

Missing fields, unverified database binding, out-of-scope diff, dirty post-commit worktree, or
commit-count mismatch → `blocked`.

## Integration

For each successful issue in dependency-safe order:

1. Rebase private branch onto latest feature branch: `git -C "<worktree>" rebase "<feature-branch>"`.
2. Resolve only unambiguous mechanical conflicts; semantic → `blocked`.
3. Fast-forward feature branch: `git merge --ff-only "wt/<plan-slug>/<local-id>"`.
4. Apply shared integrated-issue state procedure under `specs/<slug>/`; commit and push on the feature branch.
5. Remove clean worktree and delete fully merged local branch (non-forced).

## Resume

Inspect preserved worktrees and branches. Resume the failed phase in place; never duplicate
worktree or branch.
