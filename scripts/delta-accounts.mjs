#!/usr/bin/env node
/**
 * What a second real account shows that the first one does not.
 *
 * One account is one set of accidents: its role, its package, its listings'
 * states, the features switched on for it. Every one of those decides what
 * renders, and a design system taken from one account inherits its accidents
 * as rules. A second account is the cheapest way to find the cases the first
 * never showed — a staff user's role-gated controls, an individual seller's
 * navigation, a status no listing of ours was ever in.
 *
 * Both accounts are recorded the privacy-safe way (scripts/receive-real.mjs):
 * captures are geometry and class names only, API shapes are keys, types and
 * enum slugs only. So is this report.
 *
 *   node scripts/delta-accounts.mjs b        account "b" against the first account
 *
 * Reads  data/api-shapes.json, data/api-shapes.<b>.json,
 *        data/live/<page>.real.capture.json, data/live/<page>.real-<b>.capture.json
 * Writes data/qa/delta-<b>.json
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ALL } from './pages-list.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const acct = (process.argv[2] || '').replace(/[^a-z0-9]/g, '');
if (!acct) { console.error('usage: delta-accounts.mjs <account>   e.g. b'); process.exit(2); }
const read = (p) => (existsSync(join(ROOT, p)) ? JSON.parse(readFileSync(join(ROOT, p), 'utf8')) : null);

/* ── the API: endpoints, keys and enum values only the second account has ── */
const A = read('data/api-shapes.json') || {}, B = read(`data/api-shapes.${acct}.json`) || {};
const api = { onlyB: Object.keys(B).filter((k) => !(k in A)), onlyA: Object.keys(A).filter((k) => !(k in B)), keys: [], enums: [] };
const walk = (a, b, at, ep) => {
  if (Array.isArray(b)) { if (Array.isArray(a) && a.length && b.length) walk(a[0], b[0], `${at}[]`, ep); else if (b.length && (!Array.isArray(a) || !a.length)) api.keys.push({ ep, at: `${at}[] (items)` }); return; }
  if (b && typeof b === 'object') {
    for (const k of Object.keys(b)) {
      if (k === 'q') continue;
      if (!a || typeof a !== 'object' || !(k in a)) { api.keys.push({ ep, at: `${at}.${k}` }); continue; }
      walk(a[k], b[k], `${at}.${k}`, ep);
    }
    return;
  }
  if (typeof b === 'string' && /^"/.test(b) && b !== a) api.enums.push({ ep, at, a: a ?? '—', b });
};
for (const k of Object.keys(B)) if (k in A) walk(A[k].shape, B[k].shape, '', k);

/* ── the screens: what each page draws, by class, and how much ─────────── */
const inventory = (cap) => {
  const cls = new Map();
  let nodes = 0;
  const visit = (n) => {
    nodes++;
    for (const c of n.class || []) if (!/^(css-|sc-|styleProfolio$)/.test(c) && !/[0-9a-f]{6,}/i.test(c)) cls.set(c, (cls.get(c) || 0) + 1);
    for (const k of n.children || []) visit(k);
  };
  visit(cap.tree);
  return { nodes, height: cap.viewport?.page?.h, cls };
};
const pages = [];
for (const slug of Object.keys(ALL)) {
  const a = read(`data/live/${slug}.real.capture.json`), b = read(`data/live/${slug}.real-${acct}.capture.json`);
  if (!b) continue;
  const ib = inventory(b), ia = a ? inventory(a) : { nodes: 0, height: 0, cls: new Map() };
  const only = [...ib.cls.entries()].filter(([c]) => !ia.cls.has(c)).sort((x, y) => y[1] - x[1]);
  const gone = [...ia.cls.entries()].filter(([c]) => !ib.cls.has(c)).sort((x, y) => y[1] - x[1]);
  const COUNT = ['ant-card', 'ant-table-row', 'ant-btn', 'ant-tag', 'ant-menu-item', 'ant-tabs-tab', 'ant-input', 'ant-select', 'ant-empty', 'ant-alert', 'ant-badge', 'ant-avatar', 'ant-statistic'];
  pages.push({
    page: slug, compared: !!a, nodes: [ia.nodes, ib.nodes], height: [ia.height, ib.height],
    counts: Object.fromEntries(COUNT.map((c) => [c, [ia.cls.get(c) || 0, ib.cls.get(c) || 0]]).filter(([, [x, y]]) => x !== y)),
    onlyB: only.slice(0, 40).map(([c, n]) => `${c}×${n}`),
    onlyA: gone.slice(0, 20).map(([c, n]) => `${c}×${n}`),
  });
}

mkdirSync(join(ROOT, 'data', 'qa'), { recursive: true });
writeFileSync(join(ROOT, 'data', 'qa', `delta-${acct}.json`), JSON.stringify({ at: new Date().toISOString(), account: acct, api, pages }, null, 1));

console.log(`\n  API — account ${acct} against the first account`);
console.log(`    endpoints only ${acct} calls: ${api.onlyB.length ? api.onlyB.join(', ') : 'none'}`);
console.log(`    endpoints only the first calls: ${api.onlyA.length}`);
console.log(`    keys only ${acct}'s answers carry: ${api.keys.length}`);
for (const k of api.keys.slice(0, 30)) console.log(`      ${k.ep}  ${k.at}`);
console.log(`    enum values that differ: ${api.enums.length}`);
for (const e of api.enums.slice(0, 40)) console.log(`      ${e.ep}  ${e.at}: ${e.a} → ${e.b}`);
console.log(`\n  Screens`);
for (const p of pages) {
  console.log(`    ${p.page.padEnd(30)} nodes ${p.nodes[0]}→${p.nodes[1]}  height ${p.height[0]}→${p.height[1]}${p.compared ? '' : '  (no first-account capture)'}`);
  if (Object.keys(p.counts).length) console.log(`      counts: ${Object.entries(p.counts).map(([c, [x, y]]) => `${c.replace('ant-', '')} ${x}→${y}`).join(' · ')}`);
  if (p.onlyB.length) console.log(`      only ${acct}: ${p.onlyB.slice(0, 16).join(' ')}`);
  if (p.onlyA.length) console.log(`      only first: ${p.onlyA.slice(0, 10).join(' ')}`);
}
console.log(`\n  data/qa/delta-${acct}.json\n`);
