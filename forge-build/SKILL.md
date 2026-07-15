---
name: forge-build
description: Execute an approved local implementation plan end to end through either visible Codex worktree tasks or main-thread subagents. Use when the user wants Codex to resolve human-in-the-loop checkpoints, orchestrate dependency-ordered issue work, independently review every issue, integrate one clean commit per issue, run final CI, open a draft pull request, and keep it merge-ready.
---

# Forge Build

Own implementation after `grill-me` → `to-prd` → `to-issues` → `to-linear`. Treat the PRD and issue frontmatter as approved scope. Do not reopen planning.

## Execution mode

Require one mode for the whole plan:

- `tasks` — create one visible Codex task in a managed worktree per eligible issue. The issue task implements directly, spawns its own fresh reviewer subagent, commits once, and returns a commit SHA. Recommend this in the Codex desktop app for substantial parallel issues, persistent visibility, and independent steering.
- `subagents` — create one Git worktree per issue and run implementation plus review through main-thread subagents. Recommend this when task/thread tools are unavailable or the user wants ephemeral workers with automatic result joins.

Accept `$forge-build tasks` or `$forge-build subagents`. If the user invokes the skill without a mode, ask one concise mode question before dispatching work. This is the only implementation-mode choice; do not offer additional strategies.

Persist the selection under `## Forge Build Execution` in the PRD. Do not switch modes after any issue starts. If `tasks` is selected but Codex task creation, worktree targeting, or thread-reading tools are unavailable, return `blocked` and recommend a new invocation with `subagents`.

## Inputs

Require one active plan under `plans/in-progress/<plan-slug>/` with:

- `PRD.md`
- `<plan-slug>-index.md`
- issue files with canonical YAML frontmatter
- a checked-out feature branch in the main workspace

If the plan is ambiguous, the feature branch is detached, or the main workspace contains unrelated uncommitted changes, return `blocked`.

## Preflight

1. Resolve the repository root, main workspace, feature branch, PRD, index, and every issue file.
2. Read the complete plan and build the dependency graph from issue frontmatter. Trust frontmatter over `<plan-slug>-index.md`.
3. Record stage order, global issue order, `blocked_by`, `type`, `hitl_timing`, `parallelizable`, and completion state.
4. Refuse completed, archived, or structurally invalid plans. Require `hitl_timing: null` on `afk` issues. On `hitl` issues, accept `upfront` or `evidence_dependent`; migrate a missing legacy value through the HITL procedure.
5. Resolve and persist the execution mode. On resume, inspect its existing tasks or worktrees before creating anything.
6. Read exactly one execution reference completely:
   - `tasks`: [tasks mode](references/tasks-mode.md)
   - `subagents`: [subagents mode](references/subagents-mode.md)
7. Do not update Linear unless the user separately invokes `to-linear`.

## HITL resolution

Before dispatching issue work, inspect every incomplete `hitl` issue and its **HITL Requirement**. Use `hitl_timing` as canonical; classify and persist a missing legacy value once.

1. Interpret `hitl_timing` as:
   - `upfront`: the answer does not depend on implementation output or runtime evidence.
   - `evidence_dependent`: a useful answer requires completed dependencies, generated output, or live system state.
2. Batch all upfront-resolvable questions into one concise request. Include the `local_id`, specific question, and a recommended default only when well supported.
3. Do not dispatch issue work until every upfront-resolvable question is answered. Persist each answer under `## HITL Resolution` in the canonical issue file and update only affected requirements or acceptance criteria.
4. If the resolved issue still requires implementation, change it to `type: afk`, `hitl_timing: null`, `status: ready`, and `completed: false`. If it was only a decision or human action gate, mark it `status: done` and `completed: true`.
5. Leave evidence-dependent issues as `type: hitl`. When one becomes the earliest dependency-unblocked issue, present the available evidence and ask only for the remaining decision or action. Persist the answer and apply the same transition rule.
6. Refresh the index and rebuild the dependency graph after resolving HITL state.

Do not return `blocked` merely because a resolvable HITL answer is pending: ask, wait, record, and resume. Return `blocked` only when the user cannot supply required input or the answer exposes ambiguous or conflicting scope. Execution-mode and HITL questions are the only exceptions to the terminal output contract.

