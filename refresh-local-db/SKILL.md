---
name: refresh-local-db
description: Refresh the PostgreSQL database used by the developer's local Airgoods application environment from a local Render production export. Use when the user wants fresh prod-ish data in their locally running app or has downloaded a Render DB export.
---

# Refresh the Developer's Local Application Database

This skill is for the database connected to the developer's local Airgoods application environment. It must follow the effective `apps/backend` database configuration; it is not primarily for refreshing previewctl's Docker template database.

## Quick start

Ask the user for the path to their downloaded Render export (usually a `.dir.tar.gz` from the Render dashboard). Resolve `SKILL_DIR` to the absolute directory containing this `SKILL.md`, then run the bundled [refresh script](scripts/refresh-airgoods-local.sh):

```bash
SKILL_DIR="<absolute refresh-local-db skill directory>"
bash "$SKILL_DIR/scripts/refresh-airgoods-local.sh" \
  --yes \
  --file "/absolute/path/to/export.dir.tar.gz"
```

This imports the local export into the database currently configured for the developer's locally running `apps/backend`.

## Safety

- This is destructive for the local target database. By default, it resolves the backend app's effective database and drops/recreates that database.
- Before running, tell the user active app connections to `stack` should be stopped.
- The script requires `--yes` so accidental restores fail closed.
- The script refuses non-local DSNs unless `--allow-remote-dsn` is explicitly passed.
- Never refresh production or a remote database unless the user explicitly asks and provides the DSN.

## Requirements

- A local Render export file or extracted directory dump. Download it from the Render dashboard (Postgres → Export → `.dir.tar.gz`).
- Run from inside an Airgoods repo checkout, or pass `--repo-root /absolute/path/to/airgoods`.
- Local PostgreSQL should be running.
- By default, the script loads `apps/backend/.env`, applies `.env.local` overrides, and follows the same database precedence as the backend:

  1. Non-empty `DATABASE_URL`.
  2. The `DB_*` group selected by `NODE_ENVIRONMENT`.

- Pass `--dsn` only when intentionally overriding the app's configured database.

## Workflow

1. Ask the user for the absolute path to their local Render export file.
2. Confirm the file exists before running.
3. Confirm the user wants to destructively refresh local `stack`.
4. Warn them to stop active backend/app connections first.
5. Run:

```bash
SKILL_DIR="<absolute refresh-local-db skill directory>"
bash "$SKILL_DIR/scripts/refresh-airgoods-local.sh" \
  --yes \
  --file "/absolute/path/to/export.dir.tar.gz"
```

6. The script prints the resolved target with its password redacted. Confirm it matches the backend app configuration shown in `apps/backend/.env` and `.env.local`.
7. To intentionally override the app target, pass an explicit local DSN:

```bash
SKILL_DIR="<absolute refresh-local-db skill directory>"
bash "$SKILL_DIR/scripts/refresh-airgoods-local.sh" \
  --yes \
  --file "/absolute/path/to/export.dir.tar.gz" \
  --dsn "postgresql://postgres:Paghf123-1@localhost:5432/stack"
```

## Relationship to previewctl

The Docker database on port 5500 is commonly used as the previewctl template. Local previewctl envs clone from its `stack` database:

```text
stack -> wt_<env>
```

Only restores targeting that Docker `stack` affect new or reset previewctl environments. That is a separate use case and must be explicitly requested. The default refresh target is always the database connected to the developer's local application environment through `apps/backend`.

## Direct import

The refresh script is a thin wrapper around the repo import script. You can also call it directly:

```bash
./scripts/import-pg-export.sh --file /absolute/path/to/export.dir.tar.gz --dsn "<effective local backend DSN>"
```

Do not assume a prior dump path is still correct — always ask the user for the current export path.
