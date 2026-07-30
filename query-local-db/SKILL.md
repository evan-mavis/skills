---
name: query-local-db
description: Query the PostgreSQL database used for Airgoods local development or an explicitly selected task-scoped isolated database. Use when the user asks to inspect local or active task data, run SQL, list tables, describe schema, validate records, or query PostgreSQL safely from any repo or worktree.
---

# Query Local or Task-Scoped PostgreSQL

## Quick start

Resolve `SKILL_DIR` to the absolute directory containing this `SKILL.md`, then use the bundled helper instead of typing connection details manually:

```bash
SKILL_DIR="<absolute query-local-db skill directory>"
bash "$SKILL_DIR/scripts/query-airgoods-local.sh" --show-source
bash "$SKILL_DIR/scripts/query-airgoods-local.sh" -c "select now()"
bash "$SKILL_DIR/scripts/query-airgoods-local.sh" -c "\dt public.*"
bash "$SKILL_DIR/scripts/query-airgoods-local.sh" --csv -c "select table_schema, table_name from information_schema.tables where table_schema not in ('pg_catalog', 'information_schema') and table_name ilike '%keyword%' order by table_schema, table_name"
bash "$SKILL_DIR/scripts/query-airgoods-local.sh" -c "\d public.some_table"
bash "$SKILL_DIR/scripts/query-airgoods-local.sh" -At -c "select count(*) from public.some_table"
bash "$SKILL_DIR/scripts/query-airgoods-local.sh" --csv -c "select * from public.some_table order by created_at desc limit 1"
bash "$SKILL_DIR/scripts/query-airgoods-local.sh" --csv -c "select id, name from public.some_table limit 20"
```

When run from an Airgoods repo, the helper automatically loads `apps/backend/.env.example` and overlays `apps/backend/.env.local` when present. It uses the same resolution order as `apps/backend/src/Database/data-source.ts`:

1. `DATABASE_URL` from backend env files when set
2. otherwise `DB_*_LOCAL` from backend env files

The helper prints the resolved connection source to stderr before each query and forces read-only mode.

## Task-scoped databases

For a caller-verified task database such as a Forge Build or Forge Issue Neon child, pass only the environment variable name—not its value:

```bash
bash "$SKILL_DIR/scripts/query-airgoods-local.sh" \
  --database-url-env DATABASE_URL \
  --csv -c "select id, name from public.some_table limit 20"
```

Use this option only when the caller supplied the variable name and already verified the isolated target. The caller must first load its protected task environment into the query process. Never infer task-database use merely because `DATABASE_URL` happens to exist in the shell.

## Workflow

1. Run `--show-source` first when the user asks where data is coming from.
2. Start with schema discovery before writing a targeted query.
3. Prefer read-only queries and keep result sets small with `limit`.
4. Use `-At` for a single value or machine-readable output.
5. Use `--csv` when the user wants rows in an easy-to-scan format.
6. Report the stderr source line in your answer, for example `neon-pooler database=neondb host=...`.
7. When a caller supplies `database_url_env`, invoke the helper with `--database-url-env <name>`. If that variable is absent or empty, stop; never fall back to another database.
8. If `psql` says the database is unavailable, stop and ask the user to start or verify the selected database instead of switching targets.

## Useful commands

```bash
SKILL_DIR="<absolute query-local-db skill directory>"

# verify resolved target
bash "$SKILL_DIR/scripts/query-airgoods-local.sh" --show-source

# list tables
bash "$SKILL_DIR/scripts/query-airgoods-local.sh" -c "\dt public.*"

# find likely tables by keyword
bash "$SKILL_DIR/scripts/query-airgoods-local.sh" --csv -c "
select table_schema, table_name
from information_schema.tables
where table_schema not in ('pg_catalog', 'information_schema')
  and table_name ilike '%placement%'
order by table_schema, table_name;
"

# describe a table
bash "$SKILL_DIR/scripts/query-airgoods-local.sh" -c "\d public.table_name"

# list columns with types
bash "$SKILL_DIR/scripts/query-airgoods-local.sh" --csv -c "
select column_name, data_type
from information_schema.columns
where table_schema = 'public' and table_name = 'table_name'
order by ordinal_position;
"

# sample rows
bash "$SKILL_DIR/scripts/query-airgoods-local.sh" --csv -c "
select *
from public.table_name
limit 20;
"

# newest row by created_at
bash "$SKILL_DIR/scripts/query-airgoods-local.sh" --csv -c "
select *
from public.table_name
order by created_at desc
limit 1;
"
```

## Connection behavior

Precedence:

1. `--database-url-env <name>` when the caller verified an isolated task database
2. `AIRGOODS_LOCAL_DATABASE_URL` when explicitly exported in the shell
3. Airgoods backend env files when run from a repo containing `apps/backend/.env.example`
   - loads `.env.example`, overlays `.env.local`
   - uses `DATABASE_URL` when set, otherwise `DB_*_LOCAL`
4. localhost Postgres defaults: `PGDATABASE=stack`, `PGHOST=localhost`, `PGPORT=5432`, `PGUSER=postgres`

Common resolved sources:

| Source label | Meaning |
|---|---|
| `neon-pooler` | Neon via `DATABASE_URL` in backend `.env.local` |
| `neon-direct` | Neon direct endpoint via `DATABASE_URL` |
| `local-docker` | previewctl/local Docker Postgres on port `5500` |
| `local-host` | local Postgres on `localhost:5432` |
| `task-env` | explicit `--database-url-env` target |
| `shell-override` | explicit `AIRGOODS_LOCAL_DATABASE_URL` |
| `localhost-default` | no Airgoods backend env files found |

Notes:

- The helper never reads shell `DATABASE_URL` implicitly.
- The helper never edits `.env`, `.env.local`, or shell configuration.
- Remote URLs such as Neon poolers use post-connect `SET default_transaction_read_only = ON` instead of startup `PGOPTIONS`, because poolers reject the startup parameter.
- Override `PGHOST`, `PGPORT`, `PGUSER`, or `PGPASSWORD` only for the localhost-default fallback path.
- The helper enables `ON_ERROR_STOP` so SQL and `psql` errors fail fast.

## Querying tips

- If the user gives a fuzzy noun like "placement" or "request", discover the real table name first with an `information_schema.tables` query.
- Some identifiers may need double quotes, especially reserved names like `"user"`.
- Prefer `order by created_at desc limit 1` for "latest" lookups, but confirm the timestamp column exists first.

## Safety

- Do not run `insert`, `update`, `delete`, `truncate`, `alter`, or migrations unless the user explicitly asks.
- Use the helper for default read-only work; it forces read-only mode for the session and fails fast on SQL errors.
- Treat an explicit task-database variable as authority only when its caller has already verified the isolated target. Do not use this option with an unknown or production connection.
- If the user explicitly asks for a write, it is okay to run a targeted write query instead of the read-only helper flow.
- For write requests, confirm the target rows first with a read query whenever practical and keep the change as narrow as possible.
- Do not expose database passwords in responses.
