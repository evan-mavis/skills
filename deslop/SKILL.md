---
name: deslop
description: Review uncommitted changes and clean AI slop from the diff — unnecessary comments, abnormal defensive code, any casts, deep nesting, and patterns inconsistent with the surrounding file. Use after forge-issue, before thermo-nuclear-code-quality-review.
---

# Deslop

Review **uncommitted changes** and clean slop the implementation pass likely left behind. Fix it in place — do not expand scope beyond the current diff.

Part of the AI dev workflow:

- **Single / handoff:** `grill-me` → `to-prd` → `to-issues` → `to-linear` → `forge-issue` → **deslop** → `thermo-nuclear-code-quality-review` → `merge-worktree` → `run-ci` → `to-pr` → `babysit`
- **Parallel subagent:** `forge-issue` (`parallel-subagent-prs`) → sub-agent: **deslop** → `to-worktree-pr` → merge on GitHub → main thread index refresh → `to-pr` + `babysit` when feature-ready

Run after `forge-issue`, before `thermo-nuclear-code-quality-review` (single/handoff paths) or before commit/push in parallel sub-agent threads.

## Scope

Use the **`git` CLI** for local uncommitted changes:

- `git status` and `git diff` to find what changed. If nothing is uncommitted, say so and stop.
- Only edit files in the current diff unless a slop fix requires a tiny adjacent touch in the same file.
- Match the surrounding file and codebase — local style wins over generic cleanup rules.
- Do not change behavior unless removing dead or unreachable slop.
- Respect user/repo validation rules. Do not run disallowed checks unless explicitly requested.

## Clean up

Look for and fix:

1. **Unnecessary comments** — obvious narration, stale TODOs, or tone/style inconsistent with the file
2. **Abnormal defensive code** — extra try/catch blocks, redundant null checks, or guards uncommon on trusted paths in this codebase
3. **`any` casts** used only to bypass type errors — replace with proper types or narrowings
4. **Deep nesting** — flatten with early returns, extracted helpers, or guard clauses when that matches local style
5. **Inconsistent patterns** — helpers, naming, error handling, or structure that diverges from the file and nearby code

When unsure whether something is slop or intentional local convention, read more surrounding code before changing it.

## Output

Final reply only. No preamble or process narration.

```markdown
**Deslop**

- Cleaned: <one line per category, or `Nothing to clean`>
- Next: [/thermo-nuclear-code-quality-review](../thermo-nuclear-code-quality-review/SKILL.md)
```

Rules: no preamble; `Next:` always last with a skill link.