## Scheduler

Process stages in ascending order. Never start a later stage while the earliest incomplete stage has eligible or blocked work.

An issue is eligible when it is incomplete, `status` is `ready` or `in_progress`, every `blocked_by` issue is done, and `type` is `afk`.

- Run foundations and non-parallelizable issues serially.
- Run same-stage issues concurrently only when they are marked `parallelizable` and expected write areas are meaningfully disjoint.
- Fill available execution capacity and run additional eligible issues in waves.
- Resolve an eligible `hitl` issue through the HITL procedure.
- Stop only for missing groundwork, ambiguous scope, a semantic conflict, an unanswered HITL blocker, or a mode-specific infrastructure failure.

Before dispatching an issue, record the feature `HEAD` as its base SHA, set its canonical state to `status: in_progress` and `completed: false`, remove a resolved **Execution Blocker**, and refresh the index.

## Main-thread hygiene

Keep detailed execution inside issue tasks or subagent threads. Keep canonical state inside issue files plus the index.

- Treat worker and reviewer contracts as machine-facing. Validate and consume them without pasting raw reasoning, logs, diffs, or summaries into the main conversation.
- Send one compact update after preflight, after each completed wave, and after each stage.
- If a wave runs longer than one minute, send a brief heartbeat without narrating unchanged state.
- Use: `stage: <stage> | mode: <tasks-or-subagents> | completed: <ids-or-none> | active: <ids-or-none> | blocked: <id-and-reason-or-none> | next: <one action>`.
- Interrupt normal cadence only for a mode question, HITL question, or actionable blocker.
- Do not repeat progress. The terminal response must use only the final output contract.

## Blocked work and resume

When implementation, review, commit validation, rebase, cherry-pick, or integration blocks:

1. Stop dispatching new issues and let every already-running worker in the current wave finish.
2. Set the affected issue to `status: blocked` and `completed: false`.
3. Record the mode, phase, exact blocker, base SHA, and every available task/thread/branch/worktree/commit identifier under `## Execution Blocker`.
4. Integrate any already-successful sibling whose dependency path does not include the blocked issue.
5. Preserve blocked tasks, branches, worktrees, and scoped changes. Never force-delete or silently restart them.
6. Refresh the index and return the terminal `blocked` contract with the affected `local_id`.

On a later invocation, inspect preserved state before dispatching. If the blocker is objectively gone, remove **Execution Blocker**, set `status: in_progress`, and resume the failed phase in the existing task or worktree. Otherwise return `blocked` without creating a duplicate.

## Integrated issue state

After each issue commit is integrated in dependency-safe global order:

1. Set its issue file to `status: done` and `completed: true`.
2. Remove **Execution Blocker**.
3. Write concise Implementation Notes with the integrated commit and execution mode.
4. Regenerate the index from issue frontmatter.

Do not create merge commits, squash commits, per-issue PRs, or remote issue branches.

## Stage closeout

Record the feature SHA at the start of each stage. After every issue in that stage is integrated:

1. Spawn a fresh reviewer subagent in the main workspace with only the PRD, index, main-workspace path, and stage-start SHA.
2. Have it run `$thermo-nuclear-code-quality-review` with the stage-start SHA as `review_base` and return that skill's standard contract.
3. After it exits, commit any review fixes once as `refactor: harden <stage-name> integration`.
4. Re-read issue frontmatter and refresh the index before scheduling the next stage.

## Plan closeout

When every issue is `done` and `completed: true`:

1. Run `$run-ci`. Return `blocked` if it fails.
2. Run `$to-pr` in `draft` mode.
3. Run `$babysit` on the draft PR. Never mark it ready, merge it, or publish a release.
4. After babysit returns `done`, set PRD `status: completed` and move the plan to `plans/completed/<plan-slug>/` without leaving a duplicate.

## Output

Return only:

```yaml
status: done | blocked
plan_slug: <plan-slug>
execution_mode: tasks | subagents
completed_issues: <count>
remaining_issues: <count>
branch: <feature-branch>
pr: <url-or-null>
blocker: null | <specific blocker>
```
