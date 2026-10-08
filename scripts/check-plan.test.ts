import { expect, test } from 'bun:test';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

test.each(['estack', 'estack-devin', 'estack-factory', 'estack-cursor'])('%s plan template passes its checker after filling placeholders', async variant => {
  const directory = await mkdtemp(path.join(tmpdir(), 'estack-plan-'));
  try {
    const scripts = path.resolve(import.meta.dir, '..', variant, 'skills/poteto-mode/scripts');
    const source = await readFile(path.join(scripts, '../playbooks/multi-phase-plan.md'), 'utf8');
    const template = source.match(/````markdown\n([\s\S]*?)\n````/);
    expect(template).not.toBeNull();
    const plan = template![1].replace(/<[^>\n]+>/g, 'verified-example');
    const file = path.join(directory, 'plan.md');
    await writeFile(file, plan);
    async function check() {
      const process = Bun.spawn(['node', path.join(scripts, 'check-plan.mjs'), file], { stdout: 'pipe', stderr: 'pipe' });
      const [stdout, stderr, code] = await Promise.all([new Response(process.stdout).text(), new Response(process.stderr).text(), process.exited]);
      return { stdout, stderr, code };
    }
    const result = await check();
    expect(result.stderr).toBe('');
    expect(result.code).toBe(0);
    expect(result.stdout).toContain('1 PR sections, 0 problems');
    // The checker must still reject the original wording regression.
    await writeFile(file, plan.replace('Ten lanes on `', 'Ten lanes with `'));
    const regression = await check();
    expect(regression.code).toBe(1);
    expect(regression.stderr).toContain('Verify, live lacks');
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
