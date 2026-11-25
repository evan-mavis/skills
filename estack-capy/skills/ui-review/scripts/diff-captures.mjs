import { readFile, readdir } from 'node:fs/promises';
import { inflateSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export function decodePng(bytes) {
  const signature = [137, 80, 78, 71, 13, 10, 26, 10];
  if (bytes.length < 8 || signature.some((value, index) => bytes[index] !== value)) throw new Error('Expected a PNG capture');
  let offset = 8, header;
  const data = [];
  while (offset + 8 <= bytes.length) {
    const length = bytes.readUInt32BE(offset);
    const type = bytes.toString('ascii', offset + 4, offset + 8);
    const chunk = bytes.subarray(offset + 8, offset + 8 + length);
    offset += 12 + length;
    if (type === 'IHDR') header = { width: chunk.readUInt32BE(0), height: chunk.readUInt32BE(4), depth: chunk[8], color: chunk[9], interlace: chunk[12] };
    else if (type === 'IDAT') data.push(chunk);
    else if (type === 'IEND') break;
  }
  const channels = { 0: 1, 2: 3, 4: 2, 6: 4 }[header?.color];
  if (!channels || header.depth !== 8 || header.interlace !== 0) throw new Error('Unsupported PNG: use 8-bit, non-interlaced gray, RGB, or RGBA captures');
  const { width, height } = header;
  const raw = inflateSync(Buffer.concat(data));
  const stride = width * channels;
  const pixels = Buffer.alloc(width * height * 4);
  let previous = Buffer.alloc(stride);
  for (let y = 0; y < height; y++) {
    const start = y * (stride + 1);
    const filter = raw[start];
    if (filter > 4) throw new Error('Corrupt PNG filter');
    const line = Buffer.from(raw.subarray(start + 1, start + 1 + stride));
    for (let x = 0; x < stride; x++) {
      const left = x >= channels ? line[x - channels] : 0, up = previous[x], corner = x >= channels ? previous[x - channels] : 0;
      let predictor = 0;
      if (filter === 1) predictor = left;
      else if (filter === 2) predictor = up;
      else if (filter === 3) predictor = (left + up) >> 1;
      else if (filter === 4) {
        const p = left + up - corner, pa = Math.abs(p - left), pb = Math.abs(p - up), pc = Math.abs(p - corner);
        predictor = pa <= pb && pa <= pc ? left : pb <= pc ? up : corner;
      }
      line[x] = (line[x] + predictor) & 255;
    }
    for (let x = 0; x < width; x++) {
      const source = x * channels, target = (y * width + x) * 4;
      if (channels < 3) { pixels[target] = pixels[target + 1] = pixels[target + 2] = line[source]; pixels[target + 3] = channels === 2 ? line[source + 1] : 255; }
      else { pixels[target] = line[source]; pixels[target + 1] = line[source + 1]; pixels[target + 2] = line[source + 2]; pixels[target + 3] = channels === 4 ? line[source + 3] : 255; }
    }
    previous = line;
  }
  return { width, height, pixels };
}

const pixel = (image, x, y) => x < image.width && y < image.height ? image.pixels.subarray((y * image.width + x) * 4, (y * image.width + x) * 4 + 4) : null;

export function diffImages(before, after, { cell = 8, threshold = 24, gap = 2 } = {}) {
  const width = Math.max(before.width, after.width), height = Math.max(before.height, after.height);
  const columns = Math.ceil(width / cell), rows = Math.ceil(height / cell);
  const changed = new Uint32Array(columns * rows);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const a = pixel(before, x, y), b = pixel(after, x, y);
    if (!a || !b || Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1]), Math.abs(a[2] - b[2]), Math.abs(a[3] - b[3])) > threshold) changed[Math.floor(y / cell) * columns + Math.floor(x / cell)]++;
  }
  const seen = new Uint8Array(changed.length);
  const regions = [];
  for (let index = 0; index < changed.length; index++) {
    if (!changed[index] || seen[index]) continue;
    const queue = [index];
    seen[index] = 1;
    let minX = Infinity, minY = Infinity, maxX = -1, maxY = -1, changedPixels = 0;
    while (queue.length) {
      const current = queue.pop(), cx = current % columns, cy = Math.floor(current / columns);
      changedPixels += changed[current];
      minX = Math.min(minX, cx); maxX = Math.max(maxX, cx); minY = Math.min(minY, cy); maxY = Math.max(maxY, cy);
      for (let dy = -gap; dy <= gap; dy++) for (let dx = -gap; dx <= gap; dx++) {
        const nx = cx + dx, ny = cy + dy, next = ny * columns + nx;
        if (nx >= 0 && ny >= 0 && nx < columns && ny < rows && changed[next] && !seen[next]) { seen[next] = 1; queue.push(next); }
      }
    }
    const x = minX * cell, y = minY * cell;
    regions.push({ x, y, width: Math.min((maxX + 1) * cell, width) - x, height: Math.min((maxY + 1) * cell, height) - y, changedPixels });
  }
  return { width, height, sizeChanged: before.width !== after.width || before.height !== after.height, regions: regions.sort((a, b) => a.y - b.y || a.x - b.x) };
}

