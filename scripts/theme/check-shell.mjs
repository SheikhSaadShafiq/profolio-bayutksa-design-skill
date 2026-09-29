#!/usr/bin/env node
/**
 * The shell in every new-theme screen is the product's — held to the
 * product's own.
 *
 * capture.mjs swaps the product's header and rail into each screen (the
 * designer keeps the shell, 2026-09-29). Here each screen whose shell is
 * uncovered — no overlay's backdrop over it — is set beside the product's
 * compiled My Listings at the same width, and the header and rail are
 * pixel-diffed (the same 0.5% bar). Screens with an overlay are counted, not
 * diffed: the product dims its shell under an overlay too.
 *
 * The web header's last 40px are left out: the handover parks its closed
 * drawers beside the frame and their shadow falls into it (a known build
 * artifact, product/listings-new/README.md).
 *
 *   node scripts/theme/check-shell.mjs
 *
 * Writes data/theme/shell-check.json. Exits 1 if a shell is off.
 */
import pkg from 'playwright';
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

const { chromium } = pkg;
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const L = JSON.parse(readFileSync(join(ROOT, 'data', 'theme', 'states.json'), 'utf8'));
const BAR = 0.5;
const REGIONS = { web: [['header', 60, 0, 1320, 60], ['rail', 0, 0, 60, 900]], mobile: [['header', 0, 0, 360, 60]] };
const browser = await chromium.launch();
const shot = async (url, w, h) => { const p = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 }); await p.goto(url, { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(500); const cover = await p.evaluate((dev) => {
    /* a backdrop takes no pointer events, so a hit-test sees through it: a shell is under an
       overlay when a translucent layer outside it covers it */
    const shells = [...document.querySelectorAll('[data-pf-shell]')];
    const over = (x, y) => [...document.querySelectorAll('[data-pf-theme-root] *')].some((e) => {
      if (shells.some((s) => s.contains(e) || e.contains(s))) return false;
      const r = e.getBoundingClientRect();
      if (r.left > x || r.right < x || r.top > y || r.bottom < y || !e.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) return false;
      const m = getComputedStyle(e).backgroundColor.match(/rgba\([^)]*,\s*([\d.]+)\)/);
      return m && +m[1] > 0.05 && +m[1] < 0.95;
    });
    /* a spotlight dims everything around it with a huge spread shadow, not a layer */
    const spot = (x, y) => [...document.querySelectorAll('[data-pf-theme-root] *')].some((e) => {
      const bs = getComputedStyle(e).boxShadow;
      if (!bs || bs === 'none' || !/(\d{3,})px(?![^,]*px)/.test(bs.replace(/rgba?\([^)]*\)/g, '')) || !e.checkVisibility()) return false;
      const spread = Math.max(...[...bs.replace(/rgba?\([^)]*\)/g, '').matchAll(/(-?\d+(?:\.\d+)?)px/g)].map((m) => +m[1]));
      if (spread < 1000) return false;
      const r = e.getBoundingClientRect();
      return !(x >= r.left && x <= r.right && y >= r.top && y <= r.bottom);
    });
    return { header: !over(dev === 'web' ? 300 : 180, 30) && !spot(dev === 'web' ? 300 : 180, 30), rail: dev !== 'web' || (!over(30, 400) && !spot(30, 400)) };
  }, w > 400 ? 'web' : 'mobile'); const png = PNG.sync.read(await p.screenshot({ clip: { x: 0, y: 0, width: w, height: h }, animations: 'disabled' })); await p.close(); return { png, cover }; };
const region = (png, x, y, w, h) => { const o = Buffer.alloc(w * h * 4); for (let r = 0; r < h; r++) png.data.copy(o, r * w * 4, ((y + r) * png.width + x) * 4, ((y + r) * png.width + x + w) * 4); return o; };
/* the product's own, at the new theme's widths */
const ref = { web: (await shot(pathToFileURL(join(ROOT, 'deliverables', 'listings.html')).href, 1440, 900)).png, mobile: (await shot(pathToFileURL(join(ROOT, 'deliverables', 'mobile', 'listings.html')).href, 360, 800)).png };
const out = {};
let off = 0, diffed = 0, covered = 0;
for (const [key, e] of Object.entries(L)) {
  if (!e.file) continue;
  const device = key.split(':')[0];
  const [W, H] = e.frame.split('x').map(Number);
  const { png, cover } = await shot(pathToFileURL(join(ROOT, e.file)).href, W, Math.min(H, device === 'web' ? 900 : 800));
  const r = {};
  for (const [part, x, y, w, h] of REGIONS[device]) {
    if (!cover[part]) { r[part] = 'under an overlay'; continue; }
    const n = pixelmatch(region(png, x, y, w, h), region(ref[device], x, y, w, h), null, w, h, { threshold: 0.1, includeAA: false });
    r[part] = +(100 * n / (w * h)).toFixed(3);
  }
  const vals = Object.values(r).filter((v) => typeof v === 'number');
  if (vals.length) diffed++; else covered++;
  if (vals.some((v) => v > BAR)) { off++; console.log(`  OFF ${key.padEnd(46)} ${JSON.stringify(r)}`); }
  out[key] = r;
}
await browser.close();
writeFileSync(join(ROOT, 'data', 'theme', 'shell-check.json'), JSON.stringify(out, null, 1));
console.log(`  shell: ${diffed} screens diffed against the product's, ${covered} under an overlay · ${off} off the bar`);
process.exit(off ? 1 : 0);
