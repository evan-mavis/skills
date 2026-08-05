---
name: provision-neon-branch
description: Provision, adopt, safely rebind, rename, and clean up one short-lived Neon Postgres child branch containing raw Airgoods production-copy data for isolated development and verification. Use when an agent needs a freely mutable production-shaped database without writing to production, or must resume an interrupted task against its exact existing child branch from forge-issue, forge-build, Cursor Cloud Agent startup, or other orchestrators. Uses the Neon CLI/API, returns branch metadata without exposing credentials, enforces expiration, and deletes the branch after use.
---

# Provision Neon Branch

Create or adopt one disposable, freely mutable child branch from the configured Airgoods Neon
production-copy parent. Keep actual production read-only and keep connection credentials out of
conversation and repository state.

Accept four operations:

- `provision` — create a new branch **or** adopt the Cloud Agent startup branch when present,
  obtain/reuse its connection handoff, optionally rename to the Linear-first convention, and
  point the caller's runtime at it.
- `rebind` — reconnect an interrupted caller to the exact previously provisioned or adopted
  branch and create a fresh protected runtime handoff without creating another branch.
- `rename` — rename an already-bound child to the Linear-first convention once the Linear id is
  known; keep the same `branch_id` and existing DATABASE_URL handoff.
- `cleanup` — delete the exact created/adopted branch and erase temporary credential state.

Read [Airgoods configuration](references/airgoods-configuration.md) and
[CLI lifecycle](references/cli-lifecycle.md) before any operation.

## Required configuration

Require:

- `NEON_API_KEY` as a runtime secret
- `NEON_PROJECT_ID`
- `NEON_PARENT_BRANCH_ID`
- Neon CLI version 2.14 or newer, exposed as `neon` or `neonctl` (API `curl`+`jq` is acceptable
  for rename/adopt when CLI flags are unclear)
- outbound HTTPS to the Neon API and Postgres connectivity to the branch endpoint
- a protected parent branch so Neon rotates role passwords for every child

Default `NEON_BRANCH_TTL_HOURS` to `24`. Accept an explicit shorter duration. Cursor Cloud Agent
`start` currently defaults to `8` via the repo bootstrap script. Never create an unexpiring branch.

Do not treat the Airgoods production Postgres MCP as a branch-management or bulk-copy tool. It
remains read-only evidence access; Neon owns disposable database lifecycle.

## Branch naming

Resolve components:

- **linearId** — prefer `NEON_LINEAR_ISSUE_ID` or `LINEAR_ISSUE_ID`, else extract `air-<digits>`
  from the git branch or task slug. Sanitize to lowercase `air-1234`.
- **env** — `cloud` for hosted/remote agent execution; `local` for developer-machine or CLI runs.
  Accept `NEON_AGENT_ENV` when the host is ambiguous.
- **user** — lowercase sanitized `$USER`. Accept `NEON_BRANCH_USER` when the runtime user is not
  meaningful.
- **taskKey** — short slug for the work (git branch slug, task key, or `work`). Strip a leading
  or embedded Linear id so it is not duplicated. Never use the Linear id alone as `taskKey`.
- **shortId** — four lowercase alphanumeric characters. Use **only** when no Linear id is known.

Preferred name when Linear is known (no random short-id):

```text
agent-<linearId>-<env>-<user>-<taskKey>
```

Example: `agent-air-7688-cloud-evan-fix-variant-rename`

Fallback when Linear is unknown:

```text
agent-adhoc-<env>-<user>-<taskKey>-<shortId>
```

Sanitize every component to lowercase `[a-z0-9-]` with single hyphens. Keep the `agent-` prefix so
these branches stay separate from previewctl namespaces (`preview-local-*`, `preview-*`). Cap the
full name at ~100 characters.

Durable identity is always `branch_id`, never the display name.

## Cloud Agent adopt (before create)

On Cloud Agent hosts — and whenever the standard handoff paths exist — **before** creating a new
branch during `provision`:

