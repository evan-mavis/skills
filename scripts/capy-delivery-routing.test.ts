import { expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';

const root = process.env.CAPY_SKILLS_ROOT || new URL('../estack-capy/skills/', import.meta.url);
const read = (file: string) => readFileSync(new URL(file, typeof root === 'string' ? `file://${root.replace(/\/$/, '')}/` : root), 'utf8');
const estack = read('estack/SKILL.md');
const mode = read('poteto-mode/SKILL.md');
const delivery = read('poteto-mode/playbooks/delivery.md');

test('explicit delivery routing preserves standalone use and bounded stages', () => {
  expect(estack).toContain('Plan approval alone is not a build kickoff');
  expect(estack).toContain('Keep standalone Estack tasks on their normal playbook');
  expect(mode).toContain('Delivery before those broad program triggers');
  expect(mode).toContain('This rule takes precedence over full-playbook todo lists');
  expect(mode).toContain('Do not restart the feature');
  expect(mode).toContain('Reviewers stay code-read-only');
});

test('approval sources and cross-Captain reports do not widen authorization', () => {
  expect(delivery).toContain('Do not prototype or build from "approved" alone');
  expect(delivery).toContain('Do not make the user relay it');
  expect(delivery).toContain("user's exact words, thread or comment reference, timestamp, approved artifact revision, and limits");
  expect(delivery).toContain('neither transfers its crew nor makes its reports automatically reach the coordinator');
  expect(delivery).toContain('Require an explicit `message_agent` report');
  expect(delivery).toContain('Do not create a Capy shadow issue');
});

test('failures recheck affected gates with bounded root-cause escalation', () => {
  expect(delivery).toContain('Allow at most two fix attempts for the same failure');
  expect(delivery).toContain('principle-attack-the-premise');
  expect(delivery).toContain('Re-run the failed gate and every affected downstream gate on the new head');
  expect(delivery).toContain('A material change reopens only the affected scope or design decision');
  expect(delivery).toContain('Do not reset the retry count');
});

test('status and readiness require current proof, not dispatch or summaries', () => {
  expect(delivery).toContain('"Dispatched" is not "passed"');
  expect(delivery).toContain('Do not claim tests ran from reports alone');
  expect(delivery).toContain('Never present old-head proof as current-head proof');
  expect(delivery).toContain('Never merge or enable auto-merge');
  expect(delivery).toContain("explicit approval for each named PR");
  expect(delivery).toContain('Do not claim a real end-to-end pilot from a synthetic handoff exercise');
});

test('reusable delivery skills contain no personal Captain roster', () => {
  for (const text of [estack, mode, delivery]) expect(text).not.toMatch(/AIR-(?:304|302|303|17|8|20)\b/);
});

test('PR review precedes independent engineering review and final QA video', () => {
  const stages = delivery.slice(delivery.indexOf('#### Run the stages in order'), delivery.indexOf('#### Own CI'));
  for (const stage of ['open the PR before design review', 'image-only `ui-review`', 'independent engineering specialist', 'independent acceptance specialist']) {
    expect(stages.indexOf(stage)).toBeGreaterThanOrEqual(0);
  }
  expect(stages.indexOf('open the PR before design review')).toBeLessThan(stages.indexOf('image-only `ui-review`'));
  expect(stages.indexOf('image-only `ui-review`')).toBeLessThan(stages.indexOf('independent engineering specialist'));
  expect(stages.indexOf('independent engineering specialist')).toBeLessThan(stages.indexOf('independent acceptance specialist'));
  expect(stages).toContain('use `capture` for the final PR video evidence');
  expect(stages).toContain('Later UI fixes require affected acceptance journeys and video evidence again');
  for (const file of ['poteto-mode/playbooks/feature.md', 'poteto-mode/playbooks/opening-a-pr.md']) {
    expect(read(file)).toMatch(/opens? the PR before/);
  }
});

test('only the coordinator watches CI and scoped specialists bypass Babysit', () => {
  expect(delivery).toContain('Only the coordinator monitors CI');
  expect(delivery).toContain('`capy.subscribe`');
  expect(delivery).toContain('source: { type: "pull"');
  expect(delivery).toContain('Confirm fully green CI on the final head');
  expect(mode).toContain('specialists do not poll, wait on, or babysit CI');
  expect(read('poteto-mode/playbooks/babysit.md')).toContain('A bounded specialist stage never starts Babysit');
  expect(read('estack/references/personal-defaults.md')).toContain("delivery coordinator's final merge package");
});

test('public review images and QA video are accepted without changing media ownership', () => {
  for (const file of ['ui-review/SKILL.md', 'ui-review/references/publishing.md']) {
    const text = read(file);
    expect(text).toContain('tools.pr.uploadAsset');
    expect(text).toContain('image-only');
    expect(text).toContain('secrets or credentials');
  }
  expect(read('ui-review/references/publishing.md')).toContain('Drive link is allowed, not required');
  expect(delivery).toContain('"this is totally fine"');
});
