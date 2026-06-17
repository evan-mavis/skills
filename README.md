# Skills

Personal Cursor agent skills. Invoke with `/skill-name` in chat.

## AI dev workflow

Run in order for a full feature loop:

`grill-me` → `to-prd` → `to-issues` → `to-linear` → `forge-issue` → `deslop` → `thermo-nuclear-code-quality-review` → `merge-worktree` → `run-ci` → `to-pr` → `babysit`

- **grill-me** — Stress-test a plan by interviewing you until decisions are clear.
- **to-prd** — Turn conversation context into a local agent-facing PRD under `plans/in-progress/`.
- **to-issues** — Break a PRD into vertical implementation slices as local issue files.
- **to-linear** — Sync local plan and issue files to Linear with parent/sub-issue structure.
- **forge-issue** — Pick and implement the next unblocked local issue slice.
- **deslop** — Clean AI slop from uncommitted changes before review.
- **thermo-nuclear-code-quality-review** — Brutally strict maintainability and structure review of branch changes.
- **merge-worktree** — Merge a completed parallel worktree branch back into the feature branch.
- **run-ci** — Run local typecheck, lint, test, and format checks before opening a PR.
- **to-pr** — Create or update a GitHub PR using the repo template and title conventions.
- **babysit** — Triage PR comments, conflicts, and CI until merge-ready.

## QA

- **auto-browser-qa** — Build and run a browser QA checklist, saving pass/fail results to a local artifact.
- **human-x-agent-qa** — Create and execute a human-plus-agent QA plan from branch diff and conversation context.

## Design

- **design-bake-off** — Generate multiple distinct page design variants with a dev-only live switcher.

## Database

- **db-local** — Query the local `stack` PostgreSQL database.
- **db-local-restore** — Restore a Render Postgres dump into local `stack`.
- **db-prod-readonly** — Run read-only SQL against production Airgoods Postgres.

## Utility

- **handoff** — Compact the current conversation into a handoff doc for another agent.
