---
name: forge-build
description: Execute an approved local implementation plan end to end through either visible Codex worktree tasks or main-thread subagents. Use when the user wants Codex to resolve human-in-the-loop checkpoints, orchestrate dependency-ordered issue work, independently review every issue, integrate one clean commit per issue, repair final CI failures, optionally generate video-backed QA and demo sites, open a draft pull request, and keep it merge-ready.
---

# Forge Build

Own implementation after `grill-me` → `to-prd` → `to-issues` → `to-linear`. Treat the PRD and issue frontmatter as approved scope. Do not reopen planning.

## Execution mode

Require one mode for the whole plan:

- `tasks` — create one visible Codex task in a managed worktree per eligible issue. The issue task implements directly, spawns its own fresh reviewer subagent, commits once, and returns a commit SHA. Recommend this in the Codex desktop app for substantial parallel issues, persistent visibility, and independent steering.
- `subagents` — create one Git worktree per issue and run implementation plus review through main-thread subagents. Recommend this when task/thread tools are unavailable or the user wants ephemeral workers with automatic result joins.

Accept `$forge-build tasks` or `$forge-build subagents`. If no mode is supplied:

- In Cursor, default to `subagents` without asking because separate Codex tasks with managed worktrees are unavailable.
- In Codex desktop with callable task/worktree thread tools, ask one concise mode question before dispatching work.
- On any other surface without those task tools, default to `subagents`.

This is the only implementation-mode choice; do not offer additional strategies.

Persist the execution mode under `## Forge Build Execution` in the PRD. Do not switch modes after any issue starts. If `tasks` is explicitly selected in Cursor or where Codex task creation, worktree targeting, or thread-reading tools are unavailable, return `blocked` and recommend a new invocation with `subagents`.

## PR evidence choice

On a new invocation, also collect one optional PR evidence selection:

- `both` — generate a QA verification site and a feature demo site. Recommend this option.
- `demo` — generate only the feature demo site.
- `qa` — generate only the QA verification site.
- `neither` — skip both sites.

When execution mode also requires a question, collect both decisions in the same question UI. Present PR evidence as the four choices above when supported; if the UI limits option counts, ask separate yes/no questions for the demo and QA sites in the same UI. Accept an explicit user-supplied selection without prompting.

Persist the selection as `pr_evidence: both | demo | qa | neither` under `## Forge Build Execution` in the PRD. Reuse it on resume and do not ask again. Generate selected evidence only after final CI passes and before creating the draft PR.

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
5. Resolve and persist the execution mode and PR evidence choice. On resume, inspect existing tasks, worktrees, and evidence state before creating anything.
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

Do not return `blocked` merely because a resolvable HITL answer is pending: ask, wait, record, and resume. Return `blocked` only when the user cannot supply required input or the answer exposes ambiguous or conflicting scope. Execution-mode, PR-evidence, and HITL questions are the only exceptions to the terminal output contract.

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
- Interrupt normal cadence only for a mode question, PR-evidence question, HITL question, or actionable blocker.
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

1. Run the repository's documented format-write or format-fix command before calling `$run-ci`. Inspect the diff and commit any formatting-only changes once as `maintenance: format final changes`. If formatting fails, handle it as the first mechanical failure in the CI repair loop.
2. Run `$run-ci` as a read-only verification pass.
3. If it fails, exit `$run-ci` and enter the CI repair loop below. Do not return `blocked` on the first repairable failure.
4. After CI passes, execute the selected PR evidence workflow below.
5. Run `$to-pr` in `draft` mode and supply the current QA and demo URLs plus their concise summaries. Require the PR body to link every selected artifact.
6. Run `$babysit` on the draft PR. Never mark it ready, merge it, or publish a release.
7. After babysit returns `done`, set PRD `status: completed` and move the plan to `plans/completed/<plan-slug>/` without leaving a duplicate.

### PR evidence workflow

Use fresh, separate subagents for the selected sites. Default to running QA before demo. Do not run the two subagents concurrently unless they have isolated browser sessions, local accounts, and mutable local data; shared browser or application state can invalidate both artifacts.

1. If `pr_evidence` is `qa` or `both`, spawn a fresh subagent in the main workspace and have it run `$feature-qa-site` against the current feature SHA. It remains report-only and returns the private URL, scenario counts, confirmed findings, and tested SHA.
2. Treat a confirmed finding as acceptance-blocking when it violates the PRD or an issue acceptance criterion, is Critical or High severity, or blocks a critical workflow. Before continuing, repair acceptance-blocking findings with a fresh scoped implementation subagent, review and commit the fixes once as `patch: fix final QA findings`, rerun the complete `$run-ci` suite, and rerun the QA site against the new SHA. Allow at most two QA repair attempts; then return `blocked` with the remaining findings.
3. Keep non-blocking findings visible in the QA site and PR description.
4. If `pr_evidence` is `demo` or `both`, spawn a fresh subagent after any QA repair cycle and have it run `$feature-demo-site` against the final CI-passing feature SHA. It returns the private URL, coverage summary, omissions, and demonstrated SHA.
5. Persist each artifact's URL, summary, and exact feature SHA under `## PR Evidence` in the PRD. Treat an artifact as stale whenever `HEAD` changes; regenerate each selected stale artifact before `$to-pr`.

If a selected skill, local database, browser session, application dependency, or authorized private publishing integration is unavailable, preserve completed evidence and return `blocked` with the specific missing prerequisite. Never silently downgrade a selected artifact to `neither`.

### CI repair loop

Allow at most three repair attempts. A repair attempt may address multiple failures that share a root cause.

1. Persist the attempt number, failing checks, exact failure signatures, and current feature SHA under `## CI Repair` in the PRD.
2. Classify each failure before changing code:
   - **Mechanical**: formatting or safely auto-fixable lint. Run the repository's documented fix command, then inspect its diff.
   - **Code**: typecheck, build, lint, or test failures caused by the feature branch. Fix the smallest root cause in the main workspace and add or adjust focused tests only when needed to preserve intended behavior.
   - **Environment**: missing services, credentials, runtimes, containers, or transient network failures. Apply only documented, safe environment remediation and retry the affected check once. Never change product code to hide an environment failure.
3. Never weaken CI, skip checks, delete meaningful tests, or update snapshots without verifying that the new output is intended.
4. Review the repair diff and commit the cycle once as `patch: fix final CI failures`. Record the repair commit in `## CI Repair`.
5. Rerun the complete `$run-ci` suite after every repair commit. A partial check may guide the repair, but it does not count as closeout verification.
6. Clear `## CI Repair` after a full pass and continue to the PR evidence workflow.

Return `blocked` only when a failure is not safely repairable, required environment remediation is unavailable, the same failure signature survives two repair attempts, or three total repair attempts have failed. Preserve the repair state and report the remaining exact failure.

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
demo_site: <url-or-null>
qa_site: <url-or-null>
blocker: null | <specific blocker>
```

Do not add explanatory prose. When Codex Desktop requires git action directives, append those
standalone directives after the YAML contract; they are the only permitted non-YAML output.
