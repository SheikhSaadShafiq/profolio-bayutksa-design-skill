#!/usr/bin/env node
/**
 * The design system, as one file, in atoms · molecules · organisms.
 *
 * WHY THIS AND NOT THE 38 FILES
 * extract-components.mjs writes one page per component, which is what you want
 * when you are lifting a single component into your own codebase. It is not a
 * design system: it is a directory. A design system is the thing you read to
 * find out what exists, at which level of granularity, made of what, used
 * where — and that has to be one document with the tiers in it.
 *
 * The tiers are YOURS. canvas/ holds three files — Atoms, Molecules, Organisms
 * — and their section headings are this system's own classification. The join
 * from those headings to our components is written down in
 * extract-components.mjs, each entry citing the section it came from, because
 * the canvas names no classes and nothing can derive it. Nesting depth was
 * tried first and rejected: it calls the sidebar an atom, because the sidebar's
 * specimen contains nothing but its own items.
 *
 *   node scripts/design-system.mjs
 *
 * Reads   data/components.json   (tier, css, specimens, tokens, usage)
 *         deliverables/profolio.css, sprite.svg, fonts.css
 * Writes  deliverables/design-system.html — self-contained, no network
 *
 * Every component shows its states live, what it contains, where it is used,
 * and the exact CSS to lift — the same bytes qa-components.mjs proved render
 * identically to the catalogue.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const D = join(ROOT, 'deliverables');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const { components, orphanClasses, skipped } = JSON.parse(readFileSync(join(ROOT, 'data', 'components.json'), 'utf8'));
const css = readFileSync(join(D, 'profolio.css'), 'utf8');
const fonts = readFileSync(join(D, 'fonts.css'), 'utf8');
const sprite = readFileSync(join(D, 'sprite.svg'), 'utf8').replace(/^<!--[\s\S]*?-->\s*/, '');

const TIERS = [
  ['atom', 'Atoms', 'The indivisible pieces. A button, a tag, an avatar — nothing here is made of anything else in this system.'],
  ['molecule', 'Molecules', 'Atoms doing one job together: a statistic, a pager, an action group, a meter.'],
  ['organism', 'Organisms', 'A whole region of a screen. The header, the sidebar, the table, the filter panel, an overlay.'],
  ['unfiled', 'Not in the canvas', 'Catalogued here but with no section in canvas/. Filed by nobody yet, and shown so it is not quietly lost.'],
];
const byTier = Object.fromEntries(TIERS.map(([k]) => [k, components.filter((c) => c.tier === k)]));

/* the stage the specimens sit on — the same box .cat-stage gives them in the
   catalogue, including the two staging rules an overlay needs to be visible at
   all outside the page it positions against */
