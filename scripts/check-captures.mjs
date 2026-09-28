#!/usr/bin/env node
/**
 * Refuse to build a page from a capture that rendered nothing.
 *
 * WHY THIS EXISTS
 * Twenty-five routes are captured and twelve of them are EMPTY SHELLS. Their
 * endpoints answer `{}`, so the product paints its chrome and no content:
 *
 *   agency-staff     0 table rows   3 cards
 *   credits-usage    0 table rows   2 cards
 *   reports-summary  0 table rows   3 cards
 *
 * A capture like that is worse than no capture, because it looks like one.
 * Every value taken from it would be invented, which is exactly how this
 * system got a fabricated calendar and a credits table the product does not
 * have. So: a route is BUILDABLE only when its capture carries content, and
 * this says which do.
 *
 *   node scripts/check-captures.mjs           every route
 *   node scripts/check-captures.mjs --strict  exit non-zero if any are empty
 *
 * It is deliberately crude. It counts what a screen is made of — rows, form
 * items, cards, controls — and a screen with none of them did not render.
 *
 * A SECOND WAY A CAPTURE LIES, and the one that cost nine pages: it renders
 * fine but is OLDER THAN THE FIXTURE it is supposed to picture. Eight routes
 * were captured before the account enabled push notifications, so their header
 * has no bell — four of them hold no ant-badge anywhere. Nothing noticed,
 * because qa-design blamed the pages: it reported shell.header at 8.5% on
 * every one of them and 100% on the two routes captured a day later. The
 * header is identical on every route, so a per-route disagreement about it can
 * only be the reference. Hence the header column below: a capture whose header
 * does not match the rest of the set is stale, and stale is rejected here
 * rather than discovered three days downstream.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const LIVE = join(ROOT, 'data', 'live');
const strict = process.argv.includes('--strict');

/* the shell alone is about a hundred nodes; anything near that painted chrome
   and stopped */
const SHELL_ONLY = 140;

const COUNTS = {
  rows: /^ant-table-row$/,
  fields: /^ant-form-item$|^ant-input$|^ant-select$|^ant-picker$/,
  cards: /^ant-card$/,
  controls: /^ant-btn$/,
  charts: /^recharts-surface$|^chartjs/,
  empty: /^ant-empty$|^ant-result$/,
};

/* The header is the same component on every route, so its shape is a constant
   the whole set has to agree on. Counting inside ant-layout-header only:
   buttons (Download App, Post Listing, the bell, the avatar) and the bell's
   own ant-badge-count. */
const headerOf = (tree) => {
  let head = null;
  const find = (n) => { if (head) return; if ((n.class || []).includes('ant-layout-header')) { head = n; return; } (n.children || []).forEach(find); };
  find(tree);
  if (!head) return null;
  const h = { buttons: 0, badges: 0 };
  const walk = (n) => {
    const c = n.class || [];
    if (n.tag === 'button' || c.includes('ant-btn')) h.buttons++;
    if (c.includes('ant-badge-count')) h.badges++;
    (n.children || []).forEach(walk);
  };
  walk(head);
  return h;
};

const tally = (tree) => {
  const t = Object.fromEntries(Object.keys(COUNTS).map((k) => [k, 0]));
  const walk = (n) => {
    for (const c of n.class || []) for (const [k, re] of Object.entries(COUNTS)) if (re.test(c)) t[k]++;
    (n.children || []).forEach(walk);
  };
  walk(tree);
  return t;
};

/* A ROUTE THAT DOES NOT EXIST redirects, and the capture is of whatever it
   landed on. /user-settings/bank-detail captured 309 nodes and a form
   identical to user-profile's, because SHOW_BANK_DETAIL is false for this
   tenant and the route falls through. A capture like that passes every content
   check and describes the wrong screen, so: two routes whose trees are
   identical are one route and a redirect. */
const shapeOf = (tree) => {
  const parts = [];
  const walk = (n, d) => { if (d > 6) return; parts.push(n.tag + ':' + Math.round(n.box?.w || 0) + 'x' + Math.round(n.box?.h || 0)); (n.children || []).forEach((k) => walk(k, d + 1)); };
  walk(tree, 0);
  return parts.join('|');
};

const routes = [...new Set(readdirSync(LIVE)
  .filter((f) => /\.capture\.json$/.test(f))
  .map((f) => f.replace(/\.capture\.json$/, ''))
  .filter((r) => !r.includes('--') && !r.endsWith('.real') && !r.endsWith('.rtl')))].sort();

