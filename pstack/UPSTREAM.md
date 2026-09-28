# Upstream

This directory is copied from the [Cursor pstack plugin](https://github.com/cursor/plugins/tree/main/pstack), with a few adaptations so it also runs in Factory and Codex. Keep the upstream layout and record every adaptation here, so upstream syncs stay easy.

## Snapshot

- Version: `0.15.5`
- Commit: [`ecc249f1e306fc64ddf83c7bed16cacf7c2239db`](https://github.com/cursor/plugins/commit/ecc249f1e306fc64ddf83c7bed16cacf7c2239db)
- Retrieved: 2026-09-27
- Sources: `pstack/` and `cursor-team-kit/skills/deslop/`

## Adaptations

- `skills/poteto-mode/references/host-runtime.md` (added) maps Cursor-only terms (`/loop`, `Task` subagent types, models, `AskQuestion`, control skills, transcript and skill paths, cloud agents, `/goal`) to Factory, Codex, and Devin equivalents. Every subagent inherits the parent model. On Factory, Orchestrate and the two Autopilot playbooks become a Mission brief. On Codex and Devin, they run locally with worktree subagents.
- `skills/poteto-mode/SKILL.md` has one added line near the top that routes to `host-runtime.md` outside Cursor, so the playbooks keep their upstream text.
- `skills/poteto-mode/SKILL.md` frontmatter `name` is `poteto-mode` instead of `Poteto Mode`, because Factory requires lowercase hyphenated skill names.
- `skills/poteto-mode/playbooks/opening-a-pr.md` **Titles** uses the personal `feat:`/`fix:`/`tech:`/`refactor:`/`maintenance:` convention with Linear issue ID suffixes instead of Conventional Commits, and adds a **Branches** rule.
- `skills/deslop/` (added) is vendored unchanged from `cursor-team-kit/skills/deslop` at the snapshot commit, because poteto-mode requires it before every commit.
- `skills/make-bot-ui/` and `automations/benny/` (removed) depended on Cursor Automations webhooks. `README.md` drops their table row and automations section.
- `skills/setup-pstack/` is unchanged from upstream.
