import { readFile, writeFile } from 'node:fs/promises';
import { resolve, dirname, extname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { validateReview } from './validate-review.mjs';
import { formatDecisions } from './decisions.mjs';

const template = resolve(dirname(fileURLToPath(import.meta.url)), '../assets/round.html');
const OPEN = new Set(['unresolved', 'reopened']);

export async function buildRound(directory, roundId, { final = false } = {}) {
  await validateReview(directory);
  const root = resolve(directory);
  const review = JSON.parse(await readFile(resolve(root, 'review.json'), 'utf8'));
  const inline = async side => side && {
    src: 'data:image/' + (extname(side.src).toLowerCase() === '.png' ? 'png' : 'jpeg') + ';base64,' + (await readFile(resolve(root, side.src))).toString('base64'),
    width: side.width, height: side.height, regions: side.regions,
  };
  const roundIndex = final ? review.rounds.length - 1 : review.rounds.findIndex(round => round.id === roundId);
  if (roundIndex < 0) throw new Error('Unknown round: ' + roundId);
  const round = review.rounds[roundIndex];
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
    explanation: comparison.explanation, lookAt: comparison.lookAt || '', tier: comparison.tier, variant: comparison.variant,
    gap: comparison.gap || '', copyDiff: comparison.copyDiff || [],
    approved: comparison.feedback.some(note => note.disposition === 'approved'),
    before: await inline(comparison.before), after: await inline(comparison.after),
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
  const data = { mode: final ? 'final' : 'round', title: review.title, summary: review.summary, groups: review.issues,
    round: { id: round.id, label: final ? 'Final design' : round.label, summary: final ? review.summary : round.summary }, items, earlier };
  const html = (await readFile(template, 'utf8'))
    .replace('__UI_REVIEW_FORMAT__', () => formatDecisions.toString())
    .replace('__UI_REVIEW_DATA__', () => JSON.stringify(data).replace(/</g, '\\u003c'));
  return html;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const args = process.argv.slice(2);
  const final = args.includes('--final');
  const [directory, ...rest] = args.filter(arg => arg !== '--final');
  const [roundId, output] = final ? [undefined, rest[0]] : rest;
  try {
    if (!directory || !output) throw new Error('Usage: build-round.mjs <review-directory> <round-id> <output.html> | build-round.mjs <review-directory> --final <output.html>');
    await writeFile(output, await buildRound(directory, roundId, { final }));
    console.log('Wrote ' + output);
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
