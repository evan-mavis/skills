# Browser hosts and evidence

Shared driving, recording, and evidence contract for the Airgoods surface verifiers. The rules below
hold on every host. Only the mechanics in [Host mechanics](#host-mechanics) vary.

Resolve app routes and selectors from the selected surface's feature map, and runtime ports from the
current checkout. Repository-relative paths in a map refer to that checkout, not to the installed
skill directory.

## Resolve the host

Determine the host during preflight, before driving:

| Host            | Browser driver                            | Evidence root                                        |
| --------------- | ----------------------------------------- | ---------------------------------------------------- |
| Codex           | Codex browser harness                     | `~/.codex/verification`                              |
| Cursor          | Cursor browser surface and walkthrough video | `test-results` in the active checkout (gitignored) |
| Factory (Droid) | `$droid-control`, driving `agent-browser` | `~/.factory/verification`                            |

If the running host is not listed, use its native browser automation and screen recording per
[host surfaces](../../references/host-surfaces.md), and record which capability you resolved. Never
send work to another host to obtain a capability the current one lacks.

## Invocation syntax

A reference like `$verify-airgoods-web` or `$query-local-db` names a sibling skill. Invoke it using
the syntax the current host exposes: `$name` in Codex and Factory (Droid), `/name` in Cursor. The
skill name, not the sigil, is what matters.

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

### Cursor

Use the Cursor browser surface and its walkthrough video capability. Follow Cursor's current tab and
recorder documentation; do not port Codex harness calls onto it.

Open a new background tab at the resolved `http://127.0.0.1:<port>` origin, lock it for the run, and
take an accessibility snapshot before interacting. Unlock and close only the tab this run created.

Mandatory video must come from a Computer Use-capable host. When host-native recording is
unavailable, route the required walkthrough to a Computer Use-capable Cursor host and report the
routing; a screenshot-only local pass is supplemental evidence and never a substitute. Never capture
production-copy messages, addresses, phone numbers, uploaded media, or recipient details in a
walkthrough artifact.

Third-party frames and hosted fields (provider iframes, card fields, bank verification) may be
inaccessible to the browser surface, redirect away, open a new tab, or be unavailable with local
credentials. Report that as a blocker requiring user takeover rather than guessing at the result.

### Cursor Cloud runtime

When running in Cursor Cloud, `.cursor/environment.json` is authoritative and the host has already
bootstrapped the stack. Read the environment file before starting services, then reuse what it
provides instead of provisioning duplicates:

- Redis and a per-run Neon branch are host-provisioned. Confirm the protected Neon handoff reached
  `ready` and that backend-backed behavior waits for it; closed ports while the handoff reads
  `provisioning` are wait conditions, not failures.
- Backend is `:8000`, queue is `:8001`, marketplace web is `:3000`, public web is `:3006`.
- Warehouse is not auto-started or prebuilt. Start only Warehouse with
  `pnpm --dir apps/warehouse dev` on `:3005` when its port is closed, and allow for a cold compile
  before declaring it unhealthy.
- Load the protected handoff explicitly when the environment requires it, and pass
  `--database-url-env DATABASE_URL` to `$query-local-db` against the verified isolated database.
- Leave Neon, Redis, handoff files, host terminals, and walkthrough artifacts to the host, and stop
  only processes this run started.

Cloud and local use different port truth. Prefer the resolved Cloud ports in Cloud, and the existing
configured listeners locally; never hardcode a default port over a verified one.

### Factory (Droid)

### Factory (Droid)

Invoke `$droid-control`, which owns browser driving and the recording lifecycle. It drives
`agent-browser` underneath and captures the session as a video artifact.

Use a unique session identifier for every command, and drive and record the same session. Read
`$droid-control`'s current instructions before the first call rather than assuming its interface.

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
