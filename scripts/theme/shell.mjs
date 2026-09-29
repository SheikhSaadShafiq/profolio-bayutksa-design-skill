#!/usr/bin/env node
/**
 * The product's shell — the header and the rail every signed-in page draws —
 * cut out of the compiled My Listings, with exactly the CSS that paints it.
 *
 * The designer's decision (2026-09-29): the redesign does not change the
 * product shell. The handover draws My Listings with a header and rail of
 * its own (green Post Listing, Geist, a dot badge); the new My Listings will
 * ship inside the product's current ones. scripts/theme/capture.mjs swaps
 * this shell into every new-theme screen before it is shot.
 *
 * The shell's CSS is the product's (profolio.css, profolio.mobile.css), and
 * must not touch the new content around it, so:
 *   · only rules whose selector names a class, an id or an attribute are
 *     kept — never a bare element or a universal rule (the product's reset);
 *   · every selector is scoped under [data-pf-shell], the container the swap
 *     puts the shell in;
 *   · the custom properties it reads are set on that container, resolved.
 *
 *   node scripts/theme/shell.mjs
 *
 * Writes data/theme/shell.json: { web: { header, rail }, mobile: { header } },
 * each part { html, css, vars, inherited }.
 */
import pkg from 'playwright';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const { chromium } = pkg;
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const D = join(ROOT, 'deliverables');
const LAYOUTS = [
  { device: 'web', page: 'listings.html', css: 'profolio.css', viewport: { width: 1440, height: 900 }, parts: { header: 'header.pf-layout-header', rail: 'aside.pf-layout-sider' } },
  { device: 'mobile', page: 'mobile/listings.html', css: 'profolio.mobile.css', viewport: { width: 375, height: 812 }, parts: { header: 'header.pf-layout-header' } },
];

