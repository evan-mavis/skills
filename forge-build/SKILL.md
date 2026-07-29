---
name: forge-build
description: Execute an approved local implementation plan end to end through either visible Codex worktree tasks or main-thread subagents. Use when the user wants Codex to choose database isolation and none, light, or heavy manual browser QA, resolve human-in-the-loop checkpoints, orchestrate dependency-ordered issue work, independently review every issue, repair verification failures, generate host-native PR evidence, open a draft pull request, and keep it merge-ready.
---

# Forge Build

Own implementation after `grill-me` → `to-prd` → `to-issues` → `to-linear`. Treat the PRD and issue frontmatter as approved scope. Do not reopen planning.

## Execution mode

Require one mode for the whole plan:

- `tasks` — create one visible Codex task in a managed worktree per eligible issue. The issue task implements directly, spawns its own fresh reviewer subagent, commits once, and returns a commit SHA. Recommend this in the Codex desktop app for substantial parallel issues, persistent visibility, and independent steering.
- `subagents` — create one Git worktree per issue and run implementation plus review through main-thread subagents. Recommend this when task/thread tools are unavailable or the user wants ephemeral workers with automatic result joins.

Accept `$forge-build tasks` or `$forge-build subagents`. If no mode is supplied:

- In Cursor, default to `subagents` without asking because separate Codex tasks with managed worktrees are unavailable.
- In Codex desktop with callable task/worktree thread tools, include the execution-mode choice in
  the initial profile questions UI before dispatching work.
- On any other surface without those task tools, default to `subagents`.

This is the only implementation-mode choice; do not offer additional strategies.

Persist the execution mode under `## Forge Build Execution` in the PRD. Do not switch modes after any issue starts. If `tasks` is explicitly selected in Cursor or where Codex task creation, worktree targeting, or thread-reading tools are unavailable, return `blocked` and recommend a new invocation with `subagents`.

## Database profile

Accept an explicit `data: auto | none | local | neon` selection:

- `none` — no runtime database; use only when database state is irrelevant.
- `local` — a documented isolated local database or synthetic fixture environment.
- `neon` — a disposable production-shaped Neon child managed by `$provision-neon-branch`.

Unless `data` is already a concrete value or was persisted on resume, always use the host's
structured questions UI to ask:

> Which database environment should this plan use?

Offer the three profiles above, mark the safest scope-supported choice as `(Recommended)`, and
explain each tradeoff in one short sentence. Treat omitted or `auto` data as requiring this
question; do not silently infer the selection. Collect execution mode, database, and manual QA
in one initial questions UI when all three are unresolved. Do not add evidence as a fourth
question; resolve it afterward. When structured questions are unavailable, ask the same database
question in plain text.

Persist the concrete selection as `data_profile: none | local | neon` under
`## Forge Build Execution` in the PRD and reuse it on resume. If the selected profile cannot
validly verify the approved plan, explain the conflict and re-ask instead of silently overriding
the selection.

For `local`, require a documented task-isolated database or synthetic fixture environment; never
mutate production or an unexplained shared database. For `neon`, load
`$provision-neon-branch`. On a new run, invoke `operation: provision` before any application,
migration, worker, or database-dependent task starts. On resume, invoke `operation: rebind` when
persisted metadata identifies an active, uncleaned child. Retain only the non-secret result and
expose the database through a mode-0600 temporary environment file outside the repository or an
equivalent host-native task-scoped secret injection. Require a handoff that every later process
and worker can load; a shell export that dies with the provisioning process is insufficient.
Never put the connection string in a prompt, PRD, issue, log, or repository file. Never edit
`.env`, `.env.local`, another dotenv file, or a shell profile to select the task database.

## Manual QA profile

Accept an explicit `qa: auto | none | light | heavy` selection:

- `none` — skip manual browser QA; automated verification still runs.
- `light` — exercise the happy path for every meaningful changed user workflow.
- `heavy` — execute broad risk-based browser coverage across every affected actor and state.

Unless `qa` is already concrete or persisted on resume, always include this question in the
initial structured questions UI:

> How much manual browser QA should this plan receive?

