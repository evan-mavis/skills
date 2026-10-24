# Runtime and commands

## Dependencies

Tested on Linux with Python 3.12, Pillow 12.3.0, NumPy 2.3.5, agent-browser 0.38.1, Chrome for Testing 154.0.8037.92, and FFmpeg/ffprobe 7.1.5 with libx264. Python pins are in `../requirements.txt`. Browser binaries and dependencies are provisioned separately. Installation of Estack does not install them. Rendering is deterministic on the tested dependency versions and makes no model or network calls.

Provision the pinned CLI and Python environment in the selected execution environment. Use its normal browser installer for Chrome and Linux libraries. Verify the installed CLI's skill with `agent-browser skills get core`, native recording help, and the bundled preflight. Do not install or repair tools merely to maintain documentation. Never disable certificate validation or modify system trust for capture.

The entry point is `scripts/capture.py`. Resolve its absolute path from the selected variant, not from a remembered workspace. Run with `python3`. Native recording omits the CLI's baked cursor option. The renderer supplies the approved independent pointer.

## Commands

| Command | Input and result |
| --- | --- |
| `preflight --browser PATH` | Checks executable versions, recording interface, Python imports, and libx264. Does not launch a browser or install tools. |
| `capture SCENARIO TAKE --browser PATH` | Records the already prepared active tab, drives the reviewed actions once, writes events and raw screenshots, and seals provenance. TAKE must not exist. |
| `still SCENARIO TAKE --browser PATH` | Runs the same scenario adapter without video. Include `still` steps to capture exact raw screenshots. |
| `seal TAKE FILE...` | Imports existing raw files relative to TAKE into a new checksum receipt. An existing receipt is verified rather than overwritten. |
| `prepare TAKE FRAMES` | Verifies raw hashes and decodes original frame timestamps into a new directory outside TAKE. |
| `plan MANIFEST OUTPUT [--alignment-offset SECONDS] [--preserve-cursor]` | Creates a new finishing manifest. Groups interactions into focus windows and protects scroll guards. Preserves source pixels and times. |
| `render MANIFEST OUTPUT.mp4` | Checks raw source pixels, presentation times, action status and provenance, renders with the accepted compositor, fully decodes the result, verifies raw hashes again, and writes render and derivative provenance sidecars. |
| `verify TAKE` | Checks the raw files against their receipt. |
| `verify MANIFEST [--video OUTPUT.mp4]` | Checks source bounds, pointer ink, target regions, camera continuity, scroll guards, and optional full video decode. |

Run `python3 scripts/validate_fixture.py --output NEW_DIRECTORY` for deterministic finishing checks. Add `--browser PATH` for a native local browser journey with a click, assertion, screenshot, and scroll. It uses a private loopback fixture and the same capture adapter. Run `python3 -m unittest discover -s tests -v` from the skill directory for narrow regression tests.

## Data contracts

Only desktop browser sessions are supported. Mobile device, touch, and user-agent overrides are rejected. Mobile evidence is a manual handoff to the user.

A scenario names one exact `origin`, run-owned `session`, even viewport `width` and `height`, optional requested `fps` and `initial_cursor`, and reviewed `steps`. The active page and viewport must already match. The adapter supports `click`, non-secret `fill`, `wait`, `assert_text`, `scroll`, `still`, and visual `focus` reading holds. `focus` records an observed region without fabricating a DOM focus or hover. Assertions check actual visible text. Scroll destinations use current document pixels.

`events.json` records command-bounded input times, observed target rectangles, outcomes, assertions, scroll intervals, capture-clock bounds, and source timing uncertainty. A failed input remains uncertain. The adapter finalizes the take without retrying. It does not close or export the browser session.

`provenance.json` lists each original file's SHA-256 and length. Read-only permissions discourage accidental edits; checksum verification detects changed bytes. It is not a signed attestation. Keep receipts and raw files in the private evidence location. A finishing manifest references that receipt and its hash. Source frames are decoded derivatives. Their manifest preserves integer source PTS ticks and time base alongside floating-point timeline positions. The planner's `cursor`, `camera`, `interaction_regions`, and `scroll_guards` refer to that source coordinate system.

The planner chooses scale from target size and available context. It groups nearby actions, leaves pauses between camera windows, and falls back to wider framing when necessary. It chooses safe crop bounds once per scene before quintic interpolation. It keeps the full camera stationary through each source scroll and its settling period. Cursor movement is an offline reconstruction from observed targets, separate from any page hover behavior.

All outputs require fresh paths. Renderer inputs remain editable copies. Revisions change finishing manifests and produce new derivatives while raw evidence remains sealed. The accepted six-focus Airgoods manifest is retained privately as provenance, not embedded as a general schedule. This skill contains no account-specific selectors, session names, authentication files, account footage, or fixed 36-second timeline.

Raw evidence and source timestamps remain authoritative. Startup alignment needs visual review. The source container's frame presentation times describe delivery to the exported source, not independently measured browser acquisition. Report actual acquisition cadence as unknown unless separately observed.
