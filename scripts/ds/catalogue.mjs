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

const { chromium } = pkg;
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const DELIV = join(ROOT, 'deliverables');
const COMP = join(DELIV, 'components');
const DS = join(ROOT, 'data', 'ds');
const BAR = 1.0;                                   /* a cut-out may differ from its in-page shot by ≤1% */

const inst = JSON.parse(readFileSync(join(DS, 'instances.json'), 'utf8'));
const reg = existsSync(join(DS, 'components.json')) ? JSON.parse(readFileSync(join(DS, 'components.json'), 'utf8')) : {};
const tokens = existsSync(join(DS, 'tokens.json')) ? JSON.parse(readFileSync(join(DS, 'tokens.json'), 'utf8')) : null;
const kbIndex = existsSync(join(DS, 'kb-links.json')) ? JSON.parse(readFileSync(join(DS, 'kb-links.json'), 'utf8')) : null;
const CSS = readFileSync(join(DELIV, 'profolio.css'), 'utf8');

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
const clean = (html) => html.replace(/ data-pf-(src|c|i)="[^"]*"/g, '').replace(/ data-ds-[\w-]+="[^"]*"/g, '');
const LEVELS = ['atom', 'molecule', 'organism', 'template', 'page'];
const LEVEL_TITLE = { atom: 'Atoms', molecule: 'Molecules', organism: 'Organisms', template: 'Templates', page: 'Page sections' };

/* the element, standing in the ancestors it was drawn in */
const stage = (v, extra = '', stateClass = '') => {
  let html = v.html.replace(/^<([a-z0-9-]+)/i, (m) => `${m} data-ds-example="${v.id}${stateClass ? '--' + stateClass : ''}"`);
  const fx = +(v.x % 1).toFixed(4), fy = +(v.y % 1).toFixed(4);
  const disp = v.display && !['contents', 'none'].includes(v.display) ? v.display : null;
  const fix = [`width:${v.w}px!important`, `height:${v.h}px!important`, 'box-sizing:border-box!important',
    /* the page's sub-pixel offset, carried as margin (not transform or
       position, which would change what its absolute children measure from);
       the verify pass corrects it for wherever the stage actually landed */
    `margin:${fy}px 0 0 ${fx}px!important`, 'max-width:none!important', 'min-width:0!important', 'flex:none!important'];
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
    const tag = a.tag === 'body' ? 'div' : a.tag;
    const last = i === v.chain.length - 1;
    const attrs = a.attrs.map(([k, x]) => ` ${k}="${esc(x)}"`).join('');
    /* an INLINE root has no width of its own: its parent becomes a real box
       as wide as the one it was laid out in, drawing nothing itself */
    const box = last && v.display === 'inline' && v.parentWidth
      ? `display:block;width:${v.parentWidth}px;padding:0;margin:0;border-color:transparent;background:transparent;box-shadow:none`
      : 'display:contents';
    open += `<${tag}${a.cls ? ` class="${esc(stateClass && last ? `${a.cls} ds-${stateClass}` : a.cls)}"` : ''}${attrs} style="${box}${last ? ';' + esc(inherited) : ''}">`;
    close = `</${tag}>` + close;
  });
  /* the stage is the ground the element stood on in its page */
  return `<div class="ds-stage${extra}" style="background:${esc(v.ground || '#fff')}">${open}${html}${close}</div>`;
};

