# Cloud Environment

Use this reference for Cursor Cloud, another remote agent, or any checkout that does not inherit a developer laptop's services and credentials.

## Skill and MCP availability

For local Cursor, install the canonical skills repository with its `scripts/sync-skills.sh` command.

For Cursor Cloud, install the complete `forge-patch` folder, including `SKILL.md`, `agents/`, and
`references/`, under `.cursor/skills/forge-patch`, `.agents/skills/forge-patch`, or the
environment's `~/.cursor/skills/forge-patch`. When the Neon profile may be selected, also install
the complete standalone `provision-neon-branch` skill folder. When selected-database inspection
may be needed, also install the complete standalone `query-local-db` skill folder.

Do not install only `SKILL.md`: each selected skill's bundled references are mandatory runtime
context.

Configure the Airgoods production Postgres MCP and optional source connectors through Cursor's MCP configuration. The agent must confirm each server is authenticated before editing.

## Required environment

Provision these in the target application repository's cloud-agent environment:

- the repository's documented language runtimes and package managers
- Git, GitHub authentication, and `gh`
- Chromium or Chrome plus Computer Use and RecordScreen support
- `ffmpeg` and `ffprobe` for an H.264 MP4
- Neon CLI 2.14 or newer
- a Postgres client compatible with the target application when migrations or direct verification require it
- every app service needed for the affected flow, including workers and queues

Cursor Cloud supports committed `.cursor/environment.json` setup, reusable environment snapshots, startup terminals, a browser, and a full desktop. Keep repository-specific setup there; do not add or modify it from `forge-patch` unless the user asks.

Prefer Computer Use over Playwright for GUI verification in Cursor Cloud. Use Playwright only
when Computer Use is unavailable and disclose the fallback.

For Airgoods, read [Airgoods runtime](airgoods-runtime.md) for the exact environment variables and service startup. Do not duplicate every tracked `.env.example` value in Cursor's environment settings: copy the examples into the checkout, then inject only secrets and host-specific overrides.

## Runtime secrets

Configure secrets at the environment level, never in `.cursor/environment.json` or committed files:

- `NEON_API_KEY`
- GitHub credentials capable of pushing and opening a draft PR
- Airgoods production Postgres MCP authentication
- Linear authentication when source retrieval or video attachment is needed
- credentials for relevant read-only sources such as PostHog, Tinybird, Slack, or Notion
- application authentication and sandbox credentials needed to exercise the flow

Keep production-side credentials read-only. The mutable database credential must always come from the disposable Neon child branch.

Pass the mutable connection only through a mode-0600 temporary environment file outside the
repository or an equivalent host-native task-scoped secret injection. Load that handoff into
every database-dependent process. Never persist it in `.env`, `.env.local`, another dotenv file,
a shell profile, `.cursor/environment.json`, or reusable cloud environment settings.

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

Cursor-hosted agents run with internet access and automatically execute terminal commands. For raw production data, prefer self-hosted Cursor Cloud or an environment with tightly scoped secrets, egress controls, privacy mode, audit logging, and short-lived Neon credentials.

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
