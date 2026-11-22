# Record a demo

Use `tools.desktop.recording` for a bounded desktop recording and `tools.capy.browser` or `tools.capy.computer` to drive the scenario. Read the computer-use skill before desktop control. Start before the interaction and stop within 90 seconds. The stop call returns the MP4 path.

Plan a focused user journey. Record the action and result. Begin after authentication and safe fixture setup. Exclude credentials and sensitive data. Keep required bug before/after recordings and feature demos. Screenshots do not replace required video. Keep nonvisual tests, logs, and side-effect checks alongside the recording.

Inspect the completed recording and attach it to the conversation. For a PR, use `tools.pr.uploadAsset` for public-safe media and link the returned artifact. Preserve evidence after cleanup. Record the tested build, scenario, tool, and artifact location. Preserve original files and SHA-256 hashes when available. Never invent a hash.

If recording is unavailable or fails, report the missing video proof and continue independent checks. Do not silently replace it with screenshots or a custom recorder.
