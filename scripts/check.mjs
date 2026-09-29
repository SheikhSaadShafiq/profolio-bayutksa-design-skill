#!/usr/bin/env node
/**
 * The invariants — one check per claim the design system makes.
 *
 * The pages are compiled from the product now (scripts/compile.mjs), so the
 * old checks — "no raw colour outside :root", "no style attribute in a page",
 * "every class is catalogued" — no longer describe anything true: a compiled
 * page carries the product's own literals and inline styles because that is
 * what the product paints with. What the system claims instead is that every
 * page IS the product, every component IS the element it was cut from, and
 * nothing real leaked into any of it. Each of those is checked here.
 *
 *   node scripts/check.mjs
 *
 * Exits non-zero on any FAIL; a warn is printed and does not fail.
 */
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const D = join(ROOT, 'deliverables');
const fails = [], warns = [];
const ok = (m) => console.log(`  ok    ${m}`);
const bad = (m) => { fails.push(m); console.log(`  FAIL  ${m}`); };
const warn = (m) => { warns.push(m); console.log(`  warn  ${m}`); };
const json = (p) => (existsSync(join(ROOT, p)) ? JSON.parse(readFileSync(join(ROOT, p), 'utf8')) : null);

/* ── 1 · every path the maintainer's table (MAINTAINING.md) routes to ───── */
const skill = readFileSync(join(ROOT, 'MAINTAINING.md'), 'utf8');
let checked = 0;
for (const [, path, blurb] of skill.matchAll(/^\|\s*`([^`]+)`\s*\|(.+)\|$/gm)) {
  if (!/^(kb|deliverables|data|harness|authoring|scripts)\//.test(path)) continue;
  checked++;
  const probe = path.includes('<') ? dirname(path) : path;
  const full = join(ROOT, probe);
  const conditional = /if one has been captured|empty until|check it exists|until someone/i.test(blurb);
  if (!existsSync(full)) { conditional ? warn(`${path} — absent, and the table says so`) : bad(`${path} — MAINTAINING.md routes here and it does not exist`); continue; }
  if (statSync(full).isDirectory() && readdirSync(full).length === 0) { conditional ? warn(`${path} — empty, and the table says so`) : bad(`${path} — MAINTAINING.md routes here and it is empty`); continue; }
}
ok(`MAINTAINING.md — ${checked} routed paths resolve`);
/* …and every path the skill's own router (skill/SKILL.md) names, once the
   package is built (npm run package) */
if (existsSync(join(ROOT, 'skill', 'registry.json'))) {
  const router = readFileSync(join(ROOT, 'skill', 'SKILL.md'), 'utf8');
  let routed = 0;
  for (const [, path] of router.matchAll(/`((?:registry\.json|tokens\.md|(?:product|atoms|qa|css)\/[\w./<>-]+))`/g)) {
    routed++;
    const probe = path.includes('<') ? dirname(path) : path;
    if (!existsSync(join(ROOT, 'skill', probe))) bad(`skill/${path} — skill/SKILL.md routes here and it does not exist`);
  }
  ok(`skill/SKILL.md — ${routed} routed paths resolve`);
}

/* ── 2 · the compiled pages ───────────────────────────────────────────────
   Each one: compiled (the meta says from which route and state), linked to
   the one stylesheet or knowingly self-contained, needing nothing from the
   network, and scored against the product it was compiled from. */
/* web pages at the top and in states/; the responsive layout under mobile/ */
const htmlIn = (rel) => (existsSync(join(D, rel)) ? readdirSync(join(D, rel)).filter((f) => f.endsWith('.html')).map((f) => [join(D, rel, f), rel + f]) : []);
const compiled = [...htmlIn(''), ...htmlIn('states/'), ...htmlIn('mobile/'), ...htmlIn('mobile/states/')]
  .filter(([f]) => /<meta name="pf-compiled"/.test(readFileSync(f, 'utf8').slice(0, 8000)));
const pixel = json('data/qa/compile.json');
const sheet = json('data/qa/stylesheet.json');
const scored = new Map((pixel?.rows || []).map((r) => [r.name, r]));
const linkedOk = new Map((sheet?.rows || []).map((r) => [r.name, r]));
let linked = 0, inline = 0, over = [], unscored = [], net = [];
for (const [file, rel] of compiled) {
  const html = readFileSync(file, 'utf8');
  /* the ledgers name a responsive page <page>--mobile */
  const name = rel.replace(/^(mobile\/)?(states\/)?/, '').replace(/\.html$/, '') + (rel.startsWith('mobile/') ? '--mobile' : '');
  if (/<link rel="stylesheet" href="(\.\.\/)*profolio(\.mobile)?\.css">/.test(html)) linked++; else inline++;
  const head = html.slice(0, html.indexOf('</head>'));
  if (/(href|src)="https?:\/\//.test(head) || /<(img|script|iframe|link)[^>]+(src|href)="https?:\/\//.test(html)) net.push(rel);
  const s = scored.get(name);
  if (!s) unscored.push(rel); else if (s.pct > (pixel.bar ?? 0.5)) over.push(`${rel} ${s.pct}%`);
}
const nMob = compiled.filter(([, rel]) => rel.startsWith('mobile/')).length;
compiled.length ? ok(`${compiled.length - nMob} compiled web pages and states${nMob ? `, ${nMob} responsive` : ''}`) : bad('no compiled page in deliverables/ — run npm run pages');
over.length ? bad(`${over.length} compiled page(s) over the ${pixel?.bar}% pixel bar: ${over.slice(0, 4).join(', ')}`) : ok(`every compiled page within ${pixel?.bar ?? 0.5}% of the product it was compiled from`);
unscored.length ? warn(`${unscored.length} compiled page(s) never scored: ${unscored.slice(0, 4).join(', ')}`) : ok('every compiled page has a score');
net.length ? bad(`${net.length} page(s) load something over the network: ${net.slice(0, 3).join(', ')}`) : ok('no compiled page needs the network');
ok(`${linked} pages on their layout's stylesheet (profolio.css, profolio.mobile.css), ${inline} self-contained`);
if (sheet) {
  const off = sheet.rows.filter((r) => !r.ok);
  off.length ? warn(`${off.length} page(s) differ on the shared stylesheet and stay self-contained: ${off.map((r) => r.name).join(', ')}`) : ok(`profolio.css — ${sheet.rules} rules${sheet.rulesMobile ? `, profolio.mobile.css — ${sheet.rulesMobile}` : ''}; every page renders the same on its sheet`);
} else warn('data/qa/stylesheet.json missing — run node scripts/ds/stylesheet.mjs');

