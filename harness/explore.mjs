#!/usr/bin/env node
/**
 * Find every state a page can reach, by trying everything on it.
 *
 * harness/interactions/listings.mjs was written by hand, one probe at a time,
 * and it is the only page that ever had states: the other ten were compiled
 * as their default screen and nothing else, so every modal, drawer, dropdown,
 * tooltip and tab behind them was simply absent from the design system. A
 * hand-kept list does not fail when a page is missing from it.
 *
 * So this asks React. Every element the product gave an onClick, onMouseEnter
 * or onMouseDown handler to (read from __reactProps, not guessed from tags) is
 * a candidate. Each one is tried on a freshly loaded page — on the FIXTURE
 * account, where every API call is answered locally and no click can change
 * anything real — and the result is classified:
 *
 *   overlay   a modal, drawer, popover, dropdown, tooltip, picker or select
 *             list became visible                      → a state
 *   inline    the content region changed in place (a tab, a segmented
 *             control, an accordion, a filter chip)     → a state
 *   nav       the URL changed                          → a link, not a state
 *   nothing   nothing observable                       → dropped
 *
 * Duplicates collapse by WHAT APPEARED, not by what was clicked: ten rows'
 * identical Delete buttons open one modal, and that modal is one state.
 *
 *   node harness/explore.mjs                    the eleven pages
 *   node harness/explore.mjs --pages dashboard
 *   node harness/explore.mjs --nested           inside every modal and drawer found: what it leads to
 *   node harness/explore.mjs --max 80           candidates tried per page (default 120),
 *                                               breadth first: one of every kind of control before any repeat
 *
 * Writes data/states/<page>.json. scripts/compile.mjs compiles every state in
 * it after the hand-written ones in harness/interactions/<page>.mjs.
 */
import pkg from 'playwright';
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { serve } from './serve.mjs';
import { openPage, settle } from './page.mjs';

const { chromium } = pkg;
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const arg = (n, d) => { const i = process.argv.indexOf(n); return i > -1 ? process.argv[i + 1] : d; };
const { ALL: PAGES } = await import('../scripts/pages-list.mjs');
const want = arg('--pages') ? arg('--pages').split(',') : Object.keys(PAGES);
const MAX = Number(arg('--max', 120));
/* --device mobile explores the RESPONSIVE layout (a phone's viewport and
   user agent — harness/page.mjs DEVICES) into data/states/mobile/ */
const DEVICE = arg('--device', 'web');
const OUTDIR = join(ROOT, 'data', 'states', DEVICE === 'mobile' ? 'mobile' : '');
/* the shell is the same on every page: explore it once, on the dashboard */
const SHELL_ON = 'dashboard';
/* things that end the session, leave the product or switch the language —
   none of them is a state of this page */
const SKIP = /log ?out|sign ?out|العربية|arabic|^ar$|language/i;

