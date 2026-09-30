# skills

these are the skills i use to get work done with agents :)

i use an adapted version of [pstack](https://github.com/cursor/plugins/tree/main/pstack) so i can use it in cursor, factory, and codex, alongside a few skills of my own.

- [`pstack/`](pstack/) has the shared workflows and skills, with a few tweaks for each app.
- [`personal/`](personal/) has my planning and airgoods skills, plus my personal defaults.
- [`estack/`](estack/) bundles both for Codex, with explicit Airgoods verification and personal babysitting policy. It is generated; edit the original skills or [`scripts/estack/`](scripts/estack/) and rebuild.
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

For the combined Codex workflow, install estack from the same marketplace:

A private account copy is also saved as [estack](https://chatgpt.com/plugins/plugins_6abd8639d7348191b31c1430745b5d94). Its identity and release are recorded in `scripts/estack/account.json` for updates.

```sh
codex plugin marketplace add evan-mavis/skills --ref main
codex plugin add estack@evan-skills
```

Invoke `@estack` where plugin mentions are available, or ask Codex to use `estack:estack`. The entry skill loads poteto-mode and the bundled personal defaults. Mention routing still needs verification in a fresh cloud task. The supplied avatar is used for both the plugin logo and composer icon.

The existing pstack and personal plugins remain available for independent use. Prefer one installation of each workflow to avoid duplicate skill entries.

## build estack

```sh
bun scripts/build-estack.mjs
bun scripts/build-estack.mjs --check
bun test scripts/build-estack.test.ts scripts/native-estack.test.ts
```

The build copies skills and resources into a self-contained package with real files, preserves executable scripts and pstack attribution, and applies exact replacements from the registries under `scripts/estack/`. It fails if a replacement no longer matches its source. The check reports missing, changed, or unexpected generated files without writing them. It does not install plugins or change host configuration.

Both `pstack/` and `personal/` remain the maintained sources and retain their other-host instructions. Codex-specific templates and adaptations live under `scripts/estack/`. Rebuild estack whenever those sources change, including personal defaults. Never edit generated files directly.

For a private account upload, archive the generated package outside the repository:

```sh
tar -czf /tmp/estack.tar.gz estack
```

Save or update that archive through Plugin Creator to make the private package available to the account. Account saving does not verify cloud invocation; test the entry skill in a fresh task after installing the private plugin.

## install the separate plugins

Install the skills through the `evan-skills` marketplace without adding files to your project:

```sh
codex plugin marketplace add evan-mavis/skills --ref main
codex plugin add pstack@evan-skills
codex plugin add evan-personal@evan-skills
codex plugin list --marketplace evan-skills
```

Restart the desktop app and open a new chat. Ask it to use `pstack:poteto-mode` or `evan-personal:babysit-airgoods-pr` and report the `SKILL.md` path it loaded.

The marketplace also exposes the two original plugins:

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
