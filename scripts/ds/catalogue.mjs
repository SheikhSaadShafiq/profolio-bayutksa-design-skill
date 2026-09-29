#!/usr/bin/env node
/**
 * The design system, cut out of the compiled pages.
 *
 * Every component here is an element the product drew — found by
 * scripts/ds/collect.mjs on the compiled pages, with the markup it had and the
 * ancestors it sat in. Nothing is redrawn. A component page shows each variant
 * LIVE, styled by the one stylesheet the pages use (deliverables/profolio.css),
 * and each example is held to a screenshot of the same element in its page: a
 * component whose cut-out copy does not match where it came from says so on
 * its own page and in the index.
 *
 * HOW A COMPONENT IS CUT OUT WITHOUT CHANGING
 *   · its ancestors come with it, as `display: contents` boxes that draw
 *     nothing — so `.pf-card .pf-btn` still matches, and nothing is added
 *     around it
 *   · the innermost of them carries the parent's inherited text styles (font,
 *     colour, line height, direction…), which is everything an element takes
 *     from where it stood
 *   · it keeps its own rendered width and height, so the layout inside it is
 *     the layout it had; a positioned element (popover, tooltip, modal) is
 *     set back into the flow at its own size
 *
 * THE ATOMIC SCALE — decided by rule, not by feel, so it can be argued with:
 *   base (antd) components   by what they are (scripts/ds/collect.mjs BASE)
 *   product components       by where the product keeps them —
 *     src/layout/…                               template
 *     src/container/pages/…                      page (listed with the pages)
 *     icons (svg.js, icons.js, upgrade-icons, *Icon) and the primitives in
 *     src/components/common/{button,tag,text,…}  atom
 *     src/components/common/{select,statistic,…} molecule
 *     src/components/common/{dataTable,modals,…} organism
 *     anything else by what it contains: no other product component → atom;
 *     one or two → molecule; more, or larger than 600×250 → organism
 *
 *   node scripts/ds/catalogue.mjs
 *
 * Writes deliverables/design-system.html, deliverables/components/<slug>.html,
 * deliverables/components/states.css (hover/focus/active forced by class),
 * deliverables/components/img/, and data/qa/components.json.
 */
import pkg from 'playwright';
import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync, readdirSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { splitRules, preludeOf } from './css.mjs';
import { pixelDiff } from '../lib/pixels.mjs';
import { DEVICES } from '../../harness/devices.mjs';
import { NESTED_A, realLinks, needsRestore } from '../lib/nested-a.mjs';

const { chromium } = pkg;
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const DELIV = join(ROOT, 'deliverables');
const COMP = join(DELIV, 'components');
const DS = join(ROOT, 'data', 'ds');
const BAR = 1.0;                                   /* a cut-out may differ from its in-page shot by ≤1% */
/* The responsive layout is the product at a phone's width — and the
   stylesheet decides a great deal by width (767, 575, 400px breakpoints). A
   responsive example is therefore shown in a frame exactly as wide as the
   phone it was drawn on, where those rules match as they did there; set
   beside the web examples in the page itself, they would not. */
const PHONE_W = DEVICES.mobile.viewport.width;
const isMob = (v) => v.device === 'mobile';

const inst = JSON.parse(readFileSync(join(DS, 'instances.json'), 'utf8'));
const reg = existsSync(join(DS, 'components.json')) ? JSON.parse(readFileSync(join(DS, 'components.json'), 'utf8')) : {};
const tokens = existsSync(join(DS, 'tokens.json')) ? JSON.parse(readFileSync(join(DS, 'tokens.json'), 'utf8')) : null;
const kbIndex = existsSync(join(DS, 'kb-links.json')) ? JSON.parse(readFileSync(join(DS, 'kb-links.json'), 'utf8')) : null;
const CSS = readFileSync(join(DELIV, 'profolio.css'), 'utf8');
/* the responsive layout has its own sheet (scripts/ds/stylesheet.mjs) */
const MOBILE_SHEET = existsSync(join(DELIV, 'profolio.mobile.css')) ? 'profolio.mobile.css' : 'profolio.css';
const CSS_M = readFileSync(join(DELIV, MOBILE_SHEET), 'utf8');

/* ── classify ─────────────────────────────────────────────────────────── */
const SKIP_DEF = /^src\/(App\.jsx|router\.js|index\.jsx)|\/(routes|router)\//;
const ICON = /(^|\/)(svg\.js|icons\.js)$|\/upgrade-icons\//;
const ATOMS = /src\/components\/common\/(button|tag|text|title|heading|icon|avatar|number|divider|switch|image|lottie|loader-wrapper|flex|group|Label|radio-button)\//;
const MOLECULES = /src\/components\/common\/(textWithIcon|link-with-icon|statistic|select|datePicker|dateSelect|segmented|dropdown|unitSelect|unitRangeSlider|rangeSlide|textInput|alert|EmptyState|popup|listingActionPopover|infinite-scroll)\//;
const ORGANISMS = /src\/components\/common\/(dataTable|drawer|modals|navbar|filters|cards|custom-card|image-gallery|image-uploads|json-form)\//;
const kebab = (s) => s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').replace(/([A-Z])([A-Z][a-z])/g, '$1-$2').replace(/[^\w-]+/g, '-').replace(/-+/g, '-').toLowerCase().replace(/^-|-$/g, '');

