---
name: refactor-structure
description: Improve a scoped diff's folder organization, naming, and file cohesion without changing behavior. Use before review or commit when structural hygiene is needed.
---

# Refactor Structure

Refactor the scoped diff inline. Do not spawn another agent.

Accept or derive `change_contract` per [change contract](../forge-build/references/change-contract.md).

## Structural audit

Apply high-confidence, behavior-preserving fixes:

1. **Folders** — colocate with owning feature/domain/layer; avoid dumping grounds (`utils`, `helpers`, `common`); remove unnecessary nesting.
2. **Naming** — match repository casing, pluralization, suffix, and test-file conventions; rename vague or misleading names atomically with import updates.
3. **Cohesion** — extract when a file has multiple independent responsibilities; keep together when splitting adds indirection without improving comprehension.

Prefer the smallest change that makes ownership and navigation obvious. Do not redesign algorithms, replace domain abstractions, or perform routine import/dead-code cleanup except as required for a safe move.

## Guardrails

Preserve acceptance behavior, public APIs, schemas, migrations, permissions, and external contracts. Do not stage, commit, push, run full CI, or edit plan files. Return `blocked` when structure depends on an unresolved product or ownership decision.

## Converge

Audit placement, names, and cohesion; apply fixes; re-read diff once for broken references.

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
summary: <one line covering folder structure, naming, and file cohesion>
blocker: null | <specific blocker>
```
