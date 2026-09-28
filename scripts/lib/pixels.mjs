/**
 * Pixel difference between two PNG files, the one way every script here
 * measures it: anti-aliased edges not counted, rows only one image has
 * counted as different, the result a percentage of the larger image.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

const crop = (png, w, h) => {
  const o = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++) png.data.copy(o, y * w * 4, y * png.width * 4, y * png.width * 4 + w * 4);
  return o;
};

/** @returns {{pct:number, differing:number, sizes:[[w,h],[w,h]]}} */
export function pixelDiff(fileA, fileB, diffOut = null) {
  const a = PNG.sync.read(readFileSync(fileA));
  const b = PNG.sync.read(readFileSync(fileB));
  const W = Math.min(a.width, b.width), H = Math.min(a.height, b.height);
  const diff = diffOut ? new PNG({ width: W, height: H }) : null;
  const n = pixelmatch(crop(a, W, H), crop(b, W, H), diff ? diff.data : null, W, H,
    { threshold: 0.1, includeAA: false, alpha: 0.15, diffColor: [229, 57, 53] });
  if (diffOut) { mkdirSync(dirname(diffOut), { recursive: true }); writeFileSync(diffOut, PNG.sync.write(diff)); }
  const all = Math.max(a.width, b.width) * Math.max(a.height, b.height);
  const differing = n + all - W * H;
  return { pct: +((differing / all) * 100).toFixed(3), differing, sizes: [[a.width, a.height], [b.width, b.height]] };
}
