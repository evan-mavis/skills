import { expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';

const read = (variant: string, file: string) => readFileSync(new URL(`../${variant}/skills/${file}`, import.meta.url), 'utf8');
const map = 'estack/references/projects/airgoods-context-sources.md';

for (const variant of ['estack', 'estack-devin', 'estack-capy']) {
  test(`${variant} routes context gathering through one project sources map`, () => {
    expect(read(variant, 'estack/SKILL.md')).toMatch(/^## Gather context$/m);
    expect(read(variant, 'estack/references/projects/airgoods.md')).toContain('](airgoods-context-sources.md)');
    expect(read(variant, 'poteto-mode/SKILL.md')).toContain('](../estack/SKILL.md#gather-context)');
    expect(read(variant, 'why/SKILL.md')).toMatch(/context-sources map[^\n]*project table/);
    expect(read(variant, 'recall/SKILL.md')).toMatch(/context-sources map as \*\*why\*\* does/);
    const sources = read(variant, map);
    for (const service of ['Linear', 'Slack', 'Notion', 'PostHog', 'Sentry', 'Render', 'Vercel', 'Neon', 'Expo', 'Resend', 'Algolia', 'Sanity', 'Stripe']) {
      expect(sources).toMatch(new RegExp(`^\\| ${service} \\|`, 'm'));
    }
    expect(sources).toContain('docs/verification/dev-data.md');
    expect(sources).toMatch(/query-prod[\s\S]*query-local/);
    expect(sources).toMatch(/does not record whether a connector is available/);
  });
}
