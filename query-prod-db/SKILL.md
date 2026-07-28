---
name: query-prod-db
description: Run read-only SQL queries against the production Airgoods PostgreSQL database, preferring the Airgoods Postgres MCP server with readonly `psql` as a fallback. Use when inspecting production data, validating production records, checking schema, analyzing query plans or database health, exporting results, or debugging issues in the production `stack_anry` database without modifying data.
---

# Query Production PostgreSQL (airgoods readonly)

## Tool Selection

- Prefer the Airgoods Postgres MCP server for normal lookups, schema discovery, health checks, workload index analysis, and query-plan inspection.
- Use MCP `execute_sql` for read-only SQL, `list_schemas` and `list_objects` for discovery, `explain_query` for plans, and the specialized analysis tools when relevant.
- Use readonly `psql` when MCP is unavailable or when an interactive terminal session, `psql` meta-commands, custom output formatting, scripting, or large direct exports materially help.
- If using `psql`, connect with `AIRGOODS_PROD_READONLY_DATABASE_URL`. Load it from `~/.config/airgoods/prod-readonly.env` via `~/.zshrc`; never store the secret in the repo or skill.
- Run one-off `psql` queries with `psql "$AIRGOODS_PROD_READONLY_DATABASE_URL" -v ON_ERROR_STOP=1 -c "BEGIN READ ONLY; <SQL>; COMMIT;"`.
- Use `-t -A` for concise machine-readable output and `\copy` for direct CSV exports.
- Helpful local shell wrappers:
  - `airgoods-prod-psql` opens an interactive readonly session.
  - `airgoods-prod-readonly "SELECT ..."` runs a query inside `BEGIN READ ONLY; ... COMMIT;`.
  - `airgoods-prod-readonly-raw "SELECT ..."` does the same with `-t -A`.

## Safety Rules

- This skill is strictly read-only.
- Only run queries that are provably read-only.
- Allowed by default: `SELECT`, read-only `WITH` queries, `EXPLAIN`, `SHOW`, and `psql` schema/meta commands.
- Never run or suggest `CREATE`, `INSERT`, `UPDATE`, `DELETE`, `MERGE`, `UPSERT`, `ALTER`, `DROP`, `TRUNCATE`, `GRANT`, `REVOKE`, `COMMENT`, `VACUUM`, `REINDEX`, `ANALYZE`, `CALL`, `DO`, or any other mutating statement.
- Treat all production access as read-only by policy, even though the database profile is readonly. The skill should still refuse write-style requests and should not attempt them.
- If the user asks for any write, migration, backfill, schema change, or destructive operation, refuse and explain that this production skill only supports read-only access.
- If the user provides SQL directly, inspect it before running it and do not execute it unless it is clearly read-only.
- Never retrieve or expose credential fields such as password hashes, login tokens, or device tokens unless the user provides a specific legitimate need.

## Main Tables And Relations

- `store`: buyer-side business record. Common fields to inspect are `id`, `name`, `slug`, `status`, and timestamps.
- `user`: person record. Buyer users typically link through `user.store_id -> store.id`; supplier users typically link through `user.supplier_id -> supplier.id`.
- `supplier`: brand/vendor record. Common join path is `supplier.id`.
- `order_master`: core order table. Key foreign keys are `order_master.store_id -> store.id`, `order_master.user_id -> "user".id`, and `order_master.supplier_id -> supplier.id`.
- `conversation`: buyer/supplier thread table. Key foreign keys are `conversation.store_id -> store.id` and `conversation.supplier_id -> supplier.id`.
- `message`: conversation messages. Typical path is `message.conversation_id -> conversation.id`, then join conversation back to store and supplier.
- `address`: address records can belong to a user, store, or supplier via `address.user_id`, `address.store_id`, and `address.supplier_id`.

## Querying Tips

- Start with the smallest identifying table first, then join outward. Example: find a `store.id` from `store.name`, then join to `"user"` on `user.store_id`.
- In PostgreSQL, the table name `"user"` should usually be quoted because `user` is a reserved word.
- For name matching, check for punctuation and whitespace differences like curly apostrophes, trailing spaces, or alternate branding.
- Prefer `ILIKE` or `lower(name) = lower(...)` when exact casing is unreliable.
- When investigating relationships, inspect schema with MCP discovery tools or `information_schema` before guessing column names. With `psql`, use `\d table_name`.
- Select only the columns needed for the request, especially when tables contain credentials or personal data.
- Add a reasonable `LIMIT` while exploring potentially large result sets.
- For terminal counts and quick exports, prefer `-t -A` and a delimiter like `-F $'\t'`.

## Examples

- For routine lookup, call MCP `execute_sql` with:
  `SELECT id, email, created_at FROM "user" WHERE lower(email) = lower('person@example.com') LIMIT 10;`
- For schema discovery, call MCP `list_objects` for the `public` schema, then query `information_schema.columns` when column details are needed.
- For interactive inspection, run:
  `psql "$AIRGOODS_PROD_READONLY_DATABASE_URL"`
- For a direct CSV export, use readonly `psql` with:
  `\copy (SELECT id, created_at FROM order_master ORDER BY created_at DESC LIMIT 1000) TO '/tmp/orders.csv' CSV HEADER`
