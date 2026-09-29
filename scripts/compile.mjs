#!/usr/bin/env node
/**
 * Compile the product's own render into static pages — pixel for pixel.
 *
 * WHY THIS EXISTS
 * The pages in deliverables/ used to be written by hand from measurements,
 * and every one of them drifted: against the real product (Surge, 2026-09-28)
 * the eleven hand-built pages matched 0.1% of its boxes to ±1px. Writing a
 * page from an impression of the product — however carefully measured — loses
 * to the product changing underneath it. A probe that froze the product's own
 * dashboard into a static file scored 0.37% pixel difference on its first try.
 *
 * So the pages are no longer written, they are COMPILED: the harness renders
 * each route on the fixture account (invented data — nobody's listings), and
 * harness/freeze.js serialises the DOM with exactly the CSS rules that paint
 * it, in cascade order, with every font and image it needs inlined. Then:
 *
 *   ant-*                         → pf-*        (antd's vocabulary, ours by name)
 *   css-dev-only-do-not-override-* → pf-theme   (antd's theme scope, kept: it
 *                                               carries specificity-free rules
 *                                               that stripping would widen)
 *   a styled-components hash      → pf-<Name>   named after the JSX tag the
 *                                               product wrote, read from the
 *                                               source line React recorded
 *   data-pf-src="src/…:line"      on every element the product's own JSX drew,
 *                                 so a component in the design system can say
 *                                 exactly which file it came from
 *
 * Every state the harness can reach — harness/interactions/<page>.mjs — is
 * compiled too, into deliverables/states/, and every compiled file is rendered
 * again straight away and scored against the product it came from. A page
 * that does not come back within the bar is reported, not shipped quietly.
 *
 *   node scripts/compile.mjs                       the eleven pages
 *   node scripts/compile.mjs --pages dashboard,listings
 *   node scripts/compile.mjs --states              …and every interaction state
 *   node scripts/compile.mjs --pages listings --states --only modal-delete,error
 *
 * Writes deliverables/<page>.html, deliverables/states/<page>--<state>.html,
 * data/live/<name>.{png,capture.json} (the product, at the moment of freezing),
 * data/ours/<name>.{png,capture.json} (the compiled file, re-rendered) and
 * data/qa/compile.json.
 */
import pkg from 'playwright';
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync, unlinkSync, readdirSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import { serve, REPO } from '../harness/serve.mjs';
import { openPage, settle, FONTS_CSS, DEVICES } from '../harness/page.mjs';

const { chromium } = pkg;
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
/* --device mobile compiles the RESPONSIVE site: the product rendered as a
   phone (harness/page.mjs DEVICES.mobile — 375×812, a phone's user agent,
   touch), written to deliverables/mobile/, its data named <name>--mobile */
const DEVICE = (process.argv.includes('--device') ? process.argv[process.argv.indexOf('--device') + 1] : 'web');
const MOBILE = DEVICE === 'mobile';
const DELIV = join(ROOT, 'deliverables', MOBILE ? 'mobile' : '');
const STATES_DIR = join(DELIV, 'states');
const dataName = (n) => (MOBILE ? `${n}--mobile` : n);
const UP = (inStates) => (MOBILE ? '../' : '') + (inStates ? '../' : '');
const arg = (n, d) => { const i = process.argv.indexOf(n); return i > -1 ? process.argv[i + 1] : d; };
const flag = (n) => process.argv.includes(n);

import { ALL as PAGES } from './pages-list.mjs';
import { NESTED_A, UNPARSABLE_SOURCE, needsRestore } from './lib/nested-a.mjs';
const want = arg('--pages') ? arg('--pages').split(',').map((s) => s.trim()) : Object.keys(PAGES);
const unknown = want.filter((p) => !PAGES[p]);
if (unknown.length) { console.error(`  unknown page(s): ${unknown.join(', ')}\n  known: ${Object.keys(PAGES).join(' ')}`); process.exit(2); }
const ONLY = (arg('--only') || '').split(',').map((s) => s.trim()).filter(Boolean);
/* the agreed bar: at most 0.5% of the pixels differ */
const BAR = 0.5;

const FREEZE = readFileSync(join(ROOT, 'harness', 'freeze.js'), 'utf8').replace(/__UNPARSABLE__/g, `(${UNPARSABLE_SOURCE})`);
const CAPTURE = readFileSync(join(ROOT, 'tools', 'profolio-capture', 'capture.js'), 'utf8');

/* ── 1 · freeze every page and state from the product ─────────────────── */
const app = await serve();
const browser = await chromium.launch();
const frozen = [];                                   /* { name, page, state, note, raw } */

/* quiet: half a second without a DOM change, a scroll or a finite
   animation; three seconds is the most it waits */
