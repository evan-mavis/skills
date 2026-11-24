import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { validateReview, imageDimensions } from '../estack/skills/ui-review/scripts/validate-review.mjs';

const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64');
const image = (commit) => ({
  src: 'capture.png', width: 1, height: 1,
  sha256: createHash('sha256').update(png).digest('hex'),
  regions: [{ x: 0, y: 0, width: .5, height: .5, label: 'Copy' }],
  capture: { kind: 'example-fixture', commit: commit.repeat(40), dirtyPatchSha256: null,
    buildEvidence: 'Unit fixture only', capturedAt: '2026-10-23T12:00:00Z', tool: 'test fixture',
    route: '/example', role: 'example', state: 'filled', dataKey: 'example',
    viewport: { width: 1, height: 1, deviceScaleFactor: 1 }, scroll: { x: 0, y: 0 } }
});
const review = () => ({ title: 'Example', summary: 'A text replacement',
  issues: [{ id: 'EX-1', title: 'Example', url: 'https://linear.app/example/issue/EX-1' }],
  rounds: [{ id: 'round-1', label: 'Round 1', summary: 'Initial', comparisons: [{
    id: 'desktop', issueId: 'EX-1', title: 'Request', variant: 'desktop', explanation: 'Replace the copy',
    before: image('a'), after: image('b'), feedback: [],
    copyDiff: [{ type: 'remove', text: 'Old' }, { type: 'add', text: 'New' }]
  }] }]
});
async function withReview(change, check) {
  const directory = await mkdtemp(join(tmpdir(), 'estack-review-test-'));
  try {
    const data = review(); change(data.rounds[0].comparisons[0], data);
    await writeFile(join(directory, 'capture.png'), png);
    await writeFile(join(directory, 'review.json'), JSON.stringify(data));
    await check(() => validateReview(directory));
  } finally { await rm(directory, { recursive: true, force: true }); }
}
test('accepts original screenshot metadata and changed copy', () => withReview(() => {}, async run => {
  assert.equal((await run()).comparisons, 1);
}));
for (const [name, change, message] of [
  ['same build labeled Before', c => { c.after.capture.commit = c.before.capture.commit; }, /same build/],
  ['dirty Before', c => { c.before.capture.dirtyPatchSha256 = 'a'.repeat(64); }, /clean baseline/],
  ['mismatched role', c => { c.after.capture.role = 'other'; }, /Pair mismatch/],
  ['altered original bytes', c => { c.after.sha256 = 'a'.repeat(64); }, /hash mismatch/],
  ['wrong capture dimensions', c => { c.after.width = 2; }, /dimensions disagree/],
  ['out of bounds overlay', c => { c.after.regions[0].x = 2; }, /rectangle/],
  ['whole screen highlight', c => { c.after.regions[0].width = c.after.regions[0].height = 1; }, /entire screen/],
  ['missing image without gap', c => { c.before = null; }, /visible gap/],
  ['external asset', c => { c.after.src = 'https://example.com/capture.png'; }, /packaged relative/],
  ['invalid copy segment', c => { c.copyDiff[0].type = 'html'; }, /text diff/],
  ['duplicate comparison ID', (c,d) => { d.rounds[0].comparisons.push(c); }, /duplicate ID/],
  ['unknown feedback target', c => { c.feedback.push({ source: 'chat:1', text: 'Approved', comparisonId: 'unknown', disposition: 'approved' }); }, /Unknown feedback/]
]) test(`rejects ${name}`, () => withReview(change, run => assert.rejects(run, message)));
test('reports missing evidence even when the review is valid', () => withReview(c => {
  c.before = null; c.gap = 'Baseline is blocked';
}, async run => { const result = await run(); assert.equal(result.gaps, 1); assert.equal(result.missingCaptures, 1); }));
test('rejects unrecognized screenshot bytes', () => assert.throws(() => imageDimensions(Buffer.from('not an image')), /PNG or JPEG/));

