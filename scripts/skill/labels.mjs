/**
 * What a page and a component SHOW — read out of their compiled DOM.
 *
 * registry.json said what a page is made of (components, flags, states) but
 * not what it says: a session had to fetch a 0.3–1.5 MB page file to learn
 * that TruLeads already has a "Last Interaction" column, or that the phone's
 * lead card shows the next task's date and time (cold test, defect 6). This
 * module reads the compiled files and returns, per page, the visible labels by
 * region (registry pages[x].labels, with the full detail in
 * product/pages/<page>.md), and per component a terse part list
 * (registry components[x].anatomy).
 *
 * Everything is measured from the files. The regions are antd's own structure
 * (tabs, form items, table heads, cards, buttons, headings, empty blocks) and
 * the data-pf-i component markers. A text is a LABEL when the structure says
 * so (a <th>, a tab, a form label, a button, a placeholder, a heading), or
 * when every repeated item draws the same text at the same place (every lead
 * card says "Interested In"). Otherwise it is fixture DATA, written as its
 * kind — ‹date›, ‹time›, ‹n›, ‹text› … — never as the fixture's value; texts
 * that differ from item to item but are all the product's own copy are kept
 * as alternatives (Call|WhatsApp). The product's copy is what the caller
 * passes (package.mjs: product/copy and every translation of the product —
 * "To Rent" and "Basic Listing" are the product's even where the fixture
 * writes them too); the fixture's strings are harness/fixtures, its string
 * literals and the templates it spells titles with. A number inside a label
 * is ‹n› ("‹n› Users"), a fixture name inside one is masked whole-word only,
 * and the map's missing-key message is ‹map› (the recorder's environment).
 *
 * Held to Chromium (visible text, JS off, 1440 and 375) on lms-leads,
 * dashboard, listings, agency-staff, post-listing-upgrade and credits-usage
 * with their role and empty files, 2026-09-29: every translation those files
 * show is in a region, but for the app banner above the layout (the shell's)
 * and the upgrade's service descriptions (a card's ‹text›).
 *
 * Visibility is decided statically — a compiled file keeps closed dropdowns,
 * hidden tab panes and clear icons in its DOM. The rules below agree with a
 * browser render (Chromium, checkVisibility + client rects) on every text node
 * of the content of the 168 default, role and empty files, 2026-09-29.
 *
 * Pure functions, node stdlib only, but for the route patterns, which are
 * pages-meta.mjs's (routesFor) when the caller does not pass them.
 * scripts/package.mjs calls buildLabels().
 */
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { routesFor } from './pages-meta.mjs';

/* ── parsing: a compiled page is serialised DOM, so every non-void element
      has its end tag and the tree comes back exactly ───────────────────── */
const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr', 'param']);
const RAW = new Set(['script', 'style', 'textarea', 'title']);
const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
const decode = (s) => (s.indexOf('&') < 0 ? s : s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
  if (e[0] === '#') { const n = /^#x/i.test(e) ? parseInt(e.slice(2), 16) : +e.slice(1); return Number.isFinite(n) ? String.fromCodePoint(n) : m; }
  return ENT[e.toLowerCase()] ?? m;
}));
const ATTR = /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;

export function parseHtml(html) {
  const root = { tag: '#root', a: {}, k: [], p: null };
  let cur = root, i = 0;
  const n = html.length;
  while (i < n) {
    const lt = html.indexOf('<', i);
    if (lt < 0) { cur.k.push(decode(html.slice(i))); break; }
    if (lt > i) cur.k.push(decode(html.slice(i, lt)));
    if (html.startsWith('<!--', lt)) { const e = html.indexOf('-->', lt + 4); i = e < 0 ? n : e + 3; continue; }
    const c1 = html[lt + 1];
    if (c1 === '!' || c1 === '?') { const e = html.indexOf('>', lt); i = e < 0 ? n : e + 1; continue; }
    if (c1 === '/') {
      const e = html.indexOf('>', lt); const t = html.slice(lt + 2, e < 0 ? n : e).trim().toLowerCase();
      let x = cur; while (x && x.raw !== t) x = x.p;
      if (x && x.p) cur = x.p;
      i = e < 0 ? n : e + 1; continue;
    }
    let j = lt + 1, q = null;
    for (; j < n; j++) { const c = html[j]; if (q) { if (c === q) q = null; } else if (c === '"' || c === "'") q = c; else if (c === '>') break; }
    const inner = html.slice(lt + 1, j);
    const m = inner.match(/^([a-zA-Z][\w:-]*)/);
    if (!m) { cur.k.push('<'); i = lt + 1; continue; }
    const tag = m[1].toLowerCase();
    const a = {};
    for (const x of inner.slice(m[1].length).matchAll(ATTR)) a[x[1].toLowerCase()] = decode(x[2] ?? x[3] ?? x[4] ?? '');
    /* the DOM-only nestings a compiled page writes as <pf-el data-pf-tag> (scripts/lib/nested-a.mjs) */
    const el = { tag: tag === 'pf-el' && a['data-pf-tag'] ? a['data-pf-tag'] : tag === 'pf-nested-a' ? 'a' : tag, raw: tag, a, k: [], p: cur, r: root };
    if (tag === 'meta' && a.name === 'pf-device') root.dev = a.content;
    cur.k.push(el);
    i = j + 1;
    if (VOID.has(tag) || inner.endsWith('/')) continue;
    if (RAW.has(tag)) {
      const re = new RegExp(`</${tag}\\s*>`, 'ig'); re.lastIndex = i;
      const e = re.exec(html);
      if (tag === 'textarea' || tag === 'title') el.k.push(decode(html.slice(i, e ? e.index : n)));
      i = e ? e.index + e[0].length : n; continue;
    }
    cur = el;
  }
  return root;
}

/* ── the tree ─────────────────────────────────────────────────────────── */
const isEl = (x) => typeof x !== 'string';
const classOf = (el) => (el.cls || (el.cls = (el.a.class || '').split(/\s+/).filter(Boolean)));
const hasC = (el, c) => isEl(el) && classOf(el).includes(c);
const hasRe = (el, re) => isEl(el) && classOf(el).some((c) => re.test(c));
function* walk(el) { yield el; if (isEl(el)) for (const k of el.k) yield* walk(k); }
const findAll = (el, pred) => { const out = []; for (const x of walk(el)) if (isEl(x) && pred(x)) out.push(x); return out; };
const find = (el, pred) => { for (const x of walk(el)) if (isEl(x) && pred(x)) return x; return null; };
const up = (el, pred) => { for (let x = el; x; x = x.p) if (pred(x)) return x; return null; };
const within = (el, box) => !!up(el, (y) => y === box);
/* the component instances rooted at an element (data-pf-i, outermost first) */
const instOf = (el) => (el.a && el.a['data-pf-i'] ? el.a['data-pf-i'].split(/\s+/).filter(Boolean) : []);
const instNames = (el) => instOf(el).map((x) => x.split('@')[0]);

/* ── visibility: what a browser does not paint ────────────────────────── */
/* the classes the compiled files carry for a thing in the DOM but closed
   (every class of theirs that says so, 2026-09-29) — not every class that
   ends in -hidden: swiper-backface-hidden is painted */
const HIDDEN_CLASS = new Set(['pf-tabs-nav-operations-hidden', 'pf-input-clear-icon-hidden', 'pf-tabs-tabpane-hidden', 'pf-select-dropdown-hidden',
  'pf-drawer-content-wrapper-hidden', 'pf-picker-dropdown-hidden', 'pf-tooltip-hidden', 'pf-dropdown-hidden', 'pf-popover-hidden', 'pf-dropdown-menu-hidden', 'd-none']);
const HIDDEN_STYLE = /(^|;)\s*(display:\s*none|visibility:\s*hidden|opacity:\s*0(\.0+)?\s*(;|$))/;
const hiddenSelf = (el) => {
  if (el.tag === 'option' || el.a.hidden !== undefined) return true;
  if (el.a.style && HIDDEN_STYLE.test(el.a.style)) return true;
  return classOf(el).some((c) => HIDDEN_CLASS.has(c) || (el.r && el.r.dev === 'mobile' && /^_hiddenOnMobile_/.test(c)));
};
export const hidden = (el) => { for (let x = el; x && x.tag !== '#root'; x = x.p) if (isEl(x) && hiddenSelf(x)) return true; return false; };

/* the riyal is an icon-font glyph with no text of its own */
const RIYAL = (el) => hasC(el, 'currency-Saudi_Riyal_Symbol');
const SKIP = new Set(['script', 'style', 'svg', 'noscript', 'template', 'head']);
/* what the harness's environment draws, not the product as it ships: the map
   says its API key is missing (post-listing/google-map/google-map.js:211,
   REACT_APP_GOOGLE_MAPS_API_KEY is not set for the recorder) — the map's place */
const ENV = /\bREACT_APP_[A-Z0-9_]+|\.env file\b/;
const envText = (t) => (ENV.test(t) ? (/map/i.test(t) ? '‹map›' : '‹environment›') : t);
/* every visible text under el, in document order, with its element */
export function leaves(el) {
  const out = [];
  const rec = (x, parent) => {
    if (!isEl(x)) { const t = x.replace(/\s+/g, ' ').trim(); if (t) out.push({ t: envText(t), el: parent }); return; }
    if (SKIP.has(x.tag) || hiddenSelf(x)) return;
    if (RIYAL(x)) { out.push({ t: '‹riyal›', el: x }); return; }
    x.k.forEach((k) => rec(k, x));
  };
  if (!hidden(el)) rec(el, el.p);
  return out;
}
export const textOf = (el) => leaves(el).map((l) => l.t).join(' ').replace(/\s+/g, ' ').replace(/\( ‹riyal› \)/g, '(‹riyal›)').trim();

