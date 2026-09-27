---
name: forge-issue
description: Orchestrate one bug, improvement, or small feature through implementation, review, verification, evidence, a draft PR, and babysitting. Use for single-ticket delivery with none/local/hosted-db/local-preview runtime choice. Not for multi-slice plans.
---

# Forge Issue

One focused change → merge-ready draft PR. No PRD / slice graph / scheduler.

## Refs

1. Always: [change contract](../forge-build/references/change-contract.md) →
   [capability pipeline](../forge-build/references/capability-pipeline.md) →
   [database runtime](../forge-build/references/database-runtime.md) →
   [preflight gates](../references/preflight-gates.md) →
   [branches](../references/branch-naming.md) →
   [execution contracts](references/execution-contracts.md) →
   [delivery flow](references/delivery-flow.md) →
   [host surfaces](../references/host-surfaces.md)
2. `host: cloud` → [cloud](references/cloud-environment.md); Airgoods → [airgoods-runtime](references/airgoods-runtime.md)
3. `local-preview` → [local worktree](references/local-worktree-runtime.md)
4. Video → [video](../references/video-and-delivery.md)
5. Closeout → [output schema](references/output-schema.md)

## Runbook

1. **Preflight** — repo root, `host`, clean worktree (local) or clean cloud workspace, use the
   already-checked-out branch ([branches](../references/branch-naming.md)), optional `specs/`
   slice path for context. [Preflight confirm](../references/preflight-gates.md#preflight-confirm)
   before implement.
2. **Resolve** — [scope gate](references/execution-contracts.md#scope-gate) + ambiguity interview;
   persist working contract. Airgoods: `$query-prod-db` for shape only.
3. **Runtime** — bind `hosted-db` or provision `local-preview`
   ([database runtime](../forge-build/references/database-runtime.md)); `$query-local-db` via env
   name. Blocking unless waived. (`neon` = alias for `hosted-db`.)
4. **Deliver** — [delivery flow](references/delivery-flow.md): reproduce (bugs) → implement →
   verify → evidence → `$to-pr` → `$babysit` → cleanup.

Missing named capability with no equivalent contract → `blocked`.

## Output

One concise sentence — [output schema](references/output-schema.md). Prefer
`Build finished: <pr-url>` or `Blocked: <reason>`. When video evidence exists, render MP4(s) in
chat (before+after when both) or link PR/Linear attachments after that sentence.
