#!/usr/bin/env node
/**
 * Hold harness/fixtures.mjs to the shape of the real API.
 *
 * The fixture account is how every compiled page gets its data, and a fixture
 * that answers in last year's shape does not fail — the product renders what
 * it can and leaves the rest blank. That is how Credits Usage came to say
 * "for undefined" on every history card and show a breakdown with no labels:
 * Surge renamed name → title and credits → credits_quantity, and the fixture
 * kept answering the old way. The page still compiled pixel-perfect — to a
 * product showing broken data.
 *
 * data/api-shapes.json is what the real API answers, recorded as keys and
 * types from a signed-in session (scripts/receive-real.mjs — no values). This
 * compares every fixture answer to it:
 *
 *   missing   a key the real API sends and the fixture does not — the product
 *             reads it, so something on screen is blank or wrong
 *   type      the same key, a different kind of value
 *   empty     the real API sends items, the fixture an empty list
 *   extra     a key only the fixture sends (usually harmless; listed last)
 *
 *   node scripts/check-fixtures.mjs              every endpoint
 *   node scripts/check-fixtures.mjs --strict     exit non-zero on missing/type
 *   node scripts/check-fixtures.mjs --verbose    every difference, not ten
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { answer } from '../harness/fixtures.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
/* --shapes data/api-shapes.b.json holds the fixtures to a second account's
   recording; --mode staff answers every endpoint in that fixture mode */
const argv = process.argv;
const argOf = (n) => { const i = argv.indexOf(n); return i > -1 ? argv[i + 1] : null; };
const shapes = JSON.parse(readFileSync(argOf('--shapes') ? join(ROOT, argOf('--shapes')) : join(ROOT, 'data', 'api-shapes.json'), 'utf8'));
const MODE = argOf('--mode');
const verbose = process.argv.includes('--verbose');
const strict = process.argv.includes('--strict');

/* both sides reduced to the same vocabulary: object | array | string | number | boolean | null */
const kindOfReal = (v) => Array.isArray(v) ? 'array' : v && typeof v === 'object' ? 'object'
  : v === 'null' ? 'null' : v === 'number' ? 'number' : v === 'boolean' ? 'boolean' : v === '{…}' ? 'deep' : 'string';
const kindOfFix = (v) => Array.isArray(v) ? 'array' : v === null || v === undefined ? 'null' : typeof v;

const mergeItems = (a, b) => {
  if (a === undefined) return b;
  if (a && b && typeof a === 'object' && typeof b === 'object' && !Array.isArray(a) && !Array.isArray(b)) {
    const o = { ...a };
    for (const k of Object.keys(b)) o[k] = k in a ? (a[k] === null ? b[k] : mergeItems(a[k], b[k])) : b[k];
    return o;
  }
  /* a nested list is merged across rows too: one row's product carrying an
     auto-renew item must count, whichever row it is */
  if (Array.isArray(a) && Array.isArray(b)) { const items = [...a, ...b]; return items.length ? [items.reduce(mergeItems, undefined)] : []; }
  return a === null ? b : a;
};
const diff = (real, fix, at, out) => {
  const kr = kindOfReal(real), kf = kindOfFix(fix);
  if (kr === 'deep') return;                                /* the recorder stopped here */
  /* null on our side where the real API sent a value is not MISSING — a
     plain listing has no project, a real account's first row may have one.
     It is reported as 'null' and does not fail. */
  if (kr === 'null' || kf === 'null') { if (kr !== kf && kf === 'null' && kr !== 'null') out.push(['null', at]); return; }
  if (kr !== kf) { out.push(['type', `${at}: real ${kr}, fixture ${kf}`]); return; }
  if (kr === 'array') {
    if (real.length && !fix.length) { out.push(['empty', at]); return; }
    /* every item of the list, merged: a key only some rows carry (a project
       unit's project, a daily rental's permit) is compared once, from
       whichever row has it — the real side was recorded the same way */
    if (real.length && fix.length) diff(real[0], fix.reduce(mergeItems, undefined), `${at}[]`, out);
    return;
  }
  if (kr === 'object') {
    /* an object keyed by DATE (product_stats.items) is a list by another
       name: the dates are the account's, not the API's — compare one day */
    const DATE = /^\d{4}-\d{2}-\d{2}$/;
    const rd = Object.keys(real).filter((k) => DATE.test(k)), fd = Object.keys(fix).filter((k) => DATE.test(k));
    if (rd.length && rd.length === Object.keys(real).length) {
      if (!fd.length) out.push(['empty', `${at}{date}`]);
      else diff(real[rd[0]], fix[fd[0]], `${at}{date}`, out);
      return;
    }
    for (const k of Object.keys(real)) {
      if (!(k in fix)) out.push(['missing', `${at}.${k}`]);
      else diff(real[k], fix[k], `${at}.${k}`, out);
    }
    for (const k of Object.keys(fix)) if (!(k in real)) out.push(['extra', `${at}.${k}`]);
  }
};

const rows = [];
for (const [key, { q, shape }] of Object.entries(shapes)) {
  const [method, path] = key.split(' ');
  if (!path.startsWith('/api/')) continue;
  const concrete = path.replace(/:id/g, '1');
  const body = answer(method, concrete, '', MODE);
  if (body === undefined) { rows.push({ key, unanswered: true, out: [] }); continue; }
  const out = [];
  diff(shape, JSON.parse(JSON.stringify(body)), '', out);
  rows.push({ key, q, out });
}

const count = (r, k) => r.out.filter(([t]) => t === k).length;
console.log('\n  endpoint                                            missing  type  empty  extra   null');
for (const r of rows.sort((a, b) => (Number(!!b.unanswered) - Number(!!a.unanswered)) || (count(b, 'missing') + count(b, 'type')) - (count(a, 'missing') + count(a, 'type')))) {
  if (r.unanswered) { console.log(`  ${r.key.padEnd(50)}  NOT ANSWERED — the product gets {}`); continue; }
  const m = count(r, 'missing'), t = count(r, 'type'), e = count(r, 'empty'), x = count(r, 'extra'), nl = count(r, 'null');
  console.log(`  ${r.key.padEnd(50)} ${String(m).padStart(7)} ${String(t).padStart(5)} ${String(e).padStart(6)} ${String(x).padStart(6)} ${String(nl).padStart(6)}${m + t + e ? '' : '   ok'}`);
  const show = r.out.filter(([k]) => k !== 'extra' && k !== 'null');
  for (const [k, what] of (verbose ? show : show.slice(0, 10))) console.log(`      ${k.padEnd(8)} ${what}`);
  if (!verbose && show.length > 10) console.log(`      … ${show.length - 10} more (--verbose)`);
}
const bad = rows.filter((r) => r.unanswered || count(r, 'missing') || count(r, 'type'));
console.log(`\n  ${rows.length - bad.length} of ${rows.length} endpoints answer in the real shape\n`);
if (strict && bad.length) process.exit(1);
