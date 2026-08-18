---
name: to-agent-qa
description: Browser-test an implemented Airgoods feature, fix and retest UI bugs, push the fixes, and publish a Notion Agent QA artifact with video evidence. Use only when explicitly invoked as `$to-agent-qa` after implementation is committed on a feature branch.
---

# Agent QA

Run a browser-only shipping gate. Read [agent artifact contracts](./references/agent-artifacts.md)
completely before acting.

## Preconditions

- Follow the contract's runtime route and read the repository's agent and environment docs.
- Require a clean, non-default feature branch with committed implementation, plus Notion access,
  UI control, and video recording.
- Resolve the feature key, sources, and implementation and QA harness/model attribution.
- Do not run CI, tests, lint, typecheck, build, or format.

## Test, fix, and publish

1. Inspect the request, diff, routes, UI branches, and data model. Upsert
   `AGENT QA: <Feature Name>` by `Feature Key`, apply the template, and set `Status` to `Testing`.
2. Verify the affected services. Use only the routed environment's disposable Neon child to
   create isolated actors, permissions, states, and failures.
3. Build a deduplicated matrix of every reasonable shipping path: workflows, roles, permissions,
   validation, state transitions, recovery, persistence, repeated actions, navigation, and nearby
   regressions. Explain true exclusions outside `Total`.
4. Test the matrix with maximum safe subagent parallelism. Give each agent isolated data and one
   path or tight path group. Keep one coordinator for the matrix, bugs, fixes, commits, and Notion.
5. For each failure, record the repro, set `Status` to `Fixing`, fix it, and retest the exact path
   plus affected regressions. Record post-fix proof with the same actor, data, route, and action.
6. Create scoped `patch:` commits. Re-audit for missed paths, run more waves as needed, and push
   only after the full browser matrix passes.
7. Inspect every MP4 for correctness, secrets, and PII. Upload titled and captioned evidence,
   populate concise collapsed toggles, and store the pushed final SHA.

## Gate

- Write all artifact text in ASD-STE100 Simplified Technical English. State one clear action and
  observed result per case; name the actor when it matters.
- Mark `Ready` only when `Passed = Total`, `Total > 0`, `Open Bugs = 0`, every reasonable path is
  covered, all required videos play, and the final SHA is pushed.
- Otherwise mark `Blocked` with one concrete reason. Never substitute screenshots or text for
  video. On a later SHA, refresh the same record and retain prior bug evidence.
- Return one line: `Agent QA is ready. <passed> of <total> browser scenarios passed. <Notion URL>`
  or `Agent QA is blocked. <Reason>. <Notion URL>`.
