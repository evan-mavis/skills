---
name: to-slices
description: Break a local PRD, plan, spec, or conversation context into independently implementable local slice Markdown files under the repo's ignored `plans/in-progress/` directory. Use when the user wants implementation slices, local tickets, task breakdowns, or slice drafts without creating Linear issues.
---

# To Slices

Break a PRD or plan into independently implementable local slice Markdown files in the current repository's ignored `plans/in-progress/` directory. Do not create or update Linear issues from this skill. If the user wants Linear sync, tell them to run `to-linear` after the local slice files are approved.

This skill is directly callable for any approved local PRD or supplied plan. Clarification, PRD
authoring, Linear sync, and implementation remain separate invocations.

Use vertical slices (tracer bullets): each issue should deliver a narrow, complete path through the relevant layers, not a horizontal layer-only task.

## Plan Schema

Issue frontmatter is the canonical state. `<plan-slug>-index.md` is a generated summary for humans and scheduling, rebuilt from issue frontmatter whenever issue state changes.

Required issue frontmatter:

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

Allowed values:

- `type`: `afk` or `hitl`
- `hitl_timing`: `null` for `afk`; `upfront` or `evidence_dependent` for `hitl`
- `status`: `draft`, `ready`, `in_progress`, `blocked`, or `done`
- `completed`: `true` only when the issue outcome is complete, whether through implementation or a decision-only human action
- dependency fields use local IDs, not filenames, when possible

### Descoping and plan archive

When issues are deferred or cut from a plan's scope, **do not** leave them in the parent with `status: deferred` and archive anyway. Instead:

1. create a new plan under `plans/in-progress/<new-slug>/` for the deferred work
2. remove the issue from the parent plan (delete file + refresh parent `<plan-slug>-index.md`)
3. link the follow-up from the parent PRD/index

A plan is eligible for `plans/completed/` only when every remaining issue has `completed: true`
and `status: done`. The workflow completing the plan owns the final move.

## Process

### 1. Gather context

Work from the provided local PRD file, plan file, pasted content, or current conversation context.

If the user passes a Linear issue identifier or URL, do not fetch Linear by default. Ask whether they want to use `to-linear` or paste/export the issue contents locally first.

Confirm the repo root with `git rev-parse --show-toplevel` and ensure `plans/`, `plans/in-progress/`, and `plans/completed/` exist. If possible, confirm `plans/` is ignored with `git check-ignore -v plans/test.md`.

If the source plan is too ambiguous to slice into useful local issues and `[$grill-me](../grill-me/SKILL.md)` has not already been used in the current chat context, use `$grill-me` before drafting issue files. If `$grill-me` already ran or the ambiguity is minor, proceed and capture uncertainty in **Approach**, **HITL Requirement**, blockers, or acceptance criteria gaps.

### 2. Explore the codebase

If you have not already explored the codebase enough to slice the work, inspect the relevant implementation and tests.

### 3. Draft vertical slices

Use the source PRD's `Intent`, `Current State`, `Target Behavior`, `Scenarios`, `Acceptance Criteria`, `Scope`, `Key Decisions`, `Assumptions`, `Implementation Notes`, and `Test Strategy` as the main planning inputs. Treat the PRD as agent-facing source material; preserve execution cues and constraints even when they are not polished prose.

Slices may be:

- `AFK`: can likely be implemented and validated without human clarification
- `HITL`: requires a specific human decision, approval, action, or evidence-based review

Prefer `AFK` where the scope is clear.

Before marking slices parallelizable, check whether they share a foundation such as:

- a new service or interface
- shared request or response types
- schema or contract changes
- common wiring, registration, exports, or validation scaffolding

If multiple slices would overlap heavily on shared structure, create a small foundation issue first. The foundation issue should introduce only the minimum shared contracts, shells, or wiring needed to unblock real vertical slices.

Each slice should:

- deliver a narrow, complete behavior path
- be demoable or verifiable on its own
- have a clear reason to exist as its own issue file
- trace back to the PRD intent, target behavior, scope, and acceptance criteria it advances
- carry forward relevant key decisions, assumptions, and constraints into **Approach** — stay high level, no file-by-file specs
- record dependencies using stable local IDs in `blocked_by`, `blocking`, and `related`
- be marked parallelizable only when it does not depend on unresolved shared foundations
- name expected write areas in **Approach** and set `parallelizable: true` only when they are meaningfully disjoint from sibling slices
- for `hitl`, state the exact decision or action under **HITL Requirement** and set `hitl_timing` to `upfront` or `evidence_dependent`

Local issues are **agent-first** — write each slice so an atomic implementation capability can
execute it without reconstructing the plan. Keep them lightly human-readable since they may feed
external issue tracking, but optimize for agent execution. Fill **Implementation Notes** after
integrating the implementation commit.

