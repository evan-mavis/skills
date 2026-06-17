---
name: to-pr
description: Create or update a GitHub pull request using the repo PR template, `[Feat|Fix|Improvement|Tech]` title format, and Linear ids when present. Use after run-ci passes and before babysit.
---

# To PR

Create or update the GitHub pull request for the current branch.

Part of the AI dev workflow: `grill-me` → `to-prd` → `to-issues` → `to-linear` → `forge-issue` → `deslop` → `thermo-nuclear-code-quality-review` → `merge-worktree` → `run-ci` → **to-pr** → `babysit`

Run after [`run-ci`](../run-ci/SKILL.md) passes. Use `babysit` after the PR exists.

## Title format

```
[Feat|Fix|Improvement|Tech]: [feature name] ([AIR-XXX])
```

- **Feat** — new user-facing capability
- **Fix** — bug fix
- **Improvement** — enhancement to existing behavior
- **Tech** — internal, infra, refactor, or tooling-only work

Append Linear id(s) at the end **only when known**. Multiple ids: `(AIR-123, AIR-124)`.

When no Linear id is available, omit the parenthetical:

```
[Feat|Fix|Improvement|Tech]: [feature name]
```

Pick the prefix from the change type, branch name (`feat/`, `fix/`, etc.), or the parent plan/PRD when obvious.

If repo rules specify a different title shape, follow repo rules for title format. Otherwise use the format above.

## Linear id

Resolve in this order:

1. **User prompt** — Linear id(s) or URL the user passed when invoking the skill
2. **Context** — chat, branch diff, commit messages, and local `plans/` files (`linear_issue` frontmatter on PRD/issues, `00-index.md`, linked Linear URLs)
3. **Omit** — if nothing is passed in and nothing credible is found in context, leave the id out of the title. Do not ask, guess, or invent ids.

## PR template

1. Look for a repo PR template in context, in this order:
   - `.github/pull_request_template.md`
   - `.github/PULL_REQUEST_TEMPLATE.md`
   - `.github/PULL_REQUEST_TEMPLATE/*.md`
   - any path the user or repo rules reference
2. If a template exists, **follow its sections and headings** — do not invent a different structure.
3. If no template exists, use a short default: Summary, Changes, Test plan, Links.

Fill every section concisely but completely. Casual, parsable tone — plain language, short bullets, no corporate filler.

Pull content from: branch diff vs base, local `plans/` PRD/issues when present, commit messages, and chat context. Link parent tracker issues in the body when known.

## Git & GitHub

Prefer **`gh`** for GitHub operations; use **`git`** for local repo state and diffs.

1. Resolve base branch: `gh repo view --json defaultBranchRef`, upstream tracking, or repo rules.
2. Inspect state: `git status`, `git branch -vv`, unpushed commits (`git log @{u}..HEAD` when tracking exists).
3. Gather diff context: `git diff --stat <base>...HEAD` and `git log --oneline <base>..HEAD`; if a PR already exists, `gh pr view` / `gh pr diff`.
4. Push if needed (`git push`), then create or update with `gh pr create` or `gh pr edit`. Do not use GitHub MCP when `gh` is available.

## Process

1. Run the Git & GitHub steps above.
2. Resolve the Linear id using the rules above, then draft the title.
3. Draft the PR body from the repo template. Confirm with the user if base branch or title prefix is ambiguous, or if multiple conflicting Linear ids appear in context.
4. Do not merge. Do not babysit CI/comments here — that is `babysit`.

## Output

Final reply only. No preamble or process narration.

```markdown
**PR**

- Title: [Feat|Fix|Improvement|Tech]: … ([AIR-XXX]) | [Feat|Fix|Improvement|Tech]: …
- URL: <github pr url>
- Base: <branch>
- Linear: AIR-XXX | omitted
- Next: [/babysit](../babysit/SKILL.md)
```

Rules: no preamble; `Next:` always last with a skill link; ask before pushing if base branch or title prefix is unclear; do not block on a missing Linear id.
