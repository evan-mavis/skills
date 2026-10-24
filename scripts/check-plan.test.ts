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

test.each(['estack', 'estack-devin', 'estack-factory', 'estack-cursor'])('%s plan checker respects Markdown fences', async variant => {
  const directory = await mkdtemp(path.join(tmpdir(), 'estack-plan-fences-'));
  try {
    const scripts = path.resolve(import.meta.dir, '..', variant, 'skills/poteto-mode/scripts');
    const source = await readFile(path.join(scripts, '../playbooks/multi-phase-plan.md'), 'utf8');
    const template = source.match(/````markdown\n([\s\S]*?)\n````/);
    expect(template).not.toBeNull();
    const plan = template![1].replace(/<[^>\n]+>/g, 'verified-example');
    const examples: [string, number][] = [
      ['```markdown\n## Example only\n````\n', 0],
      ['   ```markdown\n## Example only\n   ```\n', 0],
      ['````markdown\n```markdown\n## Example only\n```\n````\n', 0],
      ['~~~markdown `info`\n## Example only\n ~~~\n', 0],
      ['````markdown\n~~~\n## Example only\n````\n', 0],
      ['````markdown\n```\n## Example only\n````\n', 0],
      ['````markdown\n``` info\n## Example only\n````\n', 0],
      ['```markdown\n## Example only\n```  \n## Example only\n', 1],
      ['```markdown\nA colon: inside code\n```\nA colon: outside code\n', 1],
      ['```markdown `invalid`\n## Example only\n```\n', 1],
    ];
    for (const [example, expected] of examples) {
      const file = path.join(directory, 'plan.md');
      await writeFile(file, plan + '\n' + example);
      const process = Bun.spawn(['node', path.join(scripts, 'check-plan.mjs'), file], { stdout: 'pipe', stderr: 'pipe' });
      const [stdout, stderr, code] = await Promise.all([new Response(process.stdout).text(), new Response(process.stderr).text(), process.exited]);
      expect(code).toBe(expected);
      if (expected === 0) {
        expect(stderr).toBe('');
        expect(stdout).toContain('1 PR sections, 0 problems');
      } else {
        expect(stderr).toMatch(/not an appendix|mid-sentence colon/);
      }
    }
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test.each(['estack', 'estack-devin', 'estack-factory', 'estack-cursor'])('%s validates coupled-feature units without implementation PRs', async variant => {
  const directory = await mkdtemp(path.join(tmpdir(), 'estack-coupled-plan-'));
  try {
    const skill = path.resolve(import.meta.dir, '..', variant, 'skills/poteto-mode');
    const source = await readFile(path.join(skill, 'references/coupled-feature-plan.md'), 'utf8');
    const plan = source.replace(/<[^>\n]+>/g, 'verified-example');
    const file = path.join(directory, 'plan.md');
    async function check(text: string) {
      await writeFile(file, text);
      const process = Bun.spawn(['node', path.join(skill, 'scripts/check-plan.mjs'), file], { stdout: 'pipe', stderr: 'pipe' });
      const [stdout, stderr, code] = await Promise.all([new Response(process.stdout).text(), new Response(process.stderr).text(), process.exited]);
      return { stdout, stderr, code };
    }
    const result = await check(plan);
    expect(result.code).toBe(0);
    expect(result.stderr).toBe('');
    expect(result.stdout).toContain('1 work unit sections, 0 problems');

    const unit = plan.slice(plan.indexOf('## verified-example (verified-example)'), plan.indexOf('## Close the program'));
    const twoUnits = await check(plan.replace('## Close the program', unit + '## Close the program'));
    expect(twoUnits.code).toBe(0);
    expect(twoUnits.stdout).toContain('2 work unit sections, 0 problems');

    const noReviewGate = plan.replace(/\*\*Review gate\.\*\*[\s\S]*?(?=\*\*Integrate\.\*\*)/, '**Review gate.** None. Existing delivery instructions cover readiness.\n\n');
    expect((await check(noReviewGate)).code).toBe(0);

    const regressions: [string, string][] = [
      [plan.replace('### Package for review', '### Deliver'), 'Package for review'],
      [plan.replace('### Integration mechanics', '### PR mechanics'), 'implementation PR lifecycle'],
      [plan.replace('**Integrate.**', '**Merge.**'), 'sub-blocks are'],
      [plan.replace('at the integration head.', 'at the PR head.'), 'Verify, live lacks'],
      [plan.replace('- [ ] Lane 10.', '- [ ] Lane 11.'), 'expected 1 to 10'],
      [plan.replace('- [ ] Baseline.', '- [ ] Before.'), 'perf boxes are'],
      [plan.replaceAll('A work unit is verified', 'A PR is verified'), 'does not open with the rule'],
      [plan.replace('coupled-feature', 'coupled-featre'), 'unknown delivery mode'],
      [plan.replace('**Delivery mode.** coupled-feature', '**Delivery mode.** coupled-feature\n**Delivery mode.** independent-queue'), 'duplicate delivery mode'],
      [plan.replace(unit, ''), 'no work unit sections'],
    ];
    for (const label of ['Integration branch.', 'Readiness.', 'Refinements.', 'Packaging.', 'Boundaries.', 'Final tree.', 'Landing.']) {
      const line = plan.split('\n').find(line => line.startsWith(`- [ ] ${label} `));
      expect(line).toBeDefined();
      if (!line) throw new Error(`Missing contract fixture ${label}`);
      regressions.push([plan.replace(line, ''), `contract lacks "${label}"`]);
      regressions.push([plan.replace(line, `- [ ] ${label}`), `contract lacks "${label}"`]);
      regressions.push([plan.replace(line, `\`\`\`markdown\n${line}\n\`\`\``), `contract lacks "${label}"`]);
    }
    for (const [text, message] of regressions) {
      const regression = await check(text);
      expect(regression.code).toBe(1);
      expect(regression.stderr).toContain(message);
    }
    const fencedMode = await check(plan + '\n```markdown\n**Delivery mode.** independent-queue\n```\n');
    expect(fencedMode.code).toBe(0);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
