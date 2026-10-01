# skills

these are the skills i use to get work done with agents :)

built on lauren tan's [pstack](https://github.com/cursor/plugins/tree/main/pstack), with my personal defaults and airgoods workflows. [estack](estack/) brings them together for codex.

## install

install the private [estack plugin](https://chatgpt.com/plugins/plugins_6abd8639d7348191b31c1430745b5d94), or use the repo marketplace:

```sh
codex plugin marketplace add evan-mavis/skills --ref main
codex plugin add estack@evan-skills
```

## get started

use `@estack` at the start of a task. it loads poteto-mode, picks a playbook, and uses the other skills as needed.

```text
@estack reproduce this bug, fix it, and verify the result.
```

in an airgoods codex cloud session, use `@estack setup cloud`. it installs missing dependencies, reuses the per-run neon child or runs the repo bootstrap when none exists, starts the dev servers, and checks readiness. `query-local-db` uses the verified cloud handoff through its explicit task-database option. the cloud environment needs `NEON_API_KEY`, `NEON_PROJECT_ID`, and `NEON_PARENT_BRANCH_ID` secrets.

## what's here

- [pstack/](pstack/) has shared workflows for cursor, factory, codex, and devin.
- [personal/](personal/) has my defaults, planning, and airgoods skills.
- [estack/](estack/) is the combined codex plugin.
- [deprecated/](deprecated/) has archived workflows.

for the original host setup, run `./scripts/install.sh`. replaced files are backed up to `~/.skills-backup/`; `--check` reports drift.

## make it yours

edit `pstack/`, `personal/`, or [scripts/estack/](scripts/estack/), then rebuild:

```sh
bun scripts/build-estack.mjs
bun scripts/build-estack.mjs --check
```
