#!/usr/bin/env node
/**
 * Find the screens and states a PRD needs — from the design knowledge base.
 *
 * A PRD says "let staff see their own leads only" or "mark a daily rental as
 * booked"; the product calls them lms-leads/as-staff and listings/drawer-booked.
 * This searches kb/design-kb.json — every screen's purpose and copy, every
 * state's trigger, title, controls and strings, every component's name and
 * source — and translates a PRD's words into the product's on the way. Each
 * match gives its files in this package, whether they are installed, and the
 * fetch command and GitHub link when they are not (the .skill fetches pages by path).
 *
 *   node qa/find.mjs "mark a daily rental as booked"
 *   node qa/find.mjs "staff leads" --device responsive
 *   node qa/find.mjs "upgrade" --kind modal --limit 5
 *   node qa/find.mjs "quality score" --screen listings-new
 *
 * --device web|responsive   only what exists in that layout
 * --kind <kind>             modal, drawer, popover, dropdown, select, picker, tooltip,
 *                           tab, inline, data, account, shell, screen, component, sheet
 * --screen <slug>           within one page (a registry page id)
 * --limit <n>               how many (default 12)
 * --json                    machine-readable
 *
 * Run from skill/ (or anywhere: paths are resolved from this file).
 */
import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadKb, buildDocs, search } from './lib/design-search.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const kb = loadKb(join(ROOT, 'kb', 'design-kb.json'));
if (!kb) { console.error('kb/design-kb.json is missing — reinstall the .skill file (it carries kb/)'); process.exit(2); }
const args = process.argv.slice(2);
const opt = (n) => { const i = args.indexOf(n); return i > -1 ? args[i + 1] : null; };
const valued = new Set(['--device', '--kind', '--screen', '--limit']);
const query = args.filter((a, i) => !a.startsWith('--') && !valued.has(args[i - 1])).join(' ').trim();
if (!query) { console.error('usage: node qa/find.mjs "<words from the PRD>" [--device web|responsive] [--kind modal] [--screen listings] [--limit 12] [--json]'); process.exit(2); }
const LIMIT = Number(opt('--limit') || 12);
/* each file's GitHub link: registry.source.raw + its path */
const RAW = (() => { try { return JSON.parse(readFileSync(join(ROOT, 'registry.json'), 'utf8')).source?.raw || null; } catch { return null; } })();

/* the kb's component docs point at component files; a page's and a state's at pages/ */
const docs = buildDocs(kb).map((d) => (d.type === 'component' ? { ...d, kbPage: null } : { ...d, kbPage: `product/pages/${d.screen}.md` }));
const { qSyn, scored } = search(docs, query, { device: opt('--device'), kind: opt('--kind'), screen: opt('--screen') });
const top = scored.slice(0, LIMIT);

/* the fetch command for a page or state file that is not installed */
const fetchFor = (d, layout) => {
  if (d.type === 'component') return `python3 qa/fetch.py --component ${d.name}`;
  const state = d.type === 'state' ? ` ${d.name.slice(d.screen.length + 2)}` : '';
  return `python3 qa/fetch.py ${d.screen}${state}${layout === 'responsive' ? ' --375' : ''}`;
};
const status = (d, layout) => {
  const f = d.files[layout];
  if (!f) return null;
  const path = f.split('#')[0];
  const have = existsSync(join(ROOT, path));
  return { file: f, have, fetch: have ? null : fetchFor(d, layout), url: RAW ? RAW + path : null };
};
const rows = top.map((d) => ({ score: d.score, type: d.type, kind: d.kind, name: d.name, what: d.what, how: d.how, web: status(d, 'web'), phone: status(d, 'responsive'), notes: d.kbPage && existsSync(join(ROOT, d.kbPage)) ? d.kbPage : null }));

if (args.includes('--json')) {
  console.log(JSON.stringify(rows, null, 1));
} else {
  console.log(`\n  “${query}” — ${scored.length} match${scored.length === 1 ? '' : 'es'}${qSyn.length ? ` (also looked for: ${qSyn.join(', ')})` : ''}\n`);
  for (const r of rows) {
    console.log(`  ${String(r.score).padStart(5)}  ${(r.type === 'state' ? r.kind : r.type).padEnd(9)} ${r.name}`);
    if (r.what) console.log(`         ${r.what.slice(0, 160)}`);
    if (r.how && r.type !== 'component') console.log(`         how: ${r.how.slice(0, 160)}`);
    for (const [label, s] of [['web', r.web], ['phone', r.phone]]) if (s) {
      console.log(`         ${label}: ${s.file}${s.have ? '' : `   (not installed: ${s.fetch})`}`);
      if (!s.have && s.url) console.log(`         ${' '.repeat(label.length)}  ${s.url}`);
    }
    if (r.notes) console.log(`         what the page shows: ${r.notes}`);
    console.log('');
  }
  if (!top.length) console.log('  nothing matched — try the product’s own words (registry.json → pages[x].aliases, product/copy/rendered/)\n');
}
