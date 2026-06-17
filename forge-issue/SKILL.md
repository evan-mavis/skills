---
name: forge-issue
description: Select and implement the next local issue from an active plan under `plans/in-progress/`, an index, chat context, or a specific issue Markdown file. Use when the user asks to implement an issue, forge a slice, continue a local plan, find the next unblocked issue, or execute one local issue slice. Completed archives under `plans/completed/` are only revisited when explicitly referenced. Linear issue IDs or URLs may be used only as optional context when the user explicitly asks for Linear.
---

# Forge Issue

Execute one local issue slice from `plans/in-progress/`. Default to one issue at a time. For parallel work, generate paste-ready prompts for separate agent threads — do not spawn sub-agents or create worktrees yourself.

Stay scoped to the assigned slice. Other agents may be editing siblings; keep the diff reviewable as one issue-sized chunk.

Part of the AI dev workflow: `grill-me` → `to-prd` → `to-issues` → `to-linear` → **forge-issue** → `deslop` → `thermo-nuclear-code-quality-review` → `merge-worktree` → `run-ci` → `to-pr` → `babysit`

## Source of truth

- Issue YAML frontmatter is canonical; `00-index.md` is generated from it. On conflict, trust frontmatter and refresh the index.
- Key fields: `local_id`, `stage`, `type` (`afk`/`hitl`), `status`, `completed`, `parallelizable`, `blocked_by` / `blocking` / `related`, `linear_issue`, `last_synced`

## Inputs

Issue file, pasted issue, PRD, `00-index.md`, or "forge next issue" with plan context. `plans/completed/` is archived unless explicitly referenced.

Linear IDs/URLs only when the user asks for Linear — otherwise offer `to-linear` or a local paste.

## 1. Select the issue

**Specific issue given:** use it. If completed or blocked, stop and explain.

**Plan/index scan:** prefer attached `00-index.md`, then PRD links, then the obvious `plans/in-progress/*/00-index.md`. Ask if multiple plans match.

**Scheduling rules:**

- Blocked = any incomplete entry in `blocked_by`
- Stages run in ascending order; issue numbers are global across the plan, not reset per stage
- Do not pick later-stage work while an earlier stage has incomplete unblocked issues
- Eligible order: foundation → AFK → HITL (HITL for clarification only)
- Tie-break: lower global issue ordinal
- Parallel candidates: same stage, `parallelizable`, unblocked, meaningfully disjoint write areas

If nothing is eligible, summarize completed work and blockers, then stop.

From a plan/index scan, show only the next candidate(s): local ID, path, one-line summary. Ask before implementing.

## 2. Execution mode

Do not implement from a scan without confirmation. A specific issue path or worktree prompt means the user already chose — proceed in `single` mode.

| Mode               | Use when                                        |
| ------------------ | ----------------------------------------------- |
| `single` (default) | One issue in this thread                        |
| `parallel-prompts` | User wants parallel work with reviewable chunks |

If multiple eligible issues exist, ask: `single` or `parallel-prompts`. Default to `single`.

Use structured decision UI when available; recommend `parallel-prompts` for parallel work.

**Parallel prompts:** capture main workspace path, branch, and status. Each prompt includes absolute issue/index/PRD paths, destination branch, stay-scoped instruction, closeout notes, and reminders to run `deslop`, then `thermo-nuclear-code-quality-review`, before merging back with `merge-worktree`, then run `run-ci`, `to-pr`, and `babysit`. If the worktree lacks `plans/`, use absolute paths into the main workspace for plan reads and updates on closeout. Only include parallelizable, unblocked, disjoint issues — skip foundation work unless already done. Do not implement in this mode.

## 3. Implement

1. Read the issue, parent PRD, and blocking issues only as needed. PRD is context, not permission to expand scope.
2. Already complete (`completed: true` / `status: done`) → summarize and ask intent unless the user wants rework.
3. **HITL** (ambiguous AC, product behavior, technical fork, unresolved blocker context) → run `[grill-me](../grill-me/SKILL.md)` first. **AFK** → proceed.
4. Inspect the owning package, nearby code/tests, and optionally the branch diff for overlap (`git diff <base>...HEAD`, or `gh pr diff` if a PR exists).
5. Restate in-scope behavior, code areas, out-of-scope work, and validation. Missing shared groundwork → stop; do not absorb sibling work.
6. Implement with high quality. Follow repo best practices and existing patterns. **Do not take shortcuts** — no hacky fixes, bolt-on branches, or "good enough for now" code. If code you touch can be refactored to be cleaner or more readable, make that change without hesitation while staying within the issue scope. **Remove dead code** you expose and **dedupe** copy-pasted logic — reuse existing helpers instead of adding near-duplicates. Test-first when behavior changes and practical. Respect user/repo validation rules.
7. Blocker → match to an existing issue or stop. Do not morph this slice into a different issue.

## 4. Close out

Update the issue file when complete:

- set `completed: true` and `status: done`
- fill in **Implementation Notes** with what shipped, key files touched, and important decisions
- update **Acceptance Criteria** or **Approach** if reality diverged from the plan
- leave `linear_issue` unchanged unless the user asked for Linear updates
- refresh `00-index.md` from frontmatter

If `plans/` is missing in this worktree, update the issue file and `00-index.md` in the main workspace using absolute paths.

When every issue is complete with no blockers or open HITL gaps, move `plans/in-progress/<slug>/` to `plans/completed/<slug>/`.

After implementation, run `deslop` on uncommitted changes, then `thermo-nuclear-code-quality-review` on the branch, before merging parallel work back with `merge-worktree`. Run `run-ci`, then `to-pr` and `babysit` when the feature branch is ready to land.

## Output

Final reply only. No preamble or process narration.

**When selecting an issue:**

```markdown
**Forge**

- Issue: [<local id>](<issue file path>) — <one-line summary>
- Next: confirm to start
```

**When done:**

```markdown
**Forge**

- Issue: [<local id>](<issue file path>)
- Changed: <one line>
- Next: [/deslop](../deslop/SKILL.md)
```

**When generating parallel prompts** — output prompts in full, then end with:

```markdown
**Forge**

- Mode: parallel prompts
- Next: [/deslop](../deslop/SKILL.md) after each thread completes
```

Rules: no preamble; `Next:` always last with a skill link.
