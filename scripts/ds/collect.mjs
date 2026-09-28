#!/usr/bin/env node
/**
 * Collect every component instance from the compiled pages.
 *
 * Two families, because the product has two:
 *
 *   BASE       antd, as the product themes it — a Button is a pf-btn whatever
 *              wraps it. Found by root class (BASE below), variant by the
 *              modifier classes antd puts beside the root (primary, circle,
 *              sm, disabled…) and the height it renders at.
 *   PRODUCT    the product's own components, found by data-pf-i — the name
 *              and defining file harness/freeze.js wrote onto the first
 *              element each one draws. Variant by its styled-components
 *              variant class and its antd modifiers.
 *
 * For each distinct variant it keeps one example: the element's markup, the
 * chain of ancestors it sat in (so descendant selectors in profolio.css still
 * match when it is cut out), the inherited text styles of its parent, its
 * rendered size, and a screenshot of it IN the page — the reference its
 * cut-out copy is held to.
 *
 *   node scripts/ds/collect.mjs
 *
 * Writes data/ds/instances.json and data/ds/ref/<id>.png.
 */
import pkg from 'playwright';
import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const { chromium } = pkg;
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const DELIV = join(ROOT, 'deliverables');
const OUT = join(ROOT, 'data', 'ds');
const MAX_VARIANTS = 8;

/* antd's components by the class on their root, with where they sit in the
   atomic scale. The scale is the conventional one: an ATOM cannot be broken
   down further without losing its meaning (a button, a tag); a MOLECULE is a
   few atoms working as one control (a select: field + arrow + list); an
   ORGANISM is a section of interface with its own job (a table, a modal). */
export const BASE = {
  'pf-btn': ['Button', 'atom'], 'pf-tag': ['Tag', 'atom'], 'pf-badge': ['Badge', 'atom'],
  'pf-avatar': ['Avatar', 'atom'], 'pf-typography': ['Typography', 'atom'], 'pf-divider': ['Divider', 'atom'],
  'pf-input-affix-wrapper': ['Input', 'atom'], 'pf-input': ['Input', 'atom'], 'pf-input-number': ['InputNumber', 'atom'],
  'pf-checkbox-wrapper': ['Checkbox', 'atom'], 'pf-radio-wrapper': ['Radio', 'atom'], 'pf-radio-button-wrapper': ['RadioButton', 'atom'],
  'pf-switch': ['Switch', 'atom'], 'pf-spin': ['Spin', 'atom'], 'pf-progress': ['Progress', 'atom'],
  'pf-image': ['Image', 'atom'], 'pf-skeleton': ['Skeleton', 'atom'], 'pf-empty': ['Empty', 'atom'],
  'pf-tooltip': ['Tooltip', 'atom'], 'pf-rate': ['Rate', 'atom'], 'pf-slider': ['Slider', 'atom'],
  'pf-select': ['Select', 'molecule'], 'pf-picker': ['DatePicker', 'molecule'], 'pf-segmented': ['Segmented', 'molecule'],
  'pf-pagination': ['Pagination', 'molecule'], 'pf-statistic': ['Statistic', 'molecule'], 'pf-form-item': ['FormItem', 'molecule'],
  'pf-dropdown': ['Dropdown', 'molecule'], 'pf-select-dropdown': ['SelectDropdown', 'molecule'], 'pf-picker-dropdown': ['PickerPanel', 'molecule'],
  'pf-popover': ['Popover', 'molecule'], 'pf-steps': ['Steps', 'molecule'], 'pf-radio-group': ['RadioGroup', 'molecule'],
  'pf-checkbox-group': ['CheckboxGroup', 'molecule'], 'pf-alert': ['Alert', 'molecule'], 'pf-collapse': ['Collapse', 'molecule'],
  'pf-tabs': ['Tabs', 'molecule'], 'pf-upload': ['Upload', 'molecule'], 'pf-breadcrumb': ['Breadcrumb', 'molecule'],
  'pf-message-notice': ['Message', 'molecule'], 'pf-notification-notice': ['Notification', 'molecule'],
  'pf-card': ['Card', 'organism'], 'pf-table-wrapper': ['Table', 'organism'], 'pf-modal': ['Modal', 'organism'],
  'pf-drawer-content-wrapper': ['Drawer', 'organism'], 'pf-menu': ['Menu', 'organism'], 'pf-tour': ['Tour', 'organism'],
  'pf-timeline': ['Timeline', 'organism'], 'pf-list': ['List', 'organism'], 'pf-result': ['Result', 'organism'],
  'pf-layout-header': ['LayoutHeader', 'template'], 'pf-layout-sider': ['LayoutSider', 'template'], 'pf-layout-footer': ['LayoutFooter', 'template'],
};

