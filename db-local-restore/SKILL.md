---
name: db-local-restore
description: Restore a dump from our Render-hosted Postgres database into the local PostgreSQL database named `stack`. Use when the user wants to drop and recreate local data from a Postgres dump, especially a directory-format `pg_dump` backup from Render.
---

# Restore Local PostgreSQL (`stack`)

## Quick start

Use the shared script from the repository root:

```bash
REPO_ROOT="$(git rev-parse --show-toplevel)"
bash "$REPO_ROOT/.agents/skills/db-local-restore/scripts/restore-airgoods-local.sh" /absolute/path/to/dump
```

The dump path is always user-provided. Do not assume a previous path is still correct.

Examples:

```bash
REPO_ROOT="$(git rev-parse --show-toplevel)"
bash "$REPO_ROOT/.agents/skills/db-local-restore/scripts/restore-airgoods-local.sh" /Users/evanmavis/Downloads/2026-04-27T17:30Z/stack_anry
bash "$REPO_ROOT/.agents/skills/db-local-restore/scripts/restore-airgoods-local.sh" --db stack_restore_test /Users/evanmavis/Downloads/2026-04-27T17:30Z/stack_anry
```

## Workflow

1. Confirm the user supplied a dump path.
2. If the user did not provide a dump path, ask them to paste the exact absolute path before doing anything destructive.
3. Confirm the dump path exists.
4. Detect the dump format:
   - If the path contains `toc.dat` or is a directory, use `pg_restore`.
   - If it is a plain `.sql` file, use `psql`.
5. Default to local connection settings unless overridden:
   - `PGHOST=localhost`
   - `PGPORT=5432`
   - `PGUSER=postgres`
   - `PGDATABASE=stack`
6. For directory/custom dumps, prefer dropping and recreating the target database before restore.
7. Use `--no-owner --no-acl` for Render-hosted dumps so restore does not depend on source roles existing locally.
8. Warn that active app connections to `stack` should be stopped first, though `dropdb --force` usually handles them.

## Notes

- This skill assumes the local target is PostgreSQL and the main local database is `stack`.
- The user must provide the dump path for each restore run. If they do not, ask for it.
- Render-hosted backups may reference roles that do not exist locally. `--no-owner --no-acl` avoids most of that friction.
- Extension mismatches can still fail restores. If `pg_restore` errors on an extension, inspect local extension availability before retrying.
- A dump from an older Postgres version can usually be restored into a newer local version, but extensions are the main risk area.

## Safety

- This is destructive for the target database. Be explicit about which database will be dropped.
- Prefer restoring into a scratch database first when the user wants a dry run.
- Do not restore into production or a remote database unless the user explicitly asks.
