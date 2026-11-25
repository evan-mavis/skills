import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, dirname, extname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { validateReview } from './validate-review.mjs';
import { formatDecisions, parseDecisions } from './decisions.mjs';
import { decodePng } from './diff-captures.mjs';
import { device, coverageSummary, assertCoverageGate } from './coverage.mjs';
import encodeJpeg from './vendor/jpeg-js-encoder.mjs';

const template = resolve(dirname(fileURLToPath(import.meta.url)), '../assets/round.html');
const OPEN = new Set(['unresolved', 'reopened']);
export const JPEG_QUALITY = 62;
export const HIGH_DENSITY_SCALE = 0.75;
export const ROUND_BUDGET_BYTES = 3_500_000;

function scale(image, factor) {
  const width = Math.round(image.width * factor), height = Math.round(image.height * factor);
  const pixels = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y++) {
    const sy = Math.min(image.height - 1, Math.max(0, (y + 0.5) / factor - 0.5)), y0 = Math.floor(sy), y1 = Math.min(image.height - 1, y0 + 1), fy = sy - y0;
    for (let x = 0; x < width; x++) {
      const sx = Math.min(image.width - 1, Math.max(0, (x + 0.5) / factor - 0.5)), x0 = Math.floor(sx), x1 = Math.min(image.width - 1, x0 + 1), fx = sx - x0;
      for (let c = 0; c < 4; c++) {
        const at = (px, py) => image.pixels[(py * image.width + px) * 4 + c];
        const top = at(x0, y0) * (1 - fx) + at(x1, y0) * fx, bottom = at(x0, y1) * (1 - fx) + at(x1, y1) * fx;
        pixels[(y * width + x) * 4 + c] = Math.round(top * (1 - fy) + bottom * fy);
      }
    }
  }
  return { width, height, pixels };
}

export { device };

export function heading(review) {
  if (review.pr === undefined) return review.feature || review.title;
  return 'PR #' + review.pr + ': ' + (review.feature || review.title);
}

function compress(bytes, side) {
  if (extname(side.src).toLowerCase() !== '.png') return { type: 'jpeg', bytes };
  const dense = side.capture.viewport.deviceScaleFactor >= 2;
  let image = decodePng(bytes);
  if (dense) image = scale(image, HIGH_DENSITY_SCALE);
  const jpeg = encodeJpeg({ width: image.width, height: image.height, data: image.pixels }, JPEG_QUALITY).data;
  if (!dense && jpeg.length >= bytes.length) return { type: 'png', bytes };
  return { type: 'jpeg', bytes: Buffer.from(jpeg) };
}

function seedState(text, review, round, items) {
  const parsed = parseDecisions(text);
  if (parsed.review !== review.title.replace(/\s+/g, ' ').trim() || parsed.round !== round.id) throw new Error('The seed decisions belong to ' + parsed.review + ', ' + parsed.round + ', not ' + round.id);
  const ids = new Set(items.map(entry => entry.id));
  const unknown = parsed.items.filter(entry => !ids.has(entry.id)).map(entry => entry.id);
  if (unknown.length) throw new Error('The seed decisions name comparisons this round does not show: ' + unknown.join(', '));
  return {
    approved: parsed.items.filter(entry => entry.decision === 'approved').map(entry => entry.id),
    comments: Object.fromEntries(parsed.items.filter(entry => entry.comment).map(entry => [entry.id, entry.comment])),
  };
}

