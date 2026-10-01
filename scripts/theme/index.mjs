#!/usr/bin/env node
/**
 * The new My Listings in the design system's index — every compiled state of
 * the new theme, web and phone, as a thumbnail grid by kind; and a page that
 * sets the current My Listings beside the new one.
 *
 *   node scripts/theme/index.mjs
 *
 * Reads data/theme/states.json (scripts/theme/capture.mjs). Writes
 * deliverables/new-theme/img/*.png (thumbnails), deliverables/new-theme/
 * compare.html, and data/theme/section.html, which scripts/ds/catalogue.mjs
 * embeds in design-system.html.
 */
import pkg from 'playwright';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import STATES from './states.mjs';

const { chromium } = pkg;
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT = join(ROOT, 'deliverables', 'new-theme');
const DATA = join(ROOT, 'data', 'theme');
const L = JSON.parse(readFileSync(join(DATA, 'states.json'), 'utf8'));
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const GROUPS = { screens: 'The designer’s screens (03)', cases: 'Per case', drawer: 'Drawer', sheets: 'Sheets', list: 'The list', trend: 'Trend', filtering: 'Filtering', overlays: 'Overlays', empty: 'Empty, error and upsell', tabs: 'Tabs', onboarding: 'Onboarding', prototype: 'Only the prototype reaches' };
/* in the order scripts/theme/states.mjs lists them — the page first */
const ORDER = { web: STATES.web.map((s) => s.name || 'page'), mobile: STATES.mobile.map((s) => s.name || 'page') };
const entries = (device) => Object.entries(L).filter(([k]) => k.startsWith(device + ':')).map(([k, v]) => ({ name: k.split(':')[1], ...v }))
  .sort((a, b) => (ORDER[device].indexOf(a.name) + 1 || 999) - (ORDER[device].indexOf(b.name) + 1 || 999));

/* thumbnails, from the reference shots (each within the bar of its file) */
mkdirSync(join(OUT, 'img'), { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 400, height: 400 }, deviceScaleFactor: 1 });
for (const device of ['web', 'mobile']) for (const e of entries(device).filter((x) => x.file)) {
  const src = join(DATA, 'live', `${device}--${e.name}.png`);
  if (!existsSync(src)) continue;
  const w = device === 'web' ? 360 : 150;
  await page.setContent(`<body style="margin:0"><img id="t" src="data:image/png;base64,${readFileSync(src).toString('base64')}" style="display:block;width:${w}px"></body>`);
  await page.waitForFunction(() => document.getElementById('t').complete);
  const box = await page.evaluate(() => { const r = document.getElementById('t').getBoundingClientRect(); return { width: r.width, height: r.height }; });
  const h = Math.min(box.height, device === 'web' ? Math.round(w * 900 / 1440) : Math.round(w * 800 / 360));
  await page.setViewportSize({ width: w, height: Math.max(h, 1) });
  await page.screenshot({ path: join(OUT, 'img', `${device}--${e.name}.png`), clip: { x: 0, y: 0, width: w, height: h } });
}
/* the current-and-new page shows pictures (a bundle cannot frame another bundle's files) */
const PAIRS = [
  ['My Listings, Active tab', 'listings.html', 'new-theme/listings.html', 'mobile/listings.html', 'new-theme/mobile/listings.html'],
  ['Draft tab', 'states/listings--tab-draft.html', 'new-theme/states/listings--tab-draft.html', 'mobile/states/listings--tab-draft.html', 'new-theme/mobile/states/listings--tab-draft.html'],
  ['Pending tab', 'states/listings--tab-pending.html', 'new-theme/states/listings--tab-pending.html', 'mobile/states/listings--tab-pending.html', 'new-theme/mobile/states/listings--tab-pending.html'],
  ['Removed tab', 'states/listings--tab-removed.html', 'new-theme/states/listings--tab-removed.html', 'mobile/states/listings--tab-removed.html', 'new-theme/mobile/states/listings--tab-removed.html'],
  ['Ad License Requests tab', 'states/listings--tab-ad-license-requests.html', 'new-theme/states/listings--tab-ad-license-requests.html', 'mobile/states/listings--tab-ad-license-requests.html', 'new-theme/mobile/states/listings--tab-ad-license-requests.html'],
  ['Empty', 'states/listings--empty.html', 'new-theme/states/listings--empty-active.html', 'mobile/states/listings--empty.html', 'new-theme/mobile/states/listings--empty-active.html'],
  ['More filters', 'states/listings--drawer-filters.html', 'new-theme/states/listings--drawer-more-filters.html', 'mobile/states/listings--drawer-filters.html', 'new-theme/mobile/states/listings--sheet-filters.html'],
  ['Delete', 'states/listings--modal-delete.html', 'new-theme/states/listings--modal-delete.html', 'mobile/states/listings--modal-delete.html', 'new-theme/mobile/states/listings--sheet-delete.html'],
  ['TruCheck', 'states/listings--modal-trucheck.html', 'new-theme/states/listings--modal-trucheck.html', 'mobile/states/listings--modal-trucheck.html', 'new-theme/mobile/states/listings--sheet-trucheck.html'],
  ['Mark as Booked (new: derived)', 'states/listings--modal-booking.html', 'new-theme/states/listings--modal-mark-as-booked-range.html', 'mobile/states/listings--modal-booking.html', 'new-theme/mobile/states/listings--sheet-mark-as-booked-range.html'],
];
const D = join(ROOT, 'deliverables');
const shotOf = (href) => `new-theme/img/compare--${href.replace(/\.html$/, '').replace(/[^a-z0-9]+/gi, '-')}.png`;
for (const pair of PAIRS) for (const [i, href] of pair.slice(1).entries()) {
  if (!href || !existsSync(join(D, href))) continue;
  const phone = i >= 2, [w, h] = phone ? (href.startsWith('new-theme') ? [360, 800] : [375, 812]) : [1440, 900];
  const tw = phone ? 220 : 620;
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  const pg = await ctx.newPage();
  await pg.goto(pathToFileURL(join(D, href)).href, { waitUntil: 'load' });
  await pg.evaluate(() => document.fonts.ready);
  await pg.waitForTimeout(400);
  const full = await pg.screenshot({ clip: { x: 0, y: 0, width: w, height: h }, animations: 'disabled' });
  await ctx.close();
  await page.setViewportSize({ width: tw, height: Math.round(tw * h / w) });
  await page.setContent(`<body style="margin:0"><img id="t" src="data:image/png;base64,${full.toString('base64')}" style="display:block;width:${tw}px"></body>`);
  await page.waitForFunction(() => document.getElementById('t').complete);
  await page.screenshot({ path: join(D, shotOf(href)), clip: { x: 0, y: 0, width: tw, height: Math.round(tw * h / w) } });
}
await browser.close();

