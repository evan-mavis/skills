# Neon CLI Lifecycle

Neon CLI syntax evolves. Use either `neon` or the compatibility command `neonctl`, require version
2.14 or newer, and inspect subcommand help before the first mutation. When CLI rename/update
spelling is unclear, use the Neon HTTP API with `NEON_API_KEY` (same as Airgoods Cloud Agent
bootstrap scripts).

## Preflight

Confirm support for:

- listing and getting branches in an explicit project
- creating a branch from an explicit parent
- setting `expires_at` during creation
- renaming/updating an exact branch ID (CLI or
  `PATCH /projects/{project_id}/branches/{branch_id}`)
- retrieving a branch connection string for an exact existing child
- deleting an exact branch ID
- machine-readable output where available

Authenticate non-interactively with `NEON_API_KEY`. Never put the key on the command line when
environment authentication is supported.

## Branch naming

Build the branch name:

```text
# Linear known — no short-id
agent-<linearId>-<env>-<user>-<taskKey>

# Linear unknown — short-id for collision resistance
agent-adhoc-<env>-<user>-<taskKey>-<shortId>
```

- `linearId`: from `NEON_LINEAR_ISSUE_ID` / `LINEAR_ISSUE_ID`, else `air-<digits>` extracted from
  the git branch or task text (example `air-7688`)
- `env`: `cloud` or `local`, or `NEON_AGENT_ENV` when set
- `user`: sanitized `$USER`, or `NEON_BRANCH_USER` when set
- `taskKey`: short work slug; strip duplicated Linear id; else `work`
- `shortId`: four lowercase alphanumeric characters — **only** in the adhoc fallback

Sanitize each component to lowercase `[a-z0-9-]` with single hyphens. Cap ~100 chars.

Examples:

- `agent-air-7688-cloud-evan-fix-variant-rename`
- `agent-adhoc-cloud-evan-form-variant-rename-k3m9`

Do not use `agent-<env>-<user>-<task>-<shortId>` as the primary pattern when a Linear id is known.

## Cloud adopt sequence

Run this **before** any create on Cloud Agent hosts (or whenever the standard handoff exists):

1. Read `/tmp/airgoods-cloud-agent-neon.env.meta.json` (or `AIRGOODS_CLOUD_NEON_META_FILE`).
2. Require non-secret fields: `project_id`, `parent_branch_id`, `branch_id`, `branch_name`,
   `expires_at`, `database_url_env`, `temporary_env_file`.
3. `GET` the exact branch; verify ready, unexpired, child of configured parent, `agent-*`
   namespace, not parent/default.
4. Compute the desired name. If Neon's name differs, rename (see below) and update meta
   `branch_name` only.
5. Prefer existing `/tmp/airgoods-cloud-agent-neon.env` (mode 0600). Do not print it.
6. Connectivity check; return `reused: true`. **Do not create another branch.**

## Provision sequence

1. Get the configured parent by exact ID and verify its project, name, root/default status, and
   readiness.
2. Run [Cloud adopt sequence](#cloud-adopt-sequence) when applicable; stop on success.
3. Calculate an RFC 3339 expiration at most 24 hours ahead (Cloud Agent `start` often uses 8h).
4. Build the branch name per [Branch naming](#branch-naming).
5. Create a uniquely named full-data child using the explicit project ID, parent branch ID, and
   expiration.
6. Poll or re-read the child until ready.
7. Retrieve the direct connection string for the child. Use `NEON_DB_NAME` (default `neondb`) and
   the expected role when they are not the Neon defaults.
8. Write the mode-0600 handoff (prefer Cloud Agent paths when on that host) plus non-secret meta.
9. Run `select current_database(), now()` or an equivalent minimal connection check.

Adapt flags from local help rather than assuming a stale spelling. The logical operations
correspond to:

```text
neon branches get
neon branches create
neon connection-string
neon branches delete
# rename — confirm local help; otherwise:
# PATCH /projects/{project_id}/branches/{branch_id}
#   { "branch": { "name": "agent-air-7688-cloud-evan-task-key" } }
```

## Rename sequence

1. Resolve exact `project_id` + `branch_id`.
2. Compute Linear-first target name.
3. No-op when Neon's current name already matches.
4. Update name via CLI or PATCH. Never change protection, parent, or expiration here unless the
   caller explicitly requested an allowed TTL change (default: do not extend).
5. Persist the new `branch_name` in meta / caller state. Keep `branch_id` and DATABASE_URL handoff.

## Rebind sequence

1. Accept the exact persisted project, parent, child, name, expiration, and database variable
   metadata from the original provision/adopt result. If incomplete on a Cloud Agent host, load
   identity from the meta file first.
2. Get the child by exact project and branch ID. Confirm it exists, is ready, is not root or
   default, has not expired, and still belongs to the configured parent.
3. Prefer Neon's current name when it differs from persisted metadata (rename drift). Do not
   extend expiration.
4. Prefer the existing Cloud Agent handoff when present; otherwise retrieve a fresh direct
   connection string and create a new protected runtime handoff.
5. Connect through the handoff and verify the endpoint or branch matches the child and differs
   from the parent.

Never fall back to branch-name lookup or create a replacement during rebind.

## Credential handling

- Capture the connection string without echoing command output.
- Disable shell tracing before handling it.
- Use an exported environment variable when every command shares one application process.
- For multi-process orchestrators, place a sourceable environment file outside the repository,
  set mode `0600`, return only its path and variable name, and delete it during cleanup.
- On Airgoods Cloud Agent hosts, the canonical handoff is
  `/tmp/airgoods-cloud-agent-neon.env` with sibling `.meta.json`. Prefer those paths when present.
- Treat temporary handoff files as replaceable. Rebind may create a fresh file; the branch ID,
  not an earlier file path, is the durable identity.
- Never write the connection to a repository dotenv file or shell profile.
- Never include the URL in the skill's YAML result.

## Cleanup sequence

1. Validate the exact child ID begins with Neon's branch-ID form and is not equal to
   `NEON_PARENT_BRANCH_ID`.
2. Fetch that child and confirm its parent equals the configured parent and the name is under
   `agent-*` (never `preview-*` / `preview-local-*`).
3. Delete it by exact ID with the explicit project ID.
4. Re-read the exact ID and require a not-found result.
5. Remove the Cloud Agent handoff + meta files when they belonged to this run.

Never use globbing, prefix deletion, bulk cleanup, or a branch name alone when an ID is available.
