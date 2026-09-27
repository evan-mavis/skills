# Personal Engineering Skills

This repository is the source for a cross-tool engineering workflow built
around pstack, with personal and Airgoods-specific skills alongside it.

## Pstack

[`pstack/`](pstack/) is copied from the
[upstream Cursor pstack plugin](https://github.com/cursor/plugins/tree/main/pstack).
The imported snapshot is upstream version `0.15.5`, commit
[`ecc249f1e306fc64ddf83c7bed16cacf7c2239db`](https://github.com/cursor/plugins/commit/ecc249f1e306fc64ddf83c7bed16cacf7c2239db),
retrieved on 2026-09-27. Its internal directory structure and contents are
preserved as upstream.

The upstream skills are Cursor-oriented. Adaptations for Codex, Factory, and
personal workflows stay minimal so upstream refreshes remain easy. Keep
pstack's existing layout intact and document each adaptation here.

### Adaptations

- [`skills/poteto-mode/references/host-runtime.md`](pstack/skills/poteto-mode/references/host-runtime.md)
  (added) maps Cursor-only terms (`/loop`, `Task` subagent types, models,
  `AskQuestion`, control skills, transcript and skill paths, cloud agents,
  `/goal`) to Factory and Codex equivalents. Every subagent inherits the
  parent model. On Factory, Orchestrate and the two Autopilot playbooks
  become a Mission brief. On Codex, they run locally with worktree
  subagents. One line at the top of `poteto-mode/SKILL.md` routes to it, so
  the playbooks keep their upstream text.
- `skills/make-bot-ui/` and `automations/benny/` (removed) depended on Cursor
  Automations webhooks.
- [`skills/deslop/`](pstack/skills/deslop/) (added) is vendored unchanged from
  `cursor-team-kit/skills/deslop` at the same upstream commit, because
  poteto-mode requires it before every commit.
- `playbooks/opening-a-pr.md` **Titles** uses the personal
  `feat:`/`fix:`/`tech:`/`refactor:`/`maintenance:` convention with Linear
  issue ID suffixes instead of Conventional Commits, and adds a **Branches**
  rule.

## Personal skills

These skills are organized by domain and remain separate from upstream pstack:

- [`personal/planning/`](personal/planning/): `grill-me`, `to-linear-spec`
- [`personal/airgoods/`](personal/airgoods/): Airgoods database, verification,
  and local development skills, `close-release-issues` for Linear release
  closeout, and `babysit-airgoods-pr`, a thin adapter over pstack's Babysit
  playbook for Airgoods PRs

[`personal/AGENTS.md`](personal/AGENTS.md) holds host-neutral personal
defaults: per-task `poteto-mode` activation, verification, commit, branch, and
PR naming, PR template precedence, and Airgoods babysit routing.

## Cross-host policy

The installer must produce this state on Cursor, Codex, and Factory:

- pstack and every personal skill, including Airgoods skills, are installed
  user-wide on all three hosts.
- `personal/AGENTS.md` is each host's personal instructions: Codex
  `~/.codex/AGENTS.md`, Factory `~/.factory/AGENTS.md`, and Cursor an
  always-applied user rule in `~/.cursor/rules/`.
- On Factory and Codex, `poteto-mode` activates through that file, because
  Cursor's `mode` and `reminder` frontmatter have no equivalent there.
  Factory also hides skills marked `disable-model-invocation: true` (most of
  pstack) from the model, so the file tells the agent to read them from
  `~/.agents/skills/<name>/SKILL.md`.
- Skills from the former `ai-dev-workflow` plugin are removed from every host
  after a backup, since several collide with pstack by name or trigger.

## Deprecated

[`deprecated/ai-dev-workflow/`](deprecated/ai-dev-workflow/) contains the former
`ai-dev-workflow` plugin and its skills. It is retained for reference, not as
the active workflow. Its former install and sync scripts are archived in
[`deprecated/scripts/`](deprecated/scripts/) and should not be used for the
new pstack-based setup.

## Install

Run [`scripts/install.sh`](scripts/install.sh). It links every pstack and
personal skill into `~/.agents/skills`, which Cursor, Codex, and Factory all
read, links pstack's agents into `~/.cursor/agents`, and installs
`personal/AGENTS.md` as each host's personal instructions. It moves anything
it replaces to `~/.skills-backup/<timestamp>/`. `scripts/install.sh --check`
reports drift without changing anything.

Skill edits are live through the links. Rerun the installer after adding,
removing, or renaming a skill, or after editing `personal/AGENTS.md`, since
the Factory file and the Cursor rule are generated copies. Factory ignores a
symlinked `~/.factory/AGENTS.md`.

Every pstack role inherits the parent chat model. Factory and Codex have no
model config. On Cursor,
[`personal/cursor/pstack-models.mdc`](personal/cursor/pstack-models.mdc) sets
every role to `inherit-parent` so pstack's built-in Cursor defaults never
apply. Add a line there to pin a model on Cursor.
