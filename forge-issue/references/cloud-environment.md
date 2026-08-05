# Remote Agent Environment

Use this reference when `host: cloud` — any remote or hosted agent checkout that does not inherit
a developer laptop's services and credentials.

Read [host surfaces](../../references/host-surfaces.md) for portable capability mappings.

## Skill and connector availability

Install the complete `forge-issue` folder, including `SKILL.md`, `agents/`, and `references/`, into
the host skill directory. When the Neon profile may be selected, install the complete standalone
`provision-neon-branch` skill folder. When local worktree provisioning may be selected on Airgoods,
use the repo's `provision-local-worktree-environment` skill. When selected-database inspection may
be needed, install the complete standalone `query-local-db` skill folder.

On cloud hosts, reject `data_profile: local-preview`.

Do not install only `SKILL.md`: each selected skill's bundled references are mandatory runtime
context.

Configure the Airgoods production Postgres MCP and optional source connectors through the host's
integration settings. Confirm each server is authenticated before editing.

## Required environment

Provision these in the target application repository's remote-agent environment:

- the repository's documented language runtimes and package managers
- Git, GitHub authentication, and `gh`
- a desktop browser plus native browser automation and screen-recording support
- `ffmpeg` and `ffprobe` for an H.264 MP4
- Neon CLI 2.14 or newer
- a Postgres client compatible with the target application when migrations or direct verification require it
- every app service needed for the affected flow, including workers and queues

Use the repository's committed environment manifest, reusable environment snapshots, startup
terminals, and documented bootstrap hooks when available. Keep repository-specific setup there; do
not add or modify it from `forge-issue` unless the user asks.

### Airgoods Cloud Agent Neon bootstrap

Airgoods `.cursor/environment.json` `start` (`.cursor/scripts/cloud-agent-start.sh`) may already:

1. start Docker + Redis;
2. provision a short-lived Neon child;
3. write `/tmp/airgoods-cloud-agent-neon.env` (mode 0600 `DATABASE_URL`) and
   `/tmp/airgoods-cloud-agent-neon.env.meta.json` (non-secret metadata).

When `data_profile: neon` on cloud, forge must **adopt** that branch via `$provision-neon-branch`
(detect meta → rebind/adopt → rename to Linear-first once the issue id is known). Do not create a
second agent branch for the same run. If the handoff is missing (secrets absent), fall back to the
skill's normal provision path. Persist `branch_id` for resume; cleanup deletes that exact id.
Backend terminals source the handoff through `.cursor/scripts/cloud-agent-run-with-db.sh`.

Prefer native browser automation over Playwright for GUI verification. Use Playwright only when
native automation is unavailable and disclose the fallback.

For Airgoods, read [Airgoods runtime](airgoods-runtime.md) for the exact environment variables and
service startup. Do not duplicate every tracked `.env.example` value in host environment settings:
copy the examples into the checkout, then inject only secrets and host-specific overrides.

## Runtime secrets

Configure secrets at the environment level, never in committed files or repository dotenv:

- `NEON_API_KEY`
- GitHub credentials capable of pushing and opening a draft PR
- Airgoods production Postgres MCP authentication
- Linear authentication when source retrieval or video attachment is needed
- credentials for relevant read-only sources such as PostHog, Tinybird, Slack, or Notion
- application authentication and sandbox credentials needed to exercise the flow

Keep production-side credentials read-only. The mutable database credential must always come from the disposable Neon child branch.

Pass the mutable connection only through a mode-0600 temporary environment file outside the
repository or an equivalent session-scoped secret injection. On Airgoods Cloud Agent hosts, prefer
the existing `/tmp/airgoods-cloud-agent-neon.env` handoff when present. Load that handoff into
every database-dependent process. Never persist it in `.env`, `.env.local`, another dotenv file, a
shell profile, host environment manifests, or reusable environment settings.

## Non-secret configuration

Provide:

- `NEON_PROJECT_ID`
- `NEON_PARENT_BRANCH_ID`
- `PREVIEWCTL_ENV_NAME`
- `NEON_BRANCH_TTL_HOURS`, at most `24`
- the repository's canonical database variable name when it is not `DATABASE_URL`
- documented app ports and startup commands

Before migrations, workers, tests, runtime verification, browser evidence, or direct queries,
verify that the active non-secret database identity matches the selected child and differs from
the parent. Invoke `$query-local-db` only with the verified variable name via
`--database-url-env`; never pass the connection value.

## Network and raw-data posture

Allow only the egress needed for Neon, GitHub, Linear, required source connectors, package registries, and the application under test. Outside the explicitly authorized, narrowly scoped production MCP queries, raw production-copy data must not be sent to analytics, logs, model prompts, screenshots, or video.

Remote agents typically run with internet access and automatic terminal execution. For raw production data, prefer a self-hosted or tightly scoped hosted environment per [host surfaces](../../references/host-surfaces.md#security-posture-for-raw-production-copy-data).

## Preflight result

Before editing, report only missing capability names. Never print secret values.

```yaml
runtime: ready | missing
production_mcp: ready | missing
neon: ready | missing
github: ready | missing
linear: ready | optional | missing
browser_video: ready | missing
app_services: ready | missing
```
