import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const platform = process.argv[2] ?? 'codex';
if (process.argv.length > 3 || !['codex', 'devin', 'factory'].includes(platform)) {
  throw new Error('Usage: bun scripts/check-estack.mjs [codex|devin|factory]');
}

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const root = path.join(repo, platform === 'codex' ? 'estack' : `estack-${platform}`);
const errors = [];
async function filesAt(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (['node_modules', '.git', '.DS_Store'].includes(entry.name)) continue;
    const location = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await filesAt(location));
    else if (entry.isFile()) files.push(location);
    else if (entry.isSymbolicLink()) report(location, 'plugin files must be directly editable, not symlinks');
  }
  return files;
}
const report = (file, message) => errors.push(`${path.relative(repo, file)}: ${message}`);
const files = await filesAt(root);
const skillFiles = files.filter(file => /^skills\/[^/]+\/SKILL\.md$/.test(path.relative(root, file)));
const skillDirectories = new Set(skillFiles.map(file => path.dirname(file)));
if (platform !== 'codex') {
  const manifestFile = path.join(root, `.${platform}-plugin/plugin.json`);
  const manifest = JSON.parse(await readFile(manifestFile, 'utf8'));
  if (manifest.name !== `estack-${platform}`) report(manifestFile, 'invalid plugin identity');
  if (!/^\d+\.\d+\.\d+(?:-[\w.-]+)?$/.test(manifest.version ?? '')) report(manifestFile, 'invalid plugin version');
  if (typeof manifest.description !== 'string' || !manifest.description.trim()) report(manifestFile, 'missing plugin description');
  const sourceSkills = (await readdir(path.join(repo, 'estack/skills'), { withFileTypes: true }))
    .filter(entry => entry.isDirectory()).map(entry => entry.name);
  const nativeSkills = skillFiles.map(file => path.basename(path.dirname(file)));
  for (const name of sourceSkills) if (!nativeSkills.includes(name)) report(root, `missing corresponding skill: ${name}`);
  for (const name of nativeSkills) if (!sourceSkills.includes(name)) report(root, `skill missing from Codex variant: ${name}`);
  for (const file of files) {
    if (path.relative(root, file).startsWith('.codex-plugin/') || path.basename(file) === 'openai.yaml') {
      report(file, 'Codex metadata does not belong in this variant');
    }
    if (/\.(?:md|mjs|sh|ts|json)$/.test(file) && /^(?:skills|agents|droids)\//.test(path.relative(root, file))) {
      const text = await readFile(file, 'utf8');
      if (/mcp__codex_app|mcp__cua_repl|\bCODEX_HOME\b|~\/\.codex|collaboration\.(?:spawn_agent|wait_agent|send_message)/.test(text)) {
        report(file, 'unsupported Codex runtime dependency');
      }
    }
  }
  const agentRoot = platform === 'factory' ? 'droids' : 'agents';
  for (const file of files.filter(file => new RegExp(`^${agentRoot}/[^/]+\\.md$`).test(path.relative(root, file)))) {
    const match = (await readFile(file, 'utf8')).match(/^---\n([\s\S]*?)\n---\n/);
    const metadata = match ? Bun.YAML.parse(match[1]) : {};
    if (metadata.name !== path.basename(file, '.md') || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(metadata.name ?? '')) report(file, 'invalid native agent name');
    if (typeof metadata.description !== 'string' || !metadata.description.trim()) report(file, 'missing native agent description');
  }
  if (platform === 'factory') {
    const catalogFile = path.join(repo, '.factory-plugin/marketplace.json');
    const catalog = JSON.parse(await readFile(catalogFile, 'utf8'));
    if (catalog.name !== 'evan-skills') report(catalogFile, 'invalid Factory marketplace name');
    if (!catalog.plugins?.some(plugin => plugin.name === 'estack-factory' && plugin.source === './estack-factory')) {
      report(catalogFile, 'missing Factory plugin source');
    }
  }
}
for (const file of files) {
  const relative = path.relative(root, file).split(path.sep);
  if (relative[0] === 'skills' && !skillDirectories.has(path.join(root, 'skills', relative[1]))) {
    report(file, 'supporting file has no registered skill owner');
  }
}
const supported = new Set(['name', 'description', 'license', 'allowed-tools', 'metadata']);
if (platform === 'devin') supported.add('triggers');
if (platform === 'factory') supported.add('disable-model-invocation');
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
  if (platform === 'devin' && frontmatter.triggers !== undefined &&
      (!Array.isArray(frontmatter.triggers) || !frontmatter.triggers.length || frontmatter.triggers.some(trigger => !['user', 'model'].includes(trigger)))) {
    report(file, 'invalid native skill triggers');
  }
  if (platform === 'factory' && frontmatter['disable-model-invocation'] !== undefined && typeof frontmatter['disable-model-invocation'] !== 'boolean') {
    report(file, 'invalid model invocation policy');
  }
  if (platform !== 'codex') {
    const sourceMetadataFile = path.join(repo, 'estack/skills', path.basename(path.dirname(file)), 'agents/openai.yaml');
    try {
      const sourceMetadata = Bun.YAML.parse(await readFile(sourceMetadataFile, 'utf8'));
      if (sourceMetadata.policy?.allow_implicit_invocation === false &&
          !(platform === 'devin' ? frontmatter.triggers?.length === 1 && frontmatter.triggers[0] === 'user' : frontmatter['disable-model-invocation'] === true)) {
        report(file, 'must preserve explicit-only invocation policy');
      }
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
  if (platform !== 'codex') continue;
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
else if (platform === 'codex') console.log(`Verified ${skillFiles.length} Codex skills, UI metadata, and ${links} bundled references.`);
else console.log(`Verified ${skillFiles.length} ${platform === 'devin' ? 'Devin' : 'Factory'} skills, native metadata, and ${links} bundled references.`);
