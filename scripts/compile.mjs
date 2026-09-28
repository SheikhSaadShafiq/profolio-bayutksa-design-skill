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
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import { serve, REPO } from '../harness/serve.mjs';
import { openPage, settle, FONTS_CSS } from '../harness/page.mjs';

const { chromium } = pkg;
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DELIV = join(ROOT, 'deliverables');
const STATES_DIR = join(DELIV, 'states');
const arg = (n, d) => { const i = process.argv.indexOf(n); return i > -1 ? process.argv[i + 1] : d; };
const flag = (n) => process.argv.includes(n);

import { PAGES } from './pages-list.mjs';
const want = arg('--pages') ? arg('--pages').split(',').map((s) => s.trim()) : Object.keys(PAGES);
const unknown = want.filter((p) => !PAGES[p]);
if (unknown.length) { console.error(`  unknown page(s): ${unknown.join(', ')}\n  known: ${Object.keys(PAGES).join(' ')}`); process.exit(2); }
const ONLY = (arg('--only') || '').split(',').map((s) => s.trim()).filter(Boolean);
/* the agreed bar: at most 0.5% of the pixels differ */
const BAR = 0.5;

const FREEZE = readFileSync(join(ROOT, 'harness', 'freeze.js'), 'utf8');
const CAPTURE = readFileSync(join(ROOT, 'tools', 'profolio-capture', 'capture.js'), 'utf8');

/* ── 1 · freeze every page and state from the product ─────────────────── */
const app = await serve();
const browser = await chromium.launch();
const frozen = [];                                   /* { name, page, state, note, raw } */

const snap = async (page, name, meta) => {
  const raw = await page.evaluate(FREEZE);
  const shotFull = !raw.overlay.modal && !raw.overlay.drawer && !raw.overlay.popover;
  mkdirSync(join(ROOT, 'data', 'live'), { recursive: true });
  const cap = await page.evaluate(CAPTURE);
  cap.source = 'harness'; cap.locale = 'en'; cap.state = name;
  writeFileSync(join(ROOT, 'data', 'live', `${name}.capture.json`), JSON.stringify(cap));
  await page.screenshot({ path: join(ROOT, 'data', 'live', `${name}.png`), fullPage: shotFull });
  frozen.push({ name, ...meta, raw, shotFull });
  console.log(`  froze ${name.padEnd(46)} ${String(raw.css.length).padStart(4)} sheets  ${(raw.html.length / 1024).toFixed(0).padStart(5)} KB dom`);
};

/* one page, all its states, in its own browser context — pages run in
   parallel (--jobs, default 3), so the answer-set MODE is the page's own */
