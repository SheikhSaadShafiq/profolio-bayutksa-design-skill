#!/usr/bin/env node
/**
 * Find the design a PRD needs — the screens, states and components that
 * match a few words, best first, with the files to open.
 *
 * A PRD says "let staff see their own leads only" or "add a discount to a
 * listing"; the design system says lms-leads--as-staff and
 * listings--action-discount. This searches the design knowledge base
 * (data/design-kb.json, written by scripts/ds/design-kb.mjs) — every
 * screen's purpose and copy, every state's trigger, title, controls and
 * strings, every component's name and source — and translates the words a
 * PRD uses into the words the product uses (SYNONYMS in
 * scripts/lib/design-search.mjs, the engine this and design-brief share) on
 * the way.
 *
 *   node scripts/design-find.mjs "mark a daily rental as booked"
 *   node scripts/design-find.mjs "staff leads" --device responsive
 *   node scripts/design-find.mjs "upgrade" --kind modal --limit 5
 *   node scripts/design-find.mjs "credits" --screen dashboard --json
 *
 * --device web|responsive   only what exists in that layout
 * --kind <kind>             modal, drawer, popover, dropdown, select, picker,
 *                           tooltip, tab, inline, data, account, shell,
 *                           screen, component
 * --screen <slug>           within one screen
 * --limit <n>               how many (default 12)
 * --json                    machine-readable
 *
 * A whole PRD, rather than a few words: scripts/design-brief.mjs.
 */
import { loadKb, buildDocs, search } from './lib/design-search.mjs';

const kb = loadKb();
if (!kb) { console.error('data/design-kb.json is missing — run node scripts/ds/design-kb.mjs'); process.exit(2); }
const args = process.argv.slice(2);
const opt = (n) => { const i = args.indexOf(n); return i > -1 ? args[i + 1] : null; };
const flags = new Set(['--device', '--kind', '--screen', '--limit']);
const query = args.filter((a, i) => !a.startsWith('--') && !flags.has(args[i - 1])).join(' ').trim();
if (!query) { console.error('usage: node scripts/design-find.mjs "<words from the PRD>" [--device web|responsive] [--kind modal] [--screen listings] [--limit 12] [--json]'); process.exit(2); }
const DEVICE = opt('--device'), KIND = opt('--kind'), SCREEN = opt('--screen'), LIMIT = Number(opt('--limit') || 12);

const { qSyn, scored } = search(buildDocs(kb), query, { device: DEVICE, kind: KIND, screen: SCREEN });
const top = scored.slice(0, LIMIT);

if (args.includes('--json')) {
  console.log(JSON.stringify(top.map(({ fields, ...d }) => d), null, 1));
} else {
  console.log(`\n  “${query}” — ${scored.length} match${scored.length === 1 ? '' : 'es'}${qSyn.length ? ` (also looked for: ${qSyn.join(', ')})` : ''}\n`);
  for (const d of top) {
    console.log(`  ${String(d.score).padStart(5)}  ${d.type === 'state' ? d.kind.padEnd(9) : d.type.padEnd(9)} ${d.name}`);
    if (d.what) console.log(`         ${d.what.slice(0, 150)}`);
    if (d.how && d.type !== 'component') console.log(`         how: ${d.how.slice(0, 150)}`);
    console.log(`         web: ${d.files.web || '—'}${d.files.responsive ? `\n         responsive: ${d.files.responsive}` : ''}`);
    if (d.kbPage) console.log(`         notes: ${d.kbPage}`);
    console.log('');
  }
  if (!top.length) console.log('  nothing matched — try the product’s own words (kb/product/screens.html), or browse kb/screens/index.html\n');
}
