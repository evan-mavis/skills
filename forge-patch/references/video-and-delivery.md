# Video and Delivery

## Primary browser verification

Use Computer Use for GUI verification and RecordScreen for the final recording. In Cursor Cloud,
launch a `Task` with `subagent_type="computerUse"` and use the desktop browser against the running
application.

Playwright and `playwright-cli` are not the default verification path. Use them only when Computer
Use is unavailable, and disclose that limitation in the result and PR evidence.

When the `neon` data profile is active, exercise the real application against the disposable
child through the same verified task-scoped environment used for implementation and CI.
Otherwise use the isolated local or cloud runtime selected during preflight. Do not substitute
mocked pages, isolated component harnesses, or API-only proof for the user-visible flow.

## Capture by host

- **Codex:** use Computer Use and RecordScreen. Save the final MP4 outside the repository and
  return its absolute path so Codex can render it in chat.
- **Local Cursor:** use Computer Use and RecordScreen, then expose the MP4 as the task artifact.
- **Cursor Cloud:** use the `computerUse` task and RecordScreen. Ensure the app is reachable from
  the cloud desktop, required services are running, and the processed artifact is addressable
  before environment cleanup.

Use a Playwright-based recorder only as the disclosed fallback when Computer Use or RecordScreen
is unavailable.

## Capture standard

- H.264 MP4, normally under 100 MB
- one focused workflow, usually 10–45 seconds
- visible triggering action and verified final state
- no narration unless it materially improves understanding
- no credentials, developer tooling noise, raw production PII, or unrelated customer information
- exact tested commit SHA recorded alongside the asset

Visually inspect the beginning, middle, end, and every frame around sensitive state changes.
Complete this capture standard whenever the resolved evidence profile is `video`.

## Linear evidence

When an associated issue exists, prefer Linear as the canonical video home after the draft PR
exists:

1. prepare a direct file upload with the Linear connector;
2. upload the raw MP4 bytes to the returned signed URL;
3. finalize the attachment on the issue;
4. retain the attachment URL for the PR body update;
5. create one evidence comment containing the tested SHA, outcome, existing PR URL, and
   limitations.

Do not expose the signed upload URL. Complete prepare, upload, and finalize sequentially because upload URLs expire quickly.

## Fallbacks

When no Linear issue exists, require the draft PR to exist first:

1. attach the MP4 to that PR through a supported authenticated GitHub surface;
2. otherwise use configured private artifact storage and link it from the PR.

Never commit the video to the application repository or Git LFS. Do not create a Linear issue solely for evidence storage.