const QUIET = async () => {
  let last = performance.now();
  /* an animated SVG (a Lottie, a chart) changes its attributes every
     frame and is never quiet; the rest of the page is what must settle */
  const obs = new MutationObserver((ms) => { if (ms.some((m) => !(m.target instanceof SVGElement))) last = performance.now(); });
  obs.observe(document.body, { subtree: true, childList: true, attributes: true, characterData: true });
  const onScroll = () => { last = performance.now(); };
  document.addEventListener('scroll', onScroll, true);           /* any box, not only the window */
  let sx = scrollX, sy = scrollY;
  const t0 = performance.now();
  while (performance.now() - t0 < 3000) {
    await new Promise((r) => setTimeout(r, 100));
    if (scrollX !== sx || scrollY !== sy) { sx = scrollX; sy = scrollY; last = performance.now(); }
    if (document.getAnimations().some((a) => a.playState === 'running' && a.effect && a.effect.getComputedTiming().iterations !== Infinity)) last = performance.now();
    if (performance.now() - last > 500) break;
  }
  obs.disconnect();
  document.removeEventListener('scroll', onScroll, true);
};
/* clear every timeout and interval the page has set so far (their ids are
   one counter, from 1 up) */
const STOP_CLOCK = () => { const last = setTimeout(() => {}, 0); for (let i = 1; i <= last; i++) { clearTimeout(i); clearInterval(i); } return last; };
/* did the page stay where it was frozen? every scrolled box still at the
   offset freeze.js wrote on it, the window at its own */
const STILL = (at) => scrollX === at.x && scrollY === at.y
  && [...document.querySelectorAll('[data-pf-scroll]')].every((el) => `${Math.round(el.scrollLeft)},${Math.round(el.scrollTop)}` === el.getAttribute('data-pf-scroll'));
const snap = async (page, name, meta) => {
  /* freeze what has SETTLED — the reference shot is taken after the freeze,
     and a page still moving between the two disagrees with itself: an
     overlay caught mid-entrance, text still being typed in, a panel still
     scrolling a control into view. And if it moved anyway (a late scroll the
     product schedules), freeze it again: the copy and its reference must be
     of the same moment. */
  const { hold, ...info } = meta;
  let raw, cap, shotFull, viewportOnly = meta.shot === 'viewport';
  for (let attempt = 0; attempt < 3; attempt++) {
    await page.evaluate(QUIET).catch(() => {});
    /* what the page itself never lets settle — the upgrade page's looping
       Lottie — is stopped by the page's own `hold` (harness/interactions/
       <page>.mjs), on every state of the page, the shell's and the
       explorer's as much as its own */
    if (hold) await hold(page);
    /* and time stops: a toast that would leave, a countdown that would tick
       (the OTP drawer's 00:53 → 00:54), a carousel that would turn — every
       timer already set is cleared, so the copy and its reference are of the
       same moment. New timers still run (QUIET's own waits need them). */
    await page.evaluate(STOP_CLOCK).catch(() => {});
    raw = await page.evaluate(FREEZE);
    /* anything open over the page is placed against the VIEWPORT, and a
       full-page shot resizes it — antd then re-places a dropdown, a select
       list, a picker or a tooltip, and the shot no longer shows what was frozen */
    shotFull = !viewportOnly && !Object.values(raw.overlay).some(Boolean) && !raw.scrolled;
    mkdirSync(join(ROOT, 'data', 'live'), { recursive: true });
    cap = await page.evaluate(CAPTURE);
    /* an infinite animation (a skeleton's shimmer, a spinner) is shot at its
       start on both sides — the product's shot and the copy's — or the two
       land at different phases of it */
    await page.screenshot({ path: join(ROOT, 'data', 'live', `${dataName(name)}.png`), fullPage: shotFull, animations: 'disabled' });
    if (await page.evaluate(STILL, raw.scroll).catch(() => true)) break;
    console.log(`  ${name}: the page moved after it was frozen — again`);
    /* the full-page shot itself can be what moved it: it resizes the
       viewport, and a phone answers a resize by scrolling the focused field
       into view — every attempt then freezes at one offset and shoots at
       another (post-listing-edit's form states). Put the page back where it
       was frozen and shoot what is on screen, which resizes nothing */
    if (shotFull) {
      viewportOnly = true;
      await page.evaluate(({ x, y }) => scrollTo(x, y), raw.scroll).catch(() => {});
    }
  }
  cap.source = 'harness'; cap.locale = 'en'; cap.state = name;
  writeFileSync(join(ROOT, 'data', 'live', `${dataName(name)}.capture.json`), JSON.stringify(cap));
  frozen.push({ name, ...info, raw, shotFull });
  console.log(`  froze ${name.padEnd(46)} ${String(raw.css.length).padStart(4)} sheets  ${(raw.html.length / 1024).toFixed(0).padStart(5)} KB dom`);
};

/* one page, all its states, in its own browser context — pages run in
   parallel (--jobs, default 3), so the answer-set MODE is the page's own */
