---
name: to-agent-qa
description: Browser-test an implemented Airgoods feature in cloud with maximum safe subagent parallelism, capture and fix UI bugs, retest them, commit and push fixes, and publish a readable Notion Agent QA artifact with repro and post-fix videos. Use only when explicitly invoked as `$to-agent-qa` after implementation is committed on a feature branch.
---

# Agent QA

Run a browser-only shipping gate. Read [agent artifact contracts](../references/agent-artifacts.md)
completely before acting.

## Preconditions

- Work in the provisioned cloud environment. Read the target repo's agent and environment
  documentation, including `AGENTS.md` and `.cursor/README.md` when present.
- Require a clean, non-default feature branch with the implementation committed.
- Resolve the feature name/key, PR or Linear context, implementation harness/model, and current
  QA harness/model. Treat harness as attribution only; do not change the workflow by provider.
- Require connected Notion access plus UI-control and video-recording tools in the current
  environment.
- Do not run CI, unit or integration tests, lint, typecheck, build, or format. This skill covers
  browser scenarios only.

## Test, fix, and publish

1. Inspect the request, diff, routes, and UI branches. Upsert `AGENT QA: <Feature Name>` by
   `Feature Key`, apply the Agent QA template, and set `Status` to `Testing`.
2. Verify the affected cloud services. Use the disposable Neon child as a test sandbox: freely
   query, insert, update, or delete data to create actors, permissions, states, and failures. Never
   touch the protected parent or production.
3. Build a scenario matrix that covers every distinct reasonable path needed to ship the feature.
   Include happy and alternate flows; every relevant role and permission; validation boundaries;
   loading, empty, success, error, retry, cancel, and recovery states; persistence; repeated and
   concurrent actions; disabled controls; navigation; and nearby regressions. Add feature-specific
   paths from the request, diff, routes, and data model. Test desktop unless the user asks for
   mobile. Count each distinct scenario once. Explain true exclusions outside the denominator.
4. Use the maximum available subagent capacity to test the matrix in parallel. Assign one path or
   one tightly related group of paths to each subagent. Use isolated actors and data when paths can
   affect each other. Give each subagent the expected behavior, setup, route, and evidence format.
   Run more waves until every scenario has a result. Keep one coordinator responsible for the
   matrix, duplicate removal, bug IDs, code changes, retests, commits, and the final Notion page.
5. Drive and record the real UI with the tools provided by the current environment. Follow its
   documented tool instructions; do not assume provider-specific tool names. Do not install
   replacement browsers, automation, or recording packages such as Playwright unless no provided
   tool can complete a required path. Disclose any installation or fallback and why it was needed.
6. For each failure, record the repro before editing, add a compact bug toggle, set `Status` to
   `Fixing`, fix it, rerun the exact path plus affected regressions, and record post-fix proof with
   the same actor, data, route, and action.
7. Create scoped `patch:` commits as fixes become valid. Push the feature branch only after the
   complete browser matrix passes.
8. Re-audit the request, diff, roles, state transitions, and nearby surfaces for missed paths. Send
   uncovered paths to another parallel wave. Upload the native MP4s, inspect them for correctness
   and secrets or PII, give every video a readable title and a short caption, populate concise
   toggles, and store the pushed final SHA.

## Writing standard

- Write all artifact text in ASD-STE100 Simplified Technical English.
- Write one clear action and one observed result for each test case. Name the actor when it matters.
- Use short, complete sentences. Use common words and active voice.
- Do not join fragments with middle dots, slashes, or dense label chains.
- Keep the collapsed toggle format from the Agent QA template.

## Gate and closeout

- Mark `Ready` only when `Passed = Total`, `Total > 0`, `Open Bugs = 0`, every reasonable path is
  covered, required videos play in Notion, and the final SHA is pushed.
- Otherwise mark `Blocked` with one concrete reason. Never replace required video with screenshots
  or text-only evidence.
- On a later SHA, refresh the same record, replace stale coverage, and retain prior bug evidence.
- Return one line: `Agent QA is ready. <passed> of <total> browser scenarios passed. <Notion URL>`
  or `Agent QA is blocked. <Reason>. <Notion URL>`.