Offer exactly `none`, `light`, and `heavy`. Recommend `none` for work with no browser-visible
behavior, `light` for ordinary user-facing changes, and `heavy` for high-risk, database-backed,
permissioned, multi-actor, lifecycle, or regression-prone work. Explain each option in one short
sentence. Treat omitted or `auto` as requiring this question; do not infer it silently.

Persist the concrete choice as `qa_profile: none | light | heavy` under
`## Forge Build Execution` and reuse it on resume. If the selected profile cannot be executed
truthfully against the plan's available browser surface or data environment, explain the
conflict and re-ask instead of silently weakening the profile.

## PR evidence profile

Accept an explicit `evidence: auto | video | text | none` selection. For `auto` or an omitted
selection:

- resolve `video` when the integrated plan changes user-visible, interactive, visual, or runtime
  behavior best proven in the real application;
- resolve `text` when the plan is non-visual and commands, results, and observed state are the
  clearest proof;
- never resolve `none` automatically.

Ask one evidence question only when the correct profile remains materially ambiguous or the
choice changes evidence strength. Resolve evidence after the initial execution/database/QA
questions UI. Ask it separately only when it cannot be inferred; otherwise do not prompt.

Persist the resolved concrete profile as `pr_evidence: video | text | none` under
`## Forge Build Execution` in the PRD. Reuse it on resume and do not ask again. Never silently
downgrade a resolved `video` profile because native capture is unavailable.

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
5. Resolve and persist the execution mode, database profile, and manual QA profile through the
   initial questions UI when needed. Then resolve and persist the PR evidence profile. On resume,
   inspect existing tasks, worktrees, database lifecycle state, QA state, and evidence state
   before creating anything.
6. When `data_profile` is `neon`, inspect `## Neon Lifecycle` before database-dependent work:
   - without an active child, invoke `$provision-neon-branch` with `operation: provision`;
   - with persisted active child metadata from an interrupted run, invoke it with
     `operation: rebind`;
   - with a confirmed prior cleanup, provision a new child only when database-dependent work
     still remains.
   Persist `project_id`, `parent_branch_id`, `branch_id`, `branch_name`, `expires_at`,
   `database_url_env`, and `deleted` under `## Neon Lifecycle`. Never persist the connection
   value or treat `temporary_env_file` as durable state.
7. Read exactly one execution reference completely:
   - `tasks`: [tasks mode](references/tasks-mode.md)
   - `subagents`: [subagents mode](references/subagents-mode.md)
8. Read [manual browser QA](references/manual-browser-qa.md) when `qa_profile` is `light` or
   `heavy`.
9. Read [video and delivery](references/video-and-delivery.md) only when the resolved evidence
   profile is `video`.
10. Do not update Linear unless the user separately invokes `to-linear`.

## Database runtime binding

Treat a selected database as an execution environment, not metadata.

- For `local`, start or select the documented isolated database and bind every database-dependent
  application, migration, worker, test, and QA process to it.
- For `neon`, load the protected result from `$provision-neon-branch` into each
  database-dependent process environment. Before the first migration, application, worker, test,
  or browser QA action in every host or worktree, verify the connected child branch or endpoint
  matches the provision result and differs from the configured parent.
- On resume, use the persisted exact branch metadata to rebind before dispatching or restarting
  database-dependent work. If rebind reports that the child is missing, expired, or mismatched,
  return `blocked`; never silently provision a replacement that would discard interrupted-run
  database state.
- Load a protected temporary environment file only into the task-scoped shell or directly into
  each spawned process. Start applications, workers, CI, and QA from that environment so the
  exported variable takes precedence over dotenv fallback files. If the application overwrites
  the supplied process variable, return `blocked` rather than editing its local env files.
- When querying the selected database through `$query-local-db`, pass the verified variable name
  to its helper with `--database-url-env <name>`. Never pass the connection value and never let
  the helper fall back to local `stack` during an isolated-database run.
- Apply the same binding rules in local Codex, local Cursor, and cloud agents. Do not assume a
  cloud workspace inherited database configuration.
- Persist only `verified | not_needed | blocked`, the non-secret branch ID when applicable, and
  the affected process or worktree under `## Database Runtime`; never persist credentials.

Return `blocked` before database-dependent work when binding cannot be established or verified.
When no database-dependent action exists, record `not_needed`; do not claim the selected database
was exercised.

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

