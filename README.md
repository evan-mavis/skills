# skills

these are the skills i use to get work done with agents :)

i use an adapted version of [pstack](https://github.com/cursor/plugins/tree/main/pstack) so i can use it in cursor, factory, and codex, alongside a few skills of my own.

- [`pstack/`](pstack/) has the shared workflows and skills, with a few tweaks for each app.
- [`personal/`](personal/) has my planning and airgoods skills, plus my personal defaults.
- [`deprecated/`](deprecated/) has the old setup, kept around for reference.

## setup

```sh
./scripts/install.sh
```

the installer links the skills and sets up my personal instructions across all three apps. anything it replaces gets backed up to `~/.skills-backup/`.

skill edits are live through the links. rerun the installer after adding, removing, or renaming a skill, or changing the personal defaults.

```sh
./scripts/install.sh --check
```

checks whether the installed setup is in sync without changing anything.

## install as codex plugins

Install the skills through the `evan-skills` marketplace without adding files to your project:

```sh
codex plugin marketplace add evan-mavis/skills --ref main
codex plugin add pstack@evan-skills
codex plugin add evan-personal@evan-skills
codex plugin list --marketplace evan-skills
```

Restart the desktop app and open a new chat. Ask it to use `pstack:poteto-mode` or `evan-personal:babysit-airgoods-pr` and report the `SKILL.md` path it loaded.

The marketplace exposes two plugins:

- `pstack` loads the existing `pstack/skills` directory through its portable `plugin.json`. Its playbooks, scripts, and agent prompts stay in the package.
- `evan-personal` loads `personal/airgoods` and `personal/planning` through the supported `.codex-plugin/plugin.json` compatibility manifest. Multiple skill roots preserve the existing layout and relative references without generated copies.

The plugin install packages skills and supporting files. It does not apply `personal/AGENTS.md`, install Bun or CLI dependencies, or configure database credentials and connected services. Keep using the existing installer if you want its host instructions and live symlinks. Installing both ways can show duplicate skill entries.

To test a local checkout, replace the marketplace-add command with:

```sh
codex plugin marketplace add /absolute/path/to/skills
```

To update a Git marketplace, run `codex plugin marketplace upgrade evan-skills`, then rerun both `codex plugin add` commands and restart the app. After editing a local checkout, rerun both `codex plugin add` commands and restart the app. Codex loads an installed copy.

Cloud support needs a separate check. OpenAI documents local and Git marketplaces, but their availability varies by client. This package has been verified with the local Codex CLI and app server; installation on desktop does not establish availability in a Codex Cloud task. In a fresh cloud task, verify the two namespaced skills and their loaded paths before relying on the plugins. See [OpenAI's plugin packaging guide](https://developers.openai.com/plugins/build/plugins) for supported installation and distribution options.

Existing workflow requirements remain. Some Airgoods skills need repository-local skills, authenticated services, or local tools. `provision-neon-branch` already references a missing `personal/airgoods/references/host-surfaces.md`; packaging preserves that skill unchanged and does not repair the missing reference.
