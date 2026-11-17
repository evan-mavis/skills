# Airgoods iOS simulator workflow

Use for Airgoods tasks that require building, running, reproducing, or verifying behavior in the iOS Simulator.

Use the existing Devin macOS session. Confirm the requested commit and that the installed Estack skill loaded. If macOS or the simulator is unavailable, report the blocker to the calling chat.

## Build and verify

- Confirm the checkout SHA, active Xcode toolchain, and available simulator runtime. If Xcode rejects the destination, compare `xcodebuild -showdestinations` for the app scheme with the devices visible to the same toolchain before retrying.
- Use a verified nonproduction backend and authorized synthetic fixtures for flows that need backend state. Reuse the current run's verified Neon handoff when applicable. If the simulator cannot reach a safe backend, report which prerequisite is missing and continue any independent build or launch checks.
- Record the tested SHA, simulator and OS, backend class, steps, observed outcome, and session link. Attach a Devin simulator recording for required walkthroughs and screenshots or logs where they help explain the result. Review the evidence. A booted simulator proves readiness. A successful build proves compilation. A flow passes only when the app shows the expected behavior.
- Preserve reproduction before a fix and a passing check afterward. For new behavior, capture a demo. Report build, install and launch, and the requested flow separately, with any missing evidence or cleanup.