1. Read non-secret metadata from
   `/tmp/airgoods-cloud-agent-neon.env.meta.json`
   (override with `AIRGOODS_CLOUD_NEON_META_FILE` / sibling of `AIRGOODS_CLOUD_NEON_ENV_FILE`).
2. If the file is missing, empty, or lacks `branch_id`, fall through to create.
3. Fetch that exact `branch_id` in `NEON_PROJECT_ID`. Verify it is ready, unexpired, not
   root/default, still a child of `NEON_PARENT_BRANCH_ID`, and not a previewctl namespace.
4. If the existing `branch_name` does not match the Linear-first convention for the current
   task, **rename** the Neon branch (CLI or `PATCH …/branches/{branch_id}`) to the correct name.
   Keep the same `branch_id`. Update the meta file's `branch_name` only — do not rewrite secrets
   unless the env handoff is missing.
5. Prefer the existing mode-0600 handoff at
   `/tmp/airgoods-cloud-agent-neon.env` when present and loadable. Only mint a fresh mode-0600
   temp handoff outside the repo when that file is missing or unusable.
6. Run the minimal connectivity and identity check. Return non-secret metadata with
   `reused: true` and `operation: provision` (adopt path).

**Never create a second live agent branch for the same Cloud Agent run.** One forge run / one
agent boot → one `branch_id`.

Airgoods Cloud Agent `start` (`.cursor/environment.json` →
`.cursor/scripts/cloud-agent-start.sh`) may already have provisioned the child and written the
handoff before any skill runs. Treat that as the canonical branch for the run.

## Provision