const all = [];
for (const c of inst.components) {
  if (c.family === 'product') {
    const def = (reg[c.key] && reg[c.key].def) || c.key.split('@')[1] || '';
    if (SKIP_DEF.test(def)) continue;
    c.def = def;
    const icon = ICON.test(def) || /Icon$/.test(c.name);
    const v0 = c.variants[0];
    const big = v0 && v0.w * v0.h > 600 * 250;
    const kids = c.children.filter((k) => !/Icon@|@src\/components\/common\/(flex|group|text|icon)\//.test(k)).length;
    const pageSized = v0 && v0.w >= 1200 && v0.h >= 700;
    c.level = /^src\/layout\//.test(def) ? 'template'
      : (/^src\/container\/pages\//.test(def) && (big || kids > 3)) || /^src\/home\.js$/.test(def) || pageSized ? 'page'
        : icon || ATOMS.test(def) ? 'atom'
          : MOLECULES.test(def) ? 'molecule'
            : ORGANISMS.test(def) ? 'organism'
              : kids === 0 && !big ? 'atom' : kids <= 2 && !big ? 'molecule' : 'organism';
    c.group = icon ? 'Icons' : /^src\/components\/common\//.test(def) ? 'Product primitives' : /widgets\//.test(def) ? 'Widgets'
      : /^src\/layout\//.test(def) ? 'Shell' : /^src\/container\/pages\//.test(def) ? 'Page sections' : 'Product components';
  } else {
    c.def = null;
    c.group = 'antd, as the product themes it';
  }
  c.slug = (c.family === 'base' ? 'antd-' : '') + kebab(c.name);
  all.push(c);
}
/* two product components can share a name (Wrapper, Card…): the file decides */
const bySlug = new Map();
for (const c of all) { const k = c.slug; if (bySlug.has(k)) c.slug = `${k}-${kebab((c.def || '').split('/').slice(-2, -1)[0] || 'x')}`; bySlug.set(c.slug, c); }
const findByKey = new Map(all.map((c) => [c.key, c]));

/* ── forced states: every :hover/:focus/:active rule, again, keyed to a class ── */
const PSEUDO = { hover: ':hover', focus: ':focus', 'focus-visible': ':focus-visible', active: ':active', 'focus-within': ':focus-within' };
const forced = [];
const withStates = (rule) => {
  const pre = preludeOf(rule);
  if (pre.startsWith('@media') || pre.startsWith('@supports')) {
    const inner = splitRules(rule.slice(rule.indexOf('{') + 1, rule.lastIndexOf('}'))).map(withStates).filter(Boolean);
    return inner.length ? `${pre} {\n${inner.join('\n')}\n}` : '';
  }
  if (pre.startsWith('@') || !/:(hover|focus|focus-visible|active|focus-within)\b/.test(pre)) return '';
  /* only the selector parts that HAD the pseudo-class. Copying the whole list
     re-applied its plain parts (`.pf-tag, .pf-tag a, .pf-tag a:hover`) after
     the whole of profolio.css, so they won over the product's later rules and
     a teal tag came out white. */
  const parts = pre.split(/,(?![^(]*\))/).filter((p) => /:(hover|focus|focus-visible|active|focus-within)\b/.test(p));
  const sel = parts.map((p) => p.replace(/:(focus-visible|focus-within|hover|focus|active)\b/g, (m, s) => `.ds-${s}`).trim()).join(', ');
  return sel + ' ' + rule.slice(rule.indexOf('{'));
};
for (const r of splitRules(CSS)) { const f = withStates(r); if (f) forced.push(f); }

/* ── write ────────────────────────────────────────────────────────────── */
rmSync(COMP, { recursive: true, force: true });
mkdirSync(join(COMP, 'img'), { recursive: true });
writeFileSync(join(COMP, 'states.css'), `/* Every :hover, :focus, :focus-visible, :active and :focus-within rule in
   profolio.css, again, with the pseudo-class replaced by a class (.ds-hover…),
   so a component page can SHOW a state instead of asking the reader to find
   it with the pointer. Generated by scripts/ds/catalogue.mjs. */\n${forced.join('\n')}\n`);

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const clean = (html) => html.replace(/ data-pf-(src|c|i|go|scroll|hover|focus|focus-visible|focus-within|active)(="[^"]*")?/g, '').replace(/ data-ds-[\w-]+="[^"]*"/g, '');
const LEVELS = ['atom', 'molecule', 'organism', 'template', 'page'];
const LEVEL_TITLE = { atom: 'Atoms', molecule: 'Molecules', organism: 'Organisms', template: 'Templates', page: 'Page sections' };

/* the element, standing in the ancestors it was drawn in */
const stage = (v, extra = '', stateClass = '', pad = '') => {
  const sid = `${v.id}${stateClass ? '--' + stateClass : ''}`;
  let html = v.html.replace(/^<([a-z0-9-]+)/i, (m) => `${m} data-ds-example="${sid}"`);
  const fx = +(v.x % 1).toFixed(4), fy = +(v.y % 1).toFixed(4);
  const disp = v.display && !['contents', 'none'].includes(v.display) ? v.display : null;
  /* an INLINE root is placed by the box around it: an inline box takes no
     vertical margin, and a left margin moves only its first line */
  const inlineRoot = v.display === 'inline' && v.parentWidth;
  const fix = [`width:${v.w}px!important`, `height:${v.h}px!important`, 'box-sizing:border-box!important',
    /* the page's sub-pixel offset, carried as margin (not transform or
       position, which would change what its absolute children measure from);
       the verify pass corrects it for wherever the stage actually landed */
    ...(inlineRoot ? [] : [`margin:${fy}px 0 0 ${fx}px!important`]), 'max-width:none!important', 'min-width:0!important', 'flex:none!important'];
  if (disp) fix.push(`display:${disp}!important`);
  /* a positioned element (popover, tooltip, badge) goes back into the flow
     at its own size; its own transform stays — a rotated tag is designed so */
  if (v.positioned) fix.push('position:relative!important', 'inset:auto!important');
  html = /^<[^>]+\sstyle="/i.test(html)
    ? html.replace(/^(<[^>]+\sstyle=")([^"]*)"/i, (m, a, b) => `${a}${b};${fix.join(';')}"`)
    : html.replace(/^<([a-z0-9-]+)/i, (m) => `${m} style="${fix.join(';')}"`);
  if (stateClass) html = html.replace(/^(<[^>]+\sclass=")/i, `$1ds-${stateClass} `);
  const inherited = Object.entries(v.inherited).map(([k, x]) => `${k}:${x}`).join(';');
  let open = '', close = '';
  v.chain.forEach((a, i) => {
    /* an ancestor the parser is particular about (a <p>, a link, a button,
       a form, a heading) is written as <pf-el>, like the cut-out itself: the
       example inside it must not close it */
    const tag = a.tag === 'body' ? 'div' : /^(p|a|button|form|h[1-6])$/.test(a.tag) ? 'pf-el' : a.tag;
    const tagAttr = tag === 'pf-el' ? ` data-pf-tag="${a.tag}"` : '';
    const last = i === v.chain.length - 1;
    const attrs = a.attrs.map(([k, x]) => ` ${k}="${esc(x)}"`).join('');
    /* an INLINE root has no width of its own: its parent becomes a real box
       as wide as the one it was laid out in, drawing nothing itself */
    const box = last && inlineRoot
      ? `display:block;width:${v.parentWidth}px;padding:0;margin:${fy}px 0 0 ${fx}px!important;border-color:transparent;background:transparent;box-shadow:none`
      : 'display:contents';
    open += `<${tag}${tagAttr}${a.cls ? ` class="${esc(stateClass && last ? `${a.cls} ds-${stateClass}` : a.cls)}"` : ''}${attrs}${last && inlineRoot ? ` data-ds-place="${sid}"` : ''} style="${box}${last ? ';' + esc(inherited) : ''}">`;
    close = `</${tag}>` + close;
  });
  /* the stage is the ground the element stood on in its page */
  return `<div class="ds-stage${extra}" style="background:${esc(v.ground || '#fff')}${pad ? `;padding:${pad}` : ''}">${open}${html}${close}</div>`;
};

/* A responsive example: the same cut-out, in a frame as wide as the phone.
   The frame's document links the one stylesheet (relative to the component
   page, which is what an srcdoc document resolves against) and nothing of the
   catalogue's own chrome. An element wider than the phone — the product
   overflows it in places — widens the frame just enough to be seen whole. */
const FRAME_CSS = 'html,body{margin:0!important;padding:0!important;background:transparent!important;height:auto!important;overflow:hidden!important;scrollbar-width:none}html::-webkit-scrollbar{display:none}.ds-stage{box-sizing:border-box;overflow:visible}';
const frameSize = (v) => {
  const w = Math.max(PHONE_W, Math.ceil(v.w + 1));
  const padX = v.w + 32 <= w ? 16 : 0;
  return { w, padX, padY: 16, h: Math.ceil(v.h + 1) + 32 };
};
const framed = (v) => {
  const { w, h, padX, padY } = frameSize(v);
  const st = stage(v, ' ds-stage--frame', '', `${padY}px ${padX}px`);
  const doc = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="../${MOBILE_SHEET}"><link rel="stylesheet" href="states.css"><style>${FRAME_CSS}</style></head><body>${st}${needsRestore(st) ? `<script>${NESTED_A}</script>` : ''}</body></html>`;
  return `<div class="ds-phone"><span class="ds-phone-w">${w}px${w > PHONE_W ? ` — wider than the ${PHONE_W}px phone, as in the product` : ''}</span><iframe class="ds-frame" data-ds-frame="${v.id}" title="${esc(v.id)} at ${w}px" width="${w}" height="${h}" srcdoc="${esc(doc)}"></iframe></div>`;
};

const usage = (c) => Object.entries(c.pages).sort((a, b) => b[1] - a[1]);
/* a responsive page's name carries --mobile; its file is under mobile/ */
const pageLink = (name, fromComponents = true) => {
  const mob = /--mobile$/.test(name);
  const base = mob ? name.slice(0, -'--mobile'.length) : name;
  return `${fromComponents ? '../' : ''}${mob ? 'mobile/' : ''}${base.includes('--') ? 'states/' : ''}${base}.html`;
};
const pageTitle = (name) => name.replace(/--mobile$/, '');
const levelOf = (c) => c.level || 'atom';
const variantLabel = (v) => {
  const [, cls, h] = v.variant.split('|');
  const mods = cls.split('.').filter(Boolean).map((x) => x.replace(/^pf-/, '')).filter((x) => !/^(theme)$/.test(x));
  return `${mods.slice(0, 6).join(' · ') || 'default'} · ${Math.round(v.w)}×${Math.round(v.h)}`;
};

const chrome = (title, crumbs, body) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)} — Profolio KSA design system</title>
<link rel="stylesheet" href="../profolio.css">
<link rel="stylesheet" href="states.css">
<link rel="stylesheet" href="../ds.css">
</head>
<body class="ds">
<nav class="ds-crumbs"><a href="../design-system.html">Profolio KSA design system</a>${crumbs.map((c) => ` <span>›</span> ${c}`).join('')}</nav>
<main class="ds-main">
${body}
</main>
${needsRestore(body) ? `<script>${NESTED_A}</script>
` : ''}</body>
</html>
`;

/* an organism, template or page section is a big piece of markup; the three
   variants the product uses most say what it is, and eight of them would
   make one component page weigh as much as a whole compiled page */
for (const c of all) {
  const heavy = ['organism', 'template', 'page'].includes(c.level) || (c.variants[0] && c.variants[0].bytes > 60000);
  /* per layout: three web and three responsive */
  if (heavy) c.variants = ['web', 'mobile'].flatMap((d) => c.variants.filter((v) => (v.device || 'web') === d).sort((a, b) => b.count - a.count).slice(0, 3));
}
/* web first, then responsive — the order every list on a component page keeps */
for (const c of all) c.variants = [...c.variants.filter((v) => !isMob(v)), ...c.variants.filter(isMob)];
/* ── THE STATE TABLE of an interactive component ───────────────────────────
   Rows are the variants the product uses, columns the states a control goes
   through. Each cell says where it came from:
     seen     — the product drew it; the example is one of the verified variants
     forced   — hover / focus / press: the product's own :hover, :focus and
                :active rules, keyed to a class (states.css)
     derived  — the product's own state class or attribute put on the default
                variant, shown only where profolio.css has rules for it
     —        — the product never draws it, and nothing here invents it */
const FAMILIES = [
  { root: 'pf-btn', states: [['disabled', { attr: 'disabled', seen: /\[disabled\]|pf-btn-disabled/, css: /\.pf-btn(?:[\w.-]*)?(?::disabled|\[disabled\])/ }], ['loading', { cls: 'pf-btn-loading', seen: /pf-btn-loading/ }]] },
  { root: 'pf-input-affix-wrapper', states: [['focused', { cls: 'pf-input-affix-wrapper-focused', seen: /focused/ }], ['disabled', { cls: 'pf-input-affix-wrapper-disabled', seen: /disabled/ }], ['error', { cls: 'pf-input-affix-wrapper-status-error', seen: /status-error/ }], ['warning', { cls: 'pf-input-affix-wrapper-status-warning', seen: /status-warning/ }]] },
  { root: 'pf-input', states: [['disabled', { cls: 'pf-input-disabled', seen: /pf-input-disabled|\[disabled\]/ }], ['error', { cls: 'pf-input-status-error', seen: /status-error/ }], ['warning', { cls: 'pf-input-status-warning', seen: /status-warning/ }]] },
  { root: 'pf-input-number', states: [['focused', { cls: 'pf-input-number-focused', seen: /focused/ }], ['disabled', { cls: 'pf-input-number-disabled', seen: /disabled/ }], ['error', { cls: 'pf-input-number-status-error', seen: /status-error/ }]] },
  { root: 'pf-select', states: [['focused', { cls: 'pf-select-focused', seen: /pf-select-focused/ }], ['open', { cls: 'pf-select-open', seen: /pf-select-open/ }], ['disabled', { cls: 'pf-select-disabled', seen: /pf-select-disabled/ }], ['error', { cls: 'pf-select-status-error', seen: /status-error/ }]] },
  { root: 'pf-picker', states: [['focused', { cls: 'pf-picker-focused', seen: /pf-picker-focused/ }], ['disabled', { cls: 'pf-picker-disabled', seen: /pf-picker-disabled/ }], ['error', { cls: 'pf-picker-status-error', seen: /status-error/ }]] },
  { root: 'pf-checkbox-wrapper', states: [['checked', { seen: /checked/ }], ['disabled', { seen: /disabled/ }]] },
  { root: 'pf-radio-wrapper', states: [['checked', { seen: /checked/ }], ['disabled', { seen: /disabled/ }]] },
  { root: 'pf-radio-button-wrapper', states: [['checked', { seen: /checked/ }], ['disabled', { seen: /disabled/ }]] },
  { root: 'pf-switch', states: [['on', { cls: 'pf-switch-checked', seen: /pf-switch-checked|\[aria-checked\]/ }], ['disabled', { cls: 'pf-switch-disabled', seen: /pf-switch-disabled/ }], ['loading', { cls: 'pf-switch-loading', seen: /pf-switch-loading/ }]] },
];
const MARKER = /(^|\.)pf-[\w-]*?-(disabled|loading|checked|focused|open|status-error|status-warning|indeterminate)(?=\.|\[|$)|\[(disabled|aria-checked|aria-disabled|checked|aria-selected|aria-expanded)\]/g;
const hasMarker = (sig) => new RegExp(MARKER.source).test(sig);
const baseSig = (v) => v.variant.split('|')[1].replace(MARKER, '$1').replace(/\.{2,}/g, '.').replace(/^\.|\.$/g, '');
const familyOf = (c) => {
  const v = c.variants.find((x) => !isMob(x));
  if (!v) return null;
  const cls = v.variant.split('|')[1].split(/[.[]/);
  return FAMILIES.find((f) => cls.includes(f.root)) || null;
};
/* a state-table row's name: the modifiers that make the variant, without
   the family's own class, antd's colour/variant bookkeeping or the product's
   styled-component names */
const shortLabel = (v, root) => {
  const [, cls] = v.variant.split('|');
  const mods = cls.split(/[.[\]]/).filter(Boolean).map((x) => x.replace(/^pf-/, ''))
    .filter((x) => x !== root.replace(/^pf-/, '') && !/^(theme|.*-styled(--v\d+)?|.*-color-\w+|.*-variant-\w+|styleProfolio)$/.test(x) && !x.startsWith('css-'))
    .map((x) => x.replace(new RegExp(`^${root.replace(/^pf-/, '')}-`), ''));
  return `${[...new Set(mods)].slice(0, 4).join(' · ') || 'default'} · ${Math.round(v.w)}×${Math.round(v.h)}`;
};
const derive = (v, st, how) => {
  let html = v.html;
  if (how.attr) html = html.replace(/^<([a-z0-9-]+)/i, (m) => `${m} ${how.attr}=""`);
  if (how.cls) html = /^<[^>]+\sclass="/i.test(html) ? html.replace(/^(<[^>]+\sclass=")/i, `$1${how.cls} `) : html.replace(/^<([a-z0-9-]+)/i, (m) => `${m} class="${how.cls}"`);
  return { ...v, id: `${v.id}--st-${st}`, html };
};
const stateTable = (c) => {
  const fam = familyOf(c);
  if (!fam) return '';
  const web = c.variants.filter((v) => !isMob(v));
  /* rows: the variants without a state of their own, most used first */
  const groups = new Map();
  for (const v of web) { const b = baseSig(v); if (!groups.has(b)) groups.set(b, []); groups.get(b).push(v); }
  const rows = [...groups.values()].map((g) => ({ def: g.find((v) => !hasMarker(v.variant.split('|')[1])) || g[0], all: g })).sort((a, b) => b.def.count - a.def.count).slice(0, 4);
  const forcedOk = (v) => forced.some((f) => v.variant.split('|')[1].split('.').some((cls) => cls && f.includes('.' + cls)));
  const cols = [['default'], ['hover', 'hover'], ['focus', 'focus-visible'], ['pressed', 'active'], ...fam.states];
  const cell = (row, [st, how]) => {
    const v0 = row.def;
    if (st === 'default') return [stage(v0, ' ds-stage--state'), 'seen'];
    if (typeof how === 'string') return forcedOk(v0) ? [stage(v0, ' ds-stage--state', how), 'forced'] : ['', '—'];
    const seen = row.all.find((v) => v !== v0 && how.seen.test(v.variant.split('|')[1]));
    if (seen) return [stage(seen, ' ds-stage--state'), 'seen'];
    const ruleOk = how.css ? how.css.test(CSS) : how.cls ? CSS.includes('.' + how.cls) : false;
    if ((how.cls || how.attr) && ruleOk) return [stage(derive(v0, st, how), ' ds-stage--state'), 'derived'];
    return ['', '—'];
  };
  const mob = c.variants.filter(isMob);
  const mobSeen = fam.states.filter(([, how]) => mob.some((v) => how.seen.test(v.variant.split('|')[1]))).map(([st]) => st);
  return `
<section class="ds-section" id="states">
<h2>States <small>web · 1440</small></h2>
<p class="ds-note">Every state the control goes through, for the variants the product uses. <b>seen</b>: drawn by the product and verified above; <b>forced</b>: the product's own :hover, :focus and :active rules, keyed to a class; <b>derived</b>: the product's own state class on the default variant, shown only where its stylesheet styles it; <b>—</b>: the product never draws it.</p>
<div class="ds-state-scroll"><table class="ds-state-table">
<tr><th></th>${cols.map(([st]) => `<th>${st}</th>`).join('')}</tr>
${rows.map((row) => `<tr><th title="${esc(variantLabel(row.def))}">${esc(shortLabel(row.def, fam.root))}</th>${cols.map((col) => { const [h, how] = cell(row, col); return `<td>${h ? `<div class="ds-state-cell">${h}</div>` : ''}<small class="ds-how ds-how--${how === '—' ? 'none' : how}">${how}</small></td>`; }).join('')}</tr>`).join('\n')}
</table></div>
${mob.length ? `<p class="ds-note"><b>Responsive:</b> ${mobSeen.length ? `the phone layout draws it ${mobSeen.join(', ')} as well as by default` : 'the phone layout draws only its default states'} — see the responsive variants above; a phone has no hover.</p>` : ''}
</section>`;
};

const pages = [];
const MOBILE_PAGES = inst.pages.filter((p) => /--mobile$/.test(p)).length;
const figure = (v, i) => `
<figure class="ds-example${isMob(v) ? ' ds-example--phone' : ''}" id="v${i + 1}">
  ${isMob(v) ? framed(v) : stage(v)}
  <figcaption>
    <span class="ds-vname">${esc(variantLabel(v))}</span>
    <span class="ds-meta">${v.count}× · first seen on <a href="${pageLink(v.page)}">${esc(pageTitle(v.page))}</a></span>
    <span class="ds-match" data-ds-match="${v.id}">not yet verified</span>
  </figcaption>
  <div class="ds-spec" data-ds-spec="${v.id}"></div>
  <details><summary>HTML</summary><pre class="ds-code"><code>${esc(realLinks(clean(v.html)).slice(0, 30000))}${v.html.length > 30000 ? '\n… (truncated — the full markup is in the page it came from)' : ''}</code></pre></details>
  <details><summary>CSS</summary><pre class="ds-code ds-css" data-ds-css="${v.id}"><code>computed at build time</code></pre></details>
</figure>`;
const useList = (list) => `<ul class="ds-uses">${list.map(([p, n]) => `<li><a href="${pageLink(p)}">${esc(pageTitle(p))}</a> <small>${n}×</small></li>`).join('')}</ul>`;
for (const c of all) {
  if (!c.variants.length) continue;
  const lvl = levelOf(c);
  const uses = usage(c);
  const webUses = uses.filter(([p]) => !/--mobile$/.test(p)), mobUses = uses.filter(([p]) => /--mobile$/.test(p));
  const total = uses.reduce((n, [, k]) => n + k, 0);
  const kids = c.children.map((k) => findByKey.get(k)).filter(Boolean).filter((k, i, a) => a.indexOf(k) === i);
  const parents = all.filter((p) => p.children.includes(c.key));
  const web = c.variants.filter((v) => !isMob(v)), mob = c.variants.filter(isMob);
  /* hover, focus and press are pointer states: shown for the web layout */
  const hasStates = web.length && forced.some((f) => web.some((v) => v.variant.split('|')[1].split('.').some((cls) => cls && f.includes('.' + cls))));
  const v0 = web[0] || mob[0];
  const count = (n, one) => `${n} ${one}${n === 1 ? '' : 's'}`;
  const body = `
<header class="ds-head">
  <p class="ds-kicker">${LEVEL_TITLE[lvl].replace(/s$/, '')} · ${c.family === 'base' ? 'antd base component' : 'product component'}${c.group ? ` · ${esc(c.group)}` : ''}${!web.length ? ' · responsive only' : MOBILE_PAGES && !mob.length && !mobUses.length ? ' · web only' : ''}</p>
  <h1>${esc(c.name)}</h1>
  <p class="ds-lede">${c.family === 'base'
    ? `antd's <code>${esc(c.name)}</code> exactly as the product themes it — root class <code>.${esc(c.key)}</code>.`
    : `Defined in <code>${esc(c.def)}</code>.`} ${count(web.length, 'web variant')}${MOBILE_PAGES ? ` and ${count(mob.length, 'responsive variant')}` : ''}, found across ${count(uses.length, 'page')} and states — ${count(total, 'instance')} in all.</p>
</header>

<section class="ds-section" id="web">
<h2>Web <small>1440 wide</small></h2>
${web.length ? web.map((v) => figure(v, c.variants.indexOf(v))).join('\n') : '<p class="ds-note">Not drawn in the web layout — the product renders it only in its responsive layout.</p>'}
</section>
${MOBILE_PAGES ? `
<section class="ds-section" id="responsive">
<h2>Responsive <small>${PHONE_W} wide · phone</small></h2>
${mob.length ? `<p class="ds-note">The product's responsive layout, which it picks by device (a phone's browser), not by window width. Each example is shown in a frame ${PHONE_W}px wide, where the stylesheet's breakpoints match as they did on the phone.</p>
${mob.map((v) => figure(v, c.variants.indexOf(v))).join('\n')}` : `<p class="ds-note">${mobUses.length ? `Drawn ${mobUses.reduce((n, [, k]) => n + k, 0)}× in the responsive layout, but no example could be cut out of it.` : `Not drawn in the responsive layout — none of the ${MOBILE_PAGES} responsive pages and states uses it.`}</p>`}
</section>` : ''}
${stateTable(c)}
${!familyOf(c) && hasStates && lvl !== 'organism' && lvl !== 'template' && v0.w * v0.h < 400 * 200 ? `
<section class="ds-section">
<h2>Interaction states</h2>
<p class="ds-note">Forced with the classes in <code>components/states.css</code> — the product's own <code>:hover</code>, <code>:focus</code> and <code>:active</code> rules, keyed to a class so they can be shown side by side.</p>
<div class="ds-states">
${['hover', 'focus-visible', 'active'].map((s) => `<figure class="ds-example ds-example--state">${stage(v0, ' ds-stage--state', s)}<figcaption><span class="ds-vname">${s}</span></figcaption></figure>`).join('\n')}
</div>
</section>` : ''}
${kids.length ? `
<section class="ds-section">
<h2>Made of</h2>
<ul class="ds-chips">${kids.map((k) => `<li><a href="${k.slug}.html">${esc(k.name)}</a> <small>${esc(levelOf(k))}</small></li>`).join('')}</ul>
</section>` : ''}
${parents.length ? `
<section class="ds-section">
<h2>Used inside</h2>
<ul class="ds-chips">${parents.slice(0, 40).map((k) => `<li><a href="${k.slug}.html">${esc(k.name)}</a> <small>${esc(levelOf(k))}</small></li>`).join('')}</ul>
</section>` : ''}
${kbIndex && c.def && kbIndex.byDef[c.def] ? `
<section class="ds-section">
<h2>In the knowledge base</h2>
<ul class="ds-uses">${kbIndex.byDef[c.def].map((l) => `<li><a href="../../kb/${l.href}">${esc(l.title)}</a> <small>${l.kind === 'copy' ? 'the strings it renders' : 'notes'}</small></li>`).join('')}</ul>
</section>` : ''}
<section class="ds-section">
<h2>Where it appears</h2>
${webUses.length ? `${mobUses.length ? '<h3>Web</h3>' : ''}${useList(webUses)}` : ''}
${mobUses.length ? `<h3>Responsive</h3>${useList(mobUses)}` : ''}
${c.src.length ? `<h3>Drawn by</h3><ul class="ds-uses">${c.src.map((s) => `<li><code>${esc(s)}</code></li>`).join('')}</ul>` : ''}
</section>`;
  writeFileSync(join(COMP, `${c.slug}.html`), chrome(c.name, [`<a href="../design-system.html#${lvl}">${LEVEL_TITLE[lvl]}</a>`, esc(c.name)], body));
  for (const v of c.variants) { const r = join(DS, 'ref', `${v.id}.png`); if (existsSync(r)) copyFileSync(r, join(COMP, 'img', `${v.id}.png`)); }
  pages.push(c);
}

/* ── token names for measured values ─────────────────────────────────── */
const TOKCSS = existsSync(join(DELIV, 'tokens.css')) ? readFileSync(join(DELIV, 'tokens.css'), 'utf8') : '';
const TOK = [...TOKCSS.matchAll(/(--pf-[\w-]+)\s*:\s*([^;]+);/g)].map((m) => [m[1], m[2].trim().toLowerCase()]);
const hex = (c) => {
  const m = String(c || '').match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/);
  if (!m) return String(c || '').toLowerCase();
  const h = (x) => Math.round(+x).toString(16).padStart(2, '0');
  const a = m[4] === undefined ? '' : +m[4] === 1 ? '' : h(+m[4] * 255);
  return `#${h(m[1])}${h(m[2])}${h(m[3])}${a}`;
};
const COLOUR_NAMES = new Map((tokens && tokens.colours ? tokens.colours : []).map((c) => [String(c.value).toLowerCase(), (c.names || []).map((x) => x.name)]));
const colourName = (c) => {
  const h = hex(c);
  const theme = COLOUR_NAMES.get(h);
  if (theme && theme.length) return theme[0];
  const t = TOK.find(([, v]) => v === h);
  return t ? t[0] : null;
};
const lengthName = (px, hint) => {
  if (!px) return null;
  const t = TOK.find(([k, v]) => v === `${px}px` && k.includes(hint));
  return t ? t[0] : null;
};
const SPECS = {};
const specHtml = (sp) => {
  if (!sp) return '';
  const k = (x) => (x ? ` <code>${esc(x)}</code>` : '');
  const box = (a) => (a.every((x) => x === a[0]) ? `${a[0]}` : a[0] === a[2] && a[1] === a[3] ? `${a[0]} ${a[1]}` : a.join(' '));
  const rows = [];
  rows.push(['size', `${Math.round(sp.size[0] * 10) / 10} × ${Math.round(sp.size[1] * 10) / 10}`]);
  if (sp.padding.some(Boolean)) rows.push(['padding', box(sp.padding)]);
  if (sp.gap && (sp.gap[0] || sp.gap[1])) rows.push(['gap', sp.gap[0] === sp.gap[1] ? `${sp.gap[0]}` : `${sp.gap[0]} ${sp.gap[1]}`]);
  if (sp.radius.some(Boolean)) rows.push(['radius', `${box(sp.radius)}${k(lengthName(sp.radius[0], 'radius'))}`]);
  /* an edge or a shadow that draws nothing is not part of the spec */
  const invisible = (c) => /rgba\([^)]*,\s*0\)$|transparent/.test(String(c)) || /^#[0-9a-f]{6}00$/.test(hex(c));
  if (sp.border.some(Boolean) && sp.borderStyle !== 'none' && !invisible(sp.borderColor)) rows.push(['border', `${box(sp.border)} ${sp.borderStyle} ${hex(sp.borderColor)}${k(colourName(sp.borderColor))}`]);
  if (!invisible(sp.fill)) rows.push(['fill', `${hex(sp.fill)}${k(colourName(sp.fill))}`]);
  if (sp.shadow && sp.shadow !== 'none' && /(^|\s)-?[1-9][\d.]*px/.test(sp.shadow)) rows.push(['shadow', esc(sp.shadow)]);
  if (sp.type) rows.push(['type', `${sp.type.family} ${sp.type.size}/${sp.type.line} · ${sp.type.weight}${sp.type.transform && sp.type.transform !== 'none' ? ` · ${sp.type.transform}` : ''}${k(lengthName(sp.type.size, 'font-size'))}`], ['text', `${hex(sp.type.colour)}${k(colourName(sp.type.colour))}`]);
  if (sp.icon) rows.push(['icon', `${sp.icon.size[0]} × ${sp.icon.size[1]} · ${hex(sp.icon.colour)}${k(colourName(sp.icon.colour))}`]);
  if (sp.opacity && +sp.opacity < 1) rows.push(['opacity', sp.opacity]);
  return `<dl class="ds-spec">${rows.map(([a, b]) => `<div><dt>${a}</dt><dd>${b}</dd></div>`).join('')}</dl>`;
};

