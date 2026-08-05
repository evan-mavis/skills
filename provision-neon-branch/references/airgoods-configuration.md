# Airgoods Neon Configuration

Current known non-secret configuration:

```text
Project: Airgoods
Project ID: billowing-lab-64900636
Parent branch: production
Parent branch ID: br-old-mud-amx76cuc
Region: AWS us-east-1
Neon Postgres: 17
Source production Postgres: 15
```

Use environment configuration as canonical:

```text
NEON_PROJECT_ID=billowing-lab-64900636
NEON_PARENT_BRANCH_ID=br-old-mud-amx76cuc
NEON_DB_NAME=neondb
NEON_BRANCH_TTL_HOURS=24
```

Optional branch-name and host overrides:

```text
NEON_AGENT_ENV=cloud|local
NEON_BRANCH_USER=evan
NEON_LINEAR_ISSUE_ID=air-7688
LINEAR_ISSUE_ID=air-7688
```

Cursor Cloud Agent bootstrap (Airgoods `.cursor/environment.json` `start`) writes:

```text
AIRGOODS_CLOUD_NEON_ENV_FILE=/tmp/airgoods-cloud-agent-neon.env          # mode 0600; DATABASE_URL
AIRGOODS_CLOUD_NEON_META_FILE=/tmp/airgoods-cloud-agent-neon.env.meta.json  # non-secret metadata
```

Meta JSON fields (never secrets): `project_id`, `parent_branch_id`, `branch_id`, `branch_name`,
`expires_at`, `database_url_env`, `temporary_env_file`, plus operation status. Cloud `start`
currently defaults TTL to `8` hours (`NEON_BRANCH_TTL_HOURS`); skill default remains `<= 24`.

Scripts (do not duplicate their logic in orchestrators):

- `.cursor/scripts/cloud-agent-provision-neon.sh`
- `.cursor/scripts/cloud-agent-run-with-db.sh`
- `.cursor/scripts/cloud-agent-start.sh`

When running inside the Airgoods monorepo, load unset Neon variables from the primary checkout's
ignored `.env.previewctl`. Never copy that file into a worktree or print its values.

Agent branches use the `agent-*` namespace. Preferred shape:

```text
agent-<linearId>-<env>-<user>-<taskKey>
```

Adhoc fallback (no Linear id):

```text
agent-adhoc-<env>-<user>-<taskKey>-<shortId>
```

Previewctl-owned branches use separate namespaces (`preview-local-*` for attached local
worktrees, `preview-*` for remote previews) and longer TTLs. Never delete, rename, or reuse
branches from another namespace.

Before every provision operation, confirm through Neon that the project and parent IDs still
resolve and that the parent is the root/default branch named `production`. If any identity
differs, return `blocked`; do not discover a replacement and mutate it automatically.

The parent is a raw copy of production. It is not the actual production database. Actual
production remains available only through the read-only Airgoods Postgres MCP during this
workflow.

Require the parent to be protected before creating a raw-data child. Protection makes Neon
generate new role passwords for child branches. The skill must report an unprotected parent as a
setup blocker rather than changing protection itself.

Do not refresh the parent, change project settings, protect or unprotect branches, configure
integrations, or clean up unrelated archived branches from this skill. Never write `DATABASE_URL`
into repo `.env` / `.env.local`.