Do not return `blocked` merely because a resolvable HITL answer is pending: ask, wait, record, and resume. Return `blocked` only when the user cannot supply required input or the answer exposes ambiguous or conflicting scope. Execution-mode, database-profile, QA-profile, PR-evidence, and HITL questions are the only exceptions to the terminal output contract.

## Scheduler

Process stages in ascending order. Never start a later stage while the earliest incomplete stage has eligible or blocked work.

An issue is eligible when it is incomplete, `status` is `ready` or `in_progress`, every `blocked_by` issue is done, and `type` is `afk`.

- Run foundations and non-parallelizable issues serially.
- Run same-stage issues concurrently only when they are marked `parallelizable` and expected write areas are meaningfully disjoint.
- Fill available execution capacity and run additional eligible issues in waves.
- Resolve an eligible `hitl` issue through the HITL procedure.
- Stop only for missing groundwork, ambiguous scope, a semantic conflict, an unanswered HITL blocker, or a mode-specific infrastructure failure.

Before dispatching an issue, record the feature `HEAD` as its base SHA, set its canonical state to `status: in_progress` and `completed: false`, remove a resolved **Execution Blocker**, and refresh the index.

Apply the persisted database profile to every issue task and subagent. Pass only the profile,
database environment-variable name, and protected temporary environment-file path when needed;
never pass or persist a connection string. Require each worker to return whether database binding
was `verified`, `not_needed`, or `blocked`. When parallel issues would mutate the same isolated
database, run those issues serially unless the repository provides separate task-isolated
databases. Code-only issues may remain parallel.

Construct one canonical issue contract for every dispatch and persist it under
`## Change Contract` in the canonical issue file:

```yaml
change_contract:
  source: <absolute-issue-path>
  scope:
    - <acceptance behavior and expected write areas>
  exclusions:
    - <sibling or explicitly excluded work>
  review_base: <issue-base-sha>
  changed_files: []
```

Pass the same contract through implementation, cleanup, structural review, and independent review.
Allow mutating capabilities to update only `changed_files`; reject any widened scope, changed
exclusions, changed base, or unexplained file. Refresh the persisted contract after every
mutating capability so resume uses the exact current manifest.

## Main-thread hygiene

Keep detailed execution inside issue tasks or subagent threads. Keep canonical state inside issue files plus the index.

- Treat worker and reviewer contracts as machine-facing. Validate and consume them without pasting raw reasoning, logs, diffs, or summaries into the main conversation.
- Send one compact update after preflight, after each completed wave, and after each stage.
- If a wave runs longer than one minute, send a brief heartbeat without narrating unchanged state.
- Use: `stage: <stage> | mode: <tasks-or-subagents> | completed: <ids-or-none> | active: <ids-or-none> | blocked: <id-and-reason-or-none> | next: <one action>`.
- Interrupt normal cadence only for a mode, database-profile, QA-profile, PR-evidence, or HITL
  question, or an actionable blocker.
- Do not repeat progress. The terminal response must use only the final output contract.

## Blocked work and resume

When implementation, review, commit validation, rebase, cherry-pick, or integration blocks:

1. Stop dispatching new issues and let every already-running worker in the current wave finish.
2. Set the affected issue to `status: blocked` and `completed: false`.
3. Record the mode, phase, exact blocker, base SHA, and every available task/thread/branch/worktree/commit identifier under `## Execution Blocker`.
4. Integrate any already-successful sibling whose dependency path does not include the blocked issue.
5. Preserve blocked tasks, branches, worktrees, and scoped changes. Never force-delete or silently restart them.
6. Refresh the index and run the database cleanup procedure.
7. Return the terminal `blocked` contract with the affected `local_id`.

On a later invocation, inspect preserved state before dispatching. When `## Neon Lifecycle`
identifies an active child, rebind it before resuming database-dependent work. If the blocker is
objectively gone, remove **Execution Blocker**, set `status: in_progress`, and resume the failed
phase in the existing task or worktree. Otherwise return `blocked` without creating a duplicate.

## Integrated issue state

After each issue commit is integrated in dependency-safe global order:

1. Set its issue file to `status: done` and `completed: true`.
2. Remove **Execution Blocker**.
3. Write concise Implementation Notes with the integrated commit and execution mode.
4. Regenerate the index from issue frontmatter.

