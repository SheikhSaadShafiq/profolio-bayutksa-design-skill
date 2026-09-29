#!/usr/bin/env node
/**
 * ONE stylesheet for every compiled page — and proof that it is one.
 *
 * scripts/compile.mjs gives each page exactly the rules that paint it, in its
 * own cascade order, inline. That is what makes a compiled page exact, and it
 * is not a design system: forty-six copies of the button rules are forty-six
 * places for a button to differ. This merges every page's rule list into
 * deliverables/profolio.css, keeping each page's order wherever the pages
 * agree (the cascade IS order; see mergeOrdered in scripts/ds/css.mjs), then
 * re-links every page to it and renders each one again against the product
 * screenshot it was compiled from. The shared stylesheet is only accepted if
 * every page still comes back within the bar; a page that does not is left
 * self-contained and named.
 *
 *   node scripts/ds/stylesheet.mjs            merge, verify, link
 *   node scripts/ds/stylesheet.mjs --dry      merge and verify, change no page
 *
 * Writes deliverables/profolio.css (web) and deliverables/profolio.mobile.css
 * (the responsive layout), rewrites each compiled page's inline <style> into a
 * <link> to its layout's sheet (relative: ../ from states/ and mobile/), and
 * data/qa/stylesheet.json.
 */
import pkg from 'playwright';
import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync, copyFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { splitRules, mergeOrdered } from './css.mjs';
import { pixelDiff } from '../lib/pixels.mjs';
import { DEVICES, deviceOf } from '../../harness/devices.mjs';

const { chromium } = pkg;
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const DELIV = join(ROOT, 'deliverables');
const DRY = process.argv.includes('--dry');
const BAR = 0.5;

/* the compiled pages, web and responsive: base pages first, so they set the
   main order, then states. A page's data name carries --mobile on a phone. */
const compiled = (rel) => {
  const dir = join(DELIV, rel);
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((f) => f.endsWith('.html'))
    .map((f) => ({ file: join(dir, f), rel: rel + f, depth: rel.split('/').filter(Boolean).length, states: /states\/$/.test(rel) }))
    .filter((p) => /<meta name="pf-compiled"/.test(readFileSync(p.file, 'utf8').slice(0, 4000)))
    .map((p) => { const device = deviceOf(readFileSync(p.file, 'utf8')); const base = p.rel.split('/').pop().replace(/\.html$/, ''); return { ...p, device, name: device === 'mobile' ? `${base}--mobile` : base }; });
};
const pages = [...compiled(''), ...compiled('mobile/'), ...compiled('states/'), ...compiled('mobile/states/')];

/* a page's own rules live in data/ds/page-css/<name>.css (compile.mjs writes
   them), so the stylesheet can be rebuilt however many pages were recompiled
   since — a page already linked to the old stylesheet keeps its rules here */
const STYLE_RE = /<style>\n([\s\S]*?)\n<\/style>/;
const LINK_RE = /<link rel="stylesheet" href="(?:\.\.\/)*profolio(?:\.mobile)?\.css">/;
const PAGE_CSS = join(ROOT, 'data', 'ds', 'page-css');
for (const p of pages) {
  const html = readFileSync(p.file, 'utf8');
  const own = join(PAGE_CSS, `${p.name}.css`);
  const m = html.match(STYLE_RE);
  const css = existsSync(own) ? readFileSync(own, 'utf8') : m ? m[1] : null;
  if (!css) { p.skip = 'no rules on record — recompile it'; console.log(`  skip ${p.name}: ${p.skip}`); continue; }
  p.html = m ? html : html.replace(LINK_RE, '<style>\n\n</style>');
  p.rules = splitRules(css);
}
const todo = pages.filter((p) => !p.skip);

/* ONE stylesheet PER LAYOUT. The web and the responsive layout use the same
   rules in different cascade orders — a phone's page has the rules of its
   own components first — and one merged order cannot keep both: merged
   together they disagreed 80,553 times and 29 pages had to stay
   self-contained. Each layout merged on its own keeps its own order:
   profolio.css for the web, profolio.mobile.css for the responsive layout. */
