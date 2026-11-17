# Airgoods iOS simulator workflow

Use for Airgoods tasks that require building, running, reproducing, or verifying behavior in the iOS Simulator.

## Dispatch from Codex

Use the [Devin v3 session API](https://docs.devin.ai/api-reference/v3/sessions/post-organizations-sessions) from the current Codex task, including in Codex Cloud. In `airgoods + skills`, use the personal network secret `DEVIN_API_KEY` only as a bearer credential for `api.devin.ai`. Use [Get Self](https://docs.devin.ai/api-reference/v3/self/self) to resolve the sessions organization and verify it is Airgoods. Keep the token out of prompts, files, logs, and artifacts. Report a missing secret or macOS entitlement as a blocker.

Create one capped session with `platform: macos` and the connected Airgoods repository. Supply the exact reachable ref and SHA, assigned scope, test environment, and observable pass condition. Start the prompt with `/estack:estack` and ask Devin to load its installed skill. For a CLI handoff, use the same prompt. If Devin is assigned edits, give it a separate branch and review its diff before integrating.

Save the returned session ID and URL. Poll [Get Session](https://docs.devin.ai/api-reference/v3/sessions/get-organizations-session) and collect messages and attachments. Steer or resume that session when possible. If create times out, reconcile with [List Sessions](https://docs.devin.ai/api-reference/v3/sessions/organizations-sessions) before retrying. After collecting evidence, verify the assigned session has finished or stop it if its work is done and it is still running.

## Build and verify

- Confirm the checkout SHA, active Xcode toolchain, and available simulator runtime. If Xcode rejects the destination, compare `xcodebuild -showdestinations` for the app scheme with the devices visible to the same toolchain before retrying.
- Use a verified nonproduction backend and authorized synthetic fixtures for flows that need backend state. Reuse the current run's verified Neon handoff when applicable. If the simulator cannot reach a safe backend, report which prerequisite is missing and continue any independent build or launch checks.
- Record the tested SHA, simulator and OS, backend class, steps, observed outcome, and session link. Attach a Devin simulator recording for required walkthroughs and screenshots or logs where they help explain the result. Review the evidence. A booted simulator proves readiness. A successful build proves compilation. A flow passes only when the app shows the expected behavior.
- Preserve reproduction before a fix and a passing check afterward. For new behavior, capture a demo. Report build, install and launch, and the requested flow separately, with any missing evidence or cleanup.