Do not create merge commits, squash commits, per-issue PRs, or remote issue branches.

## Stage closeout

Record the feature SHA at the start of each stage. After every issue in that stage is integrated:

1. Construct a stage `change_contract` using the PRD and index as source, the completed stage as
   scope, later stages as exclusions, the stage-start SHA as `review_base`, and the current stage
   diff as `changed_files`.
2. Spawn a fresh structural-refactor subagent in the main workspace with only the PRD, index,
   main-workspace path, and stage contract.
3. Have it run `$refactor-structure` with the stage contract and return that
   skill's standard contract.
4. After it exits, spawn a separate fresh reviewer subagent with the returned contract and have
   it run `$thermo-nuclear-code-quality-review`.
5. After both exit `done`, commit any structural or review fixes once as
   `refactor: harden <stage-name> integration`.
6. Re-read issue frontmatter and refresh the index before scheduling the next stage.

## Plan closeout

When every issue is `done` and `completed: true`:

1. Construct a plan `change_contract` using the PRD and index as source, the full approved plan as
   scope, explicit non-goals as exclusions, the feature branch point as `review_base`, and the
   complete feature diff as `changed_files`.
2. Run the repository's documented format-write or format-fix command before calling `$run-ci`. Inspect the diff and commit any formatting-only changes once as `maintenance: format final changes`. If formatting fails, handle it as the first mechanical failure in the CI repair loop.
3. Run `$run-ci` with the plan contract as a read-only verification pass. Bind its selected
   database-dependent commands to the verified database environment.
4. If it fails, exit `$run-ci` and enter the CI repair loop below. Do not return `blocked` on the first repairable failure.
5. Execute the manual browser QA procedure below against the exact CI-passing feature SHA.
6. Run `$to-pr` in `draft` mode with the plan contract and verification plus QA summaries. When
   `pr_evidence` is `video` or `text`, include an explicit note that final evidence is pending.
   Require one draft PR and retain its URL.
7. Execute the PR evidence procedure below.
8. When evidence was produced, run `$to-pr` again in `draft` mode with the same plan contract and
   final evidence. Update the existing PR body in place and remove the pending-evidence note.
9. Record the QA and evidence SHA, then run `$babysit` on the draft PR with the plan contract.
   Never mark it ready, merge it, or publish a release.
10. If babysit changes branch `HEAD`, rebuild the plan contract's `changed_files`, rerun complete
    `$run-ci`, rerun the full selected QA profile, regenerate the selected evidence, and update
    the same draft PR. Do not finish with QA or evidence tied to an older SHA.
11. Run the database cleanup procedure below.
12. Set PRD `status: completed` and move the plan to
   `plans/completed/<plan-slug>/` without leaving a duplicate.

### Manual browser QA procedure

1. For `none`, skip browser QA and persist `qa_result: skipped`. Do not skip `$run-ci` or required
   database runtime verification.
2. For `light` or `heavy`, follow
   [manual browser QA](references/manual-browser-qa.md) against the real local application or
   explicitly supplied isolated preview. Require the application and every supporting worker to
   use the selected verified database environment when database-dependent.
3. Persist the tested feature SHA, scenario counts, failures, blocked cases, data profile, and
   database-binding result under `## Manual QA` in the PRD.
4. When all executed scenarios pass and every blocked case is disclosed and non-critical,
   continue to draft PR creation.

For a branch-caused failure inside the approved plan, allow at most three QA repair attempts:

1. Dispatch the smallest repair through the selected execution mode in a dedicated task or
   worktree based on the current feature `HEAD`. Use the QA finding as the continuation source
   without widening the plan contract.
2. Run `$forge-issue`, `$deslop`, `$refactor-structure`, and a fresh
   `$thermo-nuclear-code-quality-review` inside that isolated checkout.
3. Commit the reviewed cycle once as `patch: fix manual QA findings` and integrate it through the
   selected mode's normal commit-validation path.
4. Run the complete `$run-ci` suite again with the verified database binding.
5. Rerun the full selected QA profile against the new SHA, not only the failed scenario.

