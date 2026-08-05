---
name: to-linear
description: Sync PRD and issue Markdown files from application-repo `specs/<slug>/` into Linear. Use when the user explicitly wants to create or update Linear issues from plan files, preserve parent/sub-issue structure, and create blocking or related dependencies.
---

# To Linear

Only skill that creates/updates Linear issues. Syncs from `<app-repo>/specs/` — no implementation.
Use the configured Linear integration; if auth fails, stop and ask to connect.

## Inputs

[Resolve](../references/specs-repo.md#resolve) / [import](../references/specs-repo.md#import). Accept
`PRD.md`, index, `issues/*`, paste, or update-from-specs. If path omitted, pick the obvious plan
under `specs/` or use [Plan](../references/decision-prompts.md#plan). Create-vs-update ambiguity →
[Target](../references/decision-prompts.md#target).

## Process

1. **Read** PRD + issues from `specs/<slug>/`. Frontmatter wins over index. Extract titles, AC,
   Approach, HITL, deps, `linear_issue` / `last_synced`. Never sync Implementation Notes.
2. **Targets:** existing `linear_issue` / URL → update; else create. PRD = parent unless user says
   otherwise.
3. **Structure:** PRD → parent; `issues/` → sub-issues; `blocked_by`/`blocking` → Linear blockers;
   stage/ordinal → order. Create parent first, then issues by global ordinal + deps. Do not close
   the parent.
4. **Bodies:** follow [linear-body](references/linear-body.md).
5. **Write back** `linear_issue` + `last_synced` on PRD/issues; refresh index; commit+push feature
   branch. Failed Linear writes → do not mark synced. Sync ≠ completion.

## Output

Human-visible reply = **exactly one concise sentence**. No parent/sub-issue inventories or
preamble. Inline the parent Linear link (and mention sub-issue count). Interactive choices
([decision-prompts](../references/decision-prompts.md)) may accompany the sentence.

Examples:

- Pause: `Sync specs/<slug>/ to Linear — update existing issues or create new?`
- Done: `Synced [AIR-123](<url>) + 5 sub-issues — start implementation in a fresh task.`
- Partial: `Synced parent [AIR-123](<url>); 2 sub-issues failed — retry or stop?`
- Blocked: `Blocked: Linear isn’t connected — connect it and rerun $to-linear.`