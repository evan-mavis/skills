# Factory host surfaces

Resolve shell, browser, recording, and service access from the current Factory session. Read the selected tool's current instructions before using it. If a required capability is unavailable, report the exact blocker rather than sending work to another host or substituting weaker proof.

For recorded walkthroughs, read [Record a video demo in Factory](video-recording.md). It covers the agent-browser lifecycle, version differences, artifact checks, and delivery in chat or a PR.

Follow the selected project context and verifier for environment ownership, evidence, and cleanup. Packaging a skill does not provision an environment.

## Security posture for raw production-copy data

Keep credentials and raw production-copy data out of chat, logs, screenshots, recordings, and committed files. Use configured credentials without printing them, select only the data needed for the authorized task, and redact durable evidence. Follow the provisioning skill's branch ownership, TTL, protected-parent, and cleanup rules. A copy of production data is not a disposable test fixture merely because its database is a child branch.

## Factory scheduling and delegation

Resolve automation operations through the available Factory tools and their current schemas. Discover the exposed create, list, read, and update operations before use. A confirmed automation runs a new session on its configured computer, so persist scoped state and verify target access. Without those capabilities, use bounded waits in this active session and report that no wake survives it. Store goal predicates in the decision trail; Factory does not promise a separate goal tool.

Only the root can call Task. Background tasks need explicit TaskOutput collection and run-owned stop handling. Child droids cannot ask the user or delegate, so return required review or help briefs to the root.