Return `blocked` when a failure needs a product decision, falls outside approved scope, cannot be
reproduced safely, exhausts three repair attempts, or a required browser, service, account, or
database environment is unavailable. Never reduce `heavy` to `light` or `light` to `none`
silently.

### PR evidence procedure

Tie all evidence to the exact final CI-passing feature SHA.

1. For `video`, follow [video and delivery](references/video-and-delivery.md):
   - inspect the PRD, issue index, and complete feature diff;
   - choose the smallest coherent end-to-end story that proves every meaningful user-visible
     outcome, merging related beats and disclosing non-visual changes in the PR summary;
   - use the host's best native browser or computer-use recording capability against the real
     local application bound to the selected verified database environment when
     database-dependent;
   - inspect the complete H.264 MP4 for correctness, sensitive data, and usable framing;
   - attach it to an associated parent Linear issue when available, otherwise to the already
     created draft PR or configured private artifact storage.
2. For `text`, record a concise evidence summary containing the relevant verification commands,
   results, and observed state without raw production data or secrets.
3. For `none`, produce no separate artifact and omit the PR evidence section.
4. Persist the profile, evidence location or inline summary, and exact feature SHA under
   `## PR Evidence` in the PRD.

If the selected native browser or computer-use capability, local application dependency, or
authorized private evidence destination is unavailable, preserve completed work and return
`blocked` with the specific missing prerequisite. Never silently downgrade `video` to `text` or
`none`.

### Database cleanup procedure

Run cleanup after success and before every terminal `blocked` or failed result:

1. Stop applications, workers, and database-dependent processes started by this plan.
2. When an active Neon child exists, invoke `$provision-neon-branch` with `operation: cleanup`
   and the exact provision or rebind result; require confirmed deletion.
3. Unset task-scoped database variables and remove protected temporary environment files.
4. Persist the non-secret cleanup result and `deleted: true` under `## Neon Lifecycle`.

Treat Neon expiration as crash protection, not normal cleanup. Never retain the child for
debugging unless the user explicitly asks.

### CI repair loop

Allow at most three repair attempts. A repair attempt may address multiple failures that share a root cause.

1. Persist the attempt number, failing checks, exact failure signatures, and current feature SHA under `## CI Repair` in the PRD.
2. Classify each failure before changing code:
   - **Mechanical**: formatting or safely auto-fixable lint. Run the repository's documented fix command, then inspect its diff.
   - **Code**: typecheck, build, lint, or test failures caused by the feature branch. Fix the smallest root cause in the main workspace and add or adjust focused tests only when needed to preserve intended behavior.
   - **Environment**: missing services, credentials, runtimes, containers, or transient network failures. Apply only documented, safe environment remediation and retry the affected check once. Never change product code to hide an environment failure.
3. Never weaken CI, skip checks, delete meaningful tests, or update snapshots without verifying that the new output is intended.
4. Review the repair diff and commit the cycle once as `patch: fix final CI failures`. Record the repair commit in `## CI Repair`.
5. Update the plan contract's `changed_files`, then rerun the complete `$run-ci` suite with the
   contract after every repair commit. A partial check may guide the repair, but it does not count
   as closeout verification.
6. Clear `## CI Repair` after a full pass and continue to draft PR creation and the PR evidence
   procedure.

Return `blocked` only when a failure is not safely repairable, required environment remediation is unavailable, the same failure signature survives two repair attempts, or three total repair attempts have failed. Preserve the repair state and report the remaining exact failure.

## Output

Return only:

```yaml
status: done | blocked
plan_slug: <plan-slug>
execution_mode: tasks | subagents
data_profile: none | local | neon
database_runtime: verified | not_needed | blocked
qa_profile: none | light | heavy
qa_result: skipped | passed | blocked
qa_scenarios:
  passed: <count>
  failed: <count>
  blocked: <count>
completed_issues: <count>
remaining_issues: <count>
branch: <feature-branch>
pr: <url-or-null>
evidence_profile: video | text | none
evidence: <artifact-url-or-inline-summary-or-null>
video: <absolute-path-or-artifact-url-or-null>
neon_branch_deleted: true | false | null
blocker: null | <specific blocker>
```

Do not add explanatory prose. When Codex Desktop requires git action directives, append those
standalone directives after the YAML contract; they are the only permitted non-YAML output.
