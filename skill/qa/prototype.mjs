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
 * Directions (gate 1): flow.json "directions" makes the prototype hold two or three complete
 * designs of the same flow — A existing components only, B competitor-led, C bold — each
 * screen drawn once per direction (screens[].directions.<id>.web/phone), switched in the
 * player, every one QA'd. "chosen" keeps only the one picked. They start from the research
 * (research/research.json → research/board.html, qa/board.mjs): competitors, Mobbin, trends
 * and the fresh moves each direction draws (data-pf-fresh). kit/README.md → directions.
 *
 *   --no-qa        build only (a draft: the prototype says QA was not run)
 *   --shots        save a PNG of every state and platform to designs/<feature>/qa/shots/, to look at
 *   --pages all|linked|none   the product pages bundled for the rail (default: flow.json "pages", else all)
 *   --no-install   never npm-install a browser
 *   --only B       the visual QA of one direction only, and --state <id> of one state only: a fast
 *                  check while fixing. It exits 5 when it passes: never deliver on it, run it whole
 *
 * Exit status: 0 QA passed · 1 QA found errors · 3 built, but no browser here, so the visual QA
 * did not run — say so when you deliver · 5 a partial QA passed (--only, --state) · 2 a usage or
 * setup error.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, statSync, appendFileSync } from 'node:fs';
import { join, dirname, resolve, relative, basename, posix } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { gzipSync } from 'node:zlib';
import { execFileSync, spawnSync } from 'node:child_process';
import { launch } from './browser.mjs';
import { checkResearch } from './research.mjs';

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