/* ── in the page: the candidates, straight from React's props ──────────── */
const CANDIDATES = ({ shell: includeShell, root }) => {
  const propsOf = (el) => { const k = Object.keys(el).find((x) => x.startsWith('__reactProps$')); return k ? el[k] : null; };
  const pathOf = (el) => {
    const parts = [];
    for (let e = el; e && e !== document.documentElement; e = e.parentElement) {
      const p = e.parentElement; if (!p) break;
      parts.unshift(`${e.tagName.toLowerCase()}:nth-child(${[...p.children].indexOf(e) + 1})`);
    }
    return 'html > ' + parts.join(' > ');
  };
  const labelOf = (el) => {
    const t = (el.getAttribute('aria-label') || el.getAttribute('title') || el.getAttribute('placeholder') || el.innerText || '').trim().replace(/\s+/g, ' ');
    if (t) return t.slice(0, 40);
    /* a field's inner input says nothing: the select, picker or form item it
       belongs to names it — its placeholder, its value, its label */
    const host = el.closest('.ant-select, .ant-picker, .ant-input-affix-wrapper, .ant-form-item');
    if (host) {
      /* the field's label first ("City"), then its placeholder ("Select
         Purpose") — its current value ("Riyadh") is the account's data */
      const lab = (host.closest('.ant-form-item') || host).querySelector('.ant-form-item-label label');
      if (lab && lab.innerText.trim()) return lab.innerText.trim().replace(/\s+/g, ' ').slice(0, 40);
      const ph = host.querySelector('.ant-select-selection-placeholder, input[placeholder]');
      const pt = ph ? (ph.getAttribute('placeholder') || ph.innerText || '').trim() : '';
      if (pt) return pt.replace(/\s+/g, ' ').slice(0, 40);
    }
    const svg = el.querySelector('svg'); return svg ? (svg.getAttribute('data-icon') || 'icon') : el.tagName.toLowerCase();
  };
  const inShell = (el) => !!el.closest('.ant-layout-header, .ant-layout-sider, footer');
  const out = [];
  const seen = new Set();
  /* inside one overlay only, when exploring what an open modal or drawer
     leads to (--nested) */
  const scope = root ? document.querySelector(root) : document.body;
  for (const el of scope ? scope.querySelectorAll('*') : []) {
    const pr = propsOf(el);
    if (!pr) continue;
    const click = pr.onClick || pr.onMouseDown;
    const hover = pr.onMouseEnter || pr.onPointerEnter;
    if (!click && !hover) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 4 || r.height < 4) continue;
    if (el.closest('[disabled], .ant-btn-disabled, [aria-disabled="true"]')) continue;
    if (el.matches('input[type=file]') || el.closest('input[type=file]')) continue;
    const shell = inShell(el);
    if (shell && !includeShell) continue;
    /* the innermost handler wins: an antd Button's outer span and inner span
       are one control */
    if ([...el.querySelectorAll('*')].some((c) => { const q = propsOf(c); return q && (q.onClick || q.onMouseEnter) && c.getBoundingClientRect().width > 0 && c.getBoundingClientRect().width >= r.width - 2 && c.getBoundingClientRect().height >= r.height - 2; })) continue;
    const label = labelOf(el);
    const sig = `${el.getAttribute('data-pf-src') || ''}|${[...el.classList].filter((c) => /^ant-/.test(c)).join('.')}|${label}|${el.tagName}`;
    if (seen.has(sig)) continue;
    seen.add(sig);
    /* the KIND of control — same component, classes and tag — whatever its
       label says: ten rows' menus are one kind, tried once before any repeat */
    const group = `${el.getAttribute('data-pf-src') || ''}|${[...el.classList].filter((c) => /^ant-/.test(c)).join('.')}|${el.tagName}|${click ? 'c' : 'h'}`;
    out.push({ path: pathOf(el), label, action: click ? 'click' : 'hover', shell, group, y: Math.round(r.y + scrollY) });
  }
  return out;
};

/* what is on screen now, as a comparable signature */
const OBSERVE = (rootSel = null) => {
  const vis = (el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.opacity !== '0'; };
  const kinds = {
    modal: '.ant-modal-wrap:not([style*="display: none"]) .ant-modal',
    drawer: '.ant-drawer-open .ant-drawer-content, .ant-drawer-content-wrapper:not([style*="display: none"]) .ant-drawer-content',
    popover: '.ant-popover:not(.ant-popover-hidden)',
    dropdown: '.ant-dropdown:not(.ant-dropdown-hidden), .ant-select-dropdown:not(.ant-select-dropdown-hidden)',
    picker: '.ant-picker-dropdown:not(.ant-picker-dropdown-hidden)',
    tooltip: '.ant-tooltip:not(.ant-tooltip-hidden)',
    tour: '.ant-tour',
    message: '.ant-message-notice, .ant-notification-notice',
  };
  const open = [];
  for (const [k, sel] of Object.entries(kinds)) for (const el of document.querySelectorAll(sel)) if (vis(el)) open.push({ k, text: el.innerText.trim().replace(/\s+/g, ' ').slice(0, 120), w: Math.round(el.getBoundingClientRect().width), h: Math.round(el.getBoundingClientRect().height) });
  const content = document.querySelector('.ant-layout-content');
  /* the content region's shape — text and structure, not pixels — so a tab
     switch or an expanded panel shows up, and a caret blink does not */
  const shape = content ? `${content.querySelectorAll('*').length}:${content.innerText.length}:${[...content.querySelectorAll('.ant-tabs-tab-active, .ant-segmented-item-selected, .ant-radio-button-wrapper-checked, [aria-selected="true"], [aria-expanded="true"]')].map((e) => e.innerText.trim()).join('|')}` : '';
  /* and, when an overlay is being explored, that overlay's own shape — a tab
     or a step switching inside a drawer changes it */
  const root = rootSel ? document.querySelector(rootSel) : null;
  const rootShape = root ? `${root.querySelectorAll('*').length}:${root.innerText.length}:${[...root.querySelectorAll('.ant-tabs-tab-active, .ant-segmented-item-selected, .ant-radio-button-wrapper-checked, .ant-steps-item-active, [aria-selected="true"], [aria-expanded="true"]')].map((e) => e.innerText.trim()).join('|')}` : '';
  return { url: location.pathname + location.search, open, shape, rootShape, rootVisible: !!root && vis(root) };
};

const kebab = (s) => s.toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/[\s_]+/g, '-').replace(/-+/g, '-').slice(0, 36).replace(/-$/, '') || 'x';