/* The product's own viewport meta, not a generic one. A phone lays a page out
   by it: without the product's maximum-scale=1.0 and user-scalable=0 a mobile
   browser widens the layout viewport to the product's horizontal overflow
   (433px at 375) and every fixed bar — the app banner, the header — with it. */
const VIEWPORT = (() => {
  try { const m = readFileSync(join(REPO, 'index.html'), 'utf8').match(/<meta\s+name="viewport"\s+content="([^"]+)"/); if (m) return m[1]; } catch {}
  return 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0';
})();
/* a page recompiled with all its states replaces the states it had: a state
   the explorer no longer finds, or found under a better name, must not stay
   behind as an orphan file (and its captures and page CSS with it) */
const clearStates = (slug) => {
  const stem = `${slug}--`, tail = MOBILE ? '--mobile' : '';
  const dirs = [[join(DELIV, 'states'), (f) => f.startsWith(stem) && f.endsWith('.html')]];
  for (const d of ['live', 'ours']) dirs.push([join(ROOT, 'data', d), (f) => f.startsWith(stem) && !/\.real/.test(f) && (MOBILE ? f.includes(`${tail}.`) : !f.includes('--mobile.'))]);
  dirs.push([join(ROOT, 'data', 'ds', 'page-css'), (f) => f.startsWith(stem) && (MOBILE ? f.endsWith(`${tail}.css`) : !f.endsWith('--mobile.css'))]);
  let n = 0;
  for (const [dir, keep] of dirs) if (existsSync(dir)) for (const f of readdirSync(dir)) if (keep(f)) { unlinkSync(join(dir, f)); n++; }
  return n;
};
/* one recorded control: hovered, tapped on a phone (a click leaves the
   pointer over the control, and the product's :hover then shows in the shot
   but not in the copy), clicked on the web */
const ACT = async (p, path, action) => {
  const loc = p.locator(path).first();
  await loc.scrollIntoViewIfNeeded({ timeout: 5000 });
  if (action === 'hover') await loc.hover({ force: true, timeout: 5000 });
  else if (MOBILE) await loc.tap({ force: true, timeout: 5000, noWaitAfter: true });
  else await loc.click({ force: true, timeout: 5000, noWaitAfter: true });
  await p.waitForTimeout(900);
};
/* the prototype's links, written into the page before it is frozen: each
   trigger gets data-pf-go, the first link for an element wins */
