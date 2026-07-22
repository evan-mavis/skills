import { Buffer } from "node:buffer";
import { performance } from "node:perf_hooks";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const OVERLAY_ID = "__codex_feature_demo_capture_overlay";
const CAPTION_ID = `${OVERLAY_ID}_caption`;
const POINTER_ID = `${OVERLAY_ID}_pointer`;
const MANIFEST_NAME = "capture-manifest.json";
const DEFAULT_CURSOR_COLOR = "#6248ff";

function overlayExpression({
  label,
  x = 36,
  y = 36,
  pointLabel = "",
  cursorColor = DEFAULT_CURSOR_COLOR,
}) {
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
    pointer.style.cssText = "position:absolute;left:${Number(x) - 4}px;top:${Number(y) - 4}px;width:32px;height:40px;opacity:1;filter:drop-shadow(0 3px 6px rgba(45,32,120,.32));transition:left .22s cubic-bezier(.2,.8,.2,1),top .22s cubic-bezier(.2,.8,.2,1),opacity .12s ease";
    pointer.dataset.captureX = ${JSON.stringify(String(Number(x)))};
    pointer.dataset.captureY = ${JSON.stringify(String(Number(y)))};
    const pointerSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    pointerSvg.setAttribute("viewBox", "0 0 36 44");
    pointerSvg.setAttribute("width", "32");
    pointerSvg.setAttribute("height", "40");
    pointerSvg.setAttribute("aria-hidden", "true");
    const pointerPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    pointerPath.setAttribute("data-capture-pointer-fill", "");
    pointerPath.setAttribute("d", "M5.1 3.8c-.9-.5-2 .2-2 1.3v29.2c0 1.3 1.5 1.9 2.4 1l7.4-7.1 4.5 10.7c.4 1 1.5 1.4 2.5 1l4.5-1.9c1-.4 1.4-1.5 1-2.5l-4.5-10.6h10.2c1.2 0 1.8-1.5.9-2.3L5.1 3.8Z");
    pointerPath.setAttribute("fill", ${JSON.stringify(String(cursorColor))});
    pointerPath.setAttribute("stroke", "white");
    pointerPath.setAttribute("stroke-width", "2.4");
    pointerPath.setAttribute("stroke-linecap", "round");
    pointerPath.setAttribute("stroke-linejoin", "round");
    pointerSvg.appendChild(pointerPath);
    pointer.appendChild(pointerSvg);
    pointer.setAttribute("aria-label", ${JSON.stringify(pointLabel)});
    root.appendChild(pointer);

    document.documentElement.appendChild(root);
  })()`;
}

function movePointerExpression({
  label,
  x,
  y,
  pointLabel = "",
  cursorColor,
}) {
  return `(() => {
    const pointer = document.getElementById(${JSON.stringify(POINTER_ID)});
    const caption = document.getElementById(${JSON.stringify(CAPTION_ID)});
    if (!pointer || !caption) throw new Error("Capture overlay is not mounted");
    pointer.style.left = ${JSON.stringify(`${Number(x) - 4}px`)};
    pointer.style.top = ${JSON.stringify(`${Number(y) - 4}px`)};
    pointer.style.opacity = "1";
    pointer.dataset.captureX = ${JSON.stringify(String(Number(x)))};
    pointer.dataset.captureY = ${JSON.stringify(String(Number(y)))};
    ${cursorColor ? `pointer.querySelector("[data-capture-pointer-fill]")?.setAttribute("fill", ${JSON.stringify(String(cursorColor))});` : ""}
    pointer.setAttribute("aria-label", ${JSON.stringify(pointLabel)});
    ${label ? `caption.textContent = ${JSON.stringify(label)};` : ""}
  })()`;
}

function targetPointExpression(target) {
  return `(() => {
    const target = ${JSON.stringify(target)};
    const selectors = {
      button: "button,[role='button'],input[type='button'],input[type='submit']",
      combobox: "select,[role='combobox'],input[list]",
      heading: "h1,h2,h3,h4,h5,h6,[role='heading']",
      link: "a[href],[role='link']",
      radio: "input[type='radio'],[role='radio']",
      tab: "[role='tab']",
      textbox: "textarea,[role='textbox'],input:not([type='button']):not([type='submit']):not([type='radio']):not([type='checkbox']):not([type='hidden'])",
    };
    const normalize = value => String(value || "").replace(/\\s+/g, " ").trim();
    const accessibleName = element => {
      const labelledBy = normalize(element.getAttribute("aria-labelledby"))
        .split(" ")
        .filter(Boolean)
        .map(id => document.getElementById(id)?.textContent || "")
        .join(" ");
      return normalize(
        element.getAttribute("aria-label") ||
          labelledBy ||
          element.getAttribute("alt") ||
          element.getAttribute("title") ||
          element.getAttribute("placeholder") ||
          element.value ||
          element.innerText ||
          element.textContent,
      );
    };
    const selector = target.selector || selectors[target.role];
    if (!selector) return { error: "Target requires a supported role or selector" };
    const expectedName = normalize(target.name);
    const visible = Array.from(document.querySelectorAll(selector)).filter(element => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none";
    });
    const matches = expectedName
      ? visible.filter(element => {
          const actualName = accessibleName(element);
          return target.exact === false
            ? actualName.toLowerCase().includes(expectedName.toLowerCase())
            : actualName === expectedName;
        })
      : visible;
    if (matches.length !== 1) {
      return {
        error: "Expected one visible target, found " + matches.length,
        matchCount: matches.length,
        names: matches.slice(0, 5).map(accessibleName),
      };
    }
    const rect = matches[0].getBoundingClientRect();
    const xRatio = Number.isFinite(Number(target.xRatio)) ? Number(target.xRatio) : 0.5;
    const yRatio = Number.isFinite(Number(target.yRatio)) ? Number(target.yRatio) : 0.5;
    const x = Math.max(4, Math.min(innerWidth - 28, rect.left + rect.width * xRatio + Number(target.offsetX || 0)));
    const y = Math.max(4, Math.min(innerHeight - 36, rect.top + rect.height * yRatio + Number(target.offsetY || 0)));
    return { matchCount: 1, x, y, name: accessibleName(matches[0]) };
  })()`;
}

export async function getCaptureTargetPoint(cdp, target) {
  let lastError = "Unable to resolve capture target";
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const response = await cdp.send("Runtime.evaluate", {
      expression: targetPointExpression(target),
      returnByValue: true,
    });
    const result = response?.result?.value ?? response?.value ?? response;
    if (result && !result.error && Number.isFinite(result.x) && Number.isFinite(result.y)) {
      return result;
    }
    lastError = result?.error || lastError;
    if (attempt < 4) await new Promise(resolve => setTimeout(resolve, 120));
  }
  throw new Error(lastError);
}

export async function showCaptureOverlayForTarget(cdp, { target, ...options }) {
  const point = await getCaptureTargetPoint(cdp, target);
  await showCaptureOverlay(cdp, { ...options, x: point.x, y: point.y });
  return point;
}

export async function moveCapturePointerToTarget(cdp, { target, ...options }) {
  const point = await getCaptureTargetPoint(cdp, target);
  await moveCapturePointer(cdp, { ...options, x: point.x, y: point.y });
  return point;
}

export async function hideCapturePointer(cdp) {
  await cdp.send("Runtime.evaluate", {
    expression: `(() => {
      const pointer = document.getElementById(${JSON.stringify(POINTER_ID)});
      if (pointer) pointer.style.opacity = "0";
    })()`,
    returnByValue: true,
  });
}

export async function pulseCaptureClick(
  cdp,
  { color = DEFAULT_CURSOR_COLOR, durationMs = 420 } = {},
) {
  await cdp.send("Runtime.evaluate", {
    expression: `(() => {
      const root = document.getElementById(${JSON.stringify(OVERLAY_ID)});
      const pointer = document.getElementById(${JSON.stringify(POINTER_ID)});
      if (!root || !pointer) throw new Error("Capture overlay is not mounted");
      const x = Number(pointer.dataset.captureX);
      const y = Number(pointer.dataset.captureY);
      if (!Number.isFinite(x) || !Number.isFinite(y)) throw new Error("Capture pointer position is unavailable");
      const ring = document.createElement("div");
      ring.setAttribute("data-capture-click-ring", "");
      ring.style.cssText = "position:absolute;left:" + (x - 10) + "px;top:" + (y - 10) + "px;width:20px;height:20px;border:3px solid ${String(color)};border-radius:9999px;box-sizing:border-box;opacity:.95;transform:scale(.35);transform-origin:center;filter:drop-shadow(0 1px 2px rgba(45,32,120,.2))";
      root.insertBefore(ring, pointer);
      const animation = ring.animate(
        [
          { opacity: .95, transform: "scale(.35)" },
          { opacity: .7, transform: "scale(1)" },
          { opacity: 0, transform: "scale(2.35)" },
        ],
        { duration: ${Number(durationMs)}, easing: "cubic-bezier(.2,.8,.2,1)", fill: "forwards" },
      );
      animation.finished.finally(() => ring.remove());
    })()`,
    returnByValue: true,
  });
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
  const usesListeners = typeof cdp?.on === "function";
  const usesEventCursor = typeof cdp?.readEvents === "function";
  if (!cdp?.send || (!usesListeners && !usesEventCursor)) {
    throw new Error("A live CDP session with event access is required");
  }
  if (!outputDir || !path.isAbsolute(outputDir)) {
    throw new Error("outputDir must be an absolute path");
  }
  if (typeof perform !== "function") throw new Error("perform must be an async function");

  await mkdir(outputDir, { recursive: true });
  const startedAt = performance.now();
  const frames = [];
  let frameNumber = 0;
  let writes = Promise.resolve();
  let readingEvents = true;
  let eventReader = Promise.resolve();

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

  if (usesListeners) {
    cdp.on("Page.screencastFrame", onFrame);
  } else {
    const initial = await cdp.readEvents({
      methods: ["Page.screencastFrame"],
      limit: 1000,
      timeoutMs: 1,
    });
    let cursor = initial.cursor;

    eventReader = (async () => {
      while (readingEvents) {
        const batch = await cdp.readEvents({
          afterSequence: cursor,
          methods: ["Page.screencastFrame"],
          limit: 1000,
          timeoutMs: 250,
        });
        cursor = batch.cursor;
        for (const event of batch.events) onFrame(event.params ?? {});
        while (batch.hasMore) {
          const next = await cdp.readEvents({
            afterSequence: cursor,
            methods: ["Page.screencastFrame"],
            limit: 1000,
            timeoutMs: 1,
          });
          cursor = next.cursor;
          for (const event of next.events) onFrame(event.params ?? {});
          if (!next.hasMore) break;
        }
      }
    })();
  }

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
    readingEvents = false;
    cdp.off?.("Page.screencastFrame", onFrame);
    await eventReader.catch(() => {});
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
