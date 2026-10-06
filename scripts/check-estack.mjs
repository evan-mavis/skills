import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

if (process.argv.length > 2) throw new Error('Usage: bun scripts/check-estack.mjs');

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const root = path.join(repo, 'estack');
const errors = [];
async function filesAt(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (['node_modules', '.git', '.DS_Store'].includes(entry.name)) continue;
    const location = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await filesAt(location));
    else if (entry.isFile()) files.push(location);
  }
  return files;
}
const report = (file, message) => errors.push(`${path.relative(repo, file)}: ${message}`);
const files = await filesAt(root);
const skillFiles = files.filter(file => /^skills\/[^/]+\/SKILL\.md$/.test(path.relative(root, file)));
const skillDirectories = new Set(skillFiles.map(file => path.dirname(file)));
for (const file of files) {
  const relative = path.relative(root, file).split(path.sep);
  if (relative[0] === 'skills' && !skillDirectories.has(path.join(root, 'skills', relative[1]))) {
    report(file, 'supporting file has no registered skill owner');
  }
}
const supported = new Set(['name', 'description', 'license', 'allowed-tools', 'metadata']);
const minorWords = new Set(['a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'from', 'in', 'nor', 'of', 'on', 'or', 'the', 'to', 'with']);
const specialWords = { apis: 'APIs', pr: 'PR', tdd: 'TDD', typescript: 'TypeScript' };
let links = 0;
for (const file of skillFiles) {
  const text = await readFile(file, 'utf8');
  const match = text.match(/^---\n([\s\S]*?)\n---\n/);
  if (!match) { report(file, 'missing frontmatter'); continue; }
  const frontmatter = Bun.YAML.parse(match[1]);
  if (frontmatter.name !== path.basename(path.dirname(file)) || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(frontmatter.name) || frontmatter.name.length > 64) report(file, 'invalid skill name');
  if (typeof frontmatter.description !== 'string' || !frontmatter.description.trim() || frontmatter.description.length > 1024 || /[<>]/.test(frontmatter.description)) report(file, 'invalid description');
  for (const key of Object.keys(frontmatter)) if (!supported.has(key)) report(file, `unsupported frontmatter field ${key}`);
  const metadata = Bun.YAML.parse(await readFile(path.join(path.dirname(file), 'agents/openai.yaml'), 'utf8'));
  const ui = metadata.interface;
  if (!ui?.display_name || !/^[A-Z]/.test(ui.display_name)) report(file, 'missing capitalized display name');
  if (ui?.display_name) {
    const words = ui.display_name.split(' ');
    const title = words.map((word, index) => specialWords[word.toLowerCase()] ??
      (index > 0 && index < words.length - 1 && minorWords.has(word.toLowerCase()) ? word.toLowerCase() : word[0].toUpperCase() + word.slice(1))).join(' ');
    if (title !== ui.display_name) report(file, `display name must use Title Case: ${title}`);
  }
  if (typeof ui?.short_description !== 'string' || ui.short_description.length < 25 || ui.short_description.length > 64) report(file, 'invalid UI description length');
  if (!ui?.default_prompt?.includes(`$${frontmatter.name}`)) report(file, 'default prompt must invoke this skill');
}
for (const file of files.filter(file => file.endsWith('.md'))) {
  const body = (await readFile(file, 'utf8')).replace(/^```[^\n]*\n[\s\S]*?^```\s*$/gm, '');
  if (skillFiles.includes(file)) {
    const unlinked = body.replace(/\[[^\]\n]*\]\([^\s)]+\)/g, '');
    for (const match of unlinked.matchAll(/`(references\/[^`\s<>*]+\.md(?:#[^`\s]+)?)`/g)) {
      report(file, `supporting reference must be a Markdown link: ${match[1]}`);
    }
  }
  const text = body.replace(/`[^`\n]+`/g, '');
  for (const match of text.matchAll(/\[[^\]\n]*\]\(([^\s)]+)\)/g)) {
    const [destination, anchor] = match[1].split('#');
    if (!destination || /^(?:\w+:|\/|~|<)/.test(destination) || ['url', '…'].includes(destination)) continue;
    links++;
    const target = path.resolve(path.dirname(file), destination);
    if (!target.startsWith(`${root}${path.sep}`)) { report(file, `reference escapes plugin: ${destination}`); continue; }
    try {
      const info = await stat(target);
      if (anchor && info.isFile() && target.endsWith('.md')) {
        const headings = [...(await readFile(target, 'utf8')).matchAll(/^#{1,6}\s+(.+)$/gm)].map(match => match[1].toLowerCase().replace(/[^\w -]/g, '').replace(/ /g, '-'));
        if (!headings.includes(anchor)) report(file, `missing heading: ${match[1]}`);
      }
    } catch { report(file, `missing reference: ${destination}`); }
  }
}
if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
else console.log(`Verified ${skillFiles.length} Codex skills, UI metadata, and ${links} bundled references.`);
