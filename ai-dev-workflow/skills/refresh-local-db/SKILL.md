---
name: refresh-local-db
description: Refresh the developer's local Airgoods application database from the personal Neon dev branch parent, or optionally from a local Render export.
---

# Refresh the Developer's Local Application Database

This skill refreshes the database connected to the developer's local Airgoods application environment.

The default path resets a personal persistent Neon dev branch from the Airgoods production-copy parent branch. That is much faster than downloading and importing a Render export, and it stays current with the automated Neon parent refresh workflow.

## Quick start

Resolve `SKILL_DIR` to the absolute directory containing this `SKILL.md`, then run:

```bash
SKILL_DIR="<absolute refresh-local-db skill directory>"
bash "$SKILL_DIR/scripts/refresh-airgoods-local.sh" --yes
```

This resets the configured Neon branch (default `evanmavis-local-dev`) from the production-copy parent and discards any mutations made on that branch.

## Personal Neon dev setup

Local app config should point at the personal Neon branch through `apps/backend/.env.local`:

```text
DATABASE_URL=<neon connection string>
```

Branch metadata for refresh lives in:

```text
~/.config/airgoods/local-dev-neon.env
```

Expected keys:

```text
NEON_PROJECT_ID=billowing-lab-64900636
NEON_PARENT_BRANCH_ID=br-old-mud-amx76cuc
NEON_LOCAL_DEV_BRANCH_NAME=evanmavis-local-dev
NEON_LOCAL_DEV_BRANCH_ID=<branch-id>
NEON_DB_NAME=neondb
```

The refresh script uses `neonctl branches reset <branch> --parent`. Authenticate once with `npx neonctl auth` or export `NEON_API_KEY`.

## Safety

- This is destructive for the target database branch. A Neon reset discards all changes made on the personal dev branch.
- Before running, stop active backend/app connections to the branch.
- The script requires `--yes` so accidental refreshes fail closed.
- Never reset the production parent branch itself. The script only resets the configured personal dev branch name.

## Requirements

- A configured personal Neon dev branch and `apps/backend/.env.local` with `DATABASE_URL`.
- `~/.config/airgoods/local-dev-neon.env` with project, parent, and branch metadata.
- Neon CLI auth via `NEON_API_KEY` or `neonctl auth`.
- Run from inside an Airgoods repo checkout, or pass `--repo-root /absolute/path/to/airgoods`.

## Workflow

1. Confirm the Neon parent refresh action has finished if you need the newest prod snapshot on the parent.
2. Warn the user to stop active backend/app connections first.
3. Run:

```bash
SKILL_DIR="<absolute refresh-local-db skill directory>"
bash "$SKILL_DIR/scripts/refresh-airgoods-local.sh" --yes
```

4. Restart local app processes after the reset completes.

## Legacy Render import

If you explicitly need to import a downloaded Render export into a local Postgres database instead, use the legacy path:

```bash
SKILL_DIR="<absolute refresh-local-db skill directory>"
bash "$SKILL_DIR/scripts/refresh-airgoods-local.sh" \
  --yes \
  --from-render-export \
  --file "/absolute/path/to/export.dir.tar.gz"
```

That path still resolves the target from `apps/backend/.env` and `.env.local`, and refuses non-local DSNs unless `--allow-remote-dsn` is passed.

## Relationship to previewctl

Previewctl local worktrees use their own `preview-local-*` Neon branches. This skill is for a developer's personal persistent local-dev branch and does not replace previewctl provisioning or cleanup.

The Docker database on port 5500 is a separate legacy/previewctl template path. Only use the Render import mode when you explicitly want to refresh that local Postgres target.

## Direct import

The legacy Render path is a thin wrapper around the repo import script:

```bash
./scripts/import-pg-export.sh --file /absolute/path/to/export.dir.tar.gz --dsn "<effective local backend DSN>"
```

Do not assume a prior dump path is still correct — always ask the user for the current export path when using the legacy mode.
