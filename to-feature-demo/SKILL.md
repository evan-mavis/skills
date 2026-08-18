---
name: to-feature-demo
description: Record a complete Airgoods feature in cloud and publish a concise Notion Agent Demos artifact covering every introduced UI state. Use only when explicitly invoked as `$to-feature-demo` after the linked Agent QA artifact is Ready on the same commit.
---

# Feature Demo

Capture the final user-visible feature. Read
[agent artifact contracts](../references/agent-artifacts.md) completely before acting.

## Preconditions

- Work in the provisioned cloud environment. Read the target repo's agent and environment
  documentation, including `AGENTS.md` and `.cursor/README.md` when present.
- Resolve the feature key, source links, implementation harness/model, and current demo
  harness/model. Treat harness as attribution only; do not change the workflow by provider.
- Require connected Notion access and a linked `Ready` Agent QA record whose pushed SHA matches
  the current commit. Otherwise create or refresh the Agent Demo as `Blocked` and stop.
- Require UI-control and video-recording tools in the current environment.

## Record and publish

1. Inspect the request, diff, routes, components, and Agent QA matrix. Inventory every introduced
   screen, modal, state, and interaction; count each distinct visible state once.
2. Upsert `DEMO: <Feature Name>` by `Feature Key`, apply the Agent Demo template, link `Agent QA`,
   and set `Status` to `Recording`.
3. Verify the affected cloud services. Freely query or mutate the disposable Neon child to make
   every UI state reachable; never touch the protected parent or production.
4. Drive and record the real UI with the tools provided by the current environment. Follow its
   documented tool instructions; do not assume provider-specific tool names. Do not install
   replacement browsers, automation, or recording packages such as Playwright unless no provided
   tool can complete a required path. Disclose any installation or fallback and why it was needed.
5. Record one silent, labeled end-to-end feature tour. Add separate native clips for alternate,
   validation, empty, loading, error, permission, or other hard-to-reach states. Test desktop
   unless the user asks for mobile. There is no hard duration limit; remove idle time and split
   clips when that improves scanning.
6. Inspect every clip for correctness and secrets or PII, upload the MP4s, caption every video
   using the contract formats, and map every UI state to evidence in concise collapsed toggles.

## Gate and closeout

- Mark `Ready` only when `UI Covered = UI Total`, `UI Total > 0`, no gaps remain, all videos play
  in Notion, and the demo SHA exactly matches the linked Ready Agent QA SHA.
- Otherwise mark `Blocked` with one concrete reason. Never substitute screenshots or text-only
  evidence for required video.
- On a later SHA, refresh the same record, replace stale videos, and require refreshed Agent QA.
- Return one line: `Demo ready: <covered>/<total> UI states covered — <Notion URL>` or
  `Demo blocked: <reason> — <Notion URL>`.
