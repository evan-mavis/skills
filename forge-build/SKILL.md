---
name: forge-build
description: Execute an approved specs-repo implementation plan through Git worktree subagents in one orchestrator thread. Orchestrates dependency-ordered slices, database/QA/evidence profiles, HITL resolution, verification repair, draft PR, and babysitting. Use after to-linear.
---

# Forge Build

Own implementation after `grill-me` → `to-prd` → `to-slices` → `to-linear`. Treat the PRD and
issue frontmatter as approved scope. Do not reopen planning.

## Read order

1. **Always:** [specs repo](../references/specs-repo.md) → [change contract](references/change-contract.md) → [capability pipeline](references/capability-pipeline.md) → [database runtime](references/database-runtime.md) → [preflight gates](../references/preflight-gates.md) → [branch naming](../references/branch-naming.md) → [execution](references/execution.md) → [host surfaces](../references/host-surfaces.md)
2. **If `qa_profile` is `light` or `heavy`:** [manual browser QA](references/manual-browser-qa.md)
3. **If `pr_evidence` is `video`:** [video and delivery](references/video-and-delivery.md)
4. **On plan closeout:** [plan closeout](references/plan-closeout.md) → [output schema](references/output-schema.md)

## Execution

Run the whole plan from one orchestrator thread. For each eligible slice:

1. create a dedicated Git worktree;
2. spawn four fresh sequential capability subagents in that worktree;
3. commit once;
4. integrate back into the feature branch.

Read [execution](references/execution.md) for dispatch, parallel waves, integration, and resume.
Do not delegate orchestration to a second-layer issue task runner.

## Runtime profiles

