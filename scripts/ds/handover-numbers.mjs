#!/usr/bin/env node
/**
 * Fill the "Where it stands" table in authoring/handover.html from the score
 * files, so the handover never quotes a number the data does not hold.
 * Each <td data-fill="…"> is rewritten in place; run it after npm run ds.
 *
 *   node scripts/ds/handover-numbers.mjs
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { answer } from '../../harness/fixtures.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const json = (p) => (existsSync(join(ROOT, p)) ? JSON.parse(readFileSync(join(ROOT, p), 'utf8')) : null);
const at = new Date().toISOString().slice(0, 10);
const fills = {};

const pix = json('data/qa/compile.json');
if (pix) {
  const within = pix.rows.filter((r) => r.pct <= pix.bar).length;
  const worst = pix.rows.reduce((m, r) => (r.pct > m.pct ? r : m), { pct: -1 });
  fills.pages = `${within} of ${pix.rows.length} within ${pix.bar}% pixel difference; worst ${worst.name} at ${worst.pct}% (${at})`;
}
const sheet = json('data/qa/stylesheet.json');
if (sheet) fills.sheet = `${sheet.rows.filter((r) => r.ok).length} of ${sheet.rows.length} pages on the one stylesheet (${sheet.rules} rules)`;
const comp = json('data/qa/components.json');
if (comp) fills.components = `${comp.ok} of ${comp.measured} variants (${((comp.ok / comp.measured) * 100).toFixed(1)}%) within ${comp.bar}% of their in-page shot`;
const shapes = json('data/api-shapes.json');
if (shapes) {
  const eps = Object.keys(shapes).filter((k) => k.split(' ')[1].startsWith('/api/'));
  const answered = eps.filter((k) => { const [m, p] = k.split(' '); return answer(m, p.replace(/:id/g, '1'), '') !== undefined; });
  fills.fixtures = `${answered.length} of ${eps.length} recorded endpoints answered; npm run check-fixtures for their shape`;
}

const file = join(ROOT, 'authoring', 'handover.html');
let html = readFileSync(file, 'utf8');
for (const [k, v] of Object.entries(fills)) html = html.replace(new RegExp(`(<td data-fill="${k}">)[^<]*(</td>)`), `$1${v}$2`);
writeFileSync(file, html);
console.log(fills);