const CHROME = `
:root{color-scheme:light}
body{margin:0}
.ds-shell{display:grid;grid-template-columns:262px minmax(0,1fr);align-items:start}
.ds-nav{position:sticky;top:0;max-height:100vh;overflow:auto;padding:24px 18px 48px;border-inline-end:1px solid #E6E6E6;background:#fff}
.ds-nav h1{font-size:15px;margin:0 0 2px;color:#272B41}
.ds-nav .ds-sub{font-size:11px;color:#9D9D9D;margin-bottom:18px;display:block}
.ds-nav h2{font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:#9D9D9D;margin:20px 0 6px}
.ds-nav a{display:block;padding:3px 0;font-size:13px;color:#4f4f4f;text-decoration:none}
.ds-nav a:hover{color:#006169}
.ds-main{padding:32px 40px 96px;min-width:0}
.ds-lede{max-width:74ch;font-size:14px;line-height:1.65;color:#4f4f4f;margin:0 0 6px}
.ds-tier{margin-top:52px;scroll-margin-top:24px}
.ds-tier > h2{font-size:24px;margin:0 0 4px;color:#272B41}
.ds-tier > p{max-width:74ch;font-size:13px;line-height:1.6;color:#707070;margin:0 0 22px}
.ds-c{border:1px solid #E6E6E6;border-radius:10px;background:#fff;margin-bottom:18px;overflow:hidden;scroll-margin-top:24px}
.ds-c > header{padding:16px 20px;border-bottom:1px solid #F0F0F0}
.ds-c h3{font-size:17px;margin:0 0 3px;color:#272B41;display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.ds-pill{font-size:10px;letter-spacing:.06em;text-transform:uppercase;font-weight:700;padding:3px 8px;border-radius:20px;background:#E1F2F0;color:#006169}
.ds-pill[data-x="none"]{background:#FFF1F1;color:#F73131}
.ds-sel{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;color:#006169;word-break:break-word}
.ds-src{display:block;margin-top:8px;font-size:12.5px;line-height:1.55;color:#707070;max-width:82ch}
.ds-note{margin:10px 0 0;padding:9px 11px;border-inline-start:3px solid #F0A742;background:#FFF8EC;font-size:12.5px;line-height:1.5;color:#4f4f4f;max-width:82ch}
.ds-note[data-kind="tbc"]{border-color:#F73131;background:#FFF1F1}
.ds-body{padding:18px 20px 6px}
.ds-row{display:flex;flex-wrap:wrap;gap:20px;align-items:flex-start;margin-block-end:20px}
.ds-item{display:flex;flex-direction:column;gap:8px;min-width:0}
.ds-fill{width:520px;max-width:100%}
.ds-item[data-wide="true"]{flex:1 1 100%}
.ds-label{font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:#9D9D9D;font-weight:700}
.ds-stage{min-width:0;background:#F6F7FB;border:1px dashed #DEDEDE;border-radius:4px;padding:16px;display:flex;align-items:center;gap:12px;min-height:54px}
.ds-stage[data-ground="white"]{background:#fff}
.ds-stage[data-ground="dark"]{background:#272B41}
.ds-stage[data-stack="true"]{flex-direction:column;align-items:stretch}
.ds-stage .pf-popover,.ds-stage .pf-drawer-head{position:static}
.ds-stage .pf-noti{background:#fff}
.ds-stage .pf-spin{block-size:120px}
.ds-meta{border-top:1px solid #F0F0F0;padding:12px 20px;font-size:12.5px;color:#707070;line-height:1.75}
.ds-meta code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11.5px;color:#006169}
.ds-meta b{color:#4f4f4f;font-weight:600}
.ds-meta a{color:#006169;text-decoration:none}
.ds-meta a:hover{text-decoration:underline}
details{border-top:1px solid #F0F0F0}
summary{padding:11px 20px;font-size:12.5px;font-weight:600;color:#006169;cursor:pointer;user-select:none}
details pre{margin:0;padding:0 20px 18px;overflow:auto;max-height:460px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11.5px;line-height:1.55;color:#4f4f4f}
.ds-foot{margin-top:56px;padding-top:20px;border-top:1px solid #E6E6E6;font-size:12.5px;line-height:1.7;color:#707070;max-width:82ch}
.ds-foot code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11.5px;color:#006169}
@media (max-width:900px){.ds-shell{grid-template-columns:1fr}.ds-nav{position:static;max-height:none;border-inline-end:0;border-bottom:1px solid #E6E6E6}.ds-main{padding:24px 16px 64px}}
`.trim();

const card = (c) => `
<article class="ds-c" id="${esc(c.id)}">
  <header>
    <h3>${esc(c.name)}
      <span class="ds-pill"${c.canvasSection ? '' : ' data-x="none"'}>${esc(c.canvasSection || 'no canvas section')}</span></h3>
    <div class="ds-sel">${esc(c.primary)}</div>
    ${c.src ? `<span class="ds-src">${esc(c.src)}</span>` : ''}
${(c.notes || []).map((n) => `    <div class="ds-note" data-kind="${esc(n.kind)}">${esc(n.text)}</div>`).join('\n')}
  </header>
  <div class="ds-body">
    <div class="ds-row">
${(c.specimens || []).map((s) => `      <div class="ds-item${s.fill ? ' ds-fill' : ''}"${s.wide ? ' data-wide="true"' : ''}><span class="ds-label">${esc(s.label || '—')}</span><div class="ds-stage"${s.ground ? ` data-ground="${esc(s.ground)}"` : ''}${s.stack ? ' data-stack="true"' : ''}>${s.markup}</div></div>`).join('\n')}
    </div>
  </div>
  <div class="ds-meta">
    <b>made of</b> — ${c.contains && c.contains.length ? c.contains.map((k) => `<a href="#${esc(k)}">${esc(k)}</a>`).join(' · ') : 'nothing else in this system'}<br>
    <b>classes</b> — ${c.classes.map((k) => `<code>.${esc(k)}</code>`).join(' ')}<br>
    <b>tokens</b> — ${c.tokens.length ? c.tokens.map((t) => `<code>${esc(t)}</code>`).join(' ') : '<em>none</em>'}<br>
    <b>icons</b> — ${c.icons.length ? c.icons.map((i) => `<code>#${esc(i)}</code>`).join(' ') : '<em>none</em>'}<br>
    <b>used on</b> — ${Object.keys(c.usedOn).length ? Object.entries(c.usedOn).map(([p, n]) => `<code>${esc(p)}</code>&nbsp;×${n}`).join(' · ') : '<em>no page in this deliverable</em>'}
  </div>
  <details>
    <summary>the CSS to lift — ${c.rules} rule(s), ${c.tokens.length} token(s)</summary>
    <pre>${esc(c.css)}</pre>
  </details>
