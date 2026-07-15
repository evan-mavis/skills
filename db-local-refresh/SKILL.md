---
name: db-local-refresh
description: Refresh the local Airgoods PostgreSQL `stack` database from a local Render production export file. Use when the user wants a fresh prod-ish local database, has downloaded a Render DB export, or wants to update the previewctl local template database.
---

# Refresh Local PostgreSQL (`stack`)

## Quick start

Ask the user for the path to their downloaded Render export (usually a `.dir.tar.gz` from the Render dashboard). Resolve `SKILL_DIR` to the absolute directory containing this `SKILL.md`, then run the bundled [refresh script](scripts/refresh-airgoods-local.sh):

```bash
SKILL_DIR="<absolute db-local-refresh skill directory>"
bash "$SKILL_DIR/scripts/refresh-airgoods-local.sh" \
  --yes \
  --file "/absolute/path/to/export.dir.tar.gz"
```

This imports the local export into `stack`.

## Safety

- This is destructive for the local target database. By default, it drops and recreates local `stack`.
- Before running, tell the user active app connections to `stack` should be stopped.
- The script requires `--yes` so accidental restores fail closed.
- The script refuses non-local DSNs unless `--allow-remote-dsn` is explicitly passed.
- Never refresh production or a remote database unless the user explicitly asks and provides the DSN.

## Requirements

- A local Render export file. Download it from the Render dashboard (Postgres → Export → `.dir.tar.gz`).
- Run from inside an Airgoods repo checkout, or pass `--repo-root /absolute/path/to/airgoods`.
- Local PostgreSQL should be running.
- Default target DSN:

```text
postgresql://postgres:Paghf123-1@localhost:5500/stack
```

## Workflow

1. Ask the user for the absolute path to their local Render export file.
2. Confirm the file exists before running.
3. Confirm the user wants to destructively refresh local `stack`.
4. Warn them to stop active backend/app connections first.
5. Run:

```bash
SKILL_DIR="<absolute db-local-refresh skill directory>"
bash "$SKILL_DIR/scripts/refresh-airgoods-local.sh" \
  --yes \
  --file "/absolute/path/to/export.dir.tar.gz"
```

6. If local Postgres uses a different port, pass an explicit local DSN:

```bash
SKILL_DIR="<absolute db-local-refresh skill directory>"
bash "$SKILL_DIR/scripts/refresh-airgoods-local.sh" \
  --yes \
  --file "/absolute/path/to/export.dir.tar.gz" \
  --dsn "postgresql://postgres:Paghf123-1@localhost:5432/stack"
```

## Relationship to previewctl

Local previewctl envs clone from local `stack`:

```text
stack -> wt_<env>
```

After this skill refreshes `stack`, new local previewctl envs and reset local previewctl envs inherit the refreshed data.

## Direct import

The refresh script is a thin wrapper around the repo import script. You can also call it directly:

```bash
./scripts/import-pg-export.sh --file /absolute/path/to/export.dir.tar.gz --dsn "postgresql://postgres:Paghf123-1@localhost:5500/stack"
```

Do not assume a prior dump path is still correct — always ask the user for the current export path.
