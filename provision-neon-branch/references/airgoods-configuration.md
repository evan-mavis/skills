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

Optional branch-name overrides:

```text
NEON_AGENT_ENV=cloud|local
NEON_BRANCH_USER=evan
```

When running inside the Airgoods monorepo, load unset Neon variables from the primary checkout's
ignored `.env.previewctl`. Never copy that file into a worktree or print its values.

Agent branches use the `agent-*` namespace and a 24-hour TTL. Previewctl-owned branches use
separate namespaces (`preview-local-*` for attached local worktrees, `preview-*` for remote
previews) and longer TTLs. Never delete or reuse branches from another namespace.

Before every provision operation, confirm through Neon that the project and parent IDs still resolve and that the parent is the root/default branch named `production`. If any identity differs, return `blocked`; do not discover a replacement and mutate it automatically.

The parent is a raw copy of production. It is not the actual production database. Actual production remains available only through the read-only Airgoods Postgres MCP during this workflow.

Require the parent to be protected before creating a raw-data child. Protection makes Neon generate new role passwords for child branches. The skill must report an unprotected parent as a setup blocker rather than changing protection itself.

Do not refresh the parent, change project settings, protect or unprotect branches, configure integrations, or clean up unrelated archived branches from this skill.
