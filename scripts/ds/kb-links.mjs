#!/usr/bin/env node
/**
 * Join the design system to the product knowledge base.
 *
 * kb/ is what the product SAYS and DOES — the KSA rules, the screen map, the
 * tenant flags, every string by area, a page per route — generated from the
 * product's source by scripts/build.mjs and scripts/kb.mjs. The design system
 * is what it LOOKS like. They describe the same components from two sides, and
 * each is half an answer without the other: a component page that cannot say
 * what the component's copy is, a copy page that cannot show the component.
 *
 * The join is by the product's own file layout, which both sides were built
 * from:
 *   src/components/common/<x>/…         → kb/product/copy/common-<x>.html
 *   src/components/<x>/…                → kb/product/copy/<x>.html
 *   src/tenant/<t>/components/<x>/…     → kb/product/copy/tenant-<x>.html
 *   src/container/pages/<x>/…           → kb/product/copy/page-<x>.html
 *   a component's folder or name        → kb/design/components/<name>.html
 *   a compiled page                     → kb/pages/<route>.html
 * A link is only written when the page it points at exists.
 *
 *   node scripts/ds/kb-links.mjs
 *
 * Writes data/ds/kb-links.json, which scripts/ds/catalogue.mjs reads.
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PAGES } from '../pages-list.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const KB = join(ROOT, 'kb');
const titleOf = (f) => { try { const m = readFileSync(f, 'utf8').match(/<h1>([^<]+)/); return m ? m[1].trim() : null; } catch { return null; } };
const reg = JSON.parse(readFileSync(join(ROOT, 'data', 'ds', 'components.json'), 'utf8'));

const byDef = {};
for (const { name, def } of Object.values(reg)) {
  if (!def || byDef[def]) continue;
  const links = [];
  const add = (rel, kind) => { const f = join(KB, rel); if (existsSync(f) && !links.some((l) => l.href === rel)) links.push({ href: rel, kind, title: titleOf(f) || rel }); };
  let m;
  if ((m = def.match(/^src\/components\/common\/([^/]+)\//))) add(`product/copy/common-${m[1]}.html`, 'copy');
  else if ((m = def.match(/^src\/components\/([^/]+)\//))) add(`product/copy/${m[1]}.html`, 'copy');
  if ((m = def.match(/^src\/tenant\/[^/]+\/components\/([^/]+)\//))) add(`product/copy/tenant-${m[1]}.html`, 'copy');
  if ((m = def.match(/^src\/container\/pages\/([^/]+)\//))) add(`product/copy/page-${m[1]}.html`, 'copy');
  const folder = (def.match(/\/([^/]+)\/[^/]+$/) || [])[1];
  for (const n of [folder, name].filter(Boolean)) add(`design/components/${n.toLowerCase()}.html`, 'notes');
  if (links.length) byDef[def] = links;
}

const ROUTE_DOC = { 'user-settings-user-profile': 'user-profile', 'user-settings-agency-profile': 'agency-profile', 'user-settings-change-password': 'change-password' };
const byPage = {};
for (const slug of Object.keys(PAGES)) {
  const rel = `pages/${ROUTE_DOC[slug] || slug}.html`;
  if (existsSync(join(KB, rel))) byPage[slug] = { href: rel, title: titleOf(join(KB, rel)) };
}

/* the Product knowledge section of the index */
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const card = (rel, blurb) => { const t = titleOf(join(KB, rel)); return t ? `<a href="../kb/${rel}"><b>${esc(t)}</b><span>${esc(blurb)}</span></a>` : ''; };
const copies = existsSync(join(KB, 'product', 'copy')) ? readdirSync(join(KB, 'product', 'copy')).filter((f) => f.endsWith('.html')) : [];
const html = `
<p class="ds-note">What the product says and does — generated from its source into <a href="../kb/index.html"><code>kb/</code></a>. Every component page links to the copy it renders and the notes written about it; every compiled page links to its route's page here.</p>
<div class="ds-kb">
${card('product/ksa.html', 'Product knowledge: who uses it, the regulation it works under, how it makes money — not a source of design')}
${card('product/screens.html', 'Every route, what it shows and who can reach it')}
${card('product/flags.html', 'The tenant flags that switch features on and off for KSA')}
${card('product/copy.html', `Every string, by area — ${copies.length} areas`)}
${card('index.html', 'The whole knowledge base')}
</div>
<h3>Routes</h3>
<ul class="ds-uses">${Object.entries(byPage).map(([slug, p]) => `<li><a href="../kb/${p.href}">${esc(p.title || slug)}</a> <small>${esc(slug)}</small></li>`).join('')}</ul>
`;
writeFileSync(join(ROOT, 'data', 'ds', 'kb-links.json'), JSON.stringify({ at: new Date().toISOString(), byDef, byPage, html }, null, 1));
console.log(`  ${Object.keys(byDef).length} component files linked to the knowledge base · ${Object.keys(byPage).length} pages linked to their route doc`);
