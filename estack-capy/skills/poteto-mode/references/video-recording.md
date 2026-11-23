# Record a demo

When video is required, resolve the skill named `capture` from the available skill catalog and read its resolved SKILL.md before recording. Capture owns recording, rendering, and artifact handling. Follow its workflow rather than defining recorder commands, render settings, or artifact paths here.

The caller or repository verifier owns the user journey and assertions. Pass capture the tested build, scenario, required before/after proof, safe starting state, and expected result. Begin after authentication and safe fixture setup. Exclude credentials and sensitive data. Keep nonvisual tests, logs, and side-effect checks alongside the video.

The ui-review link to this reference applies only when an interaction needs video. For image-only ui-review comparisons, do not invoke capture. Follow ui-review's image evidence contract.

Keep required bug before/after recordings and feature demos. Screenshots do not replace required video. If capture is unavailable or recording fails, report the missing video proof and continue independent checks. Do not silently replace it with screenshots or a custom recorder.
