# Neon Branch Lifecycle

Use this bundled procedure to provision and clean up one freely mutable, short-lived Neon child branch containing raw Airgoods production-copy data. Actual production remains read-only.

## Canonical Airgoods identity

```text
Project: Airgoods
Project ID: billowing-lab-64900636
Parent branch: production
Parent branch ID: br-old-mud-amx76cuc
Region: AWS us-east-1
Neon Postgres: 17
Source production Postgres: 15
```

Require environment configuration to match:

```text
NEON_PROJECT_ID=billowing-lab-64900636
NEON_PARENT_BRANCH_ID=br-old-mud-amx76cuc
NEON_BRANCH_TTL_HOURS=24
```

Before every provision operation, confirm through Neon that the project and parent IDs still resolve and that the parent is the root/default branch named `production`. Block on any mismatch; do not discover a replacement automatically.

The parent is a raw copy of production, not the actual production database. Do not refresh it, change project settings, protect or unprotect branches, configure integrations, or clean up unrelated branches.

## Required configuration

Require:

- `NEON_API_KEY` as a runtime secret;
- `NEON_PROJECT_ID` and `NEON_PARENT_BRANCH_ID`;
- Neon CLI 2.14 or newer, exposed as `neon` or `neonctl`;
- outbound HTTPS to the Neon API and Postgres connectivity to the branch endpoint;
- a protected parent branch so Neon rotates role passwords for every child.

Default `NEON_BRANCH_TTL_HOURS` to `24`; accept a shorter duration and never create an unexpiring branch. Block rather than changing an unprotected parent.

Do not use the production Postgres MCP for branch management or bulk copy. It remains read-only evidence access.

## CLI preflight

Neon CLI syntax evolves. Inspect the installed command's help before the first mutation and confirm support for:

- listing and getting branches in an explicit project;
- creating from an explicit parent with `expires_at`;
- retrieving a branch connection string;
- deleting an exact branch ID;
- machine-readable output where available.

Authenticate through `NEON_API_KEY`; do not place the key on a command line. Logical operations correspond to:

```text
neon branches get
neon branches create
neon connection-string
neon branches delete
```

Adapt exact flags from local help.

## Provision

1. Resolve a stable task key from the Linear identifier, git branch, or task slug.
2. Create a collision-resistant name: `patch-<task-key>-<short-random-id>`.
3. Calculate an RFC 3339 expiration no later than 24 hours ahead.
4. Create a full-data child from the exact configured parent using the explicit project and parent IDs.
5. Poll or re-read until the child and its primary compute are ready.
6. Retrieve the direct child connection string for the repository's expected database and role.
7. Disable shell tracing before handling the URL. Never print it, paste it into chat, store it in git, or place it in shell history.
8. Export it under the repository's canonical database variable, normally `DATABASE_URL`. If a file is unavoidable, create a mode-`0600` temporary file outside the repository and return only its path.
9. Run `select current_database(), now()` or an equivalent minimal connectivity check.
10. Prove that the connected branch ID or endpoint differs from the parent before starting any application, migration, worker, or test.

The child may be freely mutated for the assigned task.

## Raw-data guardrails

- Use the child only for the assigned task.
- Do not enumerate, export, or transmit unrelated customer records.
- Do not include raw values in logs, chat, screenshots, videos, patches, fixtures, or summaries.
- Before recording evidence, replace visible branch-only values with synthetic equivalents.
- Use the unique child role credentials returned by Neon.
- Prefer environment-scoped secrets and restricted egress.

Return `blocked` if the exact parent cannot be confirmed, the parent is unprotected, expiration cannot be set, credentials would be exposed, or the application cannot be proven to use the child.

## Cleanup

Run after success, failure, or a blocked implementation. Expiration is crash protection, not normal cleanup.

1. Resolve the exact project and child branch ID from the provision result.
2. Validate that the ID has Neon's branch-ID form, is not `NEON_PARENT_BRANCH_ID`, and belongs to the configured parent.
3. Stop application and worker connections when practical.
4. Delete the exact child ID with the explicit project ID.
5. Re-read the exact ID and require a not-found result.
6. Delete temporary connection files and unset task-scoped database variables when the host permits.

Never delete by name, glob, prefix, unresolved variable, or bulk cleanup. Never delete, reset, rename, restore, or change the default status of the parent.

## Non-secret result

Never return connection strings, passwords, or tokens.

```yaml
status: done | blocked
operation: provision | cleanup
project_id: <project-id>
parent_branch_id: <parent-id>
branch_id: <child-id-or-null>
branch_name: <child-name-or-null>
expires_at: <rfc3339-or-null>
database_url_env: <environment-variable-name-or-null>
temporary_env_file: <absolute-path-or-null>
deleted: true | false
blocker: null | <specific blocker>
```