Collect unresolved profiles in one initial interactive choice prompt when possible. Follow
[preflight gates](../references/preflight-gates.md). Present [preflight confirm](../references/preflight-gates.md#preflight-confirm) and do not dispatch until the user confirms or says proceed with defaults.

**Runtime** — `data: auto | none | local | neon | local-preview`. Follow [database runtime](references/database-runtime.md). Persist `data_profile` and `host` under `## Forge Build Execution`. Persist lifecycle metadata under `## Database Lifecycle` and invoke the routed provision skill during preflight — **blocking** before first dispatch unless [runtime waived](../references/preflight-gates.md#preflight-confirm).

**Manual QA** — `qa: auto | none | light | heavy`:

- `none` — skip browser QA; automated verification still runs. Invalid for user-visible plans unless waived in preflight confirm.
- `light` — happy path for every meaningful changed user workflow.
- `heavy` — broad risk-based coverage across affected actors and states.

Ask: _How much manual browser QA should this plan receive?_ Recommend `none` for non-visual work,
`light` for ordinary UI changes, `heavy` for high-risk database-backed or permissioned work.
Persist as `qa_profile`. Re-ask if the profile cannot be executed truthfully; never weaken silently.

**PR evidence** — `evidence: auto | video | text | none`. Resolve `auto` after other profiles:
`video` for user-visible/runtime behavior; `text` for non-visual proof; never auto-resolve `none`.
Ask only when materially ambiguous. Persist as `pr_evidence`. Never downgrade resolved `video`
because capture is unavailable. `$run-ci` alone never satisfies `pr_evidence: video`.

## Inputs and preflight

[Resolve and bootstrap](../references/specs-repo.md#resolve-the-planning-store) the planning store from env, attached workspace roots, user-supplied repo URL/path, the active plan path, or an interactive ask. Return `blocked` if unresolved or if clone, pull, or write access fails.

Require one active plan under `$SPECS_REPO_PATH/in-progress/<plan-slug>/` with `PRD.md`, index, issue files
with canonical frontmatter, and a checked-out feature branch in the application repo. Return `blocked` for ambiguous plans,
detached branches, or unrelated uncommitted changes in the main workspace.

1. Resolve application repo root, main workspace, feature branch, PRD, index, and every issue file (absolute paths under `$SPECS_REPO_PATH`).
2. Verify the plan feature branch matches [branch naming](../references/branch-naming.md#forge-build); create or check out the correct branch when missing.
3. Build the dependency graph from issue frontmatter (trust frontmatter over the index).
4. Record stage order, `blocked_by`, `type`, `hitl_timing`, `parallelizable`, and completion state.
5. Refuse completed, archived, or structurally invalid plans. Require `hitl_timing: null` on `afk`
   issues; on `hitl` issues accept `upfront` or `evidence_dependent`.
6. Resolve and persist database, QA, and evidence profiles through the initial interactive choice
   prompt when needed. Present [preflight confirm](../references/preflight-gates.md#preflight-confirm);
   persist under `## Forge Build Execution`. Follow [interactive choices](../references/host-surfaces.md#interactive-choices).
   On resume, inspect existing worktrees, database lifecycle, QA, and evidence state before creating
   anything.
7. Read [manual browser QA](references/manual-browser-qa.md) when `qa_profile` is `light` or `heavy`.
8. Read [video and delivery](references/video-and-delivery.md) when `pr_evidence` is `video`.
9. Do not update Linear unless the user separately invokes `to-linear`.

See [Read order](#read-order) for the full ref list.

## HITL resolution

Before dispatching, inspect every incomplete `hitl` issue. Use `hitl_timing` as canonical.

- `upfront` — answer does not depend on implementation output or runtime evidence.
- `evidence_dependent` — answer requires completed dependencies, output, or live state.

Batch upfront questions into one concise request with `local_id`, question, and recommended default.
Do not dispatch until upfront questions are answered. Persist answers under `## HITL Resolution` in the specs repo issue files.
Transition resolved implementation issues to `type: afk`, `hitl_timing: null`, `status: ready`.
Decision-only gates become `status: done`, `completed: true`. Refresh the index after HITL changes; [commit and push](../references/specs-repo.md#commit-and-push-after-mutations) the specs repo.

Ask and wait for resolvable HITL — do not return `blocked` merely because an answer is pending.
Profile and HITL questions are the only exceptions to the terminal output contract.

## Scheduler

Process stages in ascending order. An issue is eligible when incomplete, `status` is `ready` or
`in_progress`, every `blocked_by` is done, and `type` is `afk`.

- Run foundations and non-parallelizable issues serially.
- Run same-stage issues concurrently only when `parallelizable` and write areas are disjoint.
- Resolve eligible `hitl` issues through HITL procedure before treating them as `afk`.
- Stop for missing groundwork, ambiguous scope, semantic conflict, HITL blocker, or infrastructure failure.

Before dispatch: record feature `HEAD` as issue base SHA, set `status: in_progress`, remove resolved
**Execution Blocker**, refresh index, commit and push the specs repo. Construct issue `change_contract` with absolute issue path as
`source`, acceptance behavior as `scope`, and issue base SHA as `review_base`; persist under
`## Change Contract`. Pass through the [capability pipeline](references/capability-pipeline.md).

## Main-thread hygiene

Keep execution inside subagent threads in this orchestrator. Canonical planning state lives in specs repo issue files
and the index — [commit and push](../references/specs-repo.md#commit-and-push-after-mutations) after every update.

- Validate worker contracts without pasting raw reasoning, logs, or diffs into main conversation.
- One compact update after preflight, each completed wave, and each stage; heartbeat if a wave exceeds one minute.
- Format: `stage: <stage> | completed: <ids> | active: <ids> | blocked: <id-reason> | next: <action>`.
- Terminal response uses only the final output contract.

## Blocked work and resume

When work blocks: stop new dispatches; let current wave finish; set issue `status: blocked`; record
phase, blocker, base SHA, and worktree/branch/commit identifiers under **Execution Blocker**;
integrate successful siblings; preserve blocked state; refresh index; commit and push the specs repo; run [database cleanup](references/database-runtime.md#cleanup).

On resume: inspect preserved state; rebind or repair per [database runtime](references/database-runtime.md) when `## Database Lifecycle` has an active child; resume
failed phase in the existing worktree if the blocker is gone — never duplicate.

## Integrated issue state

After each issue commit in dependency-safe order: set `status: done`, `completed: true` in the specs repo; remove
**Execution Blocker**; write Implementation Notes; regenerate index; commit and push the specs repo. No merge commits, squash
commits, per-issue PRs, or remote issue branches in the application repo.

## Stage closeout

After every issue in a stage is integrated:

1. Construct stage `change_contract` (completed stage as scope, later stages as exclusions).
2. Fresh subagent → `$refactor-structure`; then fresh subagent → `$harden-architecture` in main workspace.
3. Commit fixes once as `refactor: harden <stage-name> integration`.
4. Refresh index in the specs repo and commit/push before scheduling the next stage.

## Plan closeout

When every issue is done:

1. Construct plan `change_contract` for the full feature diff.
2. Run `$run-ci` with verified database binding. On failure, follow [CI repair](references/plan-closeout.md#ci-repair).
3. Execute [manual browser QA](references/plan-closeout.md#manual-browser-qa) at the CI-passing SHA.
4. Run `$to-pr` in `draft` mode (note pending evidence when applicable).
5. Execute [PR evidence](references/plan-closeout.md#pr-evidence).
6. Update draft PR with final evidence via `$to-pr`.
7. Run `$babysit` on the draft PR. Never mark ready, merge, or publish a release.
8. If babysit changes `HEAD`, rebuild contract, rerun `$run-ci`, full QA profile, evidence, and PR update.
9. Run [database cleanup](references/database-runtime.md#cleanup).
10. Set PRD `status: completed`; move plan to `$SPECS_REPO_PATH/completed/<plan-slug>/`; commit and push the specs repo.

## Output

Return only YAML per [output schema](references/output-schema.md):

```yaml
status: done | blocked
plan_slug: <plan-slug>
blocker: null | <specific blocker>
branch: <feature-branch>
pr: <url-or-null>
completed_issues: <count>
remaining_issues: <count>
```

Fill profile, QA, evidence, and lifecycle fields from the schema on closeout. Do not return
`status: done` when [invalid done](../references/preflight-gates.md#invalid-status-done) applies.
Do not add explanatory prose. When the host requires structured git or action directives after the YAML
contract, append them after the contract block.
