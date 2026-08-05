# Issue Template

Use when writing slice files under `$SPECS_REPO_PATH/in-progress/<slug>/`. Agent-first, lightly
human-readable.

```markdown
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

# <Issue Title>

## What to Build

What this slice delivers end-to-end. A short paragraph or two — enough to know what you're implementing next without opening the PRD.

## HITL Requirement

Include this section only when `type: hitl`:

- **Timing:** `upfront` or `evidence_dependent`
- **Decision or action:** the single concrete input needed from the human
- **Evidence:** what the agent should present first, or `None` for upfront input

Omit this section for `afk` issues.

## Acceptance Criteria

- [ ] Observable, testable criterion
- [ ] Observable, testable criterion
- [ ] Observable, testable criterion

Be specific. These should stand alone as the definition of done.

## Approach

- **Surfaces:** packages, routes, jobs, tables, APIs, etc. you expect to touch
- **Constraints:** key decisions or assumptions from the PRD that shape this slice
- **Out of scope:** what this issue is not doing

Add **Risks** or **Open choices** only when the slice is genuinely ambiguous — don't speculate.

Stay at the planning level. Do not write file-by-file specs. Fill **Implementation Notes** only
after integration.

## Implementation Notes

- Not started.

---

PRD: <relative path under plan dir> | Index: <relative path to <plan-slug>-index.md>
```

Keep frontmatter at the very top. Future agents should determine scheduling, blocking, Linear sync,
and completion from frontmatter without scraping the body.
