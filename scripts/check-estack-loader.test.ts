import { afterEach, expect, test } from 'bun:test';
import { cp, mkdir, mkdtemp, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const roots: string[] = [];
afterEach(async () => {
  await Promise.all(roots.splice(0).map(root => rm(root, { recursive: true, force: true })));
});

async function loaderFixture(mode: 'success' | 'failure' | 'missing-skill') {
  const root = await mkdtemp(path.join(tmpdir(), 'estack-loader-test-'));
  roots.push(root);
  const repo = path.join(root, 'repo');
  const bin = path.join(root, 'bin');
  const parentState = path.join(root, 'parent-state');
  const record = path.join(root, 'native-call.json');
  await mkdir(path.join(repo, 'scripts'), { recursive: true });
  await mkdir(bin);
  await mkdir(path.join(parentState, 'plugins'), { recursive: true });
  await writeFile(path.join(parentState, 'auth.json'), 'fixture credential marker');
  await writeFile(path.join(parentState, 'plugins/cache-marker'), 'fixture plugin marker');
  await cp(new URL('./check-estack-loader.mjs', import.meta.url), path.join(repo, 'scripts/check-estack-loader.mjs'));
  for (const name of ['estack', 'poteto-mode', 'explicit-only']) {
    const skill = path.join(repo, 'estack/skills', name);
    await mkdir(path.join(skill, 'agents'), { recursive: true });
    await writeFile(path.join(skill, 'SKILL.md'), `---\nname: ${name}\ndescription: Inspect a fixture skill.\n---\n`);
    await writeFile(path.join(skill, 'agents/openai.yaml'), name === 'explicit-only' ? 'policy:\n  allow_implicit_invocation: false\n' : '{}\n');
  }
  await writeFile(path.join(bin, 'codex'), `#!${process.execPath}
import { readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
const home = process.env.CODEX_HOME;
const entries = await readdir(home);
await writeFile(${JSON.stringify(record)}, JSON.stringify({ home, cwd: process.cwd(), entries, args: process.argv.slice(2) }));
if (entries.length) throw new Error('native loader refuses existing user state');
if (${JSON.stringify(mode)} === 'failure') {
  console.error('fixture native loader failed');
  process.exit(17);
}
const names = (await readdir('.agents/skills')).filter(name => name !== 'explicit-only' && !(${JSON.stringify(mode)} === 'missing-skill' && name === 'poteto-mode'));
const catalog = '### Available skills\\n' + names.map(name => '- ' + name + ': fixture (' + path.join(process.cwd(), '.agents/skills', name, 'SKILL.md') + ')').join('\\n');
console.log(JSON.stringify([{ content: [{ text: catalog }] }]));
`, { mode: 0o755 });
  return { root, repo, bin, parentState, record };
}

async function runLoader(fixture: Awaited<ReturnType<typeof loaderFixture>>) {
  const child = Bun.spawn([process.execPath, 'scripts/check-estack-loader.mjs'], {
    cwd: fixture.repo,
    env: { ...Bun.env, PATH: `${fixture.bin}${path.delimiter}${Bun.env.PATH}`, CODEX_HOME: fixture.parentState },
    stdout: 'pipe', stderr: 'pipe',
  });
  const [stdout, stderr, code] = await Promise.all([
    new Response(child.stdout).text(), new Response(child.stderr).text(), child.exited,
  ]);
  return { stdout, stderr, code };
}

async function checkIsolation(fixture: Awaited<ReturnType<typeof loaderFixture>>) {
  const call = JSON.parse(await readFile(fixture.record, 'utf8'));
  expect(call.home).not.toBe(fixture.parentState);
  expect(call.home.startsWith(call.cwd + path.sep)).toBe(true);
  expect(call.entries).toEqual([]);
  expect(call.args).toEqual(['debug', 'prompt-input', '$estack describe the bundled workflow']);
  expect(await stat(call.cwd).catch(error => error.code)).toBe('ENOENT');
  expect(await readFile(path.join(fixture.parentState, 'auth.json'), 'utf8')).toBe('fixture credential marker');
  expect(await readFile(path.join(fixture.parentState, 'plugins/cache-marker'), 'utf8')).toBe('fixture plugin marker');
  expect((await readdir(fixture.parentState)).sort()).toEqual(['auth.json', 'plugins']);
}

test('loader discovers skills with empty isolated state and leaves parent state untouched', async () => {
  const fixture = await loaderFixture('success');
  const result = await runLoader(fixture);
  expect(result).toEqual({
    code: 0, stderr: '',
    stdout: 'Codex discovered 2 bundled skills, including Poteto Mode. Bodies remain available on demand.\n',
  });
  await checkIsolation(fixture);
});

test('loader preserves native failures and cleans its isolated fixture', async () => {
  const fixture = await loaderFixture('failure');
  const result = await runLoader(fixture);
  expect(result.code).not.toBe(0);
  expect(result.stderr).toContain('fixture native loader failed');
  await checkIsolation(fixture);
});

test('loader rejects missing implicit skills and cleans its isolated fixture', async () => {
  const fixture = await loaderFixture('missing-skill');
  const result = await runLoader(fixture);
  expect(result.code).not.toBe(0);
  expect(result.stderr).toContain('Codex did not discover poteto-mode');
  await checkIsolation(fixture);
});
