#!/usr/bin/env node
/**
 * Build a design's prototype and hold it to the Design QA — the one command before anything is
 * delivered. Run from the skill's folder:
 *
 *   node qa/prototype.mjs designs/<feature>              the hi-fi prototype: designs/<feature>/prototype.html
 *   node qa/prototype.mjs designs/<feature> --wireframe  the wireframe:       designs/<feature>/wireframe.html
 *
 * designs/<feature>/flow.json says what the prototype holds — its screens (web and phone
 * files), its named states, the scenario controls and the state matrix (kit/README.md). It
 * writes ONE self-contained HTML file:
 *   - every screen and state;
 *   - the stylesheets and fonts;
 *   - the compiled product pages the rail opens, and the shell's own states (notifications,
 *     account, Post a Listing, the expanded rail);
 *   - kit/runtime.js, which makes it work, and the player around it.
 * Share that file, or publish it as an artifact.
 *
 * Then it checks, in this order:
 *   1 static   flow.json, coverage (every state on every platform), the state matrix
 *              (default, loading, empty, error, no-results for a filtered list), every list's
 *              empty handling, actions, overlays, pages, the riyal, tokens (var() defined)
 *   2 system   qa/validate.py checks 1–3 on the hi-fi screens
 *   3 visual   every state, web and phone, rendered in a headless browser (qa/browser.mjs)
 *              and measured by kit/qa.js: column alignment, squashed or uneven buttons,
 *              overlap, clipped text, fonts, dead controls, the skeleton against its columns …
 *              An issue its compiled source page already has is the product's, and is listed
 *              apart, not counted.
 * The result is written into the prototype (a red "not ready to share" bar while it fails)
 * and to designs/<feature>/qa/report.md.
 *
 *   --no-qa        build only (a draft: the prototype says QA was not run)
 *   --shots        save a PNG of every state and platform to designs/<feature>/qa/shots/, to look at
 *   --pages all|linked|none   the product pages bundled for the rail (default: flow.json "pages", else all)
 *   --no-install   never npm-install a browser
 *
 * Exit status: 0 QA passed · 1 QA found errors · 3 built, but no browser here, so the visual QA
 * did not run — say so when you deliver · 2 a usage or setup error.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, statSync } from 'node:fs';
import { join, dirname, resolve, relative, basename, posix } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { gzipSync } from 'node:zlib';
import { execFileSync, spawnSync } from 'node:child_process';
import { launch } from './browser.mjs';

const SKILL = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const flag = (n) => argv.includes(n);
const opt = (n, d = null) => { const i = argv.indexOf(n); return i > -1 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : d; };
const target = argv.filter((a, i) => !a.startsWith('--') && !['--pages', '--out'].includes(argv[i - 1]))[0];
const WIRE = flag('--wireframe');
const log = (s = '') => console.log(s);
const die = (s) => { console.error(`  ${s}`); process.exit(2); };
if (!target) die('usage: node qa/prototype.mjs designs/<feature> [--wireframe] [--no-qa] [--shots]');

const DIR = resolve(process.cwd(), target.endsWith('flow.json') ? dirname(target) : target);
const FLOW = join(DIR, 'flow.json');
if (!existsSync(FLOW)) die(`${relative(process.cwd(), FLOW)} is missing — a design's folder holds its flow.json (kit/README.md → flow.json)`);
let flow;
try { flow = JSON.parse(readFileSync(FLOW, 'utf8')); } catch (e) { die(`flow.json is not valid JSON: ${e.message}`); }
const OUT = resolve(DIR, opt('--out', WIRE ? 'wireframe.html' : 'prototype.html'));
const REPORT = join(DIR, 'qa');
const read = (p) => readFileSync(p, 'utf8');
const posixRel = (p) => relative(SKILL, p).split('\\').join('/');
const inSkill = (p) => !relative(SKILL, p).startsWith('..');
const bundlePath = (abs) => (inSkill(abs) ? posixRel(abs) : 'designs/' + basename(DIR) + '/' + relative(DIR, abs).split('\\').join('/'));

const errors = [], warns = [];
const E = (check, msg) => errors.push({ level: 'error', check, message: msg });
const W = (check, msg) => warns.push({ level: 'warn', check, message: msg });

/* ── 1 · flow.json ───────────────────────────────────────────────────── */
const PLATFORMS = (flow.platforms || ['web']).map((p) => (p === '375' || p === 'mobile' ? 'phone' : p));
if (!PLATFORMS.every((p) => p === 'web' || p === 'phone')) E('flow', `platforms must be "web" and/or "phone" — got ${JSON.stringify(flow.platforms)}`);
const screens = flow.screens || [];
if (!screens.length) E('flow', 'flow.json has no screens');
const states = flow.states || [];
if (!states.length) E('flow', 'flow.json has no states');
const stateIds = new Set();
for (const s of states) { if (!s.id) E('flow', 'a state has no id'); else if (stateIds.has(s.id)) E('flow', `two states are called "${s.id}"`); stateIds.add(s.id); }
const screenIds = new Set(screens.map((s) => s.id));
for (const s of states) if (s.screen && !screenIds.has(s.screen)) E('flow', `state "${s.id}" names screen "${s.screen}", which flow.json does not list`);
if (flow.start && !stateIds.has(flow.start)) E('flow', `start "${flow.start}" is no state`);
for (const c of flow.controls || []) if (!c.key || !Array.isArray(c.options) || !c.options.every((o) => Array.isArray(o) && o.length === 2)) E('flow', `control ${JSON.stringify(c.key || c)}: needs a key and options as [value, "label"] pairs`);

/* ── 2 · the files ───────────────────────────────────────────────────── */
const fileOf = (s, p) => (WIRE ? (s.wireframe || {})[p] : s[p] || (p === 'phone' ? s.mobile : null));
const screenFiles = [];
for (const s of screens) for (const p of PLATFORMS) {
  const f = fileOf(s, p);
  if (!f) { E('coverage', `screen "${s.id}" has no ${p} ${WIRE ? 'wireframe' : 'file'} — flow.json screens[].${WIRE ? 'wireframe.' : ''}${p}`); continue; }
  const abs = resolve(DIR, f);
  if (!existsSync(abs)) { E('coverage', `screen "${s.id}" (${p}): ${relative(process.cwd(), abs)} does not exist`); continue; }
  screenFiles.push({ screen: s, platform: p, abs, html: inlineJson(abs, read(abs)) });
}

