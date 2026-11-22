# Capy host surfaces

Use the current Capy machine and its available tools. Use `tools.capy.browser` for web pages, `tools.capy.computer` for desktop applications, and shell tools for commands. Read the computer-use skill before controlling the desktop. If a required capability is unavailable, report the blocker rather than substituting weaker proof.

For visual proof, read [Record a demo](video-recording.md). Follow the selected project verifier for environment ownership, evidence, and cleanup. Packaging a skill does not provision an environment.

## Delegation and history

Use `tools.subagent.create` and `tools.subagent.start` for scoped work, `tools.subagent.get` and `tools.subagent.list` for status, and `message_agent` for communication. Choose shared or isolated machines to match the work. Use `tools.thread.get` for accessible thread history. Do not assume a local transcript schema. Missing capability leaves required independent proof incomplete.

## Security posture for raw production-copy data

Keep credentials and raw production-copy data out of chat, logs, screenshots, recordings, and committed files. Use configured credentials without printing them, select only the data needed for the authorized task, and redact durable evidence. Follow the provisioning skill's branch ownership, TTL, protected-parent, and cleanup rules. A copy of production data is not a disposable test fixture merely because its database is a child branch.