const usage = (c) => Object.entries(c.pages).sort((a, b) => b[1] - a[1]);
const pageLink = (name, fromComponents = true) => `${fromComponents ? '../' : ''}${name.includes('--') ? 'states/' : ''}${name}.html`;
const levelOf = (c) => c.level || 'atom';
const variantLabel = (v) => {
  const [cls, h] = v.variant.split('|');
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
</body>
</html>
`;

/* an organism, template or page section is a big piece of markup; the three
   variants the product uses most say what it is, and eight of them would
   make one component page weigh as much as a whole compiled page */
for (const c of all) {
  const heavy = ['organism', 'template', 'page'].includes(c.level) || (c.variants[0] && c.variants[0].bytes > 60000);
  if (heavy) c.variants = [...c.variants].sort((a, b) => b.count - a.count).slice(0, 3);
}
const pages = [];
for (const c of all) {
  if (!c.variants.length) continue;
  const lvl = levelOf(c);
  const uses = usage(c);
  const total = uses.reduce((n, [, k]) => n + k, 0);
  const kids = c.children.map((k) => findByKey.get(k)).filter(Boolean).filter((k, i, a) => a.indexOf(k) === i);
  const parents = all.filter((p) => p.children.includes(c.key));
  const hasStates = forced.some((f) => c.variants.some((v) => v.variant.split('|')[0].split('.').some((cls) => cls && f.includes('.' + cls))));
  const v0 = c.variants[0];
  const body = `
<header class="ds-head">
  <p class="ds-kicker">${LEVEL_TITLE[lvl].replace(/s$/, '')} · ${c.family === 'base' ? 'antd base component' : 'product component'}${c.group ? ` · ${esc(c.group)}` : ''}</p>
  <h1>${esc(c.name)}</h1>
  <p class="ds-lede">${c.family === 'base'
    ? `antd's <code>${esc(c.name)}</code> exactly as the product themes it — root class <code>.${esc(c.key)}</code>. ${c.variants.length} variant${c.variants.length > 1 ? 's' : ''} found across ${uses.length} page${uses.length > 1 ? 's' : ''} and states, ${total} instance${total > 1 ? 's' : ''} in all.`
    : `Defined in <code>${esc(c.def)}</code>. ${c.variants.length} variant${c.variants.length > 1 ? 's' : ''} found across ${uses.length} page${uses.length > 1 ? 's' : ''} and states, ${total} instance${total > 1 ? 's' : ''} in all.`}</p>
</header>

<section class="ds-section">
<h2>Variants</h2>
${c.variants.map((v, i) => `
<figure class="ds-example" id="v${i + 1}">
  ${stage(v)}
  <figcaption>
    <span class="ds-vname">${esc(variantLabel(v))}</span>
    <span class="ds-meta">${v.count}× · first seen on <a href="${pageLink(v.page)}">${esc(v.page)}</a></span>
    <span class="ds-match" data-ds-match="${v.id}">not yet verified</span>
  </figcaption>
  <details><summary>HTML</summary><pre class="ds-code"><code>${esc(clean(v.html).slice(0, 30000))}${v.html.length > 30000 ? '\n… (truncated — the full markup is in the page it came from)' : ''}</code></pre></details>
  <details><summary>CSS</summary><pre class="ds-code ds-css" data-ds-css="${v.id}"><code>computed at build time</code></pre></details>
</figure>`).join('\n')}
</section>
${hasStates && lvl !== 'organism' && lvl !== 'template' && v0.w * v0.h < 400 * 200 ? `
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
<ul class="ds-uses">${uses.map(([p, n]) => `<li><a href="${pageLink(p)}">${esc(p)}</a> <small>${n}×</small></li>`).join('')}</ul>
${c.src.length ? `<h3>Drawn by</h3><ul class="ds-uses">${c.src.map((s) => `<li><code>${esc(s)}</code></li>`).join('')}</ul>` : ''}
</section>`;
  writeFileSync(join(COMP, `${c.slug}.html`), chrome(c.name, [`<a href="../design-system.html#${lvl}">${LEVEL_TITLE[lvl]}</a>`, esc(c.name)], body));
  for (const v of c.variants) { const r = join(DS, 'ref', `${v.id}.png`); if (existsSync(r)) copyFileSync(r, join(COMP, 'img', `${v.id}.png`)); }
  pages.push(c);
}

/* ── verify every example against its in-page reference, and fill in CSS ── */
const browser = await chromium.launch();
/* verified wide enough for the widest example (a 1440 header must not be
   clipped by the column it is shown in), on transparency like its reference */
const widest = Math.max(1440, ...pages.flatMap((c) => c.variants.map((v) => v.w)));
const ctx = await browser.newContext({ viewport: { width: Math.ceil(widest) + 400, height: 900 }, deviceScaleFactor: 1 });
const VERIFY_CSS = '.ds-main{max-width:none!important}.ds-stage{overflow:visible!important;background:transparent!important;background-image:none!important}html,body,.ds-example{background:transparent!important}';
const results = {};
const rulesList = splitRules(CSS);
for (const c of pages) {
  const file = join(COMP, `${c.slug}.html`);
  const pg = await ctx.newPage();
  await pg.route('**/*', (r) => (/^(file|data):/.test(r.request().url()) ? r.continue() : r.abort()));
  await pg.goto('file://' + file, { waitUntil: 'load' });
  await pg.evaluate(() => document.fonts.ready);
  await pg.addStyleTag({ content: VERIFY_CSS });
  await pg.waitForTimeout(150);
  /* which rules of the one stylesheet touch this example: its own element or
     anything inside it, dynamic pseudo-classes set aside */
  const matched = await pg.evaluate((rules) => {
    const strip = (s) => s.replace(/::?(before|after|placeholder|selection|marker|-webkit-[\w-]+|-moz-[\w-]+)/g, '').replace(/:(hover|focus-visible|focus-within|focus|active|visited)\b/g, '');
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
  }, rulesList);
  /* land every example on the same fraction of a pixel it had in its page:
     measure where it actually is, and move the margin by the difference */
  const fracs = Object.fromEntries(c.variants.map((v) => [v.id, [v.x % 1, v.y % 1]]));
  const margins = await pg.evaluate((fracs) => {
    const out = {};
    const md = (a, b) => ((a - b) % 1 + 1) % 1;
    for (const [id, [fx, fy]] of Object.entries(fracs)) {
      const el = document.querySelector(`[data-ds-example="${id}"]`);
      if (!el) continue;
      const cs = getComputedStyle(el);
      const ml = parseFloat(cs.marginLeft) || 0, mt = parseFloat(cs.marginTop) || 0;
      const r = el.getBoundingClientRect();
      const bx = r.x + scrollX - ml, by = r.y + scrollY - mt;          /* where it would sit with no margin */
      const nl = +md(fx, bx % 1).toFixed(4), nt = +md(fy, by % 1).toFixed(4);
      el.style.setProperty('margin', `${nt}px 0 0 ${nl}px`, 'important');
      out[id] = [nt, nl];
    }
    return out;
  }, fracs);
  await pg.waitForTimeout(50);
  for (const v of c.variants) {
    const shot = join(DS, 'cut', `${v.id}.png`);
    mkdirSync(dirname(shot), { recursive: true });
    let d = { pct: NaN };
    try {
      await pg.locator(`[data-ds-example="${v.id}"]`).first().screenshot({ path: shot, timeout: 5000, animations: 'disabled', omitBackground: true });
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
          const m = await pg.evaluate(({ id, tx, ty }) => {
            const el = document.querySelector(`[data-ds-example="${id}"]`);
            const cs = getComputedStyle(el);
            const r = el.getBoundingClientRect();
            const bx = r.x + scrollX - (parseFloat(cs.marginLeft) || 0), by = r.y + scrollY - (parseFloat(cs.marginTop) || 0);
            const md = (a, b) => ((a - b) % 1 + 1) % 1;
            const nl = +md(tx, bx % 1).toFixed(4), nt = +md(ty, by % 1).toFixed(4);
            el.style.setProperty('margin', `${nt}px 0 0 ${nl}px`, 'important');
            return [nt, nl];
          }, { id: v.id, tx, ty });
          const try_ = join(DS, 'cut', `${v.id}.try.png`);
          await pg.locator(`[data-ds-example="${v.id}"]`).first().screenshot({ path: try_, timeout: 5000, animations: 'disabled', omitBackground: true });
          const t = pixelDiff(ref, try_);
          if (t.pct < best.pct) { best = { ...t, m }; copyFileSync(try_, shot); }
        }
        margins[v.id] = best.m;
        await pg.evaluate(({ id, m }) => document.querySelector(`[data-ds-example="${id}"]`).style.setProperty('margin', `${m[0]}px 0 0 ${m[1]}px`, 'important'), { id: v.id, m: best.m });
        d = pixelDiff(ref, shot, join(ROOT, 'data', 'qa', 'components', `${v.id}.diff.png`));
      }
    } catch (e) { d = { pct: NaN, error: String(e).split('\n')[0] }; }
    results[v.id] = { component: c.slug, level: levelOf(c), pct: d.pct, ok: d.pct <= BAR, rules: (matched[v.id] || []).length };
    v.pct = d.pct; v.rules = matched[v.id] || [];
  }
  await pg.close();
  /* second pass on the file: badges and the CSS each example actually uses */
  let html = readFileSync(file, 'utf8');
  for (const v of c.variants) {
    const m = margins[v.id];
    if (m) html = html.replace(new RegExp(`(data-ds-example="${v.id}"[^>]*?margin:)[^;"!]*px 0 0 [^;"!]*px!important`), `$1${m[0]}px 0 0 ${m[1]}px!important`);
    const ok = v.pct <= BAR;
    html = html.replace(`<span class="ds-match" data-ds-match="${v.id}">not yet verified</span>`,
      `<span class="ds-match ${Number.isNaN(v.pct) ? 'is-unknown' : ok ? 'is-ok' : 'is-off'}" title="the cut-out copy against a screenshot of the same element in ${esc(v.page)}">${Number.isNaN(v.pct) ? 'not measured' : ok ? `matches the product · ${v.pct}%` : `differs from the product · ${v.pct}%`}</span>`);
    const css = v.rules.map((i) => rulesList[i]).join('\n');
    html = html.replace(`<pre class="ds-code ds-css" data-ds-css="${v.id}"><code>computed at build time</code></pre>`,
      `<pre class="ds-code ds-css"><code>${esc(css.length > 40000 ? css.slice(0, 40000) + '\n/* … truncated — every rule is in profolio.css */' : css) || '/* no rule of its own — it inherits */'}</code></pre>`);
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
  return `<a class="ds-card" href="components/${c.slug}.html">
  <span class="ds-thumb"><img loading="lazy" src="components/img/${v.id}.png" alt=""></span>
  <span class="ds-card-name">${esc(c.name)}</span>
  <span class="ds-card-meta">${c.variants.length} variant${c.variants.length > 1 ? 's' : ''} · ${Object.values(c.pages).reduce((a, b) => a + b, 0)} uses</span>
  <span class="ds-card-match ${good === c.variants.length ? 'is-ok' : 'is-off'}">${good}/${c.variants.length} match</span>
</a>`;
};
const groups = (lvl) => {
  const list = pages.filter((c) => levelOf(c) === lvl);
  const gs = [...new Set(list.map((c) => c.group))].sort((a, b) => (a.startsWith('antd') ? 1 : 0) - (b.startsWith('antd') ? 1 : 0) || a.localeCompare(b));
  return gs.map((g) => `<h3>${esc(g)} <small>${list.filter((c) => c.group === g).length}</small></h3><div class="ds-grid">${list.filter((c) => c.group === g).sort((a, b) => a.name.localeCompare(b.name)).map(card).join('\n')}</div>`).join('\n');
};
const compiledPages = inst.pages.filter((p) => !p.includes('--'));
const stateNotes = (p) => inst.pages.filter((s) => s.startsWith(p + '--'));
const foundations = tokens ? tokens.html : '<p class="ds-note">Run <code>node scripts/ds/tokens.mjs</code> to derive the foundations from the stylesheet.</p>';
const index = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Profolio KSA — design system</title>
<link rel="stylesheet" href="ds.css">
</head>
<body class="ds ds-index">
<aside class="ds-side">
  <p class="ds-brand">Profolio KSA<br><small>design system</small></p>
  <nav>
    <a href="#foundations">Foundations</a>
    ${LEVELS.map((l) => `<a href="#${l}">${LEVEL_TITLE[l]} <small>${pages.filter((c) => levelOf(c) === l).length}</small></a>`).join('\n    ')}
    <a href="#pages">Pages &amp; states <small>${inst.pages.length}</small></a>
    ${kbIndex ? '<a href="#knowledge">Product knowledge</a>' : ''}
  </nav>
