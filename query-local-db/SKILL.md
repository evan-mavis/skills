---
name: query-local-db
description: Query the local PostgreSQL `stack` database or an explicitly selected task-scoped isolated database through a verified environment-variable name. Use when the user asks to inspect local or active task data, run SQL, list tables, describe schema, validate records, or query PostgreSQL safely from any repo or worktree.
---

# Query Local or Task-Scoped PostgreSQL

## Quick start

Resolve `SKILL_DIR` to the absolute directory containing this `SKILL.md`, then use the bundled helper instead of typing connection details manually. This works from Codex, Cursor, any repository, and any worktree:

```bash
SKILL_DIR="<absolute query-local-db skill directory>"
bash "$SKILL_DIR/scripts/query-airgoods-local.sh" -c "select now()"
bash "$SKILL_DIR/scripts/query-airgoods-local.sh" -c "\dt public.*"
bash "$SKILL_DIR/scripts/query-airgoods-local.sh" --csv -c "select table_schema, table_name from information_schema.tables where table_schema not in ('pg_catalog', 'information_schema') and table_name ilike '%keyword%' order by table_schema, table_name"
bash "$SKILL_DIR/scripts/query-airgoods-local.sh" -c "\d public.some_table"
bash "$SKILL_DIR/scripts/query-airgoods-local.sh" -At -c "select count(*) from public.some_table"
bash "$SKILL_DIR/scripts/query-airgoods-local.sh" --csv -c "select * from public.some_table order by created_at desc limit 1"
bash "$SKILL_DIR/scripts/query-airgoods-local.sh" --csv -c "select id, name from public.some_table limit 20"
```

The helper defaults to the local PostgreSQL database `stack` and forces read-only mode for the session by default.

For a caller-verified task database such as a Forge Build or Forge Patch Neon child, pass only
the environment variable name—not its value:

```bash
bash "$SKILL_DIR/scripts/query-airgoods-local.sh" \
  --database-url-env DATABASE_URL \
  --csv -c "select id, name from public.some_table limit 20"
```

Use this option only when the caller supplied the variable name and already verified the
isolated target. The caller must first load its protected task environment into the query
process. Never infer task-database use merely because `DATABASE_URL` happens to exist.

## Workflow

1. Start with schema discovery before writing a targeted query.
2. Prefer read-only queries and keep result sets small with `limit`.
3. Use `-At` for a single value or machine-readable output.
4. Use `--csv` when the user wants rows in an easy-to-scan format.
5. When a caller supplies `database_url_env`, invoke the helper with
   `--database-url-env <name>`. If that variable is absent or empty, stop; never fall back to
   another database.
6. If `psql` says the database is unavailable, stop and ask the user to start or verify the
   selected database instead of switching targets.

## Useful commands

```bash
SKILL_DIR="<absolute query-local-db skill directory>"

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

- `--database-url-env <name>` has highest precedence and requires that exact variable to be set.
- Otherwise, if `AIRGOODS_LOCAL_DATABASE_URL` is set, the helper connects with that URL.
- Otherwise, it defaults to `PGDATABASE=stack`.
- It also defaults `PGHOST=localhost`, `PGPORT=5432`, and `PGUSER=postgres` when those values are unset.
- Override `PGHOST`, `PGPORT`, `PGUSER`, or `PGPASSWORD` in the shell if the local database uses non-default settings.
- The helper also enables `ON_ERROR_STOP` so SQL and `psql` errors fail fast instead of continuing.
- The helper never reads `DATABASE_URL` implicitly and never edits `.env`, `.env.local`, or shell
  configuration.

## Querying tips

- If the user gives a fuzzy noun like "placement" or "request", discover the real table name first with an `information_schema.tables` query.
- Some identifiers may need double quotes, especially reserved names like `"user"`.
- Prefer `order by created_at desc limit 1` for "latest" lookups, but confirm the timestamp column exists first.

## Safety

- Do not run `insert`, `update`, `delete`, `truncate`, `alter`, or migrations unless the user explicitly asks.
- Use the helper for default read-only work; it forces `default_transaction_read_only=on` for the `psql` session and fails fast on SQL errors.
- Treat an explicit task-database variable as authority only when its caller has already verified
  the isolated target. Do not use this option with an unknown or production connection.
- If the user explicitly asks for a write, it is okay to run a targeted write query instead of the read-only helper flow.
- For write requests, confirm the target rows first with a read query whenever practical and keep the change as narrow as possible.
- Do not expose database passwords in responses.
