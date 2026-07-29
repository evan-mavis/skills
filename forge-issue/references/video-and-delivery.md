# Video and Delivery

Read [host surfaces](../../references/host-surfaces.md#gui-verification-and-screen-recording) for
portable browser and recording guidance.

## Primary browser verification

Use native desktop browser automation for GUI verification and host-native screen recording for
the final MP4. Exercise the running application in a real browser session — not mocked pages,
isolated component harnesses, or API-only proof for user-visible flows.

Playwright and `playwright-cli` are not the default verification path. Use them only when native
browser automation is unavailable, and disclose that limitation in the result and PR evidence.

When the `neon` data profile is active, exercise the real application against the disposable
child through the same verified session-scoped environment used for implementation and CI.
Otherwise use the isolated local or cloud runtime selected during preflight.

## Capture

Follow [host surfaces](../../references/host-surfaces.md#secret-handoff) for credential handling
during recording.

1. Save the final H.264 MP4 outside the repository.
2. Return its absolute path and/or expose it as the run artifact when the host supports that.
3. On remote hosts, ensure the app is reachable from the agent desktop, required services are
   running, and the processed artifact is addressable before environment cleanup.
4. Render or attach the local MP4 in the originating chat when the host supports it.

## Capture standard

- H.264 MP4, normally under 100 MB
- one focused workflow, usually 10–45 seconds
- visible triggering action and verified final state
- no narration unless it materially improves understanding
- no credentials, developer tooling noise, raw production PII, or unrelated customer information
- exact tested commit SHA recorded alongside the asset

Visually inspect the beginning, middle, end, and every frame around sensitive state changes.
Complete this capture standard whenever the resolved evidence profile is `video`.

## Bug before/after evidence

When `bug_evidence: before_after_video`:

**Before (pre-implement, blocking):**

- Record on `review_base` before any fix commit.
- Same route, account, and data setup as the after clip when possible.
- Show trigger → broken outcome; usually 10–30 seconds.
- Save as `evidence_before.video`; do not commit to the repo.

**After (closeout, blocking):**

- Record on the final green commit after Verify.
- Repeat the same numbered reproduction steps from `working_contract.reproduction`.
- Show trigger → expected outcome, plus one negative or regression check.
- Populate output `video` (alias `video_after`).

Label both assets with their commit SHA in Linear comments and the PR body. Prefer attaching the
before clip to the Linear issue when one exists; attach both to the draft PR on closeout.

## Linear evidence

When an associated issue exists, prefer Linear as the canonical video home after the draft PR
exists:

1. prepare a direct file upload with the Linear integration;
2. upload the raw MP4 bytes to the returned signed URL;
3. finalize the attachment on the issue;
4. retain the attachment URL for the PR body update;
5. create one evidence comment containing the tested SHA, outcome, existing PR URL, and
   limitations. For bug before/after, include repro SHA, fix SHA, and links to both clips.

Do not expose the signed upload URL. Complete prepare, upload, and finalize sequentially because upload URLs expire quickly.

## Fallbacks

When no Linear issue exists, require the draft PR to exist first:

1. attach the MP4 to that PR through a supported authenticated GitHub surface;
2. otherwise use configured private artifact storage and link it from the PR.

Never commit the video to the application repository or Git LFS. Do not create a Linear issue solely for evidence storage.
