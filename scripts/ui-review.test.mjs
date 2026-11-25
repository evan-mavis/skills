import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm, mkdir, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFile, spawnSync } from 'node:child_process';
import { promisify } from 'node:util';
import { randomBytes } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { validateReview, imageDimensions } from '../estack-capy/skills/ui-review/scripts/validate-review.mjs';
import { diffImages, decodePng, decodeImage, compareCaptures, highlightRegions, highlightReview } from '../estack-capy/skills/ui-review/scripts/diff-captures.mjs';
import encodeJpeg from '../estack-capy/skills/ui-review/scripts/vendor/jpeg-js-encoder.mjs';
import { formatDecisions, parseDecisions, toFixList, renderFixList } from '../estack-capy/skills/ui-review/scripts/decisions.mjs';
import { buildRound, ROUND_BUDGET_BYTES, heading, device, highlightCount } from '../estack-capy/skills/ui-review/scripts/build-round.mjs';
import { encodePng, sha256, screen, capture } from '../estack-capy/skills/ui-review/scripts/test/fixtures.mjs';

const WIDTH = 32;
const HEIGHT = 24;
const basePng = encodePng(WIDTH, HEIGHT, screen([])(WIDTH, HEIGHT));
const headPng = encodePng(WIDTH, HEIGHT, screen([{ x: 8, y: 4, width: 8, height: 8, color: [20, 20, 20] }])(WIDTH, HEIGHT));

const image = (bytes, commit) => ({
  src: 'captures/' + (commit === 'a' ? 'before' : 'after') + '.png',
  width: WIDTH,
  height: HEIGHT,
  sha256: sha256(bytes),
  regions: [{ x: 8, y: 4, width: 8, height: 8, label: 'Reminder' }],
  capture: capture(commit),
});

const comparison = (id, overrides = {}) => ({
  id,
  issueId: 'checkout',
  title: 'Request reminder',
  variant: 'desktop',
  tier: 'judgment',
  explanation: 'The reminder moves beside the price.',
  before: image(basePng, 'a'),
  after: image(headPng, 'b'),
  copyDiff: [{ type: 'remove', text: 'Allow up to 5 days' }, { type: 'add', text: 'Allow up to 7 days' }],
  feedback: [],
  ...overrides,
});

const review = () => ({
  title: 'Example review',
  summary: 'A reminder moves beside the price.',
  issues: [{ id: 'checkout', title: 'Checkout', kind: 'feature' }],
  coverage: {
    base: 'a'.repeat(40),
    head: 'b'.repeat(40),
    changedFiles: ['apps/web/checkout.tsx'],
    notUserVisible: [],
    items: [
      surface('checkout-desktop', 'desktop-web', { comparison: 'reminder' }),
      surface('checkout-mobile', 'mobile-web', { uncovered: 'No seeded cart for the phone layout', waiver: { by: 'Evan', at: '2026-11-25T07:10:00Z', quote: 'skip mobile checkout this round' } }),
    ],
  },
  rounds: [{ id: 'round-1', label: 'Round 1', summary: 'Initial', comparisons: [comparison('reminder')] }],
});

function surface(id, platform, overrides) {
  return { id, app: 'web', surface: 'Checkout', kind: 'route', state: 'filled', role: 'buyer', platform, files: ['apps/web/checkout.tsx'], ...overrides };
}

