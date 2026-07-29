---
name: refactor-structure
description: Audit and improve a scoped code diff's folder organization, file and folder naming, and oversized files without changing behavior. Use directly on implementation, repair, feature-branch, or stage diffs that need an explicit structural hygiene pass before review or commit.
---

# Refactor Structure

Refactor the scoped diff into a clear, navigable structure. Run inline in the current checkout;
do not spawn another agent.

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
- return `blocked` when the intended scope remains ambiguous.

Validate `scope`, `exclusions`, and `changed_files` before editing. Preserve the contract and
update `changed_files` after any move, rename, split, or extraction.

## Scope

Inspect:

- `git diff <review_base>` and `git status --short`, including untracked files
- every changed source file and enough of its containing directories to understand ownership
- repository instructions and nearby naming, colocation, and module-boundary conventions

Return `blocked` if the review base cannot be resolved. Do not audit or reorganize unrelated
parts of the repository.

## Structural audit

Apply high-confidence, behavior-preserving fixes for all three areas:

1. **Folders and ownership**
   - Keep code with the feature, domain, or layer that owns it.
   - Colocate tightly coupled implementation, tests, types, and fixtures when that matches
     repository conventions.
   - Split mixed-responsibility directories and avoid new dumping grounds such as `utils`,
     `helpers`, `common`, or `misc` when a more specific owner exists.
   - Remove unnecessary nesting and one-file folders that make navigation harder.
2. **File and folder naming**
   - Make paths describe the concept or responsibility they contain.
   - Match the repository's casing, singular/plural, suffix, and test-file conventions.
   - Align a file's name with its primary export or responsibility when the repository does so.
   - Rename vague, misleading, overloaded, or implementation-detail names only when the new name
     materially improves discovery. Update imports and references atomically.
3. **File length and cohesion**
   - Inspect every changed file that is already large or grows meaningfully in the diff.
   - Treat line count as a review signal, not a universal cap. Judge whether the file contains
     multiple independently understandable responsibilities.
   - Extract cohesive modules, components, hooks, types, or helpers only when each extraction has
     a clear owner and name.
   - Keep code together when splitting would add indirection, pass-through APIs, or scattered
     control flow without improving comprehension.

Prefer the smallest structural change that makes ownership and navigation obvious.

Do not redesign algorithms or control flow, replace domain abstractions, consolidate business
logic solely to remove duplication, or perform routine comment, import, cast, or dead-code
cleanup. Change internal code only as required to complete a safe structural move.

## Guardrails

Preserve acceptance behavior, public APIs, schemas, migrations, permissions, security behavior,
billing behavior, and external contracts. Do not perform a repository-wide reorganization,
invent speculative abstractions, or rename files for subjective consistency alone.

Do not stage, commit, push, run full CI, edit plan files, or change generated artifacts. Return
`blocked` when the right structure depends on an unresolved product, ownership, or contract
decision.

## Converge

1. Audit folder placement, names, and file cohesion explicitly.
2. Apply every high-confidence fix.
3. Re-read the resulting diff and moved files once for broken references or newly exposed
   structural problems.
4. Finish only when no material scoped structural issue remains.

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
