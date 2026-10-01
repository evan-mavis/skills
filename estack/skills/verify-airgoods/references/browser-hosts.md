# Browser hosts and evidence

Shared driving, recording, and evidence contract for the Airgoods surface verifiers. The rules below
hold on every host. Only the mechanics in [Host mechanics](#host-mechanics) vary.

Resolve app routes and selectors from the selected surface's feature map, and runtime ports from the
current checkout. Repository-relative paths in a map refer to that checkout, not to the installed
skill directory.

## Resolve the host

Determine the host during preflight, before driving:

| Host | Browser driver | Evidence root |
| --- | --- | --- |
| Codex | Codex browser harness | `~/.codex/verification` |

If the running host is not listed, use its native browser automation and screen recording per
[host surfaces](../../references/host-surfaces.md), and record which capability you resolved. Never
send work to another host to obtain a capability the current one lacks.

## Invocation syntax

A reference like `$verify-airgoods-web` or `$query-local-db` names a sibling skill. Invoke it using
the syntax the current Codex session exposes, or read `../<name>/SKILL.md` directly from a skill
directory. The skill name, not the sigil, is what matters.

## Select a harness

Use the browser the user requests. Otherwise use the host's native harness from the table above, and
read that tool's current instructions before making more calls.

Drive through observation, never assumption. Read accessibility or DOM snapshots and interact with
observed roles, labels, and handles; re-read after navigation or state changes. Do not invent tab
APIs, browser methods, or recorder commands that the host's current documentation does not describe.

Create or select a run-owned tab or session. Do not alter the user's existing browser tab or
authenticated session. Record which harness, tab/session, origin, viewport, and auth context the run
owns.

A new tab does not prove cookie or account isolation. Require a documented isolated context for
anonymous or conflicting-account proof, and never clear a user's shared cookies or storage to obtain
it. If isolation is unavailable, report that prerequisite before driving.

Do not install browser tooling as an implicit part of copying, inspecting, or maintaining these
skills.

## Host mechanics

### Codex

Prefer the available `mcp__cua_repl` browser tools. Initialize with the matching entry point in that
tool's current instructions and read the returned documentation before making more calls. When only
the verified URL is known and no browser was specified, use
`cua.getBrowser({ url: verificationUrl })`, where `verificationUrl` is the resolved local origin and
route, then create or select a run-owned tab using the returned API.

If a recorded walkthrough requires another harness, an already-installed `agent-browser` CLI is an
alternative. Read the installed `vercel:agent-browser` skill and the CLI's current help first. Use a
unique `--session` value for every command, including snapshot, interaction, recording, and close,
and drive and record the same session.

### Codex cloud

Read [setup-cloud-env](../../setup-cloud-env/SKILL.md) before server startup or database queries.
Reuse the verified per-run Neon handoff and start missing required dev servers through the repo
commands, even when Codex did not execute the Cursor lifecycle hooks. An explicit setup request
allows the repo bootstrap when no handoff exists; verification alone does not provision a
replacement database.

Use the available browser tools. Confirm suitable fixtures, authentication, session isolation,
and recording are available before driving. Do not assume desktop tools exist in cloud. Report
the exact missing prerequisite as blocked proof.

## Recording and proof

Use only recording capabilities exposed by the selected tool or installed CLI's current
documentation. `video_before`, `video_after`, and `video_demo` are evidence labels, not tool names on
any host. A screenshot sequence is not a video.

Confirm that recording is supported before authenticating or starting the proof. When mandatory
recording is unavailable, report blocked proof and the exact missing capability; any partial
observations remain partial. Never claim a video was recorded without an accessible resulting
artifact.

Begin recording after authentication and fixture setup; exclude credentials and production-copy
personal data. Preserve matching account, route, data, viewport, and action for before/after
evidence.

Verify visible outcomes and required side effects through a second user-facing read plus read-only
API or database evidence. Loading a route or receiving a success toast alone does not establish the
whole feature's result. Read-only DOM inspection is evidence; calling internal setters is not a real
user action.

## Evidence and cleanup

Resolve `<evidence-root>/<surface-skill>/<run-id>/` to an absolute path for the run, using the
evidence root for the resolved host. Keep action/result snapshots, screenshots, recorder output or
durable artifact references, redacted API/database evidence, and concise run notes there.

A run ID must distinguish concurrent attempts, and evidence must survive service or session cleanup.
Do not write verification artifacts into the Airgoods repository by default.

Finalize recording using the selected harness's documented operation, confirm the artifact exists and
can be opened, then close only the tab/session the run created. Stop only recorded owned process or
session IDs. Preserve user or adopted services and all proof artifacts. Report any cleanup failure
with the resources that remain.