const MARK = async (p, links, triggers = []) => {
  await p.evaluate((links) => { for (const [path, href] of links) { const el = path && document.querySelector(path); if (el && !el.hasAttribute('data-pf-go')) el.setAttribute('data-pf-go', href); } }, links).catch(() => {});
  for (const [sel, href] of triggers) {
    try {
      const h = await p.locator(sel).first().elementHandle({ timeout: 1500 });
      if (h) await h.evaluate((el, href) => { if (!el.hasAttribute('data-pf-go')) el.setAttribute('data-pf-go', href); }, href);
    } catch {}
  }
};
const PUBLIC = new Set(['invite', 'maintenance', 'process-payment', 'post-ad']);
const compilePage = async (slug) => {
  if (flag('--states') && !ONLY.length) clearStates(slug);
  const M = { v: null };
  const url = `${app.url}/en${PAGES[slug]}`;
  const { page, ctx } = await openPage(browser, app.url, { mode: () => M.v, device: DEVICE });
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  try { await page.waitForSelector('.ant-layout', { timeout: 30_000 }); } catch {}
  await settle(page);
  /* the states: the hand-written ones (harness/interactions/<page>.mjs), then
     the ones harness/explore.mjs found by trying every handler on the page
     (data/states/<page>.json) under names the hand-written list does not use */
  const file = join(ROOT, 'harness', 'interactions', `${slug}.mjs`);
  const own = existsSync(file) ? await import(file) : {};
  let steps = flag('--states') ? [...(own.default || [])] : [];
  const hold = own.hold || null;
  /* a hand-written click path is written against the WEB layout; on a phone
     only the device-neutral states carry over (fixture modes — loading,
     error, staff, … — and steps that declare devices: ['mobile']) */
  if (MOBILE) steps = steps.filter((st) => !st.do || (st.devices || []).includes('mobile'));
  /* and the phone's own click paths, written against the phone layout:
     harness/interactions/<page>.mobile.mjs */
  const mobileFile = join(ROOT, 'harness', 'interactions', `${slug}.mobile.mjs`);
  if (MOBILE && flag('--states') && existsSync(mobileFile)) for (const st of (await import(mobileFile)).default) if (!steps.some((s) => s.name === st.name)) steps.push(st);
  const explored = join(ROOT, 'data', 'states', MOBILE ? 'mobile' : '', `${slug}.json`);
  if (flag('--states') && existsSync(explored)) {
    const doc = JSON.parse(readFileSync(explored, 'utf8'));
    for (const st of doc.states) {
      if (steps.some((s) => s.name === st.name)) continue;
      steps.push({
        name: st.name, path: st.path,
        note: `found by harness/explore.mjs: ${st.action} “${st.label}” opens ${st.kind === 'inline' ? 'a change in place' : `a ${st.kind}`}`,
        do: async (p) => ACT(p, st.path, st.action),
      });
    }
    /* one level down — what a modal or drawer leads to (explore.mjs
       --nested): the parent opened, then the control inside it */
    for (const n of doc.nested || []) {
      const par = doc.states.find((s) => s.name === n.parent);
      if (!par || steps.some((s) => s.name === n.name)) continue;
      steps.push({
        name: n.name, parent: n.parent, path: n.path,
        note: `found by harness/explore.mjs --nested: in the ${par.kind} “${par.label}” opens, ${n.action} “${n.label}” opens ${n.kind === 'inline' ? 'a change in place' : `a ${n.kind}`}`,
        do: async (p) => { await ACT(p, par.path, par.action); await ACT(p, n.path, n.action); },
      });
    }
  }
  /* the shell's states, on every page: harness/interactions/_shell.mjs, and
     the shell states the explorer found on the dashboard — but not on the
     public pages, which have no shell and no account to vary (an invitation,
     the maintenance page, the payment gateway's return, the magic post-ad
     link) — a public page lists the shared states it does have itself */
  if (flag('--states') && !PUBLIC.has(slug)) {
    /* the layout's shell (_shell.mjs on the web, _mobile.mjs on a phone),
       then every other _*.mjs — the states every page has: the account
       variants (_accounts.mjs), the data states (_data.mjs), … */
    const INT = join(ROOT, 'harness', 'interactions');
    const shellFile = join(INT, MOBILE ? '_mobile.mjs' : '_shell.mjs');
    const common = readdirSync(INT).filter((f) => /^_.*\.mjs$/.test(f) && !['_shell.mjs', '_mobile.mjs'].includes(f)).sort();
    const shell = [...(existsSync(shellFile) ? (await import(shellFile)).default : [])];
    for (const f of common) for (const st of (await import(join(INT, f))).default) if (!MOBILE || !st.do || (st.devices || []).includes('mobile')) shell.push(st);
    const dash = join(ROOT, 'data', 'states', MOBILE ? 'mobile' : '', 'dashboard.json');
    const explShell = existsSync(dash) ? JSON.parse(readFileSync(dash, 'utf8')).states.filter((st) => st.shell) : [];
    for (const st of shell) if (!steps.some((s) => s.name === st.name)) steps.push(st);
    for (const st of explShell) if (!steps.some((s) => s.name === st.name)) steps.push({
      name: st.name, path: st.path,
      note: `the shell, found by harness/explore.mjs on the dashboard: ${st.action} “${st.label}” opens a ${st.kind}`,
      do: async (p) => {
        /* the path was recorded on the dashboard; on another page what comes
           before the header or the rail can differ (the phone layout's app
           banner is on the dashboard only), so it is re-anchored at them */
        let loc = p.locator(st.path).first();
        if (!(await loc.count())) {
          const m = st.path.match(/^(.*)> (header|aside):nth-child\(\d+\)( > .*)?$/);
          if (m) loc = p.locator(`${m[2] === 'header' ? 'header.ant-layout-header' : 'aside.ant-layout-sider'}${m[3] || ''}`).first();
        }
        await loc.scrollIntoViewIfNeeded({ timeout: 5000 });
        if (st.action === 'hover') await loc.hover({ force: true, timeout: 5000 });
        /* a phone is tapped: a click leaves the pointer over the control, and the
             product's :hover then shows in the shot but not in the copy */
          else if (MOBILE) await loc.tap({ force: true, timeout: 5000, noWaitAfter: true });
          else await loc.click({ force: true, timeout: 5000, noWaitAfter: true });
        await p.waitForTimeout(900);
      },
    });
  }
  if (ONLY.length) steps = steps.filter((s) => ONLY.includes(s.name));

  /* the base page, with every trigger that opens a state marked as a link
     to that state's page — the compiled site is a clickable prototype */
  /* who links to whom: the page to its states; a state to the page's other
     states and to what it leads to one level down; a nested state to its
     siblings — and back, on Escape, ✕, Cancel or the mask, to where it was
     opened from. A mode state (the page as another account, loading, empty…)
     is a page of its own and links nowhere but back. */
  const top = steps.filter((s) => !s.parent && !s.mode);
  const linksFrom = (from) => {
    const rel = (s) => (from ? `${slug}--${s.name}.html` : `states/${slug}--${s.name}.html`);
    const kids = from ? steps.filter((s) => s.parent === from.name) : [];
    const peers = !from ? top : from.parent ? steps.filter((s) => s.parent === from.parent && s !== from) : top.filter((s) => s !== from);
    return { links: [...kids, ...peers].filter((s) => s.path).map((s) => [s.path, rel(s)]), triggers: peers.filter((s) => s.trigger).map((s) => [s.trigger, rel(s)]) };
  };
  if (!ONLY.length) {
    const { links, triggers } = linksFrom(null);
    await MARK(page, links, triggers);
    await snap(page, slug, { page: slug, state: null, hold });
  }

  if (steps.length) {
    for (const step of steps) {
      try {
        M.v = step.mode || null;
        /* a state that failed half-way can leave its flag behind (the
           congratulations modal would then open over every later state):
           each state starts from none */
        await page.evaluate(() => { for (const k of Object.keys(sessionStorage)) if (k.startsWith('pf-harness-')) sessionStorage.removeItem(k); }).catch(() => {});
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 });
        /* a public route (/content/process-payment) has no shell to wait for */
        try { await page.waitForSelector('.ant-layout', { timeout: 30_000 }); } catch {}
        if (step.mode !== 'slow' && step.mode !== 'error') await settle(page);
        if (step.do) await step.do(page);
        await page.waitForTimeout(600);
        if (!step.mode) { const { links, triggers } = linksFrom(step); await MARK(page, links, triggers); }
        await snap(page, `${slug}--${step.name}`, { page: slug, state: step.name, note: step.note, shot: step.shot, back: step.parent ? `${slug}--${step.parent}.html` : null, hold });
      } catch (e) {
        console.log(`  FAILED ${slug}--${step.name}: ${String(e).split('\n')[0].slice(0, 110)}`);
        /* a failed state can leave its flag set and a navigation in flight
           (member-area goes to another origin) that would interrupt the next
           state's own: clear the flags while still on the app's origin, then
           leave */
        await page.evaluate(() => { for (const k of Object.keys(sessionStorage)) if (k.startsWith('pf-harness-')) sessionStorage.removeItem(k); }).catch(() => {});
        await page.goto('about:blank', { timeout: 10_000 }).catch(() => {});
      } finally { M.v = null; }
    }
  }
  await ctx.close();
};
const JOBS = Number(arg('--jobs', 3));
const queue = [...want];
await Promise.all(Array.from({ length: Math.min(JOBS, queue.length) }, async () => { while (queue.length) await compilePage(queue.shift()); }));
/* parallel pages finish in any order; naming below must not depend on it */
frozen.sort((a, b) => a.name.localeCompare(b.name));

