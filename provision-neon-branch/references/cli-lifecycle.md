# Neon CLI Lifecycle

Neon CLI syntax evolves. Use either `neon` or the compatibility command `neonctl`, require version 2.14 or newer, and inspect subcommand help before the first mutation.

## Preflight

Confirm support for:

- listing and getting branches in an explicit project
- creating a branch from an explicit parent
- setting `expires_at` during creation
- retrieving a branch connection string for an exact existing child
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

## Rebind sequence

1. Accept the exact persisted project, parent, child, name, expiration, and database variable
   metadata from the original provision result.
2. Get the child by exact project and branch ID. Confirm it exists, is ready, is not root or
   default, has not expired, and still belongs to the configured parent.
3. Compare its name and expiration with the persisted metadata. Do not extend expiration.
4. Retrieve a fresh direct connection string for that exact child.
5. Create a new protected runtime handoff using the credential rules below.
6. Connect through the new handoff and verify the endpoint or branch matches the child and differs
   from the parent.

Never fall back to branch-name lookup or create a replacement during rebind.

## Credential handling

- Capture the connection string without echoing command output.
- Disable shell tracing before handling it.
- Use an exported environment variable when every command shares one application process.
- For multi-process orchestrators, place a sourceable environment file outside the repository,
  set mode `0600`, return only its path and variable name, and delete it during cleanup.
- Treat temporary handoff files as replaceable. Rebind creates a fresh file; the branch ID, not
  an earlier file path, is the durable identity.
- Never write the connection to a repository dotenv file or shell profile.
- Never include the URL in the skill's YAML result.

## Cleanup sequence

1. Validate the exact child ID begins with Neon's branch-ID form and is not equal to `NEON_PARENT_BRANCH_ID`.
2. Fetch that child and confirm its parent equals the configured parent.
3. Delete it by exact ID with the explicit project ID.
4. Re-read the exact ID and require a not-found result.

Never use globbing, prefix deletion, bulk cleanup, or a branch name alone when an ID is available.
