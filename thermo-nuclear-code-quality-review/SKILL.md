---
name: thermo-nuclear-code-quality-review
description: Independently review and proactively fix maintainability problems in the current issue, PR-fix, or stage diff. Use as a fresh reviewer after implementation and deslop to simplify structure, remove spaghetti growth, correct abstraction boundaries, and converge to a clean behavior-preserving implementation before commit or integration.
---

# Thermo-Nuclear Code Quality Review

Review and fix the current diff inline. Under `forge-build`, run inside the fresh reviewer agent created by the orchestrator; do not spawn another agent.

Judge the supplied issue and PRD or actionable PR feedback together with repository state and the diff. Do not request or rely on the implementation agent's conversation, rationale, or summary.

## Scope

Require an explicit `review_base` SHA or branch from the caller. Inspect:

- `git diff <review_base>` for all tracked working-tree and committed changes since the base
- `git status --short` and every untracked file
- enough adjacent code to judge ownership, existing helpers, and local architecture

Return `blocked` if the review base cannot be resolved. Do not review unrelated branch history.

## Fix proactively

Apply high-confidence, behavior-preserving fixes for:

- ad-hoc conditionals and special cases that should disappear behind a clearer model
- feature logic in the wrong layer or package
- duplicated logic or bespoke helpers that should use a canonical implementation
- thin wrappers, pass-through layers, unnecessary generic machinery, and cast-heavy boundaries
- giant files or components that need focused decomposition
- dead code, obsolete exports, and incidental complexity exposed by the change
- sequential or partial-update orchestration whose simpler parallel or atomic structure is obvious

Prefer deleting concepts and branches over rearranging them. Keep code direct, typed, cohesive, and unsurprising.

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

- no clear structural regression
- no avoidable spaghetti growth or boundary leak
- no unjustified file-size explosion
- no unnecessary wrappers, casts, optionality, dead code, or duplication
- no obvious simpler implementation left on the table

## Output

Return only:

```yaml
status: done | blocked
changed: true | false
summary: <one line>
blocker: null | <specific blocker>
```
