---
name: query-local-db
description: Query Airgoods Neon development branches read-only, including local development and verified cloud child branches. Use for schema discovery, records, and development data checks.
---

# Query Airgoods Development PostgreSQL

Development databases use Neon branches, including local development. Evan's default local branch is `evanmavis-local-dev`. Cloud agents use their own child branch resolved from verified current-run handoff metadata, not Evan's branch or the production parent.

The configured production parent is refreshed daily from a production dump by GitHub Actions. Development copies are generally current but can lag. A child can diverge through development changes and later production updates. Record the dump/snapshot timestamp when available separately from branch creation time. Never infer freshness from creation time or invent a timestamp.

## Select and verify the target

Prefer the Neon plugin. Resolve the intended project, branch ID, and database explicitly through trusted repo configuration and Neon project/branch/database inspection. For local development, resolve `evanmavis-local-dev` within that verified project. A familiar name, endpoint hostname, or plugin default is insufficient verification. Never omit `project_id`, `branch_id`, or `database_name` from a query tool call.

When the target is a persistent Factory Droid Computer, follow [setup-droid](../setup-droid/SKILL.md) only to validate its durable computer/repository binding and exact branch. Source its verified `database.env` on that computer for the fallback instead of the temporary handoff below. Require no expiration and never provision from this read-only skill. This target-specific rule takes precedence over the ephemeral cloud path.

In this host's ephemeral cloud session, use [setup-cloud-env](../setup-cloud-env/SKILL.md) to verify the current handoff's project, parent, child, endpoint, and expiration. A query-only request does not require servers or another branch. If provisioning is incomplete, wait for the existing operation. Missing, failed, expired, or inconsistent handoffs are blockers.

Keep this skill read-only even though a development branch can support separately authorized mutations. Validate user-provided SQL before execution. Reject writes, schema changes, migrations, backfills, mutating functions, and statements that disable read-only protections. Execute only clearly read-only SQL. Use Neon's `run_sql_transaction` with all three verified target arguments and these SQL statements in the same transaction:

```sql
SET TRANSACTION READ ONLY;
SELECT current_database() AS database,
       current_setting('transaction_read_only') AS read_only;
-- Add the validated, bounded read-only query as the next statement.
```

Require the verification result to match the intended database and return `read_only = on`. If the tool fails, retain the same verified target. Report the blocker or use the fallback below only after verifying its endpoint maps to that exact branch. Never switch to a default branch, parent, production, or localhost.

## Reusable WebSocket fallback

Use [the bundled helper](scripts/query-airgoods-local.sh), not an ad hoc query script. Run it from an Airgoods package with `@neondatabase/serverless` and `ws` already installed. It reads credentials from one explicitly named environment variable and requires the verified project ID, branch ID, endpoint host, and database. It never reads dotenv files or selects a fallback target. Endpoint-to-branch verification remains the caller's responsibility.

For cloud queries, confirm the credential handoff path against the current repo scripts, source the verified file and invoke the helper in the same Bash process with tracing off. Do not print the file or use `cloud-agent-run-with-db.sh` for queries, since that wrapper can remove backend dotenv overrides. Repeat sourcing in each fresh process. For local queries, load the verified branch credential through the existing trusted local configuration without printing it.

```bash
SKILL_DIR="<absolute directory containing this SKILL.md>"
set +x
# Cloud only, after verifying the current handoff.
source /tmp/airgoods-cloud-agent-neon.env
bash "$SKILL_DIR/scripts/query-airgoods-local.sh" \
  --database-url-env DATABASE_URL \
  --project-id '<verified-project-id>' --branch-id '<verified-branch-id>' \
  --expected-host '<verified-endpoint-host>' --expected-database '<verified-database>' \
  --show-source
```

Use the same arguments with `-c "select id, name from public.supplier order by id limit 10"` for a query. The helper uses a WebSocket connection, verifies the database and read-only transaction before executing SQL, sets a 15-second statement timeout, returns JSON rows, and rolls back. It accepts one `SELECT`; comments, multiple statements, and transaction/control/mutation keywords are rejected conservatively. This guard does not establish that an arbitrary function is read-only. Inspect unfamiliar functions before use. On failure, report the prerequisite or query problem without printing raw errors that may contain credentials or records. Never write another transport script or change targets to work around a failure.

## Discover before assuming a schema

Read [Airgoods schema examples](references/airgoods-schema-examples.md) for the shared verified joins and bounded examples. Tables and columns can differ across branches. Discover undocumented fields live in the selected branch before using them:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public' AND table_name ILIKE '%shipping%'
ORDER BY table_name LIMIT 30;

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'shipping_profile'
ORDER BY ordinal_position LIMIT 100;
```

Run these as separate validated queries through the selected method. Limit result sets and avoid `SELECT *` on large or sensitive tables. Exclude passwords, password hashes, tokens, credentials, and unnecessary personal/customer data. Report the verified project/branch/database, source/freshness evidence when available, and query limits. Never report connection URLs or secrets. User-requested mutations require a separately scoped workflow and are outside this skill.
