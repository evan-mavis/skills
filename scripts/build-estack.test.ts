import { afterEach, expect, test } from 'bun:test';
import { chmod, lstat, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { buildEstack } from './build-estack.mjs';

const roots: string[] = [];
afterEach(async () => { await Promise.all(roots.splice(0).map(root => rm(root, { recursive: true, force: true }))); });

async function fixture(config: Record<string, unknown> = {}) {
  const root = await mkdtemp(path.join(tmpdir(), 'estack-test-'));
  roots.push(root);
  await mkdir(path.join(root, 'scripts/estack'), { recursive: true });
  await mkdir(path.join(root, 'source/resources'), { recursive: true });
  await writeFile(path.join(root, 'source/SKILL.md'), 'original anchor\n');
  await writeFile(path.join(root, 'source/resources/run.sh'), '#!/bin/sh\necho proof\n');
  await chmod(path.join(root, 'source/resources/run.sh'), 0o755);
  await writeFile(path.join(root, 'scripts/estack/bundle.json'), JSON.stringify({
    copies: [{ from: 'source', to: 'skills/example' }], replacements: [], overrides: [], ...config,
  }));
  return { root, output: path.join(root, 'estack') };
}

test('copies resources, excludes local artifacts, preserves execution, and is idempotent', async () => {
  const { root, output } = await fixture({ replacements: [{ path: 'skills/example/SKILL.md', from: 'original anchor', to: 'adapted instruction' }] });
  for (const name of ['node_modules', '.git']) {
    await mkdir(path.join(root, 'source', name));
    await writeFile(path.join(root, 'source', name, 'private'), 'excluded');
  }
  for (const name of ['.DS_Store', '.env', '.env.local', 'debug.log']) await writeFile(path.join(root, 'source', name), 'excluded');
  expect(await buildEstack(root, output)).toEqual({ ok: true, files: 2, drift: ['missing skills/example/SKILL.md', 'missing skills/example/resources/run.sh'] });
  expect(await readFile(path.join(output, 'skills/example/SKILL.md'), 'utf8')).toBe('adapted instruction\n');
  expect((await lstat(path.join(output, 'skills/example/resources/run.sh'))).mode & 0o111).toBe(0o111);
  expect(await readFile(path.join(root, 'source/SKILL.md'), 'utf8')).toBe('original anchor\n');
  const before = (await lstat(path.join(output, 'skills/example/SKILL.md'))).mtimeMs;
  expect((await buildEstack(root, output)).drift).toEqual([]);
  expect((await lstat(path.join(output, 'skills/example/SKILL.md'))).mtimeMs).toBe(before);
});

test('explicit overrides replace copied files and reject unknown destinations', async () => {
  const { root, output } = await fixture({ overrides: [{ from: 'override.md', to: 'skills/example/SKILL.md' }] });
  await writeFile(path.join(root, 'override.md'), 'override\n');
  await buildEstack(root, output);
  expect(await readFile(path.join(output, 'skills/example/SKILL.md'), 'utf8')).toBe('override\n');
  await writeFile(path.join(root, 'scripts/estack/bundle.json'), JSON.stringify({ copies: [], replacements: [], overrides: [{ from: 'override.md', to: 'missing.md' }] }));
  await expect(buildEstack(root, output)).rejects.toThrow('Override requires a copied file');
});

test('loads native replacements and removes obsolete files without editing sources', async () => {
  const { root, output } = await fixture({
    replacementsFrom: ['native.json'], removals: ['skills/example/resources/run.sh'],
  });
  await writeFile(path.join(root, 'native.json'), JSON.stringify([
    { path: 'skills/example/SKILL.md', from: 'original anchor', to: 'native instruction' },
  ]));
  await buildEstack(root, output);
  expect(await readFile(path.join(output, 'skills/example/SKILL.md'), 'utf8')).toBe('native instruction\n');
  await expect(lstat(path.join(output, 'skills/example/resources/run.sh'))).rejects.toThrow();
  expect(await readFile(path.join(root, 'source/SKILL.md'), 'utf8')).toBe('original anchor\n');
  expect((await buildEstack(root, output, { check: true })).ok).toBe(true);
});

test('rejects stale removals before writing', async () => {
  const { root, output } = await fixture({ removals: ['missing.md'] });
  await expect(buildEstack(root, output)).rejects.toThrow('Removal requires a copied file');
  await expect(lstat(output)).rejects.toThrow();
});

test('Codex packaging keeps routed skills discoverable and preserves their workflow', async () => {
  const { root, output } = await fixture({ codexSkills: true });
  const body = '\nRead references/proof.md before recording.\n';
  await writeFile(path.join(root, 'source/SKILL.md'), '---\nname: example\ndescription: Record a demo.\ndisable-model-invocation: true\npaths: ["*.ts"]\nmode: true\n---\n' + body);
  await mkdir(path.join(root, 'source/agents'));
  await writeFile(path.join(root, 'source/agents/openai.yaml'), 'interface:\n  display_name: Example\n  short_description: Record a verified demonstration\n  default_prompt: Use $example to record a demo.\ndependencies:\n  tools: []\n');
  await buildEstack(root, output);
  const skill = await readFile(path.join(output, 'skills/example/SKILL.md'), 'utf8');
  expect(Bun.YAML.parse(skill.split('---')[1])).toEqual({ name: 'example', description: 'Record a demo.' });
  expect(skill.slice(skill.indexOf('\n---\n') + 5)).toBe(body);
  expect(Bun.YAML.parse(await readFile(path.join(output, 'skills/example/agents/openai.yaml'), 'utf8'))).toEqual({
    interface: { display_name: 'Example', short_description: 'Record a verified demonstration', default_prompt: 'Use $example to record a demo.' },
    dependencies: { tools: [] },
  });
  expect((await buildEstack(root, output, { check: true })).ok).toBe(true);
});

test('Codex packaging preserves an existing native invocation policy', async () => {
  const { root, output } = await fixture({ codexSkills: true });
  await writeFile(path.join(root, 'source/SKILL.md'), '---\nname: example\ndescription: Record a demo.\ndisable-model-invocation: true\n---\n');
  await mkdir(path.join(root, 'source/agents'));
  const metadata = 'interface:\n  display_name: Example\npolicy:\n  allow_implicit_invocation: false\n';
  await writeFile(path.join(root, 'source/agents/openai.yaml'), metadata);
  await buildEstack(root, output);
  expect(await readFile(path.join(output, 'skills/example/agents/openai.yaml'), 'utf8')).toBe(metadata);
});

test.each(['missing', 'anchor'])('rejects %s replacement anchors before changing output', async anchor => {
  const { root, output } = await fixture({ replacements: [{ path: 'skills/example/SKILL.md', from: anchor, to: 'changed' }] });
  await writeFile(path.join(root, 'source/SKILL.md'), 'anchor anchor\n');
  await mkdir(output);
  await writeFile(path.join(output, 'sentinel'), 'keep');
  await expect(buildEstack(root, output)).rejects.toThrow('exactly once');
  expect(await readFile(path.join(output, 'sentinel'), 'utf8')).toBe('keep');
});

test('check reports missing, byte and mode changes, and stale files without writes', async () => {
  const { root, output } = await fixture();
  await buildEstack(root, output);
  await rm(path.join(output, 'skills/example/SKILL.md'));
  await chmod(path.join(output, 'skills/example/resources/run.sh'), 0o644);
  await writeFile(path.join(output, 'stale'), 'keep until build');
  const result = await buildEstack(root, output, { check: true });
  expect(result.ok).toBe(false);
  expect(result.drift).toEqual(['missing skills/example/SKILL.md', 'changed skills/example/resources/run.sh', 'unexpected stale']);
  expect(await readFile(path.join(output, 'stale'), 'utf8')).toBe('keep until build');
  expect((await lstat(path.join(output, 'skills/example/resources/run.sh'))).mode & 0o111).toBe(0);
  await buildEstack(root, output);
  expect((await buildEstack(root, output, { check: true })).ok).toBe(true);
  await expect(lstat(path.join(output, 'stale'))).rejects.toThrow();
  await writeFile(path.join(output, 'skills/example/SKILL.md'), 'wrong bytes');
  expect((await buildEstack(root, output, { check: true })).drift).toEqual(['changed skills/example/SKILL.md']);
});

test('rejects collisions without writing output', async () => {
  const { root, output } = await fixture({ copies: [{ from: 'source', to: 'skills/example' }, { from: 'source', to: 'skills/example' }] });
  await expect(buildEstack(root, output)).rejects.toThrow('collision');
  await expect(lstat(output)).rejects.toThrow();
});

test('rejects source and output symlinks', async () => {
  const { root, output } = await fixture();
  await symlink('SKILL.md', path.join(root, 'source/link'));
  await expect(buildEstack(root, output)).rejects.toThrow('Symlink');
  await rm(path.join(root, 'source/link'));
  await mkdir(output);
  await symlink('../source/SKILL.md', path.join(output, 'link'));
  await expect(buildEstack(root, output)).rejects.toThrow('Symlink');
});

test('rejects source and output paths through linked directories', async () => {
  const { root, output } = await fixture();
  await symlink('source', path.join(root, 'linked'));
  await writeFile(path.join(root, 'scripts/estack/bundle.json'), JSON.stringify({
    copies: [{ from: 'linked/resources', to: 'resources' }], replacements: [], overrides: [],
  }));
  await expect(buildEstack(root, output)).rejects.toThrow('Symlink');
  await expect(buildEstack(root, path.join(root, 'linked/generated'))).rejects.toThrow('Symlink');
});

test.each(['source', 'source/generated', '.'])('rejects output/source overlap at %s', async location => {
  const { root } = await fixture();
  await expect(buildEstack(root, path.join(root, location))).rejects.toThrow('overlaps source');
  expect(await readFile(path.join(root, 'source/SKILL.md'), 'utf8')).toBe('original anchor\n');
});

test('rejects output traversal and file/directory collisions before writing', async () => {
  const { root, output } = await fixture({ copies: [{ from: 'source', to: '../escape' }] });
  await expect(buildEstack(root, output)).rejects.toThrow('Invalid destination path');
  await writeFile(path.join(root, 'scripts/estack/bundle.json'), JSON.stringify({
    copies: [{ from: 'source/SKILL.md', to: 'skills' }, { from: 'source/resources', to: 'skills/resources' }], replacements: [], overrides: [],
  }));
  await expect(buildEstack(root, output)).rejects.toThrow('File/directory collision');
});