/* the product components each state rendered — name, defining file, and
   where they appear — for the design system to cut from */
{
  const REG = join(ROOT, 'data', 'ds', 'components.json');
  mkdirSync(dirname(REG), { recursive: true });
  const reg = existsSync(REG) ? JSON.parse(readFileSync(REG, 'utf8')) : {};
  for (const f of frozen) for (const [key, c] of Object.entries(f.raw.components || {})) {
    const e = (reg[key] ||= { name: c.name, def: c.def, in: {} });
    e.in[dataName(f.name)] = c.n;
  }
  writeFileSync(REG, JSON.stringify(reg, null, 1));
}

/* ── 2 · names: every styled component after the JSX tag that made it ─── */
const srcLines = new Map();
const lineOf = (file, n) => {
  if (!srcLines.has(file)) {
    const p = join(REPO, file);
    srcLines.set(file, existsSync(p) ? readFileSync(p, 'utf8').split('\n') : []);
  }
  return srcLines.get(file)[n - 1] || '';
};
const kebab = (s) => s.replace(/\./g, '-').replace(/([a-z0-9])([A-Z])/g, '$1-$2').replace(/([A-Z])([A-Z][a-z])/g, '$1-$2').toLowerCase();
const tagAt = (src) => {
  if (!src) return null;
  const [file, line, col] = src.split(':');
  const text = lineOf(file, Number(line));
  const at = text.slice(Math.max(0, Number(col) - 1)).match(/^<([A-Za-z_$][\w$.]*)/);
  const any = text.match(/<([A-Z][\w$.]*)/);
  return (at && at[1]) || (any && any[1]) || null;
};

const sc = {};                                        /* componentId → { src, dn } */
const variants = {};                                  /* componentId → [generated…] in first-seen order */
const antdNames = new Set();
for (const f of frozen) {
  Object.assign(sc, Object.fromEntries(Object.entries(f.raw.sc).filter(([k]) => !sc[k])));
  for (const [gen, id] of Object.entries(f.raw.generated)) {
    (variants[id] ||= []);
    if (!variants[id].includes(gen)) variants[id].push(gen);
  }
  for (const m of f.raw.html.matchAll(/\bant-[\w-]+/g)) antdNames.add('pf-' + m[0].slice(4));
}

/* NAMES ARE STABLE ACROSS RUNS. data/compile-names.json remembers, per
   component (keyed by where the product declares it — file:line:col, which
   survives a rebuild where the styled-components id may not) the name it was
   given and, per variant (keyed by the generated class, a hash of the CSS),
   its suffix. Compiling one page alone must not rename a component another
   page already uses. */
