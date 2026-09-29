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
  /* web and responsive apart: a responsive row is named <page>--mobile */
  for (const [key, rows] of [['pages', pix.rows.filter((r) => !/--mobile$/.test(r.name))], ['responsive', pix.rows.filter((r) => /--mobile$/.test(r.name))]]) {
    if (!rows.length) continue;
    const within = rows.filter((r) => r.pct <= pix.bar).length;
    const worst = rows.reduce((m, r) => (r.pct > m.pct ? r : m), { pct: -1 });
    fills[key] = `${within} of ${rows.length} within ${pix.bar}% pixel difference; worst ${worst.name} at ${worst.pct}% (${at})`;
  }
}
const qa = json('data/qa/design-qa.json');
if (qa) {
  const l = qa.summary.live;
  const f = (x, t) => (x ? `${t} ${x.coverage}% coverage, ${x.exact}% exact` : null);
  fills.live = [f(l.owner, 'owner at 1440'), f(l.staff, 'staff at 1440'), f(l.staffMobile, 'staff at 375')].filter(Boolean).join(' · ') || '—';
  const c = qa.summary.copy;
  fills.copy = `${c.copy + c.code} of ${c.strings - c.data} interface strings are in translation.json or the code (${(((c.copy + c.code) / Math.max(1, c.strings - c.data)) * 100).toFixed(1)}%); ${c.unmatched} unmatched`;
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
/* and its rendered copy in kb/guide/, which scripts/kb.mjs writes from it —
   the same body in the same page, a path in <code> linked when it exists */
const kbCopy = join(ROOT, 'kb', 'guide', 'handover.html');
if (existsSync(kbCopy)) {
  const linked = html.replace(/<code>((?:deliverables|kb|data|scripts|harness)\/[^<]+)<\/code>/g, (m, path) => {
    const clean = path.replace(/&lt;[^&]*&gt;.*$/, '');
    if (!clean || clean !== path || !existsSync(join(ROOT, path))) return m;
    return `<a href="${path.startsWith('kb/') ? '../' + path.slice(3) : '../../' + path}">${m}</a>`;
  });
  const page = readFileSync(kbCopy, 'utf8');
  writeFileSync(kbCopy, page.replace(/<main>[\s\S]*<\/main>/, `<main>\n${linked}</main>`));
}
console.log(fills);
