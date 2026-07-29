# Capability Pipeline

Four fresh sequential subagents in one isolated checkout. Never run two concurrently in the
same checkout. The orchestrator owns dispatch, joins, contract validation, staging, committing,
and integration — it must not implement, clean, restructure, or review code itself.

## Sequence

1. `$implement-slice` — implement; leave diff uncommitted
2. `$deslop` — mechanical cleanup
3. `$refactor-structure` — folder, naming, file cohesion
4. `$harden-architecture` — independent architectural review and fix

If the host cannot spawn and join all four in the same checkout, return `blocked`; do not collapse
the pipeline inline or combine capabilities inside one worker.

## Subagent handoff

For each capability subagent:

- pass only the checkout path, source paths, the current canonical `change_contract`, and the
  minimum non-secret database runtime descriptor it needs;
- do not pass prior subagent conversations, rationale, or summaries;
- require it to invoke exactly its named standalone skill, never spawn another agent, and never
  stage, commit, push, run full CI, open or update a PR, or modify plan or orchestration state;
- wait for it to exit before starting the next capability;
- require its standard terminal contract, verify immutable contract fields per
  [change contract](change-contract.md), and only then replace the canonical contract.

## Repairs and continuations

Route every code-changing repair through a fresh four-step continuation in the same order. Use
the finding as continuation context without widening `source`, `scope`, `exclusions`, or
`review_base`.

## Partial pipelines

**Babysit** uses only `$deslop` then a fresh reviewer running `$harden-architecture` — same handoff
rules, no concurrent editing between fixer and reviewer.

**Stage closeout** in forge-build runs `$refactor-structure` then `$harden-architecture` in the
main workspace with a stage contract — two sequential fresh subagents, same validation rules.