/* ── verify every example against its in-page reference, and fill in CSS ── */
const browser = await chromium.launch();
/* verified wide enough for the widest web example (a 1440 header must not be
   clipped by the column it is shown in), on transparency like its reference;
   a responsive example is verified in its own frame, at the phone's width */
const widest = Math.max(1440, ...pages.flatMap((c) => c.variants.filter((v) => !isMob(v)).map((v) => v.w)));
const ctx = await browser.newContext({ viewport: { width: Math.ceil(widest) + 400, height: 900 }, deviceScaleFactor: 1 });
const VERIFY_CSS = '.ds-main{max-width:none!important}.ds-stage{overflow:visible!important;background:transparent!important;background-image:none!important}html,body,.ds-example,.ds-phone,.ds-frame{background:transparent!important;box-shadow:none!important}.ds-frame{border-radius:0!important}';
const results = {};
const rulesList = splitRules(CSS);
const rulesMobile = MOBILE_SHEET === 'profolio.css' ? rulesList : splitRules(CSS_M);
const rulesOf = (v) => (isMob(v) ? rulesMobile : rulesList);
/* which rules of the one stylesheet touch an example: its own element or
   anything inside it, dynamic pseudo-classes set aside */
const MATCHED = (rules) => {
  const strip = (s) => s.replace(/:is\(:(hover|focus-visible|focus-within|focus|active),\[data-pf-[\w-]+\]\)/g, '').replace(/::?(before|after|placeholder|selection|marker|-webkit-[\w-]+|-moz-[\w-]+)/g, '').replace(/:(hover|focus-visible|focus-within|focus|active|visited)\b/g, '');
  const out = {};
  for (const ex of document.querySelectorAll('[data-ds-example]')) {
    const id = ex.getAttribute('data-ds-example');
    if (id.includes('--')) continue;
    const hit = [];
    rules.forEach((r, i) => {
      const pre = r.slice(0, r.indexOf('{')).trim();
      if (pre.startsWith('@')) return;
      for (const part of pre.split(/,(?![^(]*\))/)) {
        const s = strip(part).trim() || '*';
        try { if (ex.matches(s) || ex.querySelector(s)) { hit.push(i); break; } } catch { }
      }
    });
    out[id] = hit;
  }
  return out;
};
/* land an example on the same fraction of a pixel it had in its page:
   measure where it actually is, and move the margin by the difference —
   to (tx, ty) itself when a placement is being searched for */
