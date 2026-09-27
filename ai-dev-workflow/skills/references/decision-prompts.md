# Decision Prompts

Standard interactive choices for planning skills. Present via
[interactive choices](host-surfaces.md#interactive-choices) — recommended option first.

## Clarify

Use when a PRD has meaningful ambiguity and `$grill-me` has not already run.

- Header: `Clarify`
- Question: `This PRD has meaningful ambiguity. How should I proceed?`
- Options:
  - `Run grill-me (Recommended)`: Clarify before drafting.
  - `Draft with assumptions`: Write the PRD; capture gaps in Assumptions / Open Questions.

## Breakdown

Use when a slice breakdown is large or ambiguous.

- Header: `Breakdown`
- Question: `How should I proceed with this issue breakdown?`
- Options:
  - `Create files (Recommended)`: Write issue files now.
  - `Revise breakdown`: Adjust stages, deps, or granularity first.
  - `Run grill-me`: Clarify scope before writing files.

## Archive

Use at the end of `$to-slices` only, after commit+push.

- Header: `Archive`
- Question: `Also copy this plan to a remote archive repo?`
- Options:
  - `Skip (Recommended)`: Keep the plan only on the feature branch.
  - `Archive remotely`: Ask for Git URL if unknown; flat-copy; commit+push archive repo.

## Plan

Use when `$to-linear` cannot pick a plan.

- Header: `Plan`
- Question: `Which plan should I sync to Linear?`
- Options:
  - `Use detected plan (Recommended)`: Sync the obvious plan under `specs/`.
  - `Choose another`: Wait for a `specs/<slug>/…` path.

## Target

Use when Linear create-vs-update is ambiguous.

- Header: `Target`
- Question: `How should I handle existing Linear issues?`
- Options:
  - `Update existing (Recommended)`: Update IDs from specs metadata.
  - `Create new`: Create new Linear issues.
  - `Stop`: Do not sync until clarified.
