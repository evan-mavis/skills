# Remote Agent Environment

Use when `host: cloud`. See [host surfaces](../../references/host-surfaces.md).

## Requirements

- Full `forge-issue` skill folder (not `SKILL.md` alone); `query-local-db` when DB inspection needed
- Reject `data_profile: local-preview`
- Host-injected `DATABASE_URL` (or repo canonical DB env) for `hosted-db` — do not call `$provision-neon-branch`
- Language runtimes, package managers, Git/`gh`, browser + native automation/recording, `ffmpeg`/`ffprobe`, app services for the flow
- Prefer native browser automation; Playwright only as disclosed fallback
- Airgoods: [airgoods-runtime](airgoods-runtime.md); copy `.env.example`s, inject secrets only

## Secrets / config

Host-level only (never commit): GitHub, Linear (if needed), production MCP auth, app/sandbox
creds, host `DATABASE_URL`. Keep production MCP read-only. Never print connection strings.

Before DB work: confirm DB env is set; `$query-local-db` with `--database-url-env` only.

## Posture

Egress only as needed (Neon, GitHub, Linear, registries, app under test). No raw production-copy
data in prompts, logs, screenshots, or video outside authorized MCP scope.

Preflight: report missing capability names only — never secret values.
