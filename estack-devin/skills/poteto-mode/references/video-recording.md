# Record a demo

Use Devin's built-in `computer` tool to drive GUI Chrome on `DISPLAY=:0` and its native
recording tools for web demos. Honor an explicitly chosen browser. Record and drive the same
run-owned tab or session. Required video needs a visible pointer and click feedback.

## Preflight

Confirm GUI Chrome is available on display `:0`, `ffmpeg` and `ffprobe` are available, and the
active session exposes `computer`, `recording_start`, `annotate_recording`, `recording_stop`,
and `describe_video`. Read their current schemas. Do not assume argument names or artifact paths.
Use `browser_console` only for read-only DOM inspection, never to trigger user actions or mutate state.

Check native pointer and click feedback in a short synthetic recording before required proof.
Report a missing browser, recording tool, or recording dependency with `I RAN INTO AN ISSUE:`
and mark the affected proof blocked. Do not install another browser driver or tools while maintaining skills.

When the user has asked for or approved testing, prefer `testing_agent` for a recorded walkthrough.
Give it the selected verifier, exact scenario, auth and synthetic fixture requirements, evidence names,
and proof and cleanup rules. It owns the UI test and recording end to end. Inspect its returned
artifacts and read-only side-effect evidence before claiming verification. If testing is not authorized,
do not invoke it merely to produce a recording.

## Capture

Resolve the route and actions from the project's verifier. Authenticate and prepare synthetic
fixtures before `recording_start`. Keep account, route, data, viewport, and action identical for bug proof.
Use a run-owned tab or session and an absolute evidence directory outside the repository. Resolve its
location from the selected project verifier, or use a run-specific directory outside the checkout.

Confirm the starting state with `computer` and optional read-only `browser_console` inspection.
Call `recording_start` after authentication and fixture setup. Drive the observed controls with
`computer`, re-read the screen after page changes, and annotate key steps with `annotate_recording`.
Keep credentials, emails, addresses, and other personal data out of the screen and annotations.
Show the action and result with brief pauses, usually in a 30 to 60 second take.

User-visible bugs require `video_before.mp4` and `video_after.mp4` walkthroughs of the same path.
Features and improvements require one concise `video_demo.mp4`. Confirm the result with a second
user-facing read and required side effects through read-only API or database evidence.
A success toast alone is insufficient. Console setters are not user actions.

Call `recording_stop` before closing the run-owned session, including when the scenario fails.
Use its returned artifact reference and verify that the finished video exists. Preserve failed clips
privately and report their failure. Screenshots do not replace required video.

## Deliver

Review the finished recording with `describe_video` before delivering it. Check the starting state,
visible pointer and click feedback, action, and result. Check the entire video for leaked credentials,
emails, addresses, and other personal data. Do not deliver a leaking clip. Re-record it with safe
fixtures and framing, then review the replacement. Keep unsafe evidence private.

Attach the reviewed video in the active Devin chat through its supported artifact or upload tool
and verify that the user can open it. Do not assume local Markdown paths render in chat.
For a PR, upload through a supported artifact flow and embed or link the durable video.
Local paths do not work for remote reviewers. Keep recordings after session cleanup.