async function withReview(change, check) {
  const directory = await mkdtemp(join(tmpdir(), 'ui-review-test-'));
  try {
    await mkdir(join(directory, 'captures'));
    await writeFile(join(directory, 'captures/before.png'), basePng);
    await writeFile(join(directory, 'captures/after.png'), headPng);
    const data = review();
    change(data.rounds[0].comparisons[0], data);
    await writeFile(join(directory, 'review.json'), JSON.stringify(data));
    await check(() => validateReview(directory), directory, data);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

test('accepts a review with verified pairs and unchanged assets', () => withReview(() => {}, async run => {
  assert.equal((await run()).comparisons, 1);
}));

for (const [name, change, message] of [
  ['same build labeled Before', c => { c.after.capture.commit = c.before.capture.commit; }, /same build/],
  ['dirty Before', c => { c.before.capture.dirtyPatchSha256 = 'a'.repeat(64); }, /clean baseline/],
  ['mismatched role', c => { c.after.capture.role = 'other'; }, /Pair mismatch/],
  ['altered original bytes', c => { c.after.sha256 = 'a'.repeat(64); }, /hash mismatch/],
  ['wrong capture dimensions', c => { c.after.width = 40; }, /dimensions disagree/],
  ['out of bounds overlay', c => { c.after.regions[0].x = 40; }, /rectangle/],
  ['whole screen highlight', c => { c.after.regions[0] = { x: 0, y: 0, width: WIDTH, height: HEIGHT, label: 'All' }; }, /entire screen/],
  ['missing image without gap', c => { c.before = null; }, /visible gap/],
  ['external asset', c => { c.after.src = 'https://example.com/a.png'; }, /packaged relative/],
  ['invalid copy segment', c => { c.copyDiff[0].type = 'html'; }, /text diff/],
  ['duplicate comparison ID', (c, d) => { d.rounds[0].comparisons.push(c); }, /duplicate ID/],
  ['unknown feedback target', c => { c.feedback.push({ source: 'thread', text: 'Approved', comparisonId: 'unknown', disposition: 'approved' }); }, /Unknown feedback/],
  ['missing tier', c => { c.tier = undefined; }, /Missing tier/],
  ['unknown revision target', c => { c.revises = 'older'; }, /earlier round/],
  ['missing After capture', c => { c.after = null; }, /After screenshot/],
]) test('rejects ' + name, () => withReview(change, run => assert.rejects(run, message)));

test('keeps text-only history only when archived', () => withReview((c, d) => {
  d.coverage.items[0] = surface('checkout-desktop', 'desktop-web', { uncovered: 'Dropped from review' });
  c.before = null;
  c.after = null;
  c.archived = true;
}, async run => assert.equal((await run()).missingCaptures, 0)));

test('reports a gap without failing the review', () => withReview(c => {
  c.before = null;
  c.gap = 'The baseline build cannot start.';
}, async run => {
  const result = await run();
  assert.equal(result.gaps, 1);
  assert.equal(result.missingCaptures, 1);
}));

test('accepts a revision only in a later round', () => withReview((c, d) => {
  c.feedback = [{ source: 'thread', text: 'Move it under the total', comparisonId: 'reminder', disposition: 'fixed' }];
  d.rounds.push({
    id: 'round-2',
    label: 'Round 2',
    summary: 'Fixed reminder',
    comparisons: [comparison('reminder-2', { revises: 'reminder' })],
  });
}, async (run, directory) => {
  assert.equal((await run()).comparisons, 2);
  const html = await buildRound(directory, 'round-2', { inline: true });
  assert.match(html, /Earlier comments/);
  assert.match(html, /Move it under the total/);
  assert.match(html, /data:image\/png;base64,/);
}));

const noRegions = c => { c.before.regions = []; c.after.regions = []; };

for (const [name, change, message] of [
  ['a pair with no highlight regions and no unchanged note', noRegions, /No highlight regions on reminder\. Run diff-captures\.mjs --review/],
  ['an unchanged note beside highlight regions', c => { c.unchanged = 'Nothing moved'; }, /cannot also say nothing changed: reminder/],
  ['an empty unchanged note', c => { noRegions(c); c.unchanged = ' '; }, /Invalid unchanged note: reminder/],
]) test('rejects ' + name, () => withReview(change, run => assert.rejects(run, message)));

test('accepts a pair without regions when its unchanged note says why', () => withReview(c => { noRegions(c); c.unchanged = 'The reminder copy is identical on both sides.'; }, async (run, directory) => {
  assert.equal((await run()).comparisons, 1);
  assert.deepEqual(highlightCount(await buildRound(directory, 'round-1', { inline: true })), { highlighted: 0, total: 1 });
}));

const jpegOf = png => { const { width, height, pixels } = decodePng(png); return Buffer.from(encodeJpeg({ width, height, data: pixels }, 95).data); };

test('decodes JPEG captures and diffs them like PNG', async () => {
  const before = decodeImage(jpegOf(basePng)), after = decodeImage(jpegOf(headPng));
  assert.deepEqual([before.width, before.height, before.pixels.length], [WIDTH, HEIGHT, WIDTH * HEIGHT * 4]);
  const { regions } = diffImages(before, after, { cell: 4, threshold: 24, gap: 1 });
  assert.equal(regions.length, 1);
  assert.ok(regions[0].x <= 8 && regions[0].y <= 4 && regions[0].x + regions[0].width >= 16 && regions[0].y + regions[0].height >= 12);
  assert.throws(() => decodeImage(Buffer.from('GIF89a')), /PNG or JPEG/);
  const directory = await mkdtemp(join(tmpdir(), 'ui-review-jpeg-'));
  try {
    for (const [side, png] of [['base', basePng], ['head', headPng]]) {
      await mkdir(join(directory, side));
      await writeFile(join(directory, side, 'checkout.jpg'), jpegOf(png));
    }
    const result = await compareCaptures(join(directory, 'base'), join(directory, 'head'));
    assert.deepEqual(result.summary, { changed: 1, unchanged: 0, added: 0, removed: 0 });
    assert.equal(result.captures[0].regions[0].id, 'checkout#1');
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('highlight regions drop noise, merge to eight boxes, drop full-screen boxes, and number the rest', () => {
  const box = (x, y, changedPixels = 100, size = 10) => ({ x, y, width: size, height: size, changedPixels });
  const many = Array.from({ length: 12 }, (_, index) => box((index % 4) * 200, Math.floor(index / 4) * 200));
  const merged = highlightRegions({ width: 1000, height: 1000, regions: [...many, box(900, 900, 39)] });
  assert.equal(merged.length, 8);
  assert.ok(merged.every(region => region.x < 900), 'a region under 40 changed pixels is dropped');
  assert.equal(merged.reduce((sum, region) => sum + region.changedPixels, 0), 1200);
  assert.deepEqual(merged.map(region => region.label), Array.from({ length: 8 }, (_, index) => 'Changed area ' + (index + 1)));
  assert.deepEqual(highlightRegions({ width: 100, height: 100, regions: [box(0, 0, 5000, 96), box(0, 0, 40)] }).map(region => [region.x, region.width, region.label]), [[0, 10, 'Changed area 1']]);
});

test('diff-captures --review writes regions into every pair without them', () => withReview((c, d) => {
  noRegions(c);
  d.rounds[0].comparisons.push(comparison('same', { after: { ...image(basePng, 'b'), src: 'captures/before.png', regions: [] }, before: { ...image(basePng, 'a'), regions: [] } }));
}, async (run, directory) => {
  await assert.rejects(run, /No highlight regions on reminder/);
  const result = await highlightReview(directory);
  assert.deepEqual(result, { highlighted: ['reminder'], unchanged: ['same'], kept: [] });
  const data = JSON.parse(await readFile(join(directory, 'review.json'), 'utf8'));
  const written = data.rounds[0].comparisons;
  for (const side of ['before', 'after']) {
    const [region] = written[0][side].regions;
    assert.equal(written[0][side].regions.length, 1);
    assert.equal(region.label, 'Changed area 1');
    assert.ok(region.x <= 8 && region.y <= 4 && region.x + region.width >= 16 && region.y + region.height >= 12);
  }
  assert.deepEqual(written[1].after.regions, []);
  await assert.rejects(run, /No highlight regions on same/);
  written[1].unchanged = 'Both sides render the same reminder.';
  await writeFile(join(directory, 'review.json'), JSON.stringify(data));
  assert.equal((await run()).comparisons, 2);
  assert.deepEqual((await highlightReview(directory)).kept, ['reminder']);
}));

test('rejects unrecognized image bytes', () => assert.throws(() => imageDimensions(Buffer.from('not an image')), /PNG or JPEG/));

test('computes changed regions in original pixels', async () => {
  const before = decodePng(basePng);
  const after = decodePng(headPng);
  const result = diffImages(before, after, { cell: 4, threshold: 24, gap: 1 });
  assert.equal(result.regions.length, 1);
  const [region] = result.regions;
  assert.ok(region.x <= 8 && region.y <= 4, 'region starts at or before the change');
  assert.ok(region.x + region.width >= 16 && region.y + region.height >= 12, 'region covers the change');
  assert.equal(diffImages(before, before).regions.length, 0);
});

test('round trips the copied decisions text', () => {
  const text = formatDecisions({
    title: 'Example review',
    round: 'round-1',
    items: [
      { id: 'round-1/reminder', title: 'Request reminder', approved: true, comment: 'Move it under the total' },
      { id: 'round-1/spacing', title: 'Spacing', approved: false, comment: 'Tighten the gap\nShould the label be bold?' },
    ],
    general: 'Keep the sidebar width.',
  });
  const parsed = parseDecisions(text);
  assert.equal(parsed.review, 'Example review');
  assert.equal(parsed.round, 'round-1');
  assert.equal(parsed.items[0].decision, 'approved');
  assert.equal(parsed.items[0].comment, 'Move it under the total');
  assert.equal(parsed.items[1].comment, 'Tighten the gap\nShould the label be bold?');
  assert.equal(parsed.general, 'Keep the sidebar width.');
});

for (const [name, mutate, message] of [
  ['missing header', text => text.replace('ui-review decisions v1', 'notes'), /No ui-review decisions/],
  ['cut off text', text => text.replace(/\nend\n$/, '\n'), /cut off/],
  ['unknown decision', text => text.replace('decision: approved', 'decision: maybe'), /Unknown decision/],
]) test('rejects decisions with ' + name, () => {
  const text = formatDecisions({ title: 'Example review', round: 'round-1', items: [{ id: 'round-1/reminder', title: 'Reminder', approved: true }] });
  assert.throws(() => parseDecisions(mutate(text)), message);
});

test('rejects a paste for another round or an unknown comparison', () => {
  const data = review();
  const other = formatDecisions({ title: 'Another review', round: 'round-1', items: [{ id: 'round-1/reminder', title: 'Reminder', approved: true }] });
  assert.throws(() => toFixList(parseDecisions(other), data), /another review/);
  const ghost = formatDecisions({ title: data.title, round: 'round-1', items: [{ id: 'round-9/ghost', title: 'Ghost', approved: true }] });
  assert.throws(() => toFixList(parseDecisions(ghost), data), /Unknown item/);
  const late = formatDecisions({ title: data.title, round: 'round-4', items: [{ id: 'round-1/reminder', title: 'Reminder', approved: true }] });
  assert.throws(() => toFixList(parseDecisions(late), data), /Unknown round/);
});

test('turns a pasted round into a fix list', () => {
  const data = review();
  data.rounds[0].comparisons.push(comparison('spacing', { title: 'Card spacing' }));
  const text = formatDecisions({
    title: data.title,
    round: 'round-1',
    items: [
      { id: 'round-1/reminder', title: 'Request reminder', approved: true },
      { id: 'round-1/spacing', title: 'Card spacing', approved: false, comment: 'Tighten the gap\nShould the label be bold?' },
    ],
  });
  const list = toFixList(parseDecisions(text), data);
  assert.deepEqual(list.approved.map(item => item.id), ['round-1/reminder']);
  assert.deepEqual(list.fixes.map(item => item.requests), [['Tighten the gap']]);
  assert.deepEqual(list.questions.map(item => item.text), ['Should the label be bold?']);
  assert.deepEqual(list.missing, []);
  const markdown = renderFixList(list);
  assert.match(markdown, /Tighten the gap/);
  assert.match(markdown, /Questions to answer/);
});

test('treats silence after a review as approval and a missing item as unapproved', () => {
  const data = review();
  data.rounds[0].comparisons.push(comparison('spacing', { title: 'Card spacing' }));
  const text = formatDecisions({ title: data.title, round: 'round-1', items: [{ id: 'round-1/reminder', title: 'Reminder', approved: false }] });
  const list = toFixList(parseDecisions(text), data);
  assert.deepEqual(list.implicitlyApproved.map(item => item.id), ['round-1/reminder']);
  assert.deepEqual(list.missing.map(item => item.id), ['round-1/spacing']);
});

test('builds one self-contained html round with a clipboard fallback', () => withReview(() => {}, async (run, directory) => {
  await run();
  const html = await buildRound(directory, 'round-1', { inline: true });
  assert.match(html, /data:image\/png;base64,/);
  assert.match(html, /Copy all decisions/);
  assert.doesNotMatch(html, /id="export-(?:panel|text|status)"/);
  assert.match(html, /navigator\.clipboard/);
  assert.match(html, /execCommand/);
  assert.match(html, /ui-review decisions v1/);
  assert.doesNotMatch(html, /captures\/before\.png/);
  await assert.rejects(buildRound(directory, 'round-9', { inline: true }), /Unknown round/);
}));

test('the final doc shows the latest revision only', () => withReview((c, d) => {
  d.rounds.push({ id: 'round-2', label: 'Round 2', summary: 'Revised', comparisons: [comparison('reminder-2', { revises: 'reminder', title: 'Request reminder, revised' })] });
}, async (run, directory) => {
  await run();
  const html = await buildRound(directory, undefined, { final: true, inline: true });
  assert.match(html, /Request reminder, revised/);
  assert.doesNotMatch(html, /"title":"Request reminder"/);
  assert.match(html, /Final design/);
}));

test('an end-to-end round parses back into the next fix list', () => withReview((c, d) => {
  c.feedback = [{ source: 'thread', text: 'Move it under the total', comparisonId: 'reminder', disposition: 'fixed' }];
  d.rounds[0].comparisons.push(comparison('spacing', {
    title: 'Card spacing',
    feedback: [{ source: 'thread', text: 'Tighten the gap', comparisonId: 'spacing', disposition: 'unresolved' }],
  }));
  d.rounds.push({
    id: 'round-2',
    label: 'Round 2',
    summary: 'After the first pass',
    comparisons: [
      comparison('reminder-2', { revises: 'reminder' }),
      comparison('spacing-2', { revises: 'spacing', title: 'Card spacing, tightened' }),
    ],
  });
}, async (run, directory) => {
  await run();
  const first = formatDecisions({
    title: 'Example review',
    round: 'round-1',
    items: [
      { id: 'round-1/reminder', title: 'Request reminder', approved: false, comment: 'Move it under the total' },
      { id: 'round-1/spacing', title: 'Card spacing', approved: false, comment: 'Tighten the gap' },
    ],
  });
  await writeFile(join(directory, 'decisions.txt'), first);
  const reviewData = JSON.parse(await readFile(join(directory, 'review.json'), 'utf8'));
  const firstList = toFixList(parseDecisions(first), reviewData);
  assert.equal(firstList.fixes.length, 2);

  const html = await buildRound(directory, 'round-2', { inline: true });
  assert.match(html, /fixed/);
  assert.match(html, /open/);
  assert.match(html, /Move it under the total/);
}));

const buildCli = join(import.meta.dirname, '../estack-capy/skills/ui-review/scripts/build-round.mjs');

async function withCaptures(width, height, pixel, capture, check) {
  await withReview(() => {}, async (run, directory, data) => {
    const before = encodePng(width, height, pixel(1));
    const after = encodePng(width, height, pixel(2));
    await writeFile(join(directory, 'captures/before.png'), before);
    await writeFile(join(directory, 'captures/after.png'), after);
    const c = data.rounds[0].comparisons[0];
    for (const [side, bytes] of [[c.before, before], [c.after, after]]) Object.assign(side, { width, height, sha256: sha256(bytes), capture: { ...side.capture, ...capture } });
    await writeFile(join(directory, 'review.json'), JSON.stringify(data));
    await run();
    await check(directory);
  });
}

const embedded = html => [...html.matchAll(/data:image\/jpeg;base64,([A-Za-z0-9+/=]+)/g)].map(match => imageDimensions(Buffer.from(match[1], 'base64')));

test('embeds 2x captures as JPEG at 75% and leaves the original PNGs alone', () => withCaptures(390, 844, seed => (x, y) => [(x * seed) & 255, (y * seed) & 255, 128],
  { viewport: { width: 195, height: 422, deviceScaleFactor: 2 } }, async directory => {
    const original = await readFile(join(directory, 'captures/after.png'));
    const html = await buildRound(directory, 'round-1', { inline: true });
    assert.deepEqual(embedded(html), [{ width: 293, height: 633 }, { width: 293, height: 633 }]);
    assert.match(html, /"width":390,"height":844/);
    assert.deepEqual(await readFile(join(directory, 'captures/after.png')), original);
  }));

test('reports the round size and fails above the budget', async () => {
  const run = directory => promisify(execFile)(process.execPath, [buildCli, directory, 'round-1', join(directory, 'round.html'), '--inline']);
  await withReview(() => {}, async (validate, directory) => {
    const { stdout } = await run(directory);
    assert.match(stdout, /MB of the 3\.5 MB budget/);
  });
  const noise = () => { const bytes = randomBytes(1400 * 1100 * 3); return (x, y) => bytes.subarray((y * 1400 + x) * 3, (y * 1400 + x) * 3 + 3); };
  await withCaptures(1400, 1100, noise, {}, async directory => {
    const failure = await run(directory).then(() => null, error => error);
    assert.ok(failure, 'build should exit non-zero over budget');
    assert.match(failure.stderr, /Over budget: .* is \d+\.\d MB, above the 3\.5 MB budget/);
    assert.ok((await readFile(join(directory, 'round.html'))).length > ROUND_BUDGET_BYTES);
  });
});

const linkedSources = html => [...html.matchAll(/"src":"([^"]+)"/g)].map(match => match[1]);

test('a linked round writes relative image paths that resolve beside the html', () => withReview((c, d) => {
  d.rounds.push({ id: 'round-2', label: 'Round 2', summary: 'Revised', comparisons: [comparison('reminder-2', { revises: 'reminder' })] });
}, async (run, directory) => {
  await run();
  const output = join(directory, 'rounds/round-2/round-2.html');
  await mkdir(join(directory, 'rounds/round-2'), { recursive: true });
  const html = await buildRound(directory, 'round-2', { output });
  assert.doesNotMatch(html, /data:/);
  const sources = linkedSources(html);
  assert.deepEqual(sources, ['images/round-2/reminder-2-before.png', 'images/round-2/reminder-2-after.png']);
  for (const src of sources) {
    const bytes = await readFile(join(directory, 'rounds/round-2', src));
    assert.deepEqual(imageDimensions(bytes), { width: WIDTH, height: HEIGHT });
  }
  await assert.rejects(buildRound(directory, 'round-2'), /needs the output path/);
}));

test('a linked round keeps the compression and writes 2x captures as 75% JPEG files', () => withCaptures(390, 844, seed => (x, y) => [(x * seed) & 255, (y * seed) & 255, 128],
  { viewport: { width: 195, height: 422, deviceScaleFactor: 2 } }, async directory => {
    const output = join(directory, 'out/round-1.html');
    await mkdir(join(directory, 'out'));
    const html = await buildRound(directory, 'round-1', { output });
    assert.doesNotMatch(html, /data:/);
    const sources = linkedSources(html);
    assert.deepEqual(sources, ['images/round-1/reminder-before.jpg', 'images/round-1/reminder-after.jpg']);
    for (const src of sources) assert.deepEqual(imageDimensions(await readFile(join(directory, 'out', src))), { width: 293, height: 633 });
  }));

test('the CLI builds linked by default without the inline budget', async () => {
  const noise = () => { const bytes = randomBytes(1400 * 1100 * 3); return (x, y) => bytes.subarray((y * 1400 + x) * 3, (y * 1400 + x) * 3 + 3); };
  await withCaptures(1400, 1100, noise, {}, async directory => {
    const output = join(directory, 'rounds/round-1/round-1.html');
    const { stdout } = await promisify(execFile)(process.execPath, [buildCli, directory, 'round-1', output]);
    assert.match(stdout, /Deliver the whole folder/);
    const html = await readFile(output, 'utf8');
    assert.doesNotMatch(html, /data:/);
    for (const src of linkedSources(html)) assert.ok((await readFile(join(directory, 'rounds/round-1', src))).length > 0);
  });
});

test('the build CLI prints how many comparisons carry highlights', () => withReview(() => {}, async (run, directory) => {
  const output = join(directory, 'rounds/round-1/round-1.html');
  const { stdout } = await promisify(execFile)(process.execPath, [buildCli, directory, 'round-1', output]);
  assert.match(stdout, /Highlights: 1 of 1 comparisons\./);
}));

test('the build CLI flags a round where no comparison carries a highlight', () => withReview(c => { noRegions(c); c.unchanged = 'Nothing visible changed.'; }, async (run, directory) => {
  const output = join(directory, 'rounds/round-1/round-1.html');
  const { stderr } = await promisify(execFile)(process.execPath, [buildCli, directory, 'round-1', output]);
  assert.match(stderr, /Highlights: 0 of 1 comparisons\. None of them marks a change\. Run diff-captures\.mjs --review/);
}));

test('keeps the sidebar beside the comparisons down to 600px', () => withReview(() => {}, async (run, directory) => {
  const html = await buildRound(directory, 'round-1', { inline: true });
  assert.match(html, /@media \(max-width: 600px\) \{ body \{ grid-template-columns: 1fr; \}/);
  assert.doesNotMatch(html, /max-width: 880px/);
}));

const chrome = [process.env.CHROME_PATH, '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', 'google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser']
  .find(candidate => candidate && spawnSync(candidate, ['--version']).status === 0);

const designReview = (c, d) => {
  d.pr = 12;
  d.feature = 'Reminders';
  d.rounds[0].comparisons.push(
    comparison('spacing', { title: 'Card spacing on a phone', variant: 'mobile 390' }),
    comparison('tablet', { title: 'Tablet layout', variant: 'tablet' }),
  );
  d.coverage.items[1] = surface('checkout-mobile', 'mobile-web', { comparison: 'spacing' });
};

test('validates the optional PR number and feature name', async () => {
  await withReview(designReview, async run => assert.equal((await run()).comparisons, 3));
  for (const [, change, message] of [
    ['a PR number that is not a positive integer', d => { d.pr = '12'; }, /Invalid PR number/],
    ['an empty feature name', d => { d.feature = ' '; }, /Invalid feature name/],
  ]) await withReview((c, d) => change(d), run => assert.rejects(run, message));
});

test('the sidebar title is display text and the export keeps the review title', () => withReview(designReview, async (run, directory) => {
  const html = await buildRound(directory, 'round-1', { inline: true });
  const data = JSON.parse(/<script id="review-data" type="application\/json">(.*?)<\/script>/s.exec(html)[1]);
  assert.equal(data.heading, 'PR #12: Reminders');
  assert.equal(data.title, 'Example review');
  assert.deepEqual(data.items.map(item => item.device), ['desktop', 'mobile', 'tablet']);
  assert.equal(heading({ title: 'Example review', pr: 7 }), 'PR #7: Example review');
  assert.equal(heading({ title: 'Example review' }), 'Example review');
  assert.equal(device('Phone 390'), 'mobile');
}));

test('the round drops the counter, general notes, closing note, tier badge, and row status', () => withReview(() => {}, async (run, directory) => {
  const html = await buildRound(directory, 'round-1', { inline: true });
  for (const removed of [/id="progress"/, /id="general"/, /Notes on the whole review/, /Copy your decisions before closing/, /class="tier"/, /class="dot/, /Looks good to me/, /prefers-color-scheme: dark/]) assert.doesNotMatch(html, removed);
  assert.match(html, /<label class="looks-good"><span>Looks good<\/span><input type="checkbox" id="approve"><\/label>/);
  assert.match(html, /--accent: #6248FF;/);
}));

test('decisions without a general line still parse into a fix list', () => {
  const text = formatDecisions({ title: 'Example review', round: 'round-1', items: [{ id: 'round-1/reminder', title: 'Reminder', approved: true }] });
  assert.doesNotMatch(text, /general:/);
  const parsed = parseDecisions(text);
  assert.equal(parsed.general, '');
  assert.deepEqual(toFixList(parsed, review()).approved.map(item => item.id), ['round-1/reminder']);
});

const harness = String.raw`<script>
(async () => {
  const wait = ms => new Promise(done => setTimeout(done, ms));
  const key = (name, options = {}) => window.dispatchEvent(new KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true, ...options }));
  const state = () => ({ current, approved: [...approved] });
  const result = { heading: el('title').textContent, rows: [...document.querySelectorAll('#nav .row')].map(row => ({ icon: !!row.querySelector('svg'), title: row.textContent, native: row.hasAttribute('title') || !!row.querySelector('[title], input') })) };
  await wait(500); result.images = [...el('pair').querySelectorAll('img')].map(img => [img.getAttribute('src').startsWith('images/'), img.loading, img.complete && img.naturalWidth > 0]);
  key('a'); result.aKey = state(); await wait(200); result.aKeyLater = state();
  go(0); key('a'); await wait(200); result.uncheck = state();
  key('a'); key('a'); await wait(200); result.quickUncheck = state();
  key('a', { metaKey: true }); key('a', { ctrlKey: true }); key('a', { altKey: true }); result.modifiers = state();
  el('comment').focus(); key('a'); result.inComment = state(); el('comment').blur();
  el('approve').click(); result.click = { ...state(), focused: document.activeElement === el('approve') }; await wait(200); result.clickLater = state();
  key('ArrowRight'); result.arrow = state();
  el('approve').click(); await wait(200); result.last = state();
  go(0);
  document.querySelector('#pair .shot[data-side="1"]').click();
  result.lightbox = { open: !el('lightbox').hidden, side: el('lightbox').querySelector('.shot').dataset.side, buttons: el('lightbox').querySelectorAll('button').length };
  key('ArrowLeft'); result.lightboxLeft = { side: el('lightbox').querySelector('.shot').dataset.side, current };
  key('ArrowRight'); result.lightboxRight = el('lightbox').querySelector('.shot').dataset.side;
  key('Escape'); result.escape = el('lightbox').hidden;
  document.querySelector('#pair .shot[data-side="0"]').click(); el('lightbox').click(); result.clickClose = el('lightbox').hidden;
  const handle = el('resize'), width = () => getComputedStyle(document.querySelector('aside')).width;
  result.sidebar = [width()];
  handle.dispatchEvent(new PointerEvent('pointerdown', { clientX: 20, pointerId: 1, bubbles: true })); result.sidebar.push(width());
  handle.dispatchEvent(new PointerEvent('pointermove', { clientX: 2000, pointerId: 1, bubbles: true })); result.sidebar.push(width());
  handle.dispatchEvent(new PointerEvent('pointermove', { clientX: 320, pointerId: 1, bubbles: true })); result.sidebar.push(width());
  handle.dispatchEvent(new PointerEvent('pointerup', { clientX: 320, pointerId: 1, bubbles: true }));
  handle.dispatchEvent(new MouseEvent('dblclick', { bubbles: true })); result.sidebar.push(width());
  document.querySelectorAll('#nav .row')[1].dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
  result.tip = { shown: !el('tip').hidden, text: el('tip').textContent };
  const visible = () => [...document.body.querySelectorAll('*')].filter(node => node.getClientRects().length && node.getBoundingClientRect().right > 0 && getComputedStyle(node).opacity !== '0').length;
  const shown = visible();
  let clipboard = null;
  navigator.clipboard.writeText = async text => { clipboard = text; };
  el('export').click(); await wait(50);
  result.copy = { label: el('export').textContent, added: visible() - shown, panel: !!document.querySelector('#export-panel, #export-text, #export-status') };
  await wait(1700); result.copy.labelLater = el('export').textContent;
  result.exported = clipboard;
  navigator.clipboard.writeText = async () => { throw new Error('blocked'); };
  let fallback = null;
  document.execCommand = command => { const box = document.activeElement; fallback = { command, text: box.value, offscreen: box.getBoundingClientRect().right <= 0 }; return true; };
  el('export').click(); await wait(50);
  result.fallback = { ...fallback, label: el('export').textContent, added: visible() - shown, textareas: document.querySelectorAll('textarea').length };
  document.execCommand = () => false;
  el('export').click(); await wait(50);
  result.failed = { label: el('export').textContent, added: visible() - shown, textareas: document.querySelectorAll('textarea').length };
  await wait(1700); result.failed.labelLater = el('export').textContent;
  const output = document.createElement('output');
  output.id = 'results';
  output.textContent = JSON.stringify(result);
  document.body.append(output);
})();
</script>`;

test('drives the round in a browser: Looks good, the A key, the lightbox, resizing, the tooltip, and copy', { skip: !chrome && 'no Chrome found; set CHROME_PATH' }, () => withReview(designReview, async (run, directory) => {
  const page = join(directory, 'round.html');
  await writeFile(page, (await buildRound(directory, 'round-1', { output: page })).replace('</body>', harness + '</body>'));
  const profile = await mkdtemp(join(tmpdir(), 'ui-review-chrome-'));
  try {
    const { stdout } = await promisify(execFile)(chrome, ['--headless=new', '--disable-gpu', '--no-sandbox', '--no-first-run', '--user-data-dir=' + profile, '--window-size=1200,900', '--virtual-time-budget=10000', '--dump-dom', pathToFileURL(page).href], { maxBuffer: 64 * 1024 * 1024 });
    const match = /<output id="results">(.*?)<\/output>/s.exec(stdout);
    assert.ok(match, 'the harness did not finish');
    const result = JSON.parse(match[1].replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&'));
    const [first, second, third] = ['round-1/reminder', 'round-1/spacing', 'round-1/tablet'];
    assert.equal(result.heading, 'PR #12: Reminders');
    assert.deepEqual(result.images, [[true, 'lazy', true], [true, 'lazy', true]]);
    assert.deepEqual(result.rows.map(row => [row.icon, row.title, row.native]), [[true, 'Request reminder', false], [true, 'Card spacing on a phone', false], [true, 'Tablet layout', false]]);
    assert.deepEqual(result.aKey, { current: 0, approved: [first] });
    assert.deepEqual(result.aKeyLater, { current: 1, approved: [first] });
    assert.deepEqual(result.uncheck, { current: 0, approved: [] });
    assert.deepEqual(result.quickUncheck, { current: 0, approved: [] });
    assert.deepEqual(result.modifiers, { current: 0, approved: [] });
    assert.deepEqual(result.inComment, { current: 0, approved: [] });
    assert.deepEqual(result.click, { current: 0, approved: [first], focused: false });
    assert.deepEqual(result.clickLater, { current: 1, approved: [first] });
    assert.deepEqual(result.arrow, { current: 2, approved: [first] });
    assert.deepEqual(result.last, { current: 2, approved: [first, third] });
    assert.deepEqual(result.lightbox, { open: true, side: '1', buttons: 0 });
    assert.deepEqual(result.lightboxLeft, { side: '0', current: 0 });
    assert.equal(result.lightboxRight, '1');
    assert.equal(result.escape, true);
    assert.equal(result.clickClose, true);
    assert.deepEqual(result.sidebar, ['268px', '180px', '560px', '320px', '268px']);
    assert.deepEqual(result.tip, { shown: true, text: 'Card spacing on a phonemobile' });
    assert.deepEqual(result.copy, { label: 'Copied', added: 0, panel: false, labelLater: 'Copy all decisions' });
    assert.deepEqual(result.fallback, { command: 'copy', text: result.exported, offscreen: true, label: 'Copied', added: 0, textareas: 1 });
    assert.deepEqual(result.failed, { label: 'Copy failed', added: 0, textareas: 1, labelLater: 'Copy all decisions' });
    assert.match(result.exported, /^ui-review decisions v1\nreview: Example review\nround: round-1\n/);
    const list = toFixList(parseDecisions(result.exported), JSON.parse(await readFile(join(directory, 'review.json'), 'utf8')));
    assert.deepEqual(list.approved.map(item => item.id), [first, third]);
    assert.deepEqual(list.implicitlyApproved.map(item => item.id), [second]);
    assert.equal(list.general.length, 0);
  } finally {
    await rm(profile, { recursive: true, force: true });
  }
}));

for (const [name, change, message] of [
  ['a review without an inventory', d => { delete d.coverage; }, /Missing coverage inventory/],
  ['an empty inventory', d => { d.coverage.items = []; }, /Empty coverage inventory/],
  ['a changed UI file in no item', d => { d.coverage.changedFiles.push('apps/mobile/Cart.tsx'); }, /Changed UI files in no inventory item.*apps\/mobile\/Cart\.tsx/],
  ['an item file outside the diff', d => { d.coverage.items[0].files = ['apps/web/other.tsx']; }, /must come from coverage\.changedFiles/],
  ['an item with a comparison and an uncovered reason', d => { d.coverage.items[0].uncovered = 'Also missing'; }, /not both/],
  ['an item with neither', d => { delete d.coverage.items[1].uncovered; delete d.coverage.items[1].waiver; }, /not both/],
  ['an unknown comparison', d => { d.coverage.items[0].comparison = 'ghost'; }, /missing, archived, or uncaptured/],
  ['an archived comparison', (d, c) => { c.archived = true; }, /missing, archived, or uncaptured/],
  ['a platform that disagrees with the variant', d => { d.coverage.items[1] = surface('checkout-mobile', 'mobile-web', { comparison: 'reminder' }); }, /disagrees with the comparison variant/],
  ['a desktop item without a mobile twin', d => { d.coverage.items.pop(); }, /needs a mobile-web item/],
  ['a mobile item without a desktop twin', d => { d.coverage.items[0] = surface('checkout-native', 'native', { comparison: 'reminder' }); }, /needs a desktop-web item/],
  ['an unknown platform', d => { d.coverage.items[0].platform = 'watch'; }, /Incomplete inventory item/],
  ['an item without a role', d => { d.coverage.items[0].role = ''; }, /Incomplete inventory item/],
  ['a waiver without the reviewer\'s words', d => { delete d.coverage.items[1].waiver.quote; }, /A waiver needs/],
  ['a waiver on a captured item', d => { d.coverage.items[0].waiver = { by: 'Evan', at: '2026-11-25T07:10:00Z', quote: 'fine' }; }, /A waiver needs an uncovered item/],
  ['a not-user-visible file without a reason', d => { d.coverage.changedFiles.push('apps/web/types.tsx'); d.coverage.notUserVisible.push({ file: 'apps/web/types.tsx', reason: ' ' }); }, /Not user-visible needs/],
  ['a duplicate inventory id', d => { d.coverage.items[1].id = 'checkout-desktop'; }, /duplicate inventory ID/],
]) test('coverage rejects ' + name, () => withReview((c, d) => change(d, c), run => assert.rejects(run, message)));

test('reports inventory against captured', () => withReview((c, d) => {
  d.coverage.changedFiles.push('apps/web/types.tsx');
  d.coverage.notUserVisible.push({ file: 'apps/web/types.tsx', reason: 'Type-only module' });
  d.coverage.items.push(surface('receipt-native', 'native', { surface: 'Receipt', uncovered: 'No Mac with the iOS Simulator was online' }));
}, async run => {
  const { coverage } = await run();
  assert.deepEqual([coverage.inventory, coverage.captured, coverage.waived, coverage.uncovered], [3, 1, 1, 1]);
  assert.deepEqual(coverage.open.map(entry => entry.id), ['receipt-native']);
}));

test('the final doc is gated on every inventory item being captured or waived', () => withReview((c, d) => {
  delete d.coverage.items[1].waiver;
}, async (run, directory, data) => {
  await run();
  const html = await buildRound(directory, 'round-1', { inline: true });
  const round = JSON.parse(/<script id="review-data" type="application\/json">(.*?)<\/script>/s.exec(html)[1]);
  assert.deepEqual(round.coverage.gaps.map(gap => [gap.id, gap.status, gap.reason]), [['checkout-mobile', 'uncovered', 'No seeded cart for the phone layout']]);
  assert.match(html, /Not captured · /);
  await assert.rejects(buildRound(directory, undefined, { final: true, inline: true }), /Coverage gate: 1 of 2 inventory items are uncaptured without a recorded waiver: checkout-mobile/);
  data.coverage.items[1].waiver = { by: 'Evan', at: '2026-11-25T07:10:00Z', quote: 'skip it' };
  await writeFile(join(directory, 'review.json'), JSON.stringify(data));
  assert.match(await buildRound(directory, undefined, { final: true, inline: true }), /Final design/);
}));

test('the sidebar lists comparisons first and collapses the uncaptured items last', { skip: !chrome && 'no Chrome found; set CHROME_PATH' }, () => withReview((c, d) => {
  delete d.coverage.items[1].waiver;
}, async (run, directory) => {
  const page = join(directory, 'round.html');
  await writeFile(page, await buildRound(directory, 'round-1', { output: page }));
  const profile = await mkdtemp(join(tmpdir(), 'ui-review-chrome-'));
  try {
    const { stdout } = await promisify(execFile)(chrome, ['--headless=new', '--disable-gpu', '--no-sandbox', '--no-first-run', '--user-data-dir=' + profile, '--window-size=1200,900', '--virtual-time-budget=10000', '--dump-dom', pathToFileURL(page).href], { maxBuffer: 64 * 1024 * 1024 });
    const nav = /<nav id="nav"[^>]*>(.*?)<\/nav>/s.exec(stdout)[1];
    const comparison = nav.indexOf('<a class="row"'), gap = nav.indexOf('data-gap=');
    assert.ok(comparison >= 0 && gap > comparison, 'the first comparison comes before any uncaptured row');
    const gaps = /<details([^>]*)><summary>([^<]*)<\/summary>(?:(?!<\/details>).)*data-gap=/s.exec(nav.slice(nav.lastIndexOf('<details')));
    assert.equal(gaps[1], '');
    assert.equal(gaps[2], 'Not captured · 1');
  } finally {
    await rm(profile, { recursive: true, force: true });
  }
}));

test('the fix list ends with the coverage count and each gap', () => {
  const data = review();
  const text = formatDecisions({ title: data.title, round: 'round-1', items: [{ id: 'round-1/reminder', title: 'Reminder', approved: true }] });
  const markdown = renderFixList(toFixList(parseDecisions(text), data));
  assert.match(markdown, /## Coverage\n\n1 of 2 inventory items captured, 1 waived, 0 uncovered\./);
  assert.match(markdown, /- waived: web Checkout, filled, buyer \(checkout-mobile, mobile-web\): No seeded cart for the phone layout Waived by Evan: "skip mobile checkout this round"/);
});

const coverageCli = join(import.meta.dirname, '../estack-capy/skills/ui-review/scripts/coverage.mjs');

test('coverage.mjs records the changed UI files and fails on unmapped ones', async () => {
  const repo = await mkdtemp(join(tmpdir(), 'ui-review-repo-'));
  const git = (...args) => spawnSync('git', ['-C', repo, '-c', 'user.name=test', '-c', 'user.email=test@example.com', ...args], { encoding: 'utf8' }).stdout.trim();
  const put = async (file, text) => { await mkdir(join(repo, file, '..'), { recursive: true }); await writeFile(join(repo, file), text); };
  try {
    git('init', '-q');
    await put('apps/web/Page.tsx', 'a');
    git('add', '.'); git('commit', '-qm', 'base');
    const base = git('rev-parse', 'HEAD');
    for (const file of ['apps/web/Page.tsx', 'apps/web/Page.test.tsx', 'apps/mobile/Cart.tsx', 'apps/api/route.ts']) await put(file, 'b');
    git('add', '.'); git('commit', '-qm', 'head');
    const head = git('rev-parse', 'HEAD');
    await withReview((c, d) => {
      Object.assign(d.coverage, { base, head, changedFiles: [] });
      d.coverage.items.forEach(entry => { entry.files = ['apps/web/Page.tsx']; });
    }, async (run, directory) => {
      const cli = (...args) => spawnSync(process.execPath, [coverageCli, directory, repo, ...args], { encoding: 'utf8' });
      const stale = cli();
      assert.equal(stale.status, 1);
      assert.match(stale.stderr, /stale or missing/);
      const first = cli('--write');
      assert.equal(first.status, 1);
      assert.match(first.stdout, /Changed UI files: 2 \(apps\/mobile 1, apps\/web 1\)/);
      assert.match(first.stderr, /1 changed UI files are in no inventory item[\s\S]*apps\/mobile\/Cart\.tsx/);
      const data = JSON.parse(await readFile(join(directory, 'review.json'), 'utf8'));
      assert.deepEqual(data.coverage.changedFiles, ['apps/mobile/Cart.tsx', 'apps/web/Page.tsx']);
      data.coverage.items.push(surface('cart-native', 'native', { app: 'mobile', surface: 'Cart', files: ['apps/mobile/Cart.tsx'], uncovered: 'No Mac with the iOS Simulator was online' }));
      await writeFile(join(directory, 'review.json'), JSON.stringify(data));
      const second = cli();
      assert.equal(second.status, 0, second.stderr);
      assert.match(second.stdout, /Inventory 3: captured 1, waived 1, uncovered 1/);
      assert.match(second.stdout, /uncovered: cart-native \(native\) No Mac/);
      assert.equal((await run()).coverage.uncovered, 1);
    });
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

const STATE_KEY = 'ui-review-state:Example review:round-1';
const stateHarness = String.raw`<script>
(async () => {
  const wait = ms => new Promise(done => setTimeout(done, ms));
  const phase = new URLSearchParams(location.search).get('phase');
  if (phase === 'mark') {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true, cancelable: true }));
    await wait(200);
    go(2);
    el('comment').value = 'Tighten the gap\nMatch the card radius';
    el('comment').dispatchEvent(new Event('input', { bubbles: true }));
  }
  await wait(100);
  go(0);
  const output = document.createElement('output');
  output.id = 'results';
  output.textContent = JSON.stringify({ title: el('item-title').textContent, approved: [...approved], comments: Object.fromEntries([...comments].filter(([, text]) => text)), checked: el('approve').checked, stored: localStorage.getItem('${STATE_KEY}') });
  document.body.append(output);
})();
</script>`;

async function openRound(page, profile, query = '') {
  const { stdout } = await promisify(execFile)(chrome, ['--headless=new', '--disable-gpu', '--no-sandbox', '--no-first-run', '--user-data-dir=' + profile, '--window-size=1200,900', '--virtual-time-budget=10000', '--dump-dom', pathToFileURL(page).href + query], { maxBuffer: 64 * 1024 * 1024 });
  const match = /<output id="results">(.*?)<\/output>/s.exec(stdout);
  assert.ok(match, 'the harness did not finish');
  return JSON.parse(match[1].replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&'));
}

async function withRoundPage(directory, { before = '', seed } = {}, check) {
  const page = join(directory, 'round.html');
  const html = await buildRound(directory, 'round-1', { output: page, seed });
  await writeFile(page, html.replace('<script id="review-data"', before + '<script id="review-data"').replace('</body>', stateHarness + '</body>'));
  const profile = await mkdtemp(join(tmpdir(), 'ui-review-chrome-'));
  try { await check(query => openRound(page, profile, query)); } finally { await rm(profile, { recursive: true, force: true }); }
}

test('marks and comments autosave and survive a reload', { skip: !chrome && 'no Chrome found; set CHROME_PATH' }, () => withReview(designReview, async (run, directory) => withRoundPage(directory, {}, async open => {
  const marked = await open('?phase=mark');
  const expected = { approved: ['round-1/reminder'], comments: { 'round-1/tablet': 'Tighten the gap\nMatch the card radius' } };
  assert.deepEqual(JSON.parse(marked.stored), expected);
  const reloaded = await open();
  assert.deepEqual({ approved: reloaded.approved, comments: reloaded.comments }, expected);
  assert.equal(reloaded.checked, true);
})));

test('ignores stored state that does not parse or names missing comparisons', { skip: !chrome && 'no Chrome found; set CHROME_PATH' }, async () => {
  for (const value of ['{not json', '"text"', 'null', '[]', JSON.stringify({ approved: 'round-1/reminder', comments: {} }), JSON.stringify({ approved: [], comments: [] }), JSON.stringify({ approved: ['round-1/ghost'], comments: {} }), JSON.stringify({ approved: ['round-1/reminder'], comments: { 'round-0/gone': 'Old note' } }), JSON.stringify({ approved: [], comments: { 'round-1/reminder': 7 } })]) {
    await withReview(designReview, async (run, directory) => withRoundPage(directory, { before: '<script>localStorage.setItem(' + JSON.stringify(STATE_KEY) + ', ' + JSON.stringify(value) + ')</script>' }, async open => {
      const result = await open();
      assert.equal(result.title, 'Request reminder', value);
      assert.deepEqual({ approved: result.approved, comments: result.comments }, { approved: [], comments: {} }, value);
    }));
  }
});

test('--seed preloads copied decisions, and saved state wins over the seed', { skip: !chrome && 'no Chrome found; set CHROME_PATH' }, () => withReview(designReview, async (run, directory) => {
  const seed = formatDecisions({ title: 'Example review', round: 'round-1', items: [
    { id: 'round-1/reminder', title: 'Request reminder', approved: true },
    { id: 'round-1/spacing', title: 'Card spacing on a phone', approved: false, comment: 'Tighten the gap\nMatch the radius' },
    { id: 'round-1/tablet', title: 'Tablet layout', approved: false },
  ] });
  await withRoundPage(directory, { seed }, async open => {
    const result = await open();
    assert.deepEqual({ approved: result.approved, comments: result.comments }, { approved: ['round-1/reminder'], comments: { 'round-1/spacing': 'Tighten the gap\nMatch the radius' } });
  });
  const saved = JSON.stringify({ approved: ['round-1/tablet'], comments: {} });
  await withRoundPage(directory, { seed, before: '<script>localStorage.setItem(' + JSON.stringify(STATE_KEY) + ', ' + JSON.stringify(saved) + ')</script>' }, async open => {
    const result = await open();
    assert.deepEqual({ approved: result.approved, comments: result.comments }, { approved: ['round-1/tablet'], comments: {} });
  });
}));

test('--seed rejects decisions from another round or for comparisons the round does not show', () => withReview(designReview, async (run, directory) => {
  const output = join(directory, 'round.html');
  const decisions = (round, id) => formatDecisions({ title: 'Example review', round, items: [{ id, title: 'x', approved: true }] });
  await assert.rejects(buildRound(directory, 'round-1', { output, seed: decisions('round-2', 'round-2/reminder') }), /belong to Example review, round-2, not round-1/);
  await assert.rejects(buildRound(directory, 'round-1', { output, seed: decisions('round-1', 'round-1/ghost') }), /does not show: round-1\/ghost/);
  await assert.rejects(buildRound(directory, 'round-1', { output, seed: 'pasted nothing' }), /No ui-review decisions found/);
  const file = join(directory, 'decisions.txt');
  await writeFile(file, decisions('round-1', 'round-1/spacing'));
  const cli = join(process.cwd(), 'estack-capy/skills/ui-review/scripts/build-round.mjs');
  const built = spawnSync(process.execPath, [cli, directory, 'round-1', output, '--seed', file], { encoding: 'utf8' });
  assert.equal(built.status, 0, built.stderr);
  const data = JSON.parse(/<script id="review-data" type="application\/json">(.*?)<\/script>/s.exec(await readFile(output, 'utf8'))[1]);
  assert.deepEqual(data.seed, { approved: ['round-1/spacing'], comments: {} });
  assert.equal(spawnSync(process.execPath, [cli, directory, 'round-1', output, '--seed'], { encoding: 'utf8' }).status, 1);
  assert.equal((await buildRound(directory, 'round-1', { output })).includes('"seed":null'), true);
}));
