import { afterEach, expect, test } from 'bun:test';
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const roots: string[] = [];
afterEach(async () => {
  await Promise.all(roots.splice(0).map(root => rm(root, { recursive: true, force: true })));
});

async function fixture(body = '[Proof](references/proof.md)\n', extraFrontmatter = '') {
  const root = await mkdtemp(path.join(tmpdir(), 'estack-check-'));
  roots.push(root);
  await mkdir(path.join(root, 'scripts'));
  await cp(new URL('./check-estack.mjs', import.meta.url), path.join(root, 'scripts/check-estack.mjs'));
  const skill = path.join(root, 'estack/skills/example');
  await mkdir(path.join(skill, 'agents'), { recursive: true });
  await mkdir(path.join(skill, 'references'));
  await writeFile(path.join(skill, 'SKILL.md'), `---\nname: example\ndescription: Inspect a verified example.\n${extraFrontmatter}---\n${body}`);
  await writeFile(path.join(skill, 'references/proof.md'), '# Proof\n');
  await writeFile(path.join(skill, 'agents/openai.yaml'), 'interface:\n  display_name: Example\n  short_description: Inspect a verified example skill\n  default_prompt: Use $example to inspect the example.\n');
  return { root, skill };
}

async function check(root: string, args: string[] = []) {
  const process = Bun.spawn([Bun.which('bun')!, path.join(root, 'scripts/check-estack.mjs'), ...args], { stdout: 'pipe', stderr: 'pipe' });
  const [stdout, stderr, code] = await Promise.all([new Response(process.stdout).text(), new Response(process.stderr).text(), process.exited]);
  return { stdout, stderr, code };
}

async function nativeFixture(platform: 'devin' | 'factory' | 'cursor') {
  const { root } = await fixture();
  const variant = path.join(root, `estack-${platform}`);
  const skill = path.join(variant, 'skills/example');
  await mkdir(path.join(variant, `.${platform}-plugin`), { recursive: true });
  await cp(path.join(root, 'estack/skills/example'), skill, { recursive: true });
  await rm(path.join(skill, 'agents'), { recursive: true });
  await writeFile(path.join(variant, `.${platform}-plugin/plugin.json`), JSON.stringify({
    name: `estack-${platform}`, version: '0.1.22', description: 'Native Estack variant',
    ...(platform === 'cursor' ? { skills: './skills', agents: './agents', logo: 'logo.png' } : {}),
  }));
  if (platform === 'cursor') {
    await mkdir(path.join(variant, 'agents'));
    await writeFile(path.join(variant, 'logo.png'), 'fixture');
    await mkdir(path.join(root, '.cursor-plugin'));
    await writeFile(path.join(root, '.cursor-plugin/marketplace.json'), JSON.stringify({
      name: 'evan-skills', owner: { name: 'Evan Mavis' },
      plugins: [{ name: 'estack-cursor', source: 'estack-cursor' }],
    }));
  }
  if (platform === 'factory') {
    await mkdir(path.join(root, '.factory-plugin'));
    await writeFile(path.join(root, '.factory-plugin/marketplace.json'), JSON.stringify({
      name: 'evan-skills',
      plugins: [{ name: 'estack-factory', source: './estack-factory' }],
    }));
  }
  return { root, variant, skill };
}

test('validates editable estack directly without source trees or generation', async () => {
  const { root, skill } = await fixture();
  const before = await readFile(path.join(skill, 'SKILL.md'), 'utf8');
  expect(await check(root)).toEqual({ stdout: 'Verified 1 Codex skills, UI metadata, and 1 bundled references.\n', stderr: '', code: 0 });
  expect(await readFile(path.join(skill, 'SKILL.md'), 'utf8')).toBe(before);
});

test.each([
  ['[Missing](references/missing.md)\n', '', 'missing reference: references/missing.md'],
  ['[Outside](../../../outside.md)\n', '', 'reference escapes plugin: ../../../outside.md'],
  ['[Proof](references/proof.md#missing)\n', '', 'missing heading: references/proof.md#missing'],
  ['Read `references/proof.md`.\n', '', 'supporting reference must be a Markdown link: references/proof.md'],
  ['[Proof](references/proof.md)\n', 'mode: true\n', 'unsupported frontmatter field mode'],
])('rejects invalid direct-source references and metadata (%s)', async (body, extraFrontmatter, diagnostic) => {
  const { root } = await fixture(body, extraFrontmatter);
  const result = await check(root);
  expect(result.code).toBe(1);
  expect(result.stderr).toContain(diagnostic);
});

test('accepts linked path labels and skips reference examples and templates', async () => {
  const { root } = await fixture('[`references/proof.md`](references/proof.md)\n```markdown\nRead `references/example.md`.\n```\nUse `references/<source>.md` or `references/*.md`.\n');
  expect(await check(root)).toEqual({ stdout: 'Verified 1 Codex skills, UI metadata, and 1 bundled references.\n', stderr: '', code: 0 });
});

test('rejects the obsolete upstream comparison option', async () => {
  const { root } = await fixture();
  const result = await check(root, ['--upstream', '/unused']);
  expect(result.code).toBe(1);
  expect(result.stderr).toContain('Usage: bun scripts/check-estack.mjs');
});