### 4. Review with the user

Present the proposed breakdown before writing files when the scope is large or ambiguous. For each slice, show:

- title
- type: `HITL` or `AFK`
- relationship: parent plan, foundation, implementation slice, follow-up, or related
- blocked by
- blocking
- quick coverage summary
- expected write areas and whether it is parallelizable
- for `HITL`, the exact question or action and when it must occur

Ask for approval only when the breakdown has meaningful ambiguity that was not already resolved by `grill-me`. Otherwise, create the files and note that the user can revise them locally.

When asking for approval or a planning decision, follow [interactive choices](../references/host-surfaces.md#interactive-choices).

Use this standard decision prompt for ambiguous breakdowns:

- Header: `Breakdown`
- Question: `How should I proceed with this issue breakdown?`
- Options:
  - `Create files (Recommended)`: Write the staged local issue files now.
  - `Revise breakdown`: Adjust stages, dependencies, or issue granularity first.
  - `Run grill-me`: Clarify unresolved scope before writing files.

### 5. Write local issue files

Create issue files under one active plan directory. Use the staged naming pattern and
[issue template](references/issue-template.md) for every new slice file.

- `plans/in-progress/<slug>/PRD.md`
- `plans/in-progress/<slug>/<slug>-index.md`
- `plans/in-progress/<slug>/01-foundation/01-<slice-slug>.md`
- `plans/in-progress/<slug>/01-foundation/02-<slice-slug>.md`
- `plans/in-progress/<slug>/02-core-flows/03-<slice-slug>.md`
- `plans/in-progress/<slug>/02-core-flows/04-<slice-slug>.md`
- `plans/in-progress/<slug>/03-followups/05-<slice-slug>.md`

If a matching plan directory exists under `plans/in-progress/`, update it instead of creating duplicates unless the user asks for a new version. Treat `plans/completed/` as archived and only update a completed plan when the user explicitly asks to revisit it.

Each numbered folder is an execution stage:

- stages execute in ascending numeric order
- issue file numbers are global chronological ordinals across the whole plan and must never reset inside each stage folder
- local IDs use the same global issue ordinal, not a stage-local ordinal; for example, after two foundation issues `close-loop-01` and `close-loop-02`, the first core-flow issue is `close-loop-03`, not `close-loop-02-01`
- issue files in the same stage may be parallelizable when their dependencies and write areas allow it
- if an issue cannot run in parallel with the current stage, put it in the next numbered stage
- keep the structure shallow inside the active plan: `plans/in-progress/<slug>/<stage-number>-<stage-name>/<global-issue-number>-<issue-slug>.md`
- use semantic stage names such as `01-foundation`, `02-core-flows`, or `03-polish`, not only `parallel`
- when adding a new issue to an existing plan, pick the next unused global issue number after scanning every issue file in every stage folder

Generate `<plan-slug>-index.md` from issue frontmatter. It should list every issue file, completion checkbox, Linear issue, type, HITL timing, status, dependency relationships, and whether each issue is parallelizable. If the index and frontmatter disagree, update the index from frontmatter.

Recommended index row format:

```markdown
| Done | Stage         | Local ID  | Linear     | Issue                                          | Type | HITL Timing | Status | Blocked By | Blocking  | Parallelizable |
| ---- | ------------- | --------- | ---------- | ---------------------------------------------- | ---- | ----------- | ------ | ---------- | --------- | -------------- |
| [ ]  | 02-core-flows | <slug>-04 | Not synced | [Issue title](02-core-flows/04-issue-title.md) | AFK  | —           | Ready  | <slug>-02  | <slug>-06 | Yes            |
```

## Output

Keep the final answer in the format below and omit a final-answer preamble. Commentary updates may still be used when required by the host.

**When presenting a breakdown** — before writing files:

```markdown
**Issues**

- Plan: <slug>
- Proposed: <short list of slice titles, or ask to create>
- Next: create files | revise breakdown
```

**When done:**

```markdown
**Issues**

- Index: [plans/in-progress/<slug>/<slug>-index.md](<absolute index file path>)
- [plans/in-progress/<slug>/<stage>/<nn>-<issue-slug>.md](<absolute issue file path>)
- [plans/in-progress/<slug>/<stage>/<nn>-<issue-slug>.md](<absolute issue file path>) (parallel)
- Next: $to-linear
```

List every created issue file in global order (ascending issue number). Use repo-relative paths for link text and absolute local paths for link targets. Add `(parallel)` only when frontmatter has `parallelizable: true`. One issue per bullet after the index line.

Rules: no final-answer preamble; `Next:` always last.
