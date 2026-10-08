import { expect, test } from 'bun:test';
import { mkdtemp, mkdir, writeFile, utimes, rm } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { latestWorktreeSession } from '../estack/skills/poteto-mode/scripts/latest-worktree-session.mjs';

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

test.each(['devin', 'factory', 'cursor'])('%s audit requires ownership verification when usage history is unavailable', async platform => {
  const root = await mkdtemp(path.join(tmpdir(), 'estack native audit-'));
  try {
    const bin = path.join(root, 'bin');
    await mkdir(bin);
    await mkdir(path.join(root, 'main'));
    await mkdir(path.join(root, 'worker'));
    await writeFile(path.join(bin, 'git'), `#!/usr/bin/env bash
case "$*" in
  'worktree list --porcelain') printf 'worktree %s/main\\n\\nworktree %s/worker\\n' "$AUDIT_FIXTURE" "$AUDIT_FIXTURE" ;;
  *'rev-parse HEAD'*) echo abc123 ;;
  *'log -1 --format=%ct'*) echo 1 ;;
  *'merge-base'*) exit 0 ;;
  *'status --porcelain'*) exit 0 ;;
  *'symbolic-ref'*) echo fixture-branch ;;
  *'show-ref'*) exit 1 ;;
  *) exit 0 ;;
esac
`, { mode: 0o755 });
    await writeFile(path.join(bin, 'gh'), '#!/usr/bin/env bash\nexit 1\n', { mode: 0o755 });
    const audit = new URL(`../estack-${platform}/skills/poteto-mode/scripts/worktree-audit.sh`, import.meta.url).pathname;
    const process = Bun.spawn(['bash', audit, path.join(root, 'main')], {
      env: { ...Bun.env, PATH: `${bin}:${Bun.env.PATH}`, AUDIT_FIXTURE: root },
      stdout: 'pipe', stderr: 'pipe',
    });
    const [stdout, code] = await Promise.all([new Response(process.stdout).text(), process.exited]);
    expect(code).toBe(0);
    expect(stdout).toContain('unavailable\tverify-usage\t');
    expect(stdout).not.toContain('\tsafe\t');
    expect(stdout).toContain(`\t${path.join(root, 'worker')}\n`);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