/* <script type="application/json" id="pf-data" data-src="data.json"></script>: the file's JSON,
   inlined — the wireframe and the hi-fi, web and phone, share one data file */
function inlineJson(abs, html) {
  return html.replace(/<script\b([^>]*\bdata-src="([^"]+)"[^>]*)>[\s\S]*?<\/script>/gi, (all, a, src) => {
    if (!/application\/json/i.test(a)) return all;
    const f = resolve(dirname(abs), src);
    if (!existsSync(f)) { E('json', `${relative(SKILL, abs)}: data-src="${src}" is not found`); return all; }
    return `<script${a.replace(/\sdata-src="[^"]*"/, '')}>${read(f).replace(/<\//g, '<\\/')}</script>`;
  });
}
const meta = (html, name) => { const m = html.match(new RegExp(`<meta\\s+name="${name}"\\s+content="([^"]*)"`, 'i')); return m ? m[1] : ''; };
const sourcesOf = (html) => [meta(html, 'pf-base'), ...meta(html, 'pf-also').split(',')].map((x) => x.trim()).filter(Boolean);
/* a link or a data-pf-go, from where it was written: the file itself, its pf-base, or the skill's root */
function resolveFrom(fromAbs, fromHtml, ref, { phone = false } = {}) {
  if (!ref || /^(https?:|data:|#|mailto:|tel:)/.test(ref)) return null;
  ref = ref.split(/[?#]/)[0];
  const cands = [];
  const m = ref.match(/^states\/([\w-]+)--([\w.-]+?)(\.mobile)?\.html$/);                /* the 2.0 build's shell links */
  if (m) { if (phone) cands.push(join(SKILL, 'pages', m[1], m[2] + '.mobile.html')); cands.push(join(SKILL, 'pages', m[1], m[2] + '.html')); }
  cands.push(resolve(dirname(fromAbs), ref));
  const base = meta(fromHtml, 'pf-base');
  if (base) cands.push(resolve(dirname(join(SKILL, base)), ref));
  const bare = ref.replace(/^(\.\.\/)+/, '');
  cands.push(join(SKILL, bare), join(SKILL, 'pages', bare));
  if (phone && /\.html$/.test(ref) && !/\.mobile\.html$/.test(ref)) cands.unshift(...cands.filter((c) => /\.html$/.test(c) && !/\.mobile\.html$/.test(c)).map((c) => c.replace(/\.html$/, '.mobile.html')));
  return cands.find((c) => existsSync(c) && statSync(c).isFile()) || cands.find((c) => c.startsWith(join(SKILL, 'pages') + '/')) || null;
}

/* fetch what the skill does not carry: compiled pages, states and components come from its GitHub repo */
const REG = JSON.parse(read(join(SKILL, 'registry.json')));
function fetchMissing(paths) {
  const byPage = new Map();
  /* a component a design was made from (pf-also: atoms/icon.html): fetch.py --component <slug> */
  const byFile = new Map(Object.entries(REG.components || {}).map(([slug, c]) => [c.file, slug]));
  const comps = [...new Set(paths.map((p) => byFile.get(posixRel(p))).filter(Boolean))];
  if (comps.length) {
    const r = spawnSync('python3', [join(SKILL, 'qa', 'fetch.py'), '--component', ...comps], { cwd: SKILL, encoding: 'utf8' });
    if (r.status !== 0) W('fetch', `python3 qa/fetch.py --component ${comps.join(' ')} failed: ${(r.stdout + r.stderr).trim().split('\n').slice(-1)[0]}`);
  }
  for (const p of paths) {
    const r = posixRel(p).match(/^pages\/([^/]+?)(?:\/([^/]+?))?(\.mobile)?\.html$/);
    if (!r || !REG.pages[r[1]]) continue;
    const e = byPage.get(r[1]) || { states: new Set(), phone: false };
    if (r[2]) e.states.add(r[2]);
    if (r[3]) e.phone = true;
    byPage.set(r[1], e);
  }
  for (const [page, e] of byPage) {
    const args = [join(SKILL, 'qa', 'fetch.py'), page, ...e.states, ...(e.phone ? ['--375'] : [])];
    const r = spawnSync('python3', args, { cwd: SKILL, encoding: 'utf8' });
    if (r.status === 0) continue;
    /* one name fetch.py refuses fails the whole call: fetch the rest one by one */
    for (const st of e.states) {
      const one = spawnSync('python3', [join(SKILL, 'qa', 'fetch.py'), page, st, ...(e.phone ? ['--375'] : [])], { cwd: SKILL, encoding: 'utf8' });
      if (one.status !== 0) W('fetch', `python3 qa/fetch.py ${page} ${st}${e.phone ? ' --375' : ''} failed: ${(one.stdout + one.stderr).trim().split('\n').slice(-1)[0]}`);
    }
  }
}

/* the tables the product's own navigation uses (pages/prototype.js) */
function navTables() {
  const pj = join(SKILL, 'pages', 'prototype.js');
  if (!existsSync(pj)) spawnSync('python3', [join(SKILL, 'qa', 'fetch.py'), '--css'], { cwd: SKILL, encoding: 'utf8' });
  if (!existsSync(pj)) { W('pages', 'pages/prototype.js is missing (python3 qa/fetch.py --css) — the rail will not open other pages'); return { menu: {}, labels: {}, routes: { web: {}, phone: {} } }; }
  const src = read(pj);
  const obj = (re) => { const m = src.match(re); try { return m ? JSON.parse(m[1]) : {}; } catch { return {}; } };
  const menu = obj(/var MENU = (\{.*?\});/), labels = obj(/var LABELS = (\{.*?\});/);
  const rm = src.match(/var ROUTES = phone \? (\{.*?\}) : (\{.*?\});/);
  let routes = { web: {}, phone: {} };
  try { if (rm) routes = { phone: JSON.parse(rm[1]), web: JSON.parse(rm[2]) }; } catch { /* keep empty */ }
  return { menu, labels, routes };
}

const NAV = navTables();
/* the product pages the rail opens: a prototype carries them all (the whole product); a wireframe none */
const PAGES_MODE = opt('--pages', WIRE ? (flow.wireframePages || 'none') : typeof flow.pages === 'string' ? flow.pages : Array.isArray(flow.pages) ? 'list' : 'all');
const pageEntries = {};
if (PAGES_MODE !== 'none') {
  const wanted = PAGES_MODE === 'list' ? new Set(flow.pages) : null;
  const routes = new Set([...Object.keys(NAV.routes.web || {}), ...Object.keys(NAV.routes.phone || {})]);
  for (const route of routes) {
    const reg = Object.entries(REG.pages).find(([, p]) => p.route === route);
    const id = reg ? reg[0] : route.replace(/^\//, '').replace(/\//g, '-');
    if (wanted && !wanted.has(id) && !wanted.has(route)) continue;
    if (screens.some((s) => s.route === route)) continue;                                     /* the design's own page wins */
    const files = {};
    if (PLATFORMS.includes('web') && NAV.routes.web[route]) files.web = 'pages/' + NAV.routes.web[route];
    if (PLATFORMS.includes('phone') && NAV.routes.phone[route]) files.phone = 'pages/' + NAV.routes.phone[route];
    if (Object.keys(files).length) pageEntries[id] = { id, title: reg ? reg[1].title : id, route, files };
  }
}

/* every file the prototype holds: its screens, the states their clicks open, the rail's pages */
const needed = new Map();          // bundle path → absolute path
const alias = {};                  // a data-pf-go as written → bundle path
const htmlOf = new Map();          // absolute → html
for (const sf of screenFiles) { needed.set(bundlePath(sf.abs), sf.abs); htmlOf.set(sf.abs, sf.html); }
const GO_RE = /\sdata-pf-go="([^"]+\.html)"/g;
const missing = [];
for (const sf of screenFiles) {
  for (const m of sf.html.matchAll(GO_RE)) {
    const abs = resolveFrom(sf.abs, sf.html, m[1], { phone: sf.platform === 'phone' });
    if (!abs) continue;
    if (!existsSync(abs)) missing.push(abs);
    alias[m[1]] = posixRel(abs);
    needed.set(posixRel(abs), abs);
  }
}
for (const e of Object.values(pageEntries)) for (const f of Object.values(e.files)) { const abs = join(SKILL, f); if (!existsSync(abs)) missing.push(abs); needed.set(f, abs); }
/* and the compiled files each screen was made from (pf-base, pf-also): validate.py and the QA's
   baseline hold the screen to them */
for (const sf of screenFiles) for (const src of sourcesOf(sf.html)) { const abs = join(SKILL, src); if (!existsSync(abs)) missing.push(abs); }
if (missing.length) { log(`  fetching ${missing.length} compiled file(s) the prototype opens or was made from…`); fetchMissing(missing); }
for (const [bp, abs] of [...needed]) if (!existsSync(abs)) { needed.delete(bp); if (Object.values(alias).includes(bp)) W('fetch', `${bp} could not be fetched — its click will say it is not part of this prototype`); }
for (const e of Object.values(pageEntries)) for (const [p, f] of Object.entries(e.files)) if (!needed.has(f)) delete e.files[p];
for (const [id, e] of Object.entries(pageEntries)) if (!Object.keys(e.files).length) delete pageEntries[id];

/* ── 3 · static checks on the screens ────────────────────────────────── */
const jsonBlock = (html, id) => {
  const m = html.match(new RegExp(`<script[^>]*type="application/json"[^>]*id="${id}"[^>]*>([\\s\\S]*?)</script>`, 'i')) || html.match(new RegExp(`<script[^>]*id="${id}"[^>]*type="application/json"[^>]*>([\\s\\S]*?)</script>`, 'i'));
  if (!m) return { found: false, value: {} };
  try { return { found: true, value: JSON.parse(m[1]) }; } catch (e) { return { found: true, value: {}, error: e.message }; }
};
const attrs = (html, name) => [...html.matchAll(new RegExp(`\\sdata-pf-${name}="([^"]*)"`, 'g'))].map((m) => m[1].replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&'));
const cssText = new Map();          // bundle path → css
const cssDefs = new Set();
const actionNames = new Set();
function stepsOf(list, where, acts) {
  for (const st of list || []) {
    if (typeof st === 'string') { if (!acts[st] && !/[=]/.test(st)) E('actions', `${where}: step "${st}" is no action in pf-actions`); continue; }
    if (st.do && !acts[st.do]) E('actions', `${where}: "do": "${st.do}" is no action in pf-actions`);
    if (st.go && !stateIds.has(st.go)) E('actions', `${where}: "go": "${st.go}" is no state in flow.json`);
    stepsOf(st.then, where, acts); stepsOf(st.else, where, acts);
  }
}
const LINK_RE = /<link\b[^>]*\brel=["']?stylesheet["']?[^>]*>/gi;
for (const sf of screenFiles) {
  const where = `${sf.screen.id} (${sf.platform})`;
  const h = sf.html;
  for (const l of h.match(LINK_RE) || []) {
    const href = (l.match(/\bhref=["']([^"']+)["']/) || [])[1];
    const abs = href && resolveFrom(sf.abs, h, href);
    if (!abs || !existsSync(abs)) { if (href && !/kit\/kit\.css$/.test(href)) E('files', `${where}: the stylesheet ${href} is not found (from skill/: python3 qa/fetch.py --css)`); continue; }
    const bp = posixRel(abs);
    if (!cssText.has(bp)) { const t = read(abs); cssText.set(bp, t); for (const d of t.matchAll(/(--[\w-]+)\s*:/g)) cssDefs.add(d[1]); }
  }
  for (const d of (h.match(/<style[^>]*>[\s\S]*?<\/style>/gi) || []).join('').matchAll(/(--[\w-]+)\s*:/g)) cssDefs.add(d[1]);
  const st = jsonBlock(h, 'pf-state'), data = jsonBlock(h, 'pf-data'), acts = jsonBlock(h, 'pf-actions');
  for (const [n, b] of [['pf-state', st], ['pf-data', data], ['pf-actions', acts]]) if (b.error) E('json', `${where}: <script id="${n}"> is not valid JSON — ${b.error}`);
  Object.keys(acts.value).forEach((a) => actionNames.add(a));
  const lists = attrs(h, 'list');
  for (const l of lists) if (!(l in data.value)) E('lists', `${where}: data-pf-list="${l}" has no "${l}" in pf-data`);
  const shows = attrs(h, 'show').join(' ');
  const filtered = new Set();
  for (const m of h.matchAll(/<[^>]*\sdata-pf-list="([^"]+)"[^>]*>/g)) if (/\sdata-pf-(filter|search)=/.test(m[0])) filtered.add(m[1]);
  const declared = (l, kind) => (flow.matrix || []).some((r) => r.list === l && /^not drawn\b/i.test((r.kinds || {})[kind] || ''));
  for (const l of new Set(lists)) {
    if (declared(l, 'empty')) continue;                      /* the matrix says why it has none */
    if (!shows.includes(`total.${l}`)) E('empty', `${where}: the list "${l}" has no empty state — show one when total.${l}=0 (data-pf-show), even if the PRD is silent`);
    if (filtered.has(l) && !shows.includes(`count.${l}`)) E('empty', `${where}: the list "${l}" filters, but nothing shows when no row matches — add a no-results state on count.${l}=0 with a way to clear the filters`);
  }
  for (const n of attrs(h, 'do').flatMap((x) => x.split(/[\s,]+/)).filter(Boolean)) if (!(n in acts.value)) E('actions', `${where}: data-pf-do="${n}" is no action in pf-actions`);
  for (const [n, list] of Object.entries(acts.value)) stepsOf(Array.isArray(list) ? list : [list], `${where} pf-actions.${n}`, acts.value);
  const overlays = new Set(attrs(h, 'overlay')), panels = new Set(attrs(h, 'menu-panel'));
  for (const o of new Set(attrs(h, 'open'))) if (!overlays.has(o)) E('overlays', `${where}: data-pf-open="${o}" opens nothing — no element has data-pf-overlay="${o}"`);
  for (const o of new Set(attrs(h, 'menu'))) if (!panels.has(o)) E('overlays', `${where}: data-pf-menu="${o}" opens nothing — no element has data-pf-menu-panel="${o}"`);
  for (const g of new Set(attrs(h, 'go'))) if (!/\.html$/.test(g) && !stateIds.has(g)) E('states', `${where}: data-pf-go="${g}" is no state in flow.json`);
  const known = (pg) => screens.some((s) => s.id === pg || s.route === pg) || Object.values(pageEntries).some((e) => e.id === pg || e.route === pg)
    || Object.entries(REG.pages).some(([id, p]) => id === pg || p.route === pg) || pg in (NAV.routes.web || {}) || pg in (NAV.routes.phone || {});
  for (const pg of new Set(attrs(h, 'page'))) if (!/^[@$]/.test(pg) && !known(pg)) E('pages', `${where}: data-pf-page="${pg}" is no screen of flow.json and no product page (node qa/registry.mjs pages)`);
  /* the riyal: a glyph, never SAR, never ر.س, never the handover's sketch */
  if (/M7\.9 0 9\.9 0/.test(h)) E('currency', `${where}: draws the 2.0 handover's rough riyal sketch — use kit/riyal.svg`);
  const text = h.replace(/<(script|style|template)[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]+>/g, ' ');
  const cur = text.match(/(\bSAR\b|ر\.س|\u20C1)\s*[\d٠-٩][\d,.٠-٩]*|[\d٠-٩][\d,.٠-٩]*\s*(\bSAR\b|ر\.س|\u20C1)/);
  if (cur) E('currency', `${where}: an amount written as “${cur[0].trim()}” — draw the riyal glyph before the number (kit/riyal.svg)`);
  for (const m of h.matchAll(/\sstyle="([^"]*)"/g)) for (const v of m[1].matchAll(/var\((--[\w-]+)\s*\)/g)) if (!cssDefs.has(v[1])) { E('vars', `${where}: var(${v[1]}) is used but no stylesheet the screen links defines it`); break; }
}
/* options: each open design decision is drawn — its key is used by a screen */
for (const o of flow.options || []) {
  if (!o.key || !Array.isArray(o.variants) || o.variants.length < 2) { E('options', `option ${JSON.stringify(o.key || o.title)}: needs a key and at least two variants as [value, "label"]`); continue; }
  if (!screenFiles.some((sf) => sf.html.includes(o.key))) E('options', `option "${o.key}" is not used by any screen (data-pf-show="${o.key}=…")`);
}
/* states: their steps name real actions */
for (const s of states) stepsOf([].concat(s.do || []).map((d) => (typeof d === 'string' ? { do: d } : d)), `state "${s.id}"`, Object.fromEntries([...actionNames].map((a) => [a, true])));

/* the state matrix: every region has its default, loading, empty and error — and no-results when it filters */
const matrix = flow.matrix || [];
{
  if (!matrix.length) E('matrix', 'flow.json has no state matrix — list every region that shows data, and the state (or "not drawn: why") for each of default, loading, empty, error, no-results');
  for (const r of matrix) {
    const kinds = r.kinds || {};
    const need = ['default', 'loading', 'empty', 'error'].concat(r.filters === false ? [] : r.filters || (r.list && screenFiles.some((sf) => new RegExp(`data-pf-list="${r.list}"[^>]*data-pf-(filter|search)=|data-pf-(filter|search)=[^>]*data-pf-list="${r.list}"`).test(sf.html))) ? ['no-results'] : []);
    for (const k of need) {
      const v = kinds[k];
      if (!v) E('matrix', `region “${r.region}”: no ${k} state — name a state, or "not drawn: <why>"`);
      else if (!/^not drawn\b/i.test(v) && !stateIds.has(v)) E('matrix', `region “${r.region}”: ${k} → "${v}" is no state in flow.json`);
    }
    for (const [k, v] of Object.entries(kinds)) if (!need.includes(k) && typeof v === 'string' && !/^not drawn\b/i.test(v) && !stateIds.has(v)) E('matrix', `region “${r.region}”: ${k} → "${v}" is no state in flow.json`);
  }
}

/* ── 4 · qa/validate.py on the hi-fi screens ─────────────────────────── */
let validate = null;
if (!WIRE && screenFiles.length) {
  const files = screenFiles.map((sf) => relative(SKILL, sf.abs));
  const r = spawnSync('python3', [join(SKILL, 'qa', 'validate.py'), ...files], { cwd: SKILL, encoding: 'utf8' });
  if (r.error) W('validate', 'python3 is not here — qa/validate.py did not run');
  else {
    validate = { ok: r.status === 0, out: (r.stdout || '') + (r.stderr || '') };
    if (!validate.ok) {
      const lines = validate.out.split('\n').filter((l) => /FAIL|✗|fail/i.test(l) || /^\s{2,}\S/.test(l)).slice(0, 14);
      E('validate', 'qa/validate.py fails:\n' + lines.map((l) => '      ' + l.trim()).join('\n'));
    }
  }
}

/* ── 5 · the bundle ──────────────────────────────────────────────────── */
const KIT = (f) => read(join(SKILL, 'kit', f));
function transform(abs, html) {
  const phone = /\.mobile\.html$/.test(abs);
  html = html.replace(LINK_RE, (l) => {
    const href = (l.match(/\bhref=["']([^"']+)["']/) || [])[1];
    const found = href && resolveFrom(abs, html, href);
    if (!found || /kit\/kit\.css$/.test(found)) return '';
    const bp = posixRel(found);
    if (!cssText.has(bp) && existsSync(found)) cssText.set(bp, read(found));
    return `<link data-pf-css="${bp}">`;
  });
  html = html.replace(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi, (all, a) => (/type=["']application\/json["']/i.test(a) ? all : ''));
  html = html.replace(/\sdata-pf-(src|i|c)="[^"]*"/g, '');
  if (!phone) html = html.replace(/<meta name="viewport"[^>]*>/i, '');
  return html;
}
function blob(path, text) {
  const gz = gzipSync(Buffer.from(text, 'utf8'), { level: 9 });
  return `<script type="application/gzip-base64" data-path="${path}">${gz.toString('base64')}</script>`;
}
const safe = (s, what) => { if (/<\/script/i.test(s)) die(`${what} contains "</script" — it cannot be inlined`); return s; };

function build(qa) {
  const files = [];
  const entries = [...needed.entries()];
  for (const [bp, abs] of entries) {
    const html = htmlOf.get(abs) || read(abs);
    files.push(blob(bp, transform(abs, html)));
  }
  for (const [bp, css] of cssText) files.push(blob(bp, css));
  const manifest = {
    name: flow.name || basename(DIR), title: (flow.title || flow.name || basename(DIR)) + (WIRE ? ' · wireframe' : ''),
    theme: flow.theme || '', platforms: PLATFORMS, start: flow.start || (states[0] && states[0].id), wireframe: WIRE,
    screens: screens.map((s) => ({ id: s.id, title: s.title || s.id, route: s.route || '', size: s.size || null, files: Object.fromEntries(PLATFORMS.map((p) => [p, fileOf(s, p) ? bundlePath(resolve(DIR, fileOf(s, p))) : null]).filter(([, v]) => v)) })),
    pages: pageEntries, states: states.map((s) => ({ id: s.id, screen: s.screen || (screens[0] && screens[0].id), group: s.group, title: s.title, set: s.set || {}, do: s.do || [], notes: s.notes || '', try: s.try || [] })),
    controls: flow.controls || [], options: flow.options || [], shell: flow.shell || null, alias, menu: NAV.menu, labels: NAV.labels, qa,
  };
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${(manifest.title || 'Prototype').replace(/</g, '&lt;')}</title>
<meta name="description" content="Profolio KSA ${WIRE ? 'wireframe' : 'prototype'}: ${String(manifest.title).replace(/"/g, '&quot;')} — ${screens.length} screen(s), ${states.length} states, ${PLATFORMS.join(' + ')}">
<style>${safe(KIT('player.css'), 'kit/player.css')}</style>
</head>
<body>
<div id="pfp" class="pfp">
  <header id="pfp-bar" class="pfp-bar"></header>
  <main id="pfp-main" class="pfp-main">
    <section id="pfp-stage" class="pfp-stage" aria-label="Screen">
      <div id="pfp-device" class="pfp-device"><iframe id="pfp-frame" title="Prototype screen"></iframe></div>
      <div id="pfp-caption" class="pfp-caption"></div>
    </section>
    <aside class="pfp-notes" aria-label="Notes">
      <div id="pfp-note"></div>
      <div id="pfp-options" class="pfp-options"></div>
      <div><h3>States</h3><div id="pfp-states" class="pfp-states"></div></div>
      <div id="pfp-issues" class="pfp-issues"></div>
    </aside>
  </main>
</div>
<script type="application/json" id="pfp-manifest">${JSON.stringify(manifest).replace(/</g, '\\u003c')}</script>
<script type="text/plain" id="pfp-runtime">${safe(KIT('runtime.js'), 'kit/runtime.js')}</script>
<script type="text/plain" id="pfp-qa">${safe(KIT('qa.js'), 'kit/qa.js')}</script>
<script type="text/plain" id="pfp-kitcss">${safe(KIT('kit.css'), 'kit/kit.css')}</script>
<script type="text/plain" id="pfp-layer">${safe(KIT('layer.js'), 'kit/layer.js')}</script>
${files.join('\n')}
<script>${safe(KIT('player.js'), 'kit/player.js')}</script>
</body>
</html>
`;
}

/* ── 6 · the visual QA ───────────────────────────────────────────────── */
const LAYOUT = new Set(['align', 'controls', 'rows', 'overlap', 'clip', 'small', 'targets', 'skeleton']);
const SIZE = { web: { width: 1440, height: 900 }, phone: { width: 375, height: 812 } };
async function visual() {
  if (flag('--no-qa')) return { ran: false, note: 'built with --no-qa' };
  if (!states.length || !screenFiles.length) return { ran: false, note: 'nothing to render' };
  const b = await launch({ install: !flag('--no-install'), log });
  if (b.error) return { ran: false, note: `no browser here — ${b.error}` };
  const shots = flag('--shots');
  if (shots) mkdirSync(join(REPORT, 'shots'), { recursive: true });
  const qaSrc = KIT('qa.js');
  const found = [];
  const baseline = { web: new Set(), phone: new Set() };
  const sweep = { interactions: 0, extremes: 0, options: 0 };
  try {
    for (const pl of PLATFORMS) {
      const page = await b.page(SIZE[pl]);
      /* the product's own issues: its compiled source pages, measured the same way */
      const bases = new Set(screenFiles.filter((sf) => sf.platform === pl).flatMap((sf) => sourcesOf(sf.html)));
      for (const base of bases) {
        const abs = join(SKILL, base);
        if (!existsSync(abs)) continue;
        await page.goto(pathToFileURL(abs).href);
        const res = await page.evaluate((src) => { const s = document.createElement('script'); s.textContent = src; document.head.appendChild(s); return window.pfQA({}); }, qaSrc);
        for (const i of res.issues) if (LAYOUT.has(i.check)) baseline[pl].add(i.check + '|' + i.message);
      }
      await page.goto(pathToFileURL(OUT).href + '#shot');
      for (let t = 0; t < 120 && !(await page.evaluate(() => !!(window.__pfp))); t++) await new Promise((r) => setTimeout(r, 250));
      for (const s of states) {
        const st = await page.evaluate(([id, p]) => window.__pfp.go(id, p).then(() => true, (e) => String(e)), [s.id, pl]);
        const res = await page.evaluate(() => window.__pfp.qa({}));
        const runtime = [...new Set([...(res.errors || []), ...(res.frameErrors || [])])];
        for (const m of runtime) found.push({ level: 'error', check: 'runtime', message: 'the prototype errs: ' + m, state: s.id, platform: pl });
        for (const d of new Set(res.dead || [])) found.push({ level: 'error', check: 'dead', message: `“${d}” was clicked and is not wired`, state: s.id, platform: pl });
        for (const i of res.issues || []) {
          const product = LAYOUT.has(i.check) && baseline[pl].has(i.check + '|' + i.message);
          found.push({ ...i, level: product ? 'product' : i.level, state: s.id, platform: pl });
        }
        if (st !== true) found.push({ level: 'error', check: 'runtime', message: `state "${s.id}" did not open: ${st}`, state: s.id, platform: pl });
        if (shots) { const [w, h] = await page.evaluate(() => window.__pfp.size()); await page.screenshot({ path: join(REPORT, 'shots', `${s.id}.${pl}.png`), clip: { x: 0, y: 0, width: w, height: h } }); }
      }
      /* the sweep, from each screen's first state: every control that opens something, the data
         at its extremes, every variant of an open design decision */
      const record = (res, where) => {
        const runtime = [...new Set([...(res.errors || []), ...(res.frameErrors || [])])];
        for (const m of runtime) found.push({ level: 'error', check: 'runtime', message: 'the prototype errs: ' + m, state: where, platform: pl });
        for (const i of res.issues || []) {
          const product = LAYOUT.has(i.check) && baseline[pl].has(i.check + '|' + i.message);
          found.push({ ...i, level: product ? 'product' : i.level, state: where, platform: pl });
        }
      };
      const shot = async (name) => { if (!shots) return; const [w, h] = await page.evaluate(() => window.__pfp.size()); await page.screenshot({ path: join(REPORT, 'shots', `${name}.${pl}.png`), clip: { x: 0, y: 0, width: w, height: h } }); };
      const first = new Map();
      for (const s of states) { const sc = s.screen || screens[0].id; if (!first.has(sc)) first.set(sc, s.id); }
      const startSc = (states.find((s) => s.id === flow.start) || {}).screen;
      if (flow.start) first.set(startSc || screens[0].id, flow.start);
      const go = (id) => page.evaluate(([i, p]) => window.__pfp.go(i, p), [id, pl]);
      for (const sid of first.values()) {
        await go(sid);
        const ts = await page.evaluate(() => window.__pfp.targets());
        for (const [n, t] of (Array.isArray(ts) ? ts : []).entries()) {
          await go(sid);
          const it = await page.evaluate((x) => window.__pfp.interact(x), t);
          record(await page.evaluate((x) => window.__pfp.qa({ interaction: x }), it), `${sid} › ${t.label}`);
          await shot(`${sid}.i${n + 1}-${t.kind}`);
          await page.evaluate(() => window.__pfp.closeShell());
          sweep.interactions++;
        }
        const lists = [...new Set((flow.matrix || []).filter((r) => r.list && !/^not drawn/i.test((r.kinds || {}).empty || '')).map((r) => r.list))];
        if (lists.length) for (const kind of ['missing', 'long', 'arabic', 'zero']) {
          await go(sid);
          await page.evaluate(([k, l]) => window.__pfp.extremes(k, l), [kind, lists]);
          record(await page.evaluate(() => window.__pfp.qa({})), `${sid} · ${kind} data`);
          await shot(`${sid}.x-${kind}`);
          sweep.extremes++;
        }
        for (const o of flow.options || []) for (const [v] of o.variants || []) {
          await go(sid);
          await page.evaluate(([k, x]) => window.__pfp.setVar(k, x), [o.key, v]);
          record(await page.evaluate(() => window.__pfp.qa({})), `${sid} · ${o.key}=${v}`);
          await shot(`${sid}.o-${String(o.key).replace(/\W+/g, '')}-${v}`);
          await page.evaluate(([k]) => window.__pfp.setVar(k, undefined), [o.key]);
          sweep.options++;
        }
      }
      await page.close();
    }
  } finally { await b.close(); }
  /* one line per issue, with the states it appears in */
  const merged = new Map();
  for (const i of found) {
    const k = i.level + '|' + i.check + '|' + i.platform + '|' + i.message;
    const e = merged.get(k) || { level: i.level, check: i.check, platform: i.platform, message: i.message, box: i.box || null, states: [] };
    if (!e.states.includes(i.state)) e.states.push(i.state);
    merged.set(k, e);
  }
  const list = [...merged.values()].sort((a, b) => ({ error: 0, warn: 1, product: 2 }[a.level] - { error: 0, warn: 1, product: 2 }[b.level]));
  const coverage = `${states.length} states × ${PLATFORMS.length} platform${PLATFORMS.length > 1 ? 's' : ''} · ${sweep.interactions} interactions · ${sweep.extremes} extreme-data · ${sweep.options} option renders`;
  return { ran: true, browser: b.name, renders: states.length * PLATFORMS.length + sweep.interactions + sweep.extremes + sweep.options, coverage, issues: list };
}

/* ── run ─────────────────────────────────────────────────────────────── */
const staticIssues = [...errors, ...warns];
let qa = { ran: false, note: 'building' };
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, build({ ran: false, note: 'QA running', errors: 0, warnings: 0 }));
const v = errors.length && errors.some((e) => ['flow', 'coverage', 'files'].includes(e.check)) ? { ran: false, note: 'the static checks failed first' } : await visual();
const all = [...staticIssues.map((i) => ({ ...i, platform: '', states: [] })), ...(v.issues || [])];
const nErr = all.filter((i) => i.level === 'error').length, nWarn = all.filter((i) => i.level === 'warn').length, nProd = all.filter((i) => i.level === 'product').length;
qa = { ran: !!v.ran, note: v.note || '', browser: v.browser || '', renders: v.renders || 0, coverage: v.coverage || '', errors: nErr, warnings: nWarn, product: nProd, issues: all.slice(0, 80), built: new Date().toISOString() };
writeFileSync(OUT, build(qa));
mkdirSync(REPORT, { recursive: true });
const name = WIRE ? 'wireframe' : 'prototype';
writeFileSync(join(REPORT, `${name}.json`), JSON.stringify(qa, null, 1));
const md = [`# Design QA — ${flow.title || flow.name || basename(DIR)} (${name})`, '', `Built ${qa.built}. ${qa.ran ? `${qa.renders} renders in ${qa.browser}.` : `Visual QA did not run: ${qa.note}.`} ${nErr} error(s), ${nWarn} warning(s)${nProd ? `, ${nProd} of the product's own (not counted)` : ''}.`, '', '| level | check | where | issue |', '|---|---|---|---|',
  ...all.map((i) => `| ${i.level} | ${i.check} | ${[i.platform, (i.states || []).join(', ')].filter(Boolean).join(' · ')} | ${String(i.message).replace(/\|/g, '\\|').replace(/\n/g, '<br>')} |`)].join('\n');
writeFileSync(join(REPORT, `${name}.md`), md + '\n');

/* the same QA as design-qa's report.json (schema v1): the one report design-deliverables reads.
   Each check maps to design-qa's id where one exists; this skill's own checks keep a pf. prefix.
   The product's own issues (in the compiled page a design starts from) are notes: not the design's. */
const DQA = { align: 'lay.align', overlap: 'lay.overlap', fonts: 'res.font', images: 'res.image', overflow: 'brk.render', vars: 'tok.resolve', spacing: 'lay.spacing', skeleton: 'lay.skeleton', rows: 'lay.rows', targets: 'a11y.target', small: 'a11y.small', blank: 'cpy.undefined', dead: 'int.dead', matrix: 'cov.state' };
const dqaId = (i) => {
  if (i.check === 'controls') return /squashed/.test(i.message) ? 'lay.squashed' : 'lay.controls';
  if (i.check === 'clip') return /opens cut off/.test(i.message) ? 'int.clip' : 'lay.clip';
  if (i.check === 'shell') return /off the screen/.test(i.message) ? 'int.offscreen' : /unstyled/.test(i.message) ? 'int.unstyled' : /opens nothing/.test(i.message) ? 'int.dead' : 'pf.shell';
  if (i.check === 'matrix' && /empty/i.test(i.message)) return 'cov.empty';
  return DQA[i.check] || 'pf.' + i.check;
};
const dqaHint = (id) => (/^(ovf|brk)|^cpy\.undefined/.test(id) ? 'edge-cases' : /^(a11y|rtl|mot)/.test(id) ? 'accessibility' : /^cov/.test(id) ? 'state-screens' : /^(lay|int|res)/.test(id) ? 'acceptance' : 'open-questions');
const dqaFindings = all.map((i) => {
  const id = dqaId(i);
  return { check: id, severity: i.level === 'error' ? 'blocker' : i.level === 'warn' ? 'warning' : 'note', screen: flow.name || basename(DIR), case: [i.platform, (i.states || []).join(', ')].filter(Boolean).join(' · ') || null, node: null, css_path: null, role: null, message: (i.level === 'product' ? "The product's own, in the compiled page this design starts from (not counted): " : '') + i.message, expected: null, actual: null, evidence: i.box ? `box ${i.box.x},${i.box.y},${i.box.w},${i.box.h}` : null, waived: false, waiver: null, section_hint: dqaHint(id) };
});
const dqaCounts = { blocker: dqaFindings.filter((f) => f.severity === 'blocker').length, warning: dqaFindings.filter((f) => f.severity === 'warning').length, note: dqaFindings.filter((f) => f.severity === 'note').length, waived: 0, skipped_checks: 0 };
writeFileSync(join(REPORT, WIRE ? 'report.wireframe.json' : 'report.json'), JSON.stringify({
  schema_version: 1, generated_at: qa.built, qa_skill_name: 'profolio-ksa-design',
  qa_skill_version: String((REG.source && REG.source.ref) || '').replace(/^refs\/tags\/skill-v/, '') || 'dev',
  ids_available: false, render_available: !!qa.ran,
  scope: { feature: flow.name || basename(DIR), pages: (flow.screens || []).map((s) => s.id), platforms: PLATFORMS, locales: ['en'], profile: WIRE ? 'wireframe' : 'hifi' },
  verdict: !qa.ran || dqaCounts.blocker ? 'blocked' : dqaCounts.warning ? 'pass_with_warnings' : 'pass',
  counts: dqaCounts, findings: dqaFindings, render_coverage: qa.coverage || null, render_browser: qa.browser || null,
}, null, 1));

/* ── the handoff: what the developers need, from what the design already says ─────────── */
if (!WIRE) {
  const strip = (h) => h.replace(/<(\w+)\b[^>]*\sdata-pf-text="([^"]*)"[^>]*>[^<]*<\/\1>/g, (m, t, k) => `‹${k.replace(/^[@$.]+/, '')}›`).replace(/<(script|style|template)[\s\S]*?<\/\1>/gi, (m) => (/^<template/i.test(m) ? m.replace(/^<template[^>]*>|<\/template>$/gi, '') : ' ')).replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
  const copy = new Map();
  for (const sf of screenFiles) {
    /* the element's whole content: its own tag counted, so nested spans stay inside */
    const inner = (h, at, tag) => {
      const re = new RegExp(`<${tag}\\b[^>]*>|</${tag}>`, 'gi');
      re.lastIndex = at;
      let depth = 0, m, start = -1;
      while ((m = re.exec(h))) {
        if (m[0][1] !== '/') { if (depth++ === 0) start = re.lastIndex; }
        else if (--depth === 0) return h.slice(start, m.index);
      }
      return '';
    };
    for (const m of sf.html.matchAll(/<(\w+)\b[^>]*\sdata-pf-new-copy\b[^>]*>/g)) {
      if (/\/>$/.test(m[0])) continue;
      const t = strip(inner(sf.html, m.index, m[1])).replace(/\s+([,.])/g, '$1');
      if (t && t.length > 1) (copy.get(t) || copy.set(t, new Set()).get(t)).add(sf.platform);
    }
  }
  const fields = new Map();
  for (const sf of screenFiles) for (const m of sf.html.matchAll(/data-pf-list="([^"]+)"[\s\S]*?<template>([\s\S]*?)<\/template>/g)) {
    const f = fields.get(m[1]) || new Set();
    for (const x of m[2].matchAll(/\$\.([\w.]+)/g)) f.add(x[1]);
    fields.set(m[1], f);
  }
  const acts = jsonBlock(screenFiles[0] ? screenFiles[0].html : '', 'pf-actions').value;
  const tbc = [flow.theme && /TBC/.test(flow.theme) ? `Theme: ${flow.theme}` : '', ...states.filter((s) => /\[TBC\]/.test(s.notes || '')).map((s) => `${s.title || s.id}: ${s.notes}`)].filter(Boolean);
  const hand = [
    `# Handoff — ${flow.title || flow.name}`, '',
    `Generated by qa/prototype.mjs on ${qa.built} from flow.json and the screens. The prototype: \`${relative(DIR, OUT)}\` (${PLATFORMS.join(' + ')}).`,
    `QA: ${qa.ran ? `${qa.errors ? `${qa.errors} error(s)` : 'passed'} in ${qa.renders} renders (${qa.browser}); ${qa.warnings} warning(s)` : `visual QA not run — ${qa.note}`}. The full report: \`qa/prototype.md\`.`, '',
    '## Screens', '', '| screen | platform | file | compiled from |', '|---|---|---|---|',
    ...screenFiles.map((sf) => `| ${sf.screen.title || sf.screen.id} (${sf.screen.route || ''}) | ${sf.platform} | \`${relative(DIR, sf.abs)}\` | ${sourcesOf(sf.html).map((x) => `\`${x}\``).join(', ') || '—'} |`), '',
    '## States', '', '| state | group | what it shows |', '|---|---|---|',
    ...states.map((s) => `| ${s.title || s.id} (\`${s.id}\`) | ${s.group || ''} | ${(s.notes || '').replace(/\|/g, '\\|')} |`), '',
    '## State matrix', '', '| region | ' + ['default', 'loading', 'empty', 'no-results', 'error', 'first-use'].join(' | ') + ' |', '|---|---|---|---|---|---|---|',
    ...matrix.map((r) => `| ${r.region} | ` + ['default', 'loading', 'empty', 'no-results', 'error', 'first-use'].map((k) => (r.kinds || {})[k] || '—').join(' | ') + ' |'), '',
    '## New copy — English, Arabic to come', '', '| English | platforms | Arabic |', '|---|---|---|',
    ...[...copy].map(([t, p]) => `| ${t.replace(/\|/g, '\\|')} | ${[...p].join(', ')} | [TBC] |`), '',
    '## Data each list needs', '', ...[...fields].map(([l, f]) => `- **${l}**: ${[...f].join(', ')}`), '',
    '## Actions', '', ...Object.entries(acts).map(([n, st]) => `- **${n}**: ${JSON.stringify(st).slice(0, 220)}${JSON.stringify(st).length > 220 ? '…' : ''}`), '',
    '## Open — [TBC]', '', ...(tbc.length ? tbc.map((t) => `- ${t}`) : ['- none flagged in flow.json']),
    '- Add: the APIs each state needs, the flags that gate it (product/flags.md), analytics, and every open question.', '',
  ].join('\n');
  writeFileSync(join(REPORT, 'handoff.md'), hand);
}

const size = statSync(OUT).size / 1048576;
log(`  ${name}: ${relative(process.cwd(), OUT)} — ${size.toFixed(1)} MB · ${screens.length} screen(s) · ${states.length} states · ${PLATFORMS.join(' + ')} · ${Object.keys(pageEntries).length} product page(s) · ${Object.keys(alias).length} shell state(s)`);
if (size > 15) log('  warning: over 15 MB — an artifact holds 16 MB; bundle fewer product pages: --pages linked');
log(`  static: ${staticIssues.filter((i) => i.level === 'error').length ? '✗' : '✓'} ${staticIssues.filter((i) => i.level === 'error').length} error(s) · validate.py ${validate ? (validate.ok ? '✓' : '✗') : '—'}`);
log(`  visual: ${qa.ran ? `${nErr ? '✗' : '✓'} ${qa.renders} renders (${qa.browser}) — ${qa.coverage}` : `not run — ${qa.note}`}`);
for (const i of all.filter((x) => x.level !== 'product').slice(0, 30)) log(`    ${i.level.padEnd(5)} ${i.check.padEnd(9)} ${[i.platform, (i.states || []).slice(0, 4).join(', ') + ((i.states || []).length > 4 ? ` +${i.states.length - 4}` : '')].filter(Boolean).join(' · ')}${i.platform ? ': ' : ''}${i.message}`);
if (all.filter((x) => x.level !== 'product').length > 30) log(`    … ${relative(process.cwd(), join(REPORT, name + '.md'))} has all ${all.length}`);
if (nProd) log(`  ${nProd} issue(s) are the product's own (its compiled page has them too) — listed in the report, not counted`);
if (nErr) { log(`  → fix the errors and run again. Until QA passes, the ${name} says “not ready to share”.`); process.exit(1); }
if (!qa.ran) { log(`  → built, but the visual QA did not run here. Deliver it saying so, and ask for the QA button in the ${name} to be pressed.`); process.exit(3); }
log(`  → QA passed. Deliver ${relative(process.cwd(), OUT)}.`);