const compilePage = async (slug) => {
  const M = { v: null };
  const url = `${app.url}/en${PAGES[slug]}`;
  const { page, ctx } = await openPage(browser, app.url, { mode: () => M.v });
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  try { await page.waitForSelector('.ant-layout', { timeout: 30_000 }); } catch {}
  await settle(page);
  /* the states: the hand-written ones (harness/interactions/<page>.mjs), then
     the ones harness/explore.mjs found by trying every handler on the page
     (data/states/<page>.json) under names the hand-written list does not use */
  const file = join(ROOT, 'harness', 'interactions', `${slug}.mjs`);
  let steps = flag('--states') && existsSync(file) ? (await import(file)).default : [];
  const explored = join(ROOT, 'data', 'states', `${slug}.json`);
  if (flag('--states') && existsSync(explored)) {
    for (const st of JSON.parse(readFileSync(explored, 'utf8')).states) {
      if (steps.some((s) => s.name === st.name)) continue;
      steps.push({
        name: st.name, path: st.path,
        note: `found by harness/explore.mjs: ${st.action} “${st.label}” opens ${st.kind === 'inline' ? 'a change in place' : `a ${st.kind}`}`,
        do: async (p) => {
          const loc = p.locator(st.path).first();
          await loc.scrollIntoViewIfNeeded({ timeout: 5000 });
          if (st.action === 'hover') await loc.hover({ force: true, timeout: 5000 });
          else await loc.click({ force: true, timeout: 5000, noWaitAfter: true });
          await p.waitForTimeout(900);
        },
      });
    }
  }
  if (ONLY.length) steps = steps.filter((s) => ONLY.includes(s.name));

  /* the base page, with every trigger that opens a state marked as a link
     to that state's page — the compiled site is a clickable prototype */
  if (!ONLY.length) {
    await page.evaluate((links) => { for (const [path, href] of links) { const el = document.querySelector(path); if (el) el.setAttribute('data-pf-go', href); } },
      steps.filter((s) => s.path).map((s) => [s.path, `states/${slug}--${s.name}.html`]));
    await snap(page, slug, { page: slug, state: null });
  }

  if (steps.length) {
    for (const step of steps) {
      try {
        M.v = step.mode || null;
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 });
        await page.waitForSelector('.ant-layout', { timeout: 30_000 });
        if (step.mode !== 'slow' && step.mode !== 'error') await settle(page);
        if (step.do) await step.do(page);
        await page.waitForTimeout(600);
        await snap(page, `${slug}--${step.name}`, { page: slug, state: step.name, note: step.note });
      } catch (e) {
        console.log(`  FAILED ${slug}--${step.name}: ${String(e).split('\n')[0].slice(0, 110)}`);
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
    e.in[f.name] = c.n;
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

/* ── 3 · rewrite and write ─────────────────────────────────────────────── */
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const keys = [...rename.keys()].filter((k) => rename.get(k)).sort((a, b) => b.length - a.length);
const scRe = keys.length ? new RegExp(`\\.(${keys.map(escapeRe).join('|')})(?![\\w-])`, 'g') : null;
const rewriteCss = (css) => {
  let out = css
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
    '<meta name="viewport" content="width=device-width,initial-scale=1">',
    `<title>${esc(raw.title || f.page)}${f.state ? ` — ${esc(f.state)}` : ''}</title>`,
    `<meta name="pf-compiled" content="${esc(`${PAGES[f.page]}${f.state ? ` · state ${f.state}` : ''} · profolio-reactjs · fixture account · ${new Date().toISOString().slice(0, 10)}`)}">`,
    f.note ? `<meta name="pf-state-note" content="${esc(f.note)}">` : '',
    /* how this file was verified: a whole-page shot, or the viewport at the
       scroll position the state was frozen at (an open overlay is fixed to the
       viewport) — every later check renders it the same way */
    `<meta name="pf-shot" content="${f.shotFull ? 'full' : 'viewport'}" data-scroll="${raw.scroll.x},${raw.scroll.y}">`,
    `<style>\n${css}\n</style>`,
  ].filter(Boolean).join('\n');
  body = body.replace(/<head>[\s\S]*?<\/head>/, `<head>\n${head}\n</head>`);
  if (raw.scroll.x || raw.scroll.y) body = body.replace(/<\/body>/, `<script>scrollTo(${raw.scroll.x},${raw.scroll.y})</script></body>`);
  /* inner scroll positions (freeze.js data-pf-scroll), put back on load */
  if (/data-pf-scroll=/.test(body)) body = body.replace(/<\/body>/, `<script>document.querySelectorAll('[data-pf-scroll]').forEach(function(e){var p=e.getAttribute('data-pf-scroll').split(',');e.scrollLeft=+p[0];e.scrollTop=+p[1]})</script></body>`);
  /* prototype wiring: a base page's triggers open their states; a state goes
     back to its page on Escape or a click on the mask behind an overlay */
  const nav = f.state
    ? `<script>addEventListener('keydown',function(e){if(e.key==='Escape')location.href='../${f.page}.html'});addEventListener('click',function(e){if(e.target.matches('.pf-modal-wrap,.pf-drawer-mask,.pf-modal-mask,.pf-tour-mask'))location.href='../${f.page}.html'},true)</script>`
    : /data-pf-go=/.test(body) ? `<script>addEventListener('click',function(e){var t=e.target.closest('[data-pf-go]');if(t){e.preventDefault();e.stopPropagation();location.href=t.getAttribute('data-pf-go')}},true)</script>` : '';
  if (nav) body = body.replace(/<\/body>/, `${nav}</body>`);
  const out = inStates ? join(STATES_DIR, `${f.name}.html`) : join(DELIV, `${f.name}.html`);
  writeFileSync(out, body);
  /* the page's own rules, kept: scripts/ds/stylesheet.mjs merges every
     page's list into the one stylesheet and re-links the page to it, after
     which the page no longer carries them */
  mkdirSync(join(ROOT, 'data', 'ds', 'page-css'), { recursive: true });
  writeFileSync(join(ROOT, 'data', 'ds', 'page-css', `${f.name}.css`), css);
  written.push({ ...f, out, bytes: body.length });
}

/* ── 4 · render what was written, and hold it to the product ──────────── */
const crop = (png, w, h) => { const o = Buffer.alloc(w * h * 4); for (let y = 0; y < h; y++) png.data.copy(o, y * w * 4, y * png.width * 4, y * png.width * 4 + w * 4); return o; };
const rows = [];
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
mkdirSync(join(ROOT, 'data', 'ours'), { recursive: true });
for (const w of written) {
  const p = await ctx.newPage();
  await p.route('**/*', (r) => (/^(file|data):/.test(r.request().url()) ? r.continue() : r.abort()));
  await p.goto('file://' + w.out, { waitUntil: 'load' });
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(400);
  await p.evaluate(({ x, y }) => scrollTo(x, y), w.raw.scroll);
  const oursPng = join(ROOT, 'data', 'ours', `${w.name}.png`);
  await p.screenshot({ path: oursPng, fullPage: w.shotFull });
  const cap = await p.evaluate(CAPTURE);
  cap.source = 'compiled';
  writeFileSync(join(ROOT, 'data', 'ours', `${w.name}.capture.json`), JSON.stringify(cap));
  await p.close();

  const a = PNG.sync.read(readFileSync(join(ROOT, 'data', 'live', `${w.name}.png`)));
  const b = PNG.sync.read(readFileSync(oursPng));
  const W = Math.min(a.width, b.width), H = Math.min(a.height, b.height);
  const diff = new PNG({ width: W, height: H });
  const n = pixelmatch(crop(a, W, H), crop(b, W, H), diff.data, W, H, { threshold: 0.1, includeAA: false, alpha: 0.15, diffColor: [229, 57, 53] });
  mkdirSync(join(ROOT, 'data', 'qa', 'pixels'), { recursive: true });
  writeFileSync(join(ROOT, 'data', 'qa', 'pixels', `${w.name}.diff.png`), PNG.sync.write(diff));
  const all = Math.max(a.width, b.width) * Math.max(a.height, b.height);
  const pct = ((n + all - W * H) / all) * 100;
  rows.push({ name: w.name, file: w.out.slice(ROOT.length + 1), kb: Math.round(w.bytes / 1024), heights: [a.height, b.height], pct: +pct.toFixed(3) });
}
await browser.close();
if (!process.env.KEEP_SERVER) await app.stop();

console.log(`\n  compiled                                         size    live h   ours h   PIXEL DIFF (bar ≤${BAR}%)`);
for (const r of rows) console.log(`  ${r.name.padEnd(46)} ${String(r.kb).padStart(5)} KB  ${String(r.heights[0]).padStart(6)}   ${String(r.heights[1]).padStart(6)}   ${(r.pct.toFixed(3) + '%').padStart(8)}  ${r.pct <= BAR ? 'ok' : 'OVER'}`);
const over = rows.filter((r) => r.pct > BAR);
console.log(`\n  ${rows.length - over.length} of ${rows.length} within the bar${over.length ? ` · over: ${over.map((r) => r.name).join(', ')}` : ''}\n`);
const ledger = join(ROOT, 'data', 'qa', 'compile.json');
const prev = existsSync(ledger) ? JSON.parse(readFileSync(ledger, 'utf8')).rows || [] : [];
const merged = [...prev.filter((r) => !rows.some((x) => x.name === r.name)), ...rows].sort((a, b) => a.name.localeCompare(b.name));
writeFileSync(ledger, JSON.stringify({ at: new Date().toISOString(), bar: BAR, rows: merged }, null, 2));
if (over.length && flag('--strict')) process.exit(1);
