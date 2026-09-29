#!/usr/bin/env node
/*
 * Measure an element of a compiled page or a design — the number to quote.
 *
 *   node qa/measure.mjs <file> <css selector> [--375 | --1440 | --width N] [--text "…"] [--all] [--scroll]
 *
 *   node qa/measure.mjs pages/lms-leads.mobile.html ".pf-tabs-tab"
 *   node qa/measure.mjs designs/x.mobile.html ".pf-tabs-tab" --text "Not contacted"
 *
 * For each element the selector matches (the first 12; --all for every one;
 * --text keeps those whose text contains it) it prints
 *   - its box: width × height at x, y (CSS px);
 *   - scrollWidth × scrollHeight, and by how much its content overflows;
 *   - the text visible inside its clipping box (the nearest element, itself
 *     included, whose overflow is not visible), with an ellipsis where
 *     text-overflow draws one — and the text that is cut;
 *   - which of those visible characters another element covers on screen
 *     (the element hit at each character's centre is not this one);
 *   - every position: fixed element that overlaps it (a header, a bottom
 *     bar, a banner), with its box and z-index.
 * The layout is the file's own: 375 × 812 for a .mobile.html file or
 * pf-device "mobile", 1440 × 900 otherwise; --375 / --1440 / --width override.
 * The page is measured as loaded (its own scroll); --scroll first scrolls
 * the element to the middle of the viewport.
 *
 * Needs Playwright. Run from skill/; a path is relative to where you run it.
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const args = process.argv.slice(2);
const flag = (f) => args.includes(f);
const opt = (f) => { const i = args.indexOf(f); return i > -1 ? args[i + 1] : undefined; };
const valued = new Set(['--width', '--text']);
const plain = args.filter((a, i) => !a.startsWith('--') && !valued.has(args[i - 1]));
const [file, selector] = plain;
if (!file || !selector) {
  console.log('usage: node qa/measure.mjs <file> <css selector> [--375 | --1440 | --width N] [--text "…"] [--all] [--scroll]');
  process.exit(2);
}
const path = resolve(file);
if (!existsSync(path)) { console.log(`no such file: ${file}`); process.exit(2); }

let chromium;
for (const name of ['playwright', 'playwright-core', '@playwright/test']) {
  try { ({ chromium } = await import(name)); if (chromium) break; } catch { /* next */ }
}
if (!chromium) {
  console.log('qa/measure.mjs needs Playwright, which is not installed here. Install it once, in skill/ or any folder above it:\n\n    npm i -D playwright && npx playwright install chromium\n');
  process.exit(2);
}

const head = readFileSync(path, 'utf8').slice(0, 20000);
const phoneFile = /\.mobile\.html$/.test(path) || /<meta name="pf-device" content="mobile"/.test(head);
const width = flag('--375') ? 375 : flag('--1440') ? 1440 : opt('--width') ? Number(opt('--width')) : phoneFile ? 375 : 1440;
const height = width <= 480 ? 812 : 900;

let browser;
try { browser = await chromium.launch(); }
catch (e) {
  console.log(`Playwright is installed but its browser is not: npx playwright install chromium\n(${String(e.message).split('\n')[0]})`);
  process.exit(2);
}
const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
/* the file and what sits beside it only: nothing from the network */
await page.route('**/*', (r) => (/^(file|data|about|blob):/.test(r.request().url()) ? r.continue() : r.abort()));
await page.goto(pathToFileURL(path).href, { waitUntil: 'load' });
await page.evaluate(() => document.fonts && document.fonts.ready);
await page.waitForTimeout(100);