const fileOf = (device, e) => e.file.replace(/^deliverables\//, '');
const card = (device, e) => `<a class="ds-theme-card" href="${fileOf(device, e)}"><img loading="lazy" src="new-theme/img/${device}--${e.name}.png" alt=""><span>${esc(e.name === 'page' ? 'listings' : e.name)}${e.derived ? ' <small style="display:inline;padding:0;color:#C88B37">· derived</small>' : ''}${e.frame && !/x(900|800)$/.test(e.frame) ? ` <small style="display:inline;padding:0">· ${esc(e.frame)}</small>` : ''}</span><small>${esc(e.note)}</small></a>`;
const grid = (device) => {
  const all = entries(device);
  const shown = all.filter((e) => e.file);
  const order = Object.keys(GROUPS);
  const groups = [...new Set(shown.map((e) => e.group || 'screens'))].sort((a, b) => order.indexOf(a) - order.indexOf(b));
  const same = all.filter((e) => e.same);
  return groups.map((g) => `<h4>${esc(GROUPS[g] || g)} <small>${shown.filter((e) => (e.group || 'screens') === g).length}</small></h4><div class="ds-theme-grid${device === 'mobile' ? ' ds-theme-grid--phone' : ''}">${shown.filter((e) => (e.group || 'screens') === g).map((e) => card(device, e)).join('')}</div>`).join('\n')
    + (same.length ? `<p class="ds-note">Reached two ways, kept once: ${same.map((e) => `<code>${esc(e.name)}</code> = <code>${esc(e.same.split(':')[1] || 'listings')}</code>`).join(', ')}.</p>` : '');
};
const nWeb = entries('web').filter((e) => e.file).length, nPhone = entries('mobile').filter((e) => e.file).length;
const ok = Object.values(L).filter((e) => e.file && e.ok).length;
const section = `<section class="ds-section" id="new-theme"><h2>My Listings — new theme <small>Profolio 2.0 · not yet live</small></h2>
<p class="ds-note">The redesigned My Listings, compiled from the designer’s handover (Draft 3, 15 Sep 2026) the way the product is compiled from its render: every state below is the handover’s live build with the designer’s decisions applied — the product’s shell, the official riyal sign, and the derived screens composed in it — lifted out of its spec at its own size (1440 × 900 on the web, 360 × 800 on a phone) and held to what the browser drew — ${ok} of ${nWeb + nPhone} within ${'0.5'}%. It is the design, not yet the product: at launch the product itself is compiled, and the two are compared. Only My Listings has a new theme; every other page stays the current theme, and so does the shell — every screen draws the product’s own header, and the web screens its rail (on a phone the rail is the header menu’s drawer; the designer’s decision, 29 Sep 2026). The riyal is the official sign, the product’s own icon-font glyph, wherever the handover wrote “SAR” or drew its own rough icon (redrawn 30 Sep 2026). Screens marked <b>derived</b> are drawn by neither build and composed from its own data until the handover draws them. Its tokens: <a href="#new-theme-tokens">Foundations → My Listings — new theme</a>, <a href="new-theme/tokens.css"><code>new-theme/tokens.css</code></a>. Beside the current My Listings: <a href="new-theme/compare.html">current and new</a>. The spec, in words: <a href="../skill/product/listings-new/web-spec.md">web</a>, <a href="../skill/product/listings-new/phone-spec.md">phone</a>.</p>
<h3 id="new-theme-web">Web <small>1440 wide · ${nWeb}</small></h3>
${grid('web')}
<h3 id="new-theme-phone">Phone <small>360 wide · ${nPhone}</small></h3>
<p class="ds-note">The product’s phone header replaces the artboard’s own top (its 9:41 status bar and title). A case chip pins its case first in the list; each case’s performance sheet is a state of its own. The Ad License tab is the build’s own — its scenario chip asks for a tab the build does not have, so the tab is selected directly.</p>
${grid('mobile')}
</section>`;
writeFileSync(join(DATA, 'section.html'), section);

/* current and new, side by side */
const frame = (href) => (href && existsSync(join(D, href)) ? `<a class="cmp-frame" href="../${href}"><img loading="lazy" src="../${shotOf(href)}" alt=""></a><a class="cmp-open" href="../${href}">${esc(href)}</a>` : '<div class="cmp-none">not drawn by the new build — [TBC]</div>');
writeFileSync(join(OUT, 'compare.html'), `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>My Listings — current and new</title>
<link rel="stylesheet" href="../ds.css">
<style>
.cmp-row { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; margin: 0 0 30px; }
.cmp-row--phone { grid-template-columns: repeat(2, max-content); }
.cmp-col h5 { margin: 0 0 6px; color: var(--ds-ink-2); font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: .04em; }
.cmp-frame { overflow: hidden; border: 1px solid var(--ds-line); border-radius: 10px; background: var(--ds-ground); }
.cmp-frame { display: block; width: max-content; }
.cmp-frame img { display: block; }
.cmp-open { display: block; margin-top: 4px; color: var(--ds-ink-3); font-size: 11px; overflow-wrap: anywhere; }
.cmp-none { display: grid; place-items: center; min-height: 120px; border: 1px dashed var(--ds-line); border-radius: 10px; color: var(--ds-ink-3); font-size: 13px; }
@media (max-width: 900px) { .cmp-row { grid-template-columns: 1fr; } }
</style>
</head>
<body class="ds">
<main class="ds-main" style="max-width:1400px;margin:0 auto;padding:32px 16px">
<p class="ds-kicker"><a href="../design-system.html#new-theme">← design system</a></p>
<h1>My Listings — current and new</h1>
<p class="ds-lede">Left, the product as it ships (compiled from its render, the current theme). Right, the new My Listings (compiled from the designer’s handover, Profolio 2.0, not yet live). The web at 1440, the phone at 375 (current) and 360 (new, the designer’s base). Each picture is the top of the screen; it opens full size.</p>
<table class="ds-table"><thead><tr><th></th><th>current theme</th><th>new My Listings</th></tr></thead><tbody>
<tr><td>primary</td><td><code>#006169</code> teal (primaryColor); green <code>#28B16D</code> is secondaryColor</td><td>the green ramp −1…11 around <code>#28B16D</code>; colorPrimaryActive dropped</td></tr>
<tr><td>teal</td><td>everywhere the primary is</td><td>the rank and Quality Score explainers (and the TruCheck glyph, the trend’s selected metric, the tour’s hero)</td></tr>
<tr><td>header and rail</td><td>the product’s shell (teal Post a Listing)</td><td>the same — the product’s shell is kept (the designer’s decision); the handover’s own green, Geist header is not shipped</td></tr>
<tr><td>typeface</td><td>Figtree, Droid Arabic Kufi</td><td>Geist for the UI (My Listings only); Figtree for titles and chrome</td></tr>
<tr><td>the listing</td><td>a table row (web), a card (phone)</td><td>a four-column row with rank and quality in it (web); a card with rank and quality tiles (phone)</td></tr>
<tr><td>detail</td><td>popovers and drawers per action</td><td>the Listing Performance drawer (web, 780px) / bottom sheet (phone)</td></tr>
</tbody></table>
${PAIRS.map(([label, cw, nw, cm, nm]) => `<h2>${esc(label)}</h2>
<div class="cmp-row"><div class="cmp-col"><h5>current · web</h5>${frame(cw)}</div><div class="cmp-col"><h5>new · web</h5>${frame(nw)}</div></div>
<div class="cmp-row cmp-row--phone"><div class="cmp-col"><h5>current · phone</h5>${frame(cm)}</div><div class="cmp-col"><h5>new · phone</h5>${frame(nm)}</div></div>`).join('\n')}
</main>
</body>
</html>
`);
console.log(`  data/theme/section.html — ${nWeb} web, ${nPhone} phone · deliverables/new-theme/compare.html — ${PAIRS.length} pairs`);
