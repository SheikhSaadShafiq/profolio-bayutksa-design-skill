/**
 * The copy each compiled screen actually shows — product/copy/rendered/ —
 * and product/copy.md's index, with the areas a KSA flag hides.
 *
 * product/copy/<area>.md are the translation strings the build saw called by
 * name (t('…')). A compiled render shows more than that: relative dates
 * ("3 days ago", dayjs), date presets, strings a t() call spells with no
 * translation entry ("Get Top-up"), strings the code writes itself, the
 * pieces a sentence is assembled from ("Quantity cannot exceed " + 75000 +
 * " credits"), and the fixture account's data. A session that knows only the
 * tables calls shipped copy new, and a fixture value copy (cold test #5, #23).
 *
 * buildRenderedCopy() reads every compiled page and state file in
 * skill/pages (web, 375, and the new My Listings' 1440/360) and writes, per
 * page, one row per distinct string the screen draws:
 *
 *   English | Arabic | is | data-pf-src | files
 *
 *   is   t     a translation string, whole — its Arabic beside it (a key
 *              only ar/translation.json has is drawn as the key itself)
 *        t+    joined from translation strings and values: ⟨pattern⟩ with
 *              {{x}} a translation's own placeholder, {n} a number (one for
 *              "75,000"), {date}, {time}, {x} a fixture value; the Arabic
 *              part by part
 *        code  drawn by the product, not a translation (spelled in its code
 *              or its data files — a data file's `label_l1` twin is its
 *              Arabic —, a t() key with no entry, a library's words such as
 *              dayjs)
 *        data  the fixture account's data or a mocked response (a string
 *              literal in harness/fixtures), a field's value, or a bare
 *              value (number, amount, date, e-mail, phone, initials) — not copy
 *        note  quoted by a state's pf-state-note, drawn by no compiled file
 *   with a suffix for how it is drawn: (placeholder) an input's placeholder,
 *   (value) a field's value. LEGEND says the same in every file.
 *
 * Text is taken in rendering order from the text nodes that show: script,
 * style, <head>, [hidden], aria-hidden (decorative — but not the inert
 * wrapper a modal puts round the rail), inline display:none /
 * visibility:hidden / opacity:0, and the stylesheet's own display and
 * visibility rules for class selectors (cssDisplayRules: antd's *-hidden
 * panes, closed dropdowns) are skipped. Held to Chromium on all 1,339 files:
 * of 203,260 text nodes it keeps, 7 are hidden in the browser, besides the
 * collapsed rail's 11,668 labels (kept: they show when the rail expands);
 * it drops 183 the browser shows (0.09%), all aria-hidden decoration (the
 * listing preview's phone status bar and contact pills). An inline
 * element that is part of a sentence — the <strong> round an amount, drawn
 * by the same component from the same file — is joined into its sentence,
 * so "Insufficient Credits. Pay [riyal]900 for the additional 9 credits at
 * checkout" is one row. [riyal] is the riyal glyph: .currency-Saudi_Riyal_Symbol,
 * or the new My Listings' svg[data-pf-riyal].
 * The header and the rail (and what opens inside them) are one file,
 * _shell.md. Values that differ only by number or date from one element are
 * one row (×N).
 *
 * copyAreaGates() says, from the product's source, which copy areas no
 * compiled screen draws and why: a KSA flag switches them off, they are not
 * in the KSA build at all, or nothing compiled reaches them. copyMd() writes
 * product/copy.md with that column.
 *
 * Pure functions over files they are handed; package.mjs does the writing.
 */
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { parseConstants } from './flags.mjs';

/* ── HTML: a tokenizer for the compiled files (freeze.js writes them so the
      parser keeps their tree — <pf-el data-pf-tag> for impossible nesting) ── */
