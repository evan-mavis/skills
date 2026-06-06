---
name: db-local
description: Query a local PostgreSQL database named `stack`. Use when the user asks to inspect local data, run SQL, list tables, describe schema, validate records, or query the local `stack` database from any repo or worktree.
---

# Query Local PostgreSQL (`stack`)

## Quick start

Use the shared helper from the repository root instead of typing connection details manually:

```bash
REPO_ROOT="$(git rev-parse --show-toplevel)"
bash "$REPO_ROOT/.agents/skills/db-local/scripts/query-airgoods-local.sh" -c "select now()"
bash "$REPO_ROOT/.agents/skills/db-local/scripts/query-airgoods-local.sh" -c "\dt public.*"
bash "$REPO_ROOT/.agents/skills/db-local/scripts/query-airgoods-local.sh" --csv -c "select table_schema, table_name from information_schema.tables where table_schema not in ('pg_catalog', 'information_schema') and table_name ilike '%keyword%' order by table_schema, table_name"
bash "$REPO_ROOT/.agents/skills/db-local/scripts/query-airgoods-local.sh" -c "\d public.some_table"
bash "$REPO_ROOT/.agents/skills/db-local/scripts/query-airgoods-local.sh" -At -c "select count(*) from public.some_table"
bash "$REPO_ROOT/.agents/skills/db-local/scripts/query-airgoods-local.sh" --csv -c "select * from public.some_table order by created_at desc limit 1"
bash "$REPO_ROOT/.agents/skills/db-local/scripts/query-airgoods-local.sh" --csv -c "select id, name from public.some_table limit 20"
```

The helper defaults to the local PostgreSQL database `stack` and forces read-only mode for the session by default.

## Workflow

1. Start with schema discovery before writing a targeted query.
2. Prefer read-only queries and keep result sets small with `limit`.
3. Use `-At` for a single value or machine-readable output.
4. Use `--csv` when the user wants rows in an easy-to-scan format.
5. If `psql` says the database is unavailable, stop and ask the user to start or verify the local database instead of switching to a remote environment.

## Useful commands

```bash
REPO_ROOT="$(git rev-parse --show-toplevel)"

# list tables
bash "$REPO_ROOT/.agents/skills/db-local/scripts/query-airgoods-local.sh" -c "\dt public.*"

# find likely tables by keyword
bash "$REPO_ROOT/.agents/skills/db-local/scripts/query-airgoods-local.sh" --csv -c "
select table_schema, table_name
from information_schema.tables
where table_schema not in ('pg_catalog', 'information_schema')
  and table_name ilike '%placement%'
order by table_schema, table_name;
"

# describe a table
bash "$REPO_ROOT/.agents/skills/db-local/scripts/query-airgoods-local.sh" -c "\d public.table_name"

# list columns with types
bash "$REPO_ROOT/.agents/skills/db-local/scripts/query-airgoods-local.sh" --csv -c "
select column_name, data_type
from information_schema.columns
where table_schema = 'public' and table_name = 'table_name'
order by ordinal_position;
"

# sample rows
bash "$REPO_ROOT/.agents/skills/db-local/scripts/query-airgoods-local.sh" --csv -c "
select *
from public.table_name
limit 20;
"

# newest row by created_at
bash "$REPO_ROOT/.agents/skills/db-local/scripts/query-airgoods-local.sh" --csv -c "
select *
from public.table_name
order by created_at desc
limit 1;
"
```

## Connection behavior

- If `AIRGOODS_LOCAL_DATABASE_URL` is set, the helper connects with that URL.
- Otherwise it defaults to `PGDATABASE=stack`.
- It also defaults `PGHOST=localhost`, `PGPORT=5432`, and `PGUSER=postgres` when those values are unset.
- Override `PGHOST`, `PGPORT`, `PGUSER`, or `PGPASSWORD` in the shell if the local database uses non-default settings.
- The helper also enables `ON_ERROR_STOP` so SQL and `psql` errors fail fast instead of continuing.

## Querying tips

- If the user gives a fuzzy noun like "placement" or "request", discover the real table name first with an `information_schema.tables` query.
- Some identifiers may need double quotes, especially reserved names like `"user"`.
- Prefer `order by created_at desc limit 1` for "latest" lookups, but confirm the timestamp column exists first.

## Safety

- Do not run `insert`, `update`, `delete`, `truncate`, `alter`, or migrations unless the user explicitly asks.
- Use the helper for default read-only work; it forces `default_transaction_read_only=on` for the `psql` session and fails fast on SQL errors.
- If the user explicitly asks for a write, it is okay to run a targeted write query instead of the read-only helper flow.
- For write requests, confirm the target rows first with a read query whenever practical and keep the change as narrow as possible.
- Do not expose database passwords in responses.
