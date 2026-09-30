# pstack source history

This file records the original pstack source snapshot and its historical adaptations. The generated estack package uses Codex instructions directly; the source adaptation log below does not describe its current runtime. Estack adaptations are maintained as exact replacements under `scripts/estack/` in the skills repository.

## Snapshot

- Version: `0.15.5`
- Commit: [`ecc249f1e306fc64ddf83c7bed16cacf7c2239db`](https://github.com/cursor/plugins/commit/ecc249f1e306fc64ddf83c7bed16cacf7c2239db)
- Retrieved: 2026-09-27
- Sources: `pstack/` and `cursor-team-kit/skills/deslop/`

## Original source adaptations

- The shared pstack source includes integrations for Cursor, Factory, Codex, and Devin. Estack skills and playbooks use Codex tools directly.
- `skills/poteto-mode/SKILL.md` frontmatter `name` is `poteto-mode` instead of `Poteto Mode`, because Factory requires lowercase hyphenated skill names.
- `skills/poteto-mode/playbooks/opening-a-pr.md` **Titles** uses the personal `feat:`/`fix:`/`tech:`/`refactor:`/`maintenance:` convention with Linear issue ID suffixes instead of Conventional Commits, and adds a **Branches** rule.
- `skills/deslop/` (added) is vendored unchanged from `cursor-team-kit/skills/deslop` at the snapshot commit, because poteto-mode requires it before every commit.
- `skills/make-bot-ui/` and `automations/benny/` (removed) depended on Cursor Automations webhooks. `README.md` drops their table row and automations section.
- `skills/setup-pstack/` is unchanged from upstream.
- `.devin-plugin/plugin.json` (added) lets Devin load pstack as a plugin in local and cloud sessions. Skills are served from the existing `skills/` directory; plugin subagents (`agents/`) are local-only in Devin, so they are not declared in the manifest.
