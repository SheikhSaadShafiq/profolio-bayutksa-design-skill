#!/usr/bin/env node
/**
 * The Profolio 2.0 look, applied to the compiled design system: every teal becomes its 2.0 green,
 * every grey the 2.0 grey of its lightness, and English text Geist (ticket z8v0kmv11c; the skill
 * draws the 2.0 look only, from v2.6). Run from the repo:
 *
 *   node scripts/look/apply.mjs            convert skill/ in place (pages, states, components, css)
 *   node scripts/look/apply.mjs --check    count what would change, write nothing; exit 1 if any
 *
 * The colours come from data/look/map.json (the ticket's colour map: scripts/look/map.mjs). A
 * colour only the render has (antd's computed shades, an svg's own) is mapped by the same rules
 * the colour map uses: a teal → brand green as the primary, pressed green when darker, else the
 * 2.0 green of the same share of colour over white; a grey → the 2.0 grey of its lightness.
 *
 * By role, from where the colour sits:
 *  - text: `color` and its kin, and a custom property named for text → the map's text value;
 *  - fill: backgrounds, borders, outlines, an icon's CSS fill or stroke → the map's fill value;
 *  - art: an svg's fill, stroke or stop-color attribute → teal only: other illustration colours
 *    stay, as the ticket says; shadows likewise keep all but teal;
 *  - blue, red, amber, purple, pink, and black or white washes: unchanged (out of scope).
 * A text declaration that reads a custom property holding a teal or a grey (`color:
 * var(--pf-primary)`) takes that colour's text value, since one property cannot hold both.
 *
 * Fonts: Figtree, Lato, Inter and the shell's copies ("PF Shell Figtree", "PF Shell Lato") →
 * Geist, everywhere; Droid Arabic Kufi stays.
 *
 * The 2.0 My Listings pages (they link css/new-theme/tokens.css) are already the 2.0 look,
 * designed: only their embedded product shell ([data-pf-shell]) changes colour there, and every
 * font goes to Geist.
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import chroma from 'chroma-js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SKILL = join(ROOT, 'skill');
const CHECK = process.argv.includes('--check');
const M = JSON.parse(readFileSync(join(ROOT, 'data', 'look', 'map.json'), 'utf8'));
const OLD = M.primary.old, BRAND = M.primary.brand, PRESSED = M.primary.pressed;

/* ── colours ─────────────────────────────────────────────────────────────── */
const lch = (v) => chroma(v).lch();
const dE = (a, b) => chroma.deltaE(a, b);
function family(v) {
  const [L, C, H] = lch(v);
  if (C < 1.5 || Number.isNaN(H)) return 'neutral';
  if (H >= 168 && H < 232 && C >= (L > 85 ? 1.5 : 4)) return 'teal';
  if (C < (L > 85 ? 2.5 : 8)) return 'neutral';
  if (C < 22 && H >= 255 && H < 300) return 'neutral';
  if (C < 22 && H >= 232 && H < 255 && L <= 85) return 'neutral';
  if (H >= 110 && H < 168) return 'green';
  return 'other';
}
const byL = (v) => (t) => Math.abs(lch(v)[0] - lch(t)[0]) + 0.1 * dE(v, t);
const nearest = (pool, score) => pool.reduce((b, t) => (score(t) < score(b) ? t : b));
function tealFill(v) {
  if (dE(v, OLD) <= 2) return BRAND;
  if (lch(v)[0] < lch(OLD)[0] - 1) return PRESSED;
  let tBest = 0, rBest = Infinity;
  for (let t = 0; t <= 1.0001; t += 0.0025) { const e = dE(chroma.mix('#fff', OLD, t, 'rgb'), v); if (e < rBest) { rBest = e; tBest = t; } }
  if (rBest > 6) return nearest(M.greens, byL(v));
  const want = chroma.mix('#fff', BRAND, tBest, 'rgb').hex();
  return nearest(M.greens, (t) => dE(want, t));
}
function greyFor(v, role) {
  const L = lch(v)[0];
  if (role === 'text') return nearest(M.textGreys.filter((t) => t !== '#ffffff' || L >= 90), byL(v));
  let pool = M.fillGreys.filter((t) => t !== '#ffffff' || L >= 97);
  return L > 85 ? nearest(pool, (t) => dE(v, t)) : nearest(pool, byL(v));
}
const memo = new Map();
/** a solid colour (#rrggbb) in a role → its 2.0 colour (#rrggbb) */
function mapHex(hex, role) {
  const k = hex + role;
  if (memo.has(k)) return memo.get(k);
  memo.set(k, decide(hex, role));
  return memo.get(k);
}
function decide(hex, role) {
  if (hex === '#ffffff' || hex === '#000000') return hex;
  const known = M.colours[hex];
  const fam = known ? known.family : family(hex);
  if (role === 'art' || role === 'shadow') return fam === 'teal' ? (known && known.fill) || tealFill(hex) : hex;
  const readable = chroma.contrast(hex, '#fff') >= 2;
  if (known) {
    if (known.keep && role !== 'text') return hex;                       /* an illustration's colour */
    if (role === 'text') return known.text || (fam === 'teal' ? (readable ? PRESSED : known.fill || tealFill(hex)) : fam === 'neutral' ? greyFor(hex, 'text') : hex);
    return known.fill || (fam === 'teal' ? tealFill(hex) : fam === 'neutral' ? greyFor(hex, 'fill') : hex);
  }
  if (fam === 'teal') return role === 'text' && readable ? PRESSED : tealFill(hex);
  if (fam === 'neutral') return greyFor(hex, role);
  return hex;                                                            /* a green the map lacks, and out of scope */
}
/* every way a colour is written: #rgb, #rrggbb, #rrggbbaa, rgb()/rgba() with commas or spaces; %23rrggbb in a data URI */
const COLOUR = /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3})(?![0-9a-zA-Z_-])|\brgba?\(\s*\d{1,3}\s*[, ]\s*\d{1,3}\s*[, ]\s*\d{1,3}\s*(?:[,/]\s*[\d.]+%?\s*)?\)/g;
let changed = 0;
function recolour(text, role) {
  text = text.replace(/%23([0-9a-fA-F]{6})(?![0-9a-zA-Z])/g, (lit, h) => {   /* an svg inside a data URI: its art */
    const t = mapHex('#' + h.toLowerCase(), 'art');
    if (t === '#' + h.toLowerCase()) return lit;
    changed++;
    return '%23' + (h === h.toUpperCase() ? t.slice(1).toUpperCase() : t.slice(1));
  });
  return text.replace(COLOUR, (lit) => {
    let r, g, b, a = null, form;
    if (lit[0] === '#') {
      let h = lit.slice(1);
      if (h.length === 3) h = h.split('').map((x) => x + x).join('');
      if (h.length === 8) a = parseInt(h.slice(6), 16) / 255;
      [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
      form = 'hex';
    } else {
      const n = lit.match(/[\d.]+%?/g);
      [r, g, b] = n.slice(0, 3).map(Number);
      if (n[3] != null) a = n[3].endsWith('%') ? parseFloat(n[3]) / 100 : +n[3];
      form = 'rgb';
    }
    if ([r, g, b].some((x) => x > 255)) return lit;
    const base = '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('');
    const alpha = a != null && a < 1;
    if (alpha && (base === '#000000' || base === '#ffffff')) return lit;   /* black and white washes stay */
    const t = mapHex(base, alpha && role === 'text' ? 'fill' : role);     /* a wash is a fill of its colour */
    if (t === base) return lit;
    changed++;
    if (form === 'hex') {
      const out = (lit.length === 4 ? t : t) + (lit.length === 9 ? lit.slice(7) : '');
      return /[A-F]/.test(lit) || lit === lit.toUpperCase() && /[a-f]/i.test(lit) === false ? out.toUpperCase() : out;
    }
    const [R, G, B] = chroma(t).rgb();
    const sep = /,\s/.test(lit) ? ', ' : /,/.test(lit) ? ',' : ' ';
    return a != null ? `${lit.startsWith('rgba') ? 'rgba' : 'rgb'}(${[R, G, B].join(sep)}${lit.includes('/') ? ' / ' : sep}${lit.match(/[\d.]+%?(?=\s*\)$)/)[0]})` : `rgb(${[R, G, B].join(sep)})`;
  });
}

/* ── fonts ───────────────────────────────────────────────────────────────── */
const OLD_FONTS = /(?:&quot;|&#39;|["'])?\b(?:PF Shell Figtree|PF Shell Lato|Figtree|Lato|Inter)\b(?:&quot;|&#39;|["'])?/g;
function refont(list) {
  if (!/Figtree|Lato|Inter\b/.test(list)) return list;
  changed++;
  const parts = list.replace(OLD_FONTS, 'Geist').split(',').map((s) => s.trim());
  return parts.filter((p, i) => parts.findIndex((q) => q.replace(/["']/g, '') === p.replace(/["']/g, '')) === i).join(', ');
}

/* ── CSS: declarations by role ───────────────────────────────────────────── */
const TEXT_PROPS = /^(color|-webkit-text-fill-color|caret-color|text-decoration-color|text-emphasis-color|-webkit-text-stroke-color)$/i;
const SHADOW_PROPS = /^(box-shadow|text-shadow|filter|-webkit-box-shadow)$/i;
const roleOf = (prop) => {
  if (TEXT_PROPS.test(prop)) return 'text';
  if (SHADOW_PROPS.test(prop)) return 'shadow';
  if (prop.startsWith('--')) return /text|heading|label|placeholder|link/i.test(prop) ? 'text' : 'fill';
  return 'fill';
};
const VARS = new Map();   // a custom property → the colour it holds as written (the old look), to read as text
function learnVars(css) { for (const m of css.matchAll(/(--[\w-]+)\s*:\s*(#[0-9a-fA-F]{3,8}|rgba?\([^)]*\))\s*[;}]/g)) if (!VARS.has(m[1])) VARS.set(m[1], m[2]); }
function declarations(body, colours = true) {
  return body.replace(/(^|[;{\s])([-\w]+)(\s*:\s*)([^;{}]+)/g, (all, pre, prop, colon, value) => {
    let v = value;
    if (/^font(-family)?$/i.test(prop) || /font-family$/i.test(prop) || /^--[\w-]*font[\w-]*$/i.test(prop)) v = refont(v);
    if (colours) {
      const role = roleOf(prop);
      if (role === 'text') {
        const m = v.trim().match(/^var\(\s*(--[\w-]+)\s*(?:,[^)]*)?\)(\s*!important)?$/);
        if (m && VARS.has(m[1])) {
          const hex = chroma(VARS.get(m[1])).hex('rgb');
          const asText = mapHex(hex, 'text');
          if (chroma(VARS.get(m[1])).alpha() === 1 && asText !== mapHex(hex, 'fill')) { changed++; return `${pre}${prop}${colon}${asText}${m[2] || ''}`; }
        }
      }
      v = recolour(v, role);
    }
    return v === value ? all : `${pre}${prop}${colon}${v}`;
  });
}
/* a stylesheet: each rule's body; `only` keeps the colours to rules whose selector it matches.
   The old typefaces' @font-face rules go; the first one's place takes Geist's */
const OLD_FACE = /^\s*["']?(?:PF Shell Figtree|PF Shell Lato|Figtree|Lato|Inter)["']?\s*$/;
function stylesheet(css, only = null) {
  css = css.replace(/\/\* Figtree — the faces the harness serves[^*]*\*\/\s*\/\* GENERATED by scripts\/fonts\.mjs[\s\S]*?\*\//, () => { changed++; return '/* Geist and Droid Arabic Kufi: the 2.0 look\'s faces (scripts/look/apply.mjs) */'; });
  let geistAt = !/@font-face\s*\{[^}]*font-family:\s*["']?Geist/.test(css);
  css = css.replace(/([^{}]*)\{([^{}]*)\}/g, (all, sel, body) => {
    if (/@font-face/.test(sel)) {
      const fam = (body.match(/font-family:\s*([^;]+)/) || [])[1] || '';
      if (!OLD_FACE.test(fam)) return all;
      changed++;
      const lead = sel.replace(/@font-face\s*$/, '');
      if (!geistAt) return lead;
      geistAt = false;
      return lead + GEIST_FACES.join('\n');
    }
    return `${sel}{${declarations(body, !only || only.test(sel.trim()))}}`;
  });
  /* a sample cut off mid-rule: its last rule never closes */
  const open = css.lastIndexOf('{'), close = css.lastIndexOf('}');
  if (open > close) {
    const start = Math.max(close, css.lastIndexOf(';', open)) + 1, sel = css.slice(start, open);
    if (!/@font-face/.test(sel)) css = css.slice(0, open + 1) + declarations(css.slice(open + 1), !only || only.test(sel.trim()));
  }
  return css;
}

/* ── HTML ────────────────────────────────────────────────────────────────── */
const ART_ATTRS = /(\s(?:fill|stroke|stop-color|flood-color|lighting-color|color|accentcolor)=")([^"]*)(")/gi;
function markup(html, colours = true) {
  html = html.replace(/(\sstyle=")([^"]*)(")/g, (all, a, body, z) => a + declarations(body, colours) + z);
  html = html.replace(/(\sstyle=')([^']*)(')/g, (all, a, body, z) => a + declarations(body, colours) + z);
  if (colours) html = html.replace(ART_ATTRS, (all, a, v, z) => a + recolour(v, 'art') + z);
  html = html.replace(/(\sfont-family=")([^"]*)(")/g, (all, a, v, z) => a + refont(v) + z);   /* an svg's text: the logo */
  /* an svg drawn into a data URI (a chart, an icon): its art and its text */
  html = html.replace(/(\s(?:src|href)="data:image\/svg\+xml[^"]*")/g, (all) => {
    let v = colours ? recolour(all, 'art') : all;
    v = v.replace(/(?<![A-Za-z])(Figtree|Lato|Inter)(?![a-z])/g, () => { changed++; return 'Geist'; });   /* %22Figtree%2C… */
    return v;
  });
  return html;
}
/* the subtrees of every element carrying an attribute (data-pf-shell): [start, end) pairs */
function subtrees(html, attr) {
  const out = [], open = new RegExp(`<(\\w+)\\b[^>]*\\s${attr}(?:=|\\s|>)[^>]*>`, 'g');
  let m;
  while ((m = open.exec(html))) {
    const tag = m[1], re = new RegExp(`<${tag}\\b[^>]*>|</${tag}>`, 'gi');
    re.lastIndex = m.index;
    let depth = 0, x, end = html.length;
    while ((x = re.exec(html))) { if (x[0][1] !== '/') { if (!x[0].endsWith('/>')) depth++; } else if (--depth === 0) { end = re.lastIndex; break; } }
    out.push([m.index, end]);
    open.lastIndex = end;
  }
  return out;
}
/* a component's spec card (<dl class="ds-spec">): each value by what its label says it is */
function spec(dl) {
  return dl.replace(/(<dt>)([^<]*)(<\/dt><dd>)([\s\S]*?)(<\/dd>)/g, (all, a, dt, b, dd, z) => {
    let v = dd;
    if (/type|font/i.test(dt)) v = dd.replace(/\b(Figtree|Lato|Inter)\b/g, 'Geist');
    else v = recolour(dd, /^(text|colou?r)$/i.test(dt.trim()) ? 'text' : /shadow/i.test(dt) ? 'shadow' : 'fill');
    if (v !== dd && /type|font/i.test(dt)) changed++;
    return a + dt + b + v + z;
  });
}
const unesc = (t) => t.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
function page(html) {
  /* a component's own text: its spec cards, and the HTML a designer copies from it */
  html = html.replace(/(<dl class="ds-spec">)([\s\S]*?)(<\/dl>)/g, (all, a, dl, z) => a + spec(dl) + z);
  /* a code sample (<pre class="ds-code…"><code>…</code></pre>, or <code>…</code> alone): its text is
     escaped HTML, or CSS. Only the escaped text changes, never the tags around it */
  const sample = (text) => {
    const raw = unesc(text);
    const out = /^\s*</.test(raw) ? page(raw) : /\{[^}]*\}/.test(raw) ? stylesheet(raw) : raw;
    return out === raw ? text : esc(out);
  };
  html = html.replace(/(<pre class="ds-code[^"]*"[^>]*>)(<code[^>]*>)?([\s\S]*?)(<\/code>)?(<\/pre>)/g, (all, a, c1, text, c2, z) => a + (c1 || '') + sample(text) + (c2 || '') + z);
  html = html.replace(/(<code>)([^<]*\{[^<]*\}[^<]*)(<\/code>)/g, (all, a, css, z) => a + sample(css) + z);   /* the CSS a component shows */
  html = html.replace(/(\ssrcdoc=")([^"]*)(")/g, (all, a, doc, z) => {   /* a live preview's own page */
    const raw = unesc(doc), out = page(raw);
    return out === raw ? all : a + esc(out) + z;
  });
  const designed = /new-theme\/tokens\.css/.test(html);   /* a 2.0 page: only its product shell changes colour */
  html = html.replace(/(<style\b[^>]*>)([\s\S]*?)(<\/style>)/gi, (all, a, css, z) => a + stylesheet(css, designed ? /^\[data-pf-shell/ : null) + z);
  if (!designed) return markup(html);
  const spans = subtrees(html, 'data-pf-shell');
  let out = '', at = 0;
  for (const [s, e] of spans) { out += markup(html.slice(at, s), false) + markup(html.slice(s, e), true); at = e; }
  return out + markup(html.slice(at), false);
}

/* ── the files ───────────────────────────────────────────────────────────── */
function* walk(dir) {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) yield* walk(p);
    else yield p;
  }
}
/* Geist, as the 2.0 handover loads it (weights 300–800); and the font files: css/fonts.css holds
   Geist and Droid Arabic Kufi, css/new-theme/fonts.css Geist alone */
const faces = (css) => [...css.matchAll(/@font-face\s*\{[^}]*\}/g)].map((m) => m[0]);
const famOf = (f) => ((f.match(/font-family:\s*([^;]+)/) || [])[1] || '').replace(/["']/g, '').trim();
const GEIST_FACES = faces(readFileSync(join(SKILL, 'css/new-theme/fonts.css'), 'utf8')).filter((f) => famOf(f) === 'Geist');
if (!GEIST_FACES.length) { console.error('  css/new-theme/fonts.css has no Geist @font-face'); process.exit(2); }
const FONT_HEAD = "/* The Profolio 2.0 look's typefaces (SIL Open Font License): Geist for English, weights 300-800,\n   as the 2.0 handover loads it; Droid Arabic Kufi for Arabic, as the product loads it.\n   Written by scripts/look/apply.mjs. */\n";
function fontFiles() {
  const cur = readFileSync(join(SKILL, 'css/fonts.css'), 'utf8');
  const arabic = faces(cur).filter((f) => famOf(f) === 'Droid Arabic Kufi');
  const want = { 'css/fonts.css': FONT_HEAD + [...GEIST_FACES, ...arabic].join('\n') + '\n', 'css/new-theme/fonts.css': FONT_HEAD + GEIST_FACES.join('\n') + '\n' };
  for (const [f, body] of Object.entries(want)) {
    if (readFileSync(join(SKILL, f), 'utf8') === body) continue;
    touched++; changed++;
    if (!CHECK) writeFileSync(join(SKILL, f), body);
  }
}
const CSS_FILES = ['css/profolio.css', 'css/profolio.mobile.css', 'css/states.css', 'css/ds.css', 'css/tokens.css'];
for (const f of CSS_FILES) learnVars(readFileSync(join(SKILL, f), 'utf8'));
const files = [...CSS_FILES.map((f) => join(SKILL, f)), join(SKILL, 'css/new-theme/tokens.css'), join(SKILL, 'css/sprite.svg'), ...['pages', 'atoms', 'molecules', 'organisms'].flatMap((d) => [...walk(join(SKILL, d))].filter((p) => extname(p) === '.html')),
  ...[...walk(join(SKILL, 'examples'))].filter((p) => extname(p) === '.html' && !/prototype\.html$|\/qa\//.test(p)),
  ...readdirSync(join(SKILL, 'designs')).filter((n) => /^example-.*\.html$/.test(n)).map((n) => join(SKILL, 'designs', n))];
let touched = 0;
fontFiles();
for (const p of files) {
  const before = readFileSync(p, 'utf8');
  const n0 = changed;
  const after = p.endsWith('/new-theme/tokens.css') ? stylesheet(before, /(?!)/) : p.endsWith('.css') ? stylesheet(before) : page(before);   /* the 2.0 tokens: their fonts only */
  if (after !== before) { touched++; if (!CHECK) writeFileSync(p, after); }
  else changed = n0;
}
/* tokens.md: the product's tokens and measured colours, by the roles each row says it plays
   (its "controls" column). A row that paints both text and fills, and maps differently for
   each, shows both: `#28B16D` · text `#208E57`. The 2.0 redesign's own section stays */
(function tokensDoc() {
  const f = join(SKILL, 'tokens.md'), md = readFileSync(f, 'utf8');
  const cut = md.indexOf('\n## My Listings');
  const head = cut > -1 ? md.slice(0, cut) : md, rest = cut > -1 ? md.slice(cut) : '';
  const out = head.split('\n').map((line) => {
    if (!/^\| `/.test(line) || / · text `/.test(line)) return line;
    const cells = line.split('|');
    const roles = new Set((cells[4] || '').match(/\b(text|fill|border|edge|shadow|ground|other)\b/g) || []);
    const main = roles.has('fill') || roles.has('border') || roles.has('edge') || roles.has('ground') || roles.has('other') ? 'fill' : roles.has('text') ? 'text' : roles.has('shadow') ? 'shadow' : 'fill';
    for (const i of [1, 2]) {
      const c = cells[i];
      if (!c) continue;
      const F = recolour(c, main);
      const T = roles.has('text') && main !== 'text' ? recolour(c, 'text') : F;
      cells[i] = T !== F && i === 2 ? `${F.trimEnd()} · text ${T.trim()} ` : F;
    }
    return cells.join('|').replace(/\b(Figtree|Lato)\b/g, 'Geist');
  }).join('\n');
  if (out === head) return;
  touched++; changed++;
  if (!CHECK) writeFileSync(f, out + rest);
})();
console.log(`  the 2.0 look ${CHECK ? 'would change' : 'changed'} ${changed.toLocaleString()} colours and fonts in ${touched} of ${files.length} files`);
if (CHECK && touched) process.exit(1);
