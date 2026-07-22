import { readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const [frameDir, outputFile] = process.argv.slice(2);
if (!frameDir || !outputFile) {
  console.error("Usage: prepare-frame-timeline.mjs FRAME_DIR OUTPUT_FILE");
  process.exit(2);
}

const manifestPath = path.join(frameDir, "capture-manifest.json");
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const frames = Array.isArray(manifest.frames) ? manifest.frames : [];
if (!frames.length) throw new Error("Capture manifest contains no frames");

const maxHoldMs = Number(process.env.FEATURE_DEMO_MAX_HOLD_MS ?? 1500);
if (!Number.isFinite(maxHoldMs) || maxHoldMs < 100) {
  throw new Error("FEATURE_DEMO_MAX_HOLD_MS must be at least 100");
}

const warnings = [...(manifest.warnings ?? [])];
const deltas = [];

for (let index = 0; index < frames.length; index += 1) {
  const expected = `frame-${String(index + 1).padStart(5, "0")}.jpg`;
  if (frames[index].file !== expected) {
    throw new Error(`Frame sequence mismatch: expected ${expected}, got ${frames[index].file}`);
  }
  await stat(path.join(frameDir, frames[index].file));
  if (index > 0) {
    const delta = Number(frames[index].elapsedMs) - Number(frames[index - 1].elapsedMs);
    if (!Number.isFinite(delta) || delta < 0) {
      throw new Error(`Invalid timestamp before ${frames[index].file}`);
    }
    deltas.push(delta);
    if (delta > maxHoldMs * 2) {
      warnings.push(`Long ${Math.round(delta)}ms gap before ${frames[index].file} was capped`);
    }
  }
}

const sortedDeltas = deltas.filter((delta) => delta > 0).sort((a, b) => a - b);
const medianDelta = sortedDeltas.length
  ? sortedDeltas[Math.floor(sortedDeltas.length / 2)]
  : 500;
const frameDurations = frames.map((_, index) => {
  const raw = index < deltas.length ? deltas[index] : medianDelta;
  return Math.min(maxHoldMs, Math.max(1000 / 30, raw));
});

function quoteForConcat(filename) {
  return filename.replaceAll("'", "'\\''");
}

const lines = [];
for (let index = 0; index < frames.length; index += 1) {
  const absoluteFrame = path.resolve(frameDir, frames[index].file);
  lines.push(`file '${quoteForConcat(absoluteFrame)}'`);
  lines.push(`duration ${(frameDurations[index] / 1000).toFixed(6)}`);
}
lines.push(`file '${quoteForConcat(path.resolve(frameDir, frames.at(-1).file))}'`);
await writeFile(outputFile, `${lines.join("\n")}\n`);

const encodedDurationMs = frameDurations.reduce((total, value) => total + value, 0);
console.log(
  JSON.stringify({
    mode: "timestamped",
    frameCount: frames.length,
    sourceDurationMs: manifest.durationMs,
    encodedDurationMs: Math.round(encodedDurationMs),
    maxHoldMs,
    warnings,
  }),
);