const SHEET = { web: 'profolio.css', mobile: 'profolio.mobile.css' };
const sheets = {};
for (const dev of ['web', 'mobile']) {
  const group = todo.filter((p) => p.device === dev);
  if (!group.length) continue;
  const lists = group.map((p) => p.rules);
  const { merged, conflicts } = mergeOrdered(lists);
  const header = `/* ═══════════════════════════════════════════════════════════════════════════
   PROFOLIO KSA — ${dev === 'web' ? 'THE STYLESHEET · web (1440)' : 'THE STYLESHEET · responsive (375, a phone)'}
   Compiled from the product (profolio-reactjs) by scripts/compile.mjs and merged
   by scripts/ds/stylesheet.mjs from ${group.length} compiled ${dev === 'web' ? 'web' : 'responsive'} pages and states. Do
   not edit by hand: every rule here is a rule the product itself paints with,
   renamed ant-* → pf-*, styled-components hashes → the JSX name the product
   wrote. ${merged.length} rules.${dev === 'mobile' ? `
   The responsive layout's own sheet: the same rules as ${SHEET.web} where the
   two layouts share them, in the order the phone's pages paint them.` : ''}
   ═══════════════════════════════════════════════════════════════════════ */\n`;
  const css = header + merged.join('\n');
  sheets[dev] = { css, rules: merged.length, conflicts, pages: group.length };
  const total = lists.reduce((n, l) => n + l.length, 0);
  console.log(`  ${SHEET[dev]}: merged ${group.length} pages · ${total} rules in → ${merged.length} unique · ${conflicts} order disagreements · ${(css.length / 1024 / 1024).toFixed(1)} MB`);
}

/* ── verify: every page, linked to its layout's stylesheet, against the product ── */
const TMP = join(ROOT, 'data', 'ds', 'linked');
for (const d of ['states', 'mobile', 'mobile/states']) mkdirSync(join(TMP, d), { recursive: true });
for (const [dev, sh] of Object.entries(sheets)) writeFileSync(join(TMP, SHEET[dev]), sh.css);
const browser = await chromium.launch();
/* each page is verified in the device it was compiled in */
const ctxs = { web: await browser.newContext(DEVICES.web), mobile: await browser.newContext(DEVICES.mobile) };
const rows = [];
for (const p of todo) {
  const linked = p.html.replace(STYLE_RE, `<link rel="stylesheet" href="${'../'.repeat(p.depth)}${SHEET[p.device]}">`);
  const tmp = join(TMP, p.rel);
  writeFileSync(tmp, linked);
  const pg = await ctxs[p.device].newPage();
  await pg.route('**/*', (r) => (/^(file|data):/.test(r.request().url()) ? r.continue() : r.abort()));
  await pg.goto('file://' + tmp, { waitUntil: 'load' });
  await pg.evaluate(() => document.fonts.ready);
  await pg.waitForTimeout(300);
  /* the same screenshot mode the compiled file was verified in */
  const meta = p.html.match(/<meta name="pf-shot" content="(\w+)"/);
  const full = meta ? meta[1] === 'full' : await pg.evaluate(() => ![...document.querySelectorAll('.pf-modal, .pf-drawer-content, .pf-popover:not(.pf-popover-hidden)')]
    .some((el) => el.getBoundingClientRect().width > 0));
  const shot = join(TMP, p.rel.replace(/\.html$/, '.png'));
  await pg.screenshot({ path: shot, fullPage: full, animations: 'disabled' });
  await pg.close();
  const live = join(ROOT, 'data', 'live', `${p.name}.png`);
  const d = existsSync(live) ? pixelDiff(live, shot, join(ROOT, 'data', 'qa', 'pixels-linked', `${p.name}.diff.png`)) : { pct: NaN };
  rows.push({ name: p.name, device: p.device, pct: d.pct, ok: d.pct <= BAR, linked, p });
}
await browser.close();

const bad = rows.filter((r) => !r.ok);
for (const r of rows) console.log(`  ${r.name.padEnd(46)} ${(String(r.pct) + '%').padStart(8)}  ${r.ok ? 'ok' : 'OVER — stays self-contained'}`);
console.log(`\n  ${rows.length - bad.length} of ${rows.length} pages render within ${BAR}% on the shared stylesheet`);
writeFileSync(join(ROOT, 'data', 'qa', 'stylesheet.json'), JSON.stringify({ at: new Date().toISOString(),
  rules: sheets.web ? sheets.web.rules : 0, rulesMobile: sheets.mobile ? sheets.mobile.rules : 0,
  conflicts: sheets.web ? sheets.web.conflicts : 0, conflictsMobile: sheets.mobile ? sheets.mobile.conflicts : 0,
  rows: rows.map(({ name, device, pct, ok }) => ({ name, device, pct, ok })) }, null, 2));

for (const [dev, sh] of Object.entries(sheets)) {
  const out = DRY ? join(ROOT, 'data', 'ds', SHEET[dev].replace(/\.css$/, '.dry.css')) : join(DELIV, SHEET[dev]);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, sh.css);
}
if (!DRY) {
  for (const r of rows) if (r.ok) writeFileSync(r.p.file, r.linked);
  console.log(`  wrote ${Object.keys(sheets).map((d) => `deliverables/${SHEET[d]}`).join(' and ')}, and linked ${rows.length - bad.length} pages to them\n`);
}
