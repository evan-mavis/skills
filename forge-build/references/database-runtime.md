# Database Runtime

Treat the selected database as execution environment, not metadata. Never reproduce
`$provision-neon-branch`, `$provision-local-worktree-environment`, or `$query-local-db` connection
logic in orchestrators.

## Profiles

- `none` — verification needs no database.
- `local` — documented isolated local database or synthetic fixture (for example docker `stack`).
- `neon` — cloud/agent disposable production-shaped child via `$provision-neon-branch`.
- `local-preview` — local dedicated worktree stack via `$provision-local-worktree-environment`
  (Neon + Redis + ports + migrations + generated `.env.local`).

Never mutate production or an unexplained shared database. Never put a connection string in a
prompt, plan, issue, log, or chat.

## Host routing

Resolve `host: cloud | local_worktree` during preflight:

| Host             | `neon`                             | `local-preview`                         |
| ---------------- | ---------------------------------- | --------------------------------------- |
| `cloud`          | `$provision-neon-branch`           | `blocked`                               |
| `local_worktree` | `$provision-neon-branch` (DB-only) | `$provision-local-worktree-environment` |

Airgoods local worktree: load
[local worktree runtime](local-worktree-runtime.md). Cloud/remote: load
[cloud environment](../../forge-issue/references/cloud-environment.md) when applicable.

## Profile selection

Unless `data` is concrete or persisted on resume, ask:

> Which isolated runtime should this change use?

Present each option by label; persist the profile key:

| Key             | Label                                                                                        |
| --------------- | -------------------------------------------------------------------------------------------- |
| `none`          | No isolated runtime — verification needs no live database or services                        |
| `local`         | Local fixtures — docker `stack` or synthetic database only                                   |
| `neon`          | Cloud Neon branch — disposable DB only _(Recommended in cloud)_                              |
| `local-preview` | Full local previewctl stack — Neon, Redis, ports, migrations _(Recommended on local laptop)_ |

