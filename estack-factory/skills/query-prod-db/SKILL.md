---
name: "query-prod-db"
description: "Run strictly read-only queries against Airgoods production stack_anry through Render query_render_postgres. Use for production records, schema discovery, and debugging without modifying data."
---

# Query Airgoods production

## Verify the fixed Render target

Use Render's `query_render_postgres` as the sole production-query path. Pass these explicit arguments on every call:

- `workspaceId`: `tea-cga6ujpmbg58br3im8o0`.
- `postgresId`: `dpg-cfd106ta4996a972tqd0-a`.
- `sql`: clearly read-only SQL validated before execution.

The tool enforces a read-only transaction. Before substantive queries, run:

```sql
SELECT current_database() AS database,
       current_setting('transaction_read_only') AS read_only;
```

Require `database = stack_anry` and `read_only = on`. Both were verified through Render on October 1, 2026. If the tool is unavailable, fails, or returns a different target or mode, report the blocker and stop production querying. Never switch connection methods or database targets.

## Keep production access strictly read-only

Validate user-provided SQL before executing it. Run only clearly read-only `SELECT`, read-only `WITH`, `SHOW`, or plain `EXPLAIN` queries. Inspect every CTE, nested statement, and function call. A statement beginning with `SELECT` can still invoke a mutating function.

Never execute writes, schema changes, migrations, backfills, mutating functions, or statements that disable read-only protections. Do not issue transaction-control statements through the tool or use `EXPLAIN ANALYZE` on unverified SQL. Requests requiring mutations are outside this skill's scope. Do not attempt them even if the tool would reject them.

Select only necessary fields. Never retrieve or expose password hashes, credentials, login tokens, or device tokens without a specific legitimate need. Use bounded queries, normally `LIMIT 20` to `100`, and narrow identifying filters. Avoid `SELECT *` on customer tables.

## Discover the schema before querying

Read the [shared Airgoods schema reference](../query-local-db/references/airgoods-schema-examples.md) for verified joins, statuses, and bounded examples. It distinguishes production observations from development examples. Discover undocumented fields live rather than guessing:

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'order_detail'
ORDER BY ordinal_position
LIMIT 100;
```

Quote `public."user"`. Start with the smallest identifying table, then join outward. Match names with `ILIKE` or `lower(name)` when casing varies. Report the selected target, relevant limits, and findings without credentials or unnecessary personal data.
