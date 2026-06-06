---
name: merge-worktree-branch
description: Merge a completed isolated worktree branch back into the current main feature branch. Use from the main chat thread when the user wants to pull in changes from a parallel issue worktree, select from existing git worktrees, confirm the destination branch, resolve merge conflicts, and leave the result ready for review or commit.
---

# Merge Worktree Branch

Merge a completed branch from an isolated worktree into the branch currently checked out in the main workspace. This skill is for the main chat thread, not the individual implementation worktree chat.

## Inputs

Accept any of:

- a source worktree path
- a source branch name
- a request like "merge a worktree branch", "pull in a parallel issue branch", or "merge that worktree back"

If the source is not specified, list current git worktrees and ask the user which branch or path to merge.

## Workflow

### 1. Confirm the destination context

Treat the current workspace and current branch as the destination feature branch.

Inspect:

- `pwd`
- `git status --short --branch`
- `git branch --show-current`
- `git worktree list --porcelain`

Stop before merging if:

- the current workspace is the source worktree rather than the main workspace
- the current branch is missing or detached
- the destination has uncommitted changes that are unrelated to the merge and the user has not confirmed proceeding with a dirty tree

Do not switch branches unless the user explicitly asks.

### 2. Resolve the source branch

If the user supplied a worktree path, map it to its branch using `git worktree list --porcelain` or `git -C <path> branch --show-current`.

If the user supplied a branch name, verify it exists locally with `git rev-parse --verify <branch>`.

If no source was supplied, present a structured decision UI:

- Header: `Source Worktree`
- Question: `Which worktree branch should I merge into the current destination branch?`
- Options: one option per candidate worktree, labeled with branch name and path, excluding the current workspace
- Include `Cancel` when available

Before confirmation, inspect the source worktree status when a path is known. If it has uncommitted or untracked changes, stop and ask the user to finish or commit those changes in the source worktree first. Do not silently copy uncommitted files across worktrees.

### 3. Show the merge summary

Summarize what will be merged:

- destination branch and workspace
- source branch and worktree path when known
- commits unique to the source: `git log --oneline <destination>..<source>`
- changed file summary: `git diff --stat <destination>...<source>`

If the source branch is already merged into the destination, report that and stop.

Ask for confirmation with a structured decision UI:

- Header: `Merge`
- Question: `Merge <source branch> into <destination branch>?`
- Options:
  - `Merge and commit if needed (Recommended)`: Run the merge, resolve conflicts, and create the normal merge commit when Git requires one.
  - `Merge without committing`: Run the merge and resolve conflicts, but leave the result staged or unstaged for review.
  - `Cancel`: Do not merge.

The first option is explicit permission to create a merge commit if Git requires one. Do not push.

### 4. Merge safely

After confirmation, merge the source branch into the destination branch.

Preferred command:

```bash
git merge --no-ff --no-commit <source-branch>
```

Use `--no-commit` so conflicts and resulting changes can be inspected before the final commit. If Git reports the branch is already up to date, stop with a concise summary.

Do not use destructive commands such as `git reset --hard`, `git checkout --`, or force pushes.

### 5. Resolve conflicts

If conflicts occur:

1. Inspect `git status --short` and the conflicted files.
2. Read each conflicted file before editing.
3. Resolve conflicts in favor of the combined intended behavior, preserving the destination branch's current feature context and the source branch's completed issue slice.
4. Keep shared plan files such as `00-index.md` and `diagram.md` coherent when both branches updated them.
5. Stage resolved files only when they are part of the merge resolution.
6. If the correct resolution is ambiguous, stop and ask the user instead of guessing.

After conflict resolution, inspect `git diff --check` when appropriate. Respect user preferences and do not run lint, typecheck, tests, build, or format unless explicitly requested. Use `ReadLints` for recently edited files after substantive conflict edits.

### 6. Commit or leave staged

If the user chose `Merge and commit if needed`:

- run `git status --short --branch`
- run `git diff --cached --stat`
- run `git log --oneline -5`
- commit with a concise message that follows the user's commit prefix rules, typically `maintenance: merge worktree branch <source-branch>`
- pass the commit message via HEREDOC

If the user chose `Merge without committing`, leave the merge in progress or staged as appropriate and report the exact status.

Never amend, skip hooks, or push unless the user explicitly asks.

### 7. Output

Report:

```markdown
**Merge Complete**
- Destination: <branch and workspace>
- Source: <branch and worktree path>
- Result: merged and committed | merged without commit | already merged | blocked
- Conflicts: <none or files resolved>
- Validation: <checks run or not run>
- Next: <review status, commit status, or blocker>
```

If blocked, include the reason and the safest next action.
