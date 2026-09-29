#!/usr/bin/env node
/**
 * What the NEW My Listings paints — read off its compiled states
 * (deliverables/new-theme/, written by scripts/theme/capture.mjs), the way
 * scripts/ds/painted.mjs reads the product.
 *
 * The product's shell, swapped into every screen (the designer keeps it for
 * now), is left out: it is the current theme, measured with the product.
 *
 * Every piece of text (typeface, size, line height, weight, colour), every
 * painted corner, every colour that fills, edges or inks something, and every
 * shadow — tallied once per (screen, string) or (screen, part), where a part
 * is the labelled layer it sits in (the page, a drawer, a sheet, the tour).
 * The designer's tokens (authoring/themes/new/my-listings.tokens.json) are
 * then held against it: each token's value, and how often it is painted.
 *
 *   node scripts/theme/painted.mjs
 *
 * Writes data/theme/painted.json — read by scripts/theme/foundations.mjs.
 */
import pkg from 'playwright';
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const { chromium } = pkg;
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT = join(ROOT, 'deliverables', 'new-theme');
const list = (rel) => (existsSync(join(OUT, rel)) ? readdirSync(join(OUT, rel)).filter((f) => f.endsWith('.html')).map((f) => join(rel, f)) : []);
const files = [...list(''), ...list('states'), ...list('mobile'), ...list('mobile/states')].filter((f) => f.split('/').pop().startsWith('listings'));

