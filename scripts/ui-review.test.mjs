import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm, mkdir, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { randomBytes } from 'node:crypto';
import { validateReview, imageDimensions } from '../estack-capy/skills/ui-review/scripts/validate-review.mjs';
import { diffImages, decodePng } from '../estack-capy/skills/ui-review/scripts/diff-captures.mjs';
import { formatDecisions, parseDecisions, toFixList, renderFixList } from '../estack-capy/skills/ui-review/scripts/decisions.mjs';
import { buildRound, ROUND_BUDGET_BYTES } from '../estack-capy/skills/ui-review/scripts/build-round.mjs';
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
  rounds: [{ id: 'round-1', label: 'Round 1', summary: 'Initial', comparisons: [comparison('reminder')] }],
});

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

test('keeps text-only history only when archived', () => withReview(c => {
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
  const html = await buildRound(directory, 'round-2');
  assert.match(html, /Earlier comments/);
  assert.match(html, /Move it under the total/);
  assert.match(html, /data:image\/png;base64,/);
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
  const html = await buildRound(directory, 'round-1');
  assert.match(html, /data:image\/png;base64,/);
  assert.match(html, /Copy all decisions/);
  assert.match(html, /id="export-text"/);
  assert.match(html, /navigator\.clipboard/);
  assert.match(html, /execCommand/);
  assert.match(html, /ui-review decisions v1/);
  assert.doesNotMatch(html, /captures\/before\.png/);
  await assert.rejects(buildRound(directory, 'round-9'), /Unknown round/);
}));

test('the final doc shows the latest revision only', () => withReview((c, d) => {
  d.rounds.push({ id: 'round-2', label: 'Round 2', summary: 'Revised', comparisons: [comparison('reminder-2', { revises: 'reminder', title: 'Request reminder, revised' })] });
}, async (run, directory) => {
  await run();
  const html = await buildRound(directory, undefined, { final: true });
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

  const html = await buildRound(directory, 'round-2');
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
    const html = await buildRound(directory, 'round-1');
    assert.deepEqual(embedded(html), [{ width: 293, height: 633 }, { width: 293, height: 633 }]);
    assert.match(html, /"width":390,"height":844/);
    assert.deepEqual(await readFile(join(directory, 'captures/after.png')), original);
  }));

test('reports the round size and fails above the budget', async () => {
  const run = directory => promisify(execFile)(process.execPath, [buildCli, directory, 'round-1', join(directory, 'round.html')]);
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

test('keeps the sidebar beside the comparisons down to 600px', () => withReview(() => {}, async (run, directory) => {
  const html = await buildRound(directory, 'round-1');
  assert.match(html, /@media \(max-width: 600px\) \{ body \{ grid-template-columns: 1fr; \}/);
  assert.doesNotMatch(html, /max-width: 880px/);
}));
