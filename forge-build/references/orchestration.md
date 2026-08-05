# Forge-Build Orchestration

## HITL

Before dispatch, inspect incomplete `hitl` issues (`hitl_timing` canonical):

- `upfront` — batch into one request (`local_id`, question, recommended default); wait before dispatch
- `evidence_dependent` — resolve when deps/output/live state exist

Persist under `## HITL Resolution`. Implementation HITL → `type: afk`, `hitl_timing: null`,
`status: ready`. Decision-only → `status: done`, `completed: true`. Refresh index; commit+push.
Pending HITL is not `blocked` — wait. Profile/HITL may interrupt the terminal output contract.

## Scheduler

Stages ascending. Eligible: incomplete, `ready`|`in_progress`, blockers done, `type: afk`.

- Serial for foundations / non-parallelizable
- Same-stage concurrent only when `parallelizable` + disjoint write areas
- Stop on missing groundwork, ambiguous scope, semantic conflict, HITL, infra failure

Before dispatch: feature `HEAD` → issue base SHA; `status: in_progress`; clear resolved Execution
Blocker; refresh index; commit+push; persist `## Change Contract`; run
[capability pipeline](capability-pipeline.md).

## Hygiene

Subagents do the work. Commit+push `specs/<slug>/` after every plan update. Mid-run progress:
`stage: … | completed: … | active: … | blocked: … | next: …`. Final closeout: one sentence per
[output schema](output-schema.md).

## Blocked / resume

Stop new dispatches; finish wave; `status: blocked` + Execution Blocker; integrate siblings;
commit+push; [cleanup](database-runtime.md#cleanup). Resume in existing worktree — never duplicate.

## Integrated issue

`status: done`, `completed: true`; clear blocker; Implementation Notes; regenerate index;
commit+push. No merge/squash/per-issue PRs/remote issue branches.

## Stage closeout

Stage `change_contract` → `$refactor-structure` → `$harden-architecture` → one
`refactor: harden <stage> integration` commit → refresh index → next stage.

## Plan closeout

Full plan contract → `$run-ci` ([CI repair](plan-closeout.md#ci-repair)) →
[manual QA](plan-closeout.md#manual-browser-qa) → draft `$to-pr` →
[PR evidence](plan-closeout.md#pr-evidence) → update PR → `$babysit` (never ready/merge) → if HEAD
moves, rerun CI/QA/evidence/PR → [cleanup](database-runtime.md#cleanup) → PRD `completed` →
**delete** `specs/<slug>/` → commit+push. No archive ask here.