/* ── --nested: what the page's modals and drawers lead to ─────────────────
   A state one level down: a tab inside a drawer, a confirm modal a drawer's
   button opens, a picker inside a modal. For every modal and drawer the page
   explore found (data/states/<page>.json), open it, try the controls INSIDE
   it — breadth first, at most --nested-max — and keep what opens or changes
   in it, under <parent>__<kind>-<name>. A control that just closes the
   overlay (Cancel, ✕) is not a state. Written into the same file, `nested`. */
const NESTED = process.argv.includes('--nested');
const NMAX = Number(arg('--nested-max', 12));
const OVERLAY_SEL = {
  modal: '.ant-modal-wrap:not([style*="display: none"]) .ant-modal',
  drawer: '.ant-drawer-open .ant-drawer-content, .ant-drawer-content-wrapper:not([style*="display: none"]) .ant-drawer-content',
};
const ROOT_SEL = '[data-pf-explore-root]';
const exploreNested = async (slug, page, fresh) => {
  const file = join(OUTDIR, `${slug}.json`);
  if (!existsSync(file)) { console.log(`  ${slug.padEnd(32)} no states yet — explore it first`); return; }
  const doc = JSON.parse(readFileSync(file, 'utf8'));
  const parents = doc.states.filter((st) => OVERLAY_SEL[st.kind] && !st.shell);
  const act = async (path, action) => {
    const loc = page.locator(path).first();
    await loc.scrollIntoViewIfNeeded({ timeout: 3000 });
    if (action === 'hover') await loc.hover({ force: true, timeout: 3000 });
    else if (DEVICE === 'mobile') await loc.tap({ force: true, timeout: 3000, noWaitAfter: true });
    else await loc.click({ force: true, timeout: 3000, noWaitAfter: true });
    await page.waitForTimeout(900);
  };
  /* the parent open, and its overlay marked as the place to look */
  const openParent = async (par) => {
    await fresh();
    await act(par.path, par.action);
    return page.evaluate((sel) => {
      const vis = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
      document.querySelectorAll('[data-pf-explore-root]').forEach((e) => e.removeAttribute('data-pf-explore-root'));
      const els = [...document.querySelectorAll(sel)].filter(vis);
      const root = els[els.length - 1];
      if (!root) return false;
      root.setAttribute('data-pf-explore-root', '');
      return true;
    }, OVERLAY_SEL[par.kind]);
  };
  const nested = [];
  for (const par of parents) {
    try {
      if (!(await openParent(par))) continue;
      const base = await page.evaluate(OBSERVE, ROOT_SEL);
      const all = (await page.evaluate(CANDIDATES, { shell: false, root: ROOT_SEL })).filter((c) => !SKIP.test(c.label));
      const groups = new Map();
      for (const c of all) { if (!groups.has(c.group)) groups.set(c.group, []); groups.get(c.group).push(c); }
      const cands = [];
      for (let i = 0; cands.length < all.length; i++) for (const g of groups.values()) if (g[i]) cands.push(g[i]);
      cands.splice(NMAX);
      const seen = new Set();
      for (const c of cands) {
        try {
          if (!(await openParent(par))) continue;
          await act(c.path, c.action);
          const now = await page.evaluate(OBSERVE, ROOT_SEL);
          if (now.url !== base.url) continue;                        /* a link, not a state */
          const opened = now.open.filter((o) => !base.open.some((b) => b.k === o.k && b.text === o.text));
          if (!now.rootVisible && !opened.length) continue;           /* it closed the overlay */
          const kind = opened.length ? opened[opened.length - 1].k : now.rootShape !== base.rootShape ? 'inline' : null;
          if (!kind) continue;
          const sig = opened.length ? opened.map((o) => `${o.k}:${o.w}x${o.h}:${o.text}`).join('|') : `inline:${now.rootShape}`;
          if (seen.has(sig)) continue;
          seen.add(sig);
          const title = opened.length ? opened[opened.length - 1].text.split(/\s+/).slice(0, 4).join(' ') : '';
          const generic = /^(icon|svg|div|span|img|button|a|li|p|x|i|input|textarea|label|select)$/i.test(c.label) || c.label.length < 2;
          const stem = kebab(generic && title ? title : c.label);
          let name = `${par.name}__${kind}-${stem}`;
          for (let k = 2; nested.some((n) => n.name === name); k++) name = `${par.name}__${kind}-${stem}-${k}`;
          nested.push({ name, parent: par.name, kind, action: c.action, path: c.path, label: c.label, title, opened: opened.map(({ k, w, h }) => ({ k, w, h })) });
        } catch (e) { if (process.env.EXPLORE_DEBUG) console.log(`    ! ${par.name} › ${c.label} — ${String(e).split('\n')[0].slice(0, 120)}`); }
      }
    } catch (e) { if (process.env.EXPLORE_DEBUG) console.log(`    ! ${par.name} — ${String(e).split('\n')[0].slice(0, 120)}`); }
  }
  doc.nested = nested;
  doc.nestedAt = new Date().toISOString();
  writeFileSync(file, JSON.stringify(doc, null, 1));
  console.log(`  ${slug.padEnd(32)} overlays ${String(parents.length).padStart(3)}  nested ${String(nested.length).padStart(3)}   ${nested.map((n) => n.name).join(' ').slice(0, 150)}`);
};

