import { deflateSync } from 'node:zlib';
import { createHash } from 'node:crypto';

const table = (() => {
  const values = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    values[n] = c;
  }
  return values;
})();

const crc32 = buffer => {
  let c = -1;
  for (const byte of buffer) c = table[(c ^ byte) & 255] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
};

const chunk = (type, data) => {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, checksum]);
};

export function encodePng(width, height, pixel) {
  const stride = width * 4 + 1;
  const raw = Buffer.alloc(height * stride);
  for (let y = 0; y < height; y++) {
    raw[y * stride] = 0;
    for (let x = 0; x < width; x++) {
      const [r, g, b, a = 255] = pixel(x, y);
      const offset = y * stride + 1 + x * 4;
      raw[offset] = r;
      raw[offset + 1] = g;
      raw[offset + 2] = b;
      raw[offset + 3] = a;
    }
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', header), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

export const sha256 = buffer => createHash('sha256').update(buffer).digest('hex');

const white = () => [255, 255, 255];

export const screen = patches => (width, height) => (x, y) => {
  for (const patch of patches) if (x >= patch.x && x < patch.x + patch.width && y >= patch.y && y < patch.y + patch.height) return patch.color;
  return white();
};

export const capture = (commit, overrides = {}) => ({
  kind: 'example-fixture',
  commit: commit.repeat(40),
  dirtyPatchSha256: null,
  buildEvidence: 'Unit fixture only',
  capturedAt: '2026-10-23T12:00:00Z',
  tool: 'test fixture',
  route: '/example',
  role: 'example',
  state: 'filled',
  dataKey: 'example',
  viewport: { width: 32, height: 24, deviceScaleFactor: 1 },
  scroll: { x: 0, y: 0 },
  ...overrides,
});