const REGISTRY = join(ROOT, 'data', 'compile-names.json');
/* two runs at once (the web and the responsive layout) must not both hand out
   the same --vN to different CSS: the registry is read, extended and written
   under a lock */
const LOCK = REGISTRY + '.lock';
for (let t = 0; ; t++) {
  try { writeFileSync(LOCK, String(process.pid), { flag: 'wx' }); break; } catch {
    /* a lock older than two minutes belongs to a run that died */
    try { if (Date.now() - statSync(LOCK).mtimeMs > 120_000) { unlinkSync(LOCK); continue; } } catch {}
    if (t > 600) throw new Error(`${LOCK} held for ten minutes — remove it if no compile is running`);
    await new Promise((r) => setTimeout(r, 1000));
  }
}
const registry = existsSync(REGISTRY) ? JSON.parse(readFileSync(REGISTRY, 'utf8')) : { components: {} };
const taken = new Set([...antdNames, ...Object.values(registry.components).map((c) => c.name)]);
const claim = (want) => { let n = want, k = 2; while (taken.has(n)) n = `${want}-${k++}`; taken.add(n); return n; };

const byName = new Map();
for (const [id, info] of Object.entries(sc)) {
  const tag = tagAt(info.src);
  info.base = tag ? kebab(tag) : null;
  info.stem = info.src ? kebab(basename(info.src.split(':')[0]).replace(/\.\w+$/, '')) : 'sc';
  info.key = info.src || id;
  const key = info.base || `${info.stem}-${id.replace(/^sc-/, '').toLowerCase()}`;
  (byName.get(key) || byName.set(key, []).get(key)).push(id);
}
const rename = new Map();                             /* old class → new class, or null to drop */
const referenced = new Set();
for (const f of frozen) for (const c of f.raw.css) for (const m of c.text.matchAll(/\.(sc-[\w-]+)/g)) referenced.add(m[1]);
for (const [key, ids] of byName) {
  for (const id of ids) {
    const info = sc[id];
    let entry = registry.components[info.key];
    if (!entry) {
      /* one component per name keeps the short name; a name shared by two
         components, or one that collides with antd's vocabulary, takes the
         file it lives in as well — Wrapper is everywhere */
      const plain = `pf-${key}`;
      const shared = ids.length > 1 || Object.values(registry.components).some((c) => c.base === key);
      entry = registry.components[info.key] = { name: claim(!shared && !antdNames.has(plain) ? plain : `pf-${info.stem}-${key}`), base: key, variants: [] };
    }
    info.name = entry.name;
    /* The componentId is NOT renamed to the component's name. It sits on
       every variant, so giving it the name variant 1 paints with made variant
       1's rules — a column Flex — land on every variant, row ones included.
       It is dropped, unless some rule selects it (styled-components'
       `${Other}:hover &`), in which case it keeps a name of its own. */
    rename.set(id, referenced.has(id) ? `${entry.name}--c` : null);
    for (const g of variants[id] || []) if (!entry.variants.includes(g)) entry.variants.push(g);
    entry.variants.forEach((g, i) => rename.set(g, i === 0 ? entry.name : `${entry.name}--v${i + 1}`));
  }
}
writeFileSync(REGISTRY, JSON.stringify(registry, null, 1));
unlinkSync(LOCK);

/* ── 3 · rewrite and write ─────────────────────────────────────────────── */
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const keys = [...rename.keys()].filter((k) => rename.get(k)).sort((a, b) => b.length - a.length);
const scRe = keys.length ? new RegExp(`\\.(${keys.map(escapeRe).join('|')})(?![\\w-])`, 'g') : null;
const rewriteCss = (css) => {
  let out = css
    /* a pseudo-class also matches the element freeze.js marked with it */
    .replace(/(?<!:)(?<!::[\w-]+):(hover|focus-visible|focus-within|focus|active)(?![\w-])/g, ':is(:$1,[data-pf-$1])')   /* not after a pseudo-element: ::x:is() is invalid, and one invalid selector drops the whole rule */
    .replace(/css-dev-only-do-not-override-[\w]+/g, 'pf-theme')
    .replace(/--ant-/g, '--pf-')
    .replace(/(?<![\w-])ant-(?=[\w])/g, 'pf-');
  if (scRe) out = out.replace(scRe, (m, k) => '.' + rename.get(k));
  return out;
};
const rewriteClass = (list) => {
  const out = [];
  for (const c of list.split(/\s+/).filter(Boolean)) {
    let n = c;
    if (/^css-dev-only-do-not-override-/.test(c)) n = 'pf-theme';
    else if (c.startsWith('ant-')) n = 'pf-' + c.slice(4);
    else if (rename.has(c)) n = rename.get(c);
    if (n && !out.includes(n)) out.push(n);
  }
  return out.join(' ');
};
const linkFor = (path, fromStates) => {
  const slug = Object.keys(PAGES).find((s) => PAGES[s] === path.replace(/^\/(en|ar)/, '').replace(/\/$/, ''));
  if (!slug) return null;
  return (fromStates ? '../' : '') + `${slug}.html`;
};
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