Recommend by host: `cloud` → `neon`; `local_worktree` → `local-preview`. One short sentence per
option when the interactive choice UI supports descriptions. Treat omitted or `auto` as requiring
this question. Follow [interactive choices](../../references/host-surfaces.md#interactive-choices)
and [preflight gates](../../references/preflight-gates.md).

Do not choose `none` on Airgoods cloud for flows that need backend, auth, or data. `frontend-only`
UI work still needs runtime when verification crosses API, auth, or database boundaries.

## Provision and resume

### `neon` — Cloud Agent order (no double-provision)

On `host: cloud`, Airgoods Cloud Agent `start` may already have provisioned a short-lived child
and written:

- `/tmp/airgoods-cloud-agent-neon.env` (mode 0600; `DATABASE_URL`)
- `/tmp/airgoods-cloud-agent-neon.env.meta.json` (non-secret: `project_id`, `parent_branch_id`,
  `branch_id`, `branch_name`, `expires_at`, …)

Do **not** assume forge must always create a fresh Neon branch on cloud startup.

Order:

1. **Detect / adopt** — invoke `$provision-neon-branch` `operation: provision`. The skill adopts a
   live Cloud Agent meta `branch_id` when present (rebind/adopt semantics) and must **not** create
   a second branch for the same run.
2. **Rename** — once the Linear issue id is known, ensure the branch name matches
   `agent-<linearId>-<env>-<user>-<taskKey>` (skill `rename` or adopt-time rename). Keep the same
   `branch_id` and existing DATABASE_URL handoff.
3. **Persist** — write non-secret lifecycle metadata (`branch_id` as durable identity) under
   `## Database Lifecycle` / `working_contract.runtime_state` for resume/rebind across
   interruptions.
4. **Cleanup** — at success, failure, or blocked closeout, `$provision-neon-branch`
   `operation: cleanup` deletes that exact `branch_id` only.

If no handoff/meta exists (non-cloud host, or Neon secrets missing so `start` skipped provision),
fall back to the skill's normal create path with the same Linear-first naming convention.

**Never leave two live `agent-*` branches for one forge run.**

### `neon` — operations

`$provision-neon-branch`:

- new run: `operation: provision` (adopts Cloud Agent branch when present; otherwise creates)
- Linear id becomes known after bind: `operation: rename` when the name still mismatches
- resume with active uncleaned child: `operation: rebind`
- after cleanup: provision anew only when database work remains

### `local-preview`

`$provision-local-worktree-environment` (Airgoods repo skill):

- new run: `provision`
- resume: `repair` when `.previewctl.json` or persisted metadata shows an active environment
- reset DB only with explicit user intent: `repair --reset-db`

Never create duplicate stacks for the same worktree. On cloud, never invoke the local-preview skill.

## Runtime binding

**`local`** — bind every database-dependent process to the documented isolated target.

**`neon`** — load the protected `$provision-neon-branch` handoff (prefer
`/tmp/airgoods-cloud-agent-neon.env` when present; otherwise the skill's mode-0600 temp env file
outside the repo or equivalent task-scoped injection) into every database-dependent process.
Never edit dotenv files or shell profiles for task database selection.

**`local-preview`** — treat previewctl-generated `apps/backend/.env.local` as authoritative for
`DATABASE_URL`. Export it into each process shell before migrations, apps, workers, CI, QA, and
queries; never print the value. Read non-secret branch metadata from `.previewctl.json`. Report
printed service URLs for verification.

For all production-shaped profiles: before the first database-dependent command, verify the active
child branch or endpoint matches persisted metadata and differs from the parent. On resume, rebind
or repair the exact persisted environment; if missing, expired, or mismatched, return `blocked`.

When querying through `$query-local-db`, pass `--database-url-env <name>` after loading that
variable into the query process. Never pass the connection value; never fall back to local
`stack` during an isolated run.

Record status as `verified`, `not_needed`, or `blocked`. Serialise parallel work against one
isolated database unless separate task-isolated targets exist.

Pass workers only the profile, `database_url_env` name, and non-secret handoff metadata — never a
connection string.

## Persisted metadata

```yaml
runtime_state:
  host: cloud | local_worktree
  data_profile: none | local | neon | local-preview
  neon: # when data_profile is neon
    project_id: <id-or-null>
    parent_branch_id: <id-or-null>
    branch_id: <id-or-null> # durable identity
    branch_name: <name-or-null> # Linear-first when known
    expires_at: <rfc3339-or-null>
    database_url_env: DATABASE_URL
    temporary_env_file: <path-or-null> # replaceable; not identity
    deleted: true | false | null
  local_preview: # when data_profile is local-preview
    previewctl_env: <env-name-or-null>
    branch_id: <id-or-null>
    branch_name: <name-or-null>
    database_url_env: DATABASE_URL
    preserve_after_done: true
```

Forge Build: persist under `## Database Lifecycle` in the PRD. Forge Issue: persist under
`working_contract.runtime_state`. Never persist connection values or treat `temporary_env_file`
as durable identity. After rename, update persisted `branch_name` to match Neon; keep `branch_id`.

## Cleanup

Run after success and before every terminal `blocked` or failed result:

1. Stop applications, workers, and database-dependent processes started for the run.
2. **`neon` on any host** — `$provision-neon-branch` `operation: cleanup` with the exact
   provision/adopt/rebind `branch_id`; require confirmed deletion; persist `deleted: true`.
3. **`local-preview`** — preserve the environment by default (`preserve_after_done: true`). Tear
   down with `$provision-local-worktree-environment` `delete --yes` only on explicit user request
   or an ephemeral validation run.
4. Unset task-scoped database variables and remove protected temporary connection files from
   `neon` runs (including Cloud Agent handoff + meta when they belonged to this run).

Treat Neon expiration as crash protection, not normal cleanup. TTL is only a safety net.
