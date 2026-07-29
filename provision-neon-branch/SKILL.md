---
name: provision-neon-branch
description: Provision, safely rebind, and clean up one short-lived Neon Postgres child branch containing raw Airgoods production-copy data for isolated development and verification. Use when an agent needs a freely mutable production-shaped database without writing to production, or must resume an interrupted task against its exact existing child branch from forge-patch, forge-build, Codex, Cursor, or Cursor Cloud. Uses the Neon CLI, returns branch metadata without exposing credentials, enforces expiration, and deletes the branch after use.
---

# Provision Neon Branch

Create one disposable, freely mutable child branch from the configured Airgoods Neon production-copy parent. Keep actual production read-only and keep connection credentials out of conversation and repository state.

Accept three operations:

- `provision` — create the branch, obtain its connection string, and point the caller's runtime at it.
- `rebind` — reconnect an interrupted caller to the exact previously provisioned branch and
  create a fresh protected runtime handoff without creating another branch.
- `cleanup` — delete the exact created branch and erase temporary credential state.

Read [Airgoods configuration](references/airgoods-configuration.md) and
[CLI lifecycle](references/cli-lifecycle.md) before any operation.

## Required configuration

Require:

- `NEON_API_KEY` as a runtime secret
- `NEON_PROJECT_ID`
- `NEON_PARENT_BRANCH_ID`
- Neon CLI version 2.14 or newer, exposed as `neon` or `neonctl`
- outbound HTTPS to the Neon API and Postgres connectivity to the branch endpoint
- a protected parent branch so Neon rotates role passwords for every child

Default `NEON_BRANCH_TTL_HOURS` to `24`. Accept an explicit shorter duration. Never create an unexpiring branch.

Do not treat the Airgoods production Postgres MCP as a branch-management or bulk-copy tool. It remains read-only evidence access; Neon owns disposable database lifecycle.

## Provision

1. Resolve a stable task key from the Linear identifier, git branch, or task slug.
2. Create a collision-resistant branch name:

   `patch-<task-key>-<short-random-id>`

3. Use Neon CLI help to confirm the installed command's current flags before mutation. Create a full-data child branch from the exact configured parent with an RFC 3339 expiration no later than 24 hours.
4. Wait until the branch and its primary compute are ready.
5. Retrieve the direct branch connection string using the CLI. Never print it, paste it into chat, store it in git, or place it in shell history.
6. Bind it to the repository's canonical database environment variable, usually `DATABASE_URL`,
   without exposing the value. For a multi-process or orchestrated caller such as `forge-build`,
   create a mode-0600 sourceable temporary environment file outside the repository and return
   only its path plus the variable name. A host-native task-scoped secret injection with
   equivalent isolation is also acceptable. Use a direct process export only when every
   database-dependent command runs in that same process environment. Never edit `.env`,
   `.env.local`, another dotenv file, or a shell profile.
7. Run a minimal connectivity check and verify that the connected branch ID or endpoint differs from the parent.
8. Return non-secret branch metadata to the caller.

The child contains raw production-copy data and may be freely mutated. Never run an application, migration, worker, or test against the parent connection string.

## Rebind

Require the caller's persisted non-secret `project_id`, `parent_branch_id`, `branch_id`,
`branch_name`, `expires_at`, and `database_url_env` from the original provision result. Treat
`branch_id` as the durable identity; never resolve a rebind by name, prefix, task key, or the
presence of an old temporary file.

1. Fetch the exact branch ID from the exact project.
2. Verify it is ready, unexpired, not root or default, and still a child of the exact configured
   parent. Require supplied name and expiration metadata to match Neon; never extend expiration
   during rebind.
3. Retrieve a fresh direct connection string for that child without printing or persisting it.
4. Create a new mode-0600 sourceable temporary environment file outside the repository or use an
   equivalent host-native task-scoped secret injection. Return only its path and the original
   `database_url_env`.
5. Run the minimal connectivity and identity check again. Require the active endpoint or branch
   to match the supplied child and differ from the parent.
6. Return the same non-secret branch metadata with `reused: true`.

If the exact branch is missing, expired, mismatched, or no longer safe, return `blocked`. Never
silently provision a replacement because the interrupted task may depend on mutations that
exist only in the original child.

## Raw-data guardrails

- Use the branch only for the assigned task.
- Do not enumerate, export, or transmit unrelated customer records.
- Do not include raw values in logs, screenshots, videos, patches, fixtures, or model-visible summaries.
- Before recording evidence, replace visible branch-only values with synthetic equivalents.
- Use unique child-branch role credentials returned by Neon.
- Prefer environment-scoped secrets and restricted egress. For hosted agents handling raw data, self-hosted Cursor Cloud is the safest option.

Return `blocked` if the parent cannot be identified exactly, the parent is unprotected, expiration cannot be set, credentials would be exposed, or the caller cannot prove the application uses the child.

## Cleanup

1. Resolve the exact project and child branch ID from the provision result. Never delete by a broad prefix or unresolved environment variable.
2. Stop application and worker connections when practical.
3. Delete the child with the Neon CLI.
4. Verify the branch no longer appears in the project.
5. Erase temporary connection files and unset task-scoped database variables when the host permits.
6. Report deletion explicitly.

The caller owns the lifecycle after a successful `provision` or `rebind` and must later invoke
`cleanup`. Orchestrated callers clean up after success, failure, or a blocked implementation.
Expiration is only a fallback for agent crashes or interrupted sessions.

Never delete, reset, rename, restore, or change the default status of the configured parent branch.

## Output

Do not return connection strings, passwords, or tokens.

```yaml
status: done | blocked
operation: provision | rebind | cleanup
project_id: <project-id>
parent_branch_id: <parent-id>
branch_id: <child-id-or-null>
branch_name: <child-name-or-null>
expires_at: <rfc3339-or-null>
database_url_env: <environment-variable-name-or-null>
temporary_env_file: <absolute-path-or-null>
reused: true | false | null
deleted: true | false
blocker: null | <specific blocker>
```
