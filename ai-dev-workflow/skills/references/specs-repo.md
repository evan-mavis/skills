# Planning Store

Working plans live at `<app-repo>/specs/<slug>/` on the feature branch. `$forge-build` deletes
that directory when the plan is done. Optional remote archive = user-supplied Git URL; never
hardcode org/person defaults; never use env vars as the store.

## Layout

```
specs/<slug>/PRD.md
specs/<slug>/<slug>-index.md
specs/<slug>/issues/<nn>-<issue-slug>.md
```

Remote archive uses the same shape at repo root (`<slug>/…`). No `in-progress/` or `completed/`.
Never write under `<app-repo>/plans/`.

## Resolve

1. App repo root via `git rev-parse --show-toplevel`; store is always `<app-repo>/specs/`.
2. Use a user-supplied plan path under that tree when given.
3. If the slug is missing locally → ask for archive Git URL → [import](#import).
4. `blocked` if the app repo is unknown or import is required and declined.

A separate specs checkout is archive-only, not the working store.

## Import

Ask for HTTPS/SSH URL → clone to temp → copy `<slug>/` into `<app-repo>/specs/<slug>/` → work
only from the monorepo copy. `blocked` on clone/auth/missing slug.

## Archive (after `$to-slices` only)

After commit+push of the full plan, use the [Archive](decision-prompts.md#archive) prompt
(default Skip). On yes: ask for URL if needed, flat-copy, commit+push archive repo. Do not block
`$to-linear`. No archive prompt at forge closeout.

## Commits

| When | Git |
| ---- | --- |
| `$to-prd` | Write only — no commit |
| `$to-slices` (full plan) | Commit+push `specs/<slug>/` on feature branch, then archive ask |
| `$forge-build` updates | Commit+push on feature branch |
| `$forge-build` closeout | Delete `specs/<slug>/`, commit+push |
| Remote archive | Commit+push archive repo only after explicit yes |

Same prefixes as app repo (`feat:`, `patch:`, `tech:`, `refactor:`, `maintenance:`). Push with
upstream; report push failures.

## Canonical split

- **Full plan detail** → `specs/<slug>/` (including Implementation Notes; never sync those to Linear)
- **Code / PRs / branches** → application repo
- **Optional shelf** → remote archive URL
- **Linear** → optional compressed team view

## Legacy archive format

Remote archive copies may still use old stage folders or body-style metadata (`Completed: [x]`,
etc.). **Current template wins** for new work: YAML frontmatter + flat `issues/`
([issue template](../to-slices/references/issue-template.md)). When importing a legacy plan,
normalize to the current layout before `$forge-build` if practical; never invent scheduling from
stale body fields when frontmatter exists.
