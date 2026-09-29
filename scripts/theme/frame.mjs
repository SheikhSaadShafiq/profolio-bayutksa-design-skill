/**
 * A compiled new-theme screen is a fixed frame (1440 × 900 on the web, 360 ×
 * 800 on a phone, taller when grown whole). The handover's build lays out
 * against the window: fixed layers (drawers, sheets, the tour) sit against
 * the viewport, and heights are written in vh. Opened in any other window —
 * a bigger browser, the bundle's viewer — they would drift.
 *
 * So a written screen owns its frame: its root is the containing block of
 * every fixed layer (a transform makes it one), and every viewport unit is
 * written out as the frame's pixels. At the frame's own size nothing moves;
 * at any other, the screen still draws as captured.
 *
 * Used by scripts/theme/capture.mjs when it writes a screen, and by
 *   node scripts/theme/frame.mjs      to bring files already written up to it
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const UNIT = /(-?(?:\d+\.?\d*|\.\d+))(d|s|l)?(vh|vw|vmin|vmax)\b/g;
const px = (n) => `${Math.round(n * 1000) / 1000}px`;
const units = (css, W, H) => css.replace(UNIT, (m, v, _, u) => px((+v / 100) * (u === 'vh' ? H : u === 'vw' ? W : u === 'vmin' ? Math.min(W, H) : Math.max(W, H))));

export const ownFrame = (html, W, H) => html
  /* the stylesheet the screen carries, and every style attribute */
  .replace(/(<style>)([\s\S]*?)(<\/style>)/g, (m, a, css, b) => a + units(css, W, H) + b)
  .replace(/ style="([^"]*)"/g, (m, s) => ` style="${units(s, W, H)}"`)
  /* the root holds the fixed layers */
  .replace(/<div data-pf-theme-root style="position:relative;/, (m) => (m.includes('transform') ? m : '<div data-pf-theme-root style="position:relative;transform:translateZ(0);'));

/* run as a script: every screen already written */
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
  const OUT = join(ROOT, 'deliverables', 'new-theme');
  const files = ['listings.html', 'mobile/listings.html', ...['states', 'mobile/states'].flatMap((d) => (existsSync(join(OUT, d)) ? readdirSync(join(OUT, d)).filter((f) => f.endsWith('.html')).map((f) => `${d}/${f}`) : []))];
  let n = 0;
  for (const f of files) {
    const html = readFileSync(join(OUT, f), 'utf8');
    const [W, H] = (html.match(/name="pf-frame" content="(\d+)x(\d+)"/) || []).slice(1).map(Number);
    if (!W) continue;
    const out = ownFrame(html, W, H);
    if (out !== html) { writeFileSync(join(OUT, f), out); n++; }
  }
  console.log(`  ${n} of ${files.length} screens now own their frame`);
}
