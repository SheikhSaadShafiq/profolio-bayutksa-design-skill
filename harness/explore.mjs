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
 *   node harness/explore.mjs --max 80           candidates tried per page (default 60)
 *
 * Writes data/states/<page>.json. scripts/compile.mjs compiles every state in
 * it after the hand-written ones in harness/interactions/<page>.mjs.
 */
import pkg from 'playwright';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { serve } from './serve.mjs';
import { openPage, settle } from './page.mjs';

const { chromium } = pkg;
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const arg = (n, d) => { const i = process.argv.indexOf(n); return i > -1 ? process.argv[i + 1] : d; };
const { PAGES } = await import('../scripts/pages-list.mjs');
const want = arg('--pages') ? arg('--pages').split(',') : Object.keys(PAGES);
const MAX = Number(arg('--max', 60));
/* the shell is the same on every page: explore it once, on the dashboard */
const SHELL_ON = 'dashboard';
/* things that end the session, leave the product or switch the language —
   none of them is a state of this page */
const SKIP = /log ?out|sign ?out|العربية|arabic|^ar$|language/i;

/* ── in the page: the candidates, straight from React's props ──────────── */
const CANDIDATES = (includeShell) => {
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
    const t = (el.getAttribute('aria-label') || el.getAttribute('title') || el.innerText || '').trim().replace(/\s+/g, ' ');
    if (t) return t.slice(0, 40);
    const svg = el.querySelector('svg'); return svg ? (svg.getAttribute('data-icon') || 'icon') : el.tagName.toLowerCase();
  };
  const inShell = (el) => !!el.closest('.ant-layout-header, .ant-layout-sider, footer');
  const out = [];
  const seen = new Set();
  for (const el of document.querySelectorAll('body *')) {
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
    out.push({ path: pathOf(el), label, action: click ? 'click' : 'hover', shell, y: Math.round(r.y + scrollY) });
  }
  return out;
};

/* what is on screen now, as a comparable signature */
const OBSERVE = () => {
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
  return { url: location.pathname + location.search, open, shape };
};

const kebab = (s) => s.toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/[\s_]+/g, '-').replace(/-+/g, '-').slice(0, 36).replace(/-$/, '') || 'x';

const app = await serve();
const browser = await chromium.launch();
mkdirSync(join(ROOT, 'data', 'states'), { recursive: true });

for (const slug of want) {
  const url = `${app.url}/en${PAGES[slug]}`;
  const { page, ctx } = await openPage(browser, app.url);
  await ctx.addInitScript(() => { window.open = () => null; });
  const fresh = async () => {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    try { await page.waitForSelector('.ant-layout', { timeout: 30_000 }); } catch {}
    await settle(page);
  };
  await fresh();
  const base = await page.evaluate(OBSERVE);
  const cands = (await page.evaluate(CANDIDATES, slug === SHELL_ON)).filter((c) => !SKIP.test(c.label)).slice(0, MAX);
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
      const generic = /^(icon|svg|div|span|img|button|a|li|p|x|i)$/i.test(c.label) || c.label.length < 2;
      const base = kebab(generic && title ? title : c.label);
      let name = `${kind}-${base}`;
      for (let k = 2; states.some((s) => s.name === name); k++) name = `${kind}-${base}-${k}`;
      states.push({ name, kind, action: c.action, path: c.path, label: c.label, title, shell: c.shell, opened: opened.map(({ k, w, h }) => ({ k, w, h })) });
    } catch (e) {
      dirty = true;
    }
  }
  writeFileSync(join(ROOT, 'data', 'states', `${slug}.json`), JSON.stringify({ page: slug, route: PAGES[slug], at: new Date().toISOString(), tried: cands.length, states, links }, null, 1));
  console.log(`  ${slug.padEnd(32)} tried ${String(cands.length).padStart(3)}  states ${String(states.length).padStart(3)}  links ${links.length}   ${states.map((s) => s.name).join(' ').slice(0, 150)}`);
  await ctx.close();
}
await browser.close();
if (!process.env.KEEP_SERVER) await app.stop();
