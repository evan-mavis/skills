import { expect, test } from 'bun:test';
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { spawn, spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';

type HookOutput = { hookSpecificOutput: { hookEventName: string; additionalContext: string } };

const pluginRoot = path.resolve(import.meta.dir, '../estack');
const script = path.join(pluginRoot, 'hooks/scripts/poteto-mode-state.mjs');
const base = { session_id: 'chat-one', cwd: '/workspace/project-a', hook_event_name: 'UserPromptSubmit' };

async function fixture(run: (pluginData: string) => Promise<void>) {
  const root = await mkdtemp(path.join(tmpdir(), 'estack-hooks-'));
  try { await run(root); } finally { await rm(root, { recursive: true, force: true }); }
}

function hook(pluginData: string, input: unknown, extraEnv = {}) {
  const result = spawnSync('node', [script], {
    input: typeof input === 'string' ? input : JSON.stringify(input), encoding: 'utf8',
    env: { ...process.env, PLUGIN_ROOT: pluginRoot, PLUGIN_DATA: pluginData, ...extraEnv }, timeout: 2000,
  });
  expect(result.status).toBe(0);
  expect(result.stderr).toBe('');
  return result.stdout.trim() ? JSON.parse(result.stdout) as HookOutput : null;
}

function context(output: HookOutput | null) { return output?.hookSpecificOutput?.additionalContext ?? ''; }

test('explicit activation forms persist and remind through real hook stdin and stdout', async () => {
  const forms = [
    '$estack build it', '$estack:estack build it', '$poteto-mode build it', '$estack:poteto-mode build it',
    '@Estack build it', '@estack build it', '[@Estack](plugin://estack@created-by-me-remote) build it',
    '[$estack:estack](/plugins/cache/skills/estack/SKILL.md) build it',
    '[$poteto-mode](/plugins/cache/skills/poteto-mode/SKILL.md) build it',
    '[$estack:poteto-mode](/plugins/with spaces/skills/poteto-mode/SKILL.md) build it',
    'Use estack and poteto-mode for this task. Build it.',
    'Use $estack and poteto-mode for this task.',
    'Use $poteto-mode to apply concise communication and verified execution.',
    '[@Estack](plugin://estack@evan-skills) build it',
  ];
  await fixture(async (data) => {
    for (const [index, prompt] of forms.entries()) {
      const input = { ...base, session_id: `chat-${index}`, prompt };
      expect(context(hook(data, input))).toContain('read poteto-mode/SKILL.md and the selected playbook file in full');
      expect(context(hook(data, { ...input, prompt: 'continue' }))).toContain('Track every playbook step');
    }
    const states = await readdir(path.join(data, 'poteto-mode/sessions'));
    expect(states.length).toBe(forms.length);
    expect(states.every((name) => /^[a-f0-9]{64}\.json$/.test(name))).toBe(true);
    const persisted = JSON.parse(await readFile(path.join(data, 'poteto-mode/sessions', states[0]), 'utf8'));
    expect(persisted.active).toBe(true);
    expect(persisted).not.toHaveProperty('prompt');
    expect(persisted).not.toHaveProperty('session_id');
    expect(persisted).not.toHaveProperty('cwd');
  });
});

test('examples, quotations, other identities and malformed links cannot activate', async () => {
  await fixture(async (data) => {
    expect(context(hook(data, { ...base, session_id: 'positive', prompt: '$estack build it' }))).toContain('Estack and Poteto Mode are active');
    for (const prompt of [
      'please use $estack', 'The command is $poteto-mode', '`$estack` build it', '> $estack build it',
      '"$estack build it"', '$estack-extra build it', '$other:poteto-mode build it', '@EstackExtra build it',
      '[@Estack](plugin://other@created-by-me-remote) build it',
      '[@Estack](plugin://estack-extra@created-by-me-remote) build it',
      '[$estack](/plugins/skills/poteto-mode/SKILL.md)',
      '[$estack:poteto-mode](/plugins/../skills/poteto-mode/SKILL.md)',
      '[$estack](https://example.com/skills/estack/SKILL.md)',
      '[$estack](skills/estack/SKILL.md)',
    ]) expect(hook(data, { ...base, prompt })).toBe(null);
  });
});

test('session and project isolation survives cwd changes, advisory session end and resume', async () => {
  await fixture(async (data) => {
    expect(context(hook(data, { ...base, prompt: '$estack build it' }))).toContain('Estack and Poteto Mode are active');
    expect(hook(data, { ...base, session_id: 'chat-other', prompt: 'continue' })).toBe(null);
    expect(hook(data, { ...base, cwd: '/workspace/project-b', prompt: 'continue' })).toBe(null);
    expect(context(hook(data, { ...base, cwd: '/workspace/project-b', prompt: '$estack build it' }))).toContain('Estack and Poteto Mode are active');
    expect(context(hook(data, { ...base, prompt: 'continue' }))).toContain('Estack and Poteto Mode are active');
    expect(hook(data, { ...base, hook_event_name: 'SessionEnd' })).toBe(null);
    for (const source of ['resume', 'compact']) {
      const output = hook(data, { ...base, hook_event_name: 'SessionStart', source });
      expect(output?.hookSpecificOutput.hookEventName).toBe('SessionStart');
      expect(context(output)).toContain('Estack and Poteto Mode are active');
    }
    expect(hook(data, { ...base, hook_event_name: 'SessionStart', source: 'startup' })).toBe(null);
    expect((await readdir(path.join(data, 'poteto-mode/sessions'))).length).toBe(2);
    expect((await readdir(path.join(data, 'poteto-mode/receipts'))).length).toBe(2);
  });
});

test('explicit disable removes state and receipt for this project and permits reactivation', async () => {
  await fixture(async (data) => {
    for (const prompt of ['disable $estack', 'Disable $poteto-mode.', 'disable $estack:estack', 'disable $estack:poteto-mode!']) {
      expect(context(hook(data, { ...base, prompt: '$estack build it' }))).toContain('Estack and Poteto Mode are active');
      expect(hook(data, { ...base, prompt })).toBe(null);
      expect(hook(data, { ...base, prompt: 'continue' })).toBe(null);
      expect(await readdir(path.join(data, 'poteto-mode/sessions'))).toEqual([]);
      expect(await readdir(path.join(data, 'poteto-mode/receipts'))).toEqual([]);
    }
    expect(context(hook(data, { ...base, prompt: '$estack build it' }))).toContain('Estack and Poteto Mode are active');
    expect(context(hook(data, { ...base, prompt: 'thanks' }))).toContain('Keep casual turns brief and honor current user opt-outs');
  });
});

test('expired state and receipts are collected, fresh activation survives cleanup', async () => {
  await fixture(async (data) => {
    expect(context(hook(data, { ...base, prompt: '$estack build it' }))).toContain('Estack and Poteto Mode are active');
    for (const directory of ['sessions', 'receipts']) {
      const root = path.join(data, 'poteto-mode', directory);
      const name = (await readdir(root))[0];
      const file = path.join(root, name);
      const state = JSON.parse(await readFile(file, 'utf8'));
      state.updatedAt = '2000-01-01T00:00:00.000Z';
      state.lastHookAt = '2000-01-01T00:00:00.000Z';
      await writeFile(file, JSON.stringify(state));
    }
    expect(hook(data, { ...base, prompt: 'continue' })).toBe(null);
    expect(context(hook(data, { ...base, session_id: 'fresh', prompt: '$estack build it' }))).toContain('Estack and Poteto Mode are active');
    expect((await readdir(path.join(data, 'poteto-mode/sessions'))).length).toBe(1);
    expect((await readdir(path.join(data, 'poteto-mode/receipts'))).length).toBe(1);
  });
});

test('malformed input fails closed, hashes unusual session IDs and never reads transcripts', async () => {
  await fixture(async (data) => {
    for (const input of ['not json', '', null, [], { ...base, session_id: '', prompt: '$estack build it' },
      { ...base, session_id: 'x'.repeat(513), prompt: '$estack build it' },
      { ...base, cwd: 'relative/path', prompt: '$estack build it' },
      { ...base, cwd: 'bad\0cwd', prompt: '$estack build it' }]) expect(hook(data, input)).toBe(null);
    const transcript = path.join(data, 'transcript.jsonl');
    await writeFile(transcript, '$estack build it\n');
    expect(hook(data, { ...base, transcript_path: transcript, prompt: 'continue' })).toBe(null);
    expect(context(hook(data, { ...base, session_id: '../../outside', transcript_path: '/unreadable/transcript', prompt: '$estack build it' }))).toContain('Estack and Poteto Mode are active');
    expect((await readdir(path.join(data, 'poteto-mode/sessions'))).length).toBe(1);
    expect(hook(data, { ...base, prompt: '$estack build it' }, { PLUGIN_DATA: '' })).toBe(null);
    const stateFile = path.join(data, 'poteto-mode/sessions', (await readdir(path.join(data, 'poteto-mode/sessions')))[0]);
    await writeFile(stateFile, '{invalid json');
    expect(hook(data, { ...base, session_id: '../../outside', prompt: 'continue' })).toBe(null);
    expect(await readdir(path.join(data, 'poteto-mode/sessions'))).toEqual([]);
  });
});

test('manifest commands run from another cwd using plugin environment and emit valid event context', async () => {
  const manifest = JSON.parse(await readFile(path.join(pluginRoot, 'hooks/hooks.json'), 'utf8'));
  await fixture(async (data) => {
    for (const event of ['UserPromptSubmit', 'SessionStart', 'SessionEnd']) {
      const command = manifest.hooks[event][0].hooks[0].command;
      const result = spawnSync('/bin/sh', ['-c', command], {
        cwd: data, input: JSON.stringify({ ...base, hook_event_name: event, source: 'resume', prompt: '$estack build it' }),
        encoding: 'utf8', env: { ...process.env, PLUGIN_ROOT: pluginRoot, PLUGIN_DATA: data }, timeout: 2000,
      });
      expect(result.status).toBe(0);
      expect(result.stderr).toBe('');
      if (event === 'SessionEnd') expect(result.stdout).toBe('');
      else expect(JSON.parse(result.stdout).hookSpecificOutput.hookEventName).toBe(event);
    }
    expect(context(hook(data, { ...base, prompt: 'continue' }))).toContain('Estack and Poteto Mode are active');
  });
});

test('simultaneous activation writes produce complete isolated JSON with no temporary files', async () => {
  await fixture(async (data) => {
    await Promise.all(Array.from({ length: 12 }, (_, index) => new Promise<void>((resolve, reject) => {
      const child = spawn('node', [script], {
        env: { ...process.env, PLUGIN_ROOT: pluginRoot, PLUGIN_DATA: data }, stdio: ['pipe', 'pipe', 'pipe'],
      });
      let stdout = '';
      let stderr = '';
      child.stdout.on('data', (chunk) => { stdout += chunk; });
      child.stderr.on('data', (chunk) => { stderr += chunk; });
      child.on('error', reject);
      child.on('close', (status) => {
        try {
          expect(status).toBe(0);
          expect(stderr).toBe('');
          expect(context(JSON.parse(stdout) as HookOutput)).toContain('Estack and Poteto Mode are active');
          resolve();
        } catch (error) { reject(error); }
      });
      child.stdin.end(JSON.stringify({ ...base, session_id: `chat-${index % 3}`, prompt: '$estack build it' }));
    })));
    for (const directory of ['sessions', 'receipts']) {
      const root = path.join(data, 'poteto-mode', directory);
      const files = await readdir(root);
      expect(files.length).toBe(3);
      expect(files.every((name) => /^[a-f0-9]{64}\.json$/.test(name))).toBe(true);
      for (const name of files) expect(JSON.parse(await readFile(path.join(root, name), 'utf8')).schema).toBe(1);
    }
    for (let index = 0; index < 3; index++) {
      expect(context(hook(data, { ...base, session_id: `chat-${index}`, prompt: 'continue' }))).toContain('Estack and Poteto Mode are active');
    }
  });
});
