# Video and Delivery

Use the host's native browser automation and screen-recording capabilities to record one concise
demo of the final integrated feature. Read
[host surfaces](../../references/host-surfaces.md#gui-verification-and-screen-recording). Do not
invoke site-building or site-publishing workflows.

## Native capture

1. Drive the real local application or explicitly supplied isolated preview in a desktop browser.
2. Record an H.264 MP4 with the host's screen-recording capability.
3. Save the file outside the repository; return its absolute path and/or expose it as the run
   artifact when supported.
4. Render or attach the MP4 in the originating chat when the host supports it.

Use a Playwright-based recorder only when native browser automation or recording is unavailable.
Disclose the fallback. Return `blocked` rather than silently replacing a resolved `video` profile
with text-only evidence.

## Demo scope

1. Read the PRD, issue index, completed issue files, and complete feature diff.
2. Identify every meaningful user-visible outcome and the actor, entry point, action, and final
   state that proves it.
3. Build the smallest coherent end-to-end story. Merge closely related outcomes into one flow;
   mention non-visual implementation changes in the PR summary instead of forcing them into the
   recording.
4. Exercise the real local application or explicitly supplied isolated preview environment,
   bound to the persisted and verified database profile when the flow is database-dependent.
   Never record production by default.
5. Include the most important negative or regression case when it fits naturally without making
   the demo confusing.

## Capture standard

- H.264 MP4, normally under 100 MB
- one focused workflow, usually 15–90 seconds
- visible triggering actions and verified final states
- no narration unless it materially improves understanding
- no credentials, developer tooling noise, raw production PII, or unrelated customer information
- exact final CI-passing feature SHA recorded alongside the asset

Use supplied demo accounts only for this task. Prefer reversible interactions and synthetic data.
Inspect the complete recording, including every sensitive state change, before upload.

## Delivery

The draft PR must exist before evidence delivery.

1. When an associated parent Linear issue exists, upload the MP4 there and retain the attachment
   URL for the PR body.
2. Otherwise attach the MP4 to the existing draft PR through a supported authenticated GitHub
   surface.
3. If direct PR attachment is unavailable, use configured private artifact storage and link it
   from the PR.
4. Update the existing draft PR body with the evidence link, one-line outcome, exact tested SHA,
   and limitations.

Never commit the video to the application repository or Git LFS. Never create a Linear issue
solely for evidence storage.
