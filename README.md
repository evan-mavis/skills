# My Day-to-Day Skills ⚒️

## Source of truth and installation

This repository is the canonical source for these personal skills. Edit skills here first; treat `${CODEX_HOME:-$HOME/.codex}/skills` as the installed mirror. System and plugin-provided skills are managed separately and are not copied into this repository.

Install or resync every tracked skill into both Codex and Cursor:

```bash
./scripts/sync-skills.sh
```

Check for drift without changing files:

```bash
./scripts/sync-skills.sh --check
```

The script preserves unrelated skills in `${CODEX_HOME:-$HOME/.codex}/skills`, where Codex plugins and other personal skills may coexist. It treats `~/.cursor/skills` as an exact mirror, moving extra Cursor skill folders to Trash. Cursor-managed built-ins under `~/.cursor/skills-cursor` are untouched. Override either destination with `CODEX_SKILLS_DIR` or `CURSOR_SKILLS_DIR`.

### Host compatibility

The tracked skills are capability-based and supported in Codex, Cursor, and Cursor Cloud.
`forge-build tasks` is intentionally Codex-only because it requires Codex-managed task worktrees;
Cursor automatically uses `forge-build subagents`. `forge-patch` orchestrates one scoped change
through `forge-issue`, cleanup, review, verification, evidence, a draft PR, and babysitting;
`forge-build` orchestrates dependency-ordered plans through the same standalone capabilities.
Both orchestrators expose a structured none/local/Neon database choice and delegate disposable
Neon provision, resume rebind, and cleanup work to `provision-neon-branch`, which remains
directly callable. They bind the
selected database through process-scoped secret handoffs, verify its identity at process
boundaries, and never edit dotenv files or shell profiles for task database selection. Browser
evidence inside either orchestrator and manual QA inside `forge-build` use each host's best
native browser capability.

## AI development workflow

Full diagram: [ai-dev-workflow/README.md](ai-dev-workflow/README.md)

### Lightweight patches

- **forge-patch** — Orchestrate one bug or improvement from supplied context through isolated
  implementation, a structured none/local/Neon database choice, focused review, verification,
  video or text evidence, and a merge-ready draft PR.
- **forge-issue** — Implement one explicit scoped change inside an isolated checkout and leave
  the diff uncommitted.
- **provision-neon-branch** — Create, safely reconnect, and clean up a short-lived
  raw-production child branch directly.

### Human-invoked entry points

You invoke these in order:

`grill-me` → `to-prd` → `to-issues` → `to-linear` → `forge-build`

- **grill-me** — Resolve planning ambiguity through focused questions.
- **to-prd** — Turn approved context into the canonical local PRD.
- **to-issues** — Split the PRD into dependency-aware local implementation issues.
- **to-linear** — Sync the local plan and issue graph to Linear.
- **forge-build** — Choose `tasks` or `subagents`, resolve HITL gates, integrate issue work, repair
  verification failures, ask which isolated database and none/light/heavy browser-QA profiles to
  use, generate host-native video or text evidence when appropriate, and keep one draft PR
  merge-ready.

Execution modes:

- **tasks** — Recommended in the Codex desktop app for substantial parallel issues. Each issue
  gets a visible orchestration task with a managed worktree; that task sequentially spawns fresh
  `forge-issue`, `deslop`, `refactor-structure`, and thermo-review subagents, then returns one
  commit. Every spawned task stays unarchived for later inspection.
- **subagents** — Default in Cursor. Each issue gets an orchestrator-created Git worktree where
  the main task runs the same four fresh capability subagents sequentially with automatic result
  joins.

### Standalone capabilities

Each capability below is directly callable. `forge-patch` and `forge-build` compose the core
implementation and delivery capabilities:

- **forge-issue** — Implement one scoped change and leave an uncommitted diff.
- **deslop** — Remove mechanical AI slop from a scoped uncommitted diff.
- **refactor-structure** — Improve folder grouping, file and folder naming, and file cohesion.
- **thermo-nuclear-code-quality-review** — Independently fix architectural and control-flow
  problems.
- **run-ci** — Run relevant local CI-equivalent checks without changing code.
- **to-pr** — Prepare, create, or update one PR with supplied evidence.
- **babysit** — Keep an existing PR clean and green without merging.

Implementation and delivery capabilities pass one canonical `change_contract` containing
`source`, `scope`, `exclusions`, `review_base`, and `changed_files`. Mutating skills update only
the file manifest; non-mutating skills preserve the contract.

## Design

- **design-bake-off** — Generate multiple distinct page design variants with a dev-only live switcher.

## Database

- **query-local-db** — Query local `stack` or an explicitly verified task-scoped PostgreSQL
  database without selecting a remote target implicitly.
- **refresh-local-db** — Refresh the database used by the local Airgoods app from a Render production export.
- **query-prod-db** — Run read-only SQL against production Airgoods Postgres through MCP or `psql`.

## Utility

- **handoff** — Compact the current conversation into a handoff doc for another agent.
- **write-like-evan** — Draft or rewrite Slack messages, emails, and updates in Evan's natural voice.