const app = await serve();
const browser = await chromium.launch();
mkdirSync(OUTDIR, { recursive: true });

for (const slug of want) {
  const url = `${app.url}/en${PAGES[slug]}`;
  const { page, ctx } = await openPage(browser, app.url, { device: DEVICE });
  await ctx.addInitScript(() => { window.open = () => null; });
  const fresh = async () => {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    try { await page.waitForSelector('.ant-layout', { timeout: 30_000 }); } catch {}
    await settle(page);
  };
  if (NESTED) { await exploreNested(slug, page, fresh); await ctx.close(); continue; }
  await fresh();
  const base = await page.evaluate(OBSERVE);
  /* breadth first: one control of every kind, then the second of every
     kind, … — so a page whose rows repeat a control fifty times still has
     every OTHER control tried before the cap is reached */
  const all = (await page.evaluate(CANDIDATES, { shell: slug === SHELL_ON, root: null })).filter((c) => !SKIP.test(c.label));
  const groups = new Map();
  for (const c of all) { if (!groups.has(c.group)) groups.set(c.group, []); groups.get(c.group).push(c); }
  const cands = [];
  for (let i = 0; cands.length < all.length; i++) for (const g of groups.values()) if (g[i]) cands.push(g[i]);
  cands.splice(MAX);
  const states = [], links = [], seen = new Set();
  let dirty = false;
  for (const c of cands) {
    if (dirty) { await fresh(); dirty = false; }
    try {
      const loc = page.locator(c.path).first();
      await loc.scrollIntoViewIfNeeded({ timeout: 3000 });
      if (c.action === 'hover') await loc.hover({ force: true, timeout: 3000 });
      else await loc.click({ force: true, timeout: 3000, noWaitAfter: true });
      await page.waitForTimeout(900);
      const now = await page.evaluate(OBSERVE);
      dirty = true;
      if (now.url !== base.url) { links.push({ label: c.label, to: now.url }); continue; }
      const opened = now.open.filter((o) => !base.open.some((b) => b.k === o.k && b.text === o.text));
      const kind = opened.length ? opened[opened.length - 1].k : now.shape !== base.shape ? 'inline' : null;
      if (!kind) { dirty = false; continue; }
      /* the same thing opened by another trigger is the same state */
      const sig = opened.length ? opened.map((o) => `${o.k}:${o.w}x${o.h}:${o.text}`).join('|') : `inline:${now.shape}`;
      if (seen.has(sig)) continue;
      seen.add(sig);
      /* an icon-only trigger has no label worth a name — name the state after
         what OPENED instead: the overlay's own first words (fixture text) */
      const title = opened.length ? opened[opened.length - 1].text.split(/\s+/).slice(0, 4).join(' ') : '';
      const generic = /^(icon|svg|div|span|img|button|a|li|p|x|i|input|textarea|label|select)$/i.test(c.label) || c.label.length < 2;
      const stem = kebab(generic && title ? title : c.label);
      let name = `${kind}-${stem}`;
      for (let k = 2; states.some((s) => s.name === name); k++) name = `${kind}-${stem}-${k}`;
      states.push({ name, kind, action: c.action, path: c.path, label: c.label, title, shell: c.shell, opened: opened.map(({ k, w, h }) => ({ k, w, h })) });
    } catch (e) {
      dirty = true;
      if (process.env.EXPLORE_DEBUG) console.log(`    ! ${c.action} “${c.label}” — ${String(e).split('\n')[0].slice(0, 140)}`);
    }
  }
  /* a re-run keeps what --nested found under parents that are still here */
  let kept = [];
  try { const prev = JSON.parse(readFileSync(join(OUTDIR, `${slug}.json`), 'utf8')); kept = (prev.nested || []).filter((n) => states.some((s) => s.name === n.parent)); } catch {}
  writeFileSync(join(OUTDIR, `${slug}.json`), JSON.stringify({ page: slug, route: PAGES[slug], device: DEVICE, at: new Date().toISOString(), tried: cands.length, states, links, ...(kept.length ? { nested: kept } : {}) }, null, 1));
  console.log(`  ${slug.padEnd(32)} tried ${String(cands.length).padStart(3)}  states ${String(states.length).padStart(3)}  links ${links.length}   ${states.map((s) => s.name).join(' ').slice(0, 150)}`);
  await ctx.close();
}
await browser.close();
if (!process.env.KEEP_SERVER) await app.stop();
