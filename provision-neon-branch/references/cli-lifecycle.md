# Neon CLI Lifecycle

Neon CLI syntax evolves. Use either `neon` or the compatibility command `neonctl`, require version 2.14 or newer, and inspect subcommand help before the first mutation.

## Preflight

Confirm support for:

- listing and getting branches in an explicit project
- creating a branch from an explicit parent
- setting `expires_at` during creation
- retrieving a branch connection string
- deleting an exact branch ID
- machine-readable output where available

Authenticate non-interactively with `NEON_API_KEY`. Never put the key on the command line when environment authentication is supported.

## Provision sequence

1. Get the configured parent by exact ID and verify its project, name, root/default status, and readiness.
2. Calculate an RFC 3339 expiration at most 24 hours ahead.
3. Create a uniquely named full-data child using the explicit project ID, parent branch ID, and expiration.
4. Poll or re-read the child until ready.
5. Retrieve the direct connection string for the child. Select the repository's expected database and role when they are not the Neon defaults.
6. Run `select current_database(), now()` or an equivalent minimal connection check.

Adapt flags from local help rather than assuming a stale spelling. The logical operations correspond to:

```text
neon branches get
neon branches create
neon connection-string
neon branches delete
```

## Credential handling

- Capture the connection string without echoing command output.
- Disable shell tracing before handling it.
- Prefer an exported environment variable in the application process.
- If a temporary env file is required, place it outside the repository, set mode `0600`, and delete it during cleanup.
- Never include the URL in the skill's YAML result.

## Cleanup sequence

1. Validate the exact child ID begins with Neon's branch-ID form and is not equal to `NEON_PARENT_BRANCH_ID`.
2. Fetch that child and confirm its parent equals the configured parent.
3. Delete it by exact ID with the explicit project ID.
4. Re-read the exact ID and require a not-found result.

Never use globbing, prefix deletion, bulk cleanup, or a branch name alone when an ID is available.