const VOID = new Set('area base br col embed hr img input link meta param source track wbr'.split(' '));
const RAW = new Set(['script', 'style', 'textarea', 'title', 'noscript', 'template', 'xmp']);
const SKIP = new Set(['script', 'style', 'noscript', 'template', 'head', 'title', 'option', 'datalist', 'video', 'audio', 'canvas', 'iframe', 'object']);
const SVG_SKIP = new Set(['title', 'desc', 'defs', 'style', 'clippath', 'mask', 'symbol', 'metadata', 'lineargradient', 'radialgradient', 'filter', 'pattern', 'marker']);
const INLINE = new Set('a abbr b bdi bdo br cite code data dfn em font i kbd mark q s samp small span strong sub sup time u var tspan'.split(' '));
const TAG = /<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>|<![^>]*>|<\?[^>]*>|<\/([a-zA-Z][\w:-]*)\s*>|<([a-zA-Z][\w:-]*)((?:\s+[^\s"'>/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'=<>`]+))?)*)\s*(\/?)>/g;
const ATTR = /([^\s"'>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: '\u00a0', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', hellip: '…', ndash: '–', mdash: '—', copy: '©', reg: '®', trade: '™', times: '×', middot: '·', bull: '•', larr: '←', rarr: '→', laquo: '«', raquo: '»', deg: '°' };
export const decode = (s) => s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+\d*);/gi, (m, e) => {
  if (e[0] === '#') { const n = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10); try { return String.fromCodePoint(n); } catch { return m; } }
  return ENT[e.toLowerCase()] ?? m;
});
const attrsOf = (s) => {
  const a = {};
  if (s) for (const m of s.matchAll(ATTR)) a[m[1].toLowerCase()] = decode(m[2] ?? m[3] ?? m[4] ?? '');
  return a;
};
const styleHides = (st) => /(?:^|;)\s*display\s*:\s*none\b|(?:^|;)\s*visibility\s*:\s*hidden\b|(?:^|;)\s*opacity\s*:\s*0(?:\.0+)?\s*(?:;|$|!)/i.test(st || '');

/**
 * The stylesheet's say on whether an element shows: every rule whose
 * selector is classes only — `.a`, `.a.b`, `.a .b`, `.a > .b` — and which
 * sets display or visibility, outside any @media rule or inside one that
 * holds at `width`. hiddenByCss() applies them as the cascade does
 * (!important, then the number of classes, then the later rule), so
 * `.pf-spin` (display:none) loses to `.pf-spin-spinning` (inline-block).
 * Selectors with tags, attributes or pseudo-classes are not applied.
 */
export function cssDisplayRules(css, width = 1440) {
  const rules = [];
  const mediaHolds = (q) => {
    let ok = !/\bprint\b/.test(q) || /\bscreen\b/.test(q);
    for (const m of q.matchAll(/\((min|max)-width\s*:\s*(\d+(?:\.\d+)?)px\)/g)) ok = ok && (m[1] === 'min' ? width >= +m[2] : width <= +m[2]);
    return ok;
  };
  const decl = (body, prop) => { const m = body.match(new RegExp(`(?:^|;|\\s)${prop}\\s*:\\s*([a-z-]+)\\s*(!important)?`, 'i')); return m ? { v: m[1].toLowerCase(), imp: !!m[2] } : null; };
  const stack = [];
  let i = 0, start = 0, order = 0;
  const n = css.length;
  while (i < n) {
    const ch = css[i];
    if (ch === '/' && css[i + 1] === '*') { const e = css.indexOf('*/', i + 2); i = e < 0 ? n : e + 2; start = i; continue; }
    if (ch === '{') {
      const head = css.slice(start, i).trim();
      if (head.startsWith('@')) { stack.push(/^@media/i.test(head) ? mediaHolds(head) : /^@(supports|layer|container)/i.test(head)); i++; start = i; continue; }
      const e = css.indexOf('}', i);
      const body = css.slice(i + 1, e < 0 ? n : e);
      const d = decl(body, 'display'), v = decl(body, 'visibility');
      if ((d || v) && stack.every(Boolean)) {
        for (const sel of head.split(',')) {
          const s = sel.trim();
          if (!/^\.[\w-]+(?:\.[\w-]+)*(?:\s*>?\s*\.[\w-]+(?:\.[\w-]+)*)*$/.test(s)) continue;
          const parts = [];
          let child = false;
          for (const p of s.split(/\s*(>)\s*|\s+/).filter(Boolean)) { if (p === '>') child = true; else { parts.unshift({ cls: p.split('.').filter(Boolean), child }); child = false; } }
          const spec = parts.reduce((k, p) => k + p.cls.length, 0);
          if (d) rules.push({ parts, spec, order, prop: 'display', hide: d.v === 'none', imp: d.imp, sel: s });
          if (v) rules.push({ parts, spec, order, prop: 'visibility', hide: v.v === 'hidden', imp: v.imp, sel: s });
        }
      }
      order++;
      i = (e < 0 ? n : e) + 1; start = i; continue;
    }
    if (ch === '}') { stack.pop(); i++; start = i; continue; }
    i++;
  }
  /* indexed by the rightmost compound's first class */
  const byClass = new Map();
  for (const r of rules) { const k = r.parts[0].cls[0]; (byClass.get(k) || byClass.set(k, []).get(k)).push(r); }
  return { byClass, count: rules.length, hiding: rules.filter((r) => r.hide).length };
}
const hasAll = (set, cls) => cls.every((c) => set.has(c));
/* does a rule's selector match element `el` (parent links, class sets)? */
const matchRule = (el, parts) => {
  if (!hasAll(el.cset, parts[0].cls)) return false;
  let cur = el.parent;
  for (let k = 1; k < parts.length; k++) {
    const direct = parts[k - 1].child;
    let found = false;
    while (cur) { const ok = hasAll(cur.cset, parts[k].cls); cur = cur.parent; if (ok) { found = true; break; } if (direct) break; }
    if (!found) return false;
  }
  return true;
};
/* the winning display and visibility rules for an element: does it hide? */
const hiddenByCss = (el, idx, inline) => {
  if (!idx || !el.cset.size) return false;
  const win = {};
  const seen = new Set();
  for (const c of el.cset) {
    for (const r of idx.byClass.get(c) || []) {
      if (seen.has(r)) continue;
      seen.add(r);
      if (!matchRule(el, r.parts)) continue;
      const w = win[r.prop];
      if (!w || (r.imp && !w.imp) || (r.imp === w.imp && (r.spec > w.spec || (r.spec === w.spec && r.order > w.order)))) win[r.prop] = r;
    }
  }
  const d = win.display, v = win.visibility;
  return (!!d && d.hide && !(inline.display && !d.imp)) || (!!v && v.hide && !(inline.visibility && !v.imp));
};

/**
 * One compiled file → its metas and its strings, in rendering order.
 *   hide  cssDisplayRules() of the stylesheet the file links, or null
 * Each string: { text, src, c, shell, cell, attr? }.
 */
export function extractFile(html, { hide = null, nodes = false } = {}) {
  const meta = {};
  for (const m of html.slice(0, 12000).matchAll(/<meta name="(pf-[\w-]+)" content="([^"]*)"/g)) meta[m[1]] = decode(m[2]);
  const root = { tag: '#root', cset: new Set(), kids: [], parent: null, hidden: false, skip: false };
  let cur = root;
  let m;
  TAG.lastIndex = 0;
  let last = 0;
  const pushText = (t) => { if (!cur.hidden && !cur.skip && t) cur.kids.push({ el: cur, text: decode(t) }); };
  while ((m = TAG.exec(html))) {
    if (m.index > last) pushText(html.slice(last, m.index));
    last = TAG.lastIndex;
    if (m[0][1] === '!' || m[0][1] === '?') continue;
    if (m[1]) {                                            /* a closing tag: pop to its element */
      const t = m[1].toLowerCase();
      let e = cur;
      while (e && e !== root && e.tag0 !== t) e = e.parent;
      if (e && e !== root) cur = e.parent;
      continue;
    }
    const tag0 = m[2].toLowerCase();
    const a = attrsOf(m[3]);
    const tag = tag0 === 'pf-el' || tag0 === 'pf-nested-a' ? (a['data-pf-tag'] || (tag0 === 'pf-nested-a' ? 'a' : 'div')).toLowerCase() : tag0;
    const el = {
      tag, tag0, parent: cur, kids: [], cset: new Set((a.class || '').split(/\s+/).filter(Boolean)),
      src: a['data-pf-src'] || null, c: a['data-pf-c'] || null, i: a['data-pf-i'] || null,
    };
    const st = a.style || '';
    el.inSvg = cur.inSvg || tag === 'svg';
    el.skip = cur.skip || SKIP.has(tag) || (el.inSvg && SVG_SKIP.has(tag));
    /* aria-hidden is decorative (a preview's status bar, antd's measuring copies) — but not the inert
       wrapper a modal puts round the rail, which still shows behind the mask */
    el.hidden = cur.hidden || 'hidden' in a || (a['aria-hidden'] === 'true' && !('inert' in a)) || styleHides(st) || (tag === 'input' && a.type === 'hidden');
    if (!el.hidden && !el.skip && hide) el.hidden = hiddenByCss(el, hide, { display: /(?:^|;)\s*display\s*:/i.test(st), visibility: /(?:^|;)\s*visibility\s*:/i.test(st) });
    el.shell = cur.shell || (tag === 'header' && el.cset.has('pf-layout-header')) || (tag === 'aside' && el.cset.has('pf-layout-sider'));
    el.cell = cur.cell || tag === 'td' || tag === 'th';
    el.srcUp = el.src || cur.srcUp || null;
    cur.kids.push(el);
    const shows = !el.hidden && !el.skip;
    /* the riyal is a glyph — the icon font's (current theme) or the build's svg (new My Listings): a token in its sentence */
    el.riyal = el.cset.has('currency-Saudi_Riyal_Symbol') || (tag === 'svg' && 'data-pf-riyal' in a);
    if (shows && el.riyal) el.kids.push({ el, text: '[riyal]', glyph: true });
    /* text a user sees in a control */
    if (shows && a.placeholder && a.placeholder.trim()) el.kids.push({ el, text: a.placeholder, attr: 'placeholder' });
    if (shows && tag === 'input' && /^(button|submit|reset)$/i.test(a.type || '') && a.value) el.kids.push({ el, text: a.value, attr: 'value' });
    if (tag === 'br') { el.kids.push({ el, text: ' ', br: true }); continue; }
    if (VOID.has(tag0) || m[4] === '/') continue;
    if (RAW.has(tag0)) {                                   /* raw text: to its own closing tag */
      let close = html.indexOf(`</${tag0}`, last);
      if (close < 0) close = html.toLowerCase().indexOf(`</${tag0}`, last);
      const body = html.slice(last, close < 0 ? html.length : close);
      if (tag0 === 'textarea' && shows && /\S/.test(body)) el.kids.push({ el, text: decode(body), attr: 'value' });
      const gt = close < 0 ? html.length : html.indexOf('>', close);
      TAG.lastIndex = last = gt < 0 ? html.length : gt + 1;
      continue;
    }
    cur = el;
  }
  if (last < html.length) pushText(html.slice(last));

  /* The sentence an inline element belongs to: its parent's, when the parent
     has words of its own and the element is antd's own markup (no
     data-pf-src) or was drawn by the same component from the same file — the
     <strong> round an amount. A component's own root (data-pf-i: Text, Tag,
     Button …) is a string of its own. */
  const own = (el) => el.kids.some((k) => k.text !== undefined && !k.br && !k.attr && /\S/.test(k.text));
  const file = (s) => (s || '').replace(/:\d+$/, '');
  const joinable = (el) => {
    const p = el.parent;
    if (!p || p === root) return false;
    if (el.riyal) return own(p) || (INLINE.has(p.tag) && joinable(p));
    if (!INLINE.has(el.tag) || el.i || !own(p)) return false;
    return !el.src || (el.c === p.c && file(el.src) === file(p.srcUp));
  };
  const rootOf = (el) => { while (joinable(el)) el = el.parent; return el; };
  const segs = [];
  const nodeTexts = [];
  const byRoot = new Map();
  let tick = 0;
  const walk = (el) => {
    for (const k of el.kids) {
      if (k.text === undefined) { if (!k.hidden && !k.skip) walk(k); continue; }
      if (k.attr) { if (nodes && k.attr === 'value' && k.el.tag === 'textarea') nodeTexts.push(norm(k.text)); segs.push({ el: k.el, parts: [k.text], attr: k.attr }); continue; }
      if (nodes && !k.glyph && !k.br && /\S/.test(k.text)) nodeTexts.push(norm(k.text));
      const r = rootOf(k.el);
      let s = byRoot.get(r);
      if (!s) { s = { el: r, parts: [] }; byRoot.set(r, s); segs.push(s); }
      if (/\S/.test(k.text)) {
        /* words of another string came between: mark the gap */
        if (s.tick !== undefined && s.tick !== tick) s.parts.push(' … ');
        /* two elements' words that touch: a flex gap or a margin sets them apart */
        else if (s.lastEl && s.lastEl !== k.el && /[\p{L}\p{N}]$/u.test(s.parts[s.parts.length - 1] || '') && /^[\p{L}\p{N}]/u.test(k.text)) s.parts.push(' ');
        s.tick = ++tick;
        s.lastEl = k.el;
      }
      s.parts.push(k.text);
    }
  };
  walk(root);
  const out = [];
  for (const s of segs) {
    const text = norm(s.parts.join('')).replace(/^…\s*|\s*…$/g, '').replace(/(?:\s*…\s*){2,}/g, ' … ');
    if (!text || !/[\p{L}\p{N}]/u.test(text.replace(/\[riyal\]/g, ''))) continue;
    out.push({ text, src: s.el.srcUp, c: s.el.c || null, shell: !!s.el.shell, cell: !!s.el.cell, ...(s.attr ? { attr: s.attr } : {}) });
  }
  return nodes ? { meta, strings: out, nodes: nodeTexts } : { meta, strings: out };
}
const norm = (t) => t.replace(/[\s\u00a0\u200b\u200e\u200f\u2066-\u2069]+/g, ' ').trim();

/* ── the product's words ─────────────────────────────────────────────── */
const tidy = (s) => String(s).replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/[\s\u00a0]+/g, ' ').trim();
const reEsc = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/**
 * The translation strings, English → Arabic. From the product's
 * src/locales/{en,ar}/translation.json when the source is there (every
 * string, and every key only the Arabic file has, its English the key
 * itself) — else from the tables in .build/references/copy/ (only the
 * strings the build saw called by name).
 */
export function loadTranslations({ repo = null, copyDir = null } = {}) {
  const pairs = [];
  let from = null;
  const en = repo && join(repo, 'src', 'locales', 'en', 'translation.json');
  if (en && existsSync(en)) {
    const E = JSON.parse(readFileSync(en, 'utf8'));
    const arp = join(repo, 'src', 'locales', 'ar', 'translation.json');
    const A = existsSync(arp) ? JSON.parse(readFileSync(arp, 'utf8')) : {};
    const flat = (o, pre = '') => Object.entries(o).flatMap(([k, v]) => (v && typeof v === 'object' ? flat(v, `${pre}${k}.`) : [[`${pre}${k}`, v]]));
    const AR = new Map(flat(A));
    /* the entry whose key is its English first: t('Owner') reads key "Owner" */
    const FE = flat(E);
    for (const [k, v] of FE.sort((x, y) => (y[0] === y[1]) - (x[0] === x[1]))) if (typeof v === 'string') pairs.push([v, typeof AR.get(k) === 'string' ? AR.get(k) : null]);
    /* a key only ar/translation.json has (133 of them): i18next (src/i18n/i18n.js, fallbackLng
       the current language, no default values at these t() calls) shows the key itself in
       English — t('Get Top-up') draws "Get Top-up", and "احصل على شحن" in Arabic. After the
       en entries, so an en entry's Arabic is named first when both spell the same English
       ('Interested in' → "Interested In" · 'Interested In'): the row gives both. */
    const EK = new Set(FE.map(([k]) => k));
    for (const [k, v] of flat(A)) if (typeof v === 'string' && !EK.has(k)) pairs.push([k, v]);
    from = 'src/locales/{en,ar}/translation.json';
  } else if (copyDir && existsSync(copyDir)) {
    for (const f of readdirSync(copyDir).filter((x) => x.endsWith('.md'))) {
      for (const m of readFileSync(join(copyDir, f), 'utf8').matchAll(/^\| (.*?) \| (.*?) \|$/gm)) {
        if (m[1] === 'English' || /^-+$/.test(m[1]) || /^Area$/.test(m[1])) continue;
        pairs.push([m[1].replace(/\\\|/g, '|'), m[2] === '—' ? null : m[2].replace(/\\\|/g, '|')]);
      }
    }
    from = '.build/references/copy/*.md';
  }
  const exact = new Map();                                 /* tidy(en) → { en, ar } */
  const templates = [];
  for (const [e0, a0] of pairs) {
    const e = tidy(e0), a = a0 == null ? null : tidy(a0);
    if (!e || !/\p{L}/u.test(e)) continue;
    if (/\{\{[^}]+\}\}/.test(e)) {
      const lits = e.split(/\{\{[^}]+\}\}/);
      if (!lits.some((l) => /\p{L}{2}/u.test(l))) continue;
      const body = lits.map((l) => reEsc(l));
      templates.push({ en: e, ar: a, full: new RegExp(`^${body.join('(.+)')}$`), at: [new RegExp(body.join('(.+?)'), 'y'), new RegExp(body.join('(.+)'), 'y')], lit: lits.reduce((x, y) => (y.trim().length > x.trim().length ? y : x), '').trim() });
    } else if (!exact.has(e)) exact.set(e, { en: e, ar: a });
    else if (a) { const x = exact.get(e); if (!x.ar) x.ar = a; else if (!x.ar.split(' · also ').includes(a)) x.ar = `${x.ar} · also ${a}`; }
  }
  /* by first word, for finding the pieces of a joined sentence */
  const byWord = new Map();
  for (const t of exact.values()) { const w = (t.en.match(/^[\p{L}\p{N}]+/u) || [t.en[0]])[0].toLowerCase(); (byWord.get(w) || byWord.set(w, []).get(w)).push(t); }
  for (const l of byWord.values()) l.sort((x, y) => y.en.length - x.en.length);
  return { exact, templates, byWord, from, count: pairs.length };
}

