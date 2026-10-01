import { chmod, lstat, mkdir, readFile, readdir, realpath, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const excluded = (name) => ['node_modules', '.git', '.DS_Store', '.env'].includes(name)
  || name.startsWith('.env.') || name.endsWith('.log');
const contains = (parent, child) => child === parent || child.startsWith(`${parent}${path.sep}`);

async function canonical(location) {
  try {
    return await realpath(location);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    return path.join(await canonical(path.dirname(location)), path.basename(location));
  }
}

function relativePath(value, label) {
  if (typeof value !== 'string' || !value || path.isAbsolute(value)
    || value.split(/[\\/]/).includes('..')) throw new Error(`Invalid ${label}: ${value}`);
  return path.normalize(value);
}

async function rejectLinkedParents(repoRoot, location) {
  if (!contains(repoRoot, location)) return;
  let current = location;
  while (current !== repoRoot) {
    try {
      if ((await lstat(current)).isSymbolicLink()) throw new Error(`Symlink is not allowed: ${current}`);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
    current = path.dirname(current);
  }
}

async function filesAt(root, skipExcluded = false) {
  const files = new Map();
  async function visit(location, relative) {
    const stat = await lstat(location);
    if (stat.isSymbolicLink()) throw new Error(`Symlink is not allowed: ${location}`);
    if (stat.isDirectory()) {
      for (const name of (await readdir(location)).sort()) {
        if (!skipExcluded || !excluded(name)) await visit(path.join(location, name), path.join(relative, name));
      }
    } else if (stat.isFile()) {
      files.set(relative, { bytes: await readFile(location), mode: stat.mode & 0o777 });
    } else throw new Error(`Unsupported file: ${location}`);
  }
  try {
    await visit(root, '');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  return files;
}

export async function buildEstack(repoRoot, outputRoot = path.join(repoRoot, 'estack'), { check = false } = {}) {
  repoRoot = path.resolve(repoRoot);
  outputRoot = path.resolve(outputRoot);
  const configPath = path.join(repoRoot, 'scripts/estack/bundle.json');
  const config = JSON.parse(await readFile(configPath, 'utf8'));
  for (const key of ['copies', 'replacements', 'overrides']) {
    if (!Array.isArray(config[key])) throw new Error(`bundle.json requires ${key} array`);
  }
  const replacementFiles = (config.replacementsFrom ?? []).map(source =>
    path.join(repoRoot, relativePath(source, 'replacement source path')));
  await rejectLinkedParents(repoRoot, outputRoot);
  const output = await canonical(outputRoot);
  const sources = [configPath, ...replacementFiles, ...[...config.copies, ...config.overrides].map(({ from }) =>
    path.join(repoRoot, relativePath(from, 'source path')))];
  for (const source of sources) {
    await rejectLinkedParents(repoRoot, source);
    const resolved = await canonical(source);
    if (contains(output, resolved) || contains(resolved, output)) {
      throw new Error(`Output overlaps source: ${source}`);
    }
  }
  const desired = new Map();
  for (const { from, to } of config.copies) {
    const source = path.join(repoRoot, relativePath(from, 'source path'));
    await lstat(source);
    const destination = relativePath(to, 'destination path');
    for (const [relative, file] of await filesAt(source, true)) {
      const target = path.join(destination, relative);
      if (target === '.') throw new Error('A file destination must name a file');
      if (desired.has(target)) throw new Error(`Copy collision: ${target}`);
      desired.set(target, file);
    }
  }
  const replacements = [...config.replacements];
  for (const source of replacementFiles) {
    const entries = JSON.parse(await readFile(source, 'utf8'));
    if (!Array.isArray(entries)) throw new Error(`Replacement source must be an array: ${source}`);
    replacements.push(...entries);
  }
  for (const { path: targetPath, from, to } of replacements) {
    const target = relativePath(targetPath, 'replacement path');
    const file = desired.get(target);
    if (!file || typeof from !== 'string' || !from || typeof to !== 'string') {
      throw new Error(`Invalid replacement: ${target}`);
    }
    const text = file.bytes.toString('utf8');
    const index = text.indexOf(from);
    if (index === -1 || text.indexOf(from, index + 1) !== -1) {
      throw new Error(`Replacement anchor must occur exactly once: ${target}`);
    }
    desired.set(target, { ...file, bytes: Buffer.from(text.slice(0, index) + to + text.slice(index + from.length)) });
  }
  for (const { from, to } of config.overrides) {
    const target = relativePath(to, 'override path');
    if (!desired.has(target)) throw new Error(`Override requires a copied file: ${target}`);
    const source = path.join(repoRoot, relativePath(from, 'source path'));
    const stat = await lstat(source);
    if (!stat.isFile() || stat.isSymbolicLink()) throw new Error(`Override must be a regular file: ${source}`);
    desired.set(target, { bytes: await readFile(source), mode: stat.mode & 0o777 });
  }
  for (const targetPath of config.removals ?? []) {
    const target = relativePath(targetPath, 'removal path');
    if (!desired.delete(target)) throw new Error(`Removal requires a copied file: ${target}`);
  }
  if (config.codexSkills) {
    for (const [target, file] of desired) {
      if (!/^skills\/[^/]+\/SKILL\.md$/.test(target)) continue;
      const text = file.bytes.toString('utf8');
      const match = text.match(/^---\n([\s\S]*?)\n---\n/);
      if (!match) throw new Error(`Missing skill frontmatter: ${target}`);
      const frontmatter = Bun.YAML.parse(match[1]);
      const hostFields = ['disable-model-invocation', 'mode', 'icon', 'color', 'reminder', 'paths'];
      if (hostFields.some(key => key in frontmatter)) {
        for (const key of hostFields) delete frontmatter[key];
        desired.set(target, { ...file, bytes: Buffer.from(`---\n${Bun.YAML.stringify(frontmatter).trimEnd()}\n---\n${text.slice(match[0].length)}`) });
      }

    }
  }
  for (const target of desired.keys()) {
    let ancestor = path.dirname(target);
    while (ancestor !== '.') {
      if (desired.has(ancestor)) throw new Error(`File/directory collision: ${target}`);
      ancestor = path.dirname(ancestor);
    }
  }
  const existing = await filesAt(outputRoot);
  const drift = [];
  for (const [target, file] of desired) {
    const current = existing.get(target);
    if (!current) drift.push(`missing ${target}`);
    else if (!current.bytes.equals(file.bytes) || (current.mode & 0o111) !== (file.mode & 0o111)) drift.push(`changed ${target}`);
  }
  for (const target of existing.keys()) if (!desired.has(target)) drift.push(`unexpected ${target}`);
  if (!check && drift.length) {
    await rm(outputRoot, { recursive: true, force: true });
    await mkdir(outputRoot, { recursive: true });
    for (const [target, file] of desired) {
      const destination = path.join(outputRoot, target);
      await mkdir(path.dirname(destination), { recursive: true });
      await writeFile(destination, file.bytes);
      await chmod(destination, file.mode);
    }
  }
  return { drift, ok: check ? drift.length === 0 : true, files: desired.size };
}

if (import.meta.main) {
  try {
    const args = process.argv.slice(2);
    let check = false;
    let output;
    for (let index = 0; index < args.length; index++) {
      if (args[index] === '--check') check = true;
      else if (args[index] === '--output' && args[index + 1]) output = path.resolve(args[++index]);
      else throw new Error('Usage: bun scripts/build-estack.mjs [--check] [--output PATH]');
    }
    const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
    const result = await buildEstack(repo, output, { check });
    if (check && !result.ok) console.error(result.drift.join('\n'));
    else console.log(`${check ? 'Verified' : 'Built'} estack (${result.files} files).`);
    process.exitCode = result.ok ? 0 : 1;
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
