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
  ['[Proof](references/proof.md)\n', 'mode: true\n', 'unsupported frontmatter field mode'],
])('rejects invalid direct-source references and metadata (%s)', async (body, extraFrontmatter, diagnostic) => {
  const { root } = await fixture(body, extraFrontmatter);
  const result = await check(root);
  expect(result.code).toBe(1);
  expect(result.stderr).toContain(diagnostic);
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
