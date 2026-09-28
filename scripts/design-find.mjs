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
 * PRD uses into the words the product uses (SYNONYMS below) on the way.
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
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const KB = join(ROOT, 'data', 'design-kb.json');
if (!existsSync(KB)) { console.error('data/design-kb.json is missing — run node scripts/ds/design-kb.mjs'); process.exit(2); }
const kb = JSON.parse(readFileSync(KB, 'utf8'));
const args = process.argv.slice(2);
const opt = (n) => { const i = args.indexOf(n); return i > -1 ? args[i + 1] : null; };
const flags = new Set(['--device', '--kind', '--screen', '--limit']);
const query = args.filter((a, i) => !a.startsWith('--') && !flags.has(args[i - 1])).join(' ').trim();
if (!query) { console.error('usage: node scripts/design-find.mjs "<words from the PRD>" [--device web|responsive] [--kind modal] [--screen listings] [--limit 12] [--json]'); process.exit(2); }
const DEVICE = opt('--device'), KIND = opt('--kind'), SCREEN = opt('--screen'), LIMIT = Number(opt('--limit') || 12);

/* the words a PRD uses → the words the product uses. Kept small and explicit
   so a wrong one can be argued with. */
const SYNONYMS = {
  lead: ['truleads', 'lms', 'lead', 'enquiry'], enquiry: ['lead'], inquiry: ['lead'], crm: ['lead', 'task'],
  book: ['booked', 'booking'], booking: ['booked', 'booking'], reserve: ['booked'], reservation: ['booked'],
  boost: ['upgrade', 'hot', 'signature', 'refresh'], promote: ['upgrade', 'hot', 'signature'], feature: ['upgrade', 'signature', 'feature'], upgrade: ['upgrade', 'hot', 'signature', 'refresh'],
  licence: ['license'], permit: ['license', 'permit'], rega: ['rega', 'license'], fal: ['fal', 'license'], brokerage: ['fal', 'license', 'brokerage'],
  staff: ['staff', 'agent', 'user'], employee: ['staff', 'user'], team: ['staff', 'team'], agent: ['agent', 'staff', 'broker'], broker: ['broker', 'trubroker'],
  credit: ['credits'], balance: ['credits', 'balance'], wallet: ['credits'], topup: ['top-up', 'credits'], 'top-up': ['top-up', 'credits'],
  package: ['package', 'plan'], plan: ['package', 'plan'], subscription: ['package'],
  delete: ['delete', 'remove'], remove: ['delete', 'removed'], archive: ['removed'],
  filter: ['filter', 'filters'], search: ['search', 'filter'], sort: ['sort'],
  notification: ['notifications', 'notification'], alert: ['notifications'], bell: ['notifications'],
  profile: ['profile', 'settings'], account: ['account', 'profile', 'settings'], setting: ['settings'],
  discount: ['discount', 'off'], offer: ['discount'], price: ['price', 'discount'],
  photo: ['photography', 'image', 'photo'], photography: ['photography'], image: ['image', 'photography'], picture: ['image', 'photography'],
  video: ['videography', 'video'], videography: ['videography'],
  verify: ['verified', 'verification', 'nafath', 'otp'], verification: ['verified', 'nafath', 'otp'], nafath: ['nafath'], otp: ['otp', 'code'],
  report: ['reports', 'report'], analytics: ['reports', 'insights', 'performance'], insight: ['insights'], stat: ['performance', 'reports'], performance: ['performance'],
  date: ['date', 'calendar'], calendar: ['calendar', 'date'], range: ['date', 'range'],
  help: ['help', 'support'], support: ['help', 'support'], contact: ['contact', 'help'],
  app: ['app', 'download'], download: ['download'],
  trucheck: ['trucheck'], quality: ['quality', 'health', 'score'], health: ['health', 'quality'],
  daily: ['daily'], rental: ['rent', 'rental'], rent: ['rent'], sale: ['sale', 'sell'], sell: ['sale', 'sell'],
  empty: ['empty', 'no record', 'no data'], loading: ['loading', 'skeleton', 'spinner'], error: ['error', 'failed'],
  menu: ['menu', 'rail', 'navigation'], navigation: ['menu', 'rail'], sidebar: ['rail', 'sider', 'menu'],
  invite: ['invite'], password: ['password'], language: ['language', 'arabic'], logout: ['logout', 'sign out'],
  post: ['post', 'listing'], listing: ['listing', 'listings'], property: ['property', 'listing'], ad: ['ad', 'license', 'listing'],
  tour: ['tour'], onboarding: ['tour', 'intro'], congratulation: ['congratulations', 'completed'],
};
const STOP = new Set('a an the to of for in on and or with as is are be should can could would will user users page screen show shows see able want wants when where that this it its from by at into new add adding let lets allow allows via each any all'.split(' '));
const stem = (w) => (w.length > 5 && w.endsWith('ies') ? w.slice(0, -3) + 'y' : w.length > 5 && w.endsWith('ing') ? w.slice(0, -3) : w.length > 4 && w.endsWith('ed') ? w.slice(0, -2) : w.length > 3 && w.endsWith('es') && !w.endsWith('ses') ? w.slice(0, -2) : w.length > 3 && w.endsWith('s') ? w.slice(0, -1) : w);
const words = (t) => String(t || '').toLowerCase().replace(/[’']/g, '').split(/[^a-z0-9؀-ۿ-]+/).filter((w) => w && !STOP.has(w)).map(stem);
const q = words(query);
const qSyn = [...new Set(q.flatMap((w) => (SYNONYMS[w] || []).map(stem)))].filter((w) => !q.includes(w));

/* ── the documents ─────────────────────────────────────────────────── */
const docs = [];
for (const s of kb.screens) {
  docs.push({ type: 'screen', kind: 'screen', screen: s.slug, name: s.slug, title: s.title, what: s.purpose, how: `route ${s.route}`, files: s.files, kbPage: `kb/screens/${s.slug}.html`,
    fields: [[s.title, 4], [s.slug, 3], [s.route, 2], [s.purpose, 3], [s.lines.join(' '), 0.7]] });
  for (const x of s.states) {
    docs.push({ type: 'state', kind: x.kind, screen: s.slug, name: `${s.slug}--${x.name}`, title: x.title || x.name, what: x.shows, how: x.how, files: x.files, kbPage: `kb/screens/${s.slug}.html`,
      fields: [[x.name.replace(/-/g, ' '), 4], [x.title, 4], [x.how, 2.5], [x.shows, 2], [x.buttons.join(' '), 2], [x.note, 1.5], [x.lines.join(' '), 1], [`${s.title} ${s.slug}`, 1.2], [x.mode || '', 3], [x.responsiveName ? x.responsiveName.replace(/-/g, ' ') : '', 2]] });
    if (x.responsiveName) docs[docs.length - 1].what = `${x.shows}  [web: ${x.kind} · phone: ${x.responsiveKind}]`;
  }
}
for (const c of kb.components) {
  docs.push({ type: 'component', kind: 'component', screen: null, name: c.slug, title: c.name, what: `${c.level} · ${c.group}${c.def ? ` · ${c.def}` : ''} · ${c.web} web / ${c.responsive} responsive variants`, how: `used on ${c.screens.slice(0, 8).join(', ')}`, files: { web: c.file, responsive: c.responsive ? `${c.file}#responsive` : null },
    fields: [[c.name.replace(/([a-z])([A-Z])/g, '$1 $2'), 4], [c.slug.replace(/-/g, ' '), 3], [c.group, 1], [c.def || '', 1.5], [c.level, 1]] });
}

/* ── score ─────────────────────────────────────────────────────────── */
const phrase = query.toLowerCase().replace(/\s+/g, ' ').trim();
const scored = [];
for (const d of docs) {
  if (DEVICE === 'web' && !d.files.web) continue;
  if (DEVICE === 'responsive' && !d.files.responsive) continue;
  if (KIND && d.kind !== KIND) continue;
  if (SCREEN && d.screen !== SCREEN) continue;
  let score = 0, hits = 0;
  const bags = d.fields.map(([t, w]) => [new Set(words(t)), String(t || '').toLowerCase(), w]);
  for (const w of q) {
    let best = 0;
    for (const [bag, raw, wt] of bags) if (bag.has(w) || (w.length > 3 && [...bag].some((b) => b.startsWith(w)))) best = Math.max(best, wt);
    if (best) hits++;
    score += best;
  }
  for (const w of qSyn) { let best = 0; for (const [bag, , wt] of bags) if (bag.has(w)) best = Math.max(best, wt); score += best * 0.5; }
  if (phrase.length > 4 && bags.some(([, raw]) => raw.includes(phrase))) score += 6;
  /* every word of the query found somewhere counts for more than one word found many times */
  if (q.length > 1) score *= 0.5 + 0.5 * (hits / q.length);
  if (d.type === 'screen') score *= 1.1;
  if (score > 0) scored.push({ ...d, score: +score.toFixed(2) });
}
scored.sort((a, b) => b.score - a.score);
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
