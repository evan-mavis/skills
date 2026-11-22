---
{name: swarm,description: "Fan out N parallel workers, drain them, and return one report. Use for $swarm, 'swarm this', or parallel coverage, races, gauntlets, and exploration."}
---

# Swarm

Use `tools.subagent.create` and `tools.subagent.get` for independent passes. Give each worker the task, evidence, paths, and constraints explicitly. If delegation or required permissions are unavailable, report the blocker and leave the independent-review gate incomplete. Do not replace it with another pass by the same agent.

Fan out N parallel Capy workers. They may cover separate slices, race the same brief, or mix both. The parent waits, aggregates, and returns one report.

## Start

Track one entry per phase before launching anything.

1. Frame
2. Fan out
3. Aggregate
4. Report

## Phase A: Frame

1. State the done predicate and the artifact or report the swarm must return.
2. Choose the shape. Partition into slices, race N workers on identical briefs, or mix both. For a race or mixed shape, declare `first pass`, `rank all`, or `best-of` before spawning.
3. Set N from the user or derive it from the shape. N is total workers, bounded by this session's available concurrency.
4. Omit model overrides to inherit the parent. Select another model only when the user requests an available selection. Report unavailable selections and any unobservable model identity. For a user-requested model race, name each available arm's model up front and report any missing arm.
5. Give each worker its own writable output when it writes. When workers verify or measure commits, each brief names the exact SHAs. A measurement brief also names the method (sample count, what one sample is, order). The worker records both in its result.

## Phase B: Fan out

Create and start workers with `tools.subagent.create`, specifying `start.machine`. Use `fresh` machines for competing writers and `shared` for read-only work that needs the current tree. Check rejected starts and respect the session's concurrency limit. Keep machine-local verification on a runtime that exposes the required tools.

When a worker must start from a non-default branch, specify the repository and branch in its `repos` entry. Fresh machines see pushed state; use shared placement when uncommitted state is required.

Every brief stands alone. Include the goal, scope, exact slice or race arm, how to verify, and what to report. Reports use `PASS`, `ISSUES`, or `BLOCKED` with evidence. A worker that can prove a defect reports `ISSUES` and lists every issue it can prove, not only the first.

If a worker drops out, proceed with N-1 and note it.

## Phase C: Aggregate

Read the terminal results. Drop a result that does not record the SHAs and method its brief names, and respawn that worker once. After a second miss, record a gap. A gap does not count as a pass. For coverage, every required slice needs a result. For a race, apply the selection rule declared up front. Use first pass, rank all, or best-of. Do not paste raw worker dumps.

Keep a compact result table, one-line evidenced issues, and explicit gaps or dropouts.

## Phase D: Report

Return one consolidated in-chat report with the table, issue one-liners, gaps or dropouts, and the race rule when used.
