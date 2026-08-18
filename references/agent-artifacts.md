# Agent Artifact Contracts

Use these exact destinations and contracts. Fetch each database before every write and use its
current schema. Apply the named template explicitly when creating a page; refresh an existing page
instead of creating duplicates.

## Destinations

| Artifact | Database | Data source | Template | Title |
| --- | --- | --- | --- | --- |
| Agent QA | `https://app.notion.com/p/fbd1eb036a404114a6fa64cdb9b1262d` | `collection://5981210a-ea85-4030-8b47-2083be117198` | `Agent QA Template` (`3c009c70ed3780d2b54fc7c6bb5d19f5`) | `AGENT QA: <Feature Name>` |
| Agent Demo | `https://app.notion.com/p/9d4775140eba400aac34d23f8cd63ea9` | `collection://24f3d14f-5de8-426a-8a62-c8367728a81e` | `Agent Demo Template` (`3c009c70ed3780b09dafe4bfeed74ff3`) | `DEMO: <Feature Name>` |

Set `Feature Key` to the Linear identifier when available, otherwise the PR number, otherwise a
normalized `<branch>:<feature>` value. Use it to upsert and rename records. Relate Agent QA through
`Agent Demo`; relate Agent Demos through `Agent QA`.

## Cloud runtime

Read the repository's agent and environment documentation on every run, including
`<airgoods-repo>/AGENTS.md` and `<airgoods-repo>/.cursor/README.md` when present. These files define
the Airgoods runtime regardless of which agent environment is executing the skill. Expect a fully
functioning cloud dev environment with Redis, app services, and a fresh per-run Neon child from
the protected production-copy parent. The child is disposable: query and mutate it without
restriction to make test states reachable. Never connect to or modify the protected parent or
production.

Use the UI-control and screen-recording tools provided by the current environment. Follow that
environment's documented tool instructions; do not assume a provider, tool name, or control API.
Do not install replacement browsers, automation, or recording packages such as Playwright unless
no provided tool can complete a required path. Disclose any installation or fallback in `Gaps`,
and remain `Blocked` if video evidence cannot be produced.

Record silent H.264 MP4s. Show the trigger and final state, remove idle time, and inspect the start,
middle, end, and sensitive transitions before upload. Never expose credentials or PII and never
commit video files to the app repository.

Caption every uploaded video in its Notion video block. Use these short formats:

- QA coverage: `Coverage · <area> · <scenario>`
- Bug repro: `Repro · BUG-## · <path or scenario>`
- Post-fix proof: `Verified · BUG-## · <same path or scenario>`
- Main demo: `Feature tour · <primary workflow>`
- Demo edge state: `<UI state> · <role or setup>`

## Properties

Populate source links, branch, final commit, affected surfaces, environment, implementation
harness/model, artifact harness/model, and completion date. Harness fields record attribution only;
store the actual environment and do not branch the workflow by provider. Use `Cloud Dev` by
default. Agent QA also sets `Passed`, `Total`, and `Open Bugs`; Agent Demos sets `UI Covered`,
`UI Total`, and `Video Count`. Keep `Status` accurate throughout the run.

## Agent QA page

- Keep the visible callout to result, open bugs, ship status, and tested commit.
- Use one collapsed toggle per logical area: `<Area> · <passed>/<total>`.
- Use one short bullet per scenario: `✅ <scenario> — <observed result>`.
- For each bug, add `[Fixed] BUG-## · <title>` with severity, path, expected/actual result, failing
  and passing SHAs, a captioned repro video, and captioned post-fix verification video.
- Keep `Exclusions` and `Gaps` collapsed. Exclusions require a one-line rationale and do not count
  toward `Total`; any real gap blocks readiness.

## Agent Demo page

- Keep the visible callout to UI coverage, video count, linked QA, and demo commit.
- Put the captioned primary end-to-end video under `Feature tour`.
- Use one collapsed toggle per logical area: `<Area> · <covered>/<total>` with one short bullet per
  UI state and its evidence location.
- Put captioned alternate and hard-to-reach state videos under collapsed `Edge-state clips`.
- Keep `Gaps` collapsed; any introduced UI without evidence blocks readiness.

Write for scanning: concise bullets, no narrative introduction, implementation diary, repeated
metadata, automated-test output, or generic filler.
