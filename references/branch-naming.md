# Branch Naming

Git branch names for `forge-issue` delivery branches and `forge-build` plan feature branches.

## Format

```text
<prefix>/<LINEAR-ID>/<slug>
```

- **prefix** — `fix`, `feat`, `improve`, or `tech`
- **LINEAR-ID** — exact identifier from Linear, e.g. `AIR-7646`
- **slug** — short kebab-case description (usually 3–6 words)

Examples:

- `fix/AIR-7646/checkout-button-disabled`
- `feat/AIR-5949/algolia-slider-optimization`
- `improve/AIR-6012/home-layout-max-width`
- `tech/AIR-5500/migrate-ci-to-tsgo`

## Prefix selection

| Work kind | Prefix |
| --------- | ------ |
| Bug | `fix` |
| Small feature / feature plan | `feat` |
| Improvement | `improve` |
| Internal, infra, refactor-only, tooling | `tech` |

For `forge-issue`, derive from `issue_kind`. For `forge-build`, derive from PRD/plan intent or the
primary Linear issue type.

## forge-issue

During preflight, before implementation:

1. Resolve the Linear ID from the source; return `blocked` if none exists and the user cannot
   supply one.
2. Map prefix from `issue_kind`: `bug` → `fix`, `small_feature` → `feat`, `improvement` →
   `improve`; use `tech` only when the ticket is explicitly infra, tooling, or refactor-only.
3. Derive `slug` from the ticket title or scope — kebab-case, no Linear ID in the slug.
4. Create or check out `<prefix>/<LINEAR-ID>/<slug>` from the default branch when the current
   branch does not match.
5. Persist the branch name in the working contract and closeout output.

Cloud hosts may provision the workspace branch; the checked-out branch must still follow this
convention before the first push.

## forge-build

The plan **feature branch** must follow this format. Per-slice worktrees (`wt/<plan-slug>/<local-id>`)
are internal dispatch mechanics — do not rename those.

During preflight:

1. Use PRD `linear_issue` or the primary synced Linear ID from the plan index.
2. Use `plan_slug` as `slug` when it is already kebab-case; otherwise derive from the PRD title.
3. Default prefix `feat` for feature plans; use `fix`, `improve`, or `tech` when plan scope matches.
4. Return `blocked` when checked out on a branch that does not match without an explicit user
   override.

## Rules

- kebab-case slug only — no spaces, underscores, or extra slashes
- never invent a Linear ID
- keep the slug aligned with the PR title topic, not the full sentence