for (const kind of ['feature', 'ui', undefined]) test(`accepts ${kind || 'implicit feature'} groups without issue links`, () => withReview((c,d) => {
  d.issues = [{ id: 'checkout', title: 'Checkout', ...(kind ? { kind } : {}) }];
  c.issueId = 'checkout';
}, async run => assert.equal((await run()).comparisons, 1)));
test('requires a URL for an explicit Linear group', () => withReview((c,d) => {
  d.issues[0] = { id: 'EX-1', title: 'Example', kind: 'linear' };
}, run => assert.rejects(run, /require an issue URL/)));
test('rejects an unsafe group URL', () => withReview((c,d) => {
  d.issues[0].url = 'javascript:alert(1)';
}, run => assert.rejects(run, /Invalid group URL/)));

test('excludes text-only entries unless retained as archive history', async () => {
  const hideImages = (comparison) => { comparison.before = comparison.after = null; };
  await withReview(hideImages, run => assert.rejects(run, /Text-only entries/));
  await withReview(comparison => {
    hideImages(comparison);
    comparison.archived = true;
  }, async run => assert.equal((await run()).missingCaptures, 0));
});

test('shared feedback scopes approvals to reviewer and round and preserves comments across retries', async () => {
  const { DatabaseSync } = await import('node:sqlite');
  const { reviewFeedback } = await import('../estack/skills/ui-review/assets/server/review-feedback.mjs');
  const sql = new DatabaseSync(':memory:');
  try {
    sql.exec(`
      CREATE TABLE ui_review_approvals (reviewer TEXT, view TEXT, PRIMARY KEY (reviewer, view));
      CREATE TABLE ui_review_comments (id TEXT PRIMARY KEY, reviewer TEXT, view TEXT, text TEXT, created_at TEXT);
    `);
    const db = {
      prepare(query) {
        const statement = sql.prepare(query);
        const bind = (...args) => ({
          run: () => statement.run(...args),
          first: () => statement.get(...args),
          all: () => ({ results: statement.all(...args) }),
        });
        return { bind, ...bind() };
      },
      batch: (statements) => statements.map(statement => statement.all()),
    };
    const url = 'https://review.example/api/ui-review';
    const data = review();
    data.rounds.push({
      ...data.rounds[0],
      id: 'round-2',
      comparisons: [{ ...data.rounds[0].comparisons[0], id: 'revised' }],
    });
    const call = (reviewer, body, origin = 'https://review.example') => reviewFeedback(new Request(url, {
      method: body ? 'POST' : 'GET',
      headers: reviewer ? {
        'oai-authenticated-user-id': reviewer,
        ...(body && { origin, 'Content-Type': 'application/json' }),
      } : {},
      body: body ? JSON.stringify(body) : undefined,
    }), db, data);
    const view = 'round-1/desktop';
    const check = { type: 'approval', view, checked: true };
    const comment = { type: 'comment', view, comment: { id: crypto.randomUUID(), text: 'Align the labels' } };
    assert.equal((await call(null)).status, 401);
    assert.equal((await call('one', check, 'https://other.example')).status, 403);
    assert.equal((await call('one', { ...check, view: 'round-1/unknown' })).status, 404);
    assert.equal((await call('one', check)).status, 200);
    const posted = await (await call('one', comment)).json();
    assert.deepEqual(await (await call('one', comment)).json(), posted);
    const state = await (await call('one')).json();
    assert.deepEqual(state.approved, [view]);
    assert.equal(state.comments.length, 1);
    assert.deepEqual(await (await call('two')).json(), { approved: [], comments: state.comments });
    const nextRound = 'round-2/revised';
    assert.equal((await call('one', { ...check, view: nextRound })).status, 200);
    assert.equal((await call('one', { ...check, checked: false })).status, 200);
    assert.deepEqual((await (await call('one')).json()).approved, [nextRound]);
  } finally {
    sql.close();
  }
});
