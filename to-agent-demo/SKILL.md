---
name: to-agent-demo
description: Record the important user-visible paths of an Airgoods feature and publish a coworker-ready Notion Agent Demo. Use only when explicitly invoked as `$to-agent-demo` after Agent QA is Ready on the same commit.
---

# Agent Demo

Show coworkers the finished feature. Read
[agent artifact contracts](../to-agent-qa/references/agent-artifacts.md) completely before acting.

## Preconditions

- Follow the contract's runtime route and read the repository's agent and environment docs.
- Require Notion access, UI control, video recording, and a linked `Ready` Agent QA whose pushed
  SHA matches the current commit. Otherwise upsert the demo as `Blocked` and stop.
- Resolve the feature key, sources, and implementation and demo harness/model attribution.

## Record and publish

1. Inspect the request, diff, routes, components, and QA matrix. Select the primary workflow and
   important options or alternate paths. Exclude minor edge cases.
2. Upsert `DEMO: <Feature Name>` by `Feature Key`, apply the template, link Agent QA, and set
   `Status` to `Recording`.
3. Verify the affected services. Use only the routed environment's disposable Neon child to make
   demo states reachable.
4. Record one silent, labeled browser tour of the primary workflow. Add short clips only for
   important choices or alternate paths. Remove idle time.
5. Inspect each MP4 for correctness, secrets, and PII. Upload it with a complete-sentence title
   and one-sentence caption. Map each selected path to evidence in concise collapsed toggles.
   Remove any edge-case section.

## Gate

- Write all artifact text in ASD-STE100 Simplified Technical English. Use short, complete,
  user-focused sentences and the template's collapsed toggles.
- Mark `Ready` only when every selected path has playable video and the demo SHA equals the linked
  Ready QA SHA. Set `UI Covered` and `UI Total` from those paths.
- Otherwise mark `Blocked` with one concrete reason. Never substitute screenshots or text for
  video. On a later SHA, refresh the same record and replace stale evidence.
- Return one line: `Agent Demo is ready. <covered> of <total> important paths are shown. <Notion
  URL>` or `Agent Demo is blocked. <Reason>. <Notion URL>`.
