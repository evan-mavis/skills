---
name: harden-architecture
description: Independently review and proactively fix architectural and control-flow problems in a scoped implementation, repair, feature, or stage diff. Use as a fresh reviewer to correct ownership boundaries, leaky abstractions, ad-hoc behavior models, unsafe orchestration, and avoidable coupling without redoing mechanical cleanup or file organization.
---

# Harden Architecture

Review and fix the current diff inline. Do not spawn another agent. When independent review is
required, invoke this skill from an already-fresh reviewer agent.

Judge the supplied issue and PRD or actionable PR feedback together with repository state and the diff. Do not request or rely on the implementation agent's conversation, rationale, or summary.

## Change contract

Accept a caller-supplied contract or derive one from the current request and diff:

```yaml
change_contract:
  source: <prompt-or-source-url-or-path>
  scope: []
  exclusions: []
  review_base: <sha>
  changed_files:
    - <repo-relative path>
```

Use the supplied `review_base` when present. Otherwise:

- use `HEAD` for a purely uncommitted diff;
- use the merge base with the repository's default branch for a committed branch diff or a diff
  containing both committed and uncommitted changes;
- return `blocked` when the intended review scope remains ambiguous.

Validate `scope`, `exclusions`, and `changed_files` before editing. Preserve the contract and
update `changed_files` after architectural fixes.

## Scope

Inspect:

- `git diff <review_base>` for all tracked working-tree and committed changes since the base
- `git status --short` and every untracked file
- enough adjacent code to judge ownership, existing helpers, and local architecture

Return `blocked` if the review base cannot be resolved. Do not review unrelated branch history.

## Fix proactively

Apply high-confidence, behavior-preserving fixes for:

- ad-hoc conditionals and special cases that should disappear behind a clearer behavior model
- feature logic owned by the wrong architectural layer or domain boundary
- leaky abstractions, misplaced responsibilities, and unnecessary indirection between layers
- duplicated business rules that should have one canonical owner
- state and side-effect ownership that creates hidden coupling or partial updates
- sequential or partial-update orchestration whose safer parallel or atomic structure is obvious
- failure handling that obscures invariants or leaves the system in an inconsistent state

Prefer deleting concepts and branches over rearranging them. Keep code direct, typed, cohesive, and unsurprising.

Do not perform routine comment, import, cast, optionality, or dead-code cleanup. Do not move,
rename, or split files solely for organization or size. Fix those concerns only when inseparable
from an architectural correction.

## Guardrails

Do not silently change acceptance behavior, public APIs, schemas, migrations, permissions, security behavior, billing behavior, or external contracts. Do not broaden the issue to pursue an architectural rewrite. Return `blocked` when the correct structural fix depends on an unresolved product or contract decision.

Do not stage, commit, push, run full CI, or edit plan files.

## Converge internally

1. Scan the complete scoped diff.
2. Apply every high-confidence fix.
3. Re-scan the resulting diff for regressions or remaining blockers.
4. Repeat for at most three passes, then return `blocked` if a material issue remains.

The caller should invoke this skill once; keep the review/fix loop internal.

## Approval bar

Finish only when the scoped diff has:

- no architectural regression or ownership boundary leak
- no avoidable spaghetti growth, hidden coupling, or ad-hoc behavior model
- no unjustified abstraction or orchestration machinery
- no partial-update flow where a clearly safer atomic model is available
- no obvious simpler architectural implementation left on the table

## Output

Return only:

```yaml
status: done | blocked
changed: true | false
change_contract:
  source: <prompt-or-source-url-or-path>
  scope: []
  exclusions: []
  review_base: <sha>
  changed_files:
    - <repo-relative path>
summary: <one line>
blocker: null | <specific blocker>
```
