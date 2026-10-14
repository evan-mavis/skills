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
  'symbolic-ref --quiet refs/remotes/origin/HEAD') echo refs/remotes/origin/master ;;
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

const auditVariants = ['estack', 'estack-devin', 'estack-factory', 'estack-cursor'];

async function auditFixture(defaultBranch: string) {
  const root = await mkdtemp(path.join(tmpdir(), 'estack audit default-'));
  const repo = path.join(root, 'repo');
  const bin = path.join(root, 'bin');
  const worker = path.join(root, 'worker');
  await mkdir(repo);
  await mkdir(bin);
  await writeFile(path.join(bin, 'gh'), '#!/usr/bin/env bash\nexit 1\n', { mode: 0o755 });
  const env = { ...Bun.env, PATH: `${bin}:${Bun.env.PATH}`, GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: '/dev/null' };
  const git = (...args: string[]) => {
    const result = Bun.spawnSync(['git', ...args], { cwd: repo, env });
    if (result.exitCode !== 0) throw new Error(result.stderr.toString());
    return result.stdout.toString().trim();
  };
  git('init', '-b', defaultBranch);
  git('-c', 'user.name=Audit fixture', '-c', 'user.email=audit@example.test', 'commit', '--allow-empty', '-m', 'fixture');
  git('update-ref', `refs/remotes/origin/${defaultBranch}`, 'HEAD');
  git('symbolic-ref', 'refs/remotes/origin/HEAD', `refs/remotes/origin/${defaultBranch}`);
  git('worktree', 'add', '-b', 'audit-worker', worker);
  return { root, repo, env, git };
}

async function runAudit(variant: string, fixture: Awaited<ReturnType<typeof auditFixture>>, args: string[] = []) {
  const audit = new URL(`../${variant}/skills/poteto-mode/scripts/worktree-audit.sh`, import.meta.url).pathname;
  const result = Bun.spawn(['bash', audit, ...args, fixture.repo], { env: fixture.env, stdout: 'pipe', stderr: 'pipe' });
  const [stdout, stderr, code] = await Promise.all([
    new Response(result.stdout).text(), new Response(result.stderr).text(), result.exited,
  ]);
  return { stdout, stderr, code };
}

test.each(auditVariants)('%s audit holds Origin open and draft PRs and falls back to GitHub', async variant => {
  const fixture = await auditFixture('master');
  const bin = path.join(fixture.root, 'bin');
  const origin = path.join(bin, 'origin');
  const gh = path.join(bin, 'gh');
  const ghCalled = path.join(fixture.root, 'gh-called');
  const forge = (rows: unknown) => '#!/usr/bin/env bash\ncat <<\'JSON\'\n' + JSON.stringify(rows) + '\nJSON\n';
  try {
    await writeFile(gh, `#!/usr/bin/env bash\ntouch '${ghCalled}'\ncat <<'JSON'\n[{"number":42,"state":"OPEN","headRefName":"audit-worker"}]\nJSON\n`, { mode: 0o755 });
    for (const status of ['open', 'draft']) {
      await writeFile(origin, forge([{ number: 41, status, headRef: 'audit-worker' }]), { mode: 0o755 });
      const result = await runAudit(variant, fixture);
      expect(result.code).toBe(0);
      expect(result.stdout).toContain(`#41/${status}\t`);
      expect(result.stdout).toContain('\thold-open-pr\t');
      expect(await Bun.file(ghCalled).exists()).toBe(false);
    }
    for (const originReply of [
      '#!/usr/bin/env bash\nexit 1\n',
      '#!/usr/bin/env bash\nexit 0\n',
      '#!/usr/bin/env bash\necho invalid-json\n',
      forge({}),
      '#!/usr/bin/env bash\nprintf \'[]\\n[]\\n\'\n',
      forge([{ number: 41, status: 'unknown', headRef: 'audit-worker' }]),
      forge([{ number: 41, status: 'open' }]),
    ]) {
      await writeFile(origin, originReply, { mode: 0o755 });
      const result = await runAudit(variant, fixture);
      expect(result.code).toBe(0);
      expect(result.stdout).toContain('#42/open\t');
      expect(result.stdout).toContain('\thold-open-pr\t');
      expect(await Bun.file(ghCalled).exists()).toBe(true);
      await rm(ghCalled);
    }
    await writeFile(origin, forge([]), { mode: 0o755 });
    const emptyList = await runAudit(variant, fixture);
    expect(emptyList.code).toBe(0);
    expect(emptyList.stdout).not.toContain('#42/open\t');
    expect(await Bun.file(ghCalled).exists()).toBe(false);
    await rm(origin);
    const githubOnly = await runAudit(variant, fixture);
    expect(githubOnly.stdout).toContain('#42/open\t');
    expect(githubOnly.stdout).toContain('\thold-open-pr\t');
  } finally {
    await rm(fixture.root, { recursive: true, force: true });
  }
});

