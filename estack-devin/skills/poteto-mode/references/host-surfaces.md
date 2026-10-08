# Devin host surfaces

Resolve shell, browser, recording, and service access from the current Devin session. Read the selected tool's current instructions before using it. If a required capability is unavailable, report the exact blocker rather than sending work to another host or substituting weaker proof.

For recorded walkthroughs, read [Record a video demo in Devin](video-recording.md). It covers the agent-browser lifecycle, version differences, artifact checks, and delivery in chat or a PR.

Airgoods verification follows [Browser hosts and evidence](../../verify-airgoods/references/browser-hosts.md) and [Local runtime](../../verify-airgoods/references/local-runtime.md). Packaging a skill does not provision an environment.

## Delegation and history

Use native subagent tools only when exposed in this Devin session. General profiles inherit the parent model; custom profiles use the router unless pinned. Plugin profiles load in CLI and Desktop, not cloud. Background tools need prior approval and default workers cannot nest. Give each worker the full scoped brief because it does not inherit parent conversation history. Missing capability leaves required independent proof incomplete.

Use accessible scoped conversation history or transcript exports. Do not assume a local storage schema. Schedulers and artifact upload tools must be observed before claiming continuation or delivery.

## Security posture for raw production-copy data

Keep credentials and raw production-copy data out of chat, logs, screenshots, recordings, and committed files. Use configured credentials without printing them, select only the data needed for the authorized task, and redact durable evidence. Follow the provisioning skill's branch ownership, TTL, protected-parent, and cleanup rules. A copy of production data is not a disposable test fixture merely because its database is a child branch.
