import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../estack-devin');

export function packageHooks(source) {
  const program = source.replace(/^#![^\n]*\n/, '')
    .replace(/^export /gm, '')
    .replace(/if \(process\.argv\[1\][\s\S]*$/, 'main().catch(() => { process.exitCode = 1; });\n');
  const command = `node --input-type=module -e '${program.replaceAll("'", "'\\''")}'`;
  return Object.fromEntries(['SessionStart', 'UserPromptSubmit', 'PostCompaction', 'SessionEnd'].map(event => [
    event, [{ hooks: [{ type: 'command', command, timeout: 2 }] }],
  ]));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const source = await readFile(path.join(root, 'hooks/scripts/poteto-mode-state.mjs'), 'utf8');
  await writeFile(path.join(root, 'hooks.json'), `${JSON.stringify(packageHooks(source), null, 2)}\n`);
}