/**
 * The fixture account's own words: every string literal in the harness's
 * fixtures (names, addresses, listing titles, API labels, mocked refusals).
 * Returned as tidy string → the fixture file it is in.
 */
export function loadFixtureStrings(harnessDir) {
  const out = new Map();
  if (!harnessDir || !existsSync(harnessDir)) return out;
  const files = [join(harnessDir, 'fixtures.mjs')];
  const fx = join(harnessDir, 'fixtures');
  if (existsSync(fx)) for (const f of readdirSync(fx)) if (/\.(mjs|json)$/.test(f)) files.push(join(fx, f));
  for (const f of files) {
    if (!existsSync(f)) continue;
    const name = relative(harnessDir, f);
    for (const raw of literals(readFileSync(f, 'utf8'))) {
      const s = tidy(raw);
      if (s.length >= 2 && /\p{L}/u.test(s) && !out.has(s)) out.set(s, name);
    }
  }
  return out;
}
/* A script's string literals — quoted strings whole, a template literal as
   the pieces between its ${…} (nested templates too) — never its comments,
   which quote the product's own words. */
export function literals(src) {
  const out = [];
  const n = src.length;
  let i = 0;
  const tpl = [];                                          /* open template literals: brace depth inside each ${ } */
  let buf = null;
  const text = () => { if (buf !== null && buf.length) out.push(buf); buf = ''; };
  while (i < n) {
    const ch = src[i];
    const inTpl = tpl.length && tpl[tpl.length - 1] === -1;  /* -1: in the template's text */
    if (inTpl) {
      if (ch === '\\') { buf += src[i + 1] || ''; i += 2; continue; }
      if (ch === '`') { text(); buf = null; tpl.pop(); i++; continue; }
      if (ch === '$' && src[i + 1] === '{') { text(); buf = null; tpl[tpl.length - 1] = 0; i += 2; continue; }
      buf += ch; i++; continue;
    }
    if (ch === '/' && src[i + 1] === '*') { const e = src.indexOf('*/', i + 2); i = e < 0 ? n : e + 2; continue; }
    if (ch === '/' && src[i + 1] === '/') { const e = src.indexOf('\n', i); i = e < 0 ? n : e; continue; }
    if (ch === "'" || ch === '"') {
      let j = i + 1, s0 = '';
      while (j < n && src[j] !== ch && src[j] !== '\n') { if (src[j] === '\\') { s0 += src[j + 1] || ''; j += 2; } else s0 += src[j++]; }
      out.push(s0); i = j + 1; continue;
    }
    if (ch === '`') { tpl.push(-1); buf = ''; i++; continue; }
    if (tpl.length) {                                      /* inside ${ }: count braces */
      if (ch === '{') tpl[tpl.length - 1]++;
      else if (ch === '}') { if (tpl[tpl.length - 1] === 0) { tpl[tpl.length - 1] = -1; buf = ''; i++; continue; } tpl[tpl.length - 1]--; }
    }
    i++;
  }
  return out;
}

/**
 * The words the product's own code spells out: every string literal and JSX
 * text in src/ (not the locales), and the words its own data files carry —
 * src/**\/*.json, the KSA listing form's fields (dynamicFieldsResponse.json:
 * "label": "Maid Room", "label_l1": "غرفة خادمة"), empty-state titles. A
 * rendered string found here is the product's, even when a fixture also
 * carries it (a delete reason, a toast, a field label).
 * Returns a Set; its `.ar` (Map English → Arabic) holds the Arabic twin a data
 * file gives beside the English (`label` / `label_l1`, `name` / `name_l1`,
 * `value` / `value_l1` — "Yes,No" / "نعم،لا" item by item).
 */
const JSON_COPY_KEY = /^(?:label|name|title|subtitle|description|place_holder|placeholder|text|message|heading|invalid)$/;
export function loadCodeStrings(repo) {
  const out = new Set();
  out.ar = new Map();
  const src = repo && join(repo, 'src');
  if (!src || !existsSync(src)) return out;
  const word = (x) => { const k = tidy(x); return k.length >= 2 && /\p{L}/u.test(k) ? k : null; };
  const twin = (en, ar) => {
    const e = word(en); if (!e) return;
    out.add(e);
    const a = ar == null ? null : tidy(ar);
    /* an Arabic twin in Arabic script ("value_l1": "Off plan" is no Arabic) */
    if (!a || !/\p{Script=Arabic}/u.test(a)) return;
    const was = out.ar.get(e);
    if (!was) out.ar.set(e, a); else if (!was.split(' · also ').includes(a)) out.ar.set(e, `${was} · also ${a}`);
  };
  const fromJson = (o) => {
    if (Array.isArray(o)) { for (const x of o) fromJson(x); return; }
    if (!o || typeof o !== 'object') return;
    for (const [k, v] of Object.entries(o)) {
      if (v && typeof v === 'object') { fromJson(v); continue; }
      if (typeof v !== 'string' || /_l1$/.test(k)) continue;
      const ar = typeof o[`${k}_l1`] === 'string' ? o[`${k}_l1`] : null;
      if (!ar && !JSON_COPY_KEY.test(k)) continue;
      /* an option list: "Yes,No" / "نعم،لا" — item by item, when the two lists match */
      const es = v.split(','), as = ar ? ar.split(/[,،]/) : [];
      if (es.length > 1 && as.length === es.length) es.forEach((e, i) => twin(e, as[i]));
      else twin(v, ar);
    }
  };
  const walk = (d) => {
    for (const n of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, n.name);
      if (n.isDirectory()) { if (!/^(locales|node_modules|__tests__|__mocks__)$/.test(n.name)) walk(p); continue; }
      if (/\.json$/.test(n.name)) { try { fromJson(JSON.parse(readFileSync(p, 'utf8'))); } catch { /* not JSON the app reads */ } continue; }
      if (!/\.(jsx?|tsx?)$/.test(n.name)) continue;
      const t = readFileSync(p, 'utf8');
      for (const x of literals(t)) { const k = word(x); if (k) out.add(k); }
      for (const x of t.matchAll(/>([^<>{}\n]{2,160})</g)) { const k = word(x[1]); if (k) out.add(k); }
    }
  };
  walk(src);
  return out;
}

/* the fixture strings, indexed by first word for decompose() */
export function fixtureIndex(F) {
  if (F && F.byWord) return F;
  const byWord = new Map();
  for (const f0 of (F || new Map()).keys()) {
    /* a template's piece is indexed as its words: "-bedroom," → "bedroom" */
    const f = f0.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');
    if (f.length < 2 || !/\p{L}/u.test(f)) continue;
    const w = f.match(/^[\p{L}\p{N}]+/u)[0].toLowerCase();
    (byWord.get(w) || byWord.set(w, []).get(w)).push(f);
  }
  for (const l of byWord.values()) l.sort((x, y) => y.length - x.length);
  return { map: F || new Map(), byWord };
}

