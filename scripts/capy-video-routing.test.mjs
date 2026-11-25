import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = process.env.CAPY_SKILLS_ROOT || fileURLToPath(new URL('../estack-capy/skills/', import.meta.url));
const read = file => readFileSync(path.join(root, file), 'utf8');
const callers = [
  'poteto-mode/SKILL.md',
  'poteto-mode/references/video-recording.md',
  'create-verification-skill/SKILL.md',
  'maintain-verification-skill/SKILL.md',
];

for (const file of callers) test(`${file} resolves video capture by catalog name`, () => {
  const text = read(file);
  assert.match(text, /video[^\n]*capture[^\n]*available skill catalog/i);
  assert.doesNotMatch(text, /(?:\.\.\/)+capture\/SKILL\.md|~\/\.capy\/.*capture/);
  assert.doesNotMatch(text, /tools\.desktop\.recording|90 seconds|stop call returns|bounded desktop recordings/);
});

test('video reference delegates mechanics and excludes image-only ui-review', () => {
  const text = read('poteto-mode/references/video-recording.md');
  assert.match(text, /capture owns recording, rendering, and artifact handling/i);
  assert.match(text, /ui-review[^\n]*only when[^\n]*video/i);
  assert.match(text, /image-only[^\n]*do not[^\n]*capture/i);
  assert.match(text, /unavailable[^\n]*missing video proof/i);
});

for (const file of callers.slice(2)) test(`${file} keeps repository guidance agent-agnostic`, () => {
  const text = read(file);
  assert.match(text, /agent-agnostic/i);
  assert.match(text, /verifier owns[^\n]*journey[^\n]*assertions/i);
  assert.match(text, /video skill owns[^\n]*mechanics/i);
  assert.doesNotMatch(text, /Make the generated verifier name this native flow|Link the installed capture skill/);
});

test('help routes video separately from images', () => {
  assert.match(read('poteto-help/SKILL.md'), /video[^\n]*capture[^\n]*available skill catalog/i);
});

test('image-only ui-review does not acquire a capture-skill dependency', () => {
  const walk = directory => readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(file) : [file];
  });
  for (const file of walk(path.join(root, 'ui-review')).filter(file => file.endsWith('.md'))) {
    assert.doesNotMatch(readFileSync(file, 'utf8'), /capture\/SKILL\.md|available skill catalog|\$capture/);
  }
  assert.match(read('ui-review/SKILL.md'), /when an interaction needs video[^\n]*repository's verifier/);
  assert.doesNotMatch(read('ui-review/SKILL.md'), /record a demo/i);
});
