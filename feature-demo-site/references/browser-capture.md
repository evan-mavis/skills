# Browser-frame capture

Use this reference only after loading the host's browser automation. In Codex, prefer Chrome when the coverage matrix calls for video; use the in-app Browser for screenshot-only work, when the user explicitly names it, or when Chrome is unavailable. In Cursor, use its native browser tools or Playwright. Active browser instructions and policy always take precedence over this helper.

## Goal

Capture JPEG frames directly from the live page while the active browser tool performs real interactions, then encode those frames into MP4. This gives deterministic framing, small files, easy retiming, and clean overlays without recording the desktop.

The recorder writes `capture-manifest.json` beside the frames. It stores monotonic timestamps, CDP session IDs, capture settings, and integrity warnings so encoding can preserve real pacing and flag suspicious captures.

## Guardrails

- Use the active browser tool's locators or approved computer-use surface for every interaction.
- Use CDP only for screencast capture and temporary visual overlays on an already allowed page.
- Never use CDP to bypass navigation, policy, authentication, or locator restrictions.
- Obtain fresh DOM evidence before choosing locators. Confirm ambiguous locator counts.
- Remove every injected overlay in `finally`.
- Restore reversible UI state and cancel unsaved forms after the clip.
- Make browser finalization the final browser action.

## Capture setup

1. Create a raw frame directory outside shipped site assets, for example:

   `public/videos/raw/<section>-frames`

2. Resolve `SKILL_DIR` to the absolute directory containing `feature-demo-site/SKILL.md`. When the active browser exposes an allowed CDP session and a persistent Node environment, import the recorder from that directory:

```js
const { pathToFileURL } = await import("node:url");
const skillDir = "<absolute feature-demo-site skill directory>";
const capture = await import(
  pathToFileURL(`${skillDir}/scripts/browser-frame-recorder.mjs`).href,
);
```

3. Obtain a CDP session for the allowed tab using the active browser capability documentation. API names can change; do not guess them. The recorder accepts both listener-based sessions (`on`/`off`) and cursor-based sessions (`readEvents`), including the Chrome plugin's CDP capability. If the host does not expose an allowed CDP session, skip this recorder and use its native recording or screenshot path.

4. Wrap the real browser interaction sequence:

```js
const frameCount = await capture.recordBrowserFlow({
  cdp,
  outputDir: "/absolute/path/public/videos/raw/01-setup-frames",
  perform: async () => {
    await capture.showCaptureOverlayForTarget(cdp, {
      label: "Enable requests and choose locations",
      target: { role: "button", name: "Enable demo requests" },
    });

    await capture.pulseCaptureClick(cdp);
    await pause(90);
    await enabledToggle.click();
    await pause(550);

    await capture.moveCapturePointerToTarget(cdp, {
      label: "Choose one or more locations",
      target: { role: "combobox", name: "Eligible locations" },
    });
    await capture.pulseCaptureClick(cdp);
    await pause(90);
    await locationSelector.click();
    await pause(700);

    await capture.clearCaptureOverlay(cdp);
  },
});
```

The interaction functions and pause helper belong to the active browser session; the recorder only captures the page.

## Clip direction

- Start with a stable orientation frame.
- Use the default friendly cursor (`#6248ff`) and a short caption of 3–8 words. Change `cursorColor` only when the user requests another color or contrast requires it.
- Anchor the cursor to the live control immediately before every click, fill, selection, or submitted action with `showCaptureOverlayForTarget` or `moveCapturePointerToTarget`. Reuse the same role and accessible name already proven by fresh DOM evidence and the browser locator. Use manual `x`/`y` only for non-interactive orientation callouts.
- Move the existing cursor instead of recreating it; the helper animates the move and places the friendly pointer hotspot at the resolved target point.
- Call `pulseCaptureClick` immediately before every real click, pause for roughly 90 ms so the first `#6248ff` ring frame is visible, then click the same target the cursor is anchored to.
- After a click that navigates, closes a dialog, submits a form, or otherwise removes or repositions the target, call `hideCapturePointer` immediately. Reveal it only by target-anchoring it to the next live control; do not leave a cursor floating over the resulting state.
- Pause roughly 400–800 ms after meaningful clicks so state changes remain legible.
- Move through one story beat rather than scanning the entire product.
- Avoid long text entry. Fill representative copy, then cancel or restore it.
- End on the outcome or destination page.

## Encoding

Run:

```bash
SKILL_DIR="<absolute feature-demo-site skill directory>"
"$SKILL_DIR/scripts/encode-capture.sh" \
  /absolute/path/to/01-setup-frames \
  /absolute/path/to/01-setup.mp4
```

When `capture-manifest.json` exists, the encoder uses per-frame timestamps and caps accidental dead time at 1.5 seconds per hold. Override that cap with `FEATURE_DEMO_MAX_HOLD_MS` only when the story needs a longer pause.

For legacy frame folders without a manifest, pass a fallback input FPS as the third argument:

`fps ≈ frame count / desired seconds`

Typical values:

- 4–7 fps for short sparse interactions.
- 8–14 fps for normal navigation and forms.
- 18–30 fps for dense scrolling or long captures that need compression.

The encoder outputs 1440×900, 30 fps, H.264, `yuv420p`, and fast-start MP4.

## Capture modes

Choose capture density to match the interaction:

- **Sparse**: use `everyNthFrame: 2` for clicks separated by stable states.
- **Normal**: use the default `everyNthFrame: 1` for navigation and forms.
- **Motion-heavy**: use `everyNthFrame: 1` and quality 88, then verify animation fidelity. If it still looks stepped, use traditional recording.

Prefer traditional recording for continuous animation, drag-and-drop, audio narration, native dialogs, desktop UI, or demonstrations where natural cursor motion is part of the explanation.

## Integrity review

After capture:

1. Read `capture-manifest.json` warnings. Recapture on timestamp regression, zero frames, or unexplained session-ID gaps.
2. Inspect the first, middle, and last JPEG plus frames immediately before and after each meaningful action. Recapture blank, partially rendered, stale, sensitive, visibly misaligned, or post-action floating-pointer frames.
3. Run the encoder and confirm its reported duration, dimensions, codec, and file size.
4. Play the final MP4 when the user explicitly requests browser or media QA.

## Cleanup

After the new site deployment succeeds:

```bash
SKILL_DIR="<absolute feature-demo-site skill directory>"
"$SKILL_DIR/scripts/cleanup-capture.sh" \
  /absolute/path/public/videos/raw
```

The cleanup helper only accepts clearly named raw or `*-frames` directories and moves them to Trash. Keep raw frames until deployment succeeds.

## Screenshots

When a screenshot is more truthful than video:

- Capture the final stable state at a consistent viewport.
- Use a small border in the site rather than baking a device frame into the image.
- Add explanation in the section caption and bullets, not as dense image annotation.
- Do not synthesize motion from multiple screenshots.
