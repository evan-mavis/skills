---
name: to-issues
description: Break a local PRD, plan, spec, or conversation context into independently implementable local issue Markdown files under the repo's ignored `plans/` directory. Use when the user wants implementation slices, local tickets, task breakdowns, or issue drafts without creating Linear issues.
---

# To Issues

Break a PRD or plan into independently implementable local issue Markdown files in the current repository's ignored `plans/` directory. Do not create or update Linear issues from this skill. If the user wants Linear sync, tell them to run `to-linear` after the local issue files are approved.

Use vertical slices (tracer bullets): each issue should deliver a narrow, complete path through the relevant layers, not a horizontal layer-only task.

## Process

### 1. Gather context

Work from the provided local PRD file, plan file, pasted content, or current conversation context.

If the user passes a Linear issue identifier or URL, do not fetch Linear by default. Ask whether they want to use `to-linear` or paste/export the issue contents locally first.

Confirm the repo root and ensure `plans/` exists. If possible, confirm it is ignored with `git check-ignore -v plans/test.md`.

If the source plan is too ambiguous to slice into useful local issues and `[grill-me](../grill-me/SKILL.md)` has not already been used in the current chat context, use `grill-me` before drafting issue files. If `grill-me` already ran or the ambiguity is minor, proceed and capture uncertainty in the issue files as assumptions, `HITL` type, blockers, or acceptance criteria gaps.

### 2. Explore the codebase

If you have not already explored the codebase enough to slice the work, inspect the relevant implementation and tests.

### 3. Draft vertical slices

Use the source PRD's `Intent`, `Current State`, `Target Behavior`, `Scenarios`, `Acceptance Criteria`, `Scope`, `Key Decisions`, `Assumptions`, `Implementation Notes`, and `Test Strategy` as the main planning inputs. Treat the PRD as agent-facing source material; preserve execution cues and constraints even when they are not polished prose.

Slices may be:

- `AFK`: can likely be implemented and validated without human clarification
- `HITL`: requires a human decision, design review, policy call, or unresolved product/technical choice

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
- carry forward relevant key decisions, assumptions, constraints, and test strategy notes
- record dependencies using local issue filenames or stable local IDs
- be marked parallelizable only when it does not depend on unresolved shared foundations
- call out when it is a good candidate to spin off into a separate agent thread or subagent because its dependencies, write areas, and validation path are isolated from sibling slices

### 4. Review with the user

Present the proposed breakdown before writing files when the scope is large or ambiguous. For each slice, show:

- title
- type: `HITL` or `AFK`
- relationship: parent plan, foundation, implementation slice, follow-up, or related
- blocked by
- blocking
- quick coverage summary
- whether it should be spun off to a separate agent thread/subagent when the user wants parallel implementation

Ask for approval only when the breakdown has meaningful ambiguity that was not already resolved by `grill-me`. Otherwise, create the files and note that the user can revise them locally.

When asking for approval or a planning decision, use the structured decision UI when available. Present 2-3 mutually exclusive choices, put the recommended option first, and label it `(Recommended)`. If the decision UI is unavailable, use the same choices as a concise numbered list.

Use this standard decision prompt for ambiguous breakdowns:

- Header: `Breakdown`
- Question: `How should I proceed with this issue breakdown?`
- Options:
  - `Create files (Recommended)`: Write the staged local issue files now.
  - `Revise breakdown`: Adjust stages, dependencies, or issue granularity first.
  - `Run grill-me`: Clarify unresolved scope before writing files.

Use this standard breakdown review shape when presenting slices before writing:

```markdown
**Issue Breakdown**
- Plan: <plans/slug/PRD.md>
- Stages: <stage count and names>
- Issues: <issue count>
- Foundation: <local id or None>
- Parallel Candidates: <local ids or None>
- Subagent Candidates: <local ids that are safe to spin off separately, or None>
- HITL: <local ids or None>
- Decision Needed: Breakdown
```

