# Branches

Forge does **not** create or rename the delivery / feature branch. The user (or host) has already
checked out the correct branch before `$forge-issue` or `$forge-build` runs.

## Rules

1. Use the current branch as-is. Persist its name in the working contract / closeout output.
2. Return `blocked` only if HEAD is detached with no usable branch, or the checkout is clearly the
   wrong repo — not because the name fails a pattern.
3. Do not invent Linear IDs, prefixes, or slugs for git branches.
4. Cloud hosts may provision the workspace branch; still use whatever is checked out.

## forge-build worktrees only

Per-slice worktrees may use internal names (`wt/<plan-slug>/<local-id>`). Those are dispatch
mechanics — do not rename the feature branch to match them.
