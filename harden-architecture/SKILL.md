---
name: harden-architecture
description: Independently review and fix architectural problems in a scoped diff — ownership boundaries, leaky abstractions, ad-hoc behavior models, unsafe orchestration, and avoidable coupling. Not for mechanical cleanup or file organization.
---

# Harden Architecture

Review and fix the current diff inline. Do not spawn another agent. When independent review is
required, invoke from an already-fresh reviewer agent with no implementation conversation.

Accept or derive `change_contract` per [change contract](../forge-build/references/change-contract.md).
Judge the supplied issue/PRD/feedback together with repository state — not the implementer's rationale.

## Fix proactively

High-confidence, behavior-preserving fixes for:

- ad-hoc conditionals that should disappear behind a clearer behavior model
- logic owned by the wrong layer or domain boundary
- leaky abstractions, misplaced responsibilities, unnecessary indirection
- duplicated business rules without a canonical owner
- hidden coupling or partial-update orchestration with an obvious safer atomic structure
- failure handling that obscures invariants or leaves inconsistent state

Prefer deleting concepts over rearranging them. Do not perform routine comment/import/cast cleanup or file moves solely for organization.

## Guardrails

Do not silently change acceptance behavior, public APIs, schemas, migrations, permissions, or security/billing behavior. Do not broaden into an architectural rewrite. Do not stage, commit, push, run full CI, or edit plan files.

## Converge internally

Scan diff → apply fixes → re-scan. At most three passes, then return `blocked` if material issues remain. Caller invokes once; keep the loop internal.

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
