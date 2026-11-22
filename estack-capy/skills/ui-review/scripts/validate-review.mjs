import { readFile, realpath } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';

export function imageDimensions(bytes) {
  if (bytes.length >= 24 && bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
  if (bytes[0] === 255 && bytes[1] === 216) {
    let offset = 2;
    while (offset + 9 < bytes.length) {
      if (bytes[offset++] !== 255) break;
      const marker = bytes[offset++];
      const length = bytes.readUInt16BE(offset);
      if ([192,193,194].includes(marker)) return { width: bytes.readUInt16BE(offset + 5), height: bytes.readUInt16BE(offset + 3) };
      if (length < 2) break;
      offset += length;
    }
  }
  throw new Error('Expected an original PNG or JPEG screenshot');
}

export async function validateReview(directory) {
  const root = await realpath(directory);
  const review = JSON.parse(await readFile(resolve(root, 'review.json'), 'utf8'));
  const require = (condition, message) => { if (!condition) throw new Error(message); };
  const string = (value) => typeof value === 'string' && value.trim().length > 0;
  const hash = (value) => /^[a-f0-9]{64}$/.test(value);
  const ids = new Set();
  const id = (value) => { require(/^[a-zA-Z0-9_-]+$/.test(value) && !ids.has(value), `Invalid or duplicate ID: ${value}`); ids.add(value); };
  const localAsset = async (src) => {
    require(string(src) && !src.startsWith('/') && !src.includes(':') && !/[?#]/.test(src), `Use a packaged relative asset: ${src}`);
    const file = await realpath(resolve(root, src));
    require(file.startsWith(root + sep), `Asset escapes static directory: ${src}`);
    return readFile(file);
  };
  const image = async (item, side) => {
    require(Number.isInteger(item.width) && item.width > 0 && Number.isInteger(item.height) && item.height > 0, 'Invalid capture dimensions');
    const bytes = await localAsset(item.src);
    const dimensions = imageDimensions(bytes);
    require(dimensions.width === item.width && dimensions.height === item.height, `Image dimensions disagree: ${item.src}`);
    require(hash(item.sha256) && createHash('sha256').update(bytes).digest('hex') === item.sha256, `Screenshot hash mismatch: ${item.src}`);
    const c = item.capture;
    require(c && ['authenticated-app', 'component-preview', 'example-fixture'].includes(c.kind), 'Missing capture kind');
    require(/^[a-f0-9]{40}$/.test(c.commit), 'Missing full Git SHA');
    require(c.dirtyPatchSha256 === null || hash(c.dirtyPatchSha256), 'Missing dirty patch identity');
    if (side === 'before') require(c.dirtyPatchSha256 === null, 'Before must use the verified clean baseline');
    for (const key of ['buildEvidence', 'capturedAt', 'tool', 'route', 'role', 'state', 'dataKey']) require(string(c[key]), `Missing provenance: ${key}`);
    require(Number.isFinite(Date.parse(c.capturedAt)), 'Invalid capture time');
    require(c.viewport?.width > 0 && c.viewport?.height > 0 && c.viewport?.deviceScaleFactor > 0 && Number.isFinite(c.scroll?.x) && Number.isFinite(c.scroll?.y), 'Missing viewport or scroll');
    require(Array.isArray(item.regions), 'Missing region list');
    for (const r of item.regions) {
      require([r.x, r.y, r.width, r.height].every(Number.isFinite) && r.x >= 0 && r.y >= 0 && r.width > 0 && r.height > 0 && r.x + r.width <= item.width && r.y + r.height <= item.height && string(r.label), 'Invalid highlight rectangle');
      require(r.width * r.height < item.width * item.height * .9, 'Highlight must identify a meaningful region, not the entire screen');
    }
  };
  require(string(review.title) && string(review.summary) && review.issues?.length && review.rounds?.length, 'Missing review content');
  const issueIds = new Set();
  for (const issue of review.issues) {
    require(string(issue.id) && !issueIds.has(issue.id) && string(issue.title), 'Invalid group');
    require(issue.kind === undefined || ['linear', 'feature', 'ui'].includes(issue.kind), 'Invalid group kind');
    require(issue.url === undefined || /^https:\/\//.test(issue.url), 'Invalid group URL');
    if (issue.kind === 'linear') require(string(issue.url), 'Linear groups require an issue URL');
    issueIds.add(issue.id);
  }
  let count = 0, gaps = 0, missingCaptures = 0;
  for (const round of review.rounds) {
    id(round.id);
    require(string(round.label) && string(round.summary) && round.comparisons?.length, 'Empty round');
    for (const comparison of round.comparisons) {
      id(comparison.id); count++;
      if (string(comparison.gap)) gaps++;
      require(issueIds.has(comparison.issueId) && string(comparison.title) && string(comparison.variant) && string(comparison.explanation), 'Incomplete comparison');
      if (!comparison.before || !comparison.after) { require(string(comparison.gap), 'Missing captures need a visible gap'); missingCaptures++; }
      for (const side of ['before', 'after']) if (comparison[side]) await image(comparison[side], side);
      if (comparison.before && comparison.after) {
        const b = comparison.before.capture, a = comparison.after.capture;
        require(b.commit !== a.commit || b.dirtyPatchSha256 !== a.dirtyPatchSha256, 'Before and After claim the same build');
        for (const key of ['kind', 'route', 'role', 'state', 'dataKey', 'viewport', 'scroll']) require(JSON.stringify(b[key]) === JSON.stringify(a[key]), `Pair mismatch: ${key}`);
      }
      if (comparison.video) await localAsset(comparison.video);
      for (const segment of comparison.copyDiff || []) require(['equal', 'remove', 'add'].includes(segment.type) && typeof segment.text === 'string', 'Invalid text diff');
      require(Array.isArray(comparison.feedback), 'Missing feedback list');
      for (const note of comparison.feedback) require(string(note.source) && string(note.text) && string(note.comparisonId) && ['unresolved', 'approved', 'omitted', 'reopened'].includes(note.disposition), 'Incomplete feedback');
    }
  }
  for (const round of review.rounds) for (const comparison of round.comparisons) for (const note of comparison.feedback) require(ids.has(note.comparisonId), `Unknown feedback target: ${note.comparisonId}`);
  return { comparisons: count, gaps, missingCaptures, provenance: 'Metadata and original bytes checked; verify running builds separately.' };
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try { console.log(JSON.stringify(await validateReview(process.argv[2]), null, 2)); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
