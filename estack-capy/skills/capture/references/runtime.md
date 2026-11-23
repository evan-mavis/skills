# Runtime and commands

The Capy adapter uses native browser and desktop tools for interaction and recording. It does not install or use agent-browser. Read the current tool schema and the built-in computer-use skill for host-specific behavior. On macOS, use the documented bounded region `screencapture` path. On supported cloud desktops, use `tools.desktop.recording`. No audio is promised.

Finishing requires Python 3.11 or later, Pillow, NumPy, FFmpeg, ffprobe, and an FFmpeg build with libx264. Python pins are in `../requirements.txt`. Provision a separate virtual environment when needed. Installation of this skill does not provision executables or grant recording permissions. `preflight` checks imports, versions, and libx264 without starting a browser or recording.

The macOS window-only path was smoke-tested with `screencapture -x -o -l WINDOW_ID -V 3 OUTPUT.mov`, after inspecting a still from that same window ID. It recorded an isolated animated fixture without surrounding windows. Use a window ID observed for the current run, never a remembered ID. Native cloud recording remains a separate capability to check on the selected cloud machine.

## Commands

| Command | Result |
| --- | --- |
| `preflight` | Reports local finishing dependencies. Does not prove native recording availability. |
| `import-native VIDEO METADATA TAKE [--still IMAGE]` | Copies original files unchanged into a fresh private take and seals their hashes. Repeat `--still` as needed. |
| `seal TAKE FILE...` | Seals existing files relative to TAKE, or verifies an existing receipt. |
| `prepare TAKE FRAMES` | Verifies raw hashes and decodes original presentation timestamps outside TAKE. |
| `plan MANIFEST OUTPUT` | Preserves the source cursor and full framing. Does not infer events. |
| `render MANIFEST OUTPUT.mp4` | Verifies source pixels, renders, fully decodes, and writes derivative provenance. |
| `verify TAKE` | Checks raw evidence hashes. |
| `verify MANIFEST [--video OUTPUT.mp4]` | Checks framing, source binding, and optional derivative integrity and full decode. |

Metadata is a JSON object with `status`, `tool`, `build`, `scenario`, `surface`, `assertions`, and `limitations`. `status` is `completed`, `failed`, or `incomplete`. Use nonempty strings for tool, build, scenario, and surface. Use arrays for assertions and limitations. Assertions describe observed results and their independent evidence, not invented recorder telemetry. Status records the operator's assessment, not an automated proof of the app.

The importer writes `events.json` with an empty event list. It records original video dimensions, native provenance, and unknown acquisition cadence. The renderer preserves source PTS ticks and verifies decoded frames against sealed raw footage. It exports 60fps derivatives without asserting 60fps acquisition. Source files remain private, read-only, and unchanged. Read-only mode is not tamper-proof. Hash receipts detect changes.

Run `python3 -m unittest discover -s tests -v` from this skill directory. Run `python3 scripts/validate_fixture.py --output NEW_DIRECTORY` for a synthetic import, plan, render, and full-decode check. This fixture is not a live native recording or application proof. For live smoke, record a safe local fixture through the actual host-native path and import that take separately. Do not capture private user windows to test availability.