/* ── 3 · the components are the elements they were cut from ──────────────── */
const comp = json('data/qa/components.json');
if (!comp) warn('data/qa/components.json missing — run node scripts/ds/catalogue.mjs');
else {
  /* the gate is on COMPONENTS — atoms, molecules, organisms, templates. A
     page section is a whole page cut out, and the pages are already held to
     the product one by one above; counting them here would count them twice */
  const rs = Object.values(comp.results).filter((r) => r.level !== 'page' && !Number.isNaN(r.pct) && r.pct !== null);
  const okN = rs.filter((r) => r.ok).length, near = rs.filter((r) => r.pct <= 2).length;
  const pct = (okN / Math.max(1, rs.length)) * 100;
  const split = ['web', 'mobile'].map((d) => { const x = rs.filter((r) => (r.device || 'web') === d); return x.length ? `${d === 'web' ? 'web' : 'responsive'} ${x.filter((r) => r.ok).length}/${x.length}` : ''; }).filter(Boolean).join(' · ');
  pct >= 88 ? ok(`${okN} of ${rs.length} component variants match their in-page reference within ${comp.bar}% (${pct.toFixed(1)}%; ${near} within 2%; ${split})`)
    : bad(`only ${okN} of ${rs.length} component variants match their in-page reference (${pct.toFixed(1)}%, gate 88%; ${split})`);
}
if (existsSync(join(D, 'design-system.html'))) {
  const idx = readFileSync(join(D, 'design-system.html'), 'utf8');
  const hrefs = [...idx.matchAll(/(?:href|src)="((?:components|states|mobile)\/[^"#]+|[\w-]+\.html)"/g)].map((m) => m[1]);
  const dead = [...new Set(hrefs)].filter((h) => !existsSync(join(D, h)));
  dead.length ? bad(`design-system.html links ${dead.length} file(s) that do not exist: ${dead.slice(0, 4).join(', ')}`) : ok(`design-system.html — ${new Set(hrefs).size} links, all resolve`);
} else bad('deliverables/design-system.html missing — run node scripts/ds/catalogue.mjs');

/* ── 4 · nothing real leaked ───────────────────────────────────────────────
   Real-account captures are geometry only (leaks.mjs is re-proved by
   test-capture.mjs over every one); api-shapes.json is keys and types only.
   The compiled pages only ever render the FIXTURE account, so they carry
   none of it by construction — this checks the shapes file structurally. */
const shapes = json('data/api-shapes.json');
if (shapes) {
  const LEAF = /^(number|boolean|null|undefined|string\(\d+\)|\{…\}|×\d+|"[a-z][a-z0-9_-]{0,30}")$/;
  let badLeaf = 0;
  const walk = (v, q) => { if (q && Array.isArray(v)) return; if (Array.isArray(v)) return v.forEach((x) => walk(x)); if (v && typeof v === 'object') return Object.entries(v).forEach(([k, x]) => walk(x, k === 'q')); if (!LEAF.test(String(v))) badLeaf++; };
  walk(shapes);
  badLeaf ? bad(`data/api-shapes.json carries ${badLeaf} value(s) that are not a type, length or slug`) : ok(`data/api-shapes.json — ${Object.keys(shapes).length} endpoints, keys and types only`);
}
const realPng = existsSync(join(ROOT, 'data', 'live')) ? readdirSync(join(ROOT, 'data', 'live')).filter((f) => f.endsWith('.real.png')) : [];
realPng.length ? warn(`${realPng.length} real-account screenshot(s) in data/live — .gitignore keeps them out of git; delete them when done`) : ok('no real-account screenshot on disk');

/* ── 5 · the fixtures answer in the real API's shape ─────────────────────── */
if (shapes) {
  const { answer } = await import('../harness/fixtures.mjs');
  let off = 0;
  const miss = [];
  for (const k of Object.keys(shapes)) {
    const [m, p] = k.split(' ');
    if (!p.startsWith('/api/')) continue;
    if (answer(m, p.replace(/:id/g, '1'), '') === undefined) { off++; miss.push(k); }
  }
  off ? warn(`${off} recorded endpoint(s) the fixtures do not answer: ${miss.slice(0, 4).join(', ')}`) : ok('the fixtures answer every endpoint the real API was seen to serve');
}

/* ── 6 · the skill measures with the antd the product ships ──────────────── */
const lockPath = join(ROOT, '..', 'profolio-reactjs', 'yarn.lock');
if (existsSync(lockPath)) {
  const m = /^antd@[^\n]*:\n  version "([^"]+)"/m.exec(readFileSync(lockPath, 'utf8'));
  const ours = JSON.parse(readFileSync(join(ROOT, 'node_modules/antd/package.json'), 'utf8')).version;
  if (m && m[1] !== ours) bad(`skill has antd ${ours}, the product's yarn.lock pins ${m[1]} — npm i antd@${m[1]} --save-exact`);
  else if (m) ok(`antd ${ours} matches the product's lockfile`);
} else warn('product yarn.lock not found beside this repo — antd version parity not checked');