const result = await page.evaluate(({ selector, text, all, scroll }) => {
  const r1 = (n) => Math.round(n * 10) / 10;
  const box = (r) => `${r1(r.width)} × ${r1(r.height)} at ${r1(r.left)}, ${r1(r.top)}`;
  const name = (el) => {
    if (!el || el.nodeType !== 1) return String(el);
    const cls = [...el.classList].filter((c) => !/^styleProfolio$/.test(c)).slice(0, 3).map((c) => '.' + c).join('');
    const c = el.getAttribute('data-pf-c');
    return el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + cls + (c ? `[${c}]` : '');
  };
  const clips = (el) => { const s = getComputedStyle(el); return /^(hidden|clip|auto|scroll)$/.test(s.overflowX) || /^(hidden|clip|auto|scroll)$/.test(s.overflowY); };
  const inner = (el) => { const r = el.getBoundingClientRect(); return { left: r.left + el.clientLeft, top: r.top + el.clientTop, right: r.left + el.clientLeft + el.clientWidth, bottom: r.top + el.clientTop + el.clientHeight }; };
  let els = [...document.querySelectorAll(selector)];
  const matched = els.length;
  if (text) els = els.filter((e) => (e.innerText || e.textContent || '').includes(text));
  const kept = els.length;
  if (!all) els = els.slice(0, 12);
  const fixed = [...document.querySelectorAll('body *')].filter((e) => {
    const s = getComputedStyle(e);
    return s.position === 'fixed' && s.display !== 'none' && s.visibility !== 'hidden' && Number(s.opacity) > 0;
  });
  const out = [];
  for (const el of els) {
    if (scroll) el.scrollIntoView({ block: 'center', inline: 'nearest' });
    const r = el.getBoundingClientRect();
    /* the clipping box: the nearest element, this one first, that clips */
    let clipEl = null, clip = { left: -Infinity, top: -Infinity, right: Infinity, bottom: Infinity }, ellipsis = false;
    for (let a = el; a && a !== document.documentElement; a = a.parentElement) {
      if (a !== document.body && clips(a)) {
        const b = inner(a);
        clip = { left: Math.max(clip.left, b.left), top: Math.max(clip.top, b.top), right: Math.min(clip.right, b.right), bottom: Math.min(clip.bottom, b.bottom) };
        if (!clipEl) clipEl = a;
        if (getComputedStyle(a).textOverflow === 'ellipsis') ellipsis = true;
      }
    }
    /* the characters whose box lies inside it */
    let shown = '', cut = '', all = '', covered = '', prev = null;
    const under = new Set();
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const range = document.createRange();
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const st = getComputedStyle(n.parentElement);
      if (st.display === 'none' || st.visibility === 'hidden') continue;
      for (let i = 0; i < n.data.length; i++) {
        const ch = n.data[i];
        range.setStart(n, i); range.setEnd(n, i + 1);
        const rects = [...range.getClientRects()].filter((q) => q.width > 0 || q.height > 0);
        if (!rects.length) { if (/\s/.test(ch) && !/\s$/.test(all)) { all += ' '; shown += ' '; } continue; }
        const q = rects[0];
        /* a gap between two boxes of text (two tabs, two cells) reads as a space */
        if (prev && !/\s$/.test(all) && !/\s/.test(ch) && (q.left - prev.right > 4 || Math.abs(q.top - prev.top) > q.height / 2)) { all += ' '; if (!cut) shown += ' '; else cut += ' '; }
        prev = q;
        const inside = q.left >= clip.left - 0.5 && q.right <= clip.right + 0.5 && q.top >= clip.top - 0.5 && q.bottom <= clip.bottom + 0.5;
        all += ch;
        if (inside && !cut) shown += ch; else cut += ch;
        /* on screen, is it this element that the eye sees there? */
        const cx = (q.left + q.right) / 2, cy = (q.top + q.bottom) / 2;
        if (inside && !/\s/.test(ch) && cx >= 0 && cy >= 0 && cx < innerWidth && cy < innerHeight) {
          const hit = document.elementFromPoint(cx, cy);
          if (hit && hit !== el && !el.contains(hit)) {
            covered += ch;
            let top = hit;
            for (let a = hit; a; a = a.parentElement) if (getComputedStyle(a).position === 'fixed') { top = a; break; }
            under.add(name(top));
          }
        }
      }
    }
    const sq = (s) => s.replace(/\s+/g, ' ').trim();
    const over = fixed.filter((f) => f !== el && !f.contains(el) && !el.contains(f)).map((f) => ({ f, b: f.getBoundingClientRect() }))
      .filter(({ b }) => b.width > 0 && b.height > 0 && b.left < r.right && b.right > r.left && b.top < r.bottom && b.bottom > r.top)
      .map(({ f, b }) => `${name(f)} ${box(b)} z-index ${getComputedStyle(f).zIndex}`);
    out.push({
      el: name(el), box: box(r),
      scroll: `${el.scrollWidth} × ${el.scrollHeight} (client ${el.clientWidth} × ${el.clientHeight})` + (el.scrollWidth > el.clientWidth ? ` — content ${el.scrollWidth - el.clientWidth}px wider than the box` : ''),
      text: sq(all), shown: sq(shown) + (cut.trim() && ellipsis ? '…' : ''), cut: sq(cut), covered, under: [...under],
      clip: clipEl ? `${name(clipEl)} ${box(clipEl.getBoundingClientRect())}${clipEl === el ? ' (itself)' : ''}` : 'none — nothing clips it',
      over,
    });
  }
  return { matched, kept, out, doc: `${document.documentElement.scrollWidth} × ${document.documentElement.scrollHeight}`, scrollX, scrollY, fontsBad: [...document.fonts].filter((f) => f.status === 'error').map((f) => f.family) };
}, { selector, text: opt('--text'), all: flag('--all'), scroll: flag('--scroll') });

await browser.close();
const cmd = ['node qa/measure.mjs', file, JSON.stringify(selector), ...args.filter((a) => a.startsWith('--')).map((a) => (valued.has(a) ? `${a} ${JSON.stringify(opt(a))}` : a))].join(' ');
console.log(`\n  ${cmd}`);
console.log(`  ${file} at ${width} × ${height} · page ${result.doc}${result.doc.split(' × ')[0] > width ? ` — ${result.doc.split(' × ')[0] - width}px wider than the viewport` : ''} · scrolled ${result.scrollX}, ${result.scrollY}${result.fontsBad.length ? ` · FONTS FAILED: ${result.fontsBad.join(', ')}` : ''}`);
console.log(`  ${result.matched} element(s) match ${selector}` + (opt('--text') ? `, ${result.kept} with "${opt('--text')}"` : '') + (result.out.length < result.kept ? ` — the first ${result.out.length} (--all for every one)` : ''));
result.out.forEach((m, i) => {
  console.log(`\n  #${i + 1} ${m.el}`);
  console.log(`     box       ${m.box}`);
  console.log(`     scroll    ${m.scroll}`);
  console.log(`     clipped   ${m.clip}`);
  console.log(`     text      "${m.text}"`);
  console.log(`     visible   "${m.shown}"` + (m.cut ? `   cut: "${m.cut}"` : ''));
  if (m.covered) console.log(`     covered   "${m.covered}" — under ${m.under.join(', ')}`);
  console.log(`     fixed     ${m.over.length ? m.over.join('\n               ') : 'nothing fixed overlaps it'}`);
});
console.log('');
process.exit(result.matched ? 0 : 1);
