# Record a demo

Use Devin's native browser screenshots and guided video recording. Follow the active session's
tool instructions and [Devin's recording workflow](https://docs.devin.ai/work-with-devin/testing-and-recordings).
Do not install or invoke a separate recorder or video rendering pipeline.

Plan a focused user journey. Record the action and its result, and annotate the key checks.
Begin after authentication and safe fixture setup. Exclude credentials and sensitive data.
Keep required bug before/after recordings and feature demos. Screenshots do not replace required video.
Keep nonvisual tests, logs, and side-effect checks alongside the recording.

Inspect the completed recording and deliver it through Devin's native attachment flow. Verify that
the user can open it. For a PR, link a durable uploaded artifact, not a local filesystem path.
Preserve evidence after cleanup. Record the tested build, scenario, tool, and artifact location.
When Devin exposes original files, preserve their bytes and SHA-256 hashes. Otherwise retain the
native attachment or session reference and state the export limit. Never invent a file hash.

If native recording is unavailable or fails, report the missing video proof and continue independent
checks. Do not silently replace it with screenshots or a custom recorder.
