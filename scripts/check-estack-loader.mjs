import { mkdtemp, mkdir, cp, readdir, readFile, rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const skills = path.join(repo, 'estack/skills');
const fixture = await mkdtemp(path.join(tmpdir(), 'estack-loader-'));
try {
  await mkdir(path.join(fixture, '.git'));
  await mkdir(path.join(fixture, '.agents'));
  await cp(skills, path.join(fixture, '.agents/skills'), { recursive: true });
  const messages = JSON.parse(execFileSync('codex', ['debug', 'prompt-input', '$estack describe the bundled workflow'], {
    cwd: fixture, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024, timeout: 30000,
  }));
  const catalog = messages.flatMap(message => message.content ?? [])
    .map(content => content.text ?? '').filter(text => text.includes('### Available skills')).join('\n');
  let checked = 0;
  for (const entry of await readdir(skills, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const directory = path.join(skills, entry.name);
    try { await readFile(path.join(directory, 'SKILL.md')); } catch { continue; }
    const metadata = Bun.YAML.parse(await readFile(path.join(directory, 'agents/openai.yaml'), 'utf8'));
    if (metadata.policy?.allow_implicit_invocation === false) continue;
    const line = catalog.split('\n').find(line => line.startsWith(`- ${entry.name}:`));
    if (!line || !line.includes(`/` + entry.name + '/SKILL.md)')) throw new Error(`Codex did not discover ${entry.name}`);
    await readFile(path.join(fixture, '.agents/skills', entry.name, 'SKILL.md'));
    checked++;
  }
  if (!catalog.split('\n').some(line => line.startsWith('- poteto-mode:'))) throw new Error('Estack must be able to discover Poteto Mode');
  console.log(`Codex discovered ${checked} bundled skills, including Poteto Mode. Bodies remain available on demand.`);
} finally {
  await rm(fixture, { recursive: true, force: true });
}
