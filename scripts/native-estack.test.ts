import { expect, test } from 'bun:test';
import { mkdtemp, mkdir, writeFile, utimes, rm } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { latestWorktreeSession } from './estack/package/skills/poteto-mode/scripts/latest-worktree-session.mjs';

test('latest chat uses recorded Codex cwd, not unrelated messages or path prefixes', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'estack-sessions-'));
  try {
    await mkdir(path.join(root, '2026/09/30'), { recursive: true });
    const entries = [
      ['older', '/repo/feature', 100],
      ['newer', '/repo/feature', 200],
      ['prefix', '/repo/feature-other', 300],
      ['unrelated', '/private', 400],
    ] as const;
    for (const [name, cwd, timestamp] of entries) {
      const file = path.join(root, '2026/09/30', `${name}.jsonl`);
      await writeFile(file, JSON.stringify({ type: 'session_meta', payload: { cwd } }) + '\n' +
        JSON.stringify({ type: 'message', text: '/repo/feature' }) + '\n');
      await utimes(file, timestamp, timestamp);
    }
    await writeFile(path.join(root, 'empty.jsonl'), '');
    await writeFile(path.join(root, 'invalid.jsonl'), 'not json\n');
    expect(await latestWorktreeSession(root, '/repo/feature')).toBe(200);
    expect(await latestWorktreeSession(root, '/repo/unknown')).toBe(0);
    expect(await latestWorktreeSession(path.join(root, 'missing'), '/repo/feature')).toBe(0);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