/* THE SPEC — what a designer reads off a variant: its box, its edges, its
   fill, its type and its icon, measured on the example itself as it
   renders (not read from a rule, which may be overridden) */
const SPEC = (id) => {
  const el = document.querySelector(`[data-ds-example="${id}"]`);
  if (!el) return null;
  const cs = getComputedStyle(el);
  const r = el.getBoundingClientRect();
  const n = (v) => Math.round((parseFloat(v) || 0) * 100) / 100;
  const four = (p, q = '') => [`${p}Top${q}`, `${p}Right${q}`, `${p}Bottom${q}`, `${p}Left${q}`].map((k) => n(cs[k]));
  /* the element that carries the text: the first with a text node of its own */
  const texty = [el, ...el.querySelectorAll('*')].find((e) => [...e.childNodes].some((c) => c.nodeType === 3 && c.textContent.trim()));
  const t = texty ? getComputedStyle(texty) : null;
  const svg = el.matches('svg') ? el : el.querySelector('svg');
  const sr = svg && svg.getBoundingClientRect();
  return {
    size: [n(r.width), n(r.height)],
    padding: four('padding'),
    border: four('border', 'Width'), borderColor: cs.borderTopColor, borderStyle: cs.borderTopStyle,
    radius: [cs.borderTopLeftRadius, cs.borderTopRightRadius, cs.borderBottomRightRadius, cs.borderBottomLeftRadius].map(n),
    fill: cs.backgroundColor, shadow: cs.boxShadow, display: cs.display,
    gap: /flex|grid/.test(cs.display) ? [n(cs.rowGap), n(cs.columnGap)] : null,
    opacity: cs.opacity,
    type: t ? { size: n(t.fontSize), line: t.lineHeight === 'normal' ? 'normal' : n(t.lineHeight), weight: t.fontWeight, family: t.fontFamily.split(',')[0].replace(/["']/g, '').trim(), colour: t.color, spacing: t.letterSpacing, transform: t.textTransform } : null,
    icon: sr && sr.width ? { size: [n(sr.width), n(sr.height)], colour: getComputedStyle(svg).color } : null,
  };
};
const PLACE = ({ id, fx, fy }) => {
  const el = document.querySelector(`[data-ds-example="${id}"]`);
  if (!el) return null;
  /* what moves: the example, or for an inline one the box around it */
  const mover = document.querySelector(`[data-ds-place="${id}"]`) || el;
  const md = (a, b) => ((a - b) % 1 + 1) % 1;
  const cs = getComputedStyle(mover);
  const r = el.getBoundingClientRect();
  const bx = r.x + scrollX - (parseFloat(cs.marginLeft) || 0), by = r.y + scrollY - (parseFloat(cs.marginTop) || 0);   /* where it would sit with no margin */
  const nl = +md(fx, bx % 1).toFixed(4), nt = +md(fy, by % 1).toFixed(4);
  mover.style.setProperty('margin', `${nt}px 0 0 ${nl}px`, 'important');
  return [nt, nl];
};
const SNAP = () => {
  for (const f of document.querySelectorAll('iframe.ds-frame')) {
    f.style.removeProperty('margin');
    const r = f.getBoundingClientRect();
    const fy = (r.top + scrollY) % 1, fx = (r.left + scrollX) % 1;
    f.style.setProperty('margin', `${fy ? +(1 - fy).toFixed(4) : 0}px 0 0 ${fx ? +(1 - fx).toFixed(4) : 0}px`, 'important');
  }
};
for (const c of pages) {
  const file = join(COMP, `${c.slug}.html`);
  const pg = await ctx.newPage();
  await pg.route('**/*', (r) => (/^(file|data|about):/.test(r.request().url()) ? r.continue() : r.abort()));
  await pg.goto('file://' + file, { waitUntil: 'load' });
  await pg.evaluate(() => document.fonts.ready);
  await pg.addStyleTag({ content: VERIFY_CSS });
  /* the scope each example lives in: the page, or its responsive frame */
  const scope = {};
  for (const v of c.variants) {
    if (!isMob(v)) { scope[v.id] = pg.mainFrame(); continue; }
    try {
      const fr = await (await pg.$(`iframe[data-ds-frame="${v.id}"]`)).contentFrame();
      await fr.waitForLoadState('load');
      await fr.evaluate(() => document.fonts.ready);
      await fr.addStyleTag({ content: VERIFY_CSS });
      scope[v.id] = fr;
    } catch { scope[v.id] = null; }
  }
  await pg.waitForTimeout(150);
  const matched = {};
  for (const fr of new Set(Object.values(scope).filter(Boolean))) Object.assign(matched, await fr.evaluate(MATCHED, fr === pg.mainFrame() ? rulesList : rulesMobile));
  const margins = {};
  for (const v of c.variants) if (scope[v.id]) margins[v.id] = await scope[v.id].evaluate(PLACE, { id: v.id, fx: v.x % 1, fy: v.y % 1 });
  await pg.waitForTimeout(50);
  for (const v of c.variants) {
    const shot = join(DS, 'cut', `${v.id}.png`);
    mkdirSync(dirname(shot), { recursive: true });
    let d = { pct: NaN };
    const sc = scope[v.id];
    try {
      if (!sc) throw new Error('no frame');
      /* a frame whose top falls on a fraction of a pixel carries that
         fraction into the example in it: set every frame on a whole pixel,
         in document order (each nudge moves the ones after it) — again for
         each one, since the web examples above are placed after the page
         loads and move everything below them */
      if (isMob(v)) await pg.evaluate(SNAP);
      const el = sc.locator(`[data-ds-example="${v.id}"]`).first();
      await el.screenshot({ path: shot, timeout: 5000, animations: 'disabled', omitBackground: true });
      const ref = join(DS, 'ref', `${v.id}.png`);
      if (existsSync(ref)) d = pixelDiff(ref, shot, join(ROOT, 'data', 'qa', 'components', `${v.id}.diff.png`));
      /* The rect's fraction is not always where the element PAINTED: inside
         a composited layer (a sticky table header, a transformed popover)
         Chrome snaps the layer to whole pixels. If the first placement is
         off, search the sixteen quarter-pixel placements and keep the best —
         placement is not design, so this finds the cut-out's true position
         rather than excusing a real difference. */
      if (existsSync(ref) && !(d.pct <= BAR)) {
        let best = { ...d, m: margins[v.id] };
        for (const ty of [0, 0.25, 0.5, 0.75]) for (const tx of [0, 0.25, 0.5, 0.75]) {
          const m = await sc.evaluate(PLACE, { id: v.id, fx: tx, fy: ty });
          const try_ = join(DS, 'cut', `${v.id}.try.png`);
          await el.screenshot({ path: try_, timeout: 5000, animations: 'disabled', omitBackground: true });
          const t = pixelDiff(ref, try_);
          if (t.pct < best.pct) { best = { ...t, m }; copyFileSync(try_, shot); }
        }
        margins[v.id] = best.m;
        await sc.evaluate(({ id, m }) => (document.querySelector(`[data-ds-place="${id}"]`) || document.querySelector(`[data-ds-example="${id}"]`)).style.setProperty('margin', `${m[0]}px 0 0 ${m[1]}px`, 'important'), { id: v.id, m: best.m });
        d = pixelDiff(ref, shot, join(ROOT, 'data', 'qa', 'components', `${v.id}.diff.png`));
      }
    } catch (e) { d = { pct: NaN, error: String(e).split('\n')[0] }; }
    results[v.id] = { component: c.slug, level: levelOf(c), device: v.device || 'web', pct: d.pct, ok: d.pct <= BAR, rules: (matched[v.id] || []).length };
    v.pct = d.pct; v.rules = matched[v.id] || [];
    v.spec = sc ? await sc.evaluate(SPEC, v.id).catch(() => null) : null;
    if (v.spec) SPECS[v.id] = { component: c.slug, name: c.name, level: levelOf(c), device: v.device || 'web', variant: variantLabel(v), sig: v.variant.split('|')[1], count: v.count, spec: v.spec };
  }
  await pg.close();
  /* second pass on the file: badges and the CSS each example actually uses.
     A responsive example's markup is inside its frame's srcdoc, where every
     quote is written &quot; */
  let html = readFileSync(file, 'utf8');
  for (const v of c.variants) {
    const m = margins[v.id];
    const q = isMob(v) ? '&quot;' : '"';
    const anchor = v.display === 'inline' && v.parentWidth ? 'data-ds-place' : 'data-ds-example';
    if (m) html = html.replace(new RegExp(`(${anchor}=${q}${v.id}${q}[^>]*?margin:)[^;"!&]*px 0 0 [^;"!&]*px!important`), `$1${m[0]}px 0 0 ${m[1]}px!important`);
    const ok = v.pct <= BAR;
    html = html.replace(`<span class="ds-match" data-ds-match="${v.id}">not yet verified</span>`,
      `<span class="ds-match ${Number.isNaN(v.pct) ? 'is-unknown' : ok ? 'is-ok' : 'is-off'}" title="the cut-out copy against a screenshot of the same element in ${esc(pageTitle(v.page))}${isMob(v) ? ' (responsive)' : ''}">${Number.isNaN(v.pct) ? 'not measured' : ok ? `matches the product · ${v.pct}%` : `differs from the product · ${v.pct}%`}</span>`);
    html = html.replace(`<div class="ds-spec" data-ds-spec="${v.id}"></div>`, specHtml(v.spec));
    const css = v.rules.map((i) => rulesOf(v)[i]).join('\n');
    html = html.replace(`<pre class="ds-code ds-css" data-ds-css="${v.id}"><code>computed at build time</code></pre>`,
      `<pre class="ds-code ds-css"><code>${esc(css.length > 40000 ? css.slice(0, 40000) + `\n/* … truncated — every rule is in ${isMob(v) ? MOBILE_SHEET : 'profolio.css'} */` : css) || '/* no rule of its own — it inherits */'}</code></pre>`);
  }
  writeFileSync(file, html);
}
await browser.close();

/* ── the index ────────────────────────────────────────────────────────── */
const ok = Object.values(results).filter((r) => r.ok).length;
const measured = Object.values(results).filter((r) => !Number.isNaN(r.pct)).length;
const card = (c) => {
  const v = c.variants[0];
  const good = c.variants.filter((x) => x.pct <= BAR).length;
  const nw = c.variants.filter((x) => !isMob(x)).length, nm = c.variants.filter(isMob).length;
  return `<a class="ds-card" href="components/${c.slug}.html">
  <span class="ds-thumb"><img loading="lazy" src="components/img/${v.id}.png" alt=""></span>
  <span class="ds-card-name">${esc(c.name)}</span>
  <span class="ds-card-meta">${nw ? `${nw} web` : 'responsive only'}${nw && MOBILE_PAGES ? ` · ${nm ? `${nm} responsive` : 'web only'}` : nm && !nw ? ` · ${nm} variant${nm > 1 ? 's' : ''}` : ''} · ${Object.values(c.pages).reduce((a, b) => a + b, 0)} uses</span>
  <span class="ds-card-match ${good === c.variants.length ? 'is-ok' : 'is-off'}">${good}/${c.variants.length} match</span>
</a>`;
};
const groups = (lvl) => {
  const list = pages.filter((c) => levelOf(c) === lvl);
  const gs = [...new Set(list.map((c) => c.group))].sort((a, b) => (a.startsWith('antd') ? 1 : 0) - (b.startsWith('antd') ? 1 : 0) || a.localeCompare(b));
  return gs.map((g) => `<h3>${esc(g)} <small>${list.filter((c) => c.group === g).length}</small></h3><div class="ds-grid">${list.filter((c) => c.group === g).sort((a, b) => a.name.localeCompare(b.name)).map(card).join('\n')}</div>`).join('\n');
};
/* web pages and states, then the responsive ones (named <page>--mobile) */
const webNames = inst.pages.filter((p) => !/--mobile$/.test(p));
const mobNames = inst.pages.filter((p) => /--mobile$/.test(p)).map(pageTitle);
const compiledPages = webNames.filter((p) => !p.includes('--'));
const pageList = (names, mob) => {
  const tops = names.filter((p) => !p.includes('--'));
  const statesOf = (p) => names.filter((s) => s.startsWith(p + '--'));
  const href = (n) => pageLink(mob ? `${n}--mobile` : n, false);
  return `<div class="ds-pages">${tops.map((p) => `<div class="ds-page"><a class="ds-page-name" href="${href(p)}">${esc(p)}</a>${!mob && kbIndex && kbIndex.byPage[p] ? ` <small><a href="../kb/${kbIndex.byPage[p].href}">route notes</a></small>` : ''}${statesOf(p).length ? `<ul>${statesOf(p).map((s) => `<li><a href="${href(s)}">${esc(s.slice(p.length + 2))}</a></li>`).join('')}</ul>` : ''}</div>`).join('\n')}</div>`;
};
const foundations = tokens ? tokens.html : '<p class="ds-note">Run <code>node scripts/ds/tokens.mjs</code> to derive the foundations from the stylesheet.</p>';
/* the new My Listings (scripts/theme/): its tokens under Foundations, after
   the current ones, and its pages and states as a section of their own */
const THEME = join(ROOT, 'data', 'theme');
const newTokens = existsSync(join(THEME, 'foundations.html')) ? readFileSync(join(THEME, 'foundations.html'), 'utf8') : '';
const newTheme = existsSync(join(THEME, 'section.html')) ? readFileSync(join(THEME, 'section.html'), 'utf8') : '';
const index = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Profolio KSA — design system</title>
<link rel="stylesheet" href="ds.css">
${newTokens ? '<link rel="stylesheet" href="new-theme/fonts.css">' : ''}
</head>
<body class="ds ds-index">
<aside class="ds-side">
  <p class="ds-brand">Profolio KSA<br><small>design system</small></p>
  <nav>
    <a href="#foundations">Foundations</a>
    ${LEVELS.map((l) => `<a href="#${l}">${LEVEL_TITLE[l]} <small>${pages.filter((c) => levelOf(c) === l).length}</small></a>`).join('\n    ')}
    <a href="#pages">Pages &amp; states <small>${webNames.length}</small></a>
    ${mobNames.length ? `<a href="#pages-responsive">Responsive <small>${mobNames.length}</small></a>` : ''}
    ${newTheme ? '<a href="#new-theme">My Listings — new theme</a>' : ''}
    ${kbIndex ? '<a href="#knowledge">Product knowledge</a>' : ''}
    <a href="responsive.html">Responsive rules</a>
    <a href="../kb/screens/index.html">Screens &amp; states KB</a>
  </nav>
</aside>
<main class="ds-main">
<header class="ds-head">
  <p class="ds-kicker">Compiled from the product · ${new Date().toISOString().slice(0, 10)}</p>
  <h1>Profolio KSA design system</h1>
  <p class="ds-lede">Every page, state and component here was cut out of the product's own render (profolio-reactjs, Bayut KSA tenant, fixture account) — nothing was redrawn. ${pages.length} components in ${compiledPages.length} pages and ${webNames.length - compiledPages.length} states${mobNames.length ? `, and the responsive layout (a phone, ${PHONE_W} wide) in ${mobNames.filter((p) => !p.includes('--')).length} pages and ${mobNames.filter((p) => p.includes('--')).length} states` : ''}; ${ok} of ${measured} component variants render identically to where they came from (≤${BAR}% pixel difference). One stylesheet per layout: <a href="profolio.css"><code>profolio.css</code></a> for the web${MOBILE_SHEET !== 'profolio.css' ? `, <a href="${MOBILE_SHEET}"><code>${MOBILE_SHEET}</code></a> for the responsive layout` : ''}. Every screen and state in words, to find the one a PRD needs: <a href="../kb/screens/index.html">the design knowledge base</a>.</p>
</header>
<section class="ds-section" id="foundations"><h2>Foundations</h2>${foundations}${newTokens}</section>
${LEVELS.map((l) => `<section class="ds-section" id="${l}"><h2>${LEVEL_TITLE[l]}</h2>${groups(l) || '<p class="ds-note">None.</p>'}</section>`).join('\n')}
<section class="ds-section" id="pages"><h2>Pages &amp; states</h2>
<p class="ds-note">Each page is the product's own render, pixel for pixel, with every state the harness could reach: open menus, modals, drawers, popovers, tooltips, tabs, empty, loading and error. Every page and state links to the next the way the product does — click through them like the product.</p>
<h3>Web <small>1440 wide · ${webNames.length}</small></h3>
${pageList(webNames, false)}
${mobNames.length ? `<h3 id="pages-responsive">Responsive <small>${PHONE_W} wide · phone · ${mobNames.length}</small></h3>
<p class="ds-note">The layout the product draws for a phone's browser (it decides by device, not by window width): a header with a menu button and the page title, the rail as a drawer that button opens, listings as cards instead of a table, an app-install banner on the dashboard, and some segmented controls as selects. Open these at phone width — the browser's device toolbar, or a window ${PHONE_W}px wide.</p>
${pageList(mobNames, true)}` : ''}
</section>
${newTheme}
${kbIndex ? `<section class="ds-section" id="knowledge"><h2>Product knowledge</h2>${kbIndex.html}</section>` : ''}
</main>
</body>
</html>
`;
writeFileSync(join(DELIV, 'design-system.html'), index);
/* which component page each component became, for the design knowledge base
   (scripts/ds/design-kb.mjs) */
writeFileSync(join(DS, 'specs.json'), JSON.stringify(SPECS));
writeFileSync(join(DS, 'catalogue.json'), JSON.stringify(pages.map((c) => ({
  key: c.key, slug: c.slug, name: c.name, level: levelOf(c), group: c.group, def: c.def, family: c.family,
  web: c.variants.filter((v) => !isMob(v)).length, mobile: c.variants.filter(isMob).length,
  match: c.variants.filter((v) => v.pct <= BAR).length, pages: c.pages,
}))));
mkdirSync(join(ROOT, 'data', 'qa'), { recursive: true });
writeFileSync(join(ROOT, 'data', 'qa', 'components.json'), JSON.stringify({ at: new Date().toISOString(), bar: BAR, ok, measured, results }, null, 1));
const byLevel = Object.fromEntries(LEVELS.map((l) => [l, pages.filter((c) => levelOf(c) === l).length]));
console.log(`  ${pages.length} component pages · ${JSON.stringify(byLevel)}`);
console.log(`  ${ok} of ${measured} variants match their in-page reference (≤${BAR}%)`);
const off = Object.entries(results).filter(([, r]) => !r.ok).sort((a, b) => (b[1].pct || 0) - (a[1].pct || 0));
for (const [id, r] of off.slice(0, 25)) console.log(`    off  ${id.padEnd(58)} ${r.pct}%`);
