# Agent instructions

## Repository purpose

This repository contains reusable skills and agent instructions for Cursor, Factory, Codex, and Devin. It also contains the installer that links those files into the host-specific directories.

This repository is not a deployable application. The executable code is limited to the installer, helper scripts, and the TypeScript tools under `pstack/skills/poteto-mode/scripts`.

## Repository layout

- `pstack/` contains the shared pstack plugin, its skills, playbooks, agents, documentation, and local adaptations.
- `personal/` contains personal instructions and Airgoods-specific skills. Treat these files as private workflow content.
- `deprecated/` contains archived workflows kept for reference. Do not edit it unless the task is an intentional migration.
- `scripts/install.sh` installs the managed skills and host instructions.

## Setup

Use Bash, Git, and Bun for the local checks. Run the installer from the repository root when you need to update the host installation:

```sh
./scripts/install.sh
```

The installer changes files under the home directory, can install Factory plugins, and backs up replaced files under `~/.skills-backup/`. Do not run it from an unattended task unless the task explicitly includes host installation.

To inspect installation drift without changing the host:

```sh
./scripts/install.sh --check
```

The TypeScript tools have their own package directory:

```sh
cd pstack/skills/poteto-mode/scripts
bun install --frozen-lockfile
```

## Validation

Run the checks that cover the files you changed:

```sh
cd pstack/skills/poteto-mode/scripts
bun run typecheck
bun test
```

For shell changes, run `bash -n` on every changed shell script. The installer is the highest-risk script because it writes outside the repository.

There is no repository-wide build command. Documentation-only and skill-only changes do not need a build, but they must preserve valid paths, commands, and skill frontmatter.

## Skill changes

Each active skill lives in a directory with a `SKILL.md` file. Keep the YAML frontmatter valid, including `name` and `description`. Keep references and scripts inside the skill directory unless a shared dependency is intentional.

When you add, remove, rename, or move a skill, run `./scripts/install.sh --check` after the change. Run the installer only when you intend to update the local host installation.

## Change workflow

1. Check `git status --short` before editing.
2. Read the target skill, its references, and the relevant host-runtime guidance before changing behavior.
3. Make the smallest change that satisfies the request.
4. Run the narrowest relevant validation from this file.
5. Inspect `git diff --check` and the final diff before reporting completion.

Do not commit secrets, tokens, credentials, generated host files, `node_modules`, or local logs. Do not weaken validation, delete tests, or change installer backup behavior to make a check pass.