function cropHash(image, region) {
  const hash = createHash('sha256').update(region.width + 'x' + region.height);
  for (let y = region.y; y < region.y + region.height; y++) for (let x = region.x; x < region.x + region.width; x++) hash.update(pixel(image, x, y) || Buffer.alloc(4));
  return hash.digest('hex');
}

export async function compareCaptures(baseDirectory, headDirectory, options) {
  const list = async directory => (await readdir(directory)).filter(name => name.toLowerCase().endsWith('.png')).sort();
  const [baseNames, headNames] = await Promise.all([list(baseDirectory), list(headDirectory)]);
  const captures = [], groups = new Map();
  for (const name of [...new Set([...baseNames, ...headNames])].sort()) {
    if (!headNames.includes(name)) { captures.push({ name, status: 'removed', regions: [] }); continue; }
    if (!baseNames.includes(name)) { captures.push({ name, status: 'added', regions: [] }); continue; }
    const [before, after] = await Promise.all([readFile(join(baseDirectory, name)).then(decodePng), readFile(join(headDirectory, name)).then(decodePng)]);
    const result = diffImages(before, after, options);
    const regions = result.regions.map((region, index) => ({ id: name.replace(/\.png$/i, '') + '#' + (index + 1), ...region, signature: cropHash(before, region) + ':' + cropHash(after, region) }));
    for (const region of regions) groups.set(region.signature, [...(groups.get(region.signature) || []), { capture: name, region: region.id }]);
    captures.push({ name, status: regions.length ? 'changed' : 'unchanged', sizeChanged: result.sizeChanged, width: after.width, height: after.height, regions });
  }
  const clusters = [...groups.values()].map((members, index) => ({ id: 'cluster-' + (index + 1), shared: new Set(members.map(member => member.capture)).size > 1, members }));
  return {
    summary: Object.fromEntries(['changed', 'unchanged', 'added', 'removed'].map(status => [status, captures.filter(capture => capture.status === status).length])),
    captures,
    clusters: clusters.sort((a, b) => b.members.length - a.members.length),
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const [base, head, ...flags] = process.argv.slice(2);
  const option = name => { const index = flags.indexOf('--' + name); return index >= 0 ? Number(flags[index + 1]) : undefined; };
  try {
    if (!base || !head) throw new Error('Usage: diff-captures.mjs <base-directory> <head-directory> [--cell 8] [--threshold 24] [--gap 2]');
    const options = Object.fromEntries(['cell', 'threshold', 'gap'].map(name => [name, option(name)]).filter(([, value]) => value !== undefined));
    console.log(JSON.stringify(await compareCaptures(base, head, options), null, 2));
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
