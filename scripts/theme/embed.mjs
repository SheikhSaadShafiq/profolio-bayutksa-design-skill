#!/usr/bin/env node
/**
 * Refresh the new theme's parts of deliverables/design-system.html — its
 * Foundations subsection (#new-theme-tokens) and its section (#new-theme) —
 * from data/theme/, without rebuilding the whole catalogue.
 * scripts/ds/catalogue.mjs embeds the same two files when it runs; this only
 * saves re-measuring every component when the new theme alone has changed.
 *
 *   node scripts/theme/embed.mjs
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const file = join(ROOT, 'deliverables', 'design-system.html');
const tokens = readFileSync(join(ROOT, 'data', 'theme', 'foundations.html'), 'utf8');
const section = readFileSync(join(ROOT, 'data', 'theme', 'section.html'), 'utf8');
let html = readFileSync(file, 'utf8');
if (!html.includes('id="new-theme-tokens"') || !html.includes('<section class="ds-section" id="new-theme">')) {
  console.error('  design-system.html has no new-theme parts yet — run node scripts/ds/catalogue.mjs once');
  process.exit(2);
}
/* the Foundations subsection runs from its heading to the end of the Foundations section */
const t0 = html.indexOf('\n<h3 id="new-theme-tokens">');
const t1 = html.indexOf('</section>', t0);
html = html.slice(0, t0) + tokens + html.slice(t1);
const s0 = html.indexOf('<section class="ds-section" id="new-theme">');
const s1 = html.indexOf('</section>', s0) + '</section>'.length;
html = html.slice(0, s0) + section + html.slice(s1);
writeFileSync(file, html);
console.log(`  deliverables/design-system.html — new-theme Foundations and section refreshed${existsSync(join(ROOT, 'deliverables', 'new-theme', 'fonts.css')) ? '' : ' (no new-theme/fonts.css yet)'}`);
