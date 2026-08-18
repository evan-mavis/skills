---
name: to-agent-demo
description: Record the primary paths, important options, and user-visible value of an Airgoods feature in cloud, then publish a coworker-ready Notion Agent Demo artifact. Use only when explicitly invoked as `$to-agent-demo` after the linked Agent QA artifact is Ready on the same commit.
---

# Agent Demo

Show coworkers the final user-visible feature. Read
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

1. Inspect the request, diff, routes, components, and Agent QA matrix. Identify the primary user
   workflow, the most important alternate paths, and the options or choices that coworkers need to
   understand. Do not copy the full QA matrix or include minor edge cases.
2. Upsert `DEMO: <Feature Name>` by `Feature Key`, apply the Agent Demo template, link `Agent QA`,
   and set `Status` to `Recording`.
3. Verify the affected cloud services. Freely query or mutate the disposable Neon child to make
   the selected demo paths reachable; never touch the protected parent or production.
4. Drive and record the real UI with the tools provided by the current environment. Follow its
   documented tool instructions; do not assume provider-specific tool names. Do not install
   replacement browsers, automation, or recording packages such as Playwright unless no provided
   tool can complete a required path. Disclose any installation or fallback and why it was needed.
5. Record one silent, labeled end-to-end feature tour. Add separate native clips only when they
   help coworkers understand an important option, role, or alternate workflow. Test desktop unless
   the user asks for mobile. Remove idle time. Split a clip when that makes the demo easier to scan.
6. Give each video a short title that states a complete thought and a small, one-sentence caption
   that explains what the video shows. Inspect every clip for correctness and secrets or PII,
   upload the MP4s, and map each selected path to evidence in concise collapsed toggles. Do not add
   an edge-case section. Remove that section if the template creates it.

## Writing standard

- Write all artifact text in ASD-STE100 Simplified Technical English.
- Use short, complete sentences. Use common words and active voice.
- Explain the feature from the user's point of view. State what a user can do and why it matters.
- Do not join fragments with middle dots, slashes, or dense label chains.
- Keep the collapsed toggle format from the Agent Demo template.

## Gate and closeout

- Mark `Ready` only when every selected primary path and important choice has evidence, the tour is
  clear without extra context, all videos play in Notion, and the demo SHA exactly matches the
  linked Ready Agent QA SHA. Set `UI Covered` and `UI Total` from the selected demo paths, not from
  every state in the QA matrix.
- Otherwise mark `Blocked` with one concrete reason. Never substitute screenshots or text-only
  evidence for required video.
- On a later SHA, refresh the same record, replace stale videos, and require refreshed Agent QA.
- Return one line: `Agent Demo is ready. <covered> of <total> important paths are shown. <Notion
  URL>` or `Agent Demo is blocked. <Reason>. <Notion URL>`.