### 5. Write local issue files

Create issue files under one plan directory using this staged naming pattern:

- `plans/<slug>/PRD.md`
- `plans/<slug>/00-index.md`
- `plans/<slug>/01-foundation/01-<slice-slug>.md`
- `plans/<slug>/01-foundation/02-<slice-slug>.md`
- `plans/<slug>/02-core-flows/03-<slice-slug>.md`
- `plans/<slug>/02-core-flows/04-<slice-slug>.md`
- `plans/<slug>/03-followups/05-<slice-slug>.md`

If a matching plan directory exists, update it instead of creating duplicates unless the user asks for a new version.

Each numbered folder is an execution stage:

- stages execute in ascending numeric order
- issue file numbers are global chronological ordinals across the whole plan and must never reset inside each stage folder
- local IDs use the same global issue ordinal, not a stage-local ordinal; for example, after two foundation issues `close-loop-01` and `close-loop-02`, the first core-flow issue is `close-loop-03`, not `close-loop-02-01`
- issue files in the same stage may be parallelizable when their dependencies and write areas allow it
- if an issue cannot run in parallel with the current stage, put it in the next numbered stage
- keep the structure shallow: `plans/<slug>/<stage-number>-<stage-name>/<global-issue-number>-<issue-slug>.md`
- use semantic stage names such as `01-foundation`, `02-core-flows`, or `03-polish`, not only `parallel`
- when adding a new issue to an existing plan, pick the next unused global issue number after scanning every issue file in every stage folder

Use `00-index.md` as the local tracker. It should list every issue file, completion checkbox, type, status, dependency relationships, and whether each issue is parallelizable. The index should make completed work visible without requiring agents to open every issue file.

Recommended index row format:

```markdown
| Done | Stage | Local ID | Issue | Type | Status | Blocked By | Blocking | Parallelizable |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [ ] | 02-core-flows | <slug>-04 | [Issue title](02-core-flows/04-issue-title.md) | AFK | Ready | <slug>-02 | <slug>-06 | Yes |
```

## Local Issue Template

```markdown
# <Issue Title>

Completed: [ ]
Local ID: <slug>-<global-issue-number>
Stage: <stage-number>-<stage-name>
Type: AFK | HITL
Status: Draft | Ready | In Progress | Blocked | Done
Parent Plan: <relative path to PRD or plan, if any>
Blocked By: <local IDs or filenames, or None>
Blocking: <local IDs or filenames, or None>
Parallelizable: Yes | No

## What to Build

A concise description of this vertical slice. Describe end-to-end behavior, not layer-by-layer implementation.

## Scenarios / Outcomes Covered

> Source scenario, target behavior, scope item, or acceptance criterion addressed by this slice.

## Acceptance Criteria

- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## Technical Approach

High-level direction and constraints from the PRD's key decisions, assumptions, and implementation notes. Capture intended architecture and major choices without over-specifying implementation.

## Validation Notes

Focused validation expected for this slice, informed by the PRD's test strategy and nearby repo patterns. Respect repo and user validation rules.

## Implementation Notes

- Not started.

## Local Source

- PRD: <relative path to PRD or plan>
- Index: <relative path to 00-index.md>

## Linear Sync

Linear Issue: Not synced
Last Synced: Never
```

Keep the `Completed: [ ]` checkbox near the top of every local issue file. Future agents should be able to determine completion by scanning the first metadata block without reading the full issue.

## Output Expectations

End with:

```markdown
**Issues Created**
- Index: <plans/slug/00-index.md>
- Files: <created/updated count>
- Stages: <short stage summary>
- Parallel Work: <summary of issue slices that can run in separate agent threads/subagents, or None>
- Blockers: <summary or None>
- Completion: `Completed: [ ]` in issue files and `Done` column in `00-index.md`
- Next Step: `implement-issue` or `to-linear`
```
