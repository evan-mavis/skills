# Video and Delivery

## Capture by host

### Codex

Use Chrome when interaction needs video. Follow the active browser skill and the repository's local-development workflow. If useful, load the installed `feature-demo-site` browser-capture reference for its timestamped capture and H.264 encoding helpers, but do not build a demo site.

Save the final MP4 outside the repository and return its absolute path so Codex can render it in chat.

### Local Cursor

Use Cursor's native browser tools or Playwright and its available screen-recording path. Save the final MP4 outside the repository and expose it as the task artifact.

### Cursor Cloud

Use the cloud agent's browser/computer-use recording and processed video artifact. Ensure the app is reachable from the cloud desktop, all required services are running, and the artifact is downloaded or otherwise addressable before branch cleanup.

## Capture standard

- H.264 MP4, normally under 100 MB
- one focused workflow, usually 10–45 seconds
- visible triggering action and verified final state
- no narration unless it materially improves understanding
- no credentials, developer tooling noise, raw production PII, or unrelated customer information
- exact tested commit SHA recorded alongside the asset

Visually inspect the beginning, middle, end, and every frame around sensitive state changes.

## Linear evidence

When an associated issue exists, prefer Linear as the canonical video home:

1. prepare a direct file upload with the Linear connector;
2. upload the raw MP4 bytes to the returned signed URL;
3. finalize the attachment on the issue;
4. create one evidence comment containing the tested SHA, outcome, PR URL, and limitations.

Do not expose the signed upload URL. Complete prepare, upload, and finalize sequentially because upload URLs expire quickly.

## Fallbacks

When no Linear issue exists:

1. attach the MP4 to the PR through a supported authenticated GitHub surface;
2. otherwise use configured private artifact storage and link it from the PR.

Never commit the video to the application repository or Git LFS. Do not create a Linear issue solely for evidence storage.
