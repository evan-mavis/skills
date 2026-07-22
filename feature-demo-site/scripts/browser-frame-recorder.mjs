import { Buffer } from "node:buffer";
import { performance } from "node:perf_hooks";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const OVERLAY_ID = "__codex_feature_demo_capture_overlay";
const CAPTION_ID = `${OVERLAY_ID}_caption`;
const POINTER_ID = `${OVERLAY_ID}_pointer`;
const MANIFEST_NAME = "capture-manifest.json";

function overlayExpression({ label, x = 36, y = 36, pointLabel = "" }) {
  return `(() => {
    document.getElementById(${JSON.stringify(OVERLAY_ID)})?.remove();
    const root = document.createElement("div");
    root.id = ${JSON.stringify(OVERLAY_ID)};
    root.style.cssText = "position:fixed;inset:0;z-index:2147483647;pointer-events:none;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif";

    const caption = document.createElement("div");
    caption.id = ${JSON.stringify(CAPTION_ID)};
    caption.textContent = ${JSON.stringify(label)};
    caption.style.cssText = "position:absolute;left:24px;bottom:24px;max-width:560px;padding:10px 14px;border:1px solid rgba(255,255,255,.22);border-radius:8px;background:rgba(20,20,20,.88);color:white;font-size:15px;font-weight:600;line-height:1.35;box-shadow:0 6px 22px rgba(0,0,0,.2)";
    root.appendChild(caption);

    const pointer = document.createElement("div");
    pointer.id = ${JSON.stringify(POINTER_ID)};
    pointer.style.cssText = "position:absolute;left:${Number(x) - 9}px;top:${Number(y) - 9}px;width:18px;height:18px;border:3px solid white;border-radius:999px;background:#eb5757;box-shadow:0 2px 8px rgba(0,0,0,.35);transition:left .22s ease,top .22s ease";
    pointer.setAttribute("aria-label", ${JSON.stringify(pointLabel)});
    root.appendChild(pointer);

    document.documentElement.appendChild(root);
  })()`;
}

function movePointerExpression({ label, x, y, pointLabel = "" }) {
  return `(() => {
    const pointer = document.getElementById(${JSON.stringify(POINTER_ID)});
    const caption = document.getElementById(${JSON.stringify(CAPTION_ID)});
    if (!pointer || !caption) throw new Error("Capture overlay is not mounted");
    pointer.style.left = ${JSON.stringify(`${Number(x) - 9}px`)};
    pointer.style.top = ${JSON.stringify(`${Number(y) - 9}px`)};
    pointer.setAttribute("aria-label", ${JSON.stringify(pointLabel)});
    ${label ? `caption.textContent = ${JSON.stringify(label)};` : ""}
  })()`;
}

function buildWarnings(frames) {
  const warnings = [];
  for (let index = 1; index < frames.length; index += 1) {
    if (frames[index].elapsedMs < frames[index - 1].elapsedMs) {
      warnings.push(`Timestamp regression before ${frames[index].file}`);
    }
    const previousSession = Number(frames[index - 1].sessionId);
    const currentSession = Number(frames[index].sessionId);
    if (
      Number.isFinite(previousSession) &&
      Number.isFinite(currentSession) &&
      currentSession - previousSession > 1
    ) {
      warnings.push(
        `CDP session IDs jump from ${previousSession} to ${currentSession}; review for dropped frames`,
      );
    }
  }
  return warnings;
}

export async function showCaptureOverlay(cdp, options) {
  if (!options?.label) throw new Error("showCaptureOverlay requires a label");
  await cdp.send("Runtime.evaluate", {
    expression: overlayExpression(options),
    returnByValue: true,
  });
}

export async function moveCapturePointer(cdp, options) {
  if (!Number.isFinite(options?.x) || !Number.isFinite(options?.y)) {
    throw new Error("moveCapturePointer requires numeric x and y coordinates");
  }
  await cdp.send("Runtime.evaluate", {
    expression: movePointerExpression(options),
    returnByValue: true,
  });
}

export async function clearCaptureOverlay(cdp) {
  await cdp.send("Runtime.evaluate", {
    expression: `document.getElementById(${JSON.stringify(OVERLAY_ID)})?.remove()`,
    returnByValue: true,
  });
}

export async function recordBrowserFlow({
  cdp,
  outputDir,
  perform,
  quality = 82,
  everyNthFrame = 1,
}) {
  if (!cdp?.send || !cdp?.on) throw new Error("A live CDP session is required");
  if (!outputDir || !path.isAbsolute(outputDir)) {
    throw new Error("outputDir must be an absolute path");
  }
  if (typeof perform !== "function") throw new Error("perform must be an async function");

  await mkdir(outputDir, { recursive: true });
  const startedAt = performance.now();
  const frames = [];
  let frameNumber = 0;
  let writes = Promise.resolve();

  const onFrame = ({ data, sessionId, metadata = {} }) => {
    frameNumber += 1;
    const file = `frame-${String(frameNumber).padStart(5, "0")}.jpg`;
    const filename = path.join(outputDir, file);
    const elapsedMs = performance.now() - startedAt;

    frames.push({
      file,
      elapsedMs: Number(elapsedMs.toFixed(3)),
      sourceTimestampMs: Number.isFinite(Number(metadata.timestamp))
        ? Number((Number(metadata.timestamp) * 1000).toFixed(3))
        : null,
      sessionId,
    });

    writes = writes.then(() => writeFile(filename, Buffer.from(data, "base64")));
    void cdp.send("Page.screencastFrameAck", { sessionId }).catch(() => {});
  };

  cdp.on("Page.screencastFrame", onFrame);

  try {
    await cdp.send("Page.startScreencast", {
      format: "jpeg",
      quality,
      everyNthFrame,
    });
    await perform();
  } finally {
    await clearCaptureOverlay(cdp).catch(() => {});
    await cdp.send("Page.stopScreencast").catch(() => {});
    cdp.off?.("Page.screencastFrame", onFrame);
    await writes;

    const manifest = {
      version: 1,
      createdAt: new Date().toISOString(),
      frameCount: frames.length,
      capture: { format: "jpeg", quality, everyNthFrame },
      durationMs: frames.length ? frames.at(-1).elapsedMs : 0,
      warnings: buildWarnings(frames),
      frames,
    };
    await writeFile(
      path.join(outputDir, MANIFEST_NAME),
      `${JSON.stringify(manifest, null, 2)}\n`,
    );
  }

  if (frameNumber === 0) {
    throw new Error("No screencast frames were captured");
  }

  return frameNumber;
}
