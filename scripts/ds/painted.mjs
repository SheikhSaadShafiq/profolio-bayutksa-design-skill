#!/usr/bin/env node
/**
 * What the product PAINTS — read off the compiled pages, not the stylesheet.
 *
 * profolio.css says what a rule would set; most of its sizes, weights and
 * radii are antd's var(--…) expressions and calc()s, and a rule that never
 * matches still counts there. The Foundations want what a person sees: every
 * piece of text the pages draw — its typeface, size, line height, weight and
 * colour, with the words themselves as samples — every corner a painted box
 * rounds, and every colour that fills, edges or inks something. So each
 * compiled page and state is opened (web at 1440, the responsive layout in a
 * plain 375 window, as scripts/ds/collect.mjs reads them) and its computed
 * styles are tallied.
 *
 * A use is counted once per page: the shell's labels are in every state of a
 * page, and forty states of the dashboard are one dashboard. A text style's
 * uses are distinct (page, string) pairs; a radius's and a colour's are
 * distinct (page, component) pairs.
 *
 *   node scripts/ds/painted.mjs              every compiled page and state
 *   node scripts/ds/painted.mjs --base       the pages only (quick)
 *   node scripts/ds/painted.mjs --limit 40   the first 40 files (testing)
 *
 * Writes data/ds/painted.json, which scripts/ds/tokens.mjs builds the
 * Foundations from.
 */
import pkg from 'playwright';
import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { DEVICES, deviceOf } from '../../harness/devices.mjs';

const { chromium } = pkg;
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const DELIV = join(ROOT, 'deliverables');
const arg = (n, d = null) => { const i = process.argv.indexOf(n); return i > -1 ? process.argv[i + 1] : d; };
const BASE_ONLY = process.argv.includes('--base');
const LIMIT = Number(arg('--limit', 0));

const compiled = (rel) => {
  const dir = join(DELIV, rel);
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((f) => f.endsWith('.html')).map((f) => ({ file: join(dir, f), rel: rel + f }))
    .filter((p) => /<meta name="pf-compiled"/.test(readFileSync(p.file, 'utf8').slice(0, 6000)))
    .map((p) => ({ ...p, device: deviceOf(readFileSync(p.file, 'utf8')), page: p.rel.split('/').pop().replace(/\.html$/, '').split('--')[0] }));
};
let files = [...compiled(''), ...compiled('mobile/'), ...(BASE_ONLY ? [] : [...compiled('states/'), ...compiled('mobile/states/')])];
if (LIMIT) files = files.slice(0, LIMIT);

/* ── in the page ─────────────────────────────────────────────────────── */
const SCAN = () => {
  const text = [], radii = [], colours = [];
  const clear = (c) => !c || c === 'transparent' || /rgba\(\d+, \d+, \d+, 0\)$/.test(c);
  /* the component a box belongs to: the nearest antd class or product
     (styled-components, named after its JSX) class up the tree */
  const owner = (el) => {
    for (let e = el; e && e !== document.body; e = e.parentElement) {
      const c = [...e.classList].find((x) => /^pf-[a-z]/.test(x) && !/^pf-(row|col|flex|space|theme|motion|zoom|fade|slide|move|wave|click|typography$)/.test(x))
        || [...e.classList].find((x) => /^[A-Z][A-Za-z0-9]+(__[\w-]+)?$/.test(x));
      if (c) return c;
    }
    return '';
  };
  for (const el of document.body.querySelectorAll('*')) {
    if (/^(script|style|noscript|template|path|g|defs|clippath|lineargradient|stop|use|symbol)$/i.test(el.tagName)) continue;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) continue;
    const who = owner(el);
    const words = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join('').replace(/\s+/g, ' ').trim();
    if (words && !/^[\s​-‏‪-‮]+$/.test(words)) {
      text.push([cs.fontFamily, cs.fontSize, cs.lineHeight, cs.fontWeight, cs.color, words.slice(0, 60), who]);
      if (!clear(cs.color)) colours.push([cs.color, 'ink', who]);
    }
    if (!clear(cs.backgroundColor)) colours.push([cs.backgroundColor, 'ground', who]);
    for (const s of ['Top', 'Right', 'Bottom', 'Left']) {
      if (parseFloat(cs[`border${s}Width`]) > 0 && cs[`border${s}Style`] !== 'none' && !clear(cs[`border${s}Color`])) { colours.push([cs[`border${s}Color`], 'edge', who]); break; }
    }
    const rr = [cs.borderTopLeftRadius, cs.borderTopRightRadius, cs.borderBottomRightRadius, cs.borderBottomLeftRadius];
    if (rr.some((x) => parseFloat(x) > 0)) {
      const seen = !clear(cs.backgroundColor) || cs.backgroundImage !== 'none' || cs.boxShadow !== 'none' || /^(IMG|VIDEO|CANVAS)$/.test(el.tagName)
        || ['Top', 'Right', 'Bottom', 'Left'].some((s) => parseFloat(cs[`border${s}Width`]) > 0 && cs[`border${s}Style`] !== 'none' && !clear(cs[`border${s}Color`]));
      if (seen) radii.push([rr, who, Math.round(r.width), Math.round(r.height)]);
    }
  }
  return { text, radii, colours };
};