/* ── what a text is: a label, or fixture data of some kind ──────────────── */
const MON = '(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*';
const KINDS = [
  ['date', new RegExp(`^(?:\\d{1,2}(?:st|nd|rd|th)? ${MON},? \\d{4}|${MON} \\d{1,2}(?:st|nd|rd|th)?,? \\d{4}|\\d{1,2}[/.-]\\d{1,2}[/.-]\\d{2,4}|\\d{4}-\\d{2}-\\d{2}|${MON},? \\d{4}|\\d{1,2} ${MON}|${MON} \\d{1,2})(?:,?\\s+(?:at\\s+)?\\d{1,2}:\\d{2}(?::\\d{2})?\\s?(?:am|pm)?)?$`, 'i')],
  ['time', /^\d{1,2}:\d{2}(?::\d{2})?\s?(?:am|pm)?$/i],
  ['ago', /^(?:an?|\d+|few) (?:seconds?|minutes?|hours?|days?|weeks?|months?|years?) ago$|^just now$/i],
  ['email', /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i],
  ['phone', /^\+\d[\d\s-]{7,}$|^0\d{8,9}$/],
  ['%', /^[+-]?\d[\d,.]*\s?%$/],
  ['duration', /^(?:\d+\s?[hms]\s?)+$/],
  ['id', /^(?:ID[:\s#]*)?\d{6,}$/i],
  ['n', /^[+-]?(?:\d[\d,]*(?:\.\d+)?|\.\d+)\s?[KkMm]?$|^#\d+$|^\d+\s?\/\s?\d+$|^\(\d[\d,]*\)$|^\d+\+$/],
];
/* a date written with a time first, or any short run of a month's name and numbers ("3:45 am, Oct 12 2026") */
const DATEISH = new RegExp(`^(?=.*\\b${MON}\\b)(?=.*\\d)[\\w\\s,:./-]{5,32}$`, 'i');
export const kindOf = (t) => { for (const [k, re] of KINDS) if (re.test(t)) return k; return DATEISH.test(t) && t.split(/\s+/).length <= 6 ? 'date' : null; };
const COUNT = /^\(\d[\d,]*\)$/;                          /* a tab's count, kept as rendered */
const NOISE = /^[-–—•·|/:,.()*+›‹]+$/;
const uniq = (a) => [...new Set(a.filter(Boolean))];
const clean = (t) => t.replace(/\s*:$/, '').replace(/^\*\s*/, '').trim();
/* the product's string, with or without its colon ("REGA ID:" is a translation as written) */
const isCopy = (copy, t) => copy.has(t) || copy.has(clean(t));
/* a script's template literals, each as its text pieces around its ${…}
   (nested templates too) — the fixture writes its listing titles as
   `${beds} Bedroom ${type} for ${…} in ${district}, ${city}` */
export function templatePieces(code) {
  const out = [];
  const n = code.length;
  let i = 0;
  const str = (q) => { i++; while (i < n && code[i] !== q && code[i] !== '\n') i += code[i] === '\\' ? 2 : 1; i++; };
  const tpl = () => {
    i++;
    const pieces = [''];
    while (i < n && code[i] !== '`') {
      if (code[i] === '\\') { pieces[pieces.length - 1] += code[i + 1] || ''; i += 2; continue; }
      if (code[i] === '$' && code[i + 1] === '{') { i += 2; expr(); pieces.push(''); continue; }
      pieces[pieces.length - 1] += code[i++];
    }
    i++;
    if (pieces.length > 1) out.push(pieces);
  };
  const expr = () => {
    for (let depth = 0; i < n;) {
      const c = code[i];
      if (c === "'" || c === '"') { str(c); continue; }
      if (c === '`') { tpl(); continue; }
      if (c === '{') depth++;
      else if (c === '}') { if (!depth) { i++; return; } depth--; }
      i++;
    }
  };
  while (i < n) {
    const c = code[i];
    if (c === '/' && code[i + 1] === '*') { const e = code.indexOf('*/', i + 2); i = e < 0 ? n : e + 2; continue; }
    if (c === '/' && code[i + 1] === '/') { const e = code.indexOf('\n', i); i = e < 0 ? n : e; continue; }
    if (c === "'" || c === '"') { str(c); continue; }
    if (c === '`') { tpl(); continue; }
    i++;
  }
  return out;
}
const reEsc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/* the fixture's own strings: a text found among them is data. Only string
   literals count, not the comments that explain them. */
export function fixtureData(sources) {
  const lits = new Set();
  const tpls = [];
  for (const src of sources) {
    const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`\\])\/\/[^\n]*/g, '$1');
    for (const m of code.matchAll(/'((?:[^'\\\n]|\\.)*)'|"((?:[^"\\\n]|\\.)*)"|`((?:[^`\\]|\\.)*)`/g)) { const t = (m[1] ?? m[2] ?? m[3]).trim(); if (t.length >= 3) lits.add(t); }
    /* a template with words of its own: a text it spells with a word in a
       placeholder is data ("2 Bedroom Apartment for Rent in Al Aqiq, Riyadh");
       one it spells with numbers only is a label with numbers ("140 Sq. M.") */
    for (const p of templatePieces(src)) {
      const ps = p.map((x) => x.replace(/\s+/g, ' '));
      if ((ps.join('').match(/\p{L}/gu) || []).length < 4 || !ps.some((x) => /\p{L}{3}/u.test(x))) continue;
      tpls.push(new RegExp(`^${ps.map(reEsc).join('(.+?)')}$`, 'u'));
    }
  }
  const blob = `\n${[...lits].join('\n')}\n`;
  /* names and titles, not words: a literal with a space in it */
  const long = [...lits].filter((t) => t.length >= 8 && /^[A-Z\u0600-\u06FF]/.test(t) && / /.test(t) && !/[{}<>()=;]/.test(t)).sort((a, b) => b.length - a.length);
  const isData = (t) => {
    const x = t.replace(/(\.\.\.|…)$/, '').trim();
    if (x.length < 3) return false;
    if (lits.has(x) || (x.length >= 6 && blob.includes(x))) return true;
    for (const re of tpls) { const m = x.match(re); if (m && m.slice(1).some((g) => /\p{L}/u.test(g))) return true; }
    const parts = x.split(/,\s*/);
    return parts.length > 1 && parts.every((q) => lits.has(q));
  };
  /* a label that carries fixture data inside it: "by Faisal Al-Harbi" → "by ‹text›" —
     whole words only: "Daily Rental" is not masked inside "Daily Rentals" */
  const word = new Map();
  const wordRe = (l) => word.get(l) || word.set(l, new RegExp(`(?<![\\p{L}\\p{N}])${reEsc(l)}(?![\\p{L}\\p{N}])`, 'gu')).get(l);
  isData.mask = (t, copy) => { if (copy && copy.has(t)) return t; let o = t; for (const l of long) if (o !== l && o.includes(l) && !(copy && copy.has(l))) o = o.replace(wordRe(l), '‹text›'); return o; };
  return isData;
}
const noData = Object.assign(() => false, { mask: (t) => t });
/* shipped words: the product's copy always, else anything the fixture did not write */
const shipped = (t, copy, data) => !kindOf(t) && (isCopy(copy, t) || !data(t));

/* ── elements ───────────────────────────────────────────────────────────── */
const isBtn = (el) => el.tag === 'button' || hasC(el, 'pf-btn');
const isPrimary = (b) => hasC(b, 'pf-btn-primary') || (hasC(b, 'pf-btn-variant-solid') && hasC(b, 'pf-btn-color-primary'));
const HEAD_CLASS = new Set(['pf-card-head-title', 'pf-modal-title', 'pf-drawer-title', 'pf-page-header-heading-title', 'pf-descriptions-title', 'pf-result-title', 'pf-collapse-header-text', 'pf-list-header', 'pf-typography-title']);
const isHeading = (el) => /^h[1-6]$/.test(el.tag) || classOf(el).some((c) => HEAD_CLASS.has(c));
const CHOICE = /^pf-(checkbox|radio|radio-button|switch)-wrapper$|^pf-segmented-item$/;
const isLabel = (el) => (el.tag === 'label' ? !hasRe(el, CHOICE) : hasC(el, 'pf-form-item-label') || hasRe(el, /^pf-label-styled/));
const isEntry = (el) => (el.tag === 'input' && !/^(hidden|radio|checkbox|file)$/.test(el.a.type || '') && !hasC(el, 'pf-select-selection-search-input'))
  || el.tag === 'textarea' || hasC(el, 'pf-select') || hasC(el, 'pf-picker') || hasC(el, 'pf-radio-group') || hasC(el, 'pf-input-number') || hasC(el, 'pf-slider');
const isControl = (el) => isEntry(el) || hasC(el, 'pf-checkbox-wrapper') || hasC(el, 'pf-switch') || hasC(el, 'pf-upload');
const FILTER_BOX = (el) => hasRe(el, /filter/i) && !hasC(el, 'dateFilter');
const PAGER = (el) => hasRe(el, /pagination|rows-per-page/);
const isEmptyBlock = (el) => hasC(el, 'pf-empty') || hasC(el, 'pf-empty-state-wrapper') || hasC(el, 'pf-result') || instNames(el).some((n) => /^Empty(State|StateBlock)?$|NoData|NoRecord/.test(n));
const OVERLAY = (el) => classOf(el).some((c) => /^pf-(modal-root|drawer|popover|dropdown|select-dropdown|picker-dropdown|tour|tooltip|message|notification)$/.test(c));
/* where the page's own content is: the layout's main, and any overlay open
   over it (invite is a modal) — never the shell's header and rail */
function contentRoots(root) {
  const main = find(root, (x) => x.tag === 'main' && hasC(x, 'pf-layout-content')) || find(root, (x) => x.tag === 'main');
  const app = find(root, (x) => x.a.id === 'root');
  const overlays = findAll(root, (x) => OVERLAY(x) && !(app && within(x, app) && main && within(x, main)) && !up(x.p, OVERLAY) && !hidden(x) && leaves(x).length > 0);
  if (main) return [main, ...overlays];
  return [find(root, (x) => x.tag === 'body') || root];
}

/* one field: label [placeholder] =shown value {options}, and the elements it
   was read from (its box's other texts — a card's title, its figures — are
   the page's, not the field's) */
function fieldOf(box, { copy, data, used }) {
  const took = [], more = [];
  const all = (el, pred) => { const r = findAll(el, (x) => pred(x) && !used.has(x)); took.push(...r); return r; };
  const labs = all(box, (x) => isLabel(x) && !hidden(x) && !up(x.p, (y) => y !== box && within(y, box) && isLabel(y)));
  const lab = uniq(labs.map((x) => clean(textOf(x))));
  const ph = uniq([
    ...all(box, (x) => (x.tag === 'input' || x.tag === 'textarea') && x.a.placeholder && !hidden(x)).map((x) => x.a.placeholder.trim()),
    ...all(box, (x) => hasC(x, 'pf-select-selection-placeholder') && !hidden(x)).map((x) => textOf(x)),
  ]);
  const shown = (t) => (kindOf(t) ? `‹${kindOf(t)}›` : shipped(t, copy, data) ? t : '‹text›');
  /* an option is one of the product's choices: kept as drawn, but for a date or a fixture name */
  const choice = (t) => (['date', 'time', 'ago', 'email', 'phone'].includes(kindOf(t)) ? `‹${kindOf(t)}›` : isCopy(copy, t) || !data(t) || kindOf(t) ? t : '‹text›');
  /* a choice drawn as a card (the upgrade's listing types): its name is the
     card's title, not the price its radio carries; a tag only some cards
     draw is said on the card that draws it — "Hot Listing (Recommended)" */
  const option = (w) => {
    const head = up(w.p, (y) => hasC(y, 'pf-collapse-header') && within(y, box));
    if (!head) return choice(textOf(w));
    const ls = leaves(head).filter((l) => !within(l.el, w));
    const tag = ls.filter((l) => up(l.el, (y) => hasC(y, 'pf-tag') && within(y, head)));
    const name = ls.filter((l) => !tag.includes(l) && !kindOf(l.t) && !l.t.startsWith('‹'));
    const first = name.find((l) => BOLD(l.el)) || name[0], t = (first || { t: textOf(w) }).t;
    /* the card's other words (its description) are the page's other copy */
    more.push(...name.filter((l) => l !== first).map((l) => l.t));
    return `${choice(t)}${tag.length ? ` (${tag.map((l) => choice(l.t)).join(', ')})` : ''}`;
  };
  const val = uniq([
    ...all(box, (x) => (hasC(x, 'pf-select-selection-item') || hasC(x, 'pf-select-selection-item-content')) && !hidden(x) && !up(x.p, (y) => hasC(y, 'pf-select-selection-item'))).map((x) => shown(textOf(x))),
    /* a value the product shows, not one typed: a read-only or a picker's input ("Last 30 Days") */
    ...all(box, (x) => x.tag === 'input' && x.a.value && !hidden(x) && !/^(hidden|radio|checkbox|file)$/.test(x.a.type || '') && (x.a.readonly !== undefined || !!up(x.p, (y) => hasC(y, 'pf-picker')))).map((x) => shown(x.a.value.replace(/\s+/g, ' ').trim())),
  ]);
  const wrappers = all(box, (x) => hasRe(x, CHOICE) && !hasC(x, 'pf-switch') && !hidden(x));
  const opts = uniq(wrappers.map(option));
  let s = lab.join(' / ');
  if (ph.length) s += ` [${ph.join(' / ')}]`;
  if (val.length) s += ` =${val.slice(0, 4).join(', ')}`;
  if (opts.length) s += ` {${opts.slice(0, 12).join(' | ')}${opts.length > 12 ? ' | …' : ''}}`;
  else if (all(box, (x) => hasC(x, 'pf-switch') && !hidden(x)).length) s += ' {switch}';
  else if (all(box, (x) => hasC(x, 'pf-checkbox-wrapper') && !hidden(x)).length) s += ' {checkbox}';
  else if (all(box, (x) => hasC(x, 'pf-upload') && !hidden(x)).length && !ph.length) s += ' {upload}';
  return { s: s.trim(), took, more };
}
/* the box a control's field is drawn in: going up, the first box that holds
   a label — unless the box holds two labels, or its one label is another
   field's (the label's nearest box with a control does not hold this one):
   then the box before it; with no label within ten levels, the control alone */
function fieldBox(ctrl, controls) {
  let last = ctrl, shared = null;
  for (let x = ctrl.p, d = 0; x && d < 10 && x.tag !== 'body' && x.tag !== 'main' && x.tag !== '#root'; x = x.p, d++) {
    if (hasC(x, 'pf-form-item')) return x;
    const labs = findAll(x, (y) => isLabel(y) && !hidden(y) && !within(y, ctrl) && !up(y.p, (z) => z !== x && within(z, x) && isLabel(z)));
    if (labs.length > 1) return shared || last;
    if (labs.length === 1) {
      const owner = up(labs[0].p, (z) => controls.some((c) => within(c, z)));
      return owner && owner !== x && !within(ctrl, owner) ? shared || last : x;
    }
    /* a box shared with another control, before any label: kept, in case no label of this field's own comes */
    if (!shared && controls.some((c) => c !== ctrl && within(c, x) && !within(ctrl, c))) shared = last;
    last = x;
  }
  /* no label near it: the field is the control alone */
  return shared || ctrl;
}

/* ── repeated items: the rows of a table, the cards of a feed ─────────── */
const sig = (el) => `${el.tag}.${classOf(el).filter((c) => !/^(pf-.*-(active|selected|checked|disabled|first|last|open|focused)|swiper-slide-.*|m[tblrxy]?-\d+|p[tblrxy]?-\d+|pointer)$/.test(c)).sort().join('.')}${instNames(el).join(',')}`;
/* a place inside an item: tag and antd class down from the item — a card's
   own one-off classes (titanium-card, package-list) do not move its parts */
/* (a styled component's version, --v6 or --v74, and a tag's colour are not places: the Live and the Rejected tag are one) */
const placeSig = (el) => `${el.tag}.${classOf(el).filter((c) => /^pf-/.test(c) && !/-(active|selected|checked|disabled|first|last|open|focused)$/.test(c) && !/^pf-sc-|^pf-tag-/.test(c)).map((c) => c.replace(/--v\d+$/, '')).sort().join('.')}`;
const pathKey = (el, item) => { const c = []; for (let x = el; x && x !== item; x = x.p) c.push(placeSig(x)); return c.reverse().join('>'); };
const BOLD = (el) => !!up(el, (y) => /^h[1-6]$|^b$|^strong$/.test(y.tag) || hasRe(y, /^fw-(5|6|7|8|9)00$|^pf-typography-strong$|title/i) || (y.a.style && /font-weight:\s*(5|6|7|8|9)00/.test(y.a.style)));
/* the parts of an item in order: its texts, and what it draws without text */
export function partsOf(item, { icons = false } = {}) {
  const out = [];
  const push = (t, el, part) => out.push({ t, key: pathKey(el, item), part, bold: !part && BOLD(el) });
  const rec = (x, parent) => {
    if (!isEl(x)) { const raw = x.replace(/\s+/g, ' ').trim(), t = envText(raw); if (t) push(t, parent, t !== raw); return; }
    if (hiddenSelf(x)) return;
    /* a text entry says what it asks for: [its placeholder] (a table cell's "Set Max Credits") */
    if ((x.tag === 'input' && !x.a.value && !/^(hidden|radio|checkbox|file)$/.test(x.a.type || '')) || (x.tag === 'textarea' && !textOf(x))) { if (x.a.placeholder) push(`[${x.a.placeholder.trim()}]`, x, true); return; }
    if (RIYAL(x)) { push('‹riyal›', x, true); return; }
    if (icons && (x.tag === 'svg' || hasC(x, 'anticon'))) { if (!up(x.p, (y) => y.tag === 'svg' || hasC(y, 'anticon') || (isBtn(y) && !textOf(y)))) push('‹icon›', x, true); return; }
    if (SKIP.has(x.tag)) return;
    if (x.tag === 'img' || hasC(x, 'pf-image') || hasC(x, 'pf-avatar')) { push('‹image›', x, true); return; }
    if (hasC(x, 'pf-skeleton') || hasRe(x, /^pf-skeleton-(element|button|input|avatar|image)$/)) { if (!up(x.p, (y) => hasC(y, 'pf-skeleton') || hasRe(y, /^pf-skeleton-element$/))) push('‹skeleton›', x, true); return; }
    if (hasC(x, 'pf-switch')) { push('‹switch›', x, true); return; }
    if (isBtn(x) && !textOf(x)) { push('‹icon button›', x, true); return; }
    if (hasC(x, 'pf-checkbox') && !up(x.p, (y) => hasC(y, 'pf-checkbox-wrapper')) || hasC(x, 'pf-checkbox-wrapper') && !textOf(x)) { push('‹checkbox›', x, true); return; }
    if (hasC(x, 'pf-progress')) { push('‹progress›', x, true); return; }
    x.k.forEach((k) => rec(k, x));
  };
  if (!hidden(item)) rec(item, item.p);
  return out;
}
/* which of another item's parts sits where each of rep's does: an alignment
   of the two part lists by place (a weighted LCS — the same place scores,
   the same place and the same text scores more), so an item that lacks a
   middle part (the WhatsApp card has no Avg Duration) still lines up */
function align(rep, o) {
  const n = rep.length, m = o.length;
  const w = (i, j) => (rep[i].key === o[j].key ? (rep[i].t === o[j].t ? 3 : 1) : 0);
  const dp = Array.from({ length: n + 1 }, () => new Int32Array(m + 1));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1], w(i, j) ? dp[i + 1][j + 1] + w(i, j) : 0);
  const at = new Array(n).fill(null);
  for (let i = 0, j = 0; i < n && j < m;) {
    if (w(i, j) && dp[i][j] === dp[i + 1][j + 1] + w(i, j)) { at[i] = o[j]; i++; j++; } else if (dp[i + 1][j] >= dp[i][j + 1]) i++; else j++;
  }
  return at;
}
/* The anatomy of repeated items, from their part lists. At each of the
   fullest item's places, the same text in every item that has the place is a
   label, verbatim — "(sometimes x)" when not every item draws it (the one
   unnamed lead's "Add Name"); texts that differ are data, written as their
   kind, or, when every one is the product's own words, as the alternatives
   (Call|WhatsApp) — or the kind with the product's words some items draw
   there instead (‹title›|Unnamed Lead). alts: false (a component seen on
   several pages) writes the kind, never one page's words. */
export function anatomyOf(lists, { copy = new Set(), data = noData, max = 80, alts: many = true, rare = false } = {}) {
  const rep = lists.reduce((a, b) => (b.length > a.length ? b : a), lists[0] || []);
  const others = lists.filter((l) => l !== rep);
  const maps = others.map((o) => align(rep, o));
  const drawn = (t) => lists.filter((l) => l.some((x) => x.t === t)).length;
  const own = (t) => t.length <= max && (isCopy(copy, t) || !data(t));
  const parts = [];
  rep.forEach((l, i) => {
    if (l.part) { parts.push(l.t); return; }
    if (NOISE.test(l.t)) return;
    const k = kindOf(l.t);
    if (k) { parts.push(`‹${k}›`); return; }
    const seen = maps.map((mp) => mp[i]).filter((x) => x && !x.part).map((x) => x.t);
    const verbatim = (t) => (t.length > max ? '‹text›' : data.mask(t, copy));
    if (seen.length ? seen.every((t) => t === l.t) && shipped(l.t, copy, data) : isCopy(copy, l.t)) {
      const v = verbatim(l.t);
      parts.push(lists.length > 1 && !v.startsWith('‹') && drawn(l.t) < lists.length ? `(sometimes ${v})` : v);
      return;
    }
    const alts = uniq([l.t, ...seen]).filter((t) => !NOISE.test(t));
    const shape = uniq(alts.map((t) => t.replace(/\d[\d,.]*/g, '‹n›')));
    if (shape.length === 1 && shape[0] !== alts[0]) { parts.push(verbatim(shape[0])); return; }
    /* up to three of the product's own words, or up to six translations when they are short (the product each credit went on) */
    if (many && ((alts.length <= 3 && alts.every(own)) || (alts.length <= 6 && alts.every((t) => isCopy(copy, t)) && alts.join('|').length <= 72))) { parts.push(alts.join('|')); return; }
    const cp = many && alts.some((t) => data(t) && !isCopy(copy, t)) ? alts.filter((t) => t.length <= 32 && isCopy(copy, t)) : [];
    const p = `${l.bold && !parts.includes('‹title›') ? '‹title›' : '‹text›'}${cp.length && cp.length <= 2 ? `|${cp.join('|')}` : ''}`;
    /* rare: a text only some items draw there (a row's error message) is "(sometimes …)" too */
    parts.push(rare && lists.length > 1 && lists.filter((o) => o.some((x) => x.key === l.key && !x.part)).length < lists.length ? `(sometimes ${p})` : p);
  });
  /* a label another item draws where this one has none (Add Task where a task is; a
     "REGA ID:" — a text that ends in a colon names what follows it) */
  const have = new Set(parts.flatMap((p) => p.replace(/^\(sometimes (.*)\)$/, '$1').split('|')));
  const alt = uniq(others.flatMap((o, n) => { const hit = new Set(maps[n].filter(Boolean)); return o.filter((x) => !hit.has(x) && !x.part && !kindOf(x.t) && !NOISE.test(x.t) && (isCopy(copy, x.t) || (/:$/.test(x.t) && !data(x.t)))).map((x) => x.t); })).filter((t) => !have.has(t));
  const out = parts.filter((p, i) => p !== parts[i - 1]);
  return alt.length ? [...out, `| ${alt.slice(0, 4).join(' | ')}`] : out;
}
const joinParts = (a) => a.join(' · ').replace(/ · \| /g, ' | ');
/* how alike two items are: the share of the smaller one's places the other has */
const alike = (a, b) => { const A = new Set(a.map((x) => x.key)), B = new Set(b.map((x) => x.key)); let n = 0; for (const x of A) if (B.has(x)) n++; return n / Math.max(1, Math.min(A.size, B.size)); };
function repeatGroups(roots, skip) {
  const out = [];
  for (const r of roots) for (const x of walk(r)) {
    if (!isEl(x) || skip(x) || hiddenSelf(x) || isEntry(x) || up(x.p, isEntry)) continue;
    const kids = x.k.filter((k) => isEl(k) && !hiddenSelf(k));
    if (kids.length < 2) continue;
    const by = new Map();
    for (const k of kids) { const s = sig(k); (by.get(s) || by.set(s, []).get(s)).push(k); }
    for (const [, items] of by) {
      /* an item says something, and is not a field: no text entry in it, and a
         switch or a checkbox only in a card with more to it (a licence card's
         "Share with agency staff") — a preferences row is a field */
      const rich = items.filter((it) => !skip(it) && leaves(it).length >= 2 && !find(it, (y) => isEntry(y) && !hidden(y)));
      let lists = rich.map((it) => partsOf(it)).filter((l) => l.length >= 3 && (l.length >= 5 || !l.some((x) => x.t === '‹switch›' || x.t === '‹checkbox›')));
      if (lists.length < 2 || lists.length < rich.length) continue;
      /* rows of different figures (Active 20 · For Sale 13 … over Signature 12 · Hot 5 …)
         are the page's figures, not a card; cards that repeat one set of figures are cards */
      const figs = (it) => leaves(it).filter((l) => !kindOf(l.t) && l.t !== '‹riyal›').map((l) => l.t);
      if (rich.every((it) => leaves(it).every((l) => kindOf(l.t) || l.t === '‹riyal›' || up(l.el, (y) => hasC(y, 'pf-statistic') && within(y, it))))
        && !figs(rich[0]).some((t) => figs(rich[1]).includes(t))) continue;
      /* an end item of another shape is not one of them: the list's pager under the phone's listing cards */
      let kept = rich;
      const odd = (i) => lists.reduce((a, l, j) => a + (j === i ? 0 : alike(lists[i], l)), 0) / (lists.length - 1) < 0.5;
      while (lists.length > 2 && odd(lists.length - 1)) { lists = lists.slice(0, -1); kept = kept.slice(0, -1); }
      while (lists.length > 2 && odd(0)) { lists = lists.slice(1); kept = kept.slice(1); }
      const sims = lists.slice(1).map((l) => alike(lists[0], l));
      if (sims.reduce((a, b) => a + b, 0) / sims.length >= 0.5) out.push({ parent: x, items: kept, lists });
    }
  }
  /* nested groups: the outer one — a feed's cards over a card's lines —
     unless its items are themselves lists (a pane of packages): an outer
     anatomy past 24 parts gives way to the groups inside it */
  const depth = (x) => { let n = 0; for (let y = x; y; y = y.p) n++; return n; };
  out.sort((a, b) => depth(a.parent) - depth(b.parent));
  const kept = [];
  for (const g of out) {
    if (kept.some((o) => o.items.some((it) => within(g.parent, it)))) continue;
    if (anatomyOf(g.lists).length > 24 && out.some((o) => o !== g && g.items.some((it) => within(o.parent, it)))) continue;
    kept.push(g);
  }
  return kept;
}
/* a group's name: the nearest component that is not a layout primitive */
const GENERIC = /^(Flex|Group|Card|CustomCard|Popover|Tooltip|TextWithIcon|Text|Icon|Button|Row|Col|Space|Divider|Image|Avatar|Tag|Badge|Dropdown|Label|RenderTextLtr|DataTable|ListingContainer|Home|App|MainRouter|LoaderWrapper|Spin|Swiper|SwiperSlide|InfiniteScroll|List|Skeleton|Typography|Title|Paragraph|Modal|Drawer)$/;
const groupName = (g) => {
  const own = [...instNames(g.items[0])].reverse().find((n) => !GENERIC.test(n) && !/Icon$/.test(n));
  if (own) return own;
  for (let x = g.parent; x; x = x.p) { const n = [...instNames(x)].reverse().find((m) => !GENERIC.test(m) && !/Icon$/.test(m)); if (n) return n; }
  return 'items';
};

/**
 * The visible labels of one compiled file, by region:
 *   title   the header's page title         heads    headings, card titles
 *   nav     in-page navigation              tabs     tab bars (counts as rendered), segmented
 *   filters the filter bar: its fields, then its buttons
 *   fields  the other fields                pager    the table's page controls
 *   table   column heads, one list a table  rows     what each column's cells hold
 *   cards   repeated items: name → "n× anatomy"
 *   stats   a label drawn over its number   cta      primary buttons    btn   the others, and links
 *   empty   an empty block's words          text     any other of the product's own strings it shows
 * A field is: label [placeholder] =shown value {options}. Data is ‹kind›.
 * copy: a Set of the product's English strings. data: fixtureData(…).
 */
export function fileLabels(html, { copy = new Set(), data = noData } = {}) {
  const root = typeof html === 'string' ? parseHtml(html) : html;
  const roots = contentRoots(root);
  const R = {};
  const used = new Set();
  const take = (el) => { for (const x of walk(el)) if (isEl(x)) used.add(x); };
  const free = (x) => !used.has(x) && !hidden(x);
  const vis = (pred) => roots.flatMap((r) => findAll(r, (x) => pred(x) && free(x)));
  const add = (k, v) => { if (v && (typeof v !== 'object' || Object.keys(v).length)) R[k] = v; };
  /* words with their numbers as ‹n› (a button's "TruPoints™ 46", a figure's "4 Users") */
  /* "4 Users" → "‹n› Users" (a number beside its word is the fixture's), but
     the product's own string stays as it is written ("2+ Active Listings") */
  const words = (t) => (isCopy(copy, t) ? t : t.split(' ').map((w) => { const x = w.replace(/[,;:.]$/, ''); return kindOf(x) ? `‹${kindOf(x)}›${w.slice(x.length)}` : w; }).join(' '));
  const say = (t) => (isCopy(copy, t) ? t : words(data.mask(t, copy)));
  const label = (t) => (!t || t.startsWith('‹') || !shipped(t, copy, data) ? null : say(t));

  const title = find(root, (x) => hasC(x, 'navbar-page-title'));
  if (title && !hidden(title)) R.title = textOf(title);

  /* an empty block's words are the empty state's, whatever they hold */
  const empties = vis(isEmptyBlock).filter((x) => !up(x.p, isEmptyBlock));
  add('empty', uniq(empties.flatMap((e) => leaves(e).map((l) => l.t))));
  empties.forEach(take);

  /* tabs: antd tabs, segmented controls, button-style radio bars */
  const tabs = [];
  for (const nav of vis((x) => hasC(x, 'pf-tabs-nav-list'))) {
    const t = findAll(nav, (x) => hasC(x, 'pf-tabs-tab') && !hidden(x)).map((tab) => leaves(tab).map((l) => (COUNT.test(l.t) || !kindOf(l.t) ? l.t : `‹${kindOf(l.t)}›`)).join(' ')).filter(Boolean);
    if (t.length) tabs.push(t);
    take(nav);
  }
  for (const seg of vis((x) => hasC(x, 'pf-segmented'))) {
    const t = findAll(seg, (x) => hasC(x, 'pf-segmented-item-label') && !hidden(x)).map((x) => textOf(x)).filter(Boolean);
    if (t.length) tabs.push(t);
    take(seg);
  }
  for (const rg of vis((x) => hasC(x, 'pf-radio-group') && !!find(x, (y) => hasC(y, 'pf-radio-button-wrapper')) && !up(x.p, (y) => hasC(y, 'pf-form-item') || isLabel(y)))) {
    const t = findAll(rg, (x) => hasC(x, 'pf-radio-button-wrapper') && !hidden(x)).map((x) => textOf(x)).filter(Boolean);
    if (t.length) { tabs.push(t); take(rg); }
  }
  add('tabs', tabs.length === 1 ? tabs[0] : tabs);

  /* in-page navigation: the settings pages' side nav, steps, breadcrumbs */
  const navs = vis((x) => x.tag === 'nav' || hasC(x, 'pf-menu-horizontal') || hasC(x, 'pf-breadcrumb') || hasC(x, 'pf-steps'));
  add('nav', uniq(navs.flatMap((n) => findAll(n, (x) => (x.tag === 'a' || (x.tag === 'li' && !find(x, (y) => y.tag === 'a')) || hasC(x, 'pf-steps-item-title') || hasC(x, 'pf-breadcrumb-link')) && !hidden(x)).map((x) => textOf(x)))));
  navs.forEach(take);

  /* tables: column heads, and what each column's cells hold */
  const heads = [], rows = [];
  for (const tb of vis((x) => x.tag === 'table' && !!find(x, (y) => hasC(y, 'pf-table-thead')))) {
    const h = findAll(find(tb, (y) => hasC(y, 'pf-table-thead')), (x) => x.tag === 'th' && !hidden(x)).map((x) => textOf(x));
    const trs = findAll(tb, (x) => x.tag === 'tr' && hasC(x, 'pf-table-row') && !hidden(x));
    if (h.some(Boolean)) {
      heads.push(h.filter(Boolean));
      const cols = {};
      h.forEach((name, i) => {
        const cells = trs.map((tr) => tr.k.filter((c) => isEl(c) && c.tag === 'td')[i]).filter(Boolean);
        if (name && cells.length) { const a = joinParts(anatomyOf(cells.map((c) => partsOf(c)), { copy, data })); if (a) cols[name] = a; }
      });
      rows.push(cols);
    }
    take(tb);
  }
  add('table', heads.length === 1 ? heads[0] : heads);
  if (rows.some((r) => Object.keys(r).length)) add('rows', rows.length === 1 ? rows[0] : rows);

  /* repeated items outside tables */
  const cards = {};
  for (const g of repeatGroups(roots, (x) => used.has(x) || x.tag === 'table' || OVERLAY(x) && hidden(x))) {
    const a = anatomyOf(g.lists, { copy, data });
    if (!a.some((p) => !p.startsWith('‹'))) continue;               /* nothing but data: a gallery, not a card */
    let name = groupName(g); while (cards[name]) name += '+';
    cards[name] = `${g.items.length}× ${joinParts(a)}`;
    g.items.forEach(take);
  }
  add('cards', cards);

  /* fields: each visible control, by the box its label is drawn in */
  const controls = vis((x) => isControl(x) && !up(x.p, (y) => isControl(y)));
  const boxes = [];
  for (const c of controls) {
    const b = fieldBox(c, controls);
    if (!boxes.some((o) => within(b, o))) { for (let i = boxes.length - 1; i >= 0; i--) if (within(boxes[i], b)) boxes.splice(i, 1); boxes.push(b); }
  }
  const filters = [], fields = [], pager = [], filterBoxes = [], told = [];
  for (const b of boxes) {
    const { s: f, took, more } = fieldOf(b, { copy, data, used });
    told.push(...more);
    for (const c of controls) if (within(c, b)) take(c);
    took.forEach(take);
    if (!f) continue;
    if (up(b, PAGER)) pager.push(f);
    else if (up(b, FILTER_BOX)) { filters.push(f); filterBoxes.push(b); } else fields.push(f);
  }
  /* the filter bar's own buttons (Show More, Clear filters, Search): those of
     the nearest box around its fields that holds a button */
  if (filterBoxes.length) {
    let box = filterBoxes[0];
    while (box && !filterBoxes.every((b) => within(b, box))) box = box.p;
    for (let x = box, d = 0; x && d < 4; x = x.p, d++) {
      const bs = findAll(x, (y) => isBtn(y) && free(y) && !up(y.p, isBtn));
      if (bs.length) { for (const b of bs) { const t = textOf(b); if (t) filters.push(words(t)); take(b); } break; }
    }
  }
  vis(PAGER).forEach(take);
  add('filters', uniq(filters));
  add('fields', uniq(fields));
  add('pager', uniq(pager));

  /* a heading's own words — not the button, link, figures or control drawn
     inside its box, which stay the page's ("Credits Usage" beside its
     Top-Up button), nor what another region has read (a card head's
     segmented bar: "Performance", not "Performance All For Sale …") */
  add('heads', uniq(vis(isHeading).filter((x) => !up(x.p, isHeading)).map((x) => {
    const apart = (el) => !!up(el, (y) => y !== x && within(y, x) && (used.has(y) || isBtn(y) || isControl(y) || y.tag === 'a' || hasC(y, 'pf-segmented') || hasC(y, 'pf-statistic')));
    const t = leaves(x).filter((l) => !apart(l.el)).map((l) => l.t).join(' ');
    for (const y of walk(x)) if (isEl(y) && !apart(y)) used.add(y);
    return label(t);
  })));

  const cta = [], btn = [];
  for (const b of vis((x) => isBtn(x) || (x.tag === 'a' && x.a.href !== undefined))) {
    if (up(b.p, (y) => isBtn(y) || y.tag === 'a')) continue;
    const t = textOf(b);
    take(b);
    if (!t || kindOf(t) || !shipped(t, copy, data)) continue;
    (isBtn(b) && isPrimary(b) ? cta : btn).push(say(t));
  }

  /* statistic titles, and a label drawn right over its number */
  const stats = vis((x) => hasC(x, 'pf-statistic-title')).map((x) => { take(x); return label(textOf(x)); });
  const rest = roots.flatMap((r) => leaves(r)).filter((l) => !used.has(l.el) && !up(l.el, (y) => used.has(y)));
  rest.forEach((l, i) => {
    const nx = rest[i + 1];
    if (nx && /^[A-Z\u0600-\u06FF]/.test(l.t) && !kindOf(l.t) && ['n', '%', 'duration'].includes(kindOf(nx.t)) && up(l.el, (y) => within(nx.el, y) && y.k.length <= 4)) { stats.push(label(clean(l.t))); l.stat = true; }
  });
  add('stats', uniq(stats));
  add('cta', uniq(cta));
  add('btn', uniq(btn));
  /* what is left: the product's own strings, and any text the fixture did not write (the copy catalogue misses some) */
  add('text', uniq(rest.filter((l) => !l.stat && !NOISE.test(l.t) && (l.t === '‹map›' || !l.t.startsWith('‹')) && shipped(l.t, copy, data)).map((l) => say(clean(l.t))).concat(told.filter((t) => !NOISE.test(t) && shipped(t, copy, data)).map((t) => say(clean(t))))));
  return R;
}

/* ── differences: a phone layout against web, a role against the owner ── */
/* an array that changed a little is its changes (-gone, +new); one that
   changed a lot is itself; a region the other file lacks is null */
/* fixture numbers differ between files (0 is ‹n›, 2m 14s ‹duration›): not a difference in what the page shows */
const same = (a, b) => JSON.stringify(a ?? null).replace(/‹(n|%|duration|id)›/g, '‹n›') === JSON.stringify(b ?? null).replace(/‹(n|%|duration|id)›/g, '‹n›');
export function diffLabels(base, other) {
  const out = {};
  for (const k of new Set([...Object.keys(base), ...Object.keys(other)])) {
    const a = base[k], b = other[k];
    if (same(a, b)) continue;
    if (b === undefined) { out[k] = null; continue; }
    if (a === undefined || typeof b === 'string' || Array.isArray(a) !== Array.isArray(b) || (Array.isArray(b) && (Array.isArray(b[0]) || Array.isArray(a[0])))) { out[k] = b; continue; }
    if (Array.isArray(b)) {
      const gone = a.filter((x) => !b.includes(x)), come = b.filter((x) => !a.includes(x));
      out[k] = gone.length + come.length <= Math.max(2, b.length / 2) ? [...gone.map((x) => `-${x}`), ...come.map((x) => `+${x}`)] : b;
      if (!out[k].length) delete out[k];                       /* the same labels, reordered */
      continue;
    }
    const o = {};
    /* a group is its anatomy, whatever the nearest component is called */
    const va = Object.values(a), vb = Object.values(b);
    for (const n of new Set([...Object.keys(a), ...Object.keys(b)])) {
      if (same(a[n], b[n])) continue;
      if (b[n] === undefined ? vb.some((v) => same(v, a[n])) : va.some((v) => same(v, b[n]))) continue;
      o[n] = b[n] ?? null;
    }
    if (Object.keys(o).length) out[k] = o;
  }
  return out;
}

/* ── a component's anatomy, from its instances in the compiled files ───── */
const ROLE = { '‹title›': 'title', '‹text›': 'text', '‹ago›': 'relative time', '‹date›': 'date', '‹time›': 'time', '‹n›': 'number', '‹%›': 'percent', '‹email›': 'email', '‹phone›': 'phone', '‹duration›': 'duration', '‹id›': 'id', '‹riyal›': 'riyal', '‹icon›': 'icon', '‹image›': 'image', '‹icon button›': 'icon button', '‹switch›': 'switch', '‹checkbox›': 'checkbox', '‹progress›': 'progress', '‹skeleton›': 'skeleton', '‹map›': 'map', '‹environment›': 'environment' };
/* the parts of one instance (the element whose data-pf-i names it), and
   whether the whole of it answers a click */
export function instanceParts(el) {
  const parts = el.tag === 'svg' ? [{ t: '‹icon›', key: '', part: true }] : partsOf(el, { icons: true });
  const click = !!(el.a['data-pf-go'] || isBtn(el) || el.tag === 'a' || hasC(el, 'pointer') || el.a.role === 'button'
    || (el.k.filter(isEl).length === 1 && (hasC(el.k.find(isEl), 'pointer') || el.k.find(isEl).a['data-pf-go'])));
  /* a component whose root is the product's DataTable (SetStaffCreditLimit): its column heads, and its rows' parts */
  const tb = instNames(el).includes('DataTable') && find(el, (x) => x.tag === 'table' && !hidden(x) && !!find(x, (y) => hasC(y, 'pf-table-thead')));
  if (tb) {
    const heads = findAll(find(tb, (y) => hasC(y, 'pf-table-thead')), (x) => x.tag === 'th' && !hidden(x)).map((x) => textOf(x)).filter(Boolean);
    const rows = findAll(tb, (x) => x.tag === 'tr' && hasC(x, 'pf-table-row') && !hidden(x)).map((tr) => partsOf(tr, { icons: true })).filter((l) => l.length);
    if (heads.length) return { parts, click, table: { heads, rows } };
  }
  return { parts, click };
}
/* an antd component's own parts, by the class antd gives each (its DOM,
   as the product ships it): an instance's anatomy is the ones it draws */
const SLOTS = {
  'pf-modal': [['pf-modal-close', 'close'], ['pf-modal-title', 'title'], ['pf-modal-body', 'body'], ['pf-modal-footer', 'footer']],
  'pf-drawer-content-wrapper': [['pf-drawer-close', 'close'], ['pf-drawer-title', 'title'], ['pf-drawer-extra', 'extra'], ['pf-drawer-body', 'body'], ['pf-drawer-footer', 'footer']],
  'pf-card': [['pf-card-cover', 'cover'], ['pf-card-head-title', 'title'], ['pf-card-head-tabs', 'tabs'], ['pf-card-extra', 'extra'], ['pf-card-meta-avatar', 'avatar'], ['pf-card-meta-title', 'meta title'], ['pf-card-meta-description', 'meta description'], ['pf-card-body', 'body'], ['pf-card-actions', 'actions']],
  'pf-tabs': [['pf-tabs-tab', 'tabs'], ['tab-count', 'count'], ['pf-tabs-extra-content', 'extra'], ['pf-tabs-tabpane', 'pane']],
  'pf-table-wrapper': [['pf-table-thead', 'column heads'], ['pf-table-selection-column', 'selection'], ['pf-table-column-sorters', 'sorter'], ['pf-table-row', 'rows'], ['pf-table-placeholder', 'empty'], ['pf-pagination', 'pagination']],
  'pf-select': [['pf-select-selection-placeholder', 'placeholder'], ['pf-select-selection-item', 'value'], ['pf-select-selection-overflow', 'tags'], ['pf-select-clear', 'clear'], ['pf-select-arrow', 'arrow']],
  'pf-input-affix-wrapper': [['pf-input-prefix', 'prefix'], ['pf-input', 'input'], ['pf-input-clear-icon', 'clear'], ['pf-input-suffix', 'suffix']],
  'pf-input': [['#ph', 'placeholder'], ['#val', 'value']],
  'pf-collapse': [['pf-collapse-expand-icon', 'arrow'], ['pf-collapse-header-text', 'header'], ['pf-collapse-content', 'content']],
  'pf-btn': [['pf-btn-icon', 'icon'], ['#text', 'label'], ['pf-btn-loading-icon', 'loading']],
  'pf-tag': [['anticon', 'icon'], ['#text', 'label'], ['pf-tag-close-icon', 'close']],
  'pf-badge': [['pf-badge-count', 'count'], ['pf-badge-dot', 'dot'], ['pf-badge-status-dot', 'status dot'], ['pf-badge-status-text', 'status text']],
  'pf-pagination': [['pf-pagination-prev', 'prev'], ['pf-pagination-item', 'pages'], ['pf-pagination-jump-next', 'jump'], ['pf-pagination-next', 'next'], ['pf-pagination-options', 'page size'], ['pf-pagination-total-text', 'total']],
  'pf-steps': [['pf-steps-item-icon', 'icon'], ['pf-steps-item-title', 'title'], ['pf-steps-item-description', 'description'], ['pf-steps-item-tail', 'connector']],
  'pf-alert': [['pf-alert-icon', 'icon'], ['pf-alert-message', 'message'], ['pf-alert-description', 'description'], ['pf-alert-action', 'action'], ['pf-alert-close-icon', 'close']],
  'pf-statistic': [['pf-statistic-title', 'title'], ['pf-statistic-content-prefix', 'prefix'], ['pf-statistic-content-value', 'value'], ['pf-statistic-content-suffix', 'suffix']],
  'pf-form-item': [['pf-form-item-label', 'label'], ['pf-form-item-required', 'required'], ['pf-form-item-control', 'control'], ['pf-form-item-explain', 'help'], ['pf-form-item-extra', 'extra']],
  'pf-picker': [['pf-picker-input', 'input'], ['pf-picker-range-separator', 'range'], ['pf-picker-suffix', 'suffix'], ['pf-picker-clear', 'clear']],
  'pf-picker-dropdown': [['pf-picker-presets', 'presets'], ['pf-picker-header', 'header'], ['pf-picker-content', 'calendar'], ['pf-picker-time-panel', 'time'], ['pf-picker-now-btn', 'now'], ['pf-picker-ok', 'ok']],
  'pf-popover': [['pf-popover-arrow', 'arrow'], ['pf-popover-title', 'title'], ['pf-popover-inner-content', 'content']],
  'pf-tooltip': [['pf-tooltip-arrow', 'arrow'], ['pf-tooltip-inner', 'text']],
  'pf-upload': [['pf-upload-select', 'select'], ['pf-upload-drag', 'drag area'], ['pf-upload-list', 'list']],
  'pf-list': [['pf-list-header', 'header'], ['pf-list-item', 'items'], ['pf-list-item-meta', 'meta'], ['pf-list-item-action', 'actions'], ['pf-list-footer', 'footer']],
  'pf-segmented': [['pf-segmented-item', 'options'], ['pf-segmented-item-selected', 'selected']],
  'pf-radio-group': [['pf-radio-wrapper', 'options'], ['pf-radio-button-wrapper', 'button options']],
  'pf-radio-wrapper': [['pf-radio', 'radio'], ['#text', 'label']],
  'pf-checkbox-wrapper': [['pf-checkbox', 'box'], ['#text', 'label']],
  'pf-menu': [['pf-menu-item-icon', 'icon'], ['pf-menu-title-content', 'label'], ['pf-menu-submenu', 'submenu']],
  'pf-tour': [['pf-tour-close', 'close'], ['pf-tour-cover', 'cover'], ['pf-tour-title', 'title'], ['pf-tour-description', 'description'], ['pf-tour-indicators', 'indicators'], ['pf-tour-buttons', 'buttons']],
  'pf-message-notice': [['anticon', 'icon'], ['#text', 'text']],
  'pf-switch': [['pf-switch-handle', 'handle'], ['pf-switch-inner-checked', 'on label'], ['pf-switch-inner-unchecked', 'off label']],
  'pf-slider': [['pf-slider-rail', 'rail'], ['pf-slider-track', 'track'], ['pf-slider-handle', 'handle'], ['pf-slider-mark', 'marks']],
  'pf-progress': [['pf-progress-circle', 'circle'], ['pf-progress-line', 'line'], ['pf-progress-text', 'text']],
  'pf-avatar': [['pf-avatar-string', 'initials'], ['img', 'image'], ['anticon', 'icon']],
  'pf-image': [['pf-image-img', 'image'], ['pf-image-mask', 'preview']],
  'pf-skeleton': [['pf-skeleton-avatar', 'avatar'], ['pf-skeleton-title', 'title'], ['pf-skeleton-paragraph', 'paragraph'], ['pf-skeleton-button', 'button'], ['pf-skeleton-input', 'input']],
  'pf-spin': [['pf-spin-dot', 'spinner'], ['pf-spin-text', 'text']],
  'pf-divider': [['pf-divider-inner-text', 'text']],
  'pf-dropdown': [['pf-dropdown-menu-item', 'items'], ['pf-dropdown-menu-item-divider', 'divider']],
  'pf-input-number': [['pf-input-number-input', 'input'], ['pf-input-number-handler-wrap', 'steppers']],
  'pf-select-dropdown': [['pf-select-item-option', 'options'], ['pf-select-item-option-selected', 'selected'], ['pf-select-item-empty', 'empty']],
  'pf-rate': [['pf-rate-star', 'stars']],
};
/* the slots one instance of an antd component draws, in the order it draws them */
export function slotsOf(el, key) {
  const table = SLOTS[key];
  if (!table) return null;
  const at = [];
  table.forEach(([cls, name]) => {
    let hit = -1;
    if (cls === '#text') { if (textOf(el)) hit = 1e9; } else if (cls === '#ph') { if (el.a.placeholder) hit = 0; } else if (cls === '#val') { if (el.a.value || textOf(el)) hit = 1; } else {
      let i = 0;
      for (const x of walk(el)) { i++; if (isEl(x) && (cls === 'img' ? x.tag === 'img' : hasC(x, cls)) && !hidden(x)) { hit = i; break; } }
    }
    if (hit >= 0) at.push([hit, name]);
  });
  return at.sort((a, b) => a[0] - b[0]).map(([, n]) => n);
}
/* a terse part list. An antd component: the slots at least half its
   instances draw, then the rest as "sometimes". A product component: its
   parts, labels verbatim when every instance draws them, "(sometimes x)"
   when only some do, and everything else by role; one page's words
   (a|b) only when every instance is on one page; instances that disagree on
   a shape give the parts at least half of them have, marked "varies". A
   component rooted in the product's table: its column heads | its rows'
   parts. A layout primitive (Flex, Group, Card …) has no anatomy.
   instances: { parts, click, page?, slots?, table? } */
/* past maxParts, the icons go before the words do */
const fit = (a, max) => { const b = a.length > max ? runsOf(a.filter((p) => p !== 'icon')) : a; return b.length > max ? [...b.slice(0, max), '…'] : b; };
const runsOf = (a) => a.filter((p, i) => p !== a[i - 1]);
const LAYOUT = /^(Flex|Group|Card|CustomCard|Row|Col|Space|Popover|Tooltip|Dropdown|LoaderWrapper|ListingContainer|DataTable|Home|App|MainRouter|Swiper|SwiperSlide|InfiniteScroll|List|Layout\w*|Typography|FormItem|Form)$/;
export function componentAnatomy(instances, { copy = new Set(), data = noData, maxParts = 10, base = false, name = '' } = {}) {
  if (LAYOUT.test(name) && !instances.some((i) => i.slots)) return null;
  const sl = instances.filter((i) => i.slots);
  if (sl.length) {
    const count = new Map();
    for (const i of sl) for (const n of new Set(i.slots)) count.set(n, (count.get(n) || 0) + 1);
    const order = uniq(sl.flatMap((i) => i.slots)).filter((n) => count.get(n) >= sl.length / 2);
    const rare = uniq(sl.flatMap((i) => i.slots)).filter((n) => count.get(n) < sl.length / 2);
    return order.length ? `${order.join(' · ')}${rare.length ? ` (sometimes ${rare.join(', ')})` : ''}` : null;
  }
  const inst = instances.filter((i) => i.parts.length);
  if (!inst.length) return null;
  /* one page's words are that page's, not the component's */
  const alts = new Set(inst.map((i) => i.page)).size <= 1;
  /* an antd component's words are its caller's: only its parts are its own */
  const role = (p) => ROLE[p] || (base && !p.startsWith('‹') ? 'label' : p.replace(/‹([^›]+)›/g, (m, x) => (ROLE[m] || x)));
  const roles = (a) => a.filter((p) => !p.startsWith('| ')).map((p) => { const m = p.match(/^\(sometimes (.+)\)$/); return m ? `(sometimes ${role(m[1])})` : role(p); });
  const runs = (a) => a.filter((p, i) => p !== a[i - 1]);
  const tables = inst.filter((i) => i.table && i.table.rows.length);
  if (tables.length) {
    const rows = runs(roles(anatomyOf(tables.flatMap((i) => i.table.rows), { copy, data, max: 32, alts, rare: true })));
    const heads = uniq(tables.flatMap((i) => i.table.heads));
    const out = `${heads.join(' · ')} | ${fit(rows, maxParts).join(' · ')}`;
    return inst.filter((i) => i.click).length > inst.length / 2 ? `${out} · clickable` : out;
  }
  /* the shape most instances share, from the fullest default one: an empty
     or error state that draws something else is a state, not the anatomy */
  const pool = inst.some((i) => i.kind === 'default') ? inst.filter((i) => i.kind === 'default') : inst;
  const seed = pool.reduce((a, b) => (b.parts.length > a.parts.length ? b : a)).parts;
  const same = inst.filter((i) => i.parts === seed || alike(seed, i.parts) >= 0.5);
  const shared = same.filter((i) => pool.includes(i)).length >= pool.length / 2;
  const lists = (shared ? same : inst).map((i) => i.parts);
  let out, varies = false;
  if (shared) out = runs(roles(anatomyOf(lists, { copy, data, max: 32, alts, rare: true })));
  else {
    const each = lists.map((l) => runs(roles(anatomyOf([l], { copy, data, max: 32, alts }))).map((p) => (ROLE[`‹${p}›`] || Object.values(ROLE).includes(p) ? p : base ? 'label' : 'text')));
    const count = new Map();
    for (const e of each) for (const p of new Set(e)) count.set(p, (count.get(p) || 0) + 1);
    out = runs(each.flat().filter((p, i, a) => count.get(p) >= each.length / 2 && a.indexOf(p) === i));
    if (!out.length) return null;
    varies = true;
  }
  out = fit(out, maxParts);
  if (inst.filter((i) => i.click).length > inst.length / 2) out.push('clickable');
  if (varies) out.push('varies');
  return out.join(' · ') || null;
}
/* two components of different code that read the same, word for word: one
   of them was read off the other's page (a check for the package; role-only
   anatomies such as "icon" or "image" are many components' and are not
   compared unless they run to four parts) */
export function anatomyClashes(anatomy, catalogue, together = () => false) {
  const def = new Map(catalogue.map((c) => [c.slug, c.def || c.key]));
  const antd = new Set(catalogue.filter((c) => c.family === 'base' || !c.def).map((c) => c.slug));
  const roleWords = new Set([...Object.values(ROLE), 'clickable', 'varies', 'label', 'map', '…']);
  const by = new Map();
  for (const [slug, a] of Object.entries(anatomy)) {
    const ps = a.split(' · ');
    if (antd.has(slug)) continue;                     /* antd's slots are every instance's */
    if (ps.length < 4 && ps.every((p) => roleWords.has(p.replace(/^\(sometimes (.+)\)$/, '$1')))) continue;
    (by.get(a) || by.set(a, []).get(a)).push(slug);
  }
  /* one drawn as the other's root (NotificationCard is a CardComponent) reads the same, rightly */
  return [...by.entries()].map(([a, ss]) => [a, ss.filter((x) => ss.some((y) => y !== x && def.get(y) !== def.get(x) && !together(x, y)))])
    .filter(([, ss]) => ss.length > 1).map(([a, ss]) => ({ anatomy: a, components: ss }));
}

/* ── the package's call ─────────────────────────────────────────────────── */
/**
 * buildLabels({ pages, routes, components, catalogue, read, exists, copy, data })
 *   pages       { slug: recorded URL } — the pages to label (ALL)
 *   routes      { slug: { route, fixture_url? } } — pages-meta routesFor().routes, the
 *               product's route patterns; read here from appRoutes.js when not given
 *   components  registry.components — slug → entry (anatomy is added for these)
 *   catalogue   data/ds/catalogue.json — slug, name, def and pages (page--state → count) per component
 *   read(rel)   the text of deliverables/<rel>; exists(rel) whether it is there
 *   copy, data  as fileLabels
 * returns { labels: { slug: compactLabels(…) }, anatomy: { slug: string }, md: { slug: markdown }, bytes }
 *   labels[slug]   the web regions; "375", "staff", "individual" as differences
 *                  (diffLabels; "blank" when the role's file draws nothing but
 *                  the shell); "emptied" the empty state's words; "more" the
 *                  page's product/pages/<page>.md, which also holds rows, text,
 *                  the roles' 375 files and the empty state's other differences
 */
export function buildLabels({ pages, routes = null, components, catalogue, read, exists, copy = new Set(), data = noData, compact = compactLabels }) {
  /* a page is its route pattern (/post-listing/:id/upgrade), not the URL the recorder visited (#20) */
  const RT = routes || routesFor(join(dirname(fileURLToPath(import.meta.url)), '..', '..'), pages).routes;
  const fileOf = (dev, page, state) => `${dev === 'mobile' ? 'mobile/' : ''}${state ? `states/${page}--${state}` : page}.html`;
  /* the files, each parsed once: labels for the page files, instances for the components */
  const plan = new Map();
  const want = (rel) => plan.get(rel) || plan.set(rel, { labels: null, comps: [] }).get(rel);
  for (const slug of Object.keys(pages)) for (const dev of ['web', 'mobile']) for (const st of [null, 'as-staff', 'as-individual', 'empty']) {
    const rel = fileOf(dev, slug, st);
    if (exists(rel)) want(rel).labels = { slug, dev, st };
  }
  const bySlug = new Map(catalogue.map((c) => [c.slug, c]));
  for (const slug of Object.keys(components)) {
    const c = bySlug.get(slug);
    if (!c || !c.pages) continue;
    /* where it is: files from different pages, and of the kinds it is drawn in
       (a page's default, its empty and its error states) — one page's empty
       state is not the component (cold test: EmptyStateBlock read as the
       dashboard's "No Active Listings") */
    const keys = Object.entries(c.pages).map(([k, n]) => {
      const mob = k.endsWith('--mobile'), [page, ...st] = k.replace(/--mobile$/, '').split('--');
      const state = st.join('--') || null;
      return { rel: fileOf(mob ? 'mobile' : 'web', page, state), n, mob, page, kind: stateKind(state) };
    }).filter((x) => exists(x.rel));
    /* a product component is its data-pf-i marker; an antd one (family base, no def) the class on its root, its catalogue key */
    const match = c.family === 'base' || !c.def ? { cls: c.key } : { id: `${c.name}@${c.def}` };
    for (const x of [...sample(keys.filter((k) => !k.mob), 4, plan), ...sample(keys.filter((k) => k.mob), 1, plan)]) want(x.rel).comps.push({ slug, page: x.page, kind: x.kind, ...match });
  }
  const got = {}, inst = {}, rootIds = {};
  for (const [rel, job] of plan) {
    const root = parseHtml(read(rel));
    if (job.labels) { const { slug, dev, st } = job.labels; ((got[slug] || (got[slug] = {}))[`${dev}:${st || 'page'}`] = fileLabels(root, { copy, data })); }
    for (const { slug, id, cls, page, kind } of job.comps) {
      const els = findAll(root, (x) => (id ? x.a['data-pf-i'] && instOf(x).includes(id) : hasC(x, cls) && !up(x.p, (y) => hasC(y, cls))) && !hidden(x)).slice(0, 6);
      /* the components drawn as this one's whole: on its root, or on an element inside that draws all it draws (a section round one widget) */
      for (const el of els) {
        const ids = rootIds[slug] || (rootIds[slug] = new Set()), t = textOf(el);
        instOf(el).forEach((m) => ids.add(m));
        for (const d of findAll(el, (x) => x !== el && !!x.a['data-pf-i'])) if (textOf(d) === t) instOf(d).forEach((m) => ids.add(m)); else break;
      }
      (inst[slug] || (inst[slug] = [])).push(...els.map((el) => ({ page, kind, ...(cls && SLOTS[cls] ? { slots: slotsOf(el, cls), parts: [] } : instanceParts(el)) })));
    }
  }
  const labels = {}, md = {};
  for (const [slug, f] of Object.entries(got)) {
    const web = f['web:page'] || {}, mob = f['mobile:page'];
    const full = { ...web };
    if (mob) full['375'] = diffLabels(web, mob);
    /* a file that draws nothing but the shell (agency-staff as staff) is said so, not diffed */
    const vs = (a, b) => (Object.keys(b).length ? diffLabels(a, b) : 'blank');
    for (const [role, key] of [['staff', 'as-staff'], ['individual', 'as-individual']]) {
      if (f[`web:${key}`]) full[role] = vs(web, f[`web:${key}`]);
      if (mob && f[`mobile:${key}`]) full[`${role}375`] = vs(mob, f[`mobile:${key}`]);
    }
    if (f['web:empty']) full.emptied = diffLabels(web, f['web:empty']);
    if (mob && f['mobile:empty']) full.emptied375 = diffLabels(mob, f['mobile:empty']);
    md[slug] = pageMarkdown(slug, RT[slug] || { route: pages[slug] }, full);
    labels[slug] = compact(full, slug);
  }
  const anatomy = {};
  for (const [slug, list] of Object.entries(inst)) { const c = bySlug.get(slug) || {}; const a = componentAnatomy(list, { copy, data, base: c.family === 'base', name: c.name }); if (a) anatomy[slug] = a; }
  return { labels, anatomy, md, clashes: anatomyClashes(anatomy, catalogue, (a, b) => { const A = bySlug.get(a), B = bySlug.get(b); return !!(A && B && ((rootIds[a] && rootIds[a].has(`${B.name}@${B.def}`)) || (rootIds[b] && rootIds[b].has(`${A.name}@${A.def}`)))); }), bytes: { labels: JSON.stringify(labels).length, anatomy: JSON.stringify(anatomy).length } };
}
/* a state's kind, for sampling a component's instances */
const stateKind = (st) => (!st ? 'default' : /(^|-)empty($|-)/.test(st) ? 'empty' : /(^|-)error($|-)/.test(st) ? 'error' : /^as-(staff|individual)$/.test(st) ? 'role' : 'state');
/* up to max files: one of each of the kinds default, empty and error, each
   from a page not taken yet where there is one, then files of other pages,
   then (for a component drawn on one page) its other states; most instances
   first, and a file read anyway before another */
function sample(keys, max, plan) {
  const out = [], pages = new Set();
  const by = (a, b) => (pages.has(a.page) - pages.has(b.page)) || (b.n - a.n) || (plan.has(b.rel) - plan.has(a.rel)) || (a.rel < b.rel ? -1 : 1);
  const add = (x) => { if (x && out.length < max && !out.includes(x)) { out.push(x); pages.add(x.page); } };
  for (const kind of ['default', 'empty', 'error']) add(keys.filter((x) => x.kind === kind).sort(by)[0]);
  for (const x of keys.filter((k) => !out.includes(k)).sort((a, b) => ((a.kind !== 'default') - (b.kind !== 'default')) || by(a, b))) if (!pages.has(x.page)) add(x);
  for (const x of keys.filter((k) => !out.includes(k)).sort(by)) { if (out.length >= Math.min(2, max)) break; add(x); }
  return out;
}

/* what the registry keeps of a page's labels: the regions a session checks a
   PRD's nouns against. rows and text, and the roles' phone layouts, are in
   product/pages/<page>.md (the entry's `more`). */
const KEEP = ['title', 'heads', 'nav', 'tabs', 'filters', 'table', 'cards', 'fields', 'stats', 'cta', 'btn', 'empty'];
const cap = (v, n) => (Array.isArray(v) && !Array.isArray(v[0]) && v.length > n ? [...v.slice(0, n), `…+${v.length - n}`] : v);
export function compactLabels(full, slug) {
  const pick = (o, keys = KEEP) => Object.fromEntries(Object.entries(o).filter(([k]) => keys.includes(k)).map(([k, v]) => [k, k === 'cards' && v ? Object.fromEntries(Object.entries(v).map(([n, s]) => [n, s && s.length > 240 ? `${s.slice(0, 239)}…` : s])) : cap(v, 14)]));
  const out = pick(full);
  if (full['375']) { const m = pick(full['375']); if (Object.keys(m).length) out['375'] = m; }
  for (const r of ['staff', 'individual']) if (full[r] === 'blank') out[r] = 'blank'; else if (full[r]) { const m = pick(full[r]); if (Object.keys(m).length) out[r] = m; }
  if (full.emptied && full.emptied.empty) out.emptied = full.emptied.empty;
  out.more = `product/pages/${slug}.md`;
  return out;
}

/* ── product/pages/<page>.md ───────────────────────────────────────────── */
const SECT = [['375', 'Phone 375 — what differs from web'], ['staff', 'As staff — what differs from the owner (web)'], ['staff375', 'As staff — what differs from the owner (375)'],
  ['individual', 'As individual — what differs from the owner (web)'], ['individual375', 'As individual — what differs from the owner (375)'], ['emptied', 'Empty (`empty` state, web) — what differs'], ['emptied375', 'Empty (`empty` state, 375) — what differs']];
const NAMES = { title: 'Page title', heads: 'Headings', nav: 'Navigation', tabs: 'Tabs', filters: 'Filters', fields: 'Fields', pager: 'Pager', table: 'Table columns', rows: 'Table cells', cards: 'Repeated cards', stats: 'Figures', cta: 'Primary buttons', btn: 'Buttons and links', empty: 'Empty block', text: 'Other product copy shown' };
const mdVal = (k, v) => {
  if (v === null) return '— none';
  if (typeof v === 'string') return v;
  if (Array.isArray(v)) return Array.isArray(v[0]) ? v.map((x, i) => `\n  ${i + 1}. ${x.join(' · ')}`).join('') : v.join(' · ');
  return Object.entries(v).map(([n, s]) => `\n  - **${n}** — ${s ?? 'none'}`).join('');
};
const mdRegions = (R) => Object.entries(R).filter(([k]) => NAMES[k]).map(([k, v]) => (k === 'rows' && Array.isArray(v) ? v.map((t, i) => `- **${NAMES[k]} ${i + 1}**:${mdVal(k, t)}`).join('\n') : `- **${NAMES[k]}**: ${mdVal(k, v)}`)).join('\n');
export function pageMarkdown(slug, route, full) {
  const r = typeof route === 'string' ? { route } : route;
  const body = [`# ${slug} — what the page shows`, '',
    `Route \`${r.route}\`${r.fixture_url && r.fixture_url !== r.route ? ` (the fixture's URL \`${r.fixture_url}\`)` : ''} · measured from \`pages/${slug}.html\` (web 1440)${full['375'] ? `, \`pages/${slug}.mobile.html\` (375)` : ''}${full.staff ? ', the `as-staff` and `as-individual` states' : ''}${full.emptied ? ' and `empty`' : ''}.`,
    'Labels are verbatim. ‹…› is fixture data by its kind (‹date›, ‹time›, ‹n›, ‹text›; ‹title› a bold one; a number inside a label is ‹n›: "‹n› Users"); ‹map› is the map, which the recorder draws without its API key; `(n)` a count as rendered; `[…]` a placeholder; `=…` a select\'s or a read-only field\'s shown value; `{…}` its options, `x (Tag)` an option that carries a tag; `a|b` texts that change from item to item; `‹text›|x` fixture data where some items draw the product\'s `x` instead; `(sometimes x)` a label only some items draw; `| x` a label other items draw instead; `n×` how many items the compiled page draws; `-x` / `+x` a label gone / added; "— none" a region the file does not draw.', '',
    '## Web 1440', '', mdRegions(full)];
  for (const [k, h] of SECT) if (full[k] === 'blank') body.push('', `## ${h}`, '', '- draws no content of its own: the shell only'); else if (full[k] && Object.keys(full[k]).length) body.push('', `## ${h}`, '', mdRegions(full[k]));
  return `${body.join('\n')}\n`;
}
