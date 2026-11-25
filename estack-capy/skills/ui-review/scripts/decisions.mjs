import { readFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';

export const HEADER = 'ui-review decisions v1';

export function formatDecisions(input) {
  const single = value => String(value || '').replace(/\s+/g, ' ').trim();
  const lines = ['ui-review decisions v1', 'review: ' + single(input.title), 'round: ' + single(input.round)];
  const block = (key, value) => {
    const parts = String(value || '').replace(/\r\n?/g, '\n').trim().split('\n');
    if (!parts[0]) return;
    lines.push(key + ': ' + parts[0]);
    for (const part of parts.slice(1)) lines.push('  ' + part);
  };
  for (const item of input.items) {
    const comment = String(item.comment || '').trim();
    lines.push('item: ' + single(item.id), 'title: ' + single(item.title), 'decision: ' + (item.approved ? 'approved' : comment ? 'comment' : 'no-response'));
    block('comment', comment);
  }
  block('general', input.general);
  lines.push('end');
  return lines.join('\n') + '\n';
}

export function parseDecisions(text) {
  const lines = String(text).replace(/\r\n?/g, '\n').split('\n');
  const start = lines.findIndex(line => line.trim() === HEADER);
  if (start < 0) throw new Error('No ui-review decisions found. Paste the full text from "Copy all decisions".');
  const result = { review: null, round: null, items: [], general: [] };
  let item = null, open = null, ended = false;
  for (const line of lines.slice(start + 1)) {
    const key = /^(review|round|item|title|decision|comment|general|end)(?::\s?(.*))?$/.exec(line.trimEnd());
    if (!key || (key[1] !== 'end' && key[2] === undefined)) {
      if (open && (line.startsWith('  ') || !line.trim())) { open.push(line.slice(2)); continue; }
      if (!line.trim()) continue;
      throw new Error('Unreadable decisions line: ' + line);
    }
    const [, name, value = ''] = key;
    open = null;
    if (name === 'end') { ended = true; break; }
    if (name === 'review' || name === 'round') result[name] = value.trim();
    else if (name === 'item') { item = { id: value.trim(), title: '', decision: null, comment: '' }; result.items.push(item); }
    else if (name === 'general') { result.general.push(value); open = result.general; }
    else {
      if (!item) throw new Error(name + ' appears before any item');
      if (name === 'title') item.title = value.trim();
      else if (name === 'decision') {
        if (!['approved', 'comment', 'no-response'].includes(value.trim())) throw new Error('Unknown decision: ' + value);
        item.decision = value.trim();
      } else { item.lines = [value]; open = item.lines; }
    }
  }
  if (!ended) throw new Error('The decisions text is cut off (no "end" line). Copy all decisions again and paste the whole text.');
  for (const entry of result.items) {
    if (!entry.decision) throw new Error('Missing decision for ' + entry.id);
    entry.comment = (entry.lines || []).join('\n').trim();
    delete entry.lines;
  }
  result.general = result.general.join('\n').trim();
  return result;
}

const requests = comment => comment.split('\n').map(line => line.replace(/^\s*(?:[-*•]|\d+[.)])\s+/, '').trim()).filter(Boolean);

export function toFixList(parsed, review) {
  const round = review.rounds.find(candidate => candidate.id === parsed.round);
  if (!round) throw new Error('Unknown round: ' + parsed.round);
  if (parsed.review !== review.title.replace(/\s+/g, ' ').trim()) throw new Error('These decisions belong to another review: ' + parsed.review);
  const comparisons = new Map(round.comparisons.filter(comparison => !comparison.archived).map(comparison => [round.id + '/' + comparison.id, comparison]));
  const fixList = { review: parsed.review, round: parsed.round, approved: [], implicitlyApproved: [], fixes: [], questions: [], pending: [], missing: [], general: parsed.general ? requests(parsed.general) : [] };
  const seen = new Set();
  for (const item of parsed.items) {
    const comparison = comparisons.get(item.id);
    if (!comparison) throw new Error('Unknown item for ' + parsed.round + ': ' + item.id);
    if (seen.has(item.id)) throw new Error('Duplicate item: ' + item.id);
    seen.add(item.id);
    const entry = { id: item.id, title: comparison.title, tier: comparison.tier };
    const all = requests(item.comment);
    const questions = all.filter(request => request.endsWith('?'));
    const fixes = all.filter(request => !request.endsWith('?'));
    for (const text of questions) fixList.questions.push({ ...entry, text });
    if (fixes.length) fixList.fixes.push({ ...entry, requests: fixes, comment: item.comment, approvedOtherwise: item.decision === 'approved' });
    else if (item.decision === 'approved') fixList.approved.push(entry);
    else if (questions.length) fixList.pending.push(entry);
    else fixList.implicitlyApproved.push(entry);
  }
  for (const [id, comparison] of comparisons) if (!seen.has(id)) fixList.missing.push({ id, title: comparison.title, tier: comparison.tier });
  return fixList;
}

export function renderFixList(list) {
  const lines = ['# Fix list: ' + list.review + ', ' + list.round, ''];
  const section = (title, items, render) => { if (!items.length) return; lines.push('## ' + title, ''); items.forEach((item, index) => lines.push(render(item, index))); lines.push(''); };
  section('Fixes', list.fixes, (item, index) => (index + 1) + '. ' + item.title + ' (' + item.id + ', ' + item.tier + (item.approvedOtherwise ? ', approved apart from this' : '') + ')\n' + item.requests.map(request => '   - ' + request).join('\n'));
  section('General requests', list.general, (item, index) => (index + 1) + '. ' + item);
  section('Questions to answer in the thread', list.questions, item => '- ' + item.title + ' (' + item.id + '): "' + item.text + '"');
  section('Waiting on an answer', list.pending, item => '- ' + item.title + ' (' + item.id + ')');
  section('Approved', list.approved, item => '- ' + item.title + ' (' + item.id + ')');
  section('Approved without comment (no response after review)', list.implicitlyApproved, item => '- ' + item.title + ' (' + item.id + ')');
  section('Missing from the paste (not approved)', list.missing, item => '- ' + item.title + ' (' + item.id + ')');
  return lines.join('\n').trimEnd() + '\n';
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const [directory, file, flag] = process.argv.slice(2);
  try {
    if (!directory || !file) throw new Error('Usage: decisions.mjs <review-directory> <decisions-file | -> [--markdown]');
    const text = file === '-' ? await new Response(process.stdin).text() : await readFile(file, 'utf8');
    const review = JSON.parse(await readFile(join(directory, 'review.json'), 'utf8'));
    const list = toFixList(parseDecisions(text), review);
    console.log(flag === '--markdown' ? renderFixList(list) : JSON.stringify(list, null, 2));
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