const compiled = (dir, rel) => readdirSync(dir).filter((f) => f.endsWith('.html'))
  .map((f) => ({ file: join(dir, f), rel: rel + f, name: f.replace(/\.html$/, '') }))
  .filter((p) => /<meta name="pf-compiled"/.test(readFileSync(p.file, 'utf8').slice(0, 6000)));
const pages = [...compiled(DELIV, ''), ...compiled(join(DELIV, 'states'), 'states/')];

/* ── in the page ───────────────────────────────────────────────────────── */
const COLLECT = (BASE) => {
  const INHERITED = ['font-family', 'font-size', 'font-weight', 'font-style', 'line-height', 'color', 'letter-spacing',
    'text-align', 'text-transform', 'white-space', 'word-break', 'direction', 'font-variant-numeric', 'font-feature-settings', '-webkit-font-smoothing'];
  /* a variant is its modifier classes plus the STATE attributes antd v5 uses
     instead of classes — a disabled button is <button disabled>, not a class */
  const sig = (el) => [...el.classList].filter((c) => c.startsWith('pf-') && c !== 'pf-theme' && !/^pf-(motion|zoom|fade|slide|move)/.test(c)).sort().join('.')
    + ['disabled', 'aria-checked', 'aria-selected', 'aria-expanded', 'aria-disabled', 'checked', 'readonly']
      .filter((a) => el.hasAttribute(a) && el.getAttribute(a) !== 'false').map((a) => `[${a}]`).join('');
  const chainOf = (el) => {
    const c = [];
    for (let e = el.parentElement; e && e !== document.documentElement; e = e.parentElement)
      c.unshift({ tag: e.tagName.toLowerCase(), cls: e.getAttribute('class') || '', attrs: ['dir', 'lang', 'role'].filter((a) => e.hasAttribute(a)).map((a) => [a, e.getAttribute(a)]) });
    return c;
  };
  const vis = (el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width >= 2 && r.height >= 2 && s.visibility !== 'hidden' && s.display !== 'none' && +s.opacity > 0; };
  const record = (el, family, key, name, level) => {
    const r = el.getBoundingClientRect();
    const ps = getComputedStyle(el.parentElement || el);
    const s = getComputedStyle(el);
    return {
      family, key, name, level,
      variant: `${sig(el)}|h${Math.round(r.height)}`,
      w: Math.round(r.width * 100) / 100, h: Math.round(r.height * 100) / 100,
      /* unrounded: the fraction of a pixel an element sits at decides how its
         edges rasterise, and a cut-out is placed at the same fraction */
      x: r.x + scrollX, y: r.y + scrollY,
      /* computed display: a span in a flex row is BLOCKIFIED there, and cut out
         of the row it would be inline again and ignore its width */
      display: s.display,
      /* the content width the element was laid out in — an INLINE root has no
         width of its own, so its cut-out needs a parent box this wide */
      parentWidth: (() => { const pe = el.parentElement; if (!pe) return null; const q = getComputedStyle(pe); return Math.round((pe.clientWidth - parseFloat(q.paddingLeft) - parseFloat(q.paddingRight)) * 100) / 100; })(),
      inherited: Object.fromEntries(INHERITED.map((p) => [p, ps.getPropertyValue(p)])),
      /* what shows through the element's transparent parts: the first
         ancestor that paints a ground. A 16px icon is mostly transparent, and
         cut out onto a different ground it is mostly a different picture. */
      ground: (() => { for (let e = el.parentElement; e; e = e.parentElement) { const b = getComputedStyle(e).backgroundColor; if (b && b !== 'rgba(0, 0, 0, 0)' && b !== 'transparent') return b; } return 'rgb(255, 255, 255)'; })(),
      positioned: ['absolute', 'fixed'].includes(s.position),
      html: el.outerHTML.length > 400_000 ? null : el.outerHTML,
      bytes: el.outerHTML.length,
      chain: chainOf(el),
      src: el.getAttribute('data-pf-src') || '',
      children: [...el.querySelectorAll('[data-pf-i]')].flatMap((c) => c.getAttribute('data-pf-i').split(' ')),
      path: (() => { const parts = []; for (let e = el; e && e !== document.documentElement; e = e.parentElement) { const p = e.parentElement; if (!p) break; parts.unshift(`${e.tagName.toLowerCase()}:nth-child(${[...p.children].indexOf(e) + 1})`); } return 'html > ' + parts.join(' > '); })(),
    };
  };
  const out = [];
  for (const el of document.querySelectorAll('[data-pf-i]')) {
    if (!vis(el)) continue;
    for (const key of el.getAttribute('data-pf-i').split(' ')) out.push(record(el, 'product', key, key.split('@')[0], null));
  }
  for (const [cls, [name, level]] of Object.entries(BASE)) {
    for (const el of document.getElementsByClassName(cls)) if (vis(el)) out.push(record(el, 'base', cls, name, level));
  }
  return out;
};

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
mkdirSync(join(OUT, 'ref'), { recursive: true });
const byKey = new Map();                         /* component key → { meta, variants: Map(variant → example) } */
let seen = 0;
for (const p of pages) {
  const pg = await ctx.newPage();
  await pg.route('**/*', (r) => (/^(file|data):/.test(r.request().url()) ? r.continue() : r.abort()));
  await pg.goto('file://' + p.file, { waitUntil: 'load' });
  await pg.evaluate(() => document.fonts.ready);
  await pg.waitForTimeout(250);
  const found = await pg.evaluate(COLLECT, BASE);
  seen += found.length;
  for (const f of found) {
    let c = byKey.get(f.key);
    if (!c) byKey.set(f.key, c = { key: f.key, family: f.family, name: f.name, level: f.level, src: new Set(), pages: {}, variants: new Map(), children: new Set() });
    c.pages[p.name] = (c.pages[p.name] || 0) + 1;
    if (f.src) c.src.add(f.src);
    f.children.filter((k) => k !== f.key).forEach((k) => c.children.add(k));
    const v = c.variants.get(f.variant);
    if (v) { v.count++; continue; }
    if (c.variants.size >= MAX_VARIANTS || !f.html) continue;
    const id = `${f.key.replace(/[^\w-]+/g, '_').slice(0, 60)}__${c.variants.size + 1}`;
    /* the reference: this element, in this page, as the product drew it */
    const shot = join(OUT, 'ref', `${id}.png`);
    /* The reference is the element ALONE on the ground it stood on: every
       other element is made invisible (visibility, so nothing moves) except
       its ancestors, whose grounds show through. A ring drawn over an avatar
       by a sibling, a tooltip over a button, is not part of the button. */
    try {
      await pg.evaluate(({ x, y, path }) => {
        scrollTo(Math.max(0, x - 40), Math.max(0, y - 200));
        const el = document.querySelector(path);
        for (let e = el; e; e = e.parentElement) e.classList.add('ds-ref-keep');
        el.classList.add('ds-ref-self');
        const st = document.createElement('style');
        st.id = 'ds-ref-style';
        /* and every ANCESTOR's own paint off, so the shot holds the element's
           pixels alone on transparency: what shows behind a component is its
           page, not the component, and the cut-out is compared the same way */
        /* ancestors must not CLIP it either: a form card taller than the
           scrolling panel it sits in is otherwise photographed half-cut */
        st.textContent = 'body *:not(.ds-ref-keep):not(.ds-ref-self *){visibility:hidden!important}'
          + '.ds-ref-keep:not(.ds-ref-self):not(html):not(body){overflow:visible!important;contain:none!important;clip-path:none!important}'
          + 'html,body,.ds-ref-keep:not(.ds-ref-self){background:transparent!important;border-color:transparent!important;box-shadow:none!important;outline-color:transparent!important;background-image:none!important}'
          + '.ds-ref-keep:not(.ds-ref-self)::before,.ds-ref-keep:not(.ds-ref-self)::after{visibility:hidden!important}';
        document.head.appendChild(st);
      }, f);
      await pg.locator(f.path).first().screenshot({ path: shot, timeout: 5000, animations: 'disabled', omitBackground: true });
    } catch { continue; } finally {
      await pg.evaluate(() => { document.getElementById('ds-ref-style')?.remove(); document.querySelectorAll('.ds-ref-keep').forEach((e) => e.classList.remove('ds-ref-keep', 'ds-ref-self')); }).catch(() => {});
    }
    c.variants.set(f.variant, { id, page: p.name, rel: p.rel, count: 1, ...f, children: undefined });
  }
  await pg.close();
}
await browser.close();

const components = [...byKey.values()].map((c) => ({
  ...c, src: [...c.src].slice(0, 20), children: [...c.children], variants: [...c.variants.values()],
}));
writeFileSync(join(OUT, 'instances.json'), JSON.stringify({ at: new Date().toISOString(), pages: pages.map((p) => p.name), components }));
console.log(`  ${pages.length} pages · ${seen} instances · ${components.length} components · ${components.reduce((n, c) => n + c.variants.length, 0)} variants kept`);
