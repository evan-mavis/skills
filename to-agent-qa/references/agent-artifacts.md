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

## Runtime

Read the repository's agent and environment documentation on every run, including
`<airgoods-repo>/AGENTS.md` and `<airgoods-repo>/.cursor/README.md` when present.

- **Codex:** Load `provision-local-worktree-environment` and attach previewctl to the current
  worktree. Use its isolated services, in-app Browser, and disposable Neon child. Record the page
  in the background with CDP screencasting, then use installed `ffmpeg` and `ffprobe` to produce
  and validate silent H.264 MP4s. Show a click halo in QA clips and a synthetic cursor with click
  feedback in Demo tours; remove injected markers after recording.
- **Cursor:** Use the provisioned cloud services and disposable Neon child with Cursor's native
  Computer Use and video recording.
- **Other environments:** Use their provided UI and recording tools. Remain `Blocked` if they
  cannot produce video; do not substitute or install Playwright.

Use macOS screen capture only when evidence must include native UI outside the page. Never connect
to or modify the protected Neon parent or production.

When a recording or upload flow needs a local staging area, use
`~/Documents/resources/videos/agent/<feature-key>/<artifact-type>/`. Use `qa` or `demo` for
`<artifact-type>`. Create the directory when needed, keep all staged MP4s outside the application
repository, and use filenames that identify the covered path. Do not use a repository directory or
an ad hoc temporary directory as the canonical staging area.

When an app workflow needs a video upload fixture, prefer a suitable video that the user has
authorized from Apple Photos instead of a generated test pattern. Use the Photos app to export only
the selected asset into the agent staging area. Inspect the export for people, private information,
sensitive audio, and unrelated personal content before use. Never modify the Photos library. Treat
an example image as visual guidance only; select an actual video with similar safe content for a
video upload test.

Record silent H.264 MP4s. Show the trigger and final state, remove idle time, and inspect the start,
middle, end, and sensitive transitions before upload. Never expose credentials or PII and never
commit video files to the app repository.

Give every uploaded video a short title above its Notion video block and a one-sentence caption in
the block. State the actor, action, and result when they matter. Use these patterns:

- QA coverage title: `<Actor> can <complete the action>`
- QA coverage caption: `The test confirms that <actor> can <action and result>.`
- Bug repro title: `BUG-##: <Short sentence that states the problem>`
- Bug repro caption: `The video shows that <action> causes <incorrect result>.`
- Post-fix title: `BUG-## is fixed in <path or scenario>`
- Post-fix caption: `The video confirms that <same action> now causes <correct result>.`
- Main demo title: `<Actor> can <complete the primary workflow>`
- Main demo caption: `This video shows how <actor> uses <feature> to <result>.`
- Option demo title: `<Actor> can <use an important option or alternate path>`
- Option demo caption: `This video shows when and how <actor> uses <option>.`

## Properties

Populate source links, branch, final commit, affected surfaces, environment, implementation
harness/model, artifact harness/model, and completion date. Harness fields record attribution only;
runtime routing follows the current agent environment. Use `Local Worktree` for Codex and `Cloud
Dev` for Cursor. Agent QA also sets `Passed`, `Total`, and `Open Bugs`; Agent Demos sets `UI
Covered`, `UI Total`, and `Video Count`. Keep `Status` accurate throughout the run.

## Agent QA page

- Keep the visible callout to result, open bugs, ship status, and tested commit.
- Use one collapsed toggle per logical area: `<Area>: <passed>/<total> tests passed`.
- Use one short bullet per scenario: `✅ <Actor and action>. <Observed result>.`
- For each bug, add `[Fixed] BUG-##: <title>` with severity, path, expected/actual result, failing
  and passing SHAs, a captioned repro video, and captioned post-fix verification video.
- Keep `Exclusions` and `Gaps` collapsed. Exclusions require a one-line rationale and do not count
  toward `Total`; any real gap blocks readiness.

## Agent Demo page

- Keep the visible callout to UI coverage, video count, linked QA, and demo commit.
- Put the titled and captioned primary end-to-end video under `Feature tour`.
- Use one collapsed toggle per logical area: `<Area>: <covered>/<total> paths shown`. Add one short,
  complete sentence for each path and its evidence location.
- Put titled and captioned clips for important options and alternate workflows in the relevant
  logical-area toggle. Do not create an edge-case section. Remove it if the template creates it.
- Keep `Gaps` collapsed. A missing primary path or important user choice blocks readiness.

Write all page text in ASD-STE100 Simplified Technical English. Use short, complete sentences,
common words, active voice, and one thought per sentence. Do not use middle dots or other punctuation
to join fragments. Write for scanning: concise bullets, no narrative introduction, implementation
diary, repeated metadata, automated-test output, or generic filler.