test('rejects references outside a registered skill even when their links resolve', async () => {
  const { root } = await fixture('[Recording](../references/video-recording.md)\n');
  const references = path.join(root, 'estack/skills/references');
  await mkdir(references);
  await writeFile(path.join(references, 'video-recording.md'), '# Recording\n');
  const result = await check(root);
  expect(result.code).toBe(1);
  expect(result.stderr).toContain('supporting file has no registered skill owner');
  expect(result.stderr).not.toContain('missing reference');
});

test.each(['devin', 'factory', 'cursor'] as const)('validates the standalone %s package without Codex UI metadata', async platform => {
  const { root } = await nativeFixture(platform);
  const result = await check(root, [platform]);
  expect(result.code).toBe(0);
  expect(result.stdout).toContain('1 bundled references');
});

test.each(['devin', 'factory', 'cursor'] as const)('rejects a missing shared skill in %s', async platform => {
  const { root, skill } = await nativeFixture(platform);
  await rm(skill, { recursive: true });
  const result = await check(root, [platform]);
  expect(result.code).toBe(1);
  expect(result.stderr).toContain('missing corresponding skill: example');
});

test.each(['devin', 'factory', 'cursor'] as const)('preserves explicit-only skill policy in %s', async platform => {
  const { root, skill } = await nativeFixture(platform);
  const sourceMetadata = path.join(root, 'estack/skills/example/agents/openai.yaml');
  await writeFile(sourceMetadata, (await readFile(sourceMetadata, 'utf8')) + 'policy:\n  allow_implicit_invocation: false\n');
  const rejected = await check(root, [platform]);
  expect(rejected.code).toBe(1);
  expect(rejected.stderr).toContain('must preserve explicit-only invocation policy');
  const entry = path.join(skill, 'SKILL.md');
  const policy = platform === 'devin' ? 'triggers: [user]' : 'disable-model-invocation: true';
  await writeFile(entry, (await readFile(entry, 'utf8')).replace('name: example', `name: example\n${policy}`));
  expect((await check(root, [platform])).code).toBe(0);
});

test.each(['devin', 'factory', 'cursor'] as const)('rejects broken bundled links and Codex runtime dependencies in %s', async platform => {
  const { root, skill } = await nativeFixture(platform);
  const entry = path.join(skill, 'SKILL.md');
  await writeFile(entry, (await readFile(entry, 'utf8')) + '[Missing](references/missing.md)\nRead ~/.codex/sessions.\n');
  const result = await check(root, [platform]);
  expect(result.code).toBe(1);
  expect(result.stderr).toContain('missing reference: references/missing.md');
  expect(result.stderr).toContain('unsupported Codex runtime dependency');
});

test('rejects incorrect native identity and stale Factory marketplace sources', async () => {
  const { root, variant } = await nativeFixture('factory');
  await writeFile(path.join(variant, '.factory-plugin/plugin.json'), JSON.stringify({ name: 'estack', version: '0.1.22' }));
  await writeFile(path.join(root, '.factory-plugin/marketplace.json'), '{"plugins":[]}');
  const result = await check(root, ['factory']);
  expect(result.code).toBe(1);
  expect(result.stderr).toContain('invalid plugin identity');
  expect(result.stderr).toContain('missing Factory plugin source');
});

test('rejects a Factory marketplace without its required name', async () => {
  const { root } = await nativeFixture('factory');
  const catalogFile = path.join(root, '.factory-plugin/marketplace.json');
  const catalog = JSON.parse(await readFile(catalogFile, 'utf8'));
  delete catalog.name;
  await writeFile(catalogFile, JSON.stringify(catalog));
  const result = await check(root, ['factory']);
  expect(result.code).toBe(1);
  expect(result.stderr).toContain('invalid Factory marketplace name');
});


test('rejects Cursor manifest paths outside the bundle and missing marketplace source', async () => {
  const { root, variant } = await nativeFixture('cursor');
  const manifestFile = path.join(variant, '.cursor-plugin/plugin.json');
  const manifest = JSON.parse(await readFile(manifestFile, 'utf8'));
  manifest.logo = '../private.png';
  manifest.agents = './missing-agents';
  await writeFile(manifestFile, JSON.stringify(manifest));
  await writeFile(path.join(root, '.cursor-plugin/marketplace.json'), '{"plugins":[]}');
  const result = await check(root, ['cursor']);
  expect(result.code).toBe(1);
  expect(result.stderr).toContain('invalid logo path');
  expect(result.stderr).toContain('missing agents path');
  expect(result.stderr).toContain('invalid Cursor marketplace identity');
  expect(result.stderr).toContain('missing Cursor plugin source');
});

test('rejects Factory runtime APIs in Cursor skills', async () => {
  const { root, skill } = await nativeFixture('cursor');
  const entry = path.join(skill, 'SKILL.md');
  await writeFile(entry, (await readFile(entry, 'utf8')) + 'Use CreateAutomation and TaskOutput.\n');
  const result = await check(root, ['cursor']);
  expect(result.code).toBe(1);
  expect(result.stderr).toContain('unsupported non-Cursor runtime dependency');
});