/* ── tally ───────────────────────────────────────────────────────────── */
const T = new Map(), RAD = new Map(), COL = new Map(), FAM = new Map();
const bump = (map, key, init) => map.get(key) || map.set(key, init()).get(key);
const px = (v) => (/^-?[\d.]+px$/.test(v) ? Math.round(parseFloat(v) * 100) / 100 : null);
const firstFamily = (stack) => stack.split(',')[0].replace(/["']/g, '').trim();
/* a corner as a person reads it: a radius as big as half the shorter side is
   a pill (or a circle when the box is square) whatever number made it */
const cornerOf = (rr, w, h) => {
  const each = rr.map((v) => (v.endsWith('%') ? `${parseFloat(v)}%` : px(v.split(' ')[0])));
  const half = Math.min(w, h) / 2;
  const full = each.every((v) => (typeof v === 'number' ? v >= half - 0.5 : parseFloat(v) >= 50));
  if (full) return Math.abs(w - h) <= 2 ? 'circle' : 'pill';
  if (each.every((v) => v === each[0])) return typeof each[0] === 'number' ? `${each[0]}px` : each[0];
  return each.map((v) => (typeof v === 'number' ? `${v}px` : v)).join(' ');
};

const browser = await chromium.launch();
const ctxs = { web: await browser.newContext(DEVICES.web), mobile: await browser.newContext({ viewport: DEVICES.mobile.viewport, deviceScaleFactor: 1 }) };
let done = 0;
const queue = [...files];
const worker = async () => {
  while (queue.length) {
    const f = queue.shift();
    const pg = await ctxs[f.device].newPage();
    await pg.route('**/*', (r) => (/^(file|data):/.test(r.request().url()) ? r.continue() : r.abort()));
    try {
      await pg.goto(pathToFileURL(f.file).href, { waitUntil: 'load', timeout: 30000 });
      await pg.evaluate(() => document.fonts.ready);
      const { text, radii, colours } = await pg.evaluate(SCAN);
      const where = `${f.device}:${f.page}`;
      for (const [fam, size, lh, weight, colour, words, who] of text) {
        const family = firstFamily(fam);
        bump(FAM, family, () => new Set()).add(`${where}|${words}`);
        if (px(size) === null) continue;
        const k = `${family}|${px(size)}|${lh === 'normal' ? 'normal' : px(lh) ?? lh}|${weight}`;
        const e = bump(T, k, () => ({ uses: new Set(), words: new Map(), colours: new Map(), who: new Map(), devices: new Set() }));
        e.uses.add(`${where}|${words}`);
        e.words.set(words, (e.words.get(words) || 0) + 1);
        e.colours.set(colour, (e.colours.get(colour) || 0) + 1);
        if (who) e.who.set(who, (e.who.get(who) || 0) + 1);
        e.devices.add(f.device);
      }
      for (const [rr, who, w, h] of radii) {
        const k = cornerOf(rr, w, h);
        const e = bump(RAD, k, () => ({ uses: new Set(), who: new Map(), px: new Map() }));
        e.uses.add(`${where}|${who}`);
        if (who) bump(e.who, who, () => new Set()).add(where);
        const raw = rr[0];
        e.px.set(raw, (e.px.get(raw) || 0) + 1);
      }
      for (const [c, role, who] of colours) {
        const e = bump(COL, c, () => ({ uses: new Set(), roles: new Map(), who: new Map() }));
        e.uses.add(`${where}|${role}|${who}`);
        e.roles.set(role, (e.roles.get(role) || 0) + 1);
        if (who) bump(e.who, who, () => new Set()).add(where);
      }
    } catch (err) {
      console.log(`  skipped ${f.rel}: ${String(err).split('\n')[0].slice(0, 100)}`);
    }
    await pg.close();
    if (++done % 100 === 0) console.log(`  ${done} of ${files.length}`);
  }
};
await Promise.all(Array.from({ length: 6 }, worker));
await browser.close();

const top = (m, n) => [...m.entries()].sort((a, b) => (b[1].size ?? b[1]) - (a[1].size ?? a[1])).slice(0, n).map(([k, v]) => [k, v.size ?? v]);
const out = {
  at: new Date().toISOString(),
  files: files.length,
  families: top(FAM, 20),
  text: [...T.entries()].map(([k, e]) => {
    const [family, size, lh, weight] = k.split('|');
    /* samples: the words most drawn in this style, shortest-readable first */
    const words = [...e.words.entries()].filter(([w]) => /[\p{L}\p{N}]/u.test(w)).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([w]) => w);
    return { family, size: +size, lh: lh === 'normal' ? 'normal' : isNaN(+lh) ? lh : +lh, weight: +weight || weight, uses: e.uses.size, words, colours: top(e.colours, 3), who: top(e.who, 4), devices: [...e.devices] };
  }).sort((a, b) => b.uses - a.uses),
  radii: [...RAD.entries()].map(([k, e]) => ({ value: k, uses: e.uses.size, who: top(e.who, 6), raw: top(e.px, 4) })).sort((a, b) => b.uses - a.uses),
  colours: [...COL.entries()].map(([k, e]) => ({ value: k, uses: e.uses.size, roles: top(e.roles, 3), who: top(e.who, 5) })).sort((a, b) => b.uses - a.uses),
};
mkdirSync(join(ROOT, 'data', 'ds'), { recursive: true });
writeFileSync(join(ROOT, 'data', 'ds', 'painted.json'), JSON.stringify(out));
console.log(`  data/ds/painted.json — ${files.length} files · ${out.text.length} text styles · ${out.radii.length} corners · ${out.colours.length} colours · families: ${out.families.slice(0, 4).map(([f, n]) => `${f} ${n}`).join(', ')}`);
