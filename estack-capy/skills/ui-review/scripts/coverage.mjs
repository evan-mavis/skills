import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

export const PLATFORMS = { 'desktop-web': 'desktop', 'mobile-web': 'mobile', 'tablet-web': 'tablet', native: 'mobile' };
export const KINDS = ['route', 'screen', 'modal', 'drawer', 'component', 'email', 'other'];
export const DEFAULT_UI_PATTERN = '\\.(tsx|jsx|vue|svelte|astro|html|css|scss|sass|less|swift|kt|dart)$';
export const EXCLUDE_PATTERN = '(^|/)(__tests__|__mocks__|e2e)/|\\.(test|spec|stories)\\.';

export function device(variant) {
  const value = String(variant).toLowerCase();
  if (value.includes('tablet')) return 'tablet';
  if (value.includes('mobile') || value.includes('phone')) return 'mobile';
  return 'desktop';
}

export const surfaceTitle = entry => entry.app + ' ' + entry.surface + ', ' + entry.state + (entry.role ? ', ' + entry.role : '');

export function coverageSummary(review) {
  const comparisons = new Map();
  for (const round of review.rounds) for (const comparison of round.comparisons) comparisons.set(comparison.id, comparison);
  const items = review.coverage.items.map(entry => {
    const comparison = entry.comparison && comparisons.get(entry.comparison);
    const status = comparison && !comparison.archived && comparison.after ? 'captured' : entry.waiver ? 'waived' : 'uncovered';
    return { id: entry.id, title: surfaceTitle(entry), platform: entry.platform, device: PLATFORMS[entry.platform], status, reason: entry.uncovered || '', waiver: entry.waiver || null };
  });
  const count = status => items.filter(entry => entry.status === status).length;
  return { inventory: items.length, captured: count('captured'), waived: count('waived'), uncovered: count('uncovered'), gaps: items.filter(entry => entry.status !== 'captured'), open: items.filter(entry => entry.status === 'uncovered') };
}

export function assertCoverageGate(review) {
  const { open, inventory } = coverageSummary(review);
  if (open.length) throw new Error('Coverage gate: ' + open.length + ' of ' + inventory + ' inventory items are uncaptured without a recorded waiver: ' + open.map(entry => entry.id).join(', ') + '. Capture them, or record the reviewer\'s explicit waiver, before the final doc.');
}

export function changedUiFiles(repo, base, head, uiPattern = DEFAULT_UI_PATTERN) {
  const include = new RegExp(uiPattern), exclude = new RegExp(EXCLUDE_PATTERN);
  return execFileSync('git', ['-C', repo, 'diff', '--name-only', '--no-renames', '--diff-filter=ACDMRT', base + '...' + head], { encoding: 'utf8' })
    .split('\n').filter(Boolean).filter(file => include.test(file) && !exclude.test(file)).sort();
}

export function unmappedFiles(coverage, files) {
  const mapped = new Set([...coverage.items.flatMap(entry => entry.files), ...coverage.notUserVisible.map(entry => entry.file)]);
  return files.filter(file => !mapped.has(file));
}

const appOf = file => { const parts = file.split('/'); return ['apps', 'packages'].includes(parts[0]) && parts.length > 2 ? parts[0] + '/' + parts[1] : '(root)'; };

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const args = process.argv.slice(2);
  const write = args.includes('--write');
  const [directory, repo] = args.filter(arg => arg !== '--write');
  try {
    if (!directory || !repo) throw new Error('Usage: coverage.mjs <review-directory> <repository> [--write]');
    const path = resolve(directory, 'review.json');
    const review = JSON.parse(await readFile(path, 'utf8'));
    const coverage = review.coverage;
    if (!coverage || !/^[a-f0-9]{40}$/.test(coverage.base) || !/^[a-f0-9]{40}$/.test(coverage.head)) throw new Error('Set coverage.base and coverage.head to full SHAs in review.json first.');
    coverage.items ||= [];
    coverage.notUserVisible ||= [];
    const files = changedUiFiles(repo, coverage.base, coverage.head, coverage.uiPattern);
    const byApp = Object.groupBy(files, appOf);
    console.log('Changed UI files: ' + files.length + ' (' + Object.entries(byApp).map(([app, list]) => app + ' ' + list.length).join(', ') + ')');
    const missing = unmappedFiles(coverage, files);
    if (write) {
      coverage.changedFiles = files;
      await writeFile(path, JSON.stringify(review, null, 2) + '\n');
      console.log('Recorded coverage.changedFiles in ' + path);
    } else if (JSON.stringify(coverage.changedFiles) !== JSON.stringify(files)) throw new Error('coverage.changedFiles is stale or missing. Rerun with --write.');
    if (coverage.items.length) {
      const summary = coverageSummary(review);
      console.log('Inventory ' + summary.inventory + ': captured ' + summary.captured + ', waived ' + summary.waived + ', uncovered ' + summary.uncovered);
      for (const entry of summary.gaps) console.log('  ' + entry.status + ': ' + entry.id + ' (' + entry.platform + ') ' + entry.reason);
    }
    if (missing.length) {
      console.error(missing.length + ' changed UI files are in no inventory item and not marked notUserVisible:\n' + missing.map(file => '  ' + file).join('\n'));
      process.exitCode = 1;
    }
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