</article>`;

const html = `<!doctype html>
<html lang="en" dir="ltr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Profolio KSA — Design System</title>
<!-- GENERATED by scripts/design-system.mjs — do not edit.
     Self-contained: fonts, the one stylesheet and the icon sprite are all
     inline, so this opens offline with no network requests. -->
<style>${fonts}</style>
<style>${css}</style>
<style>${CHROME}</style>
</head>
<body>
<svg xmlns="http://www.w3.org/2000/svg" hidden aria-hidden="true">${sprite}</svg>
<div class="ds-shell">
  <nav class="ds-nav">
    <h1>Profolio KSA</h1><span class="ds-sub">Design System · ${components.length} components</span>
${TIERS.filter(([k]) => byTier[k].length).map(([k, title]) => `    <h2><a href="#t-${k}" style="color:inherit;text-decoration:none">${esc(title)} · ${byTier[k].length}</a></h2>
${byTier[k].map((c) => `    <a href="#${esc(c.id)}">${esc(c.name)}</a>`).join('\n')}`).join('\n')}
  </nav>
  <main class="ds-main">
    <p class="ds-lede">Every component below is cut out of <code>deliverables/profolio.css</code> — the one
    stylesheet all eleven pages compose from — and each one is proved to render identically to the
    catalogue it came from before it ships. The tiers are this system's own, read off the section
    headings in <code>canvas/</code>; nesting depth was tried as a way to derive them and rejected,
    because it files the sidebar as an atom.</p>
    <p class="ds-lede">Each entry shows its states live, what it is made of, where it is used, and the exact
    CSS to lift: its rules with their provenance comments, and only the custom properties those rules
    reach.</p>
${TIERS.filter(([k]) => byTier[k].length).map(([k, title, blurb]) => `
    <section class="ds-tier" id="t-${k}">
      <h2>${esc(title)}</h2>
      <p>${esc(blurb)}</p>
${byTier[k].map(card).join('\n')}
    </section>`).join('\n')}
    <div class="ds-foot">
      <b>What is not here.</b> ${orphanClasses.length} <code>pf-</code> classes the stylesheet defines have no
      section in <code>deliverables/components.html</code>, so nothing can cut them out — the whole settings
      and reports vocabulary the last two passes added (<code>.pf-agency-head</code>, <code>.pf-donut</code>,
      <code>.pf-timeline</code>, <code>.pf-wsection</code> and the rest). The catalogue covers
      ${components.reduce((n, c) => n + c.classes.length, 0)} of ${orphanClasses.length + components.reduce((n, c) => n + c.classes.length, 0)}.
      ${(skipped || []).map((s) => `<code>${esc(s.name)}</code> is skipped: ${esc(s.why)}.`).join(' ')}
      <br><br>
      <b>And what is inherited.</b> These components are cut from pages, and two of those pages do not match
      the product yet: the dashboard draws 120 upgrade circles the product does not draw at all, and four
      bodies (Reports ×3, LMS Leads) sit at 41–48% of the product's node count.
    </div>
  </main>
</div>
</body>
</html>
`;

const out = join(D, 'design-system.html');
writeFileSync(out, html);
console.log(`\n  deliverables/design-system.html — ${(Buffer.byteLength(html) / 1024).toFixed(0)}KB`);
for (const [k, title] of TIERS) if (byTier[k].length) console.log(`  ${title.padEnd(20)} ${String(byTier[k].length).padStart(3)}  ${byTier[k].map((c) => c.id).join(' ')}`);
console.log('');
