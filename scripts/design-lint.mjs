#!/usr/bin/env node
/**
 * Lint a design the skill produced — SKILL.md's pre-flight, automated.
 *
 * A design is an HTML file styled with the product's own stylesheet
 * (deliverables/profolio.css, or profolio.mobile.css for the phone). This
 * renders it in a headless browser, the way the design system's pages are
 * rendered, and holds it to the product:
 *
 *   1 classes     every class is the product's (profolio.css, profolio.mobile.css,
 *                 or written by the product's own render) or the catalogue's
 *                 documented ds- chrome (deliverables/ds.css) — an invented class
 *                 styles nothing, or styles something the product never drew
 *   2 colours     every colour in inline styles, <style> blocks and SVG paint is a
 *                 token (deliverables/tokens.css) or a colour the product paints
 *                 (profolio.css, or inline in its render); a raw literal that
 *                 equals a token should be cited as var(--pf-…)
 *   3 icons       every <use href> resolves in deliverables/sprite.svg; inline
 *                 SVG whose path data is no product icon is a hand-drawn icon
 *   4 copy        visible text is the product's copy (translation.json, its code)
 *                 or plainly data (numbers, dates, the fixture's names); invented
 *                 UI strings are listed
 *   5 currency    amounts carry the riyal glyph (.currency-Saudi_Riyal_Symbol),
 *                 never "SAR"/"ر.س" beside a number (one sentence of copy is
 *                 allowed: "Get one through Bayut, starting from SAR 250."); area
 *                 is "Sq. M."
 *   6 shell       header height, rail width, content offsets — measured on the
 *                 product's compiled pages at run time, not typed in — and the
 *                 rail's labels exactly as the product's nav
 *   7 type        Figtree, loaded; only the weights the product paints; upright
 *   8 responsive  a web design has its 375 counterpart (--pair, or a sibling
 *                 named <name>-375.html / mobile/<name>.html) — linted too
 *   9 disabled    a control marked disabled is dimmed as the product dims it:
 *                 [disabled] → opacity 0.54 (utils.less:142, global)
 *
 *   node scripts/design-lint.mjs design.html
 *   node scripts/design-lint.mjs design.html --pair design-375.html
 *   node scripts/design-lint.mjs a.html b.html --only classes,colours --json
 *
 * --pair <file>      the 375 layout of a web design (linted as responsive)
 * --device web|responsive   override what the file is (default: read from it —
 *                    <meta name="pf-device" content="mobile">, a /mobile/ path,
 *                    profolio.mobile.css, or a -375.html name)
 * --only a,b         run only these checks
 * --verbose          every item, notes included
 * --json             machine-readable
 *
 * Two attributes let a design say what the lint cannot know:
 *   data-pf-data      the text inside is data (a name, a listing title), not copy
 *   data-pf-new-copy  the text inside is NEW copy the PRD needs — reported as a
 *                     warning to confirm (EN + AR), never as if it shipped
 * and data-pf-note (or the catalogue's ds- chrome) marks annotations, which
 * are not part of the design and are not checked for copy, colour or type.
 *
 * Exit status: 1 when any check fails, 2 on a usage error, else 0.
 *
 * What it reads from hundreds of files (the compiled render, the product's
 * source) is cached in the OS temp directory, keyed by those files' sizes and
 * mtimes; the first run after a rebuild takes ~20s, later ones a few seconds
 * per file. PF_LINT_DEBUG=1 prints where the time goes.
 */
import pkg from 'playwright';
import chroma from 'chroma-js';
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';
import { join, dirname, relative, resolve, basename } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { DEVICES } from '../harness/devices.mjs';
import { ROOT, REPO, loadCopy } from './lib/design-search.mjs';

const { chromium } = pkg;
const D = join(ROOT, 'deliverables');
const CHECKS = ['classes', 'colours', 'icons', 'copy', 'currency', 'shell', 'type', 'responsive', 'disabled'];

/* ── arguments ───────────────────────────────────────────────────────── */
const args = process.argv.slice(2);
const VALUE_FLAGS = new Set(['--pair', '--device', '--only']);
const opt = (n) => { const i = args.indexOf(n); return i > -1 ? args[i + 1] : null; };
const FILES = args.filter((a, i) => !a.startsWith('--') && !VALUE_FLAGS.has(args[i - 1]));
const PAIR = opt('--pair'), DEVICE_OPT = opt('--device'), JSON_OUT = args.includes('--json'), VERBOSE = args.includes('--verbose');
const ONLY = opt('--only') ? new Set(opt('--only').split(',').map((s) => s.trim()).filter(Boolean)) : null;
const usage = 'usage: node scripts/design-lint.mjs <design.html> [more.html …] [--pair <design-375.html>] [--device web|responsive] [--only classes,colours,…] [--verbose] [--json]';
if (!FILES.length || args.includes('--help')) { console.error(usage); process.exit(2); }
for (const f of [...FILES, ...(PAIR ? [PAIR] : [])]) if (!existsSync(f)) { console.error(`no such file: ${f}`); process.exit(2); }
if (PAIR && FILES.length > 1) { console.error('--pair belongs to one design; lint one file with its pair at a time'); process.exit(2); }
if (DEVICE_OPT && !['web', 'responsive'].includes(DEVICE_OPT)) { console.error('--device is web or responsive'); process.exit(2); }
if (ONLY) for (const c of ONLY) if (!CHECKS.includes(c)) { console.error(`unknown check “${c}” — one of ${CHECKS.join(', ')}`); process.exit(2); }

const read = (p) => (existsSync(p) ? readFileSync(p, 'utf8') : '');
const T0 = Date.now();
const debug = (what) => { if (process.env.PF_LINT_DEBUG) console.error(`[lint ${((Date.now() - T0) / 1000).toFixed(2)}s] ${what}`); };
const rel = (p) => { const r = relative(ROOT, resolve(p)); return !r || r.startsWith('..') ? resolve(p) : r; };
const uniq = (a) => [...new Set(a)];
const clip = (s, n = 60) => { s = String(s ?? '').replace(/\s+/g, ' ').trim(); return s.length > n ? `${s.slice(0, n - 1)}…` : s; };
const unescapeHtml = (s) => String(s).replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');

/* What is read from hundreds of files is kept in the OS temp directory,
   keyed by every source file's size and mtime — a changed file rebuilds it. */
const statKey = (paths) => { const h = createHash('sha1'); for (const p of paths) { try { const st = statSync(p); h.update(`${p}:${st.size}:${st.mtimeMs}\n`); } catch { h.update(`${p}:-\n`); } } return h.digest('hex').slice(0, 16); };
const cached = (name, keyPaths, build) => {
  /* the key covers the files AND the code that reads them */
  const code = createHash('sha1').update(build.toString() + normD.toString() + norm.toString()).digest('hex').slice(0, 8);
  const file = join(tmpdir(), `profolio-design-lint-${name}-${statKey(keyPaths)}-${code}.json`);
  if (existsSync(file)) { try { return JSON.parse(readFileSync(file, 'utf8')); } catch { /* rebuild */ } }
  const v = build();
  try { writeFileSync(file, JSON.stringify(v)); } catch { /* read-only tmp: fine */ }
  return v;
};

/* ═══ THE PRODUCT ═════════════════════════════════════════════════════════
   Everything below is read from the design system's own files at run time. */