/* in the product page: the part, the rules that paint it (scoped), the variables they read */
const CUT = (selector) => {
  const el = document.querySelector(selector);
  if (!el) return null;
  const sheet = document.styleSheets[document.styleSheets.length - 1];      /* the stylesheet this script added */
  const inside = [el, ...el.querySelectorAll('*')];
  const strip = (s) => s.replace(/::?(before|after|placeholder|selection|marker|backdrop|-webkit-[\w-]+|-moz-[\w-]+)(\([^)]*\))?/g, '').replace(/:(hover|focus|focus-visible|focus-within|active|visited|checked|disabled|not\([^)]*\))/g, '');
  const named = (s) => /[.#[]/.test(s);                                      /* a class, an id or an attribute — never a bare element */
  const hits = (s) => { const t = strip(s).trim(); if (!t) return false; try { return inside.some((e) => e.matches(t)); } catch { return false; } };
  /* html and body are wrappers in the copy: a selector that names them names the wrappers */
  const retag = (p) => p.replace(/(^|[\s>+~(])html(?=[\s.#[:>+~)]|$)/g, '$1[data-pf-shell-html]').replace(/(^|[\s>+~(])body(?=[\s.#[:>+~)]|$)/g, '$1[data-pf-shell-body]');
  const scope = (s) => s.split(',').map((p) => p.trim()).filter((p) => named(p) && hits(p)).map((p) => `[data-pf-shell] ${retag(p)}`).join(', ');
  const vars = new Set(), families = new Set(), animations = new Set();
  const collect = (text) => { for (const m of text.matchAll(/var\((--[\w-]+)/g)) vars.add(m[1]); };
  for (const e of inside) { families.add(getComputedStyle(e).fontFamily.split(',')[0].replace(/["']/g, '').trim()); const a = getComputedStyle(e).animationName; if (a && a !== 'none') a.split(',').forEach((x) => animations.add(x.trim())); collect(e.getAttribute('style') || ''); }
  const out = [];
  const walk = (rules, into) => {
    for (const r of rules) {
      if (r instanceof CSSStyleRule) { const sel = scope(r.selectorText); if (sel) { into.push(`${sel} { ${r.style.cssText} }`); collect(r.style.cssText); } }
      else if (r instanceof CSSMediaRule) { const inner = []; walk(r.cssRules, inner); if (inner.length) into.push(`@media ${r.conditionText} { ${inner.join('\n')} }`); }
      else if (r instanceof CSSSupportsRule) { const inner = []; walk(r.cssRules, inner); if (inner.length) into.push(`@supports ${r.conditionText} { ${inner.join('\n')} }`); }
      else if (r instanceof CSSFontFaceRule) { const f = r.style.getPropertyValue('font-family').replace(/["']/g, '').trim(); if (families.has(f)) into.push(r.cssText); }
      else if (r instanceof CSSKeyframesRule) { if (animations.has(r.name)) into.push(r.cssText); }
    }
  };
  walk(sheet.cssRules, out);
  /* the variables, resolved where the part reads them (and the ones they read in turn) */
  const cs = getComputedStyle(el);
  const resolved = {};
  const queue = [...vars];
  while (queue.length) { const v = queue.shift(); if (v in resolved) continue; const val = cs.getPropertyValue(v).trim(); resolved[v] = val; for (const m of val.matchAll(/var\((--[\w-]+)/g)) if (!(m[1] in resolved)) queue.push(m[1]); }
  const parent = getComputedStyle(el.parentElement || document.body);
  const inherited = ['font-family', 'font-size', 'line-height', 'color', 'font-weight', 'letter-spacing', '-webkit-font-smoothing', 'text-rendering'].map((p) => `${p}:${parent.getPropertyValue(p)}`).join(';').replace(/"/g, "'");
  const r = el.getBoundingClientRect();
  /* the product's ancestors, as bare wrappers (their classes, ids and attributes, no styles):
     35 of its rules reach the shell through them (.pf-div .pf-layout-sider …, html [type=button]) */
  const wrappers = [];
  for (let x = el.parentElement; x; x = x.parentElement) {
    const attrs = [...x.attributes].filter((a) => a.name !== 'style' && !a.name.startsWith('data-pf-')).map((a) => ` ${a.name}="${a.value.replace(/"/g, '&quot;')}"`).join('');
    wrappers.unshift(`<div${x.tagName === 'HTML' ? ' data-pf-shell-html' : x.tagName === 'BODY' ? ' data-pf-shell-body' : ''}${attrs}>`);
  }
  el.setAttribute('data-pf-shell-root', '');
  const html = `${wrappers.join('')}${el.outerHTML}${'</div>'.repeat(wrappers.length)}`;
  el.removeAttribute('data-pf-shell-root');
  return { html, css: out.join('\n'), vars: Object.entries(resolved).filter(([, v]) => v).map(([k, v]) => `${k}:${v}`).join(';'), inherited, box: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)] };
};

const browser = await chromium.launch();
const shell = {};
for (const L of LAYOUTS) {
  const page = await browser.newPage({ viewport: L.viewport, deviceScaleFactor: 1 });
  await page.goto(pathToFileURL(join(D, L.page)).href, { waitUntil: 'load' });
  /* a file page cannot read another file's rules: the stylesheet is added as text */
  await page.addStyleTag({ content: readFileSync(join(D, L.css), 'utf8') });
  await page.evaluate(() => document.fonts.ready);
  shell[L.device] = {};
  for (const [part, sel] of Object.entries(L.parts)) {
    const cut = await page.evaluate(CUT, sel);
    if (!cut) throw new Error(`${L.device}: no ${sel}`);
    shell[L.device][part] = cut;
    console.log(`  ${L.device} ${part.padEnd(6)} ${String(Math.round(cut.html.length / 1024)).padStart(4)} KB markup · ${String(Math.round(cut.css.length / 1024)).padStart(4)} KB css · ${cut.vars.split(';').filter(Boolean).length} variables · box ${cut.box.join(',')}`);
  }
  await page.close();
}
await browser.close();
/* the shell's faces keep a name of their own: the handover loads its own Figtree, and two faces
   under one name would let the product's decide how the new content's text is drawn */
const renamed = (text, families) => text.split(/(url\("?data:[^)]*\))/).map((seg, i) => (i % 2 ? seg : families.reduce((t, f) => t.replace(new RegExp(`(["']?)\\b${f.replace(/ /g, '\\s')}\\b\\1`, 'g'), `"PF Shell ${f}"`), seg))).join('');
for (const parts of Object.values(shell)) for (const part of Object.values(parts)) {
  const families = [...new Set([...part.css.matchAll(/@font-face\s*\{[^}]*?font-family:\s*"?([^";]+)"?/g)].map((m) => m[1].trim()))];
  for (const k of ['css', 'vars', 'inherited', 'html']) part[k] = renamed(part[k], families);
  part.families = families;
}
mkdirSync(join(ROOT, 'data', 'theme'), { recursive: true });
writeFileSync(join(ROOT, 'data', 'theme', 'shell.json'), JSON.stringify(shell));
console.log('  data/theme/shell.json');