/* ── 1b · directions: gate 1 shows complete designs of one flow, side by side ── */
const LAYOUTS = { table: 'a table, one row per item', list: 'a list of slim cards, one per row', cards: 'a grid of cards', 'list-detail': 'a list beside the item it opens', feed: 'a feed of rich cards, each a small page', board: 'columns by status', dashboard: 'tiles and charts first, the items below', map: 'a map beside its items', wizard: 'one step at a time' };
const KIND = { existing: 'Existing components only', competitor: 'Competitor-led: new patterns, the product\'s tokens', bold: 'Bold: new patterns and new visual language' };
const DIRS = WIRE ? [] : (flow.directions || []);
if (DIRS.length) {
  const ids = new Set();
  for (const d of DIRS) {
    if (!d.id || ids.has(d.id)) E('directions', `each direction needs its own id — got ${JSON.stringify(d.id)}`);
    ids.add(d.id);
    if (!KIND[d.kind]) E('directions', `direction ${d.id}: kind must be ${Object.keys(KIND).join(', ')} — got ${JSON.stringify(d.kind)}`);
  }
  if (flow.chosen && !ids.has(flow.chosen)) E('directions', `chosen "${flow.chosen}" is no direction`);
  if (!flow.chosen) {
    if (DIRS.length < 2) E('directions', 'gate 1 shows two or three directions; flow.json has one — or set "chosen"');
    if (!DIRS.some((d) => d.kind === 'existing')) E('directions', 'one direction draws only the product\'s existing components (kind "existing"), so the safest option is always on the table');
    if (!['system', 'new'].includes(flow.variations)) E('directions', `flow.json "variations" is "system" (within the design system) or "new" (new components in its style): the PM's answer to D10 — got ${JSON.stringify(flow.variations)}`);
    /* each direction is a different idea, not the same screen with a widget added: its layout and
       its hero (the one thing read first) are declared, and bold never shares A's layout */
    for (const d of DIRS) {
      if (!LAYOUTS[d.layout]) E('directions', `direction ${d.id}: "layout" is one of ${Object.keys(LAYOUTS).join(', ')} — got ${JSON.stringify(d.layout)} (kit/README.md → directions)`);
      if (!(typeof d.hero === 'string' && d.hero.trim().length > 3)) E('directions', `direction ${d.id}: "hero" says what the screen shows first, in a few words ("the match score, large, on each card")`);
    }
    const A = DIRS.find((d) => d.kind === 'existing');
    const norm = (t) => String(t || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    if (A) for (const d of DIRS.filter((x) => x !== A && LAYOUTS[x.layout])) {
      if (d.kind === 'bold' && d.layout === A.layout) E('directions', `direction ${d.id} (bold) has A's layout, "${A.layout}": bold changes the layout itself (${Object.entries(LAYOUTS).filter(([k]) => k !== A.layout).slice(0, 4).map(([k, v]) => `${k}: ${v}`).join('; ')})`);
      if (d.kind === 'competitor' && d.layout === A.layout && norm(d.hero) === norm(A.hero)) E('directions', `direction ${d.id} (competitor-led) has A's layout and A's hero: change one — the references' layout, or what is read first`);
    }
  }
}
const ACTIVE = flow.chosen ? DIRS.filter((d) => d.id === flow.chosen) : DIRS;
const DIRLIST = ACTIVE.length ? ACTIVE.map((d) => d.id) : [null];
/* a partial run, to iterate fast: one direction, one state. Never the run you deliver on */
const ONLY = opt('--only'), ONLY_STATE = opt('--state');
if (ONLY && !DIRLIST.includes(ONLY)) die(`--only ${ONLY}: no such direction (${DIRLIST.filter(Boolean).join(', ') || 'none'})`);
const VDIRS = ONLY ? [ONLY] : DIRLIST;
const VSTATES = ONLY_STATE ? states.filter((s) => s.id === ONLY_STATE) : states;
if (ONLY_STATE && !VSTATES.length) die(`--state ${ONLY_STATE}: no such state in flow.json`);
const PARTIAL = [ONLY && `direction ${ONLY} only`, ONLY_STATE && `state ${ONLY_STATE} only`].filter(Boolean).join(', ');

/* ── 2 · the files ───────────────────────────────────────────────────── */
const fileOf = (s, p, d = null) => (WIRE ? (s.wireframe || {})[p] : d ? ((s.directions || {})[d] || {})[p] : s[p] || (p === 'phone' ? s.mobile : null));
const screenFiles = [];
for (const d of DIRLIST) for (const s of screens) for (const p of PLATFORMS) {
  const f = fileOf(s, p, d);
  if (!f) { E('coverage', `screen "${s.id}" has no ${p} ${WIRE ? 'wireframe' : 'file'}${d ? ` in direction ${d} — flow.json screens[].directions.${d}.${p}` : ` — flow.json screens[].${WIRE ? 'wireframe.' : ''}${p}`}`); continue; }
  const abs = resolve(DIR, f);
  if (!existsSync(abs)) { E('coverage', `screen "${s.id}" (${p}${d ? ', ' + d : ''}): ${relative(process.cwd(), abs)} does not exist`); continue; }
  screenFiles.push({ screen: s, platform: p, dir: d, abs, html: inlineJson(abs, read(abs)) });
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
/* beside each expanded rail and phone menu, its groups opened (registry: rail-expanded-<group>,
   mobile-menu-<group>, e.g. Reports): a click on a group's title opens it, as in the product */
for (const bp of [...needed.keys()]) {
  const m = bp.match(/^pages\/([\w-]+)\/(rail-expanded|mobile-menu)(\.mobile)?\.html$/);
  if (!m || !REG.pages[m[1]]) continue;
  for (const sid of new Set((REG.pages[m[1]].states || []).map((x) => x.split('@')[0]).filter((x) => x.startsWith(m[2] + '-')))) {
    const f = `pages/${m[1]}/${sid}${m[3] || ''}.html`, abs = join(SKILL, f);
    if (!existsSync(abs)) missing.push(abs);
    needed.set(f, abs);
    for (const [as, to] of Object.entries(alias)) if (to === bp) alias[as.replace(new RegExp(`${m[2]}((\\.mobile)?\\.html)$`), `${sid}$1`)] = f;
  }
}
/* and the compiled files each screen was made from (pf-base, pf-also): validate.py and the QA's
   baseline hold the screen to them */
for (const sf of screenFiles) for (const src of sourcesOf(sf.html)) { const abs = join(SKILL, src); if (!existsSync(abs)) missing.push(abs); }
if (missing.length) { log(`  fetching ${missing.length} compiled file(s) the prototype opens or was made from…`); fetchMissing(missing); }
/* the shared files qa/validate.py reads (registry.source.assets: css/, prototype.js). A page
   fetched on its own brings only the stylesheets it links, and validate.py then stops */
{
  const assets = ((REG.source || {}).assets || []).filter((a) => !existsSync(join(SKILL, a)));
  if (assets.length) {
    log(`  fetching the ${assets.length} shared file(s) qa/validate.py reads (python3 qa/fetch.py --css)…`);
    const r = spawnSync('python3', [join(SKILL, 'qa', 'fetch.py'), '--css'], { cwd: SKILL, encoding: 'utf8' });
    if (r.status !== 0) W('fetch', `python3 qa/fetch.py --css failed: ${(r.stdout + r.stderr).trim().split('\n').slice(-1)[0]}`);
  }
}
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
  const where = `${sf.screen.id} (${sf.platform}${sf.dir ? ', direction ' + sf.dir : ''})`;
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
  /* each list element by its own count key: data-pf-count, else the list's name */
  const keyed = new Map();
  for (const m of h.matchAll(/<[^>]*\sdata-pf-list="([^"]+)"[^>]*>/g)) {
    const key = (m[0].match(/\sdata-pf-count="([^"]+)"/) || [])[1] || m[1];
    const k = keyed.get(key) || { list: m[1], filters: false };
    if (/\sdata-pf-(filter|search)=/.test(m[0])) k.filters = true;
    keyed.set(key, k);
  }
  for (const [key, k] of keyed) {
    /* a second list of the same rows under its own count key (a dialog's one row) is a view of a
       row, not a list to empty — unless the matrix names it (matrix[].count: a picker that searches) */
    if (key !== k.list && !(flow.matrix || []).some((r) => r.count === key)) continue;
    if (declared(k.list, 'empty') || (flow.matrix || []).some((r) => r.count === key && /^not drawn\b/i.test((r.kinds || {}).empty || ''))) continue;   /* the matrix says why it has none */
    /* total.<key> counts the list's rows; a second view of the same rows (its own count key) is
       empty when its own count is: count.<key>=0 answers too */
    if (!shows.includes(`total.${key}`) && !(key !== k.list && shows.includes(`count.${key}`))) E('empty', `${where}: the list "${key}" has no empty state — show one when ${key !== k.list ? `count.${key}=0` : `total.${key}=0`} (data-pf-show), even if the PRD is silent`);
    if (k.filters && !shows.includes(`count.${key}`)) E('empty', `${where}: the list "${key}" filters, but nothing shows when no row matches — add a no-results state on count.${key}=0 with a way to clear the filters`);
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
/* stand-ins: a step the product hands to someone else (a card form, a phone call), drawn as a placeholder */
const standins = new Map();
for (const sf of screenFiles) for (const m of sf.html.matchAll(/\sdata-pf-standin="([^"]*)"/g)) {
  if (!m[1].trim()) { E('standin', `${relative(DIR, sf.abs)}: data-pf-standin needs what it stands in for ("Checkout.com card form")`); continue; }
  (standins.get(m[1]) || standins.set(m[1], new Set()).get(m[1])).add(`${sf.screen.id}${sf.dir ? ' · ' + sf.dir : ''} (${sf.platform})`);
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
      if (!v) E('matrix', `region “${r.region}”: no ${k} state — name a state, "compiled: <file>" for a region the design leaves as the product draws it, or "not drawn: <why>"`);
      else if (/^compiled:\s*/i.test(v)) { const f = v.replace(/^compiled:\s*/i, '').trim(); if (!existsSync(join(SKILL, f)) && !(REG.pages[(f.match(/^pages\/([\w-]+)/) || [])[1]])) E('matrix', `region “${r.region}”: ${k} → ${f} is no compiled file`); }
      else if (!/^not drawn\b/i.test(v) && !stateIds.has(v)) E('matrix', `region “${r.region}”: ${k} → "${v}" is no state in flow.json`);
    }
    for (const [k, v] of Object.entries(kinds)) if (!need.includes(k) && typeof v === 'string' && !/^(not drawn|compiled:)/i.test(v) && !stateIds.has(v)) E('matrix', `region “${r.region}”: ${k} → "${v}" is no state in flow.json`);
  }
}

