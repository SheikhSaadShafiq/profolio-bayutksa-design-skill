#!/usr/bin/env node
/**
 * Measure a rendered screen: the computed style of its key elements, its content column,
 * an estimate of its grid, and (--fonts) the faces that actually render each element's
 * text, which can differ from the CSS stack (a missing font, a form control that does
 * not inherit, an Arabic fallback).
 *
 *   node scripts/measure.mjs <screen.html | URL> [--widths 1440,375] [--selectors "body,h1,button"]
 *        [--fonts] [--rtl] [--out measure.json]
 *
 * Every number is read from the render: measured. The grid is inferred from where blocks
 * start, so it is derived: check it against the screen before recording it.
 */
import { writeFileSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const opt = (n, d = null) => { const i = argv.indexOf(n); return i > -1 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : d; };
const target = argv.find((a, i) => !a.startsWith('--') && !['--widths', '--selectors', '--out'].includes(argv[i - 1]));
if (!target) { console.error('usage: node scripts/measure.mjs <screen.html | URL> [--widths 1440,375] [--selectors "body,h1,button"] [--fonts] [--rtl] [--out measure.json]'); process.exit(2); }
const url = /^https?:|^file:/.test(target) ? target : pathToFileURL(resolve(target)).href;
const widths = (opt('--widths', '1440,375')).split(',').map((w) => parseInt(w, 10)).filter(Boolean);
const SELECTORS = (opt('--selectors') || 'body,h1,h2,h3,p,a,button,input,select,label,th,td,[role=row],main,header,nav,aside,[class*=card],[class*=btn],[class*=badge],[class*=chip]').split(',').map((x) => x.trim()).filter(Boolean);
const launcher = [join(HERE, 'browser.mjs'), join(HERE, '..', '..', '_shared', 'browser.mjs')].find(existsSync);
const { launch } = await import(pathToFileURL(launcher).href);
const b = await launch({ install: true, log: console.log });
if (b.error) { console.error(`  no browser — ${b.error}`); process.exit(3); }

const out = { url, measured: new Date().toISOString(), widths: {} };
for (const w of widths) {
  const page = await b.page({ width: w, height: w < 600 ? 812 : 900 });
  await page.goto(url);
  if (argv.includes('--rtl')) await page.evaluate(() => { document.documentElement.dir = 'rtl'; });
  await page.evaluate(() => (document.fonts ? document.fonts.ready.then(() => 1) : 1));
  const m = await page.evaluate((sels) => {
    const vis = (e) => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && r.right > 0 && r.left < innerWidth; };
    const elements = sels.map((sel) => {
      const e = [...document.querySelectorAll(sel)].find(vis);
      if (!e) return null;
      const s = getComputedStyle(e), r = e.getBoundingClientRect();
      return { selector: sel, font: s.font, family: s.fontFamily, size: s.fontSize, line: s.lineHeight, weight: s.fontWeight, letter: s.letterSpacing,
        color: s.color, bg: s.backgroundColor, radius: s.borderRadius, border: `${s.borderTopWidth} ${s.borderTopStyle} ${s.borderTopColor}`, shadow: s.boxShadow,
        padding: s.padding, box: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)] };
    }).filter(Boolean);
    /* the content column: main, else the largest on-screen block that is not the whole page */
    const blocks = [...document.querySelectorAll('body *')].filter((e) => { if (!vis(e) || !e.children.length) return false; const r = e.getBoundingClientRect(); return r.width >= innerWidth * 0.4 && r.width <= innerWidth + 1 && r.height > 120; });
    const main = [...document.querySelectorAll('main, [role=main]')].find(vis) || blocks.sort((a, b2) => { const A = a.getBoundingClientRect(), B = b2.getBoundingClientRect(); return B.width * B.height - A.width * A.height; })[0] || document.body;
    const mr = main.getBoundingClientRect();
    const ms = getComputedStyle(main), pl = parseFloat(ms.paddingInlineStart) || 0, pr = parseFloat(ms.paddingInlineEnd) || 0;
    const content = { selector: main.tagName.toLowerCase() + (main.className && typeof main.className === 'string' ? '.' + main.className.trim().split(/\s+/)[0] : ''), left: Math.round(mr.left + pl), right: Math.round(mr.right - pr), width: Math.round(mr.width), margin_start: Math.round(mr.left), margin_end: Math.round(innerWidth - mr.right), padding_start: getComputedStyle(main).paddingInlineStart, padding_end: getComputedStyle(main).paddingInlineEnd, max_width: getComputedStyle(main).maxWidth };
    /* the grid, estimated: rows of three or more siblings of one width give a column and a gutter */
    const rows = [];
    main.querySelectorAll('*').forEach((p) => {
      const kids = [...p.children].filter(vis);
      if (kids.length < 3) return;
      const rs = kids.map((k) => k.getBoundingClientRect()).filter((r) => r.right <= innerWidth + 1 && r.left >= -1);
      const sameTop = rs.filter((r) => Math.abs(r.top - rs[0].top) < 2);
      if (sameTop.length < 3) return;
      const gaps = sameTop.slice(1).map((r, i) => Math.round(r.left - sameTop[i].right)).filter((g) => g >= 0);
      if (gaps.length) rows.push({ items: sameTop.length, width: Math.round(sameTop[0].width), gap: gaps.sort((a, b2) => a - b2)[Math.floor(gaps.length / 2)] });
    });
    const lefts = {};
    blocks.concat([...main.querySelectorAll('*')].filter(vis)).forEach((e) => { const r = e.getBoundingClientRect(); if (r.width > 120 && r.height > 40 && r.right <= innerWidth + 1) { const x = Math.round(r.left - mr.left); lefts[x] = (lefts[x] || 0) + 1; } });
    const common = Object.entries(lefts).sort((a, b2) => b2[1] - a[1]).slice(0, 10).map(([x, n]) => [+x, n]);
    const gutter = rows.length ? rows.map((r) => r.gap).sort((a, b2) => a - b2)[Math.floor(rows.length / 2)] : null;
    return { elements, content, grid: { rows: rows.slice(0, 8), gutter, common_lefts: common, provenance: 'derived' }, viewport: [innerWidth, innerHeight], dir: document.documentElement.dir || 'ltr' };
  }, SELECTORS);
  if (argv.includes('--fonts') && page.platformFonts) {
    m.fonts = {};
    for (const e of m.elements) { try { m.fonts[e.selector] = await page.platformFonts(e.selector); } catch { /* not Chromium */ } }
  }
  out.widths[w] = m;
  await page.close();
}
await b.close();
const file = opt('--out');
if (file) writeFileSync(file, JSON.stringify(out, null, 2));
for (const [w, m] of Object.entries(out.widths)) {
  console.log(`  ${w}px: content ${m.content.left}–${m.content.right} (${m.content.width}px, max ${m.content.max_width}) · gutter ${m.grid.gutter ?? '?'} · ${m.elements.length} elements read${m.fonts ? ' · fonts: ' + Object.entries(m.fonts).slice(0, 4).map(([s, f]) => `${s} → ${(f || []).map((x) => x.family).join('+')}`).join('; ') : ''}`);
}
if (file) console.log(`  wrote ${file}`);
