#!/usr/bin/env node
/**
 * Our page against the product's, pixel by pixel.
 *
 * WHY THIS EXISTS — qa-fidelity.mjs says whether every box is where the
 * product puts it and painted the same. It cannot see what is INSIDE a box: a
 * glyph from the wrong icon set, a gradient where the product has a flat fill,
 * a chart line one stroke too thick, a letter-spacing nobody declared. Those
 * are the differences a designer sees first, and only pixels show them.
 *
 * Both screenshots come from the same Chromium at 1440 wide, deviceScaleFactor
 * 1: data/live/<page>.png from harness/capture.mjs (the product, fixture
 * account) and data/ours/<page>.png from qa-design.mjs (our page). Our pages
 * carry the fixture account's data, so the text is the same text and a diff
 * means something. Against a signed-in screen it would not — every name and
 * number differs — which is why real-account captures are held to geometry
 * (qa-fidelity) and never to pixels.
 *
 *   node scripts/qa-pixels.mjs                 every page with both screenshots
 *   node scripts/qa-pixels.mjs --page dashboard
 *   node scripts/qa-pixels.mjs --strict        exit non-zero above the bar
 *
 * Writes data/qa/pixels/<page>.diff.png (differing pixels in red over a faded
 * copy of the product) and data/qa/pixels.json, one row per page.
 *
 * The score is DIFFERING PIXELS ÷ ALL PIXELS of the taller page. Rows one page
 * has and the other does not count as differing: a page 200px short is 200
 * rows wrong, not a smaller page that happens to match. Anti-aliased edges are
 * not counted (pixelmatch's includeAA: false), so a glyph rasterised a hair
 * differently is not a defect; a glyph that is not there is.
 */
import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const LIVE = join(ROOT, 'data', 'live');
const OURS = join(ROOT, 'data', 'ours');
const OUT = join(ROOT, 'data', 'qa', 'pixels');
const arg = (n, d) => { const i = process.argv.indexOf(n); return i > -1 ? process.argv[i + 1] : d; };
const strict = process.argv.includes('--strict');
/* the agreed bar for this pass: at most 0.5% of the page differs */
const BAR = Number(arg('--bar', 0.5));

const pages = readdirSync(OURS)
  .filter((f) => f.endsWith('.png') && !f.includes('.rtl.'))
  .map((f) => f.replace(/\.png$/, ''))
  .filter((p) => existsSync(join(LIVE, `${p}.png`)))
  .filter((p) => !arg('--page') || p === arg('--page'))
  .sort();
if (!pages.length) { console.error('  no page with a screenshot on both sides'); process.exit(2); }

/* copy the top-left w×h of a PNG into a fresh buffer */
const crop = (png, w, h) => {
  const out = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++) png.data.copy(out, y * w * 4, y * png.width * 4, y * png.width * 4 + w * 4);
  return out;
};

mkdirSync(OUT, { recursive: true });
const rows = [];
for (const page of pages) {
  const a = PNG.sync.read(readFileSync(join(LIVE, `${page}.png`)));
  const b = PNG.sync.read(readFileSync(join(OURS, `${page}.png`)));
  const w = Math.min(a.width, b.width), h = Math.min(a.height, b.height);
  const H = Math.max(a.height, b.height), W = Math.max(a.width, b.width);
  const diff = new PNG({ width: w, height: h });
  const n = pixelmatch(crop(a, w, h), crop(b, w, h), diff.data, w, h,
    { threshold: 0.1, includeAA: false, alpha: 0.15, diffColor: [229, 57, 53] });
  writeFileSync(join(OUT, `${page}.diff.png`), PNG.sync.write(diff));
  const overhang = W * H - w * h;
  const pct = ((n + overhang) / (W * H)) * 100;
  rows.push({ page, size: { live: [a.width, a.height], ours: [b.width, b.height] }, differing: n + overhang, pct: +pct.toFixed(2) });
}

console.log(`\n  page                                   live h   ours h   differing    PIXEL DIFF  (bar ≤${BAR}%)`);
for (const r of rows) {
  const mark = r.pct <= BAR ? 'ok' : '';
  console.log(`  ${r.page.padEnd(38)} ${String(r.size.live[1]).padStart(6)}   ${String(r.size.ours[1]).padStart(6)}   ${String(r.differing).padStart(9)}    ${(r.pct.toFixed(2) + '%').padStart(8)}  ${mark}`);
}
const within = rows.filter((r) => r.pct <= BAR).length;
console.log(`\n  ${within} of ${rows.length} within the bar · diffs in data/qa/pixels/\n`);

if (!arg('--page')) writeFileSync(join(ROOT, 'data', 'qa', 'pixels.json'),
  JSON.stringify({ at: new Date().toISOString(), bar: BAR, rows }, null, 2));
if (strict && within < rows.length) process.exit(1);
