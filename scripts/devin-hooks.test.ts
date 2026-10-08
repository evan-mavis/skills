import { expect, test } from 'bun:test';
import { readFile, readdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { packageHooks } from './package-devin-hooks.mjs';

const root = path.resolve(import.meta.dir, '../estack-devin');
const config = JSON.parse(await readFile(path.join(root, 'hooks.json'), 'utf8'));
const base = { session_id: 'session-one', hook_event_name: 'UserPromptSubmit' };

async function fixture(run: (state: string) => Promise<void>) {
  const state = await mkdtemp(path.join(tmpdir(), 'devin hooks '));
  try { await run(state); } finally { await rm(state, { recursive: true, force: true }); }
}

function hook(state: string, input: any, project = '/workspace/project a') {
  const event = typeof input === 'object' ? input.hook_event_name : 'UserPromptSubmit';
  const result = spawnSync('/bin/sh', ['-c', config[event][0].hooks[0].command], {
    cwd: tmpdir(), input: typeof input === 'string' ? input : JSON.stringify(input), encoding: 'utf8',
    env: { ...process.env, XDG_STATE_HOME: state, DEVIN_PROJECT_DIR: project, PLUGIN_ROOT: '', PLUGIN_DATA: '' },
    timeout: 2000,
  });
  expect(result.status).toBe(0);
  expect(result.stderr).toBe('');
  return result.stdout.trim() ? JSON.parse(result.stdout) : null;
}

test('Devin native config embeds current source and needs no plugin-root variables', async () => {
  expect(config).toEqual(packageHooks(await readFile(path.join(root, 'hooks/scripts/poteto-mode-state.mjs'), 'utf8')));
  expect(Object.keys(config)).toEqual(['SessionStart', 'UserPromptSubmit', 'PostCompaction', 'SessionEnd']);
});

test('explicit native commands persist through prompts, resume and compaction, and disable clears state', async () => {
  await fixture(async state => {
    for (const [i, prompt] of ['/estack-devin:estack build', '/estack-devin:poteto-mode build', '/estack build', '/poteto-mode build'].entries()) {
      const input = { ...base, session_id: `session-${i}`, prompt };
      expect(hook(state, input).hookSpecificOutput.additionalContext).toContain('resolve estack-devin:estack');
      expect(hook(state, { ...input, prompt: 'continue', prompt_id: 'next-turn' }).hookSpecificOutput.additionalContext).toContain('Track every playbook step');
      expect(hook(state, { ...input, hook_event_name: 'SessionEnd' })).toBe(null);
      for (const event of ['SessionStart', 'PostCompaction']) {
        expect(hook(state, { ...input, hook_event_name: event }).hookSpecificOutput.hookEventName).toBe(event);
      }
      expect(hook(state, { ...input, prompt: 'disable /estack-devin:estack' })).toBe(null);
      expect(hook(state, { ...input, prompt: 'continue' })).toBe(null);
      expect(hook(state, { ...input, hook_event_name: 'PostCompaction' })).toBe(null);
    }
  });
});

test('quoted commands and foreign identities cannot activate; state is scoped to session and project', async () => {
  await fixture(async state => {
    for (const prompt of ['please use /estack', '`/estack` build', '> /estack build', '"/estack build"', '/other:estack build', '/estack-extra build', '$estack build']) {
      expect(hook(state, { ...base, prompt })).toBe(null);
    }
    expect(hook(state, { ...base, prompt: '/estack-devin:estack build' })).not.toBe(null);
    expect(hook(state, { ...base, session_id: 'other', prompt: 'continue' })).toBe(null);
    expect(hook(state, { ...base, prompt: 'continue' }, '/workspace/project b')).toBe(null);
    expect(hook(state, { ...base, prompt: 'continue' }, '')).toBe(null);
    const directory = path.join(state, 'estack-devin/poteto-mode/sessions');
    const files = await readdir(directory);
    expect(files).toHaveLength(1);
    expect(files[0]).toMatch(/^[a-f0-9]{64}\.json$/);
    const text = await readFile(path.join(directory, files[0]), 'utf8');
    expect(text).not.toContain('session-one');
    expect(text).not.toContain('/workspace');
    expect(text).not.toContain('prompt');
    const value = JSON.parse(text);
    value.updatedAt = '2000-01-01T00:00:00.000Z';
    await writeFile(path.join(directory, files[0]), JSON.stringify(value));
    expect(hook(state, { ...base, prompt: 'continue' })).toBe(null);
    expect(await readdir(directory)).toHaveLength(0);
  });
});

test('corrupt state and malformed stdin fail open', async () => {
  await fixture(async state => {
    expect(hook(state, '{broken')).toBe(null);
    expect(hook(state, { ...base, session_id: '', prompt: '/estack build' })).toBe(null);
    hook(state, { ...base, prompt: '/estack build' });
    const directory = path.join(state, 'estack-devin/poteto-mode/sessions');
    const [file] = await readdir(directory);
    await writeFile(path.join(directory, file), '{broken');
    expect(hook(state, { ...base, prompt: 'continue' })).toBe(null);
  });
});
