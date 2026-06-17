---
name: babysit
description: Keep a PR merge-ready by triaging comments, resolving clear conflicts, and fixing CI — but stop and ask before committing or pushing when something is unclear or needs human review. Use after the feature branch is ready and a PR exists.
---

# Babysit PR

Get the PR to a merge-ready state: triage comments, resolve clear conflicts, fix in-scope CI failures.

Part of the AI dev workflow: `grill-me` → `to-prd` → `to-issues` → `to-linear` → `forge-issue` → `deslop` → `thermo-nuclear-code-quality-review` → `merge-worktree` → `run-ci` → `to-pr` → **babysit**

Run after [`to-pr`](../to-pr/SKILL.md) has opened or updated the PR (or when the user explicitly invokes `/babysit` on an existing PR).

## Before you commit or push

**Stop and ask the user** before committing or pushing when any of these apply:

- merge conflict resolution is ambiguous or changes intent on either side
- a review comment (including Bugbot) is valid but the fix direction is unclear
- CI failure is outside this PR's scope or would require changing workflows/checks to pass
- a proposed fix needs a product, security, or architecture call
- you disagree with a reviewer or are unsure the report is valid
- the change would be large, risky, or hard to revert

When blocked, explain the concern briefly and wait for guidance. Do not push "best guess" fixes.

## Work loop

1. **Merge conflicts:** resolve when intent is clear on both sides. If intents conflict, abort the merge and ask for clarification — do not commit the resolution.
2. **Comments:** review active unresolved threads (including Bugbot). Filter out resolved threads first. Read only each comment body and the minimum location needed to act. Fix valid change requests in scope. Push back or ask when a comment is wrong, unclear, or out of scope.
3. **CI:** fix failures caused by this PR's changes. Never weaken CI checks/workflows just to green the build. If a failure seems unrelated, check whether the branch is behind the base branch and merge latest first. Re-watch CI after scoped fixes.

Only commit and push after the change is clear, in scope, and does not need human review. Prefer small, scoped commits for triage fixes.

## Git & GitHub

Prefer **`gh`** for GitHub PR operations; use **`git`** for local merge conflict resolution, commits, and push.

- Find the PR: `gh pr view` / `gh pr list --head <branch>`
- Status and metadata: `gh pr view --json state,mergeable,mergeStateStatus,baseRefName,headRefName,url`
- CI: `gh pr checks`
- Comments and review threads: `gh pr view --comments`; use `gh api` when thread-level detail is needed
- Update base when behind: `git fetch origin <base>` then `git merge origin/<base>` (or rebase if repo convention); push with `git push`

Do not use GitHub MCP when `gh` is available.

## Output

Final reply only. No preamble or process narration.

**When blocked on human review:**

```markdown
**Babysit**

- Status: blocked
- Concern: <one line>
- Needs: <what you need from the user>
- Next: waiting for guidance
```

**When done or in progress:**

```markdown
**Babysit**

- PR: <url>
- Status: merge-ready | in progress | blocked
- Merge Conflicts: None | resolved
- Comments: <triaged summary>
- CI: green | failing — <check>
- Next: merge | push fix | waiting for guidance
```

Rules: no preamble; `Next:` always last; say `waiting for guidance` instead of pushing when unsure.