mkdirSync(STATES_DIR, { recursive: true });
const written = [];
for (const f of frozen) {
  const inStates = !!f.state;
  const { raw } = f;
  let body = raw.html
    .replace(/ class="([^"]*)"/g, (m, v) => ` class="${rewriteClass(v)}"`)
    .replace(/ style="([^"]*)"/g, (m, v) => ` style="${v.replace(/--ant-/g, '--pf-')}"`)
    .replace(/ href="(\/[^"#?]*)"/g, (m, p) => { const l = linkFor(p, inStates); return l ? ` href="${l}"` : m; });
  const fonts = raw.unreadable.some((h) => /fonts\.googleapis\.com/.test(h || '')) ? `/* Figtree — the faces the harness serves for fonts.googleapis.com */\n${FONTS_CSS}\n` : '';
  const css = fonts + raw.css.map((c) => rewriteCss(c.text)).join('\n');
  const head = [
    '<meta charset="utf-8">',
    `<meta name="viewport" content="${esc(VIEWPORT)}">`,
    `<title>${esc(raw.title || f.page)}${f.state ? ` — ${esc(f.state)}` : ''}</title>`,
    `<meta name="pf-compiled" content="${esc(`${PAGES[f.page]}${f.state ? ` · state ${f.state}` : ''} · profolio-reactjs · fixture account · ${new Date().toISOString().slice(0, 10)}`)}">`,
    f.note ? `<meta name="pf-state-note" content="${esc(f.note)}">` : '',
    /* how this file was verified: a whole-page shot, or the viewport at the
       scroll position the state was frozen at (an open overlay is fixed to the
       viewport) — every later check renders it the same way */
    `<meta name="pf-shot" content="${f.shotFull ? 'full' : 'viewport'}" data-scroll="${raw.scroll.x},${raw.scroll.y}">`,
    `<meta name="pf-device" content="${DEVICE}">`,
    `<style>\n${css}\n</style>`,
  ].filter(Boolean).join('\n');
  body = body.replace(/<head>[\s\S]*?<\/head>/, `<head>\n${head}\n</head>`);
  if (raw.scroll.x || raw.scroll.y) body = body.replace(/<\/body>/, `<script>scrollTo(${raw.scroll.x},${raw.scroll.y})</script></body>`);
  /* inner scroll positions (freeze.js data-pf-scroll), put back on load —
     and again once the fonts are in: before them the text above reflows, and
     the browser's scroll anchoring moves the box to keep what it showed */
  if (/data-pf-scroll=/.test(body)) body = body.replace(/<\/body>/, `<script>(function(){function s(){document.querySelectorAll('[data-pf-scroll]').forEach(function(e){var p=e.getAttribute('data-pf-scroll').split(',');e.scrollLeft=+p[0];e.scrollTop=+p[1]})}s();addEventListener('load',s);if(document.fonts&&document.fonts.ready)document.fonts.ready.then(s)})()</script></body>`);
  /* prototype wiring: a trigger opens its state (data-pf-go, marked before
     the freeze); a state goes back to where it was opened from — its page,
     or for a state one level down its parent state — on Escape, a click on
     the mask behind an overlay, the overlay's ✕, or a button that says
     Cancel / Close / Back */
  const back = f.back || `../${f.page}.html`;
  const GO = `var t=e.target.closest('[data-pf-go]');if(t){e.preventDefault();e.stopPropagation();location.href=t.getAttribute('data-pf-go');return}`;
  const BACK = `if(e.target.matches('.pf-modal-wrap,.pf-drawer-mask,.pf-modal-mask,.pf-tour-mask')){location.href='${back}';return}`
    + `var c=e.target.closest('.pf-modal-close,.pf-drawer-close,.pf-tour-close,.pf-message-notice-close,.pf-notification-notice-close,[aria-label="Close"],[aria-label="close"]');if(c){e.preventDefault();e.stopPropagation();location.href='${back}';return}`
    + `var b=e.target.closest('button,a,[role=button]');if(b&&/^(cancel|close|back|dismiss|not now|skip|later|no|\\u0625\\u0644\\u063a\\u0627\\u0621|\\u0625\\u063a\\u0644\\u0627\\u0642|\\u0631\\u062c\\u0648\\u0639)$/i.test((b.innerText||'').trim())){e.preventDefault();e.stopPropagation();location.href='${back}'}`;
  const nav = f.state
    ? `<script>addEventListener('keydown',function(e){if(e.key==='Escape')location.href='${back}'});addEventListener('click',function(e){${GO}${BACK}},true)</script>`
    : /data-pf-go=/.test(body) ? `<script>addEventListener('click',function(e){${GO}},true)</script>` : '';
  if (nav) body = body.replace(/<\/body>/, `${nav}</body>`);
  /* page-to-page navigation — the rail, the header, every link the explorer
     saw change the URL — is resolved at click time by one shared script
     (scripts/ds/prototype.mjs writes it), so a page never needs recompiling
     when another page is added */
  if (needsRestore(body)) body = body.replace(/<\/body>/, `<script>${NESTED_A}</script></body>`);
  body = body.replace(/<\/body>/, `<script src="${UP(inStates)}prototype.js"></script></body>`);
  const out = inStates ? join(STATES_DIR, `${f.name}.html`) : join(DELIV, `${f.name}.html`);
  writeFileSync(out, body);
  /* the page's own rules, kept: scripts/ds/stylesheet.mjs merges every
     page's list into the one stylesheet and re-links the page to it, after
     which the page no longer carries them */
  mkdirSync(join(ROOT, 'data', 'ds', 'page-css'), { recursive: true });
  writeFileSync(join(ROOT, 'data', 'ds', 'page-css', `${dataName(f.name)}.css`), css);
  written.push({ ...f, out, bytes: body.length });
}

