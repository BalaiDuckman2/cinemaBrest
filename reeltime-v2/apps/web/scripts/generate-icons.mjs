// Generates the PWA icons (film reel on cinema-red background) without any
// dependency: raw RGBA pixels encoded to PNG via node:zlib.
// Run: node scripts/generate-icons.mjs
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');

// --- Palette (vintage cinema design system) ---
const BG = [183, 28, 28]; // bordeaux #B71C1C
const REEL = [255, 248, 225]; // creme-ecran #FFF8E1
const HUB = [255, 213, 79]; // or-antique #FFD54F

// --- PNG encoding ---

const CRC_TABLE = new Int32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c;
});

function crc32(buf) {
  let c = -1;
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function encodePng(size, pixels) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  // Raw scanlines, filter byte 0 per row
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    const rowStart = y * (size * 4 + 1);
    raw[rowStart] = 0;
    pixels.copy(raw, rowStart + 1, y * size * 4, (y + 1) * size * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// --- Drawing (4x supersampled circles for clean edges) ---

function drawIcon(size, { reelRadius }) {
  const px = Buffer.alloc(size * size * 4);
  const cx = size / 2;
  const cy = size / 2;
  const rReel = size * reelRadius;
  const rHole = size * 0.085 * (reelRadius / 0.36);
  const rHoleOrbit = size * 0.205 * (reelRadius / 0.36);
  const rHub = size * 0.075 * (reelRadius / 0.36);

  const holes = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i - Math.PI / 2;
    holes.push([cx + rHoleOrbit * Math.cos(a), cy + rHoleOrbit * Math.sin(a)]);
  }

  const colorAt = (x, y) => {
    const d = Math.hypot(x - cx, y - cy);
    if (d > rReel) return BG;
    for (const [hx, hy] of holes) {
      if (Math.hypot(x - hx, y - hy) < rHole) return BG;
    }
    if (d < rHub) return HUB;
    return REEL;
  };

  const SS = 2; // 2x2 subsamples per pixel
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const [cr, cg, cb] = colorAt(x + (sx + 0.5) / SS, y + (sy + 0.5) / SS);
          r += cr; g += cg; b += cb;
        }
      }
      const i = (y * size + x) * 4;
      px[i] = r / (SS * SS);
      px[i + 1] = g / (SS * SS);
      px[i + 2] = b / (SS * SS);
      px[i + 3] = 255;
    }
  }
  return px;
}

mkdirSync(OUT_DIR, { recursive: true });

const targets = [
  { file: 'pwa-192x192.png', size: 192, reelRadius: 0.36 },
  { file: 'pwa-512x512.png', size: 512, reelRadius: 0.36 },
  // Maskable: artwork inside the 80% safe zone
  { file: 'maskable-512x512.png', size: 512, reelRadius: 0.3 },
  { file: 'apple-touch-icon.png', size: 180, reelRadius: 0.34 },
];

for (const { file, size, reelRadius } of targets) {
  writeFileSync(join(OUT_DIR, file), encodePng(size, drawIcon(size, { reelRadius })));
  console.log(`✓ ${file} (${size}x${size})`);
}