/* ── stylesheets: their classes, custom properties and colours ───────── */
const stripComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');
const noUrls = (css) => css.replace(/url\((?:"[^"]*"|'[^']*'|[^)]*)\)/g, 'url()');
/* the rules of a stylesheet: { selector, decls: [{ prop, value, raw }] } */
const rulesOf = (css) => {
  const out = [];
  const t = noUrls(stripComments(css));
  for (const chunk of t.split('}')) {
    const i = chunk.lastIndexOf('{');
    if (i < 0) continue;
    const selector = chunk.slice(0, i).split('{').pop().trim();
    if (/^@font-face/.test(selector)) continue;
    const decls = [];
    for (const part of chunk.slice(i + 1).split(';')) {
      const m = part.match(/^\s*(--[\w-]+|[a-zA-Z-]+)\s*:\s*([\s\S]+?)\s*$/);
      if (m) decls.push({ prop: m[1].toLowerCase(), value: m[2].replace(/!important/i, '').trim(), raw: part.trim() });
    }
    out.push({ selector, decls });
  }
  return out;
};
const declsOf = (styleAttr) => rulesOf(`x{${styleAttr}}`)[0]?.decls || [];
const selectorClasses = (css) => {
  const set = new Set();
  for (const { selector } of rulesOf(css)) for (const m of selector.matchAll(/\.((?:[a-zA-Z_]|-[a-zA-Z_-]|\\.)(?:[\w-]|\\.)*)/g)) set.add(m[1].replace(/\\(.)/g, '$1'));
  return set;
};
const varsDefined = (css) => new Set(rulesOf(css).flatMap((r) => r.decls.filter((d) => d.prop.startsWith('--')).map((d) => d.prop)));

const WEB_CSS = read(join(D, 'profolio.css')), MOBILE_CSS = read(join(D, 'profolio.mobile.css'));
const TOKENS_CSS = read(join(D, 'tokens.css')), DS_CSS = read(join(D, 'ds.css'));
if (!WEB_CSS) { console.error('deliverables/profolio.css is missing — run npm run ds'); process.exit(2); }
const CSS_CLASSES = new Set([...selectorClasses(WEB_CSS), ...selectorClasses(MOBILE_CSS)]);
const DS_CLASSES = selectorClasses(DS_CSS);
const varsUsed = (css) => new Set([...css.matchAll(/var\(\s*(--[\w-]+)/g)].map((m) => m[1]));
const PRODUCT_VARS = new Set([...varsDefined(WEB_CSS), ...varsDefined(MOBILE_CSS), ...varsDefined(TOKENS_CSS), ...varsUsed(WEB_CSS), ...varsUsed(MOBILE_CSS)]);
const DS_VARS = varsDefined(DS_CSS);
const PRODUCT_SHEETS = new Set(['profolio.css', 'profolio.mobile.css', 'tokens.css', 'fonts.css', 'ds.css']);

/* ── colours ─────────────────────────────────────────────────────────── */
const NAMED = new Set(Object.keys(chroma.colors));
const COLOUR_PROPS = /^(color|background(-color)?|border(-(top|right|bottom|left|block|inline)(-(start|end))?)?(-color)?|outline(-color)?|fill|stroke|box-shadow|text-shadow|caret-color|column-rule(-color)?|text-decoration(-color)?|stop-color|flood-color|lighting-color|accent-color|--[\w-]+)$/i;
const COLOUR_LIT = /#[0-9a-fA-F]{8}\b|#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3,4}\b|\b(?:rgba?|hsla?)\([^()]*\)/g;
const parseColour = (s) => {
  const t = String(s).trim().toLowerCase();
  const m = t.match(/^(rgba?|hsla?)\(([^)]*)\)$/);
  try {
    if (m) {
      let parts = m[2].replace(/\s*\/\s*/, ' / ').split(/[\s,]+/).filter(Boolean);
      let a = 1;
      const slash = parts.indexOf('/');
      if (slash > -1) { a = parts[slash + 1]; parts = parts.slice(0, slash); } else if (parts.length === 4) { a = parts[3]; parts = parts.slice(0, 3); }
      a = typeof a === 'string' ? (a.endsWith('%') ? parseFloat(a) / 100 : parseFloat(a)) : a;
      if (parts.length < 3 || parts.some((p) => Number.isNaN(parseFloat(p)))) return null;
      if (m[1].startsWith('rgb')) return [...parts.map((p) => (p.endsWith('%') ? Math.round(parseFloat(p) * 2.55) : Math.round(parseFloat(p)))), a];
      const [r, g, b] = chroma.hsl(parseFloat(parts[0]), parseFloat(parts[1]) / 100, parseFloat(parts[2]) / 100).rgb();
      return [r, g, b, a];
    }
    const c = chroma(t);
    return [...c.rgb(), c.alpha()];
  } catch { return null; }
};
const ckey = (c) => (c ? `${c[0]},${c[1]},${c[2]},${+(+c[3]).toFixed(3)}` : null);
const hexOf = (c) => `${chroma(c[0], c[1], c[2]).hex()}${c[3] < 1 ? ` at ${+(+c[3]).toFixed(2)}` : ''}`;
/* every colour a list of declarations names */
const coloursOfDecls = (decls) => {
  const out = [];
  for (const d of decls) {
    for (const m of d.value.matchAll(COLOUR_LIT)) { const c = parseColour(m[0]); if (c) out.push({ c, text: m[0], prop: d.prop }); }
    if (COLOUR_PROPS.test(d.prop)) for (const w of d.value.split(/[\s,()/]+/)) if (NAMED.has(w.toLowerCase())) { const c = parseColour(w); if (c) out.push({ c, text: w, prop: d.prop }); }
  }
  return out;
};
const coloursOfCss = (css) => coloursOfDecls(rulesOf(css).flatMap((r) => r.decls));

/* named colours: tokens.css first, then the product's own custom properties */
const TOKEN_NAMES = new Map();
for (const [css] of [[TOKENS_CSS], [WEB_CSS]]) {
  for (const r of rulesOf(css)) for (const d of r.decls) {
    if (!d.prop.startsWith('--pf-')) continue;
    const lits = [...d.value.matchAll(COLOUR_LIT)];
    const one = lits.length === 1 && lits[0][0].length === d.value.length ? parseColour(lits[0][0]) : NAMED.has(d.value.toLowerCase()) ? parseColour(d.value) : null;
    if (!one) continue;
    const k = ckey(one);
    if (!TOKEN_NAMES.has(k)) TOKEN_NAMES.set(k, []);
    if (!TOKEN_NAMES.get(k).includes(d.prop)) TOKEN_NAMES.get(k).push(d.prop);
  }
}
const CSS_COLOURS = new Set([...coloursOfCss(WEB_CSS), ...coloursOfCss(MOBILE_CSS), ...coloursOfCss(TOKENS_CSS)].map((x) => ckey(x.c)));
const nearestToken = (c) => {
  let best = null;
  for (const [k, names] of TOKEN_NAMES) {
    const [r, g, b, a] = k.split(',').map(Number);
    if (Math.abs(a - c[3]) > 0.01) continue;
    const d = chroma.deltaE(chroma(r, g, b), chroma(c[0], c[1], c[2]));
    if (!best || d < best.d) best = { names, hex: chroma(r, g, b).hex(), d };
  }
  return best;
};

/* ── icons ───────────────────────────────────────────────────────────── */
/* path data written two ways is the same path: commas or spaces, spaces
   around commands, "0.5" or ".5" */
const normD = (d) => String(d).replace(/,/g, ' ').replace(/\s+/g, ' ').replace(/\s*([A-Za-z])\s*/g, '$1').replace(/\s+-/g, '-').replace(/(^|[^\d.])0\.(\d)/g, '$1.$2').trim();
const SPRITE_TEXT = read(join(D, 'sprite.svg'));
const SPRITE = new Map([...SPRITE_TEXT.matchAll(/<symbol\b[^>]*\bid="([^"]+)"[^>]*>([\s\S]*?)<\/symbol>/g)].map((m) => [m[1], m[2]]));
const pathsIn = (svg) => [...String(svg).matchAll(/<path\b[^>]*?\sd="([^"]+)"/g)].map((m) => normD(m[1]));
const SPRITE_PATHS = new Set(pathsIn(SPRITE_TEXT));
const shapeSig = (tag, attrs) => `${tag}(${['cx', 'cy', 'r', 'rx', 'ry', 'x', 'y', 'width', 'height', 'x1', 'y1', 'x2', 'y2', 'points'].filter((a) => attrs[a] != null).map((a) => `${a}=${String(attrs[a]).replace(/\s+/g, ' ').trim()}`).join(',')})`;

/* ── the product's source, walked once ───────────────────────────────── */
let SRC = null;
const srcFiles = () => {
  if (SRC) return SRC;
  SRC = [];
  const walk = (d) => {
    for (const n of readdirSync(d)) {
      const p = join(d, n); const st = statSync(p);
      if (st.isDirectory()) { if (!/^(node_modules|\.git|locales|__tests__)$/.test(n)) walk(p); } else if (/\.(jsx?|tsx?|json)$/.test(n) && st.size < 2e6) SRC.push(p);
    }
  };
  if (existsSync(join(REPO, 'src'))) walk(join(REPO, 'src'));
  return SRC;
};

/* ── the product's render: every compiled page, read once, lazily ────── */
const COMPILED_DIRS = ['', 'states/', 'mobile/', 'mobile/states/'];
const isCompiledHtml = (html) => /<meta name="pf-compiled"/.test(html.slice(0, 8000));
/* an inline style as the product's render wrote it — pasted from a compiled
   page, it is the product's own, literals and all */
const styleKey = (st) => String(st).replace(/\s+/g, ' ').trim();
const compiledFiles = () => COMPILED_DIRS.flatMap((dir) => (existsSync(join(D, dir)) ? readdirSync(join(D, dir)).filter((x) => x.endsWith('.html')).map((x) => join(D, dir, x)) : []));
let RENDER = null;
const render = () => {
  if (RENDER) return RENDER;
  debug('product render vocabulary');
  const files = compiledFiles();
  const v = cached('render', [...files, ...srcFiles()], () => {
    const classes = new Set(), colours = new Set(), paths = new Set(), shapes = new Set(), styles = new Set(), paints = new Set();
    let n = 0;
    for (const f of files) {
      const html = readFileSync(f, 'utf8');
      if (!isCompiledHtml(html)) continue;
      n++;
      for (const m of html.matchAll(/\sclass="([^"]*)"/g)) for (const c of m[1].split(/\s+/)) if (c) classes.add(c);
      for (const m of html.matchAll(/\sstyle="([^"]*)"/g)) styles.add(m[1]);
      for (const m of html.matchAll(/\s(?:fill|stroke|stop-color|color|flood-color)="([^"]*)"/g)) paints.add(m[1]);
      for (const m of html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)) {
        for (const x of coloursOfCss(m[1])) colours.add(ckey(x.c));
        for (const c of selectorClasses(m[1])) classes.add(c);
      }
      for (const d of pathsIn(html)) paths.add(d);
      for (const m of html.matchAll(/<(circle|rect|ellipse|line|polyline|polygon)\b([^>]*)>/g)) {
        const attrs = Object.fromEntries([...m[2].matchAll(/\s([\w-]+)="([^"]*)"/g)].map((a) => [a[1], a[2]]));
        shapes.add(shapeSig(m[1], attrs));
      }
    }
    /* each distinct inline style once — most repeat on every page */
    const unattr = (x) => x.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
    for (const st of styles) for (const x of coloursOfDecls(declsOf(unattr(st)))) colours.add(ckey(x.c));
    for (const pv of paints) { const c = parseColour(pv); if (c) colours.add(ckey(c)); }
    for (const f of srcFiles()) for (const m of readFileSync(f, 'utf8').matchAll(/\bd="([^"]{8,})"/g)) paths.add(normD(m[1]));
    return { files: n, classes: [...classes], colours: [...colours], paths: [...paths], shapes: [...shapes], styles: [...styles].map((x) => styleKey(unattr(x))) };
  });
  RENDER = { files: v.files, classes: new Set(v.classes), colours: new Set(v.colours), paths: new Set(v.paths), shapes: new Set(v.shapes), styles: new Set(v.styles) };
  return RENDER;
};

/* ── the product's words ─────────────────────────────────────────────── */
const norm = (s) => String(s).toLowerCase()
  .replace(/[‎‏‪-‮⁦-⁩­]/g, '').replace(/[’‘]/g, "'").replace(/[“”]/g, '"').replace(/ /g, ' ')
  .replace(/\s+/g, ' ').replace(/^[\s(\[•·*"'‹«–—)-]+|[\s:*.!?,;…"'›»()\[\]–—-]+$/g, '').trim();
let WORDS = null;
const productWords = () => {
  if (WORDS) return WORDS;
  debug('product words');
  const copy = new Set(), code = new Set(), fixture = new Set(), place = [];
  const reEsc = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const { en, ar } = loadCopy();
  const addCopy = (v) => {
    const t = String(v).replace(/<[^>]+>/g, '');
    const n = norm(t);
    if (!n) return;
    copy.add(n);
    if (/\{\{/.test(n)) place.push(new RegExp(`^${n.split(/\{\{[^}]*\}\}/).map(reEsc).join('.+')}$`));
  };
  for (const [k, v] of Object.entries(en)) if (typeof v === 'string') { addCopy(v); addCopy(k); }
  for (const v of Object.values(ar)) if (typeof v === 'string') addCopy(v);
  /* the fixture account's own words — names, addresses, listing titles */
  const fx = join(ROOT, 'harness', 'fixtures');
  const fixtureFiles = [join(ROOT, 'harness', 'fixtures.mjs'), ...(existsSync(fx) ? readdirSync(fx).filter((f) => /\.(mjs|js|json)$/.test(f)).map((f) => join(fx, f)) : [])];
  /* the UI library's own strings — Pagination's "Next Page", the pickers'
     "Today" — ship with the product; they are in antd, not in its source */
  const NM = join(ROOT, 'node_modules');
  const localeFiles = [];
  const findLocales = (d, depth) => { if (depth > 5 || !existsSync(d)) return; for (const n of readdirSync(d)) { const p = join(d, n); if (n === 'en_US.js' && /[\/]lib[\/]/.test(p)) localeFiles.push(p); else if (!n.includes('.') && statSync(p).isDirectory() && !/^(es|dist|node_modules)$/.test(n)) findLocales(p, depth + 1); } };
  for (const pkgDir of ['antd/lib', ...(existsSync(NM) ? readdirSync(NM).filter((n) => /^rc-/.test(n)).map((n) => `${n}/lib`) : [])]) findLocales(join(NM, pkgDir), 0);
  const ix = join(ROOT, 'harness', 'interactions');
  const interactionFiles = existsSync(ix) ? readdirSync(ix).filter((f) => /\.m?js$/.test(f)).map((f) => join(ix, f)) : [];
  const v = cached('words', [...srcFiles(), ...fixtureFiles, ...localeFiles, ...interactionFiles], () => {
    const code = new Set(), fixture = new Set(), templates = new Set();
    const reEscT = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    for (const f of localeFiles) for (const m of readFileSync(f, 'utf8').matchAll(/'([^'\n]{2,80})'|"([^"\n]{2,80})"/g)) code.add(norm(m[1] || m[2]));
    for (const f of srcFiles()) {
      const t = readFileSync(f, 'utf8');
      for (const m of t.matchAll(/'([^'\n]{2,160})'|"([^"\n]{2,160})"|`([^`$\n]{2,160})`/g)) code.add(norm(m[1] || m[2] || m[3]));
      for (const m of t.matchAll(/>([^<>{}\n]{2,160})</g)) code.add(norm(m[1]));
      /* a string the code composes: `Auto Translate ${lang} ${field}` → a pattern */
      for (const m of t.matchAll(/`([^`\n]{4,200})`/g)) {
        if (!m[1].includes('${')) continue;
        const parts = norm(m[1].replace(/\$\{[^}]*\}/g, '\u0001')).split('\u0001');
        if (parts.join('').replace(/[^a-z]/g, '').length < 8) continue;
        templates.add(`^${parts.map(reEscT).join('.+')}$`);
      }
    }
    /* 'a sentence ' + 'split over lines' is one string */
    const joined = (f) => readFileSync(f, 'utf8').replace(/(['"])\s*\+\s*\1/g, '');
    /* what the harness TYPED into the product's fields is data too */
    for (const f of interactionFiles) for (const m of readFileSync(f, 'utf8').matchAll(/\.(?:fill|type|pressSequentially)\(\s*(['"`])((?:(?!\1)[^\n]){2,4000})\1/g)) fixture.add(norm(m[2]));
    for (const f of fixtureFiles) if (existsSync(f)) for (const m of joined(f).matchAll(/'((?:[^'\\\n]|\\.){2,4000})'|"((?:[^"\\\n]|\\.){2,4000})"|`([^`]{2,4000})`/g)) fixture.add(norm((m[1] || m[2] || m[3]).replace(/\\(.)/g, '$1').replace(/\$\{[^}]*\}/g, ' ')));
    return { code: [...code], fixture: [...fixture], templates: [...templates] };
  });
  for (const x of v.code) code.add(x);
  for (const x of v.fixture) fixture.add(x);
  const codePlace = (v.templates || []).map((x) => { try { return new RegExp(x); } catch { return null; } }).filter(Boolean);
  WORDS = { copy, code, codePlace, fixture, place, copyList: [...copy].filter((c) => c.length >= 6), fixtureList: [...fixture].filter((x) => x.length >= 4) };
  return WORDS;
};
const isData = (n, raw = '') => /\d/.test(n)
  || /^\p{Lu}{1,3}$/u.test(String(raw).trim())                                                  /* an avatar's initials */
  || /^[^\p{L}]+$/u.test(n)
  || /@|https?:|www\.|\.(com|sa|net|org)\b/.test(n)
  || /^(a|an|one|a few) (seconds?|minutes?|hours?|days?|weeks?|months?|years?) ago$/.test(n)
  || /^(just now|yesterday|today|tomorrow)$/.test(n)
  || /^(mon|tue|wed|thu|fri|sat|sun)(day|sday|nesday|rsday|urday)?$/.test(n)                     /* a chart's or a picker's days */
  || /^(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*$/.test(n) && n.length <= 9;
/* copy · code · data · unmatched */
const classify = (raw) => {
  const W = productWords();
  const n = norm(raw);
  if (!n) return 'data';
  const one = (x) => {
    if (W.copy.has(x) || W.place.some((r) => r.test(x))) return 'copy';
    if (W.code.has(x) || W.codePlace.some((r) => r.test(x))) return 'code';
    if (isData(x, raw)) return 'data';
    if (W.fixture.has(x) || (x.length >= 6 && W.fixtureList.some((f) => f.includes(x))) || W.fixtureList.some((f) => f.length >= x.length * 0.6 && x.includes(f))) return 'data';
    return null;
  };
  const hit = one(n);
  if (hit) return hit;
  /* text the product cut short with an ellipsis: its last piece begins a real one */
  if (/(\.\.\.|…)\s*$/.test(String(raw))) {
    const parts = n.split(/\s*,\s*/).filter(Boolean);
    const last = parts.pop() || '';
    const begins = (x) => x.length >= 2 && (W.fixtureList.some((f) => f.startsWith(x) || f.includes(` ${x}`)) || W.copyList.some((c) => c.startsWith(x)));
    if ((!parts.length || parts.every((p) => one(p))) && (begins(last) || one(last))) return 'data';
    if (W.fixtureList.some((f) => f.startsWith(n)) || W.copyList.some((c) => c.startsWith(n))) return 'data';
  }
  /* assembled from pieces: "Attachment (Optional)", "Price of Property (",
     "Riyadh, North Riyadh, Al Rawabi" */
  const pieces = n.split(/\s*(?:[·•|/:(),–—]|\s-\s)\s*/).map((p) => norm(p)).filter(Boolean);
  if (pieces.length > 1 && pieces.every((p) => one(p))) return 'copy';
  /* a short label the code composes from data and copy: "Chalet for Rent",
     "Villa for Daily Rental" — never a sentence */
  if (n.split(' ').length <= 8) {
    const bits = n.split(/\s*(?:[·•|/:(),–—]|\s-\s|\s(?:for|in|of|at|by|with|and|&|to|from|per)\s)\s*/).map((p) => norm(p)).filter(Boolean);
    if (bits.length > 1 && bits.every((p) => p.split(' ').length <= 3 && one(p))) return 'copy';
  }
  /* a name the fixture composes from its lists of first names and surnames */
  if (nameLike(String(raw)) && n.split(' ').length >= 2 && n.split(' ').every((w) => W.fixture.has(w))) return 'data';
  /* a fragment of a longer string, split across elements */
  if (n.length >= 8 && W.copyList.some((c) => c.length > n.length && c.includes(n))) return 'copy';
  return 'unmatched';
};
const nameLike = (s) => { const w = s.trim().split(/\s+/); return w.length <= 5 && !/[.!?:]$/.test(s.trim()) && w.every((x) => /^[\p{Lu}][\p{L}'’.-]*$/u.test(x) || /^(al|bin|bint|ibn|el|de|of|and|&|the)$/i.test(x) || /^(Al|El)-\p{Lu}/u.test(x)); };
const ALLOWED_SAR = 'get one through bayut, starting from sar 250';

/* ── the nav, from kb/pages/_shell.html and from the compiled rail ───── */
const SHELL_HTML = read(join(ROOT, 'kb', 'pages', '_shell.html'));
const NAV_DOC = [...SHELL_HTML.matchAll(/<tr><td>([^<]*)<strong>([^<]+)<\/strong><\/td><td><code>/g)].map((m) => unescapeHtml(m[2]).trim());
const SHELL_DOC = {
  header: +(SHELL_HTML.match(/Header height<\/td><td><strong>(\d+)px/) || [])[1] || null,
  collapsed: +(SHELL_HTML.match(/Sider width, collapsed<\/td><td><strong>(\d+)px/) || [])[1] || null,
  expanded: +(SHELL_HTML.match(/Sider width, expanded<\/td><td><strong>(\d+)px/) || [])[1] || null,
};
const NAV_ALIASES = { dashboard: 'Overview', home: 'Overview', listings: 'My Listings', leads: 'TruLeads', 'lead management': 'TruLeads', packages: 'Credits & Packages', 'buy credits': 'Credits & Packages', credits: 'Credits Usage', staff: 'Agency Staff', team: 'Agency Staff', users: 'Agency Staff', performance: 'Agent Performance', 'post a listing': 'Post Listing', 'post listing': 'Post Listing', settings: 'Settings', profile: 'Settings', reports: 'Reports' };

/* ── weights the product paints ──────────────────────────────────────── */
const CSS_WEIGHTS = new Set();
for (const css of [WEB_CSS, MOBILE_CSS]) for (const r of rulesOf(css)) for (const d of r.decls) if (d.prop === 'font-weight') {
  const v = d.value.trim().toLowerCase();
  if (/^\d{3}$/.test(v)) CSS_WEIGHTS.add(v); else if (v === 'normal') CSS_WEIGHTS.add('400'); else if (v === 'bold') CSS_WEIGHTS.add('700');
}

/* ═══ IN THE PAGE ════════════════════════════════════════════════════════
   One pass over the rendered design: what it uses, where, and how it paints. */
const INSPECT = () => {
  const vis = (el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none'; };
  const clean = (t) => String(t || '').replace(/\s+/g, ' ').trim();
  const seg = (e) => e.tagName.toLowerCase() + (e.id ? `#${e.id}` : '') + [...(e.classList || [])].slice(0, 2).map((c) => `.${c}`).join('');
  const where = (el) => { const chain = []; for (let e = el; e && e.nodeType === 1 && e !== document.body && e !== document.documentElement && chain.length < 3; e = e.parentElement) chain.unshift(seg(e)); return chain.join(' > ') || 'body'; };
  const EXAMPLE = '.ds-example, .ds-stage, .ds-frame, .ds-phone, .ds-thumb';
  const isNote = (el) => !!el.closest('[data-pf-note]') || (!!el.closest('[class^="ds-"], [class*=" ds-"]') && !el.closest(EXAMPLE));
  const effOpacity = (el) => { let o = 1; for (let e = el; e && e.nodeType === 1; e = e.parentElement) o *= +getComputedStyle(e).opacity; return o; };
  const out = { classes: {}, styles: [], styleBlocks: [], sheets: [], paints: [], uses: [], svgs: [], texts: [], attrs: [], glyphs: [], disabled: [], looksDisabled: [], fonts: [] };

  /* classes */
  for (const el of document.querySelectorAll('[class]')) {
    for (const c of (el.getAttribute('class') || '').split(/\s+/)) {
      if (!c) continue;
      const u = (out.classes[c] ||= { n: 0, where: [], note: true });
      u.n++; if (u.where.length < 2) u.where.push(where(el));
      if (!isNote(el)) u.note = false;
    }
  }
  /* colours: inline styles, <style>, linked sheets, SVG paint */
  for (const el of document.querySelectorAll('[style]')) out.styles.push({ style: el.getAttribute('style'), where: where(el), note: isNote(el) });
  for (const s of document.querySelectorAll('style')) out.styleBlocks.push(s.textContent || '');
  for (const l of document.querySelectorAll('link[rel~="stylesheet"]')) out.sheets.push(l.href);
  for (const el of document.querySelectorAll('[fill], [stroke], [stop-color], [color], [flood-color]')) {
    if (el.closest('symbol, defs')) continue;
    for (const a of ['fill', 'stroke', 'stop-color', 'color', 'flood-color']) { const v = el.getAttribute(a); if (v) out.paints.push({ attr: a, value: v, where: where(el), note: isNote(el) }); }
  }
  /* icons */
  for (const u of document.querySelectorAll('use')) {
    const href = u.getAttribute('href') || u.getAttribute('xlink:href') || '';
    const id = href.includes('#') ? href.slice(href.indexOf('#') + 1) : '';
    const target = id ? document.getElementById(id) : null;
    const svg = u.closest('svg');
    const r = svg ? svg.getBoundingClientRect() : { width: 0, height: 0 };
    out.uses.push({ href, id, external: !href.startsWith('#'), resolves: !!target, targetTag: target ? target.tagName.toLowerCase() : null, where: where(svg || u), shown: r.width > 0 && r.height > 0 });
  }
  for (const svg of document.querySelectorAll('svg')) {
    if (svg.parentElement && svg.parentElement.closest('svg')) continue;
    const inDefs = (e) => !!e.closest('defs, symbol, clipPath, mask, pattern, marker');
    const symbols = [...svg.querySelectorAll('symbol[id]')].map((s) => ({ id: s.id, paths: [...s.querySelectorAll('path')].map((p) => p.getAttribute('d')).filter(Boolean) }));
    const hasUse = !!svg.querySelector('use');
    const paths = [...svg.querySelectorAll('path')].filter((p) => !inDefs(p)).map((p) => p.getAttribute('d')).filter(Boolean);
    const shapes = [...svg.querySelectorAll('circle, rect, ellipse, line, polyline, polygon')].filter((e) => !inDefs(e)).map((e) => ({ tag: e.tagName.toLowerCase(), attrs: Object.fromEntries([...e.attributes].map((a) => [a.name, a.value])) }));
    const r = svg.getBoundingClientRect();
    out.svgs.push({ symbols, hasUse, paths, shapes, viewBox: svg.getAttribute('viewBox'), w: Math.round(r.width), h: Math.round(r.height), where: where(svg), note: isNote(svg), inComponent: !!svg.closest('.pf-progress, .pf-spin, .pf-skeleton, .pf-slider, .pf-switch, .pf-rate, canvas'), lottie: /__lottie|lottie/.test(svg.innerHTML.slice(0, 2000)) || !!svg.closest('[class*="lottie"]') });
  }
  for (const img of document.querySelectorAll('img[src$=".svg"], img[src^="data:image/svg"]')) out.svgs.push({ image: true, where: where(img), note: isNote(img), symbols: [], paths: [], shapes: [] });
  /* text: every element's own text, where it is, how it paints */
  const UI = 'button, label, th, h1, h2, h3, h4, h5, h6, [role=tab], [role=menuitem], [role=button], .pf-btn, .pf-tabs-tab, .pf-menu-item, .pf-form-item-label, .pf-modal-title, .pf-drawer-title, .pf-popover-title, .pf-tooltip-inner, .pf-empty-description, .pf-select-selection-placeholder, .pf-segmented-item-label, .pf-radio-wrapper, .pf-checkbox-wrapper, .pf-card-head-title, .pf-statistic-title, .pf-tag, .pf-alert-message, .pf-alert-description, .pf-message-notice-content, .pf-notification-notice-message, .pf-result-title, .pf-result-subtitle, .pf-steps-item-title, .navbar-page-title';
  const blockOf = (el) => { for (let e = el; e && e !== document.body; e = e.parentElement) { const d = getComputedStyle(e).display; if (d !== 'inline' && d !== 'contents') return e; } return document.body; };
  const lineCache = new Map();
  const lineOf = (el) => { const b = blockOf(el); if (!lineCache.has(b)) lineCache.set(b, clean(b.textContent).slice(0, 300)); return lineCache.get(b); };
  const byEl = new Map();
  const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (tw.nextNode()) {
    const n = tw.currentNode; const v = clean(n.textContent);
    if (!v) continue;
    const el = n.parentElement;
    if (!el || el.closest('script, style, noscript, template, title, code, pre')) continue;
    if (!byEl.has(el)) byEl.set(el, []);
    byEl.get(el).push(v);
  }
  for (const [el, parts] of byEl) {
    if (!vis(el) || effOpacity(el) < 0.02) continue;
    const s = getComputedStyle(el);
    const text = parts.join(' ');
    out.texts.push({
      text, full: clean(el.textContent).slice(0, 240), parent: clean(el.parentElement ? el.parentElement.textContent : '').slice(0, 240), line: lineOf(el),
      chrome: !!el.closest(UI), data: !!el.closest('[data-pf-data]'), newCopy: !!el.closest('[data-pf-new-copy]'), note: isNote(el), where: where(el), tag: el.tagName.toLowerCase(),
      family: s.fontFamily, weight: s.fontWeight, style: s.fontStyle, italicOk: !!el.closest('.pf-card-packages'), inSvg: !!el.closest('svg'), boldTag: /^(b|strong)$/i.test(el.tagName),
      parentWeight: el.parentElement ? getComputedStyle(el.parentElement).fontWeight : null, arabic: /[؀-ۿ]/.test(text),
    });
  }
  for (const el of document.querySelectorAll('[placeholder], [aria-label], [title], img[alt]')) {
    if (!vis(el) || isNote(el) || el.closest('svg')) continue;
    for (const a of ['placeholder', 'aria-label', 'title', 'alt']) { const v = clean(el.getAttribute(a)); if (v) out.attrs.push({ attr: a, text: v, where: where(el), data: !!el.closest('[data-pf-data]'), newCopy: !!el.closest('[data-pf-new-copy]') }); }
  }
  /* the riyal glyph: does it paint, and is there an amount beside it */
  for (const g of document.querySelectorAll('.currency-Saudi_Riyal_Symbol')) {
    if (getComputedStyle(g).display === 'none' || isNote(g)) continue;
    const b = getComputedStyle(g, '::before');
    let around = '';
    for (let e = g.parentElement, i = 0; e && i < 3 && !/\d/.test(around); e = e.parentElement, i++) around = clean(e.textContent);
    out.glyphs.push({ content: b.content, family: b.fontFamily, amount: /\d/.test(around), around: around.slice(0, 60), where: where(g) });
  }
  /* fonts in the document */
  out.fonts = [...document.fonts].map((f) => ({ family: f.family.replace(/["']/g, ''), status: f.status, weight: f.weight, style: f.style }));
  /* the shell */
  const box = (e) => { if (!e) return null; const r = e.getBoundingClientRect(); const s = getComputedStyle(e); return { x: Math.round(r.x * 10) / 10, y: Math.round(r.y * 10) / 10, w: Math.round(r.width * 10) / 10, h: Math.round(r.height * 10) / 10, right: Math.round(r.right * 10) / 10, shown: vis(e) && +s.opacity > 0, where: where(e) }; };
  const pick = (sels) => { for (const s of sels) { const e = document.querySelector(s); if (e) return e; } return null; };
  const firstPaint = (root) => {
    if (!root) return null;
    let best = null;
    for (const e of root.querySelectorAll('*')) {
      const r = e.getBoundingClientRect();
      if (r.width < 4 || r.height < 4 || r.y > innerHeight || r.right < 0 || r.x > innerWidth) continue;
      const s = getComputedStyle(e);
      if (s.visibility === 'hidden' || s.display === 'none' || effOpacity(e) < 0.02) continue;
      const painted = s.backgroundColor !== 'rgba(0, 0, 0, 0)' || parseFloat(s.borderLeftWidth) > 0 || parseFloat(s.borderTopWidth) > 0 || [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) || /^(svg|img|canvas|video|input|button|select|textarea)$/i.test(e.tagName);
      if (painted && (!best || r.x < best.x - 0.5)) best = { x: Math.round(r.x * 10) / 10, where: where(e) };
    }
    return best;
  };
  const header = pick(['.pf-layout-header', 'header']);
  const rail = pick(['.pf-layout-sider', 'aside', 'nav.pf-sider']);
  const content = pick(['.pf-layout-content', 'main']);
  let labels = rail ? [...rail.querySelectorAll('.pf-menu-item, .pf-menu-submenu-title')].map((e) => clean(e.textContent) || clean(e.getAttribute('title'))).filter(Boolean) : [];
  if (rail && !labels.length) labels = [...rail.querySelectorAll('a, button, li, [role=menuitem]')].filter((e) => !e.querySelector('a, button, li')).map((e) => clean(e.textContent) || clean(e.getAttribute('title') || e.getAttribute('aria-label'))).filter(Boolean);
  const pill = header ? [...header.querySelectorAll('a, button')].find((e) => /go to bayut\.sa/i.test(clean(e.textContent))) : null;
  const meta = document.querySelector('meta[name="viewport"]');
  const padStart = (e) => { if (!e) return null; const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return Math.round((r.x + parseFloat(cs.paddingLeft) + parseFloat(cs.borderLeftWidth)) * 10) / 10; };
  out.shell = {
    headerPad: padStart(header),
    header: box(header), rail: box(rail), content: box(content), headerInset: firstPaint(header), contentInset: firstPaint(content), labels: [...new Set(labels)],
    pill: pill ? { ...box(pill), primary: pill.matches('.pf-btn-primary') } : null,
    viewport: meta ? meta.getAttribute('content') : null, scrollWidth: document.documentElement.scrollWidth, innerWidth,
  };
  /* disabled controls */
  for (const el of document.querySelectorAll('[disabled], [aria-disabled="true"], [class*="disabled"]')) {
    if (isNote(el)) continue;
    const r = el.getBoundingClientRect();
    if (!(r.width > 0 && r.height > 0)) continue;
    const s = getComputedStyle(el);
    const classes = [...el.classList].filter((c) => /disabled/i.test(c));
    out.disabled.push({
      tag: el.tagName.toLowerCase(), attr: el.hasAttribute('disabled'), aria: el.getAttribute('aria-disabled') === 'true', classes,
      antd: classes.some((c) => /^pf-[\w-]+-disabled$/.test(c)) || !!el.closest('.pf-input-outlined, .pf-picker-outlined, .pf-select, .pf-input-number, .pf-checkbox-wrapper, .pf-radio-wrapper, .pf-switch, .pf-slider, .pf-upload, .pf-pagination, .PhoneInput'),
      own: +(+s.opacity).toFixed(3), eff: +effOpacity(el).toFixed(3), inlineOpacity: /(^|;)\s*opacity\s*:/i.test(el.getAttribute('style') || ''),
      dimmedChild: [...el.querySelectorAll('[disabled]')].some((c) => Math.abs(+getComputedStyle(c).opacity - 0.54) < 0.011), where: where(el), text: clean(el.textContent).slice(0, 40),
    });
  }
  for (const el of document.querySelectorAll('button, a, [role=button], .pf-btn, input, select, textarea')) {
    if (el.closest('[disabled], [aria-disabled="true"], [class*="disabled"]') || isNote(el) || !vis(el)) continue;
    const o = +getComputedStyle(el).opacity;
    if (o > 0.05 && o < 0.95) out.looksDisabled.push({ where: where(el), own: +o.toFixed(3), text: clean(el.textContent).slice(0, 40) });
  }
  return out;
};

/* ═══ RENDERING ══════════════════════════════════════════════════════════ */
let browser = null;
const contexts = {};
const ctxFor = async (device) => {
  if (!browser) browser = await chromium.launch();
  if (!contexts[device]) contexts[device] = await browser.newContext(device === 'web' ? DEVICES.web : DEVICES.mobile);
  return contexts[device];
};
const inspect = async (file, device) => {
  debug(`render ${rel(file)} (${device})`);
  const page = await (await ctxFor(device)).newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e.message || e)));
  /* offline and deterministic: only the file and what it embeds */
  await page.route('**/*', (r) => (/^(file|data|about|blob):/.test(r.request().url()) ? r.continue() : r.abort()));
  await page.goto(pathToFileURL(resolve(file)).href, { waitUntil: 'load', timeout: 60000 });
  await Promise.race([page.evaluate(() => document.fonts.ready), new Promise((r) => setTimeout(r, 5000))]);
  await page.waitForTimeout(100);
  debug('  loaded');
  const r = await page.evaluate(INSPECT);
  debug('  inspected');
  await page.close();
  r.errors = errors;
  return r;
};

/* the product, measured: header, rail, offsets, nav — from its compiled pages */
const REF = {};
const reference = async (device) => {
  if (REF[device]) return REF[device];
  const files = device === 'web'
    ? { base: 'dashboard.html', expanded: 'states/dashboard--rail-expanded.html', staff: 'states/dashboard--as-staff.html' }
    : { base: 'mobile/dashboard.html', staff: 'mobile/states/dashboard--as-staff.html' };
  const out = { files, weights: new Set() };
  for (const [k, f] of Object.entries(files)) {
    if (!existsSync(join(D, f))) continue;
    const r = await inspect(join(D, f), device);
    out[k] = r.shell;
    if (k === 'base') for (const t of r.texts) out.weights.add(t.weight);
  }
  REF[device] = out;
  return out;
};

/* ═══ THE CHECKS ═════════════════════════════════════════════════════════ */
const check = (id, title) => ({ id, n: CHECKS.indexOf(id) + 1, title, status: 'pass', summary: '', items: [] });
const item = (c, severity, what, where = '', fix = '') => { c.items.push({ severity, what, where, fix }); if (severity === 'fail') c.status = 'fail'; else if (severity === 'warn' && c.status !== 'fail') c.status = 'warn'; };
const lev = (a, b) => { const m = a.length, n = b.length; if (!m || !n) return m || n; let prev = Array.from({ length: n + 1 }, (_, j) => j); for (let i = 1; i <= m; i++) { const cur = [i]; for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); prev = cur; } return prev[n]; };
const nearestIn = (x, pool) => { let best = null, bd = Infinity; for (const p of pool) { if (Math.abs(p.length - x.length) > 6) continue; const d = lev(x, p); if (d < bd) { bd = d; best = p; } } return best && bd <= Math.max(2, Math.floor(x.length / 3)) ? best : null; };

const checkClasses = (r, ctx) => {
  const c = check('classes', 'every class is the product’s');
  const own = new Set();
  for (const css of ctx.ownCss) for (const x of selectorClasses(css)) own.add(x);
  const sheets = r.sheets.map((h) => basename(decodeURIComponent(h.split('?')[0])));
  const product = sheets.filter((s) => PRODUCT_SHEETS.has(s));
  if (!ctx.compiled && !sheets.some((s) => /^profolio(\.mobile)?\.css$/.test(s))) item(c, 'fail', 'no product stylesheet is linked — every pf- class paints nothing', '', `link deliverables/${ctx.device === 'web' ? 'profolio.css' : 'profolio.mobile.css'}`);
  else if (ctx.device === 'responsive' && sheets.includes('profolio.css') && !sheets.includes('profolio.mobile.css') && !ctx.compiled) item(c, 'warn', 'a 375 design linked to profolio.css — the phone layout’s rules are in profolio.mobile.css');
  const names = Object.keys(r.classes);
  let unknown = 0, domOnly = 0;
  for (const name of names) {
    const u = r.classes[name];
    if (/^ds-/.test(name) || DS_CLASSES.has(name)) {
      if (!DS_CLASSES.has(name)) { unknown++; item(c, 'fail', `.${name} — a ds- class deliverables/ds.css does not define`, u.where[0], 'use a documented ds- class, or none'); }
      continue;
    }
    if (CSS_CLASSES.has(name)) continue;
    if (ctx.compiled && own.has(name)) continue;
    if (render().classes.has(name)) { domOnly++; continue; }
    unknown++;
    const near = nearestIn(name, CSS_CLASSES);
    item(c, 'fail', `.${name} — ${own.has(name) ? 'defined in this file’s own CSS, not in profolio.css: an invented class' : 'not a class the product has'} (used ${u.n}×)`, u.where[0], near ? `nearest product class: .${near}` : 'compose the documented components in deliverables/components/');
  }
  const extra = sheets.filter((s) => !PRODUCT_SHEETS.has(s));
  for (const s of extra) item(c, 'warn', `links ${s}, which is not the product’s — its rules were checked as this file’s own`);
  c.summary = unknown ? `${unknown} of ${names.length} classes are not the product’s` : `${names.length} classes, all the product’s${domOnly ? ` (${domOnly} written by its render with no rule of their own)` : ''}${product.length ? ` · ${product.join(', ')}` : ''}`;
  return c;
};

const checkColours = (r, ctx) => {
  const c = check('colours', 'every colour is a token or the product’s');
  const found = [];
  let verbatim = 0;
  for (const s of r.styles) {
    if (s.note) continue;
    if (!ctx.compiled && render().styles.has(styleKey(s.style))) { verbatim++; continue; }
    for (const x of coloursOfDecls(declsOf(s.style))) found.push({ ...x, where: s.where, from: 'style' });
  }
  for (const css of ctx.ownCss) for (const rule of rulesOf(css)) {
    if (/^(\s*(\.ds-[\w-]+|\[data-pf-note\])[^,]*,?)+$/.test(rule.selector)) continue;          /* the annotations' own chrome */
    for (const x of coloursOfDecls(rule.decls)) found.push({ ...x, where: `<style> ${clip(rule.selector, 50)}`, from: 'css' });
  }
  for (const p of r.paints) if (!p.note && !/^(none|currentcolor|inherit|transparent|url\()/i.test(p.value.trim())) { const col = parseColour(p.value); if (col) found.push({ c: col, text: p.value, prop: p.attr, where: p.where, from: 'svg' }); }
  /* var() names: a --pf- name the product does not define is not a token */
  const refs = [];
  for (const s of r.styles) if (!s.note) for (const m of s.style.matchAll(/var\(\s*(--[\w-]+)/g)) refs.push({ name: m[1], where: s.where });
  if (!ctx.compiled) for (const css of ctx.ownCss) for (const m of css.matchAll(/var\(\s*(--[\w-]+)/g)) refs.push({ name: m[1], where: '<style>' });
  const ownVars = new Set(ctx.ownCss.flatMap((css) => [...varsDefined(css)]));
  for (const ref of uniq(refs.map((x) => x.name))) {
    const at = refs.find((x) => x.name === ref).where;
    if (ref.startsWith('--pf-') && !PRODUCT_VARS.has(ref)) item(c, 'fail', `var(${ref}) — ${ownVars.has(ref) ? 'defined by this file, so an invented token' : 'not a token the product defines'}`, at, 'cite a name from deliverables/tokens.css');
    else if (ref.startsWith('--ds-') && !DS_VARS.has(ref)) item(c, 'warn', `var(${ref}) — not in deliverables/ds.css`, at);
  }
  let token = 0, product = 0, raw = 0;
  const seen = new Map();
  for (const f of found) {
    const k = ckey(f.c);
    const tag = `${k}|${f.where}`;
    if (seen.has(tag)) continue;
    seen.set(tag, true);
    if (f.c[3] === 0) continue;                                                              /* fully transparent paints nothing */
    if (TOKEN_NAMES.has(k)) {
      token++;
      if (!ctx.compiled && f.from !== 'svg') item(c, 'warn', `${f.text} is the token var(${TOKEN_NAMES.get(k)[0]}) written as a literal`, f.where, `write var(${TOKEN_NAMES.get(k)[0]}) — SKILL.md: cite token names, never raw hex`);
      continue;
    }
    if (CSS_COLOURS.has(k) || render().colours.has(k)) { product++; if (VERBOSE) item(c, 'note', `${f.text} — a colour the product paints, with no token name`, f.where); continue; }
    raw++;
    const near = nearestToken(f.c);
    item(c, 'fail', `${f.text} (${hexOf(f.c)}) is neither a token nor a colour the product paints`, f.where, near ? `nearest token: var(${near.names[0]}) ${near.hex} (ΔE ${near.d.toFixed(1)})` : 'use a token from deliverables/tokens.css');
  }
  const literal = c.items.filter((i) => i.severity === 'warn' && /written as a literal/.test(i.what)).length;
  c.summary = raw ? `${raw} raw colour${raw === 1 ? '' : 's'} not in the product` : `${token + product} colours, all the product’s (${token} tokens${literal ? `, ${literal} written as literals` : ''}, ${product} product colours)`;
  if (!raw && !found.length) c.summary = 'no colours of its own — everything from the product’s stylesheet';
  const badVars = c.items.filter((i) => i.severity === 'fail' && /^var\(/.test(i.what)).length;
  if (badVars) c.summary = `${badVars} var() name${badVars === 1 ? '' : 's'} the product does not define · ${c.summary}`;
  if (verbatim) c.summary += ` · ${verbatim} inline style${verbatim === 1 ? '' : 's'} exactly as the product’s render writes ${verbatim === 1 ? 'it' : 'them'}`;
  return c;
};

const checkIcons = (r, ctx) => {
  const c = check('icons', 'every glyph is the product’s');
  let used = 0, inline = 0, drawn = 0;
  for (const u of r.uses) {
    if (!u.href) continue;
    if (/^pf-/.test(u.id) || /sprite\.svg$/i.test(u.href.split('#')[0])) {
      used++;
      if (!SPRITE.has(u.id)) { const near = nearestIn(u.id, SPRITE.keys()); item(c, 'fail', `<use href="${u.href}"> — no #${u.id} in deliverables/sprite.svg`, u.where, near ? `did you mean #${near}? Never draw a missing glyph — name it and ask` : 'name the icon you need and ask; never draw one'); continue; }
      if (!u.external && !u.resolves) item(c, 'fail', `<use href="#${u.id}"> points at nothing — the page does not include the sprite`, u.where, 'paste deliverables/sprite.svg into the page, or reference sprite.svg#' + u.id);
      continue;
    }
    if (u.external) { item(c, 'warn', `<use href="${clip(u.href, 50)}"> — an icon file that is not the product’s sprite`, u.where); continue; }
    if (!u.resolves) item(c, 'fail', `<use href="${u.href}"> points at nothing in the page`, u.where);
  }
  const known = (d) => SPRITE_PATHS.has(normD(d)) || render().paths.has(normD(d));
  for (const s of r.svgs) {
    if (s.note) continue;
    if (s.image) { item(c, ctx.compiled ? 'note' : 'warn', 'an SVG image (<img>) — not checked; the product’s icons are inline or in the sprite', s.where); continue; }
    for (const sym of s.symbols) {
      if (!SPRITE.has(sym.id)) { item(c, 'fail', `<symbol id="${sym.id}"> — a symbol the sprite does not have`, s.where, 'use a symbol from deliverables/sprite.svg'); continue; }
      const mine = sym.paths.map(normD), theirs = pathsIn(SPRITE.get(sym.id));
      if (mine.some((d) => !theirs.includes(d))) item(c, 'warn', `<symbol id="${sym.id}"> differs from the sprite’s`, s.where, 'copy the symbol from deliverables/sprite.svg as it is');
    }
    if (s.hasUse || s.symbols.length || s.lottie || s.inComponent) continue;
    if (!s.paths.length && !s.shapes.length) continue;
    inline++;
    const unknownPaths = s.paths.filter((d) => !known(d));
    const unknownShapes = s.paths.length ? [] : s.shapes.filter((x) => !render().shapes.has(shapeSig(x.tag, x.attrs)));
    if (unknownPaths.length || unknownShapes.length) {
      drawn++;
      const first = unknownPaths[0] ? `d="${clip(unknownPaths[0], 40)}"` : `<${unknownShapes[0].tag}>`;
      item(c, 'warn', `hand-drawn icon? an inline <svg> (${s.viewBox ? `viewBox ${s.viewBox}, ` : ''}${s.w}×${s.h}) whose ${unknownPaths.length ? (unknownPaths.length === s.paths.length ? (s.paths.length === 1 ? 'path matches' : `${s.paths.length} paths match`) : `${unknownPaths.length} of ${s.paths.length} paths match`) : 'shapes match'} no product icon — ${first}`, s.where, 'take the glyph from deliverables/sprite.svg (<svg><use href="#pf-Name"/></svg>); if it is not there, name the one you need and ask');
    }
  }
  c.summary = `${used} sprite reference${used === 1 ? '' : 's'}, ${inline} inline svg${inline === 1 ? '' : 's'}${drawn ? ` — ${drawn} not a product icon` : inline ? ', all product icons' : ''}`;
  return c;
};

const checkCopy = (r, ctx) => {
  const c = check('copy', 'every string is the product’s copy or data');
  const counts = { copy: 0, code: 0, data: 0, declared: 0, new: 0, unmatched: 0 };
  const seen = new Set();
  const judge = (text, t, attr) => {
    const key = `${norm(text)}|${t.where}`;
    if (seen.has(key)) return;
    seen.add(key);
    if (t.data) { counts.declared++; return; }
    let cls = classify(text);
    /* one element's text may be the start of copy the next element finishes */
    if (cls === 'unmatched' && !attr) for (const alt of [t.full, t.parent]) if (alt && alt !== text && alt.length <= 200 && ['copy', 'code'].includes(classify(alt))) { cls = 'copy'; break; }
    if (cls !== 'unmatched') { counts[cls]++; return; }
    if (t.newCopy) { counts.new++; item(c, 'warn', `new copy (declared): “${clip(text, 80)}”`, t.where, 'confirm it with the product agent, English and Arabic, before it ships'); return; }
    counts.unmatched++;
    /* aria-label, title and alt are read, not seen — a library sets many of
       them ("segmented control"); only a placeholder is on screen */
    if (attr && attr !== 'placeholder') { item(c, ctx.compiled ? 'note' : 'warn', `“${clip(text, 80)}” (${attr}) — not the product’s copy`, t.where, ctx.compiled ? '' : 'use the product’s words for it, or leave the library’s default'); return; }
    const soft = !t.chrome && !attr && nameLike(text);
    item(c, soft ? 'warn' : 'fail', `“${clip(text, 80)}”${attr ? ` (${attr})` : ''} — ${soft ? 'not the product’s copy; if it is data (a name), mark it data-pf-data' : t.chrome || attr ? 'a UI string the product does not ship' : 'not the product’s copy'}`, t.where, soft ? '' : 'use the words in kb/product/copy/<area>.html; if none fits, mark it data-pf-new-copy and ask');
  };
  for (const t of r.texts) if (!t.note) judge(t.text, t, null);
  for (const a of r.attrs) judge(a.text, a, a.attr);
  const total = counts.copy + counts.code + counts.data + counts.declared + counts.new + counts.unmatched;
  const bad = c.items.filter((i) => i.severity === 'fail' || i.severity === 'warn').length;
  c.summary = counts.unmatched && bad ? `${counts.unmatched} of ${total} strings are not the product’s copy${c.status !== 'fail' ? ' (attributes or name-like data)' : ''}` : `${total} strings: ${counts.copy} copy, ${counts.code} from the code, ${counts.data + counts.declared} data${counts.new ? `, ${counts.new} new (declared)` : ''}`;
  if (!total) c.summary = 'no text';
  return c;
};

const checkCurrency = (r, ctx) => {
  const c = check('currency', 'amounts carry the riyal glyph; area is Sq. M.');
  const SAR_AMOUNT = /(?:\bSAR\b|\bSR\b|ر\.?\s?س\.?|ريال|﷼|⃁)\s*[\d٠-٩][\d٠-٩,.]*|[\d٠-٩][\d٠-٩,.]*\s*(?:\bSAR\b|\bSR\b|ر\.?\s?س|ريال|﷼|⃁)/;
  const SAR_WORD = /\bSAR\b|ر\.س/;
  const OTHER = /(?:\$|US\$|€|£|\bUSD\b|\bAED\b|\bEUR\b|\bGBP\b|\bPKR\b|\bRs\.?|\bQAR\b|\bOMR\b|\bBHD\b|\bJOD\b|\bEGP\b|\bKWD\b)\s?\d[\d,.]*|\d[\d,.]*\s?(?:\bUSD\b|\bAED\b|\bEUR\b|\bGBP\b|\bPKR\b|\bQAR\b|\bOMR\b|\bBHD\b|\bJOD\b|\bEGP\b|\bKWD\b)/;
  const AREA = /\d[\d,.]*\s*(sq\.?\s*(?:ft|feet|m|mt|meters?|metres?)\.?|sqft|sqm|square\s*(?:feet|foot|meters?|metres?)|m²|m2\b|متر\s?مربع)/gi;
  const lines = new Map();
  for (const t of r.texts) if (!t.note && !lines.has(t.line)) lines.set(t.line, t.where);
  let amounts = 0;
  /* one report per amount, however many nested lines contain it */
  const reported = new Set();
  const once = (m, line) => { const at = line.indexOf(m); const k = `${m}|${line.slice(Math.max(0, at - 24), at + m.length + 24)}`; if (reported.has(k)) return false; reported.add(k); return true; };
  for (const [line0, where] of lines) {
    const allowed = norm(line0).includes(ALLOWED_SAR);
    const line = allowed ? line0.replace(/Get one through Bayut, starting from SAR 250\.?/i, '') : line0;
    const m = line.match(SAR_AMOUNT);
    const sev = ctx.compiled ? 'note' : 'fail';                                           /* the product's own render: recorded, not failed */
    if (m && once(m[0], line)) item(c, sev, `“${clip(m[0], 30)}” — an amount written with ${/[٠-٩ر]/.test(m[0]) ? 'ر.س' : /﷼|⃁/.test(m[0]) ? 'a riyal character' : 'SAR'}, in “${clip(line, 70)}”`, where, 'draw the amount as the product does: <span class="currency-Saudi_Riyal_Symbol"></span> 1,200 (the Number component, deliverables/components/number.html)');
    else if (SAR_WORD.test(line)) item(c, 'warn', `“SAR” in “${clip(line, 70)}” — the product writes currency as the riyal glyph; its one literal SAR is “Get one through Bayut, starting from SAR 250.”`, where);
    if (/﷼|⃁/.test(line) && !m) item(c, sev, `a riyal character in “${clip(line, 60)}” — the product draws the icomoon glyph, not the character`, where, 'use <span class="currency-Saudi_Riyal_Symbol"></span>');
    const o = line.match(OTHER);
    if (o && once(o[0], line)) item(c, sev, `“${clip(o[0], 20)}” — another market’s currency in “${clip(line, 60)}”`, where, 'Profolio KSA prices are in riyals: the glyph, then the amount');
    for (const a of line.matchAll(AREA)) { amounts++; if (a[1] !== 'Sq. M.' && once(a[0], line)) item(c, sev, `“${a[0]}” — area renders “Sq. M.”`, where, `write ${a[0].replace(a[1], 'Sq. M.')}`); }
  }
  for (const g of r.glyphs) {
    amounts++;
    if (!g.content || g.content === 'none' || g.content === 'normal' || !/icomoon/i.test(g.family)) item(c, 'fail', 'the riyal glyph paints nothing here — its ::before comes from profolio.css (the icomoon face)', g.where, 'link deliverables/profolio.css');
    else if (!g.amount) item(c, ctx.compiled || /\(\s*\)/.test(g.around) ? 'note' : 'warn', `a riyal glyph with no amount beside it (“${clip(g.around, 40)}”)${/\(\s*\)/.test(g.around) ? ' — a unit label, as the product writes “Price of Property (﷼)”' : ''}`, g.where);
  }
  const productNotes = c.items.filter((i) => i.severity === 'note' && /written with|area renders|currency in|riyal character/.test(i.what)).length;
  c.summary = c.items.some((i) => i.severity === 'fail') ? `${c.items.filter((i) => i.severity === 'fail').length} amount${c.items.filter((i) => i.severity === 'fail').length === 1 ? '' : 's'} or unit${c.items.filter((i) => i.severity === 'fail').length === 1 ? '' : 's'} written the wrong way` : r.glyphs.length || amounts ? `${r.glyphs.length} riyal glyph${r.glyphs.length === 1 ? '' : 's'}${amounts - r.glyphs.length ? `, ${amounts - r.glyphs.length} area${amounts - r.glyphs.length === 1 ? '' : 's'} in Sq. M.` : ''}` : 'no amounts';
  if (productNotes) c.summary += ` · the product’s own render writes ${productNotes} amount${productNotes === 1 ? '' : 's'} or unit${productNotes === 1 ? '' : 's'} another way (--verbose)`;
  return c;
};

const checkShell = async (r, ctx) => {
  const c = check('shell', 'the shell is the product’s, measured');
  const s = r.shell;
  if (!s.header && !s.rail) { c.status = 'skip'; c.summary = 'no shell in this design (a component or a fragment) — nothing to measure'; return c; }
  const ref = await reference(ctx.device);
  const base = ref.base;
  if (!base) { item(c, 'warn', `the reference page deliverables/${ref.files.base} is missing — nothing to measure against`); c.summary = 'no reference'; return c; }
  const near = (a, b, tol = 1) => a != null && b != null && Math.abs(a - b) <= tol;
  const px = (v) => `${Math.round(v * 10) / 10}px`;
  const notes = [];
  if (!s.header) item(c, 'fail', 'a rail without the header — the shell is the header, the rail and the content together', '', 'start from a compiled page (deliverables/<page>.html), not a blank canvas');
  if (!s.rail && ctx.device === 'web') item(c, 'fail', 'a header without the rail', '', 'start from a compiled page (deliverables/<page>.html)');
  if (s.header && !near(s.header.h, base.header.h)) item(c, 'fail', `header ${px(s.header.h)} high — the product’s is ${px(base.header.h)}`, s.header.where, `min-height and max-height ${px(base.header.h)}, as withAdminLayout.js renderHeader() sets inline`);
  if (SHELL_DOC.header && base.header && SHELL_DOC.header !== Math.round(base.header.h)) notes.push(`kb/pages/_shell.html says the header is ${SHELL_DOC.header}px; the product paints ${px(base.header.h)} (deliverables/${ref.files.base}) — the render wins`);
  if (ctx.device === 'web') {
    const collapsed = base.rail ? base.rail.w : null, expanded = ref.expanded && ref.expanded.rail ? ref.expanded.rail.w : null;
    if (s.rail) {
      const isCollapsed = near(s.rail.w, collapsed), isExpanded = near(s.rail.w, expanded);
      if (!isCollapsed && !isExpanded) item(c, 'fail', `rail ${px(s.rail.w)} wide — the product’s is ${px(collapsed)} collapsed (how it ships) or ${expanded ? px(expanded) : '220px'} expanded (on hover)`, s.rail.where, `${px(collapsed)}: withAdminLayout.js opens collapsed`);
      else if (isExpanded) notes.push(`the rail is expanded (${px(s.rail.w)}) — the product ships it collapsed at ${px(collapsed)}; expanded is its hover state`);
      const railW = isExpanded ? expanded : collapsed;
      const refBase = isExpanded && ref.expanded ? ref.expanded : base;
      /* the product pads its header by rail + 25 (renderHeader); a page with no
         title paints its first thing far to the right, so the padding is the measure */
      const want = refBase.headerPad != null ? refBase.headerPad : refBase.headerInset && refBase.headerInset.x;
      const okPad = near(s.headerPad, want, 2), okPaint = s.headerInset && near(s.headerInset.x, want, 2);
      if (want != null && !okPad && !okPaint) item(c, 'fail', `the header’s content starts at ${px(s.headerInset ? Math.min(s.headerInset.x, s.headerPad ?? Infinity) : s.headerPad)} — the product’s at ${px(want)} (rail + ${px(want - railW)})`, s.headerInset ? s.headerInset.where : s.header.where, `padding-inline-start ${px(want)} on the header`);
      if (s.content && refBase.content && !near(s.content.x, refBase.content.x, 1)) item(c, 'fail', `the content area starts at ${px(s.content.x)} — the product’s at ${px(refBase.content.x)}, beside the rail`, s.content.where);
      if (s.contentInset && refBase.contentInset && !near(s.contentInset.x, refBase.contentInset.x, 2)) item(c, 'note', `the page’s first content paints at ${px(s.contentInset.x)}; on the dashboard it is ${px(refBase.contentInset.x)} (content + ${px(refBase.contentInset.x - refBase.content.x)} padding) — pages differ, so compare with the page you started from`, s.contentInset.where);
    }
    if (SHELL_DOC.collapsed && collapsed && SHELL_DOC.collapsed !== Math.round(collapsed)) notes.push(`kb/pages/_shell.html says the collapsed rail is ${SHELL_DOC.collapsed}px; the product paints ${px(collapsed)}`);
    /* the classified pill */
    if (s.header && base.pill) {
      if (!s.pill) item(c, 'warn', `no classified pill (“Go to Bayut.sa”) in the header — the product has one, ${px(base.pill.w)} wide`, s.header.where);
      else if (s.pill.primary) item(c, 'fail', 'the classified pill is a solid primary button — it is a bordered link', s.pill.where);
      else if (s.pill.w < base.pill.w - 2) item(c, 'warn', `the classified pill is ${px(s.pill.w)} wide — the product’s is ${px(base.pill.w)} (min-width 148.71px)`, s.pill.where);
    }
  } else if (s.rail) {
    const shown = s.rail.shown && s.rail.right > 0 && s.rail.x < r.shell.innerWidth;
    if (shown) item(c, 'fail', `the rail is on screen at 375 (${px(s.rail.x)}–${px(s.rail.right)}) — on the phone it is a drawer behind the menu button`, s.rail.where, 'start from deliverables/mobile/<page>.html');
    if (s.content && base.content && !near(s.content.x, base.content.x, 1)) item(c, 'fail', `the content starts at ${px(s.content.x)} — the phone’s at ${px(base.content.x)}`, s.content.where);
  }
  /* the nav: these labels, in this order */
  if (s.labels.length) {
    const product = uniq([...(base.labels || []), ...(ref.staff ? ref.staff.labels : []), ...(ref.expanded ? ref.expanded.labels : []), ...NAV_DOC]);
    const order = uniq([...NAV_DOC, ...(base.labels || [])]);
    for (const l of s.labels) {
      if (product.includes(l)) continue;
      const alias = NAV_ALIASES[l.toLowerCase()];
      const contains = product.find((p) => p.toLowerCase().includes(l.toLowerCase()) || l.toLowerCase().includes(p.toLowerCase()));
      item(c, 'fail', `rail label “${l}” is not the product’s${/^licen[cs]es?$/i.test(l) ? ' — there is no top-level Licenses' : ''}`, s.rail ? s.rail.where : '', alias || contains ? `the product says “${alias || contains}”` : `the product’s labels: ${(base.labels || []).join(', ')}`);
    }
    const idx = s.labels.filter((l) => order.includes(l)).map((l) => order.indexOf(l));
    if (idx.some((v, i) => i && v < idx[i - 1])) item(c, 'fail', `the rail’s order differs from the product’s (${s.labels.join(' · ')})`, s.rail ? s.rail.where : '', `in order: ${(base.labels || []).join(' · ')}`);
    const owner = base.labels || [], staff = ref.staff ? ref.staff.labels : [];
    const same = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
    const top = s.labels.filter((l) => owner.includes(l) || staff.includes(l));
    if (owner.length && !same(top, owner) && !same(top, staff)) {
      const missing = owner.filter((l) => !s.labels.includes(l));
      if (missing.length) item(c, 'warn', `the rail lacks ${missing.map((m) => `“${m}”`).join(', ')} — the owner’s rail has ${owner.length} items${staff.length ? `, the staff user’s ${staff.length} (no Agency Staff)` : ''}`, s.rail ? s.rail.where : '');
    } else if (same(top, staff) && staff.length) notes.push(`the rail is the agency staff user’s (${staff.length} items, no Agency Staff)`);
  }
  for (const n of notes) item(c, 'note', n);
  const fails = c.items.filter((i) => i.severity === 'fail').length;
  c.summary = fails ? `${fails} measurement${fails === 1 ? '' : 's'} or label${fails === 1 ? '' : 's'} off the product` : `header ${px(s.header ? s.header.h : 0)}${ctx.device === 'web' && s.rail ? `, rail ${px(s.rail.w)}, content from ${px(s.content ? s.content.x : 0)}` : ', rail off-canvas'}${s.labels.length ? `, ${s.labels.length} rail labels` : ''} — as the product (measured on deliverables/${ref.files.base})`;
  return c;
};

const checkType = async (r, ctx) => {
  const c = check('type', 'Figtree, the product’s weights, upright');
  const ref = await reference(ctx.device);
  const weights = new Set([...CSS_WEIGHTS, ...ref.weights]);
  const figtree = r.fonts.filter((f) => /^figtree$/i.test(f.family));
  const texts = r.texts.filter((t) => !t.note && !t.inSvg);                                 /* text in an SVG is a graphic (the logo lockup) */
  const asksFigtree = texts.some((t) => /^["']?figtree/i.test(t.family.trim()));
  if (texts.length && !figtree.some((f) => f.status === 'loaded')) item(c, 'fail', !figtree.length ? 'Figtree is not in this page — its @font-face is in profolio.css' : asksFigtree ? 'Figtree is declared but did not load' : 'Figtree is available (profolio.css) but no text on the page asks for it', '', figtree.length ? 'set type with the product’s components — font-family: var(--pf-font-family)' : 'link deliverables/profolio.css');
  const byFamily = new Map();
  let wrongWeight = 0, italic = 0;
  for (const t of texts) {
    const first = t.family.split(',')[0].replace(/["']/g, '').trim();
    if (!/^figtree$/i.test(first) && !(t.arabic && /droid arabic kufi/i.test(first)) && !/^icomoon$/i.test(first)) {
      if (!byFamily.has(first)) byFamily.set(first, []);
      byFamily.get(first).push(t);
    }
    if (!weights.has(String(t.weight)) && !(t.boldTag && weights.has(String(t.parentWeight)))) { wrongWeight++; if (wrongWeight <= 6) item(c, ctx.compiled ? 'note' : 'fail', `weight ${t.weight} on “${clip(t.text, 40)}” — the product paints ${[...weights].sort().join(', ')}`, t.where); }
    if (/italic|oblique/.test(t.style) && !t.italicOk) { italic++; if (italic <= 4) item(c, ctx.compiled ? 'note' : 'warn', `italic “${clip(t.text, 40)}” — Figtree is upright; the product sets italic only on the package card (its “Save n%” tag and price line)`, t.where); }
  }
  /* Lato and Inter are the product's own, in places (the lite experience, a
     chart); anything else — the browser's default sans-serif included — is
     text the product's type never reached */
  const PRODUCT_ELSEWHERE = /^(lato|inter)$/i;
  for (const [fam, list] of byFamily) {
    const known = PRODUCT_ELSEWHERE.test(fam);
    const generic = /^(sans-serif|serif|system-ui|-apple-system|blinkmacsystemfont|monospace|times new roman|times)$/i.test(fam);
    const sev = ctx.compiled ? 'note' : known ? 'warn' : 'fail';
    item(c, sev, `${list.length} text element${list.length === 1 ? '' : 's'} in ${fam}${known ? ' — the product paints it only outside the Profolio chrome' : generic ? ' — the browser’s default: the product’s type never reached it' : ' — a family the product never uses'}, e.g. “${clip(list[0].text, 40)}”`, list[0].where, 'the product’s stack is Figtree, Droid Arabic Kufi — it comes with profolio.css on the product’s components (font-family: var(--pf-font-family))');
  }
  if (wrongWeight > 6) item(c, ctx.compiled ? 'note' : 'fail', `… ${wrongWeight - 6} more elements at a weight the product does not paint`);
  c.summary = c.status === 'pass' ? `${texts.length} text elements in Figtree${figtree.length ? ' (loaded)' : ''}, weights ${uniq(texts.map((t) => t.weight)).sort().join('/') || '—'}` : `${wrongWeight ? `${wrongWeight} off-scale weight${wrongWeight === 1 ? '' : 's'}` : ''}${byFamily.size ? `${wrongWeight ? '; ' : ''}${[...byFamily.keys()].join(', ')} beside Figtree` : ''}${italic ? `${wrongWeight || byFamily.size ? '; ' : ''}${italic} italic` : ''}` || 'Figtree missing';
  return c;
};

const checkResponsive = (r, ctx) => {
  const c = check('responsive', 'web and 375, both designed');
  if (ctx.device === 'responsive') {
    const vp = r.shell.viewport || '';
    if (!/width=device-width/.test(vp)) item(c, 'warn', 'no <meta name="viewport" content="width=device-width…"> — a phone lays this out at 980px', '', 'copy the product’s: width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0');
    else if (!/maximum-scale=1(\.0)?/.test(vp) || !/user-scalable=(0|no)/.test(vp)) item(c, 'note', 'the viewport meta is not the product’s (maximum-scale=1.0, user-scalable=0) — a phone may widen the layout viewport to an overflow');
    if (r.shell.scrollWidth > r.shell.innerWidth + 1) item(c, ctx.compiled ? 'note' : 'warn', `the layout is ${r.shell.scrollWidth}px wide — ${r.shell.scrollWidth - r.shell.innerWidth}px wider than the phone${ctx.compiled ? ' (the product overflows here too — deliverables/design-qa.html)' : ''}`);
    c.summary = ctx.isPair ? `the 375 pair of ${ctx.pairOf}` : 'the 375 layout — lint its web design with --pair to hold both';
    return c;
  }
  if (!ctx.pair) { item(c, ctx.compiled ? 'note' : 'warn', 'no responsive counterpart — the design system is web at 1440 AND responsive at 375', '', 'design the 375 layout and pass it: --pair <design-375.html> (or name it <name>-375.html beside this one)'); c.summary = 'web only'; return c; }
  c.summary = `paired with ${rel(ctx.pair)}${ctx.pairFound ? ' (found beside it)' : ''} — linted below`;
  return c;
};

const checkDisabled = (r, ctx) => {
  const c = check('disabled', 'a disabled control is dimmed to 0.54');
  const DIM = 0.54;
  const is = (v, x) => Math.abs(v - x) < 0.011;
  let ok = 0;
  for (const d of r.disabled) {
    if (d.eff < 0.05) continue;                                                             /* an invisible overlay, not a control on screen */
    const label = `${d.tag}${d.classes.length ? `.${d.classes[0]}` : ''}${d.text ? ` “${clip(d.text, 30)}”` : ''}`;
    if (d.attr) {
      if (is(d.own, DIM)) { ok++; continue; }
      if (is(d.own, 1) && d.antd && !d.inlineOpacity) { ok++; continue; }                     /* antd paints its own disabled look */
      if (is(d.own, 1) && d.inlineOpacity) { item(c, 'fail', `${label} is disabled, and an inline opacity undoes the product’s dimming`, d.where, `remove the opacity — [disabled] is ${DIM} (utils.less:142)`); continue; }
      if (is(d.own, 1)) { item(c, 'warn', `${label} is disabled but not dimmed — check a product rule, not this design, undoes the ${DIM}`, d.where); continue; }
      item(c, 'fail', `${label} is disabled and dimmed to ${d.own} — the product dims to ${DIM}`, d.where, `let [disabled] do it: opacity ${DIM} (utils.less:142, global)`);
      continue;
    }
    if (d.antd || d.dimmedChild || is(d.own, DIM) || is(d.eff, DIM)) { ok++; continue; }
    item(c, 'fail', `${label} is marked disabled (${d.aria ? 'aria-disabled' : d.classes.join(' ')}) but painted at opacity ${d.own}`, d.where, `give it the disabled attribute — the product dims [disabled] to ${DIM} (utils.less:142)`);
  }
  for (const l of r.looksDisabled) item(c, ctx.compiled ? 'note' : 'warn', `a control at opacity ${l.own} that is not marked disabled${l.text ? ` (“${clip(l.text, 30)}”)` : ''}`, l.where, `if it is disabled, say so with the disabled attribute — it dims to ${DIM}`);
  c.summary = r.disabled.length ? `${r.disabled.length} disabled control${r.disabled.length === 1 ? '' : 's'}${ok === r.disabled.length ? ', dimmed as the product dims' : `, ${r.disabled.length - ok} not dimmed as the product dims`}` : 'no disabled controls';
  return c;
};

/* ═══ ONE FILE ═══════════════════════════════════════════════════════════ */
let KB_PAIRS = null;
const kbPair = (file) => {
  if (!KB_PAIRS) {
    KB_PAIRS = new Map();
    const kb = (() => { try { return JSON.parse(read(join(ROOT, 'data', 'design-kb.json'))); } catch { return null; } })();
    if (kb) for (const sc of kb.screens) for (const x of [{ files: sc.files }, ...sc.states]) if (x.files.web && x.files.responsive) KB_PAIRS.set(resolve(ROOT, x.files.web), resolve(ROOT, x.files.responsive));
  }
  return KB_PAIRS.get(resolve(file)) || null;
};
const findPair = (file) => {
  const dir = dirname(resolve(file)), base = basename(file, '.html');
  const known = kbPair(file);
  if (known && existsSync(known)) return known;
  return [join(dir, `${base}-375.html`), join(dir, `${base}.375.html`), join(dir, `${base}--mobile.html`), join(dir, `${base}.mobile.html`), join(dir, 'mobile', `${base}.html`), join(dir, '..', 'mobile', basename(dir), `${base}.html`)]
    .find((p) => existsSync(p) && resolve(p) !== resolve(file)) || null;
};
const deviceOf = (file, html) => (/<meta name="pf-device" content="mobile"/.test(html.slice(0, 12000)) || /(^|\/)mobile\//.test(resolve(file)) || /href="[^"]*profolio\.mobile\.css"/.test(html.slice(0, 20000)) || /[-.]375\.html$|[-.]mobile\.html$/.test(file) ? 'responsive' : 'web');

const lintFile = async (file, { device, isPair = false, pairOf = null } = {}) => {
  const html = readFileSync(file, 'utf8');
  const dev = device || deviceOf(file, html);
  const compiled = isCompiledHtml(html);
  const r = await inspect(file, dev);
  /* this file's own CSS: its <style> blocks and any stylesheet it links that is not the product's */
  const ownCss = [...r.styleBlocks];
  for (const h of r.sheets) {
    if (!h.startsWith('file:')) continue;
    const p = fileURLToPath(h.split('?')[0]);
    if (!PRODUCT_SHEETS.has(basename(p)) && existsSync(p)) ownCss.push(readFileSync(p, 'utf8'));
  }
  let pair = null, pairFound = false;
  if (dev === 'web' && !isPair) { pair = PAIR || findPair(file); pairFound = !PAIR && !!pair; }
  const ctx = { device: dev, compiled, ownCss, pair, pairFound, isPair, pairOf };
  const want = (id) => !ONLY || ONLY.has(id);
  const checks = [];
  for (const id of CHECKS) {
    if (!want(id)) { checks.push({ ...check(id, ''), status: 'skip', summary: 'not run (--only)' }); continue; }
    const fn = { classes: checkClasses, colours: checkColours, icons: checkIcons, copy: checkCopy, currency: checkCurrency, shell: checkShell, type: checkType, responsive: checkResponsive, disabled: checkDisabled }[id];
    checks.push(await fn(r, ctx));
    debug(`  check ${id}`);
  }
  const rep = {
    file: rel(file), device: dev, compiled, checks,
    fails: checks.filter((c) => c.status === 'fail').length, warns: checks.filter((c) => c.status === 'warn').length,
    passes: checks.filter((c) => c.status === 'pass').length, skips: checks.filter((c) => c.status === 'skip').length,
    scriptErrors: r.errors,
  };
  if (pair && want('responsive')) rep.pair = await lintFile(pair, { device: 'responsive', isPair: true, pairOf: rel(file) });
  return rep;
};

/* ═══ REPORT ═════════════════════════════════════════════════════════════ */
const MARK = { pass: '✓', warn: '!', fail: '✗', skip: '·', note: '·' };
const print = (rep, indent = '') => {
  console.log(`\n${indent}design-lint · ${rep.file} · ${rep.device === 'web' ? 'web 1440' : 'responsive 375'}${rep.compiled ? ' · compiled from the product' : ''}`);
  for (const c of rep.checks) {
    console.log(`${indent}  ${MARK[c.status]} ${c.n} ${c.id.padEnd(10)} ${c.summary}`);
    const items = c.items.filter((i) => VERBOSE || i.severity !== 'note');
    const cap = VERBOSE ? 500 : 6;
    for (const it of items.slice(0, cap)) {
      console.log(`${indent}      ${MARK[it.severity]} ${it.what}`);
      if (it.where) console.log(`${indent}          at ${it.where}`);
      if (it.fix) console.log(`${indent}          → ${it.fix}`);
    }
    if (items.length > cap) console.log(`${indent}      … ${items.length - cap} more (--verbose)`);
  }
  if (rep.scriptErrors && rep.scriptErrors.length) console.log(`${indent}  (the page threw: ${clip(rep.scriptErrors[0], 100)})`);
  console.log(`${indent}  → ${rep.fails} fail · ${rep.warns} warn · ${rep.passes} pass${rep.skips ? ` · ${rep.skips} skipped` : ''}`);
  if (rep.pair) print(rep.pair, `${indent}  `);
};

const reports = [];
try {
  for (const f of FILES) reports.push(await lintFile(f, { device: DEVICE_OPT }));
} finally {
  if (browser) await browser.close();
}
const failing = (rep) => rep.fails > 0 || (rep.pair ? failing(rep.pair) : false);
if (JSON_OUT) console.log(JSON.stringify(reports.length === 1 ? reports[0] : reports, null, 1));
else {
  for (const rep of reports) print(rep);
  if (reports.length > 1) console.log(`\n${reports.filter((x) => !failing(x)).length} of ${reports.length} files pass (no check failed)`);
}
process.exit(reports.some(failing) ? 1 : 0);
