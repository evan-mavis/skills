# pstack source history

This file records the original pstack source snapshot and its historical adaptations. The generated estack package uses Codex instructions directly; the source adaptation log below does not describe its current runtime. Estack adaptations are maintained as exact replacements under `scripts/estack/` in the skills repository.

## Snapshot

- Version: `0.15.5`
- Commit: [`ecc249f1e306fc64ddf83c7bed16cacf7c2239db`](https://github.com/cursor/plugins/commit/ecc249f1e306fc64ddf83c7bed16cacf7c2239db)
- Retrieved: 2026-09-27
- Compared against upstream main on 2026-10-01 at `2eb7ed4613cfc8f098dfe464a23680ea44d84c5e`. Its active skill and agent sources still match this snapshot.
- Sources: `pstack/` and `cursor-team-kit/skills/deslop/`

## Source adaptations

- Estack skills and playbooks target Codex. The shared source history remains in `pstack/UPSTREAM.md` in the skills repository.
- `skills/poteto-mode/SKILL.md` uses the lowercase skill name `poteto-mode`.
- PR titles and branch names follow the bundled personal defaults.
- `skills/deslop/` is vendored from the source snapshot and runs before commits.
- Estack packaging preserves the source license and adapts runtime tools through `scripts/estack/`.
