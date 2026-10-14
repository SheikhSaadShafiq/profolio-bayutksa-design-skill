#!/usr/bin/env node
/**
 * The research board: the page a PM reads beside the directions at gate 1. Run from the
 * skill's folder:
 *
 *   node qa/board.mjs designs/<feature>      writes designs/<feature>/research/board.html
 *
 * It reads designs/<feature>/research/research.json (kit/README.md → research), the
 * directions in flow.json, and, once the prototype is built, the bold direction's new tokens
 * (qa/prototype.json). Images saved beside it (research/img/<id>.png|jpg|webp, downloaded
 * from a Mobbin result's image_url) are embedded; a reference without one shows its link.
 * One self-contained file: publish it as its own artifact, then put its link in flow.json
 * research.board_url so the prototype's "Research board" opens it.
 */
import { readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { join, resolve, dirname, relative, extname } from 'node:path';

const target = process.argv.slice(2).find((a) => !a.startsWith('--'));
if (!target) { console.error('  usage: node qa/board.mjs designs/<feature>'); process.exit(2); }
const DIR = resolve(process.cwd(), target);
const RES = join(DIR, 'research');
if (!existsSync(join(RES, 'research.json'))) { console.error(`  ${relative(process.cwd(), join(RES, 'research.json'))} is missing (kit/README.md → research)`); process.exit(2); }
const R = JSON.parse(readFileSync(join(RES, 'research.json'), 'utf8'));
const flow = existsSync(join(DIR, 'flow.json')) ? JSON.parse(readFileSync(join(DIR, 'flow.json'), 'utf8')) : {};
const qa = existsSync(join(DIR, 'qa', 'prototype.json')) ? JSON.parse(readFileSync(join(DIR, 'qa', 'prototype.json'), 'utf8')) : {};

const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const link = (url, text) => (url ? `<a href="${esc(url)}" target="_blank" rel="noopener">${esc(text || url)}</a>` : esc(text || ''));
const MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif' };
function image(r) {
  const candidates = [r.image, ...['.webp', '.png', '.jpg', '.jpeg'].map((x) => `img/${r.id}${x}`)].filter(Boolean);
  for (const c of candidates) {
    const f = resolve(RES, c);
    if (!existsSync(f) || !MIME[extname(f).toLowerCase()] || statSync(f).size > 1.5 * 1048576) continue;
    return `<img src="data:${MIME[extname(f).toLowerCase()]};base64,${readFileSync(f).toString('base64')}" alt="${esc(`${r.app}: ${r.title || r.kind || ''}`)}" loading="lazy">`;
  }
  return `<div class="noimg"><b>${esc(r.app)}</b><br><span class="small">image not saved: open the link below</span></div>`;
}

const GROUPS = [['ksa', 'KSA portals\' agent tools'], ['regional', 'Regional and global agent tools'], ['saas', 'Best-in-class SaaS for the pattern'], ['bayut', 'Bayut\'s and dubizzle\'s own markets']];
const SEEN = { 'app-store': 'its App Store page', mobbin: 'Mobbin', 'help-centre': 'its help centre', press: 'press coverage', 'search-summary': 'a search summary: the site was not opened' };
const KIND = { existing: 'Existing components only', competitor: 'Competitor-led: new patterns, the product\'s tokens', bold: 'Bold: new patterns and new visual language' };
const dirs = flow.directions || [];
const refsById = new Map([...(R.competitors || []), ...(R.mobbin || []), ...(R.web || []), ...(R.trends || [])].map((x) => [x.id, x]));
const refName = (id) => { const x = refsById.get(id); return x ? `<a href="#${esc(id)}">${esc(x.app || x.name || x.title || id)}</a>` : esc(id); };
const usedBy = (fid) => dirs.filter((d) => (d.fresh || []).includes(fid)).map((d) => d.id);

const card = (r) => `<article class="ref" id="${esc(r.id)}">
  <div class="shot">${image(r)}</div>
  <div class="body">
    <p class="meta"><b>${esc(r.app)}</b> · ${esc(r.kind || 'web')}${r.title ? ' · ' + esc(r.title) : ''}</p>
    ${r.borrow ? `<p><span class="tag ok">Borrow</span> ${esc(r.borrow)}</p>` : ''}
    ${r.avoid ? `<p><span class="tag no">Avoid</span> ${esc(r.avoid)}</p>` : ''}
    <p class="src">${link(r.url, /mobbin\.com/.test(r.url || '') ? 'Open on Mobbin ↗' : 'Open ↗')}</p>
  </div>
</article>`;

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Research board · ${esc(R.feature || flow.title || flow.name || 'feature')}</title>
<meta name="description" content="Competitors, Mobbin references, trends and the fresh moves behind the design directions for ${esc(R.feature || flow.title || '')}.">
<style>
:root { --bg: #f6f7f9; --panel: #fff; --ink: #1d2126; --muted: #5d6671; --line: #e1e5ea; --accent: #0f6e56; --accent-soft: #e1f5ee; --warn: #8a5300; --warn-soft: #fff3df; --no: #a32d2d; --no-soft: #fcebeb; }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --bg: #15171b; --panel: #1d2025; --ink: #e9ebee; --muted: #a0a8b2; --line: #2f343b; --accent: #5dcaa5; --accent-soft: #10372d; --warn: #f0b35a; --warn-soft: #3a2f1c; --no: #f09595; --no-soft: #3b2220; } }
:root[data-theme="dark"] { --bg: #15171b; --panel: #1d2025; --ink: #e9ebee; --muted: #a0a8b2; --line: #2f343b; --accent: #5dcaa5; --accent-soft: #10372d; --warn: #f0b35a; --warn-soft: #3a2f1c; --no: #f09595; --no-soft: #3b2220; }
* { box-sizing: border-box; }
body { margin: 0; background: var(--bg); color: var(--ink); font: 15px/1.6 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
main { max-width: 1120px; margin: 0 auto; padding: 32px 16px 64px; }
header p { color: var(--muted); margin: 4px 0 0; }
h1 { font-size: 28px; line-height: 1.25; margin: 0; }
h2 { font-size: 20px; margin: 40px 0 12px; }
h3 { font-size: 16px; margin: 0 0 6px; }
a { color: var(--accent); }
.note { background: var(--warn-soft); color: var(--warn); border-radius: 8px; padding: 8px 12px; margin: 16px 0 0; }
.grid { display: grid; gap: 16px; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); }
.dir, .ref, .move, .trend, table { background: var(--panel); border: 1px solid var(--line); border-radius: 12px; }
.dir { padding: 16px; }
.dir .kind { color: var(--muted); font-size: 13px; margin: 0 0 8px; }
.dir ul { margin: 8px 0 0; padding-inline-start: 18px; }
.badge { display: inline-block; min-width: 28px; text-align: center; font-weight: 600; background: var(--accent-soft); color: var(--accent); border-radius: 6px; padding: 0 6px; margin-inline-end: 6px; }
table { width: 100%; border-collapse: separate; border-spacing: 0; overflow: hidden; }
th, td { text-align: start; vertical-align: top; padding: 10px 12px; border-bottom: 1px solid var(--line); }
th { font-size: 13px; color: var(--muted); font-weight: 600; }
tr:last-child td { border-bottom: 0; }
td.group { color: var(--muted); font-size: 13px; white-space: nowrap; }
.ref { overflow: hidden; display: flex; flex-direction: column; }
.shot { background: var(--bg); border-bottom: 1px solid var(--line); aspect-ratio: 16 / 10; display: grid; place-items: center; overflow: hidden; }
.shot img { width: 100%; height: 100%; object-fit: cover; object-position: top; }
.noimg { font-size: 14px; text-align: center; padding: 16px; }
.body { padding: 12px 14px; }
.body p { margin: 0 0 8px; }
.meta { font-size: 13px; color: var(--muted); }
.meta b { color: var(--ink); }
.tag { display: inline-block; font-size: 12px; font-weight: 600; border-radius: 4px; padding: 0 6px; margin-inline-end: 4px; }
.tag.ok { background: var(--accent-soft); color: var(--accent); }
.tag.no { background: var(--no-soft); color: var(--no); }
.src { font-size: 13px; }
.move, .trend { padding: 14px 16px; }
.move p, .trend p { margin: 4px 0 0; }
.small { font-size: 13px; color: var(--muted); }
code { font-size: 13px; }
@media (max-width: 640px) { th:nth-child(3), td:nth-child(3) { display: none; } }
</style>
</head>
<body>
<main>
<header>
  <p class="small">Research board · ${esc(R.made || new Date().toISOString().slice(0, 10))}</p>
  <h1>${esc(R.feature || flow.title || flow.name || 'Feature')}</h1>
  ${R.question ? `<p>${esc(R.question)}</p>` : ''}
  ${R.mobbin_unavailable ? `<p class="note">Mobbin was not available (${esc(R.mobbin_unavailable)}): the references come from the web.</p>` : ''}
</header>

${dirs.length ? `<h2>The directions</h2>
<div class="grid">${dirs.map((d) => `<section class="dir">
  <h3><span class="badge">${esc(d.id)}</span>${esc(d.title || '')}</h3>
  <p class="kind">${esc(KIND[d.kind] || d.kind)}${flow.chosen === d.id ? ' · chosen' : ''}</p>
  ${d.layout || d.hero ? `<p class="small"><b>Layout</b> ${esc(d.layout || '—')}${d.hero ? ` · <b>Read first</b> ${esc(d.hero)}` : ''}</p>` : ''}
  ${d.summary ? `<p>${esc(d.summary)}</p>` : ''}
  ${(d.fresh || []).length ? `<ul>${d.fresh.map((f) => { const m = (R.fresh || []).find((x) => x.id === f); return `<li><a href="#${esc(f)}">${esc(m ? m.title : f)}</a></li>`; }).join('')}</ul>` : '<p class="small">Uses no new pattern: the product as it is.</p>'}
  ${(qa.newTokens || []).filter((t) => t.dir === d.id).length ? `<p class="small">New tokens, for designer sign-off: ${(qa.newTokens || []).filter((t) => t.dir === d.id).map((t) => `<code>${esc(t.name)}: ${esc(t.value)}</code>`).join(', ')}</p>` : ''}
</section>`).join('')}</div>` : ''}

<h2>Competitors</h2>
<table>
  <thead><tr><th>Group</th><th>Product</th><th>Why it matters here</th></tr></thead>
  <tbody>${GROUPS.flatMap(([g, label]) => (R.competitors || []).filter((c) => c.group === g).map((c) => c.none
    ? `<tr><td class="group">${esc(label)}</td><td class="small">none for this job</td><td class="small">Searched: ${esc(c.none)}</td></tr>`
    : `<tr id="${esc(c.id || '')}"><td class="group">${esc(label)}</td><td>${link(c.url, c.name)}${c.seen && c.seen !== 'site' ? `<br><span class="small">seen via ${esc(SEEN[c.seen] || c.seen)}</span>` : ''}</td><td>${esc(c.why)}${c.does ? `<br><span class="small">${esc(c.does)}</span>` : ''}</td></tr>`)).join('')}</tbody>
</table>

${(R.queries || []).length ? `<h2>How Mobbin was searched</h2>
<p class="small">Wide first: short queries naming the thing, to see what exists. Then deep: the best apps by name.</p>
<table><thead><tr><th>Pass</th><th>Query</th><th>Kept</th></tr></thead><tbody>${R.queries.map((q) => `<tr><td class="group">${esc(q.pass || '')}${q.tool ? ' · ' + esc(q.tool) : ''}</td><td>${esc(q.q || '')}</td><td class="small">${(q.kept || []).map(refName).join(', ') || '—'}</td></tr>`).join('')}</tbody></table>` : ''}

<h2>References${R.mobbin_unavailable ? '' : ' from Mobbin'}</h2>
<div class="grid">${(R.mobbin || []).map(card).join('')}${(R.web || []).map(card).join('')}</div>

<h2>Trends</h2>
<div class="grid">${(R.trends || []).map((t) => `<section class="trend" id="${esc(t.id || '')}"><p class="small">${t.kind ? esc(t.kind === 'visual' ? 'Visual' : 'UX') + ' · ' : ''}${esc(t.date || '')}${t.source ? ' · ' + esc(t.source) : ''}</p><h3>${link(t.url, t.title)}</h3><p>${esc(t.takeaway)}</p></section>`).join('')}</div>

<h2>Fresh moves</h2>
<p class="small">What makes these directions more than the ordinary version: each move comes from the references above, and the directions that draw it say so.</p>
<div class="grid">${(R.fresh || []).map((f) => `<section class="move" id="${esc(f.id)}">${f.size ? `<p class="small">${esc({ layout: 'Changes the layout', hero: 'Changes what is read first', language: 'Changes the visual language', detail: 'A detail' }[f.size] || f.size)}</p>` : ''}<h3>${esc(f.title)}</h3><p>${esc(f.what)}</p><p class="small">From ${(f.refs || []).map(refName).join(', ')}${usedBy(f.id).length ? ` · in direction ${usedBy(f.id).join(', ')}` : ' · in no direction yet'}</p></section>`).join('')}</div>

${(R.rounds || []).length ? `<h2>Change requests</h2>
<div class="grid">${R.rounds.map((r, i) => `<section class="move"><p class="small">Round ${i + 1}${r.date ? ' · ' + esc(r.date) : ''}</p><h3>${esc(r.asked)}</h3><p class="small">References: ${(r.refs || []).map(refName).join(', ') || '—'}${(r.options || []).length ? ` · options in the prototype: ${r.options.map(esc).join(', ')}` : ''}</p></section>`).join('')}</div>` : ''}
</main>
</body>
</html>
`;
writeFileSync(join(RES, 'board.html'), html);
const n = (k) => (R[k] || []).length;
console.log(`  ${relative(process.cwd(), join(RES, 'board.html'))} — ${n('competitors')} competitors · ${n('mobbin')} Mobbin and ${n('web')} web references · ${n('trends')} trends · ${n('fresh')} fresh moves · ${dirs.length} directions${n('rounds') ? ` · ${n('rounds')} change request(s)` : ''}`);