</aside>
<main class="ds-main">
<header class="ds-head">
  <p class="ds-kicker">Compiled from the product · ${new Date().toISOString().slice(0, 10)}</p>
  <h1>Profolio KSA design system</h1>
  <p class="ds-lede">Every page, state and component here was cut out of the product's own render (profolio-reactjs, Bayut KSA tenant, fixture account) — nothing was redrawn. ${pages.length} components in ${compiledPages.length} pages and ${inst.pages.length - compiledPages.length} states; ${ok} of ${measured} component variants render identically to where they came from (≤${BAR}% pixel difference). One stylesheet: <a href="profolio.css"><code>profolio.css</code></a>.</p>
</header>
<section class="ds-section" id="foundations"><h2>Foundations</h2>${foundations}</section>
${LEVELS.map((l) => `<section class="ds-section" id="${l}"><h2>${LEVEL_TITLE[l]}</h2>${groups(l) || '<p class="ds-note">None.</p>'}</section>`).join('\n')}
<section class="ds-section" id="pages"><h2>Pages &amp; states</h2>
<p class="ds-note">Each page is the product's own render, pixel for pixel, with every state the harness could reach: open menus, modals, drawers, popovers, tooltips, tabs, empty, loading and error.</p>
<div class="ds-pages">${compiledPages.map((p) => `<div class="ds-page"><a class="ds-page-name" href="${p}.html">${esc(p)}</a>${kbIndex && kbIndex.byPage[p] ? ` <small><a href="../kb/${kbIndex.byPage[p].href}">route notes</a></small>` : ''}${stateNotes(p).length ? `<ul>${stateNotes(p).map((s) => `<li><a href="states/${s}.html">${esc(s.slice(p.length + 2))}</a></li>`).join('')}</ul>` : ''}</div>`).join('\n')}</div>
</section>
${kbIndex ? `<section class="ds-section" id="knowledge"><h2>Product knowledge</h2>${kbIndex.html}</section>` : ''}
</main>
</body>
</html>
`;
writeFileSync(join(DELIV, 'design-system.html'), index);
mkdirSync(join(ROOT, 'data', 'qa'), { recursive: true });
writeFileSync(join(ROOT, 'data', 'qa', 'components.json'), JSON.stringify({ at: new Date().toISOString(), bar: BAR, ok, measured, results }, null, 1));
const byLevel = Object.fromEntries(LEVELS.map((l) => [l, pages.filter((c) => levelOf(c) === l).length]));
console.log(`  ${pages.length} component pages · ${JSON.stringify(byLevel)}`);
console.log(`  ${ok} of ${measured} variants match their in-page reference (≤${BAR}%)`);
const off = Object.entries(results).filter(([, r]) => !r.ok).sort((a, b) => (b[1].pct || 0) - (a[1].pct || 0));
for (const [id, r] of off.slice(0, 25)) console.log(`    off  ${id.padEnd(58)} ${r.pct}%`);