/* ── what a string is ────────────────────────────────────────────────── */
const VALUE = /^(?:[-+]?[\d.,٠-٩]+(?:\s?[%kKmM]|st|nd|rd|th)?|\+?\d[\d\s-]{6,}|[\w.+-]+@[\w-]+\.[\w.]+|https?:\/\/\S+|www\.\S+|#?\d+|[A-Z]{1,3}-?\d[\w-]*|\d{1,2}:\d{2}(?:\s?[AP]M)?|\[riyal\]\s?[\d.,]+)$/i;
const DATE = /^(?:(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)[a-z]*,?\s)?(?:\d{1,2}\s)?(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s\d{1,2}(?:st|nd|rd|th)?,?\s?(?:\d{4})?(?:,?\s\d{1,2}:\d{2}(?:\s?[AP]M)?)?$|^\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}$|^\d{4}-\d{2}-\d{2}/i;
/* initials in an avatar ("FA", "N"); not AM / PM */
const INITIALS = /^(?!AM$|PM$)[A-Z]{1,2}$/;
const isValue = (t) => VALUE.test(t) || DATE.test(t) || INITIALS.test(t) || !/\p{L}/u.test(t.replace(/\[riyal\]/g, ''));
/* a date or a time inside a sentence: "Posted on Sep 27, 2026", "11:04 am, Sep 27, 2026" */
const MON = '(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\\.?';
const DATE_IN = new RegExp(`^(?:\\d{1,2}:\\d{2}(?:\\s?[ap]\\.?m\\.?)?,?\\s)?(?:${MON}\\s\\d{1,2}(?:st|nd|rd|th)?,?\\s\\d{4}|\\d{1,2}\\s${MON},?\\s\\d{4}|${MON}\\s\\d{4})(?:,?\\s\\d{1,2}:\\d{2}(?:\\s?[ap]\\.?m\\.?)?)?|^\\d{1,2}:\\d{2}(?:\\s?[ap]\\.?m\\.?)?`, 'i');
const numbers = (t) => {
  let o = '';
  for (let i = 0; i < t.length;) {
    const d = (i === 0 || !/[\p{L}\p{N}]/u.test(t[i - 1])) && t.slice(i).match(DATE_IN);
    if (d && !/[\p{L}\p{N}]/u.test(t[i + d[0].length] || '')) { o += /^\d{1,2}:\d{2}/.test(d[0]) && !/[A-Za-z]{3}/.test(d[0]) ? '{time}' : '{date}'; i += d[0].length; continue; }
    const m = (i === 0 || !/[\p{L}\p{N}]/u.test(t[i - 1])) && t.slice(i).match(/^[-+]?\d+(?:[.,]\d+)*(?=[x%]?(?![\p{L}\p{N}]))/u);
    if (m) { o += '{n}'; i += m[0].length; continue; }
    o += t[i++];
  }
  return o.replace(/\[riyal\]\s?(?=\{n\})/g, '[riyal]');
};
const stripEnd = (t) => t.replace(/\s*[:*：]+$/, '').replace(/^\*\s*/, '');

/**
 * Classify one rendered string. Returns { is, pattern, ar, fixture }.
 */
export function classify(text, T, F0, ctx = {}) {
  const F = fixtureIndex(F0);
  const tr = T.exact.get(text) || T.exact.get(stripEnd(text));
  if (tr) return { is: 't', ar: tr.ar };
  for (const tp of T.templates) {
    if (tp.lit && !text.includes(tp.lit)) continue;
    if (tp.full.test(text)) return { is: 't+', pattern: tp.en, ar: tp.ar };
  }
  /* what a field holds (a textarea's text, an input's value) is the fixture's */
  if (ctx.attr === 'value') return { is: 'data', fixture: F.map.get(text) };
  /* spelled out in the product's code: the product's words */
  if (ctx.code && (ctx.code.has(text) || ctx.code.has(stripEnd(text)))) {
    /* its Arabic, when a data file of the product's gives one beside it (label_l1) */
    const ar = ctx.code.ar && (ctx.code.ar.get(text) || ctx.code.ar.get(stripEnd(text)));
    return ar ? { is: 'code', ar } : { is: 'code' };
  }
  if (F.map.has(text) || F.map.has(stripEnd(text))) return { is: 'data', fixture: F.map.get(text) || F.map.get(stripEnd(text)) };
  /* a value, or only values: "5:00 am, Oct 02, 2026", "Aug 2026" */
  if (isValue(text) || !/\p{L}/u.test(numbers(text).replace(/\{(?:n|date|time)\}|\[riyal\]/g, ''))) return { is: 'data' };
  /* a sentence joined from translation strings, values and fixture words */
  const d = decompose(text, T, F);
  if (d && d.tr) return { is: 't+', pattern: d.pattern, ar: d.ar };
  if (d && d.fx) return { is: 'data', fixture: d.fixture };
  /* cut short by the product ("Al Qadisiyah, East Riyadh, Riy..."): what is left */
  const cut = text.match(/^(.*\S)[\s,]+\S*(?:\.\.\.|…)$/);
  if (cut && !ctx.cut) { const k = classify(cut[1], T, F, { ...ctx, cut: true }); if (k.is === 'data') return k; }
  /* a plain table cell nothing drew but antd: the column's value */
  if (ctx.cell && !ctx.c) return { is: 'data' };
  const p = numbers(text);
  return { is: 'code', pattern: p !== text ? p : undefined };
}

/* cover a string with translation strings (whole words), templates, fixture
   words and values; every letter must be covered */
function decompose(S, T, F) {
  const n = S.length;
  const best = new Array(n + 1).fill(null);
  best[0] = { score: 0, parts: [] };
  const wordStart = (i) => i === 0 || !/[\p{L}\p{N}]/u.test(S[i - 1]);
  const wordEnd = (j) => j === n || !/[\p{L}\p{N}]/u.test(S[j]) || !/[\p{L}\p{N}]/u.test(S[j - 1]);
  const put = (j, cand) => { if (!best[j] || cand.score > best[j].score || (cand.score === best[j].score && cand.parts.length < best[j].parts.length)) best[j] = cand; };
  for (let i = 0; i < n; i++) {
    const b = best[i];
    if (!b) continue;
    const ch = S[i];
    /* glue: a character that is neither a letter nor a digit */
    if (!/[\p{L}\p{N}]/u.test(ch)) put(i + 1, { score: b.score, parts: [...b.parts, { g: ch }] });
    if (S.startsWith('[riyal]', i)) put(i + 7, { score: b.score, parts: [...b.parts, { g: '[riyal]' }] });
    if (!wordStart(i)) continue;
    /* a value token: 12m, 3rd, #88010257, SA-123 */
    const dt = S.slice(i).match(DATE_IN);
    if (dt && wordEnd(i + dt[0].length)) put(i + dt[0].length, { score: b.score + 0.003, parts: [...b.parts, { v: dt[0], date: true }] });
    /* a number with thousands separators is one value: "75,000" is {n}, never {n},{n}
       (each value token scores, so the split would win) */
    const grouped = S.slice(i).match(/^[#+-]?\d{1,3}(?:,\d{3})+(?:\.\d+)?%?(?![\p{L}\p{N}])/u);
    const midGroup = /\d,$/.test(S.slice(Math.max(0, i - 2), i)) && /^\d{3}(?!\d)/.test(S.slice(i));
    if (grouped) put(i + grouped[0].length, { score: b.score + 0.002, parts: [...b.parts, { v: grouped[0] }] });
    else if (!midGroup) for (const v of [S.slice(i).match(/^[#+-]?\d[\d.,]*(?:\d|(?<=\d))[%]?/u), S.slice(i).match(/^[\p{L}\p{N}#-]*\d[\p{L}\p{N}#-]*/u)]) {
      if (v && wordEnd(i + v[0].length)) put(i + v[0].length, { score: b.score + 0.002, parts: [...b.parts, { v: v[0] }] });
    }
    const w = (S.slice(i).match(/^[\p{L}\p{N}]+/u) || [S[i]])[0].toLowerCase();
    for (const t of T.byWord.get(w) || []) {
      if (t.en.length < 2 || !S.startsWith(t.en, i) || !wordEnd(i + t.en.length)) continue;
      put(i + t.en.length, { score: b.score + t.en.length, parts: [...b.parts, { t }] });
    }
    for (const tp of T.templates) {
      if (tp.lit && !S.includes(tp.lit)) continue;
      for (const re of tp.at) {
        re.lastIndex = i;
        const mm = re.exec(S);
        if (mm && wordEnd(re.lastIndex)) put(re.lastIndex, { score: b.score + mm[0].length, parts: [...b.parts, { tp }] });
      }
    }
    for (const f of F.byWord.get(w) || []) {
      if (!S.startsWith(f, i) || !wordEnd(i + f.length)) continue;
      put(i + f.length, { score: b.score + 0.001, parts: [...b.parts, { f }] });
    }
  }
  const r = best[n];
  if (!r) return null;
  const trs = r.parts.filter((p) => p.t || p.tp);
  const fxs = r.parts.filter((p) => p.f);
  if (!trs.length && !fxs.length) return null;
  /* one translation word inside a sentence of fixture words is fixture data */
  const trLetters = trs.reduce((k, p) => k + (p.t ? p.t.en : p.tp.en).replace(/[^\p{L}]/gu, '').length, 0);
  const fxLetters = fxs.reduce((k, p) => k + p.f.replace(/[^\p{L}]/gu, '').length, 0);
  if (!trs.length || fxLetters > trLetters) return { fx: true, fixture: F.map.get(fxs[0]?.f) };
  let pattern = '', ar = [];
  for (const p of r.parts) {
    if (p.g !== undefined) pattern += p.g;
    else if (p.v) pattern += p.date ? (/[A-Za-z]{3}/.test(p.v) ? '{date}' : '{time}') : '{n}';
    else if (p.f) { pattern += '{x}'; ar.push('{x}'); }
    else if (p.t) { pattern += p.t.en; ar.push(p.t.ar || `(${p.t.en})`); }
    else { pattern += p.tp.en; ar.push(p.tp.ar || `(${p.tp.en})`); }
    if (p.v) ar.push(p.date ? (/[A-Za-z]{3}/.test(p.v) ? '{date}' : '{time}') : '{n}');
  }
  pattern = pattern.replace(/\s+/g, ' ').trim();
  return { tr: true, pattern: pattern !== S ? pattern : undefined, ar: ar.join(' + ') };
}

/* ── the files: every compiled page and state in skill/pages ─────────── */
export function listPageFiles(pagesDir) {
  const out = [];
  for (const f of readdirSync(pagesDir)) {
    const p = join(pagesDir, f);
    if (statSync(p).isDirectory()) {
      for (const g of readdirSync(p)) {
        const m = g.match(/^(.+?)(\.mobile)?\.html$/);
        if (m) out.push({ path: join(p, g), rel: `pages/${f}/${g}`, page: f, state: m[1], dev: m[2] ? 'mobile' : 'web' });
      }
    } else {
      const m = f.match(/^(.+?)(\.mobile)?\.html$/);
      if (m) out.push({ path: p, rel: `pages/${f}`, page: m[1], state: null, dev: m[2] ? 'mobile' : 'web' });
    }
  }
  return out.sort((a, b) => a.rel.localeCompare(b.rel));
}

/* quoted strings in a pf-state-note */
/* the product's words a state note quotes — “No notifications found” — not
   the explorer's trigger names (click “icon” opens a drawer) */
const noteQuotes = (note) => [...String(note || '').matchAll(/“([^”]{3,120})”/g)]
  .filter((m) => !/\b(?:click|hover|tap|type|in the (?:modal|drawer|popover)|then|→)\s*$/i.test(note.slice(Math.max(0, m.index - 24), m.index)) && !/^\s*(?:opens|open|→)/.test(note.slice(m.index + m[0].length, m.index + m[0].length + 8)))
  .map((m) => tidy(m[1])).filter((s) => /\p{L}{2}/u.test(s));

const cell = (s) => String(s ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
const shortSrc = (s) => (s || '—').replace(/^src\//, '');
/* the `is` column: every class and suffix a row can carry — buildRenderedCopy() throws on any other */
const IS_CLASSES = ['t', 't+', 'code', 'data', 'note'];
const IS_SUFFIXES = ['placeholder', 'value'];
const LEGEND = "`is`: **t** a translation · **t+** translations joined with values — ⟨pattern⟩: {{x}} the translation's placeholder, {n} a number (\"75,000\" is one), {date}, {time}, {x} a fixture value; ×N strings of one pattern; Arabic part by part · **code** drawn by the product, not in the translation files — spelled in its code or its data files (the Arabic beside it is the data file's own twin, `label` / `label_l1`; else \"not in translations\") · **data** the fixture's data, a mocked response or a value — not copy (copied unchanged into a design, it stays unmarked) · **note** quoted by a state note, drawn nowhere. A suffix says how the string is drawn: **(placeholder)** an input's placeholder attribute · **(value)** what a field holds, an input's or a textarea's value (the fixture's, unless a translation). The class is the first word — `t (placeholder)` is a **t** row: grep `| t |` and `| t (` for every t row.";

/**
 * Every compiled file → product/copy/rendered/<page>.md (and _shell.md).
 *   files        listPageFiles(skill/pages)
 *   translations loadTranslations(…)
 *   fixtures     loadFixtureStrings(harness/)
 *   code         loadCodeStrings(product repo) — optional
 *   css          { web: profolio.css text, mobile: profolio.mobile.css text }
 * Returns { files: { 'product/copy/rendered/<x>.md': text }, stats, lookup,
 * drawn, pages }: lookup (Map text → where it is drawn) is for checks;
 * drawn (Set of src/… files the compiled files name) feeds copyAreaGates().
 */
export function buildRenderedCopy({ files, translations: T, fixtures, code = null, css = {}, max = 6 }) {
  const F = fixtureIndex(fixtures);
  const hide = { 'profolio.css': css.web ? cssDisplayRules(css.web, 1440) : null, 'profolio.mobile.css': css.mobile ? cssDisplayRules(css.mobile, 375) : null };
  const pages = new Map();                                 /* page → { files: [], rows: Map(text → row), notes: Map } */
  const shell = new Map();
  const cls = new Map();                                   /* text|c|cell → classification (memo) */
  const classOf = (s) => { const k = `${s.text}\u0001${s.cell && !s.c ? 1 : 0}\u0001${s.attr || ''}`; if (!cls.has(k)) cls.set(k, classify(s.text, T, F, { cell: s.cell, c: s.c, attr: s.attr, code })); return cls.get(k); };
  const phoneLabel = new Map();
  const drawn = new Set();                                 /* every source file a compiled file names */
  for (const f of files) {
    const html = readFileSync(f.path, 'utf8');
    if (!/<meta name="pf-compiled"/.test(html.slice(0, 12000))) continue;
    for (const x of html.matchAll(/data-pf-src="([^":]+)/g)) drawn.add(x[1]);
    /* a component that draws only other components has no data-pf-src of its own: its instances name it */
    for (const x of html.matchAll(/data-pf-i="([^"]+)"/g)) for (const y of x[1].split(' ')) { const d = y.split('@')[1]; if (d) drawn.add(d); }
    const sheet = (html.slice(0, 12000).match(/href="[^"]*\/(profolio(?:\.mobile)?\.css)"/) || [])[1];
    const { meta, strings } = extractFile(html, { hide: sheet ? hide[sheet] : null });
    const P = pages.get(f.page) || pages.set(f.page, { files: [], rows: new Map(), notes: new Map(), theme: meta['pf-theme'] || null, frame: meta['pf-frame'] || null }).get(f.page);
    if (f.dev === 'mobile' && meta['pf-frame']) phoneLabel.set(f.page, `@${meta['pf-frame'].split('x')[0]}`);
    const id = `${f.state || 'page'}\u0001${f.dev}`;
    P.files.push(id);
    for (const s of strings) {
      const bucket = s.shell ? shell : P.rows;
      const key = `${s.text}\u0001${s.attr || ''}`;
      let r = bucket.get(key);
      if (!r) { r = { text: s.text, srcs: new Map(), where: new Set(), attr: s.attr, cell: s.cell, c: s.c }; bucket.set(key, r); }
      r.srcs.set(s.src, (r.srcs.get(s.src) || 0) + 1);
      r.where.add(id);
      if (s.shell) (r.pages || (r.pages = new Set())).add(f.page);
    }
    for (const q of noteQuotes(meta['pf-state-note'])) (P.notes.get(q) || P.notes.set(q, new Set()).get(q)).add(id);
  }
  /* the files column, per layout: all, all but a few, or the states it is in */
  const where = (set, all, phone) => {
    const list = (ids) => {
      const names = [...new Set(ids.map((id) => id.split('\u0001')[0]))].sort((a, b) => (a === 'page' ? -1 : b === 'page' ? 1 : a.localeCompare(b)));
      return names.length > max ? `${names.slice(0, max - 2).join(', ')} +${names.length - max + 2} more` : names.join(', ');
    };
    const part = (dev) => {
      const A = all.filter((id) => id.endsWith(`\u0001${dev}`)), S = A.filter((id) => set.has(id));
      if (!S.length) return A.length ? 'none' : null;
      if (S.length === A.length) return 'all';
      const miss = A.filter((id) => !set.has(id));
      return miss.length < S.length ? `all but ${list(miss)}` : list(S);
    };
    const w = part('web'), m = part('mobile');
    if ((w === 'all' || w === null) && (m === 'all' || m === null)) return 'all';
    if (w === 'all' && m === 'none') return `all web, no ${phone}`;
    if (w === 'none' && m === 'all') return `all ${phone}, no web`;
    if (w === m) return `${w} (web and ${phone})`;
    return [w !== null ? `web: ${w}` : null, m !== null ? `${phone}: ${m}` : null].filter(Boolean).join(' · ');
  };
  const out = {};
  const stats = { pages: 0, files: 0, rows: 0, byIs: {} };
  const lookup = new Map();                                /* text → [{ page, is, where }] */
  /* one row per string — and one per pattern, where values are all that
     differ ("Posted on {date}" from one element: one row, ×N) */
  const table = (rows, all, phone, pageName, whereOf = null) => {
    const groups = new Map();
    for (const r of rows) {
      const k = classOf(r);
      const top = [...r.srcs.entries()].sort((a, b) => b[1] - a[1])[0][0];
      const pat = k.pattern || (k.is === 'data' && !k.fixture ? numbers(r.text) : null);
      const key = pat && pat !== r.text ? `${k.is}\u0001${pat}\u0001${top}\u0001${r.attr || ''}` : `\u0002${r.text}\u0001${r.attr || ''}`;
      let g = groups.get(key);
      if (!g) { g = { r, k, pat: pat && pat !== r.text ? pat : null, texts: [], srcs: new Map(), where: new Set(), pages: new Set() }; groups.set(key, g); }
      g.texts.push(r.text);
      for (const [s0, n0] of r.srcs) g.srcs.set(s0, (g.srcs.get(s0) || 0) + n0);
      for (const w0 of r.where) g.where.add(w0);
      for (const p0 of r.pages || []) g.pages.add(p0);
    }
    return [...groups.values()].map((g) => {
      const { r, k } = g;
      /* every class a row carries is one the legend (LEGEND) explains */
      if (!IS_CLASSES.includes(k.is) || (r.attr && !IS_SUFFIXES.includes(r.attr))) throw new Error(`rendered copy: class "${k.is}${r.attr ? ` (${r.attr})` : ''}" is not in the legend — add it to LEGEND`);
      stats.byIs[k.is] = (stats.byIs[k.is] || 0) + 1;
      const src = [...g.srcs.entries()].sort((a, b) => b[1] - a[1]).map(([s0]) => shortSrc(s0));
      const en = g.pat ? `${r.text} ⟨${g.pat}⟩${g.texts.length > 1 ? ` ×${g.texts.length}` : ''}` : r.text;
      const ar = k.is === 't' || k.is === 't+' ? (k.ar || 'no Arabic') : k.is === 'data' ? (k.fixture ? `fixture: ${k.fixture}` : 'value') : (k.ar || 'not in translations');
      const w = whereOf ? `${whereOf(g.where, g.pages)} (${g.pages.size === nPagesAll ? 'every page' : g.pages.size <= 3 ? [...g.pages].join(', ') : `${g.pages.size} pages`})` : where(g.where, all, phone);
      for (const t of g.texts) (lookup.get(t) || lookup.set(t, []).get(t)).push({ page: pageName, is: k.is, where: w, src: src[0], ar, pattern: g.pat });
      const line = `| ${cell(en)} | ${cell(ar)} | ${k.is}${r.attr ? ` (${r.attr})` : ''} | ${cell(src.slice(0, 2).join(' · '))}${src.length > 2 ? ` +${src.length - 2}` : ''} | ${cell(w)} |`;
      return { line, pages: g.pages };
    });
  };
  const HEAD = '| English | Arabic | is | data-pf-src | files |\n|---|---|---|---|---|';
  const drawnAll = new Set([...shell.values(), ...[...pages.values()].flatMap((P) => [...P.rows.values()])].map((r) => r.text));
  const drawnList = [...drawnAll];
  const nPagesAll = new Set([...shell.values()].flatMap((r) => [...r.pages])).size;
  for (const [page, P] of [...pages.entries()].sort()) {
    const phone = phoneLabel.get(page) || '@375';
    const rows = [...P.rows.values()];
    const body = table(rows, P.files, phone, page).map((x) => x.line);
    /* strings a state note names that no file of the page draws */
    /* strings a state note names that no compiled file draws, anywhere */
    const isDrawn = (q) => drawnAll.has(q) || drawnList.some((d) => d.includes(q));
    const noteRows = [...P.notes.entries()].filter(([q]) => !q.split(/\s+[/—–]\s+/).every(isDrawn)).map(([q, ids]) => {
      const k = classify(q, T, F, {});
      stats.byIs.note = (stats.byIs.note || 0) + 1;
      (lookup.get(q) || lookup.set(q, []).get(q)).push({ page, is: 'note', where: where(ids, P.files, phone), ar: k.ar || null });
      return `| ${cell(q)} | ${cell(k.is === 't' || k.is === 't+' ? k.ar || 'no Arabic' : k.is === 'code' && k.ar ? k.ar : 'not in translations')} | note | pf-state-note | ${cell(where(ids, P.files, phone))} |`;
    });
    const web = P.files.filter((x) => x.endsWith('\u0001web')).length, mob = P.files.length - web;
    const partial = T.from && !/translation\.json/.test(T.from) ? `\n**Arabic from the copy tables only** (the product's translation files were not there when this was built): "not in translations" may be wrong — check \`src/locales/ar/translation.json\`.\n` : '';
    const design = P.theme ? `\n**The designer's handover — not yet the product (Profolio 2.0).** These are the build's words, not shipped copy; Arabic is not in the handover. A string beside a translation is one the product already ships.\n` : '';
    out[`product/copy/rendered/${page}.md`] = `# Rendered copy — ${page}
${design}${partial}
Every string the compiled files of \`pages/${page}\` draw — ${web} web, ${mob} phone (${phone}) — in the order first drawn; the header and the rail are in \`_shell.md\`. Quote a string as it is here, with its file. ${LEGEND} data-pf-src: without \`src/\`. files, per layout (web · ${phone}): \`all\`, \`all but\` the states named, the states named, or \`none\`; \`page\` = \`pages/${page}.html\` (\`.mobile.html\` for ${phone}), a state = \`pages/${page}/<state>.html\`.

${HEAD}
${body.join('\n')}${noteRows.length ? `\n${noteRows.join('\n')}` : ''}
`;
    stats.pages++; stats.files += P.files.length; stats.rows += body.length + noteRows.length;
  }
  /* the shell: the header and the rail, and what opens inside them (the
     notifications popover), once — the states that draw it, on how many pages */
  const shellRows = [...shell.values()];
  const nPages = new Set(shellRows.flatMap((r) => [...r.pages])).size;
  /* a shell string's files: most of the files of the pages it is on — say so by layout — or the states that open it */
  const shellWhere = (set, ps) => {
    const on = [...new Set([...ps].flatMap((pg) => pages.get(pg).files))];
    const most = (dev) => { const all = on.filter((id) => id.endsWith(`\u0001${dev}`)); return all.length && [...set].filter((id) => id.endsWith(`\u0001${dev}`)).length >= all.length / 2; };
    const w = most('web'), m = most('mobile');
    if (w || m) return w && m ? 'most files, web and @375' : w ? 'most web files' : 'most @375 files';
    return where(set, on, '@375');
  };
  out['product/copy/rendered/_shell.md'] = `# Rendered copy — the shell

The header and the rail — and what opens inside them, such as the notifications popover — as the compiled pages draw them, web and phone (@375). files: where it shows — on most files of a page, or in the states that open it (\`pages/<page>/<state>.html\`, on any page) — then on how many of the ${nPages} pages with a shell. The rail ships collapsed: its labels show when it expands (hover, \`rail-expanded\`). Columns as in any page's file. ${LEGEND}

${HEAD}
${table(shellRows, null, '@375', '_shell', shellWhere).map(({ line }) => line).join('\n')}
`;
  stats.rows += (out['product/copy/rendered/_shell.md'].match(/^\| (?!English|---)/gm) || []).length;
  return { files: out, stats, lookup, drawn, pages: [...pages.keys()].sort() };
}

/* ── which copy areas a KSA flag hides ───────────────────────────────── */
/* the area a source file's strings are filed under (scripts/build.mjs, areaOf) */
export const areaOfFile = (rel) => {
  const r = rel.replace(/^src\//, '');
  let m = r.match(/^container\/pages\/([^/]+)/); if (m) return `page-${m[1]}`;
  m = r.match(/^components\/common\/([^/]+)/); if (m) return `common-${m[1]}`;
  m = r.match(/^components\/([^/.]+)/); if (m) return m[1];
  m = r.match(/^tenant\/[^/]+\/components\/([^/]+)/); if (m) return `tenant-${m[1]}`;
  if (r.startsWith('layout')) return 'shell';
  return '';
};
/* the source with its comments and string contents blanked, offsets kept */
const mask = (src) => {
  let o = '', i = 0;
  const n = src.length;
  while (i < n) {
    const c = src[i];
    if (c === '/' && src[i + 1] === '*') { const e = src.indexOf('*/', i + 2); const j = e < 0 ? n : e + 2; o += src.slice(i, j).replace(/[^\n]/g, ' '); i = j; continue; }
    if (c === '/' && src[i + 1] === '/' && !/[:\w]$/.test(o.slice(-1))) { const e = src.indexOf('\n', i); const j = e < 0 ? n : e; o += ' '.repeat(j - i); i = j; continue; }
    if (c === "'" || c === '"' || c === '`') {
      let j = i + 1;
      while (j < n && src[j] !== c) { if (src[j] === '\\') j++; else if (c !== '`' && src[j] === '\n') break; j++; }
      o += c + src.slice(i + 1, j).replace(/[^\n]/g, ' ') + (src[j] === c ? c : ''); i = src[j] === c ? j + 1 : j; continue;
    }
    o += c; i++;
  }
  return o;
};
const OPEN = { '(': ')', '{': '}', '[': ']' };
const CLOSE = { ')': '(', '}': '{', ']': '[' };
/* the bracketed expression round `at` in masked source m: [start, end) inside the brackets */
const enclosing = (m, at) => {
  let d = 0, i = at;
  for (; i >= 0; i--) { const c = m[i]; if (CLOSE[c]) d++; else if (OPEN[c]) { if (d === 0) break; d--; } }
  if (i < 0) return null;
  let j = i + 1; d = 0;
  for (; j < m.length; j++) { const c = m[j]; if (OPEN[c]) d++; else if (CLOSE[c]) { if (d === 0) break; d--; } }
  return [i + 1, j];
};
/* top-level positions of an operator inside m[a, b) */
const topLevel = (m, a, b, test) => {
  const out = [];
  let d = 0;
  for (let i = a; i < b; i++) { const c = m[i]; if (OPEN[c]) d++; else if (CLOSE[c]) d--; else if (d === 0) { const k = test(m, i); if (k) out.push([i, k]); } }
  return out;
};
const isTernary = (m, i) => (m[i] === '?' && m[i + 1] !== '.' && m[i + 1] !== '?' && m[i - 1] !== '?' ? 1 : 0);
const isAnd = (m, i) => (m[i] === '&' && m[i + 1] === '&' ? 2 : 0);
const isOr = (m, i) => ((m[i] === '|' && m[i + 1] === '|') || (m[i] === '?' && m[i + 1] === '?') ? 2 : 0);
const isColon = (m, i) => (m[i] === ':' ? 1 : 0);

/* a balanced { … } at m[i] (masked source): its end */
const closeOf = (m, i) => { let d = 0; for (let j = i; j < m.length; j++) { if (OPEN[m[j]]) d++; else if (CLOSE[m[j]]) { d--; if (d === 0) return j; } } return m.length; };
/* an object literal's entries at depth 0: shorthand `Key`, `Key: Ident`, `...Ident` */
const objectEntries = (m, a, b) => {
  const out = [];
  let d = 0, s0 = a;
  const push = (t) => { t = t.trim(); let x; if ((x = t.match(/^\.\.\.([\w$]+)$/))) out.push({ spread: x[1] }); else if ((x = t.match(/^([\w$]+)$/))) out.push({ key: x[1], id: x[1] }); else if ((x = t.match(/^([\w$]+)\s*:\s*([\w$]+)$/))) out.push({ key: x[1], id: x[2] }); };
  for (let i = a; i < b; i++) { const c = m[i]; if (OPEN[c]) d++; else if (CLOSE[c]) d--; else if (c === ',' && d === 0) { push(m.slice(s0, i)); s0 = i + 1; } }
  push(m.slice(s0, b));
  return out;
};

/**
 * The copy areas a KSA tenant flag hides, from the product's source: which
 * files the KSA build reaches at all (imports from src/index.jsx, with the
 * vite aliases for the tenant; a component in a name map — the route table's
 * Page[e.Component], TenantComponents.X — is reached where its name is
 * used), which of them sit only behind a flag whose KSA value switches them
 * off (a route, menu item or JSX branch guarded by `tenantConstants.FLAG`:
 * `...(!tenantConstants.HIDE_INBOX ? {…} : {})`; a sub-key,
 * `tenantConstants.LMS_ENABLED?.X`; a name bound to one, `const v =
 * tenantConstants.X` or `useMemo(() => tenantConstants.X, [])`, then `{v &&
 * <Modal/>}`; a key KSA does not define, which is false; a file's one
 * component that opens `if (!v?.sub) return null;`), and which no compiled
 * screen draws. An area a compiled file draws is never called hidden.
 *   repo       the product checkout (read-only); the flags' values are read
 *              from its src/tenant/<tenant>/constants/constants.js
 *   flagsMd    a flags.md, used only when the constants file is not there
 *   areas      the copy areas (file names without .md)
 *   drawn      Set of source files (src/…) some compiled file's data-pf-src names
 * Returns Map(area → { hidden: 'FLAG=value' | null, why, drawn, at }).
 */
export function copyAreaGates({ repo, tenant = 'bayut', flagsMd, areas, drawn }) {
  const SRC = join(repo, 'src');
  const EXT = ['.js', '.jsx', '.ts', '.tsx'];
  const all = [];
  const walk = (d) => { for (const n of readdirSync(d, { withFileTypes: true })) { const p = join(d, n.name); if (n.isDirectory()) { if (!/^(node_modules|locales|__tests__|__mocks__)$/.test(n.name)) walk(p); } else if (EXT.some((e) => n.name.endsWith(e))) all.push(p); } };
  walk(SRC);
  const rel = (p) => relative(repo, p);
  const fileSet = new Set(all);
  /* the aliases, from vite.config.js, for this tenant */
  const vite = existsSync(join(repo, 'vite.config.js')) ? readFileSync(join(repo, 'vite.config.js'), 'utf8') : '';
  const aliases = [...vite.matchAll(/'(@[\w]*)':\s*resolve\(__dirname,\s*[`'"]([^`'"]+)[`'"]\)/g)].map((m) => [m[1], join(repo, m[2].replace(/\$\{tenantName\}/g, tenant))]).sort((a, b) => b[0].length - a[0].length);
  const resolveSpec = (from, spec) => {
    let base = null;
    if (spec.startsWith('.')) base = join(dirname(from), spec);
    else { const a = aliases.find(([k]) => spec === k || spec.startsWith(`${k}/`)); if (a) base = a[1] + spec.slice(a[0].length); }
    if (!base) return null;
    for (const c of [base, ...EXT.map((e) => base + e), ...EXT.map((e) => join(base, `index${e}`))]) if (fileSet.has(c)) return c;
    return null;
  };
  /* each file: imports (binding → [file, exported name]), exports, name maps */
  const info = new Map();
  for (const f of all) {
    const src = readFileSync(f, 'utf8');
    const m = mask(src);
    const deps = new Set(), binds = new Map(), exp = new Map(), star = [], maps = new Map();
    const bind = (clause, to) => {
      const c = clause.replace(/\s+/g, ' ').trim();
      const def = c.match(/^([\w$]+)/); if (def && def[1] !== 'type') binds.set(def[1], [to, 'default']);
      const st = c.match(/\*\s+as\s+([\w$]+)/); if (st) binds.set(st[1], [to, '*']);
      const br = c.match(/\{([^}]*)\}/); if (br) for (const x of br[1].split(',')) { const mm = x.trim().match(/^([\w$]+)(?:\s+as\s+([\w$]+))?$/); if (mm) binds.set(mm[2] || mm[1], [to, mm[1]]); }
    };
    for (const x of src.matchAll(/import\s+([\w$\s{},*]+?)\s+from\s+['"]([^'"]+)['"]/g)) { const to = resolveSpec(f, x[2]); if (to) { deps.add(to); bind(x[1], to); } }
    for (const x of src.matchAll(/import\s+['"]([^'"]+)['"]/g)) { const to = resolveSpec(f, x[1]); if (to) deps.add(to); }
    for (const x of src.matchAll(/export\s+\{([^}]*)\}\s+from\s+['"]([^'"]+)['"]/g)) { const to = resolveSpec(f, x[2]); if (!to) continue; deps.add(to); for (const y of x[1].split(',')) { const mm = y.trim().match(/^([\w$]+)(?:\s+as\s+([\w$]+))?$/); if (mm) exp.set(mm[2] || mm[1], [to, mm[1]]); } }
    for (const x of src.matchAll(/export\s+\*\s+from\s+['"]([^'"]+)['"]/g)) { const to = resolveSpec(f, x[1]); if (to) { deps.add(to); star.push(to); } }
    for (const x of src.matchAll(/(?:const|let|var)\s+([\w$]+)\s*=\s*(?:React\.)?lazy\(\s*\(\)\s*=>\s*import\(\s*['"]([^'"]+)['"]\s*\)/g)) { const to = resolveSpec(f, x[2]); if (to) { deps.add(to); binds.set(x[1], [to, 'default']); } }
    for (const x of src.matchAll(/import\(\s*['"]([^'"]+)['"]\s*\)|require\(\s*['"]([^'"]+)['"]\s*\)/g)) { const to = resolveSpec(f, x[1] || x[2]); if (to) deps.add(to); }
    /* local exports, and the objects that map a name to a component */
    for (const x of m.matchAll(/export\s+(?:const|let|var|function\*?|class)\s+([\w$]+)/g)) exp.set(x[1], [f, x[1], 'local']);
    for (const x of m.matchAll(/export\s+\{([^}]*)\}(?!\s*from)/g)) for (const y of x[1].split(',')) { const mm = y.trim().match(/^([\w$]+)(?:\s+as\s+([\w$]+))?$/); if (mm) exp.set(mm[2] || mm[1], [f, mm[1], 'local']); }
    const dx = m.match(/export\s+default\s+([\w$]+)\s*;?\s*$/m); if (dx) exp.set('default', [f, dx[1], 'local']);
    for (const x of m.matchAll(/(?:(?:const|let|var)\s+([\w$]+)|export\s+default)\s*=?\s*\{/g)) {
      const open = x.index + x[0].length - 1;
      const ents = objectEntries(m, open + 1, closeOf(m, open));
      if (ents.length && ents.every((e) => e.spread || /^[A-Z]/.test(e.key))) maps.set(x[1] || 'default', ents);
    }
    if (maps.has('default') && !exp.has('default')) exp.set('default', [f, 'default', 'local']);
    info.set(f, { src, m, deps, binds, exp, star, maps });
  }
  /* a name imported from a barrel is the file that defines it */
  const defined = (file, name, seen = new Set()) => {
    const key = `${file}\u0001${name}`;
    if (seen.has(key) || !info.has(file)) return [file, name];
    seen.add(key);
    const I = info.get(file);
    const e = I.exp.get(name);
    if (e && e[2] !== 'local') return defined(e[0], e[1], seen);
    if (e) { const b = I.binds.get(e[1]); return b ? defined(b[0], b[1], seen) : [file, e[1]]; }
    for (const s0 of I.star) { const r = defined(s0, name, seen); if (r[0] !== s0) return r; }
    return [file, name];
  };
  /* a name map's keys → files (with its spreads, later keys winning) */
  const mapKeys = (file, name, seen = new Set()) => {
    const out = new Map();
    const I = info.get(file);
    if (!I || seen.has(`${file}\u0001${name}`)) return out;
    seen.add(`${file}\u0001${name}`);
    for (const e of I.maps.get(name) || []) {
      if (e.spread) { const b = I.binds.get(e.spread); if (b) { const [df, dn] = defined(b[0], b[1]); for (const [k, v] of mapKeys(df, dn === 'default' && info.get(df)?.exp.get('default') ? info.get(df).exp.get('default')[1] : dn, seen)) out.set(k, v); } else for (const [k, v] of mapKeys(file, e.spread, seen)) out.set(k, v); continue; }
      const b = I.binds.get(e.id);
      if (b) out.set(e.key, defined(b[0], b[1])[0]);
    }
    return out;
  };
  const mapOf = (file, name) => { const I = info.get(file); if (!I) return null; const n = name === 'default' && I.exp.get('default') ? I.exp.get('default')[1] : name; return I.maps.has(n) ? mapKeys(file, n) : null; };
  /* by-name edges: map file → key → component file */
  const byName = new Map();                                /* component file → [{ map, key }] */
  for (const [f, I] of info) for (const n of I.maps.keys()) for (const [k, to] of mapKeys(f, n)) (byName.get(to) || byName.set(to, []).get(to)).push({ map: f, key: k });
  /* the KSA build: what src/index.jsx reaches; a map's components are
     reached by name — counted below, not as the map's imports */
  const entry = [join(SRC, 'index.jsx'), join(SRC, 'index.js')].find((x) => fileSet.has(x));
  const mapEdge = (from, to) => (byName.get(to) || []).some((e) => e.map === from);
  const reach = new Set();
  const importers = new Map();
  const stack = entry ? [entry] : [];
  while (stack.length) {
    const f = stack.pop();
    if (reach.has(f)) continue;
    reach.add(f);
    for (const d of info.get(f).deps) { if (!mapEdge(f, d)) (importers.get(d) || importers.set(d, new Set()).get(d)).add(f); if (!reach.has(d)) stack.push(d); }
  }
  /* the flags and their KSA values: every true/false key and sub-key of the
     tenant's constants (flags.mjs parseConstants) — `X`, `X.sub`. A key KSA
     code reads that the constants do not define is undefined, so false — and
     so is a sub-key a literal object lacks. Without the constants file: the
     tables of flagsMd (top-level rows, `↳` sub-rows, "Read, but not defined"). */
  const FLAGS = new Map();                                 /* 'X' | 'X.sub' → true | false */
  const cfile = join(SRC, 'tenant', tenant, 'constants', 'constants.js');
  let definedKeys = null;                                  /* the keys the constants define (null: unknown) */
  const undefKeys = new Set();                             /* without them: the keys flagsMd lists as not defined */
  const objects = new Map();                               /* a literal object key → its sub-keys */
  const isGate = (e) => e.kind === 'const' && /^(true|false)$/.test(e.text);
  if (existsSync(cfile)) {
    const entries = parseConstants(readFileSync(cfile, 'utf8'));
    definedKeys = new Set(entries.map((e) => e.key));
    for (const e of entries) {
      if (isGate(e)) FLAGS.set(e.key, e.text === 'true');
      /* an object whose every entry is a plain key (no spread): a sub-key it lacks is undefined */
      if (e.kind === 'object') { if ((e.children || []).every((c) => c.key)) objects.set(e.key, new Set(e.children.map((c) => c.key))); for (const c of e.children || []) if (isGate(c)) FLAGS.set(`${e.key}.${c.key}`, c.text === 'true'); }
    }
    /* what constants/index.js spreads in beside them (filterConstants …): defined, not flags */
    for (const g of readdirSync(dirname(cfile))) if (g !== 'constants.js' && /\.js$/.test(g)) for (const x of readFileSync(join(dirname(cfile), g), 'utf8').matchAll(/^\s*([A-Z][A-Z0-9_]+)\s*:/gm)) definedKeys.add(x[1]);
  } else {
    const md = String(flagsMd || '');
    for (const x of md.matchAll(/^\| (?:↳ )?`([A-Z0-9_]+(?:\.[\w$]+)?)` \| `?(true|false)`? \|/gm)) FLAGS.set(x[1], x[2] === 'true');
    const undef = md.split(/^## Read, but not defined/m)[1];
    if (undef) for (const x of undef.matchAll(/^\| `([A-Z0-9_]+)` \|/gm)) undefKeys.add(x[1]);
  }
  const isUndef = (key) => (definedKeys ? !definedKeys.has(key) : undefKeys.has(key));
  /* a read `X` / `X.sub` → { name, v, undef } — or null: not a flag's truth */
  const flagOf = (key, sub) => {
    if (sub) {
      if (FLAGS.has(`${key}.${sub}`)) return { name: `${key}.${sub}`, v: FLAGS.get(`${key}.${sub}`) };
      if (objects.has(key) && !objects.get(key).has(sub)) return { name: `${key}.${sub}`, v: false, undef: true };
      if (isUndef(key)) return { name: key, v: false, undef: true };
      return null;
    }
    if (FLAGS.has(key)) return { name: key, v: FLAGS.get(key) };
    if (isUndef(key)) return { name: key, v: false, undef: true };
    return null;
  };
  const flagLabel = (fl) => (fl.undef ? `${fl.name} (not defined for KSA)` : `${fl.name}=${fl.v}`);
  const constFile = (to) => to && /\/tenant\/[^/]+\/constants\//.test(to);
  /* the route table's names → files (home.js: Page[e.Component], Page = src/container) */
  const routeMap = mapOf(join(SRC, 'container', 'index.js'), 'default') || new Map();
  /* every guarded branch a KSA value switches off */
  const hiddenEntry = new Map();                          /* file → Set('FLAG=value @ file:line') */
  const selfHidden = new Map();                           /* file → Set(why): its one component returns null for KSA */
  const offRanges = new Map();                            /* file → [[a, b, why]] */
  const PROP = '(?:\\s*\\??\\.\\s*([A-Za-z_$][\\w$]*))?';
  for (const f of reach) {
    const { src, m, binds } = info.get(f);
    const consts = [...binds.entries()].filter(([, [to]]) => constFile(to)).map(([k]) => k);
    if (!consts.length) continue;
    const C = consts.map(reEsc).join('|');
    /* the reads: `tenantConstants.X`, `?.X.sub`, and a name bound to one —
       `const v = tenantConstants.X` (`|| {}`), `useMemo(() => tenantConstants.X, [])` */
    const reads = [];
    for (const x of m.matchAll(new RegExp(`\\b(?:${C})\\s*\\??\\.\\s*([A-Z][A-Z0-9_]*)\\b${PROP}`, 'g'))) reads.push({ at: x.index, len: x[0].length, key: x[1], sub: x[2] || null });
    const aliasRe = new RegExp(`\\b(?:const|let|var)\\s+([\\w$]+)\\s*=\\s*(?:(?:React\\.)?use(?:Memo|Callback)\\(\\s*\\(\\s*\\)\\s*=>\\s*)?\\(?\\s*(?:${C})\\s*\\??\\.\\s*([A-Z][A-Z0-9_]*)\\b${PROP}\\s*\\)?\\s*(?:(?:\\|\\||\\?\\?)\\s*\\{\\s*\\}\\s*)?(?:,\\s*\\[[^\\]]*\\]\\s*\\))?\\s*(?=;|\\n)`, 'g');
    const aliases = new Map();                             /* name → { key, sub } */
    for (const x of m.matchAll(aliasRe)) aliases.set(x[1], { key: x[2], sub: x[3] || null, from: x.index + x[0].length });
    for (const [name, al] of aliases) {
      for (const x of m.matchAll(new RegExp(`(?<![\\w$.])${reEsc(name)}(?![\\w$])${PROP}`, 'g'))) {
        if (x.index < al.from || /\b(?:const|let|var)\s+$/.test(m.slice(Math.max(0, x.index - 8), x.index))) continue;
        if (al.sub && x[1]) continue;                       /* a property of a flag's value */
        reads.push({ at: x.index, len: x[0].length, key: al.key, sub: al.sub || x[1] || null, via: name });
      }
    }
    /* a term of a condition: a flag's KSA truth, or undefined */
    const termOf = (t0) => {
      let t = t0.trim(), neg = 0;
      for (;;) { const n = t.match(/^!\s*/); if (n) { neg++; t = t.slice(n[0].length); continue; } const p = t.match(/^\(\s*([\s\S]*?)\s*\)$/); if (p && !/[()]/.test(p[1])) { t = p[1]; continue; } break; }
      let r = t.match(new RegExp(`^(?:${C})\\s*\\??\\.\\s*([A-Z][A-Z0-9_]*)${PROP}$`));
      let fl = r ? flagOf(r[1], r[2] || null) : null;
      if (!r) { r = t.match(new RegExp(`^([\\w$]+)${PROP}$`)); const al = r && aliases.get(r[1]); if (al && !(al.sub && r[2])) fl = flagOf(al.key, al.sub || r[2] || null); }
      return fl ? (neg % 2 ? !fl.v : fl.v) : undefined;
    };
    const lineOf = (i) => src.slice(0, i).split('\n').length;
    for (const x of reads.sort((p, q) => p.at - q.at)) {
      const fl = flagOf(x.key, x.sub);
      if (!fl) continue;
      const at = x.at;
      const box = enclosing(m, at);
      if (!box) continue;
      const [a, b] = box;
      /* `if (<false for KSA>) return null;` at the top of a file's one component: it draws nothing */
      if (m[a - 1] === '(' && /\bif\s*$/.test(m.slice(Math.max(0, a - 8), a - 1)) && !topLevel(m, a, b, isOr).length) {
        const terms = m.slice(a, b).split('&&').map(termOf);
        const ret = m.slice(b + 1, b + 80).match(/^\s*\{?\s*return\b[ \t]*(?:null|undefined|false|<>\s*<\/>)?[ \t]*(?:;|\n|\})/);
        const fnBody = enclosing(m, m.lastIndexOf('if', a - 1));
        if (terms.every((v) => v === true) && ret && fnBody && m[fnBody[0] - 1] === '{') {
          const head = m.slice(Math.max(0, fnBody[0] - 240), fnBody[0] - 1);
          const comp = head.match(/(?:\bfunction\s+([A-Z][a-z]\w*)\s*\([^()]*\)|\b(?:const|let|var)\s+([A-Z][a-z]\w*)\s*=\s*(?:(?:React\.)?(?:memo|forwardRef)\(\s*)?(?:\([^()]*\)|[\w$]+)\s*=>)\s*$/);
          const comps = new Set([...m.matchAll(/(?:\bfunction\s+([A-Z][a-z]\w*)\s*\(|\b(?:const|let|var)\s+([A-Z][a-z]\w*)\s*=\s*(?:(?:React\.)?(?:memo|forwardRef)\(\s*)?(?:\([^()]*\)\s*=>|[\w$]+\s*=>|function\b))/g)].map((y) => y[1] || y[2]));
          if (comp && comps.size === 1) {
            const why = `${flagLabel(fl)} @ ${rel(f).replace(/^src\//, '')}:${lineOf(at)}`;
            (selfHidden.get(f) || selfHidden.set(f, new Set()).get(f)).add(why);
            (offRanges.get(f) || offRanges.set(f, []).get(f)).push([b, fnBody[1], why]);
          }
        }
        continue;
      }
      const q = topLevel(m, a, b, isTernary).find(([i]) => i > at);
      const ands = topLevel(m, a, b, isAnd);
      let condEnd, cons, alt = null;
      if (q && !topLevel(m, a, q[0], isTernary).length) {
        condEnd = q[0];
        const colon = topLevel(m, q[0] + 1, b, isColon)[0];
        cons = [q[0] + 1, colon ? colon[0] : b];
        if (colon) alt = [colon[0] + 1, b];
      } else if (ands.length && ands[ands.length - 1][0] > at) {
        const last = ands[ands.length - 1];
        condEnd = last[0]; cons = [last[0] + 2, b];
      } else continue;
      if (at > condEnd || topLevel(m, a, condEnd, isOr).length) continue;
      /* each && term that is a flag (or a name bound to one): its KSA truth; any other term leaves it open */
      let decided = true, value = true;
      for (const term of m.slice(a, condEnd).split('&&')) {
        const v = termOf(term);
        if (v !== undefined) value = value && v;
        else if (term.trim()) decided = false;
      }
      const off = !value ? cons : decided && alt ? alt : null;
      if (!off) continue;
      const why = `${flagLabel(fl)} @ ${rel(f).replace(/^src\//, '')}:${lineOf(at)}`;
      (offRanges.get(f) || offRanges.set(f, []).get(f)).push([off[0], off[1], why]);
      const body = src.slice(off[0], off[1]);
      const ids = new Set([...body.matchAll(/<([A-Z][\w$]*)/g)].map((y) => y[1]));
      const strs = new Set([...body.matchAll(/\b[Cc]omponent\s*:\s*['"]([A-Z][\w$]*)['"]/g)].map((y) => y[1]));
      for (const y of body.matchAll(/\b[Cc]omponent\s*:\s*([A-Z][\w$]*)/g)) ids.add(y[1]);
      const hit = (to) => { if (to && reach.has(to)) (hiddenEntry.get(to) || hiddenEntry.set(to, new Set()).get(to)).add(why); };
      for (const id of ids) { const b0 = binds.get(id); if (b0) hit(defined(b0[0], b0[1])[0]); }
      for (const k of strs) hit(routeMap.get(k));
    }
  }
  const inOff = (f, i) => (offRanges.get(f) || []).find(([a, b]) => i >= a && i < b);
  /* who uses a map's component by its name, outside a switched-off branch:
     `Binding.Key` on a binding of that map, or the string 'Key' of a route */
  const nameUses = (to) => {
    const live = new Set(), dead = new Set();
    for (const { map, key } of byName.get(to) || []) {
      for (const f of reach) {
        if (f === map) continue;
        const I = info.get(f);
        const bs = [...I.binds.entries()].filter(([, [bf, bn]]) => { const [df] = defined(bf, bn); return df === map; }).map(([k]) => k);
        const hits = [];
        for (const b0 of bs) for (const y of I.m.matchAll(new RegExp(`\\b${b0}\\??\\.${key}\\b`, 'g'))) hits.push(y.index);
        if (map === join(SRC, 'container', 'index.js')) for (const y of I.src.matchAll(new RegExp(`[Cc]omponent\\s*:\\s*['"]${key}['"]`, 'g'))) hits.push(y.index);
        for (const i of hits) { const o = inOff(f, i); (o ? dead : live).add(o ? `${f}\u0001${o[2]}` : f); }
      }
    }
    return { live, dead };
  };
  /* hidden: a switched-off entry, or a file only hidden files use */
  const drawnAbs = new Set([...drawn].map((d) => join(repo, d)));
  const hidden = new Map([...hiddenEntry, ...selfHidden].filter(([f]) => !drawnAbs.has(f)).map(([f, w]) => [f, new Set([...(hiddenEntry.get(f) || []), ...(selfHidden.get(f) || [])])]));
  const uses = new Map([...byName.keys()].filter((f) => reach.has(f)).map((f) => [f, nameUses(f)]));
  for (let changed = true; changed;) {
    changed = false;
    for (const f of reach) {
      if (hidden.has(f) || drawnAbs.has(f) || f === entry) continue;
      const imp = [...(importers.get(f) || [])].filter((x) => reach.has(x));
      const u = uses.get(f);
      const liveNames = u ? [...u.live].filter((x) => !hidden.has(x)) : [];
      const deadNames = u ? [...u.dead].map((x) => x.split('\u0001')[1]).concat([...u.live].filter((x) => hidden.has(x)).flatMap((x) => [...hidden.get(x)])) : [];
      if (liveNames.length) continue;
      if (!imp.length && !deadNames.length) continue;
      if (imp.every((x) => hidden.has(x))) { hidden.set(f, new Set([...imp.flatMap((x) => [...hidden.get(x)]), ...deadNames])); changed = true; }
    }
  }
  /* the areas */
  const out = new Map();
  for (const area of areas) {
    const files = all.filter((f) => areaOfFile(rel(f)) === area);
    const inBuild = files.filter((f) => reach.has(f));
    const drawnN = files.filter((f) => drawnAbs.has(f)).length;
    if (drawnN) { out.set(area, { hidden: null, why: 'drawn', drawn: drawnN }); continue; }
    if (!inBuild.length) { out.set(area, { hidden: null, why: files.length ? 'not in the KSA build' : 'no source', drawn: 0 }); continue; }
    const hid = inBuild.filter((f) => hidden.has(f));
    if (hid.length) {
      const whys = [...new Set(hid.flatMap((f) => [...hidden.get(f)]))];
      const flags = [...new Set(whys.map((w) => w.split(' @ ')[0]))];
      out.set(area, { hidden: flags.join(', '), why: hid.length === inBuild.length ? 'hidden' : 'partly hidden', at: whys.map((w) => w.split(' @ ')[1]).slice(0, 3), drawn: 0 });
    } else out.set(area, { hidden: null, why: 'no compiled screen draws it', drawn: 0 });
  }
  return out;
}

/**
 * product/copy.md: the translation tables' index, with the areas a flag
 * hides, and the pointer to what the renders show.
 *   areas   [{ area, strings }] — the copy/<area>.md files
 *   gates   copyAreaGates() (or null)
 *   pages   the rendered/<page>.md names
 */
export function copyMd({ areas, gates = null, pages = [] }) {
  const hidden = (a) => {
    const g = gates && gates.get(a);
    if (!g) return gates ? '—' : 'not derived';
    if (g.hidden) return `${g.hidden}${g.why === 'partly hidden' ? ' (part)' : ''}${g.at && g.at.length ? ` — \`${g.at[0]}\`${g.at.length > 1 ? ` +${g.at.length - 1}` : ''}` : ''}`;
    return g.why === 'drawn' ? '' : g.why === 'no source' ? '—' : g.why;
  };
  return `# Copy — the product's own strings

English beside Arabic, verbatim, from the product's translation files and code — one file per area. Use these exact words. These are the translation strings. A compiled render carries more shipped text (relative dates, date presets, API messages, hard-coded labels): see \`copy/rendered/<page>.md\` — every string each page's compiled files draw, with its Arabic, where it is drawn and whether it is a translation, code, or the fixture's data (\`_shell.md\`: the header and the rail). Before calling a string new, or claiming the product never says something, grep \`copy/rendered/\` (or \`pages/\`). Quote a render-only string with its file path, character for character. A string in neither is new copy, marked \`data-pf-new-copy\` and put to the designer in both languages.

**hidden by**: an area no compiled screen draws, and why — a KSA flag that switches it off, with the line that reads it (\`FLAG=false\`, \`OBJ.SUB=false\`, or \`FLAG (not defined for KSA)\`, which is false: its strings never show in KSA — never cite them as shipped), not in the KSA build (another tenant's), or no compiled screen draws it (reachable, not compiled). Blank: drawn.

| area | strings | file | hidden by |
|---|---|---|---|
${areas.map(({ area, strings }) => `| ${area} | ${strings} | copy/${area}.md | ${hidden(area)} |`).join('\n')}

Rendered: ${pages.map((p) => `\`copy/rendered/${p}.md\``).join(' · ')}
`;
}
