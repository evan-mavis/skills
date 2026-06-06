---
name: db-prod-readonly
description: Run read-only SQL queries against the production Airgoods PostgreSQL database using the readonly Render connection and `psql`. Use when the user asks to inspect production data, validate production records, check schema, or debug issues in the production `stack_anry` database without modifying data.
---

# Query Production PostgreSQL (airgoods readonly)

- Connection: use the environment variable `AIRGOODS_PROD_READONLY_DATABASE_URL` for the production readonly `psql` connection string.
- Recommended local setup: load `AIRGOODS_PROD_READONLY_DATABASE_URL` from `~/.config/airgoods/prod-readonly.env` via `~/.zshrc` instead of storing the secret in the repo or in this skill file.
- Use `psql "$AIRGOODS_PROD_READONLY_DATABASE_URL"` for all production database access unless the user explicitly asks otherwise.
- Prefer `psql "$AIRGOODS_PROD_READONLY_DATABASE_URL" -v ON_ERROR_STOP=1 -c "BEGIN READ ONLY; <SQL>; COMMIT;"` for one-off SQL queries.
- Use `-t -A` when concise, machine-friendly output is helpful.
- For schema inspection, use `\dt`, `\dn`, `\d table_name`, and `information_schema` queries.
- Helpful local shell wrappers:
  - `airgoods-prod-psql` opens `psql` against the production readonly database.
  - `airgoods-prod-readonly "SELECT ..."` runs a query inside `BEGIN READ ONLY; ... COMMIT;`.
  - `airgoods-prod-readonly-raw "SELECT ..."` does the same with `-t -A` for machine-friendly output.

## Safety Rules

- This skill is strictly read-only.
- Only run queries that are provably read-only.
- Allowed by default: `SELECT`, read-only `WITH` queries, `EXPLAIN`, `SHOW`, and `psql` schema/meta commands.
- Never run or suggest `CREATE`, `INSERT`, `UPDATE`, `DELETE`, `MERGE`, `UPSERT`, `ALTER`, `DROP`, `TRUNCATE`, `GRANT`, `REVOKE`, `COMMENT`, `VACUUM`, `REINDEX`, `ANALYZE`, `CALL`, `DO`, or any other mutating statement.
- Treat all production access as read-only by policy, even though the database profile is readonly. The skill should still refuse write-style requests and should not attempt them.
- If the user asks for any write, migration, backfill, schema change, or destructive operation, refuse and explain that this production skill only supports read-only access.
- If the user provides SQL directly, inspect it before running it and do not execute it unless it is clearly read-only.

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
- When investigating relationships, first inspect schema with `\d table_name` before guessing column names.
- For counts and quick exports, prefer `-t -A` and a delimiter like `-F $'\t'`.

## Examples

- List tables:
  `psql "$AIRGOODS_PROD_READONLY_DATABASE_URL" -c "\dt"`
- Describe a table:
  `psql "$AIRGOODS_PROD_READONLY_DATABASE_URL" -c "\d orders"`
- Run a read-only query:
  `psql "$AIRGOODS_PROD_READONLY_DATABASE_URL" -v ON_ERROR_STOP=1 -t -A -c "BEGIN READ ONLY; SELECT id, created_at FROM orders ORDER BY created_at DESC LIMIT 10; COMMIT;"`
- Find store users:
  `airgoods-prod-readonly-raw "SELECT s.id, s.name, u.email FROM store s LEFT JOIN \"user\" u ON u.store_id = s.id WHERE lower(s.name) = lower('Butterfield Market') ORDER BY u.email;"`

Use this skill when the user asks to query, inspect, or validate production data in the readonly Airgoods PostgreSQL database.