/* ── 7 · the knowledge base is content, not chrome ───────────────────────── */
const KB = join(ROOT, 'kb');
if (existsSync(KB)) {
  const walkKb = (d) => readdirSync(d).flatMap((n) => { const p = join(d, n); return statSync(p).isDirectory() ? walkKb(p) : [p]; });
  const pages = walkKb(KB).filter((f) => f.endsWith('.html') && !f.endsWith('.board.html'));
  const leaking = pages.filter((f) => /<style[\s>]|<script[\s>]/i.test(readFileSync(f, 'utf8')));
  leaking.length ? bad(`${leaking.length} kb page(s) carry inline style or script: ${leaking.slice(0, 3).map((f) => f.slice(KB.length + 1)).join(', ')}`) : ok(`kb/ — ${pages.length} pages, none inline a style or script`);
}

/* ── 8 · the design knowledge base knows every compiled file ─────────────── */
const dkb = json('data/design-kb.json');
if (!dkb) warn('data/design-kb.json missing — run node scripts/ds/design-kb.mjs');
else {
  const known = new Set(dkb.screens.flatMap((x) => [x.files.web, x.files.responsive, ...x.states.flatMap((st) => [st.files.web, st.files.responsive])]).filter(Boolean));
  const unknown = compiled.map(([, rel]) => `deliverables/${rel}`).filter((f) => !known.has(f));
  unknown.length ? bad(`${unknown.length} compiled file(s) the design knowledge base does not know — rerun node scripts/ds/design-kb.mjs: ${unknown.slice(0, 3).join(', ')}`)
    : ok(`design knowledge base — ${dkb.counts.states} states over ${dkb.counts.screens} screens; every compiled file is in it`);
  const noPage = dkb.screens.filter((x) => !existsSync(join(ROOT, 'kb', 'screens', `${x.slug}.html`)));
  if (noPage.length) bad(`kb/screens/ lacks ${noPage.length} screen page(s): ${noPage.map((x) => x.slug).join(', ')}`);
}
existsSync(join(D, 'design-qa.html')) ? ok('deliverables/design-qa.html — the Design QA report is there') : warn('deliverables/design-qa.html missing — run npm run qa');

console.log(`\n  ${fails.length} fail · ${warns.length} warn`);
if (fails.length) process.exit(1);
