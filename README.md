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
