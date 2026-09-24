---
name: query-local-db
description: Query the Airgoods local development or explicitly selected task PostgreSQL database read-only. Use for schema discovery, records, and local data checks; verify a Neon branch before treating it as the requested environment.
---

# Query Airgoods Development PostgreSQL

Use the bundled helper from the Airgoods repo or any worktree. It resolves the database, prints its source, and runs SQL read-only. Never paste a database URL or password into a command, tool output, or response.

```bash
SKILL_DIR="<absolute directory containing this SKILL.md>"
bash "$SKILL_DIR/scripts/query-airgoods-local.sh" --show-source
bash "$SKILL_DIR/scripts/query-airgoods-local.sh" --csv -c "select id, name from public.supplier order by id limit 10"
```

## Select and verify the target

The helper resolves connections in this order:

1. `--database-url-env NAME` for a caller-verified task database. The named variable must already be present in the query process; the helper never falls back if it is absent.
2. Explicit `AIRGOODS_LOCAL_DATABASE_URL` in the query process.
3. In an Airgoods repo, `apps/backend/.env.example`, then `.env`, then `.env.local`, with later files overriding earlier values. A nonempty `DATABASE_URL` wins over `DB_*_LOCAL` values. The backend itself loads `.env` and then `.env.local`; `.env.example` is only a helper fallback.
4. Localhost defaults only when no backend env files are found.

Run `--show-source` before a substantive query. Check the reported source, database, and host against the user's requested environment. A Neon URL identifies an endpoint and database, **not its branch name**; if the user named a branch, confirm the endpoint-to-branch mapping in Neon or trusted environment metadata. If the target is ambiguous or the connection fails, stop and clarify it. Do not silently switch to localhost, production, or a different Neon branch.

For an explicitly verified task-scoped database, pass the variable name, not its value:

```bash
bash "$SKILL_DIR/scripts/query-airgoods-local.sh" \
  --database-url-env DATABASE_URL \
  --csv -c "select id, name from public.supplier order by id limit 10"
```

The helper does not read shell `DATABASE_URL` implicitly. Use `--database-url-env` only for a caller-verified task target, or use the explicit `AIRGOODS_LOCAL_DATABASE_URL` override. Never infer that a shell variable points to the current app database.

## Discover before assuming a schema

Tables and columns vary by branch. Find the table, inspect columns, then write a bounded query:

```bash
bash "$SKILL_DIR/scripts/query-airgoods-local.sh" --csv -c "
select table_name
from information_schema.tables
where table_schema = 'public' and table_name ilike '%shipping%'
order by table_name limit 30"

bash "$SKILL_DIR/scripts/query-airgoods-local.sh" --csv -c "
select column_name, data_type
from information_schema.columns
where table_schema = 'public' and table_name = 'shipping_profile'
order by ordinal_position"
```

See [Airgoods schema examples](references/airgoods-schema-examples.md) when querying products, suppliers, shipping profiles, or their rate tiers. They are navigation examples from one development branch, not a stable schema contract. Use `\d public.table_name` for a table definition, `--csv` for rows, and `-At` for one machine-readable value. Limit result sets and avoid `select *` on large or sensitive tables.

## Safety and reporting

- The helper wraps remote URL queries in a read-only transaction; localhost queries use a read-only session setting. It never edits env files.
- Do not run writes, migrations, or schema changes through this read-only workflow. A user-requested write needs a separately scoped method and a target-row check.
- Report the selected source, database, and host, plus any limits of the query. Never report credentials.
- If `psql` cannot connect, stop at that target. A connection error is not permission to try another database.
