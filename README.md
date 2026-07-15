# My Day-to-Day Skills ⚒️

## AI development workflow

Full diagram: [ai-dev-workflow/README.md](ai-dev-workflow/README.md)

### Human-invoked entry points

You invoke these in order:

`grill-me` → `to-prd` → `to-issues` → `to-linear` → `forge-build`

- **grill-me** — Resolve planning ambiguity through focused questions.
- **to-prd** — Turn approved context into the canonical local PRD.
- **to-issues** — Split the PRD into dependency-aware local implementation issues.
- **to-linear** — Sync the local plan and issue graph to Linear.
- **forge-build** — Choose `tasks` or `subagents`, resolve HITL gates, schedule isolated issue work, integrate one clean commit per issue, run final CI, open a draft PR, and keep it merge-ready.

Execution modes:

- **tasks** — Recommended in the Codex desktop app for substantial parallel issues. Each issue gets a visible task with a managed worktree; that task implements directly, spawns a fresh reviewer subagent, and returns one commit.
- **subagents** — Default in Cursor. Each issue gets an orchestrator-created Git worktree plus ephemeral implementation and reviewer subagents with automatic result joins.

### Agent-run inside `forge-build`

Once started, `forge-build` orchestrates these skills itself:

- **forge-issue** — Runs directly in an issue task or inside a spawned implementation subagent.
- **deslop** — Runs inline in the same issue checkout, and in the main feature workspace for PR fixes.
- **thermo-nuclear-code-quality-review** — Runs in fresh reviewers using the same issue worktree or integrated feature workspace.
- **run-ci** — Runs in the main `forge-build` agent after integration.
- **to-pr** — Runs in the main `forge-build` agent to create the draft PR.
- **babysit** — Runs in the main agent and spawns a fresh reviewer subagent after each PR fix.

## QA

- **auto-browser-qa** — Build and run a browser QA checklist, saving pass/fail results to a local artifact.
- **human-x-agent-qa** — Create and execute a human-plus-agent QA plan from branch diff and conversation context.

## Design

- **design-bake-off** — Generate multiple distinct page design variants with a dev-only live switcher.

## Database

- **db-local** — Query the local `stack` PostgreSQL database.
- **db-local-refresh** — Refresh local `stack` from a local Render production export.
- **db-prod-readonly** — Run read-only SQL against production Airgoods Postgres.

## Utility

- **handoff** — Compact the current conversation into a handoff doc for another agent.