test.each(auditVariants)('%s audit resolves a non-main default branch', async variant => {
  const fixture = await auditFixture('master');
  try {
    const result = await runAudit(variant, fixture);
    expect(result.code).toBe(0);
    expect(result.stdout).toContain('\tYES\tclean\t');
    expect(result.stderr).toContain('origin/master');
    expect(result.stderr).not.toContain('origin/main');
  } finally {
    await rm(fixture.root, { recursive: true, force: true });
  }
});

test.each(auditVariants)('%s audit refuses to guess when origin/HEAD is missing', async variant => {
  const fixture = await auditFixture('main');
  try {
    fixture.git('symbolic-ref', '--delete', 'refs/remotes/origin/HEAD');
    const result = await runAudit(variant, fixture);
    expect(result.code).toBe(1);
    expect(result.stdout).toBe('');
    expect(result.stderr).toContain('cannot resolve origin/HEAD');
  } finally {
    await rm(fixture.root, { recursive: true, force: true });
  }
});

test.each(auditVariants)('%s audit rejects a dangling default branch ref', async variant => {
  const fixture = await auditFixture('trunk');
  try {
    fixture.git('update-ref', '-d', 'refs/remotes/origin/trunk');
    const result = await runAudit(variant, fixture);
    expect(result.code).toBe(1);
    expect(result.stdout).toBe('');
    expect(result.stderr).toContain('cannot verify refs/remotes/origin/trunk');
  } finally {
    await rm(fixture.root, { recursive: true, force: true });
  }
});

test.each(auditVariants)('%s audit accepts an explicit base without origin/HEAD', async variant => {
  const fixture = await auditFixture('main');
  try {
    fixture.git('symbolic-ref', '--delete', 'refs/remotes/origin/HEAD');
    const result = await runAudit(variant, fixture, ['--base', 'main']);
    expect(result.code).toBe(0);
    expect(result.stdout).toStartWith('# base: main\n');
    expect(result.stdout).toContain('\tYES\tclean\t');
  } finally {
    await rm(fixture.root, { recursive: true, force: true });
  }
});

test.each(auditVariants)('%s audit fetches a base absent from a single-branch clone', async variant => {
  const fixture = await auditFixture('main');
  try {
    const remote = path.join(fixture.root, 'remote.git');
    fixture.git('init', '--bare', remote);
    fixture.git('remote', 'add', 'origin', remote);
    fixture.git('config', 'remote.origin.fetch', '+refs/heads/main:refs/remotes/origin/main');
    fixture.git('push', 'origin', 'HEAD:refs/heads/release');
    fixture.git('update-ref', '-d', 'refs/remotes/origin/release');
    const result = await runAudit(variant, fixture, ['-b', 'origin/release']);
    expect(result.code).toBe(0);
    expect(result.stdout).toStartWith('# base: origin/release\n');
    expect(result.stdout).toContain('\tYES\tclean\t');
    expect(fixture.git('rev-parse', 'origin/release')).toBe(fixture.git('rev-parse', 'HEAD'));
  } finally {
    await rm(fixture.root, { recursive: true, force: true });
  }
});

test.each(auditVariants)('%s audit handles help and invalid options', async variant => {
  const fixture = await auditFixture('main');
  try {
    const help = await runAudit(variant, fixture, ['--help']);
    expect(help.code).toBe(0);
    expect(help.stdout).toContain('Usage: worktree-audit.sh [-b|--base <ref>] [repo-path]');
    const unknown = await runAudit(variant, fixture, ['--unknown']);
    expect(unknown.code).toBe(2);
    expect(unknown.stderr).toContain('unknown option');
    const missing = await runAudit(variant, fixture, ['--base', 'origin/missing']);
    expect(missing.code).toBe(1);
    expect(missing.stderr).toContain('cannot verify origin/missing');
    expect(missing.stdout).toBe('');
  } finally {
    await rm(fixture.root, { recursive: true, force: true });
  }
});