/* ── 3b · each direction's own CSS: A none; B the product's tokens only; C new tokens, each
   declared once as --pfx-* with a [new] note. A direction's classes are its own (pfx-*): none
   restyles a product class ── */
const newTokens = [];                // { dir, name, value, why }: the bold direction's new language, for sign-off
/* the kit's visual elements (kit/README.md → visual elements) are new design: B and C only */
const ELEMENT_RE = /\bpfk-(grid|split|tile|stats?|delta|avatars|ring|meter|progress|thumbs|ichips?|band|spark|steps)(?:__[\w-]+|--[\w-]+)?(?![\w-])/;
for (const d of ACTIVE.filter((x) => x.kind === 'existing')) for (const sf of screenFiles.filter((f) => f.dir === d.id)) {
  const m = [...sf.html.matchAll(/\sclass="([^"]*)"/g)].map((c) => (c[1].match(ELEMENT_RE) || [])[0]).find(Boolean);
  if (m) E('direction', `direction ${d.id} draws only the product's components, and ${relative(DIR, sf.abs)} uses the kit's visual element .${m} — new design, for B and C`);
}
const COLOUR_LIT = /#[0-9a-f]{3,8}\b|\b(rgba?|hsla?|oklch|lab|lch)\(/i;
for (const d of ACTIVE) {
  const local = new Map();
  for (const sf of screenFiles.filter((f) => f.dir === d.id)) for (const l of sf.html.match(LINK_RE) || []) {
    const href = (l.match(/\bhref=["']([^"']+)["']/) || [])[1];
    const abs = href && !/^(https?:|data:)/.test(href) ? resolve(dirname(sf.abs), href) : null;
    if (abs && !relative(DIR, abs).startsWith('..') && existsSync(abs)) local.set(abs, read(abs));
  }
  for (const [abs, css] of local) {
    const name = relative(DIR, abs);
    if (d.kind === 'existing') { E('direction', `direction ${d.id} draws only the product's components, and links ${name}: a new pattern belongs to a competitor-led or bold direction`); continue; }
    for (const m of css.matchAll(/([^{}]+)\{/g)) {
      const sel = m[1].replace(/\/\*[\s\S]*?\*\//g, '').trim();
      if (!sel || sel.startsWith('@') || /^(from|to|\d+%)/.test(sel)) continue;
      for (const c of sel.matchAll(/\.(-?[a-zA-Z_][\w-]*)/g)) if (!c[1].startsWith('pfx-')) { E('direction', `direction ${d.id}: ${name} styles .${c[1]} — a direction's own CSS styles its own classes (pfx-*), never the product's`); break; }
    }
    /* every var() it uses is defined: B and C link css/tokens.css (qa/compose.mjs start does), or
       the product's colours silently fall away and the direction renders bare */
    const own = new Set([...css.matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1]));
    for (const v of new Set([...css.matchAll(/var\(\s*(--[\w-]+)\s*\)/g)].map((m) => m[1]))) if (!own.has(v) && !cssDefs.has(v)) E('direction', `direction ${d.id}: ${name} uses var(${v}), which no stylesheet its screens link defines — link css/tokens.css (node qa/compose.mjs start does)`);
    for (const m of css.matchAll(/(--[\w-]+|[a-z-]+)\s*:\s*([^;{}]+?)\s*(?:;|(?=\}))([ \t]*\/\*([\s\S]*?)\*\/)?/g)) {
      const [, prop, value, , note] = m;
      const literal = COLOUR_LIT.test(value) || (prop === 'font-family' && !/^(var\(|inherit|initial|unset)/.test(value.trim()));
      if (!literal) continue;
      if (d.kind === 'competitor') E('direction', `direction ${d.id} (competitor-led) keeps the product's colours and type: ${name} sets ${prop}: ${value.trim()} — use a token (tokens.md) as var(--…)`);
      else if (!prop.startsWith('--pfx-')) E('direction', `direction ${d.id} (bold): ${name} sets ${prop}: ${value.trim()} — declare each new colour or face once, as a --pfx-* token with a /* [new] why */ note, and use var() for it`);
      else if (!/\[new\]/i.test(note || '')) E('direction', `direction ${d.id} (bold): ${name}: ${prop} needs a /* [new] why */ note — every new value goes to the designer for sign-off`);
      else newTokens.push({ dir: d.id, name: prop, value: value.trim(), why: (note || '').replace(/\[new\]/i, '').trim() });
    }
  }
}

/* ── 3b+ · D10, the variations the PM asked for: within the design system, no direction adds CSS
   of its own; new components in its style, each one B or C adds is named in flow.json
   (directions[].components: { name, class, why }), so the locked design proposes it ── */
const proposed = [];
for (const d of ACTIVE.filter((x) => x.kind !== 'existing')) {
  const css = new Map();
  for (const sf of screenFiles.filter((f) => f.dir === d.id)) for (const l of sf.html.match(LINK_RE) || []) {
    const href = (l.match(/\bhref=["']([^"']+)["']/) || [])[1];
    const abs = href && !/^(https?:|data:)/.test(href) ? resolve(dirname(sf.abs), href) : null;
    if (abs && !relative(DIR, abs).startsWith('..') && existsSync(abs)) css.set(relative(DIR, abs), read(abs));
  }
  if (flow.variations === 'system' && css.size) E('direction', `variations "system" (D10): direction ${d.id} adds CSS of its own (${[...css.keys()].join(', ')}) — within the design system, B and C compose the product's components and the kit, and add none`);
  if (flow.variations !== 'new' || !css.size) continue;
  const comps = d.components || [];
  const allCss = [...css.values()].join('\n'), screensHtml = screenFiles.filter((f) => f.dir === d.id).map((f) => f.html).join('\n');
  /* a root class (.pfx-x, not .pfx-x__part or .pfx-x--mod) is a new component, or a layout wrapper */
  const roots = [...new Set((allCss.replace(/\/\*[\s\S]*?\*\//g, '').match(/\.pfx-[\w-]+/g) || []).map((c) => c.slice(1)).filter((c) => !/__|--/.test(c)))];
  if (roots.length && !comps.length) E('direction', `direction ${d.id} adds new components (${roots.map((c) => `.${c}`).join(', ')}): name each in flow.json directions[].components — { "name": "Lead card", "class": "pfx-lead-card", "why": "…" } — so it is proposed to the design system when the design is locked`);
  else for (const c of roots.filter((r) => !comps.some((x) => x.class === r))) W('direction', `direction ${d.id}: .${c} is not in its components — a new component goes there (to be proposed); a layout wrapper can stay out`);
  for (const c of comps) {
    const ok = c.name && /^pfx-[\w-]+$/.test(c.class || '') && c.why;
    if (!ok) { E('direction', `direction ${d.id}: component ${JSON.stringify(c.name || c)} needs a name, its root class (pfx-…) and why the design system lacks it`); continue; }
    if (!new RegExp(`\\.${c.class}(?![\\w-])`).test(allCss)) E('direction', `direction ${d.id}: component “${c.name}” — no rule for .${c.class} in its CSS`);
    if (!new RegExp(`class="[^"]*\\b${c.class}(?![\\w-])`).test(screensHtml)) E('direction', `direction ${d.id}: component “${c.name}” — no screen draws .${c.class}`);
    proposed.push({ ...c, direction: d.id });
  }
}

/* ── 3c · the research behind the directions (research/research.json, research/README.md):
   gaps, competitors by fit and approved, Mobbin wide then deep, flows, rules, the capability
   matrix, trends and the ranked findings (qa/research.mjs) — and every finding a direction
   lists, marked on its screens (data-pf-fresh) ── */
const RES_FILE = join(DIR, 'research', 'research.json');
let research = null;
if (DIRS.length || existsSync(RES_FILE)) {
  if (!existsSync(RES_FILE)) E('research', `research/research.json is missing — directions start from the research: competitors, Mobbin, trends, fresh moves (kit/README.md → research)`);
  else { try { research = JSON.parse(read(RES_FILE)); } catch (e) { E('research', `research/research.json is not valid JSON: ${e.message}`); } }
}
let freshById = new Map();
if (research) {
  const r = checkResearch(research);
  for (const m of r.errors) E('research', m);
  for (const m of r.warnings) W('research', m);
  freshById = r.freshById;
  const board = join(DIR, 'research', 'board.html');
  if (!(existsSync(board) && statSync(board).mtimeMs >= statSync(RES_FILE).mtimeMs - 1000)) E('research', 'research/board.html is missing or older than research.json — node qa/board.mjs ' + relative(SKILL, DIR));
}
for (const d of ACTIVE) {
  const min = { existing: 0, competitor: 1, bold: 2 }[d.kind] || 0;
  if ((d.fresh || []).length < min) E('fresh', `direction ${d.id} (${d.kind}) draws at least ${min} fresh move${min > 1 ? 's' : ''} from the research — flow.json directions[].fresh`);
  if (min && research && !(d.fresh || []).some((f) => ['layout', 'hero'].includes((freshById.get(f) || {}).size))) E('fresh', `direction ${d.id} (${d.kind}) draws no fresh move that changes the layout or the hero — a detail added to A's screen is A again`);
  for (const f of d.fresh || []) {
    if (research && !freshById.has(f)) E('fresh', `direction ${d.id}: fresh move “${f}” is not in research.json`);
    if (!screenFiles.some((sf) => sf.dir === d.id && new RegExp(`\\sdata-pf-fresh="[^"]*\\b${f.replace(/[^\w-]/g, '')}\\b`).test(sf.html))) E('fresh', `direction ${d.id} lists the fresh move “${f}”, and no screen draws it — mark the element that does with data-pf-fresh="${f}"`);
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
    if (found && /kit\/kit\.css$/.test(found)) return '<link data-pf-kit>';   /* the kit, where the screen links it: before a direction's new.css */
    if (!found) return '';
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
    screens: screens.map((s) => {
      const filesFor = (d) => Object.fromEntries(PLATFORMS.map((p) => [p, fileOf(s, p, d) ? bundlePath(resolve(DIR, fileOf(s, p, d))) : null]).filter(([, v]) => v));
      return { id: s.id, title: s.title || s.id, route: s.route || '', size: s.size || null, files: filesFor(DIRLIST[0]), dirs: ACTIVE.length ? Object.fromEntries(DIRLIST.map((d) => [d, filesFor(d)])) : null };
    }),
    directions: ACTIVE.map((d) => ({ id: d.id, title: d.title || '', label: d.label || '', kind: d.kind, kindLabel: KIND[d.kind] || '', summary: d.summary || '', fresh: (d.fresh || []).map((f) => ({ id: f, title: (freshById.get(f) || {}).title || f })) })),
    board: (flow.research && flow.research.board_url) || (existsSync(join(DIR, 'research', 'board.html')) ? 'research/board.html' : null),
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
const LAYOUT = new Set(['align', 'controls', 'rows', 'overlap', 'clip', 'small', 'targets', 'skeleton', 'rail', 'unstyled', 'contrast', 'covered', 'squeezed', 'focus']);
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
  const railOf = new Map();          // a pf-base → its rail on the web: { w, keys }, held against the design's
  const headOf = new Map();          // a pf-base + platform → its header: { h }
  const sweep = { interactions: 0, extremes: 0, options: 0 };
  const sweepGaps = new Set();       // extremes that could change nothing: said, not counted
  const shapes = new Map();          // a direction → its main list's shape on the web, at the start
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
        headOf.set(base + '|' + pl, await page.evaluate(() => { const h = document.querySelector('.pf-layout-header'); return h ? { h: Math.round(h.getBoundingClientRect().height) } : null; }));
        if (pl === 'web') railOf.set(base, await page.evaluate(() => {
          const s = document.querySelector('.pf-layout-sider');
          return s ? { w: Math.round(s.getBoundingClientRect().width), keys: [...s.querySelectorAll('[data-menu-id]')].map((e) => e.getAttribute('data-menu-id').replace(/^rc-menu-uuid-\d+-\d+-/, '')) } : null;
        }));
      }
      await page.goto(pathToFileURL(OUT).href + '#shot');
      for (let t = 0; t < 120 && !(await page.evaluate(() => !!(window.__pfp))); t++) await new Promise((r) => setTimeout(r, 250));
      for (const dd of VDIRS) {
      /* each direction is a whole design: every state, the sweep, the extremes, the options */
      if (dd) await page.evaluate((x) => window.__pfp.dir(x), dd);
      const tag = (x) => (dd ? `${dd} › ` : '') + x;
      for (const s of VSTATES) {
        const st = await page.evaluate(([id, p]) => window.__pfp.go(id, p).then(() => true, (e) => String(e)), [s.id, pl]);
        const sf = screenFiles.find((f) => f.screen.id === (s.screen || screens[0].id) && f.platform === pl && f.dir === dd);
        const src0 = sf && sourcesOf(sf.html)[0];
        const res = await page.evaluate((o) => window.__pfp.qa(o), { rail: (src0 && railOf.get(src0)) || null, header: (src0 && headOf.get(src0 + '|' + pl)) || null });
        const runtime = [...new Set([...(res.errors || []), ...(res.frameErrors || [])])];
        for (const m of runtime) found.push({ level: 'error', check: 'runtime', message: 'the prototype errs: ' + m, state: tag(s.id), platform: pl });
        for (const d of new Set(res.dead || [])) found.push({ level: 'error', check: 'dead', message: `“${d}” was clicked and is not wired`, state: tag(s.id), platform: pl });
        for (const i of res.issues || []) {
          const product = LAYOUT.has(i.check) && baseline[pl].has(i.check + '|' + i.message);
          found.push({ ...i, level: product ? 'product' : i.level, state: tag(s.id), platform: pl });
        }
        if (st !== true) found.push({ level: 'error', check: 'runtime', message: `state "${s.id}" did not open: ${st}`, state: tag(s.id), platform: pl });
        if (dd && pl === 'web' && s.id === (flow.start || states[0].id)) shapes.set(dd, await page.evaluate(() => window.__pfp.shape()));
        if (shots) { const [w, h] = await page.evaluate(() => window.__pfp.size()); await page.screenshot({ path: join(REPORT, 'shots', `${dd ? dd + '.' : ''}${s.id}.${pl}.png`), clip: { x: 0, y: 0, width: w, height: h } }); }
      }
      /* the sweep, from each screen's first state: every control that opens something, the data
         at its extremes, every variant of an open design decision */
      const record = (res, where) => {
        const runtime = [...new Set([...(res.errors || []), ...(res.frameErrors || [])])];
        for (const m of runtime) found.push({ level: 'error', check: 'runtime', message: 'the prototype errs: ' + m, state: tag(where), platform: pl });
        for (const i of res.issues || []) {
          const product = LAYOUT.has(i.check) && baseline[pl].has(i.check + '|' + i.message);
          found.push({ ...i, level: product ? 'product' : i.level, state: tag(where), platform: pl });
        }
      };
      const shot = async (name) => { if (!shots) return; const [w, h] = await page.evaluate(() => window.__pfp.size()); await page.screenshot({ path: join(REPORT, 'shots', `${dd ? dd + '.' : ''}${name}.${pl}.png`), clip: { x: 0, y: 0, width: w, height: h } }); };
      /* interactions: every control that opens something, from the first state that shows it —
         a menu only a filtered or a per-row state reaches is opened there */
      const go = (id) => page.evaluate(([i, p]) => window.__pfp.go(i, p), [id, pl]);
      const swept = new Set();
      for (const s of VSTATES) {
        await go(s.id);
        const ts = await page.evaluate(() => window.__pfp.targets());
        for (const t of (Array.isArray(ts) ? ts : [])) {
          const k = t.kind + '|' + t.key;
          if (swept.has(k)) continue;
          swept.add(k);
          await go(s.id);
          const it = await page.evaluate((x) => window.__pfp.interact(x), t);
          record(await page.evaluate((x) => window.__pfp.qa({ interaction: x }), it), `${s.id} › ${t.label}`);
          await shot(`${s.id}.i${swept.size}-${t.kind}`);
          await page.evaluate(() => window.__pfp.closeShell());
          sweep.interactions++;
        }
      }
      /* the data at its extremes: each list from the state that shows its rows (its matrix
         default), whatever its empty state is; a render that changes nothing is not counted */
      const byState = new Map();
      for (const r of flow.matrix || []) {
        if (!r.list) continue;
        const d = (r.kinds || {}).default;
        const at = stateIds.has(d) ? d : (flow.start || states[0].id);
        if (!byState.has(at)) byState.set(at, { lists: [], rows: {} });
        byState.get(at).lists.push(r.list);
        if (Number.isInteger(r.row)) byState.get(at).rows[r.list] = r.row;
      }
      for (const [sid, g] of byState) for (const kind of ['missing', 'long', 'arabic', 'zero']) {
        if (!VSTATES.some((s) => s.id === sid)) continue;
        await page.evaluate(() => window.__pfp.reset());
        await go(sid);
        const res = await page.evaluate(([k, l, r]) => window.__pfp.extremes(k, l, r), [kind, g.lists, g.rows]);
        if (!res || !res.changed) { if (kind !== 'zero') sweepGaps.add(`${tag(sid)}: ${g.lists.join(', ')} had no ${kind === 'missing' ? 'value to remove' : 'text to change'} there — no row, or every field read by a condition`); continue; }
        record(await page.evaluate(() => window.__pfp.qa({})), `${sid} · ${kind} data`);
        await shot(`${sid}.x-${kind}`);
        sweep.extremes++;
      }
      /* the new copy, long and in Arabic, once for each set of it a state shows */
      const copySeen = new Set();
      for (const s of VSTATES) {
        await go(s.id);
        const texts = await page.evaluate(() => window.__pfp.newCopy());
        const sig = JSON.stringify(texts || []);
        if (!texts || !texts.length || copySeen.has(sig)) continue;
        copySeen.add(sig);
        for (const kind of ['copy-long', 'copy-arabic']) {
        await go(s.id);
        const res = await page.evaluate((k) => window.__pfp.extremes(k), kind);
        if (!res || !res.changed) break;
        record(await page.evaluate(() => window.__pfp.qa({})), `${s.id} · new copy ${kind === 'copy-long' ? 'long' : 'in Arabic'}`);
        await shot(`${s.id}.x-${kind}`);
        sweep.extremes++;
        await page.evaluate(() => window.__pfp.reset());
        }
      }
      /* every option variant, in the state it is drawn in (options[].state, else every state that
         sets its key, else the start), and the state reset after each */
      for (const o of flow.options || []) {
        const where = o.state ? [o.state] : states.filter((s) => s.set && o.key in s.set).map((s) => s.id);
        for (const sid of (where.length ? where : [flow.start || states[0].id]).filter((x) => VSTATES.some((s) => s.id === x))) for (const [v] of o.variants || []) {
          await go(sid);
          await page.evaluate(([k, x]) => window.__pfp.setVar(k, x), [o.key, v]);
          record(await page.evaluate(() => window.__pfp.qa({})), `${sid} · ${o.key}=${v}`);
          await shot(`${sid}.o-${String(o.key).replace(/\W+/g, '')}-${v}`);
          await page.evaluate(() => window.__pfp.reset());
          sweep.options++;
        }
      }
      }
      /* the directions measured against A: the same main list, drawn the same way (as many per
         row, as wide, about as tall), is the same layout whatever was added around it */
      const A = ACTIVE.find((d) => d.kind === 'existing'), sa = A && shapes.get(A.id);
      if (pl === 'web' && sa && !flow.chosen) for (const d of ACTIVE.filter((x) => x !== A)) {
        const sd = shapes.get(d.id);
        if (!sd || sd.perRow !== sa.perRow || Math.abs(sd.width - sa.width) > 0.2 || Math.abs(sd.height - sa.height) / Math.max(sd.height, sa.height) > 0.25) continue;
        const msg = `direction ${d.id} draws its main list (“${sd.list}”) as A does: ${sd.perRow} per row, ${Math.round(sd.width * 100)}% wide, ${sd.height} px tall against A's ${Math.round(sa.width * 100)}% and ${sa.height} px — the same layout with things added around it`;
        found.push({ level: d.kind === 'bold' ? 'error' : 'warn', check: 'alike', message: msg + (d.kind === 'bold' ? '. Bold changes the layout: cards in a grid, a list beside its detail, a feed of rich cards (kit/README.md → visual elements)' : ''), state: `${d.id} › ${flow.start || states[0].id}`, platform: pl });
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
  for (const g of sweepGaps) merged.set('gap|' + g, { level: 'warn', check: 'sweep', platform: '', message: `extreme data not tried: ${g}`, box: null, states: [] });
  const list = [...merged.values()].sort((a, b) => ({ error: 0, warn: 1, product: 2 }[a.level] - { error: 0, warn: 1, product: 2 }[b.level]));
  const nd = DIRLIST.length;
  const nv = VDIRS.length;
  const coverage = `${VSTATES.length} states × ${PLATFORMS.length} platform${PLATFORMS.length > 1 ? 's' : ''}${nv > 1 ? ` × ${nv} directions` : ''} · ${sweep.interactions} interactions · ${sweep.extremes} extreme-data · ${sweep.options} option renders${PARTIAL ? ` — PARTIAL: ${PARTIAL}` : ''}`;
  return { ran: true, browser: b.name, renders: VSTATES.length * PLATFORMS.length * nv + sweep.interactions + sweep.extremes + sweep.options, coverage, issues: list };
}

/* ── run ─────────────────────────────────────────────────────────────── */
const staticIssues = [...errors, ...warns];
let qa = { ran: false, note: 'building' };
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, build({ ran: false, note: 'QA running', errors: 0, warnings: 0 }));
const v = errors.length && errors.some((e) => ['flow', 'coverage', 'files'].includes(e.check)) ? { ran: false, note: 'the static checks failed first' } : await visual();
const all = [...staticIssues.map((i) => ({ ...i, platform: '', states: [] })), ...(v.issues || [])];
const nErr = all.filter((i) => i.level === 'error').length, nWarn = all.filter((i) => i.level === 'warn').length, nProd = all.filter((i) => i.level === 'product').length;
qa = { ran: !!v.ran, note: v.note || '', browser: v.browser || '', renders: v.renders || 0, coverage: v.coverage || '', errors: nErr, warnings: nWarn, product: nProd, issues: all.slice(0, 80), built: new Date().toISOString(), directions: DIRLIST.filter(Boolean), chosen: flow.chosen || null, newTokens };
writeFileSync(OUT, build(PARTIAL ? { ...qa, ran: false, note: `a partial QA (${PARTIAL}): run it whole before sharing` } : qa));
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
    ...screenFiles.map((sf) => `| ${sf.screen.title || sf.screen.id} (${sf.screen.route || ''})${sf.dir ? ' · ' + sf.dir : ''} | ${sf.platform} | \`${relative(DIR, sf.abs)}\` | ${sourcesOf(sf.html).map((x) => `\`${x}\``).join(', ') || '—'} |`), '',
    ...(ACTIVE.length ? ['## Directions', '', flow.chosen ? `Chosen: **${flow.chosen}**. The others stay in the design's folder.` : 'Gate 1: pick one, or mix them.', '',
      ...ACTIVE.flatMap((d) => [`### ${d.id} · ${d.title || ''} — ${KIND[d.kind] || d.kind}`, '', d.summary || '', '', ...(d.fresh || []).map((f) => { const x = freshById.get(f) || {}; return `- finding: ${x.title || f}${x.impact ? ` (${x.impact} impact, ${x.effort} effort; lands: ${x.lands})` : ''}`; }),
        ...newTokens.filter((t) => t.dir === d.id).map((t) => `- [new] token \`${t.name}: ${t.value}\` — ${t.why} (designer sign-off)`), '']),
      research ? `Research: \`research/board.html\`${flow.research && flow.research.board_url ? ` (${flow.research.board_url})` : ''}: ${(research.gaps || []).length} gaps, ${(research.competitors || []).filter((c) => c.status === 'shortlist').length} competitors shortlisted, ${(research.flows || []).length} flows, ${(research.rules || []).length} rules, ${(research.mobbin || []).length} Mobbin references, ${(research.trends || []).length} trends, ${(research.fresh || []).length} ranked findings. The summary: \`research/summary.md\`.` : '', ''] : []),
    '## States', '', '| state | group | what it shows |', '|---|---|---|',
    ...states.map((s) => `| ${s.title || s.id} (\`${s.id}\`) | ${s.group || ''} | ${(s.notes || '').replace(/\|/g, '\\|')} |`), '',
    '## State matrix', '', '| region | ' + ['default', 'loading', 'empty', 'no-results', 'error', 'first-use'].join(' | ') + ' |', '|---|---|---|---|---|---|---|',
    ...matrix.map((r) => `| ${r.region} | ` + ['default', 'loading', 'empty', 'no-results', 'error', 'first-use'].map((k) => (r.kinds || {})[k] || '—').join(' | ') + ' |'), '',
    '## New copy — English, Arabic to come', '', '| English | platforms | Arabic |', '|---|---|---|',
    ...[...copy].map(([t, p]) => `| ${t.replace(/\|/g, '\\|')} | ${[...p].join(', ')} | [TBC] |`), '',
    ...(proposed.length ? ['## Proposed components — new to the design system', '', ...proposed.map((c) => `- **${c.name}** (\`.${c.class}\`, direction ${c.direction}): ${c.why}${c.based_on ? ` — based on ${c.based_on}` : ''}`), ''] : []),
    ...(standins.size ? ['## Stand-ins — placeholders for a step the product hands on', '', ...[...standins].map(([w, at]) => `- **${w}**: ${[...at].join(', ')} [TBC]`), ''] : []),
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
/* every run, logged: the retro (qa/retro.mjs) reads how many runs a design took and what failed */
try {
  const byCheck = {};
  for (const i of all) if (i.level === 'error') byCheck[i.check] = (byCheck[i.check] || 0) + 1;
  appendFileSync(join(REPORT, 'runs.jsonl'), JSON.stringify({ at: new Date().toISOString(), ran: qa.ran, partial: PARTIAL || null, errors: nErr, warnings: nWarn, coverage: qa.coverage || '', checks: byCheck, directions: DIRLIST.filter(Boolean), chosen: flow.chosen || null }) + '\n');
} catch (e) { /* a read-only folder: the run still counts */ }
if (nErr) { log(`  → fix the errors and run again. Until QA passes, the ${name} says “not ready to share”.`); process.exit(1); }
if (PARTIAL && qa.ran) { log(`  → the partial QA (${PARTIAL}) passed. Run it whole, without --only and --state, before delivering.`); process.exit(5); }
if (!qa.ran) { log(`  → built, but the visual QA did not run here. Deliver it saying so, and ask for the QA button in the ${name} to be pressed.`); process.exit(3); }
log(`  → QA passed. Deliver ${relative(process.cwd(), OUT)}.`);
