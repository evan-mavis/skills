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

The tracked skills are capability-based and supported in both Codex and Cursor. `forge-build tasks` is intentionally Codex-only because it requires Codex-managed task worktrees; Cursor automatically uses `forge-build subagents`. Browser evidence uses each host's native browser automation, and demo/QA publishing prefers Sites when available or another configured private static-site integration otherwise.

## AI development workflow

Full diagram: [ai-dev-workflow/README.md](ai-dev-workflow/README.md)

### Human-invoked entry points

You invoke these in order:

`grill-me` → `to-prd` → `to-issues` → `to-linear` → `forge-build`

- **grill-me** — Resolve planning ambiguity through focused questions.
- **to-prd** — Turn approved context into the canonical local PRD.
- **to-issues** — Split the PRD into dependency-aware local implementation issues.
- **to-linear** — Sync the local plan and issue graph to Linear.
- **forge-build** — Choose `tasks` or `subagents` plus optional QA/demo PR evidence, resolve HITL gates, integrate issue work, repair final CI and QA failures, add evidence links to a draft PR, and keep it merge-ready.

Execution modes:

- **tasks** — Recommended in the Codex desktop app for substantial parallel issues. Each issue gets a visible task with a managed worktree; that task implements directly, spawns a fresh reviewer subagent, and returns one commit. Every spawned task stays unarchived for later inspection.
- **subagents** — Default in Cursor. Each issue gets an orchestrator-created Git worktree plus ephemeral implementation and reviewer subagents with automatic result joins.

### Agent-run inside `forge-build`

Once started, `forge-build` orchestrates these skills itself:

- **forge-issue** — Runs directly in an issue task or inside a spawned implementation subagent.
- **deslop** — Runs inline in the same issue checkout, and in the main feature workspace for PR fixes.
- **thermo-nuclear-code-quality-review** — Runs in fresh reviewers using the same issue worktree or integrated feature workspace.
- **run-ci** — Runs in the main `forge-build` agent after integration.
- **feature-qa-site** — Runs in a fresh subagent after CI when selected, publishes video-backed QA evidence, and gates acceptance-blocking findings.
- **feature-demo-site** — Runs in a separate fresh subagent after QA when selected and publishes the final walkthrough.
- **to-pr** — Runs in the main `forge-build` agent to create the draft PR with selected evidence links.
- **babysit** — Runs in the main agent and spawns a fresh reviewer subagent after each PR fix.

## Design

- **design-bake-off** — Generate multiple distinct page design variants with a dev-only live switcher.

## Database

- **db-local** — Query the local `stack` PostgreSQL database.
- **db-local-refresh** — Refresh local `stack` from a local Render production export.
- **db-prod-readonly** — Run read-only SQL against production Airgoods Postgres.

## Utility

- **handoff** — Compact the current conversation into a handoff doc for another agent.
