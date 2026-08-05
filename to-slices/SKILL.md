---
name: to-slices
description: Break a PRD, plan, spec, or conversation context into independently implementable slice Markdown files under `specs/<slug>/issues/` in the application repo. Use when the user wants implementation slices, tickets, task breakdowns, or slice drafts without creating Linear issues.
---

# To Slices

Write vertical-slice issues under `<app-repo>/specs/<slug>/issues/`. No Linear — tell the user to
run `$to-linear` after approval.

Issue frontmatter is canonical; `<slug>-index.md` is a generated summary.

## Frontmatter

```yaml
---
local_id: <slug>-<global-issue-number>
plan_slug: <slug>
title: <Issue Title>
stage: <stage-number>-<stage-name>
type: afk
hitl_timing: null
status: ready
completed: false
parallelizable: false
blocked_by: []
blocking: []
related: []
linear_issue: null
last_synced: null
---
```

- `type`: `afk` \| `hitl`
- `hitl_timing`: `null` (afk) or `upfront` \| `evidence_dependent` (hitl)
- `status`: `draft` \| `ready` \| `in_progress` \| `blocked` \| `done`
- Deps use local IDs. Prefer AFK when scope is clear.

**Descoping:** new plan at `specs/<new-slug>/`; remove issue from parent; link from parent PRD/index.
Do not leave `status: deferred` in the parent.

## Process

1. [Resolve](../references/specs-repo.md#resolve) / [import](../references/specs-repo.md#import). Work from PRD under `specs/`, pasted plan, or chat. Linear IDs → ask paste vs `$to-linear`. Ambiguous + no grill → `$grill-me` or [Breakdown](../references/decision-prompts.md#breakdown).
2. Explore code if needed. Draft tracer bullets from PRD Intent / Target / Scenarios / AC / Scope / Decisions. Shared contracts → small foundation issue first. Each slice: narrow end-to-end path, own file, deps, write areas; HITL gets exact decision + timing. Agent-first; no file-by-file specs. Fill Implementation Notes only after integration.
3. If breakdown is large/ambiguous, one-sentence summary + [Breakdown](../references/decision-prompts.md#breakdown) — do not dump per-slice essays in chat. Otherwise write files.
4. Layout + [issue template](references/issue-template.md):

   ```
   specs/<slug>/PRD.md
   specs/<slug>/<slug>-index.md
   specs/<slug>/issues/01-<slice-slug>.md
   ```

   Stage in frontmatter only; global `NN` across the plan; regenerate index from frontmatter:

   `| Done | Stage | Local ID | Linear | Issue | Type | HITL Timing | Status | Blocked By | Blocking | Parallelizable |`

5. Commit+push `specs/<slug>/` on the feature branch. Then [Archive](../references/decision-prompts.md#archive) (default Skip).

## Output

Human-visible reply = **exactly one concise sentence**. No status blocks, file inventories, or
preamble. Inline one markdown link (usually the index). Interactive choices
([decision-prompts](../references/decision-prompts.md)) may accompany the sentence.

Examples:

- Before write: `Proposed 6 slices for <slug> (1 foundation, 5 flows) — create files?`
- Done: `Wrote [specs/<slug>/<slug>-index.md](<absolute>) and pushed — next $to-linear (archive skipped).`
- Blocked: `Blocked: missing PRD under specs/<slug>/ — run $to-prd or import from archive.`