/* ── 4 · render what was written, and hold it to the product ──────────── */
const crop = (png, w, h) => { const o = Buffer.alloc(w * h * 4); for (let y = 0; y < h; y++) png.data.copy(o, y * w * 4, y * png.width * 4, y * png.width * 4 + w * 4); return o; };
const rows = [];
const ctx = await browser.newContext(DEVICES[DEVICE]);
mkdirSync(join(ROOT, 'data', 'ours'), { recursive: true });
for (const w of written) {
  const p = await ctx.newPage();
  await p.route('**/*', (r) => (/^(file|data):/.test(r.request().url()) ? r.continue() : r.abort()));
  await p.goto('file://' + w.out, { waitUntil: 'load' });
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(400);
  await p.evaluate(({ x, y }) => scrollTo(x, y), w.raw.scroll);
  const oursPng = join(ROOT, 'data', 'ours', `${dataName(w.name)}.png`);
  await p.screenshot({ path: oursPng, fullPage: w.shotFull, animations: 'disabled' });
  const cap = await p.evaluate(CAPTURE);
  cap.source = 'compiled';
  writeFileSync(join(ROOT, 'data', 'ours', `${dataName(w.name)}.capture.json`), JSON.stringify(cap));
  await p.close();

  const a = PNG.sync.read(readFileSync(join(ROOT, 'data', 'live', `${dataName(w.name)}.png`)));
  const b = PNG.sync.read(readFileSync(oursPng));
  const W = Math.min(a.width, b.width), H = Math.min(a.height, b.height);
  const diff = new PNG({ width: W, height: H });
  const n = pixelmatch(crop(a, W, H), crop(b, W, H), diff.data, W, H, { threshold: 0.1, includeAA: false, alpha: 0.15, diffColor: [229, 57, 53] });
  mkdirSync(join(ROOT, 'data', 'qa', 'pixels'), { recursive: true });
  writeFileSync(join(ROOT, 'data', 'qa', 'pixels', `${dataName(w.name)}.diff.png`), PNG.sync.write(diff));
  const all = Math.max(a.width, b.width) * Math.max(a.height, b.height);
  const pct = ((n + all - W * H) / all) * 100;
  rows.push({ name: dataName(w.name), device: DEVICE, file: w.out.slice(ROOT.length + 1), kb: Math.round(w.bytes / 1024), heights: [a.height, b.height], pct: +pct.toFixed(3) });
}
await browser.close();
if (!process.env.KEEP_SERVER) await app.stop();

console.log(`\n  compiled                                         size    live h   ours h   PIXEL DIFF (bar ≤${BAR}%)`);
for (const r of rows) console.log(`  ${r.name.padEnd(46)} ${String(r.kb).padStart(5)} KB  ${String(r.heights[0]).padStart(6)}   ${String(r.heights[1]).padStart(6)}   ${(r.pct.toFixed(3) + '%').padStart(8)}  ${r.pct <= BAR ? 'ok' : 'OVER'}`);
const over = rows.filter((r) => r.pct > BAR);
console.log(`\n  ${rows.length - over.length} of ${rows.length} within the bar${over.length ? ` · over: ${over.map((r) => r.name).join(', ')}` : ''}\n`);
const ledger = join(ROOT, 'data', 'qa', 'compile.json');
const prev = existsSync(ledger) ? JSON.parse(readFileSync(ledger, 'utf8')).rows || [] : [];
/* a row whose file is gone (a state renamed or no longer found) goes too */
const merged = [...prev.filter((r) => !rows.some((x) => x.name === r.name)), ...rows].filter((r) => !r.file || existsSync(join(ROOT, r.file))).sort((a, b) => a.name.localeCompare(b.name));
writeFileSync(ledger, JSON.stringify({ at: new Date().toISOString(), bar: BAR, rows: merged }, null, 2));
if (over.length && flag('--strict')) process.exit(1);
