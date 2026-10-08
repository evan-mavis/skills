# Cursor host surfaces

Resolve shell, browser, recording, and service access from the current Cursor session. Read the selected tool's current instructions before using it. If a required capability is unavailable, report the exact blocker rather than sending work to another host or substituting weaker proof.

For recorded walkthroughs, read [Record a video demo in Cursor](video-recording.md). It covers the agent-browser lifecycle, version differences, artifact checks, and delivery in chat or a PR.

Follow the selected project context and verifier for environment ownership, evidence, and cleanup. Packaging a skill does not provision an environment.

## Security posture for raw production-copy data

Keep credentials and raw production-copy data out of chat, logs, screenshots, recordings, and committed files. Use configured credentials without printing them, select only the data needed for the authorized task, and redact durable evidence. Follow the provisioning skill's branch ownership, TTL, protected-parent, and cleanup rules. A copy of production data is not a disposable test fixture merely because its database is a child branch.

## Cursor scheduling and delegation

For authorized scheduled work, read Cursor's installed `/automate` skill or use its exposed automation controls. Verify the saved automation's ID, active state, cadence or event trigger, repository, identity, and context tools. Automations start new cloud agents, so persist the scoped ledger where the run can read it. Local files and local MCP connections do not automatically follow a cloud run. Without verified scheduling, use bounded waits in the current session and report that no wake survives it.

Use native Task and the returned agent IDs or background handles. Direct children can delegate one further level when Task is exposed; grandchildren cannot. At the nesting limit, return required independent-review briefs to the parent. Collect every result, preserve one writer per worktree, and stop only tasks owned by the current run.

See [Cursor automations](https://prod.cursor.com/docs/cloud-agent/automations) and [subagents](https://prod.cursor.com/docs/subagents).
