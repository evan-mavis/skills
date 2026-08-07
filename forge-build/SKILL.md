---
name: forge-build
description: Execute an approved implementation plan under `specs/` through Git worktree subagents in one orchestrator thread. Orchestrates dependency-ordered slices, database/QA/evidence profiles, HITL resolution, verification repair, draft PR, and babysitting. Use after to-linear.
---

# Forge Build

Own implementation after `grill-me` → `to-prd` → `to-slices` → `to-linear`. PRD + issue
frontmatter under `specs/<slug>/` are approved scope — do not reopen planning.

## Refs

1. Always: [specs](../references/specs-repo.md) → [change contract](references/change-contract.md) →
   [capability pipeline](references/capability-pipeline.md) →
   [database runtime](references/database-runtime.md) →
   [preflight gates](../references/preflight-gates.md) →
   [branches](../references/branch-naming.md) → [execution](references/execution.md) →
   [orchestration](references/orchestration.md) → [host surfaces](../references/host-surfaces.md)
2. `qa_profile` light/heavy → [manual browser QA](references/manual-browser-qa.md)
3. `pr_evidence: video` → [video](../references/video-and-delivery.md)
4. Closeout → [plan closeout](references/plan-closeout.md) → [output schema](references/output-schema.md)

## Runbook

1. **Preflight** — [Resolve](../references/specs-repo.md#resolve) `specs/<slug>/` ([import](../references/specs-repo.md#import) if missing). Need PRD, index, `issues/*` with frontmatter, and the already-checked-out feature branch ([branches](../references/branch-naming.md)). Build dep graph from frontmatter. Refuse invalid/completed plans. Collect `data` / `qa` / `evidence` profiles; [preflight confirm](../references/preflight-gates.md#preflight-confirm); persist under `## Forge Build Execution`. No Linear updates here.
2. **Runtime** — `data: auto | none | local | hosted-db | local-preview` ([database runtime](references/database-runtime.md); `neon` = deprecated alias for `hosted-db`). `hosted-db` = bind host `DATABASE_URL`; `local-preview` = provision skill. Blocking unless waived.
3. **QA / evidence** — `qa: none|light|heavy`; `evidence: video|text|none` (`auto` → video for user-visible). Never silently weaken. `$run-ci` ≠ video/QA.
4. **HITL + schedule + integrate** — follow [orchestration](references/orchestration.md). Per eligible slice: worktree → four capability subagents → one commit → integrate ([execution](references/execution.md)).
5. **Closeout** — [orchestration plan closeout](references/orchestration.md#plan-closeout): CI → QA → draft PR → evidence → babysit → cleanup → delete `specs/<slug>/`.

One orchestrator thread. No second-layer issue runners.

## Output

One concise sentence — [output schema](references/output-schema.md). Prefer
`Build finished: <pr-url>` or `Blocked: <reason>`. When a demo/evidence video exists, render it
(or link PR/Linear attachments) after that sentence.
