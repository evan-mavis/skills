# Record a demo

Use `agent-browser` with `--cursor` for web demos. Honor an explicitly chosen browser. Record and
drive the same run-owned session. Required video needs a visible pointer and click ripple.

## Preflight

Check `agent-browser --version`, `agent-browser record --help`, and the installed CLI's skill.
Require `--cursor` support and working recording dependencies. Report missing support as blocked
proof. Do not install tools while merely maintaining skills.

Cloud bootstrap should pin a tested agent-browser release, install Chrome and its Linux libraries
with `agent-browser install --with-deps`, and install `ffmpeg` with `libvpx` and `libx264`. Verify a
short synthetic recording with visible cursor clicks. Installing estack does not install these tools.
See [installation](https://agent-browser.dev/installation) and [recording](https://agent-browser.dev/recording).

## Capture

Resolve the route and actions from the project's verifier. Authenticate and prepare synthetic
fixtures before recording. Keep account, route, data, viewport, and action identical for bug proof.
Use a unique session and an absolute evidence directory outside the repository. Resolve its
location from the selected project verifier, or use a run-specific directory outside the checkout.

Set `demo_session` and `demo_dir` for this run. Open and prepare the route in that session, then:

```bash
agent-browser --session "$demo_session" set viewport 1280 720
agent-browser --session "$demo_session" record start "$demo_dir/video_demo.mp4" --cursor
agent-browser --session "$demo_session" snapshot -i
```

Confirm the starting state. Use observed refs or semantic locators and re-snapshot after page
changes. Use the same `--session` on every command. Show the action and result with brief pauses,
usually in a 30 to 60 second take. Name bug clips `video_before.mp4` and `video_after.mp4`.

Finalize before closing, including when the scenario fails:

```bash
agent-browser --session "$demo_session" record stop
test -s "$demo_dir/video_demo.mp4"
agent-browser --session "$demo_session" close
```

## Deliver

Play the file and check the starting state, visible cursor clicks, action, and result. Keep
credentials and personal data out of the recording. Preserve failed clips and report their failure.
Screenshots do not replace required video.

Deliver the video through the active Devin session's supported artifact or file upload tool and verify that the user can open it. Do not assume local Markdown paths render in chat. For a PR, upload
through a supported artifact flow and link the durable result. Local paths do not work for remote
reviewers. Keep recordings after session cleanup.