1. Resolve the target branch name per [Branch naming](#branch-naming).
2. Attempt [Cloud Agent adopt](#cloud-agent-adopt-before-create). On success, stop — do not create.
3. Use Neon CLI help (or API) to confirm current create flags. Create a full-data child from the
   exact configured parent with an RFC 3339 expiration no later than 24 hours.
4. Wait until the branch and its primary compute are ready.
5. Retrieve the direct branch connection string for `NEON_DB_NAME` (default `neondb`) using the
   CLI/API. Never print it, paste it into chat, store it in git, or place it in shell history.
6. Bind it to the repository's canonical database environment variable, usually `DATABASE_URL`,
   without exposing the value:
   - Prefer the standard Cloud Agent handoff path when on that host
     (`/tmp/airgoods-cloud-agent-neon.env` + `.meta.json`).
   - Otherwise create a mode-0600 sourceable temporary environment file **outside the
     repository** and return only its path plus the variable name.
   - A session-scoped secret injection with equivalent isolation is also acceptable.
   - Use a direct process export only when every database-dependent command runs in that same
     process environment.
   - **Never** edit `.env`, `.env.local`, another dotenv file, or a shell profile.
7. Run a minimal connectivity check and verify that the connected branch ID or endpoint differs
   from the parent.
8. Write/update non-secret `.meta.json` beside the handoff when using the Cloud Agent paths.
9. Return non-secret branch metadata to the caller with `reused: false`.

For local worktree dev that needs Redis, ports, and generated `.env.local` files, use the repo's
`provision-local-worktree-environment` skill instead. Never delete or reuse previewctl-owned
branches during agent cleanup.

The child contains raw production-copy data and may be freely mutated. Never run an application,
migration, worker, or test against the parent connection string.

## Rename

Use when a branch is already bound (adopted or provisioned) and the Linear id becomes known, or
the current name does not match [Branch naming](#branch-naming).

1. Require exact `project_id` and `branch_id` (from meta file, provision result, or caller state).
2. Compute the correct Linear-first name.
3. If Neon's current name already matches, return success with `reused: true` and no mutation.
4. Otherwise rename via Neon CLI or
   `PATCH /projects/{project_id}/branches/{branch_id}` with `{ "branch": { "name": "…" } }`.
5. Update non-secret meta / caller-persisted `branch_name`. Keep the same `branch_id` and existing
   DATABASE_URL handoff — do not rotate credentials or create another branch.
6. Never rename the parent or any `preview-*` / `preview-local-*` branch.

## Rebind

Require the caller's persisted non-secret `project_id`, `parent_branch_id`, `branch_id`,
`branch_name`, `expires_at`, and `database_url_env` from the original provision/adopt result.
Treat `branch_id` as the durable identity; never resolve a rebind by name, prefix, task key, or
the presence of an old temporary file alone.

On Cloud Agent hosts, if caller metadata is incomplete but
`/tmp/airgoods-cloud-agent-neon.env.meta.json` has a live `branch_id`, adopt that identity first
(same checks as [Cloud Agent adopt](#cloud-agent-adopt-before-create)), then continue.

1. Fetch the exact branch ID from the exact project.
2. Verify it is ready, unexpired, not root or default, and still a child of the exact configured
   parent. Never extend expiration during rebind.
3. Treat `branch_id` as authoritative. If the supplied `branch_name` differs from Neon's current
   name (for example after an intentional rename), accept Neon's name and return it — do not
   block solely on name drift. Expiration must still be unexpired and not silently extended.
4. Prefer the existing Cloud Agent handoff file when present and loadable. Otherwise retrieve a
   fresh direct connection string and create a new mode-0600 sourceable temporary environment
   file outside the repository (or equivalent session-scoped injection). Return only its path
   and the original `database_url_env`.
5. Run the minimal connectivity and identity check again. Require the active endpoint or branch
   to match the supplied child and differ from the parent.
6. Return the same non-secret branch metadata with `reused: true`.

If the exact branch is missing, expired, mismatched, or no longer safe, return `blocked`. Never
silently provision a replacement because the interrupted task may depend on mutations that exist
only in the original child.

## Raw-data guardrails

- Use the branch only for the assigned task.
- Do not enumerate, export, or transmit unrelated customer records.
- Do not include raw values in logs, screenshots, videos, patches, fixtures, or model-visible summaries.
- Before recording evidence, replace visible branch-only values with synthetic equivalents.
- Use unique child-branch role credentials returned by Neon.
- Prefer environment-scoped secrets and restricted egress. For hosted agents handling raw data,
  prefer a self-hosted or tightly scoped environment per
  [host surfaces](../references/host-surfaces.md#security-posture-for-raw-production-copy-data).

Return `blocked` if the parent cannot be identified exactly, the parent is unprotected, expiration
cannot be set, credentials would be exposed, or the caller cannot prove the application uses the
child.

## Cleanup

1. Resolve the exact project and child branch ID from the provision/adopt/rebind result (or Cloud
   Agent meta file when that is the run's bound identity). Never delete by a broad prefix,
   unresolved environment variable, or previewctl namespace (`preview-local-*`, `preview-*`).
   Only delete branches this skill created or adopted under `agent-*`.
2. Stop application and worker connections when practical.
3. Delete the child with the Neon CLI/API by exact `branch_id`.
4. Verify the branch no longer appears in the project.
5. Erase temporary connection files (including `/tmp/airgoods-cloud-agent-neon.env` and
   `.meta.json` when those were the run handoff) and unset task-scoped database variables when
   the host permits.
6. Report deletion explicitly.

The caller owns the lifecycle after a successful `provision`, adopt, `rename`, or `rebind` and
must later invoke `cleanup`. Orchestrated callers clean up after success, failure, or a blocked
implementation. Expiration is only a fallback for agent crashes or interrupted sessions.

Never delete, reset, rename, restore, or change the default status of the configured parent
branch (`br-old-mud-amx76cuc` / `production`).

## Output

Do not return connection strings, passwords, or tokens.

```yaml
status: done | blocked
operation: provision | rename | rebind | cleanup
project_id: <project-id>
parent_branch_id: <parent-id>
branch_id: <child-id-or-null>
branch_name: <child-name-or-null>
expires_at: <rfc3339-or-null>
database_url_env: <environment-variable-name-or-null>
temporary_env_file: <absolute-path-or-null>
reused: true | false | null
renamed: true | false | null
deleted: true | false
blocker: null | <specific blocker>
```
