# Database Runtime

Do not reimplement provision/query logic in orchestrators. Do not auto-call
`$provision-neon-branch`.

## Profiles

| Key | Meaning |
| --- | ------- |
| `none` | No live DB |
| `local` | Fixtures / durable local DB (`$refresh-local-db` when that is the repo path) |
| `hosted-db` | Host-injected `DATABASE_URL` (Cursor cloud Neon). Bind only — no create/delete |
| `local-preview` | `$provision-local-worktree-environment` (Neon + Redis + ports + `.env.local`) |

Deprecated alias: `neon` → treat as `hosted-db`.

Never mutate production or unexplained shared DBs. Never put connection strings in chat/logs/plans.

## Host routing

| Host | Recommended | Notes |
| ---- | ----------- | ----- |
| `cloud` | `hosted-db` | `local-preview` blocked |
| `local_worktree` | `local-preview` | Prefer `local` when full preview stack is unnecessary |

Ask unless `data` is concrete or resumed. Labels: No runtime / Local fixtures / Host DATABASE_URL /
Full local previewctl. Persist `data_profile` + `host`.

## Bind

- **`hosted-db`:** require env `DATABASE_URL` (or repo canonical name); verify before first DB
  command; resume = re-verify. Missing → `blocked`.
- **`local-preview`:** `provision` / resume `repair`; `repair --reset-db` only on explicit ask.
  Authoritative URL in previewctl `.env.local`. Never on cloud.
- **`local`:** bind documented isolated target.
- **`$query-local-db`:** `--database-url-env <name>` only.

Pass workers profile + env var **name** + non-secret metadata — never the connection string.
Status: `verified` \| `not_needed` \| `blocked`.

## Persist (`## Database Lifecycle` / `runtime_state`)

```yaml
host: cloud | local_worktree
data_profile: none | local | hosted-db | local-preview
hosted_db:
  database_url_env: DATABASE_URL
  managed_by_host: true
local_preview:
  previewctl_env: <name-or-null>
  branch_id: <id-or-null>
  branch_name: <name-or-null>
  database_url_env: DATABASE_URL
  preserve_after_done: true
```

## Cleanup

1. Stop apps/workers started for the run.
2. `hosted-db` — do not delete host branches; unset task overrides only.
3. `local-preview` — preserve by default; `delete --yes` only on explicit request / ephemeral run.
4. Remove any temp connection files created for the run.
