import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const root = path.join(repo, 'estack-capy');
const errors = [];
const report = (file, message) => errors.push(`${path.relative(repo, file)}: ${message}`);
async function walk(dir) {
  const result = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isSymbolicLink()) report(file, 'symlinks are not supported');
    else if (entry.isDirectory()) result.push(...await walk(file));
    else if (entry.isFile()) result.push(file);
  }
  return result;
}

const plugin = JSON.parse(await readFile(path.join(root, 'plugin.json'), 'utf8'));
const mcp = JSON.parse(await readFile(path.join(root, 'mcp.json'), 'utf8'));
if (plugin.$schema !== 'https://agent-plugins.org/schemas/1.1.0/plugin.schema.json' || !plugin.name || !plugin.version) report(root, 'invalid plugin metadata');
if (mcp.$schema !== 'https://agent-plugins.org/schemas/1.1.0/mcp.schema.json' || !mcp.mcpServers) report(root, 'invalid MCP metadata');
const files = await walk(root);
const skills = files.filter(file => /^skills\/[^/]+\/SKILL\.md$/.test(path.relative(root, file)));
const names = new Set(skills.map(file => path.basename(path.dirname(file))));
const sourceNames = (await readdir(path.join(repo, 'estack-devin/skills'), { withFileTypes: true })).filter(entry => entry.isDirectory()).map(entry => entry.name);
for (const name of sourceNames) if (!names.has(name)) report(root, `missing skill: ${name}`);
const capyOnly = new Set(['capture', 'design-critic', 'prototype']);
for (const name of capyOnly) if (!names.has(name)) report(root, `missing Capy-native skill: ${name}`);
for (const name of names) if (!sourceNames.includes(name) && !capyOnly.has(name)) report(root, `unexpected skill: ${name}`);
for (const file of skills) {
  const match = (await readFile(file, 'utf8')).match(/^---\n([\s\S]*?)\n---\n/);
  if (!match) { report(file, 'missing frontmatter'); continue; }
  if (/^\s*\{/.test(match[1])) report(file, 'frontmatter must use a block mapping for Capy discovery');
  const metadata = Bun.YAML.parse(match[1]);
  if (metadata.name !== path.basename(path.dirname(file)) || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(metadata.name) || metadata.name.length > 64) report(file, 'invalid name');
  if (typeof metadata.description !== 'string' || !metadata.description.trim() || metadata.description.length > 1024) report(file, 'invalid description');
}
for (const file of files.filter(file => file.endsWith('.md'))) {
  const text = (await readFile(file, 'utf8')).replace(/^```[^\n]*\n[\s\S]*?^```\s*$/gm, '').replace(/`[^`\n]+`/g, '');
  for (const match of text.matchAll(/\[[^\]\n]*\]\(([^\s)]+)\)/g)) {
    const [destination, anchor] = match[1].split('#');
    if (!destination || /^(?:\w+:|\/|~|<)/.test(destination) || ['url', '…'].includes(destination)) continue;
    const target = path.resolve(path.dirname(file), destination);
    if (!target.startsWith(`${root}${path.sep}`)) { report(file, `reference escapes package: ${destination}`); continue; }
    try {
      const info = await stat(target);
      if (anchor && info.isFile() && target.endsWith('.md')) {
        const headings = [...(await readFile(target, 'utf8')).matchAll(/^#{1,6}\s+(.+)$/gm)].map(m => m[1].toLowerCase().replace(/[^\w -]/g, '').replace(/ /g, '-'));
        if (!headings.includes(anchor)) report(file, `missing heading: ${match[1]}`);
      }
    } catch { report(file, `missing reference: ${destination}`); }
  }
}
if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
else console.log(`Verified ${skills.length} Capy skills, package metadata, and bundled links.`);
