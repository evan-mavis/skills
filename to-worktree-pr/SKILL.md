---
name: to-worktree-pr
description: Create a parallel GitHub pull request from an isolated worktree branch into the parent feature branch. Use at sub-agent closeout after forge-issue parallel-subagent-prs work — after deslop, commit, and push — with a minimal PR body and local issue id in the title.
---

# To Worktree PR

Open a **parallel sub-issue PR** from the current worktree branch into the **parent feature branch** (not `development`). For issue slices forged in isolation via `parallel-subagent-prs`.

This is **not** a stacked PR chain — the base is always the feature branch, not another PR branch. Multiple sub-agents each open independent PRs targeting the same feature branch.

Part of the AI dev workflow: `forge-issue` (`parallel-subagent-prs`) → `deslop` → **to-worktree-pr** → (merge on GitHub) → main thread index refresh → `to-pr` + `babysit` when the feature is ready

Run at **sub-agent closeout** after `deslop`, commit, and push. Do **not** run `run-ci`, thermo-nuclear review, or `babysit` here — PR CI and Bugbot cover quality gates.

## Inputs

Accept any of:

- implicit context from the sub-agent closeout (preferred)
- explicit: feature branch name, plan slug, issue `local_id`, issue file path

Required context before opening the PR:

| Field | Source |
| ----- | ------ |
| **Head branch** | Current worktree branch: `wt/<plan-slug>/<local-id>` |
| **Base branch** | Parent feature branch the worktree was cut from |
| **Plan slug** | Plan directory name under `plans/in-progress/<slug>/` |
| **Local id** | Issue frontmatter `local_id` (e.g. `issue-003`) |

If base branch or local id is missing, stop and ask.

## Title format

Same prefix rules as [`to-pr`](../to-pr/SKILL.md), but use **local id only** — never Linear ids in parallel sub-issue PR titles.

```
[Feat|Fix|Improvement|Tech]: [feature name] ([local-id])
```

Examples:

- `[Feat]: buyer credit validation (issue-003)`
- `[Tech]: extract shared credit helpers (issue-007)`

Pick the prefix from change type, issue content, or parent plan/PRD.

## PR body — minimal override

Do **not** fill the full repo PR template. Use this structure only:

```markdown
> **Parallel sub-issue PR** — merges into `<feature-branch>`. Sub-issue `<local-id>` of plan `<plan-slug>`. Review in isolation; do not merge to `development` directly.

## Summary

<1–4 sentences: what changed and why, scoped to this issue slice>
```

Pull summary content from: branch diff vs feature branch, issue Acceptance Criteria, Implementation Notes, and commit messages.

## Git & GitHub

Prefer **`gh`** for GitHub operations; use **`git`** for local state.

1. Confirm current branch is `wt/<plan-slug>/<local-id>`.
2. Confirm base branch exists: `git rev-parse --verify <feature-branch>`.
3. Inspect: `git status`, unpushed commits (`git log @{u}..HEAD` when tracking exists).
4. Gather diff: `git diff --stat <feature-branch>...HEAD` and `git log --oneline <feature-branch>..HEAD`.
5. If a PR already exists for this head branch, update with `gh pr edit`; otherwise push and create.

Push (set upstream on first push):

```bash
git push -u origin HEAD
```

Create PR targeting the feature branch:

```bash
gh pr create --base <feature-branch> --head <head-branch> --title "..." --body "$(cat <<'EOF'
...
EOF
)"
```

Do not merge. Do not babysit CI here.

## Preconditions

Stop before opening the PR if:

- there are uncommitted changes (commit first)
- the issue file is not updated (`completed: true`, Implementation Notes filled)
- `00-index.md` was modified in this branch (sub-agents must not touch the index)
- base branch is `development`, `main`, or `master` unless the user explicitly confirms

## Process

1. Verify preconditions and required context.
2. Draft title with local id parenthetical.
3. Draft minimal body from diff and issue context.
4. Push if needed, then create or update the PR.
5. Report the PR URL to the user (or main thread when run from a sub-agent).

## Output

Final reply only. No preamble or process narration.

```markdown
**Worktree PR**

- Title: [Feat|Fix|Improvement|Tech]: … (issue-NNN)
- URL: <github pr url>
- Base: <feature-branch>
- Head: wt/<plan-slug>/<local-id>
- Next: merge on GitHub, then tell main thread to refresh plan index
```

Rules: no preamble; `Next:` always last; do not include Linear ids in the title; do not fill full PR template sections.