export async function buildRound(directory, roundId, { final = false, inline = false, output, seed } = {}) {
  if (!inline && !output) throw new Error('A linked round needs the output path so its images/ folder can sit beside it');
  await validateReview(directory);
  const root = resolve(directory);
  const review = JSON.parse(await readFile(resolve(root, 'review.json'), 'utf8'));
  const place = async (side, entry, comparison, name) => {
    const image = compress(await readFile(resolve(root, side.src)), side);
    if (inline) return 'data:image/' + image.type + ';base64,' + image.bytes.toString('base64');
    const path = ['images', entry.id, comparison.id + '-' + name + (image.type === 'png' ? '.png' : '.jpg')];
    await mkdir(join(dirname(resolve(output)), ...path.slice(0, -1)), { recursive: true });
    await writeFile(join(dirname(resolve(output)), ...path), image.bytes);
    return path.map(encodeURIComponent).join('/');
  };
  const picture = async (side, entry, comparison, name) => side && {
    src: await place(side, entry, comparison, name),
    width: side.width, height: side.height, regions: side.regions,
  };
  const roundIndex = final ? review.rounds.length - 1 : review.rounds.findIndex(round => round.id === roundId);
  if (roundIndex < 0) throw new Error('Unknown round: ' + roundId);
  const round = review.rounds[roundIndex];
  if (final) assertCoverageGate(review);
  const location = new Map();
  for (const entry of review.rounds) for (const comparison of entry.comparisons) location.set(comparison.id, { round: entry, comparison });
  const latest = new Map();
  for (const entry of review.rounds.slice(0, roundIndex + 1)) for (const comparison of entry.comparisons) {
    let origin = comparison.id;
    while (location.get(origin).comparison.revises) origin = location.get(origin).comparison.revises;
    latest.set(origin, { round: entry, comparison });
  }
  const chainHead = id => { let origin = id; while (location.get(origin).comparison.revises) origin = location.get(origin).comparison.revises; return latest.get(origin); };
  const item = async (entry, comparison) => ({
    id: entry.id + '/' + comparison.id, round: entry.label, issueId: comparison.issueId, title: comparison.title,
    explanation: comparison.explanation, lookAt: comparison.lookAt || '', tier: comparison.tier, variant: comparison.variant, device: device(comparison.variant),
    gap: comparison.gap || '', copyDiff: comparison.copyDiff || [],
    approved: comparison.feedback.some(note => note.disposition === 'approved'),
    before: await picture(comparison.before, entry, comparison, 'before'), after: await picture(comparison.after, entry, comparison, 'after'),
  });
  const earlier = [];
  if (!final) for (const entry of review.rounds.slice(0, roundIndex)) for (const comparison of entry.comparisons) for (const note of comparison.feedback) {
    if (!OPEN.has(note.disposition) && note.disposition !== 'fixed') continue;
    const head = chainHead(comparison.id);
    earlier.push({ round: entry.label, title: comparison.title, text: note.text, state: note.disposition === 'fixed' ? 'fixed' : 'open',
      target: head && head.round === round ? round.id + '/' + head.comparison.id : '' });
  }
  const items = final
    ? await Promise.all([...latest.values()].filter(({ comparison }) => !comparison.archived).map(({ round: entry, comparison }) => item(entry, comparison)))
    : await Promise.all(round.comparisons.filter(comparison => !comparison.archived).map(comparison => item(round, comparison)));
  const data = { mode: final ? 'final' : 'round', title: review.title, heading: heading(review), summary: review.summary, groups: review.issues,
    round: { id: round.id, label: final ? 'Final design' : round.label, summary: final ? review.summary : round.summary }, items, earlier, coverage: coverageSummary(review),
    seed: seed === undefined ? null : seedState(seed, review, round, items) };
  const html = (await readFile(template, 'utf8'))
    .replace('__UI_REVIEW_FORMAT__', () => formatDecisions.toString())
    .replace('__UI_REVIEW_DATA__', () => JSON.stringify(data).replace(/</g, '\\u003c'));
  return html;
}

export function highlightCount(html) {
  const { items } = JSON.parse(/<script id="review-data" type="application\/json">(.*?)<\/script>/s.exec(html)[1]);
  return { highlighted: items.filter(item => item.before?.regions.length || item.after?.regions.length).length, total: items.length };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const args = process.argv.slice(2);
  const final = args.includes('--final'), inline = args.includes('--inline');
  const seedAt = args.indexOf('--seed');
  const seedFile = seedAt >= 0 ? args[seedAt + 1] : undefined;
  const [directory, ...rest] = args.filter((arg, index) => arg !== '--final' && arg !== '--inline' && (seedAt < 0 || (index !== seedAt && index !== seedAt + 1)));
  const [roundId, output] = final ? [undefined, rest[0]] : rest;
  try {
    if (!directory || !output || (seedAt >= 0 && !seedFile)) throw new Error('Usage: build-round.mjs <review-directory> <round-id> <output.html> [--inline] [--seed <decisions.txt>] | build-round.mjs <review-directory> --final <output.html> [--inline]');
    const seed = seedFile === undefined ? undefined : await readFile(seedFile, 'utf8');
    await mkdir(dirname(resolve(output)), { recursive: true });
    const html = await buildRound(directory, roundId, { final, inline, output, seed });
    await writeFile(output, html);
    const megabytes = bytes => (bytes / 1e6).toFixed(1) + ' MB';
    const size = Buffer.byteLength(html);
    const { highlighted, total } = highlightCount(html);
    (highlighted ? console.log : console.error)('Highlights: ' + highlighted + ' of ' + total + ' comparisons' + (highlighted ? '.' : '. None of them marks a change. Run diff-captures.mjs --review before you deliver this round.'));
    if (!inline) console.log('Wrote ' + output + ' with its images in ' + join(dirname(output), 'images') + '. Deliver the whole folder.');
    else if (size <= ROUND_BUDGET_BYTES) console.log('Wrote ' + output + ': ' + megabytes(size) + ' of the ' + megabytes(ROUND_BUDGET_BYTES) + ' budget');
    else {
      console.error('Over budget: ' + output + ' is ' + megabytes(size) + ', above the ' + megabytes(ROUND_BUDGET_BYTES) + ' budget. It may not open in the Capy Drive viewer. Build without --inline to write a linked round instead.');
      process.exitCode = 1;
    }
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