const SCAN = () => {
  const hex = (c) => {
    const m = c && c.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/);
    if (!m) return null;
    const a = m[4] === undefined ? 1 : +m[4];
    if (a === 0) return null;
    const h = '#' + [m[1], m[2], m[3]].map((x) => (+x).toString(16).padStart(2, '0')).join('').toUpperCase();
    return a < 1 ? `${h} ${Math.round(a * 100)}%` : h;
  };
  const text = [], radii = [], colours = [], shadows = [], gradients = [];
  const partOf = (el) => { const l = el.closest('[data-screen-label]'); return l ? l.getAttribute('data-screen-label') : 'screen'; };
  for (const el of document.querySelectorAll('[data-pf-theme-root] *')) {
    if (/^(script|style|template|defs|clippath|lineargradient|stop|use|symbol)$/i.test(el.tagName)) continue;
    /* the product's own shell, swapped in by the designer's decision, is not the new theme */
    if (el.closest('[data-pf-shell]')) continue;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1 || r.right < 0 || r.bottom < 0 || r.left > innerWidth || r.top > innerHeight) continue;
    const part = partOf(el);
    const svg = el instanceof SVGElement;
    const words = svg ? '' : [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join('').replace(/\s+/g, ' ').trim();
    if (words && /[\p{L}\p{N}]/u.test(words)) {
      text.push([cs.fontFamily.split(',')[0].replace(/["']/g, '').trim(), parseFloat(cs.fontSize), cs.lineHeight === 'normal' ? 'normal' : parseFloat(cs.lineHeight), +cs.fontWeight, hex(cs.color), words.slice(0, 200), part]);
      const c = hex(cs.color); if (c) colours.push([c, 'ink', part]);
    }
    if (svg) {
      for (const p of ['fill', 'stroke']) { const v = cs.getPropertyValue(p); const c = hex(v); if (c && v !== 'none') colours.push([c, 'glyph', part]); }
      continue;
    }
    const bg = hex(cs.backgroundColor); if (bg) colours.push([bg, 'ground', part]);
    if (cs.backgroundImage.includes('gradient')) gradients.push([cs.backgroundImage.replace(/\s+/g, ' '), part]);
    for (const s of ['Top', 'Right', 'Bottom', 'Left']) {
      const c = hex(cs[`border${s}Color`]);
      if (parseFloat(cs[`border${s}Width`]) > 0 && cs[`border${s}Style`] !== 'none' && c) { colours.push([c, 'edge', part]); break; }
    }
    if (parseFloat(cs.outlineWidth) > 0 && cs.outlineStyle !== 'none') { const c = hex(cs.outlineColor); if (c) colours.push([c, 'edge', part]); }
    if (cs.boxShadow !== 'none') shadows.push([cs.boxShadow, part]);
    const rr = [cs.borderTopLeftRadius, cs.borderTopRightRadius, cs.borderBottomRightRadius, cs.borderBottomLeftRadius].map((v) => parseFloat(v));
    if (rr.some((x) => x > 0) && (bg || cs.backgroundImage !== 'none' || cs.boxShadow !== 'none' || /^(IMG|CANVAS)$/.test(el.tagName) || parseFloat(cs.borderTopWidth) > 0 || parseFloat(cs.outlineWidth) > 0)) {
      const half = Math.min(r.width, r.height) / 2;
      const v = rr.every((x) => x >= half - 0.5) ? (Math.abs(r.width - r.height) <= 2 ? 'circle' : 'pill') : rr.every((x) => x === rr[0]) ? `${Math.round(rr[0] * 100) / 100}px` : rr.map((x) => `${x}px`).join(' ');
      radii.push([v, part]);
    }
  }
  /* each screen's own ground: the page behind everything */
  /* the visible layer that covers the frame; else the frame itself (the phone's screen is the frame) */
  const cover = [...document.querySelectorAll('[data-pf-theme-root] [data-screen-label]')].filter((e) => { const r = e.getBoundingClientRect(); return e.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }) && r.width >= innerWidth - 1 && r.height >= innerHeight * 0.95 && r.top <= 1 && r.left <= 1; });
  const coverBg = cover.length && hex(getComputedStyle(cover[0]).backgroundColor);
  const grounds = coverBg ? [[cover[0].getAttribute('data-screen-label'), coverBg]] : [['the screen', hex(getComputedStyle(document.body).backgroundColor)]];
  /* what a finger or a pointer can hit: the outermost clickable box, its size and its words */
  const targets = [];
  /* where a target sits on the screen: in a listing card (the box around a subtype line), in the
     list's header (above the first card), or in the part it belongs to (a sheet, a banner) */
  const SUBTYPE = /^(Apartment|Villa|Townhouse) for (Sale|Rent|Daily Rental)$/;
  const cards = [...document.querySelectorAll('[data-pf-theme-root] *')].filter((e) => [...e.childNodes].some((n) => n.nodeType === 3 && SUBTYPE.test(n.textContent.trim()))).map((e) => { for (let x = e; x && x !== document.body; x = x.parentElement) { const q = x.getBoundingClientRect(); if (q.width >= 300 && getComputedStyle(x).backgroundColor === 'rgb(255, 255, 255)') return x; } return null; }).filter(Boolean);
  const firstCard = Math.min(...cards.map((c) => c.getBoundingClientRect().top), Infinity);
  const placeOf = (el, r) => (cards.some((c) => c.contains(el)) ? 'listing card' : partOf(el) !== 'screen' ? partOf(el) : r.bottom <= firstCard ? 'list header' : 'screen');
  for (const el of document.querySelectorAll('[data-pf-theme-root] *')) {
    if (el instanceof SVGElement || el.closest('[data-pf-shell]')) continue;
    const cs = getComputedStyle(el);
    if (cs.cursor !== 'pointer' || (el.parentElement && getComputedStyle(el.parentElement).cursor === 'pointer')) continue;
    if (!el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1 || r.bottom <= 0 || r.top >= innerHeight || r.right <= 0 || r.left >= innerWidth) continue;
    targets.push([Math.round(r.width), Math.round(r.height), (el.innerText || el.getAttribute('aria-label') || el.getAttribute('title') || '').replace(/\s+/g, ' ').trim().slice(0, 30), partOf(el), placeOf(el, r)]);
  }
  /* the shadows of the things tokens name: a listing card (the box around a subtype line)
     and a toast (the box around a confirmation) */
  const named = [];
  const boxOf = (e, test) => { for (let x = e; x && x !== document.body; x = x.parentElement) { if (x.closest('[data-pf-shell]')) return null; if (test(x.getBoundingClientRect(), getComputedStyle(x))) return x; } return null; };
  for (const e of document.querySelectorAll('[data-pf-theme-root] *')) {
    const own = [...e.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join('').trim();
    if (!own || !e.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) continue;
    if (/^(Apartment|Villa|Townhouse) for (Sale|Rent|Daily Rental)$/.test(own)) { const card = boxOf(e, (r, cs) => r.width >= 300 && cs.backgroundColor === 'rgb(255, 255, 255)'); if (card) named.push(['card', getComputedStyle(card).boxShadow, partOf(card)]); }
    if (/marked as booked|blocked:|^Shared on |link sent|Listing deleted|saved/i.test(own)) { const toast = boxOf(e, (r, cs) => cs.boxShadow !== 'none' && r.height < 120); if (toast) named.push(['toast', getComputedStyle(toast).boxShadow, partOf(toast)]); }
  }
  return { text, radii, colours, shadows, gradients, grounds, targets, named };
};

const bump = (m, k, init) => m.get(k) || m.set(k, init()).get(k);
const T = new Map(), FAM = new Map(), RAD = new Map(), COL = new Map(), SH = new Map(), GR = new Map(), GROUND = new Map();
const SAR = [];
const STRINGS = new Map();
const NAMED = new Map();                             /* words → the style each layout draws them in */
const TARGETS = new Map();                                       /* every "SAR" written as text — the product writes the riyal as a glyph */
const browser = await chromium.launch();
const queue = [...files];
await Promise.all(Array.from({ length: 6 }, async () => {
  while (queue.length) {
    const rel = queue.shift();
    const html = readFileSync(join(OUT, rel), 'utf8');
    const [W, H] = (html.match(/name="pf-frame" content="(\d+)x(\d+)"/) || [0, 1440, 900]).slice(1).map(Number);
    const device = rel.startsWith('mobile') ? 'mobile' : 'web';
    const state = rel.split('/').pop().replace(/\.html$/, '').split('--')[1] || 'page';
    const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
    const pg = await ctx.newPage();
    await pg.goto(pathToFileURL(join(OUT, rel)).href, { waitUntil: 'load' });
    await pg.evaluate(() => document.fonts.ready);
    const { text, radii, colours, shadows, gradients, grounds, targets, named } = await pg.evaluate(SCAN);
    for (const [kind, value, part] of named) { const e = bump(NAMED, `${kind}|${device}|${value}`, () => ({ n: 0, parts: new Set() })); e.n++; e.parts.add(part); }
    for (const [w, h, label, part, place] of targets) { const e = bump(TARGETS, `${device}|${w}x${h}`, () => ({ n: 0, labels: new Set(), parts: new Set(), places: new Map() })); e.n++; if (label) e.labels.add(label); e.parts.add(part); e.places.set(place, (e.places.get(place) || 0) + 1); }
    for (const [label, c] of grounds) bump(GROUND, `${device}|${label}|${c}`, () => new Set()).add(state);
    const where = `${device}:${state}`;
    for (const [family, size, lh, weight, colour, full, part] of text) {
      const words = full.slice(0, 50);
      if (full.length <= 60) { const k = [full, device, part, family, size, lh, weight, colour].join('\u0001'); const e = STRINGS.get(k) || STRINGS.set(k, { n: 0, states: new Set() }).get(k); e.n++; e.states.add(state); }
      bump(FAM, family, () => ({ uses: new Set(), devices: new Set(), parts: new Set() })).uses.add(`${device}|${part}|${words}`);
      FAM.get(family).devices.add(device); FAM.get(family).parts.add(part);
      const e = bump(T, `${device}|${family}|${size}|${lh}|${weight}`, () => ({ uses: new Set(), words: new Map(), colours: new Map(), devices: new Set() }));
      e.uses.add(`${device}|${part}|${words}`); e.words.set(words, (e.words.get(words) || 0) + 1); e.devices.add(device);
      if (colour) e.colours.set(colour, (e.colours.get(colour) || 0) + 1);
      if (/\bSAR\b/.test(full)) SAR.push({ device, state, part, words: full.length > 60 ? `…${full.slice(Math.max(0, full.search(/\bSAR\b/) - 20), full.search(/\bSAR\b/) + 25)}…` : full });
    }
    for (const [v, part] of radii) bump(RAD, v, () => new Set()).add(`${device}|${part}`);
    for (const [c, role, part] of colours) {
      const e = bump(COL, c, () => ({ uses: new Set(), roles: new Map(), parts: new Set(), states: new Set() }));
      e.uses.add(`${device}|${part}|${role}`); e.roles.set(role, (e.roles.get(role) || 0) + 1); e.parts.add(`${device}:${part}`); e.states.add(where);
    }
    for (const [v, part] of shadows) bump(SH, v, () => new Set()).add(`${device}|${part}`);
    for (const [v, part] of gradients) bump(GR, v, () => new Set()).add(`${device}|${part}`);
    await ctx.close();
  }
}));
await browser.close();

/* the designer's tokens, flattened, each held against what is painted */
const tokens = JSON.parse(readFileSync(join(ROOT, 'authoring', 'themes', 'new', 'my-listings.tokens.json'), 'utf8'));
const flat = [];
const walk = (o, path) => { for (const [k, v] of Object.entries(o)) { if (k.startsWith('$')) continue; if (v && typeof v === 'object') walk(v, [...path, k]); else flat.push([[...path, k].join('.'), v]); } };
walk(tokens, []);
const colourUses = (v) => { const e = COL.get(String(v).toUpperCase()); return e ? { uses: e.uses.size, parts: [...e.parts] } : { uses: 0, parts: [] }; };
const out = {
  at: new Date().toISOString(),
  files: files.length,
  families: [...FAM.entries()].map(([f, e]) => ({ family: f, uses: e.uses.size, devices: [...e.devices], parts: [...e.parts] })).sort((a, b) => b.uses - a.uses),
  text: [...T.entries()].map(([k, e]) => { const [device, family, size, lh, weight] = k.split('|'); return { device, family, size: +size, lh: lh === 'normal' ? lh : +lh, weight: +weight, uses: e.uses.size, words: [...e.words.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([w]) => w), colours: [...e.colours.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([c]) => c), devices: [...e.devices] }; }).sort((a, b) => b.uses - a.uses),
  radii: [...RAD.entries()].map(([v, s]) => ({ value: v, uses: s.size, parts: [...s].map((x) => x.replace('|', ':')) })).sort((a, b) => b.uses - a.uses),
  strings: [...STRINGS.entries()].map(([k, e]) => { const [w, device, part, family, size, lh, weight, colour] = k.split('\u0001'); return { w, device, part, family, size: +size, lh: lh === 'normal' ? lh : +lh, weight: +weight, colour, n: e.n, states: [...e.states].slice(0, 8) }; }),
  named: [...NAMED.entries()].map(([k, e]) => { const [kind, device, value] = k.split('|'); return { kind, device, value, n: e.n, parts: [...e.parts] }; }),
  targets: [...TARGETS.entries()].map(([k, e]) => { const [device, size] = k.split('|'); return { device, size, n: e.n, labels: [...e.labels].slice(0, 6), parts: [...e.parts], places: Object.fromEntries(e.places) }; }).sort((a, b) => b.n - a.n),
  colours: [...COL.entries()].map(([c, e]) => ({ value: c, uses: e.uses.size, roles: Object.fromEntries(e.roles), parts: [...e.parts], states: [...e.states].length })).sort((a, b) => b.uses - a.uses),
  shadows: [...SH.entries()].map(([v, s]) => ({ value: v, uses: s.size, parts: [...s].map((x) => x.replace('|', ':')) })).sort((a, b) => b.uses - a.uses),
  grounds: [...GROUND.entries()].map(([k, s]) => { const [device, label, colour] = k.split('|'); return { device, label, colour, states: s.size }; }),
  sar: [...new Map(SAR.map((x) => [`${x.device}|${x.part}|${x.words}`, x])).values()].map((x) => ({ ...x, states: SAR.filter((y) => y.device === x.device && y.part === x.part && y.words === x.words).length })),
  gradients: [...GR.entries()].map(([v, s]) => ({ value: v, uses: s.size })).sort((a, b) => b.uses - a.uses),
  tokens: flat.map(([name, value]) => ({ name, value, ...(name.startsWith('color.') && /^#/.test(value) ? colourUses(value) : {}) })),
};
mkdirSync(join(ROOT, 'data', 'theme'), { recursive: true });
writeFileSync(join(ROOT, 'data', 'theme', 'painted.json'), JSON.stringify(out, null, 1));
console.log(`  data/theme/painted.json — ${files.length} files · ${out.text.length} text styles · ${out.colours.length} colours · ${out.radii.length} corners · families: ${out.families.map((f) => `${f.family} ${f.uses} (${f.devices.join('+')})`).join(', ')}`);