/* WHICH TWIN IS THE REAL ROUTE. Two captures with the same shape are one
   screen reached two ways, and the loop below used to call whichever it read
   first the original — alphabetical order, which made /user-settings the
   "real" route and /user-settings/user-profile the redirect. It is the other
   way round: /user-settings lands ON user-profile. So when one route's slug is
   a prefix of the other's, the SPECIFIC one is the route and the short one is
   the alias; otherwise the first alphabetically stands. */
const canon = new Map();
{
  const groups = new Map();
  for (const r of routes) {
    const cap = JSON.parse(readFileSync(join(LIVE, `${r}.capture.json`), 'utf8'));
    const sh = shapeOf(cap.tree);
    (groups.get(sh) || groups.set(sh, []).get(sh)).push(r);
  }
  for (const [sh, rs] of groups) canon.set(sh, rs.slice().sort((a, b) => b.length - a.length)[0]);
}

console.log('\n  route                          nodes  rows fields cards  header  verdict');
const empty = [];
const dupes = [];
const stale = [];
const shapes = new Map();
const heads = [];
for (const r of routes) {
  const cap = JSON.parse(readFileSync(join(LIVE, `${r}.capture.json`), 'utf8'));
  const t = tally(cap.tree);
  const head = headerOf(cap.tree);
  if (head) heads.push([r, head, cap.capturedAt]);
  /* a page has content when it renders DATA (rows, a chart) or a FORM, or when
     it deliberately renders an empty state — the product's own "no records"
     card is content, and a page that shows it is buildable */
  const shape = shapeOf(cap.tree);
  const real = canon.get(shape);
  const twin = real === r ? null : real;
  if (twin) dupes.push([r, twin]); else shapes.set(shape, r);
  const has = t.rows > 0 || t.fields >= 3 || t.charts > 0 || t.empty > 0;
  const verdict = twin ? `REDIRECT — identical to ${twin}` : has ? 'buildable'
    : cap.nodes < SHELL_ONLY ? 'EMPTY — shell only, needs fixtures'
      : 'EMPTY — chrome but no content, needs fixtures';
  if (!has && !twin) empty.push(r);
  console.log('  ' + r.padEnd(30) + String(cap.nodes).padStart(5)
    + String(t.rows).padStart(6) + String(t.fields).padStart(7) + String(t.cards).padStart(6)
    + (head ? `  ${head.buttons}b ${head.badges}×` : '     — ').padStart(8)
    + '  ' + verdict);
}

/* THE HEADER HAS TO AGREE ACROSS THE SET, and the NEWEST capture is the one
   that agrees with the fixture, because the fixture only moves forward.
   Not a majority vote: the first cut of this took the commonest shape as the
   truth and named the ten CURRENT captures stale, because fourteen routes
   nobody had re-run outvoted them. Not a constant written down here either —
   that would be one more value nobody measured. The most recent render wins,
   and everything older that disagrees is named with its date. */
if (heads.length > 1) {
  const byDate = [...heads].sort((a, b) => String(b[2] || '').localeCompare(String(a[2] || '')));
  const [newest, nh, nat] = byDate[0];
  const key = (h) => `${h.buttons}b ${h.badges}×`;
  const want = key(nh);
  for (const [r, h, at] of byDate.slice(1)) if (key(h) !== want) stale.push([r, key(h), at]);
  if (stale.length) {
    console.log(`\n  header: ${want} (buttons, ant-badge-count) — ${newest}, captured ${nat}.`);
    console.log('  STALE — these disagree, and the header does not differ by route:');
    for (const [r, k, at] of stale) console.log(`    ${r.padEnd(30)} ${k.padEnd(8)} captured ${at || 'unknown'}`);
    console.log('  Re-capture them: the fixture changed after they were taken.');
  }
}

console.log(`\n  ${routes.length - empty.length - dupes.length} buildable · ${empty.length} need fixtures · ${dupes.length} redirect elsewhere\n`);
for (const [a, b] of dupes) console.log(`  ${a} is ${b} under another name — the route does not exist for this tenant`);
if (empty.length) console.log('  ' + empty.join('\n  ') + '\n');
if (strict && (empty.length || dupes.length || stale.length)) process.exit(1);
