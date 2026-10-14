#!/usr/bin/env node
/**
 * The research board: the page a PM reads beside the directions at gate 1, laid out as the
 * competitive UX flow method has it (research/README.md). Run from the skill's folder:
 *
 *   node qa/board.mjs designs/<feature>
 *     writes designs/<feature>/research/board.html   one self-contained page: publish it as its
 *                                                     own artifact, its link in flow.json
 *                                                     research.board_url
 *            designs/<feature>/research/summary.md   the findings summary, for people who won't
 *                                                     open the board (paste it in Slack)
 *     and checks research.json (qa/research.mjs): exit 1 while it has errors, listed
 *
 * Sections: Start here (scope, gaps, the fit table, how evidence was gathered) · Findings
 * (ranked) · Compare (the capability matrix, who is ahead) · one section per shortlisted
 * competitor (its flows, step by step) · the directions · references · trends · decisions.
 * Images saved beside it are embedded: research/img/<id>.webp|png|jpg for a reference, and
 * img/<flow>-<pos>.* (or the step's own "image") for a flow's step; else the link shows.
 */
import { readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { join, resolve, relative, extname } from 'node:path';
import { checkResearch, GROUPS as GROUP_LABELS, DEPTH } from './research.mjs';

const target = process.argv.slice(2).find((a) => !a.startsWith('--'));
if (!target) { console.error('  usage: node qa/board.mjs designs/<feature>'); process.exit(2); }
const DIR = resolve(process.cwd(), target);
const RES = join(DIR, 'research');
if (!existsSync(join(RES, 'research.json'))) { console.error(`  ${relative(process.cwd(), join(RES, 'research.json'))} is missing (research/README.md)`); process.exit(2); }
const R = JSON.parse(readFileSync(join(RES, 'research.json'), 'utf8'));
const flow = existsSync(join(DIR, 'flow.json')) ? JSON.parse(readFileSync(join(DIR, 'flow.json'), 'utf8')) : {};
const qa = existsSync(join(DIR, 'qa', 'prototype.json')) ? JSON.parse(readFileSync(join(DIR, 'qa', 'prototype.json'), 'utf8')) : {};

const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const link = (url, text) => (url ? `<a href="${esc(url)}" target="_blank" rel="noopener">${esc(text || url)}</a>` : esc(text || ''));
const MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif' };
function embed(candidates, alt) {
  for (const c of candidates.filter(Boolean)) {
    const f = resolve(RES, c);
    if (!existsSync(f) || !MIME[extname(f).toLowerCase()] || statSync(f).size > 1.5 * 1048576) continue;
    return `<img src="data:${MIME[extname(f).toLowerCase()]};base64,${readFileSync(f).toString('base64')}" alt="${esc(alt)}" loading="lazy">`;
  }
  return null;
}
const exts = ['.webp', '.png', '.jpg', '.jpeg'];
const image = (r) => embed([r.image, ...exts.map((x) => `img/${r.id}${x}`)], `${r.app}: ${r.title || r.kind || ''}`) || `<div class="noimg"><b>${esc(r.app)}</b><br><span class="small">image not saved: open the link below</span></div>`;

const GROUPS = Object.entries(GROUP_LABELS);
const SEEN = { 'app-store': 'its App Store page', mobbin: 'Mobbin', 'help-centre': 'its help centre', press: 'press coverage', 'search-summary': 'a search summary: the site was not opened' };
const KIND = { existing: 'Existing components only', competitor: 'Competitor-led: new patterns, the product\'s tokens', bold: 'Bold: new patterns and new visual language' };
const SIZE = { layout: 'Changes the layout', hero: 'Changes what is read first', language: 'Changes the visual language', detail: 'A detail' };
const dirs = flow.directions || [];
const comps = R.competitors || [], real = comps.filter((c) => !c.none);
const short = real.filter((c) => c.status === 'shortlist');
const byId = new Map([...real, ...(R.mobbin || []), ...(R.web || []), ...(R.trends || []), ...(R.flows || []), ...(R.rules || []), ...(R.capabilities || [])].filter((x) => x.id).map((x) => [x.id, x]));
const nameOf = (id) => { const x = byId.get(id); return x ? x.name || x.app || x.title || id : id; };
const refName = (id) => (byId.has(id) ? `<a href="#${esc(id)}">${esc(nameOf(id))}</a>` : esc(id));
const usedBy = (fid) => dirs.filter((d) => (d.fresh || []).includes(fid)).map((d) => d.id);
const chip = (v) => `<span class="chip chip--${esc(String(v || 'none').replace(/\W/g, ''))}">${esc(v === 'not-checked' ? 'not checked' : v || '—')}</span>`;
const gapsOf = (list) => (list || []).map((g) => `<a class="gap" href="#${esc(g)}">${esc(g)}</a>`).join(' ');
const check = checkResearch(R);

const card = (r) => `<article class="ref" id="${esc(r.id)}">
  <div class="shot">${image(r)}</div>
  <div class="body">
    <p class="meta"><b>${esc(r.app)}</b> · ${esc(r.kind || 'web')}${r.title ? ' · ' + esc(r.title) : ''}</p>
    ${r.borrow ? `<p><span class="tag ok">Borrow</span> ${esc(r.borrow)}</p>` : ''}
    ${r.avoid ? `<p><span class="tag no">Avoid</span> ${esc(r.avoid)}</p>` : ''}
    <p class="src">${link(r.url, /mobbin\.com/.test(r.url || '') ? 'Open on Mobbin ↗' : 'Open ↗')}</p>
  </div>
</article>`;

const flowBoard = (f) => {
  const rule = (R.rules || []).find((x) => x.id === f.rule);
  return `<section class="flow" id="${esc(f.id)}">
  <h4><span class="badge">${esc(f.id)}</span>${esc(f.title)} ${gapsOf(f.gaps)}</h4>
  <ol class="steps">${(f.steps || []).map((s) => `<li><div class="shot">${embed([s.image, ...exts.map((x) => `img/${f.id}-${s.pos}${x}`)], `${f.id} step ${s.pos}`) || `<div class="noimg small">step ${esc(s.pos)}</div>`}</div><p><b>${esc(s.pos)}.</b> ${esc(s.caption)}</p></li>`).join('')}</ol>
  ${rule ? `<p><span class="tag rule">Rule</span> ${esc(rule.rule)} <span class="small">(${link(rule.url, rule.title)}, read ${esc(rule.read)})</span></p>` : ''}
  <p><span class="tag ok">Done well</span> ${esc(f.well)}</p>
  <p><span class="tag adopt">Adopt</span> ${esc(f.adopt)}</p>
  <p class="src">${link(f.url, /mobbin\.com/.test(f.url || '') ? 'The flow on Mobbin ↗' : 'Source ↗')}</p>
</section>`;
};

/* the capability matrix: who is ahead where */
const caps = R.capabilities || [];
const rank = { yes: 2, partly: 1, no: 0 };
const theyLead = caps.filter((k) => short.some((c) => (rank[(k.values || {})[c.id]] ?? -1) > (rank[(k.values || {}).us] ?? 0)));
const weLead = caps.filter((k) => (k.values || {}).us === 'yes' && short.every((c) => (k.values || {})[c.id] !== 'yes'));
const unanswered = (R.gaps || []).filter((g) => g.evidence);
const findings = R.fresh || [];

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Research board · ${esc(R.feature || flow.title || flow.name || 'feature')}</title>
<meta name="description" content="The competitive research behind the design directions for ${esc(R.feature || flow.title || '')}: gaps, competitors by fit, flows, rules, the capability matrix and ranked findings.">
<style>
:root { --bg: #f6f7f9; --panel: #fff; --ink: #1d2126; --muted: #5d6671; --line: #e1e5ea; --accent: #0f6e56; --accent-soft: #e1f5ee; --warn: #8a5300; --warn-soft: #fff3df; --no: #a32d2d; --no-soft: #fcebeb; --info: #1d4f91; --info-soft: #e8f0fb; }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --bg: #15171b; --panel: #1d2025; --ink: #e9ebee; --muted: #a0a8b2; --line: #2f343b; --accent: #5dcaa5; --accent-soft: #10372d; --warn: #f0b35a; --warn-soft: #3a2f1c; --no: #f09595; --no-soft: #3b2220; --info: #8fb8f0; --info-soft: #1b2a40; } }
:root[data-theme="dark"] { --bg: #15171b; --panel: #1d2025; --ink: #e9ebee; --muted: #a0a8b2; --line: #2f343b; --accent: #5dcaa5; --accent-soft: #10372d; --warn: #f0b35a; --warn-soft: #3a2f1c; --no: #f09595; --no-soft: #3b2220; --info: #8fb8f0; --info-soft: #1b2a40; }
* { box-sizing: border-box; }
body { margin: 0; background: var(--bg); color: var(--ink); font: 15px/1.6 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
main { max-width: 1180px; margin: 0 auto; padding: 32px 16px 64px; }
header p { color: var(--muted); margin: 4px 0 0; }
nav { position: sticky; top: 0; z-index: 2; display: flex; flex-wrap: wrap; gap: 4px 14px; padding: 10px 0; margin-top: 16px; background: var(--bg); border-bottom: 1px solid var(--line); font-size: 14px; }
h1 { font-size: 28px; line-height: 1.25; margin: 0; }
h2 { font-size: 22px; margin: 48px 0 12px; scroll-margin-top: 56px; }
h3 { font-size: 17px; margin: 24px 0 8px; }
h4 { font-size: 15px; margin: 0 0 10px; }
a { color: var(--accent); }
.note { background: var(--warn-soft); color: var(--warn); border-radius: 8px; padding: 8px 12px; margin: 16px 0 0; }
.grid { display: grid; gap: 16px; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); }
.dir, .ref, .move, .trend, .comp, table { background: var(--panel); border: 1px solid var(--line); border-radius: 12px; }
.dir, .comp { padding: 16px; }
.comp { margin: 0 0 20px; scroll-margin-top: 56px; }
.dir .kind { color: var(--muted); font-size: 13px; margin: 0 0 8px; }
.dir ul { margin: 8px 0 0; padding-inline-start: 18px; }
.badge { display: inline-block; min-width: 28px; text-align: center; font-weight: 600; background: var(--accent-soft); color: var(--accent); border-radius: 6px; padding: 0 6px; margin-inline-end: 6px; }
.wrap { overflow-x: auto; }
table { width: 100%; border-collapse: separate; border-spacing: 0; overflow: hidden; }
th, td { text-align: start; vertical-align: top; padding: 9px 12px; border-bottom: 1px solid var(--line); }
th { font-size: 13px; color: var(--muted); font-weight: 600; }
tr:last-child td { border-bottom: 0; }
td.group, td.small { color: var(--muted); font-size: 13px; }
tr.alt td { opacity: 0.7; }
.chip { display: inline-block; font-size: 12px; font-weight: 600; border-radius: 999px; padding: 0 8px; white-space: nowrap; background: var(--bg); color: var(--muted); }
.chip--yes, .chip--high, .chip--shortlist, .chip--strong { background: var(--accent-soft); color: var(--accent); }
.chip--partly, .chip--medium, .chip--alternate, .chip--partial { background: var(--warn-soft); color: var(--warn); }
.chip--no, .chip--dropped { background: var(--no-soft); color: var(--no); }
.gap { display: inline-block; font-size: 12px; font-weight: 600; border-radius: 4px; padding: 0 5px; background: var(--info-soft); color: var(--info); text-decoration: none; }
.ref { overflow: hidden; display: flex; flex-direction: column; }
.shot { background: var(--bg); border: 1px solid var(--line); border-radius: 8px; aspect-ratio: 16 / 10; display: grid; place-items: center; overflow: hidden; }
.ref .shot { border: 0; border-bottom: 1px solid var(--line); border-radius: 0; }
.shot img { width: 100%; height: 100%; object-fit: cover; object-position: top; }
.noimg { font-size: 14px; text-align: center; padding: 16px; }
.body { padding: 12px 14px; }
.body p { margin: 0 0 8px; }
.meta { font-size: 13px; color: var(--muted); }
.meta b { color: var(--ink); }
.tag { display: inline-block; font-size: 12px; font-weight: 600; border-radius: 4px; padding: 0 6px; margin-inline-end: 4px; }
.tag.ok { background: var(--accent-soft); color: var(--accent); }
.tag.no { background: var(--no-soft); color: var(--no); }
.tag.rule { background: var(--warn-soft); color: var(--warn); }
.tag.adopt { background: var(--info-soft); color: var(--info); }
.src { font-size: 13px; }
.flow { border-top: 1px solid var(--line); padding-top: 14px; margin-top: 14px; scroll-margin-top: 56px; }
.flow p { margin: 6px 0 0; }
.steps { list-style: none; margin: 0; padding: 0; display: grid; gap: 12px; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); }
.steps p { font-size: 13px; }
.move, .trend { padding: 14px 16px; }
.move p, .trend p { margin: 4px 0 0; }
.small { font-size: 13px; color: var(--muted); }
.lists { display: grid; gap: 16px; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); margin-top: 16px; }
.lists ul { margin: 6px 0 0; padding-inline-start: 18px; }
code { font-size: 13px; }
</style>
</head>
<body>
<main>
<header>
  <p class="small">Research board · ${esc(R.made || new Date().toISOString().slice(0, 10))} · ${esc(R.depth === 'light' ? 'Light study (a new section or a change)' : 'Full study (a new page or a redesign)')}</p>
  <h1>${esc(R.feature || flow.title || flow.name || 'Feature')}</h1>
  ${R.question ? `<p>${esc(R.question)}</p>` : ''}
  ${R.mobbin_unavailable ? `<p class="note">Mobbin was not available (${esc(R.mobbin_unavailable)}): the references come from the web.</p>` : ''}
  ${check.errors.length ? `<p class="note">The research is not finished: ${check.errors.length} check${check.errors.length > 1 ? 's' : ''} still fail (node qa/board.mjs lists them).</p>` : ''}
</header>
<nav><a href="#start">Start here</a><a href="#findings">Findings</a><a href="#compare">Compare</a><a href="#competitors">Competitors</a>${dirs.length ? '<a href="#directions">Directions</a>' : ''}<a href="#references">References</a><a href="#trends">Trends</a><a href="#decisions">Decisions</a></nav>

<h2 id="start">Start here</h2>
<p><b>Ranked by:</b> ${esc(R.goal || '—')}${(R.constraints || []).length ? ` · <b>Constraints:</b> ${R.constraints.map(esc).join('; ')}` : ''}</p>
<h3>The gaps</h3>
<div class="wrap"><table><thead><tr><th>Gap</th><th>What</th><th>From</th><th>Answered by</th></tr></thead><tbody>${(R.gaps || []).map((g) => { const fl = (R.flows || []).filter((f) => (f.gaps || []).includes(g.id)), fi = findings.filter((f) => (f.gaps || []).includes(g.id)); return `<tr id="${esc(g.id)}"><td><span class="gap">${esc(g.id)}</span></td><td>${esc(g.title)}</td><td class="small">${esc(g.from || '')}</td><td class="small">${g.evidence ? esc(g.evidence) : `${fl.map((f) => refName(f.id)).join(', ') || '—'}${fi.length ? ` · findings ${fi.map((f) => `<a href="#${esc(f.id)}">${esc(f.id)}</a>`).join(', ')}` : ''}`}</td></tr>`; }).join('')}</tbody></table></div>
<h3>Competitors, by experience fit</h3>
<p class="small">Scored on what defines the experience, not the market. ${R.approved ? `Approved by ${esc(R.approved.by)} on ${esc(R.approved.date)}${R.approved.note ? ` (${esc(R.approved.note)})` : ''}.` : 'Not approved yet.'}</p>
<div class="wrap"><table><thead><tr><th>Competitor</th>${(R.traits || []).map((t) => `<th title="${esc(t.title)}">${esc(t.id)} · ${esc(t.title)}</th>`).join('')}<th>Gaps</th><th>Mobbin</th><th>Status</th></tr></thead><tbody>${['shortlist', 'alternate', 'dropped'].flatMap((st) => real.filter((c) => c.status === st)).map((c) => `<tr class="${c.status === 'shortlist' ? '' : 'alt'}"><td>${c.status === 'shortlist' ? `<a href="#${esc(c.id)}">${esc(c.name)}</a>` : esc(c.name)}<br><span class="small">${esc((GROUP_LABELS[c.group] || c.group))}</span></td>${(R.traits || []).map((t) => `<td>${chip((c.fit || {})[t.id])}</td>`).join('')}<td>${gapsOf(c.gaps)}</td><td>${chip(c.mobbin)}</td><td>${chip(c.status)}</td></tr>`).join('')}${comps.filter((c) => c.none).map((c) => `<tr class="alt"><td colspan="${(R.traits || []).length + 4}" class="small">${esc(GROUP_LABELS[c.group] || c.group)}: none does this job. Searched: ${esc(c.none)}</td></tr>`).join('')}</tbody></table></div>
<h3>How the evidence was gathered</h3>
<p class="small">Mobbin wide first, short queries naming the thing, to see what exists; then deep, each shortlisted app by name, one journey per gap. Rules read on each company's own help pages. "Not checked" means not seen either way.</p>
${(R.queries || []).length ? `<div class="wrap"><table><thead><tr><th>Pass</th><th>Query</th><th>Kept</th></tr></thead><tbody>${R.queries.map((q) => `<tr><td class="group">${esc(q.pass || '')}${q.tool ? ' · ' + esc(q.tool) : ''}</td><td>${esc(q.q || '')}</td><td class="small">${(q.kept || []).map(refName).join(', ') || '—'}</td></tr>`).join('')}</tbody></table></div>` : ''}

<h2 id="findings">Findings, ranked</h2>
<p class="small">Merged across competitors, ranked by impact on ${esc(R.goal || 'the goal')}: high removes a drop-off or a dead end in the main path, medium makes it clearer or faster. Effort: S copy or a state, M a new screen or step, L a new surface.</p>
<div class="wrap"><table><thead><tr><th>#</th><th>Recommendation</th><th>Gaps</th><th>Seen at</th><th>Impact</th><th>Effort</th><th>Where it lands</th><th>In</th></tr></thead><tbody>${findings.map((f, i) => `<tr id="${esc(f.id)}"><td>${i + 1}</td><td><b>${esc(f.title)}</b><br><span class="small">${esc(f.what)}${f.size ? ` · ${esc(SIZE[f.size] || f.size)}` : ''}</span></td><td>${gapsOf(f.gaps)}</td><td class="small">${(f.seen_at || []).map(refName).join(', ')}</td><td>${chip(f.impact)}</td><td>${esc(f.effort || '')}</td><td class="small">${esc(f.lands || '')}</td><td class="small">${usedBy(f.id).join(', ') || '—'}</td></tr>`).join('')}</tbody></table></div>

<h2 id="compare">Compare</h2>
<div class="wrap"><table><thead><tr><th>Capability</th><th>Profolio today</th>${short.map((c) => `<th>${esc(c.name)}</th>`).join('')}</tr></thead><tbody>${caps.map((k) => `<tr id="${esc(k.id)}"><td>${esc(k.title)} ${gapsOf(k.gaps)}</td><td>${chip((k.values || {}).us)}</td>${short.map((c) => `<td>${chip((k.values || {})[c.id])}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
<div class="lists">
  <section class="move"><h4>Where they are ahead</h4>${theyLead.length ? `<ul>${theyLead.map((k) => `<li>${esc(k.title)}: ${short.filter((c) => (rank[(k.values || {})[c.id]] ?? -1) > (rank[(k.values || {}).us] ?? 0)).map((c) => esc(c.name)).join(', ')}</li>`).join('')}</ul>` : '<p class="small">Nowhere in this comparison.</p>'}</section>
  <section class="move"><h4>Where Profolio is ahead: keep it</h4>${weLead.length ? `<ul>${weLead.map((k) => `<li>${esc(k.title)}</li>`).join('')}</ul>` : '<p class="small">Nowhere in this comparison.</p>'}</section>
</div>

<h2 id="competitors">Competitors, flow by flow</h2>
${short.map((c) => `<article class="comp" id="${esc(c.id)}">
  <h3>${link(c.url, c.name)} <span class="small">· ${esc(GROUP_LABELS[c.group] || c.group)}${c.seen && c.seen !== 'site' ? ` · seen via ${esc(SEEN[c.seen] || c.seen)}` : ''}</span></h3>
  <p>${(R.traits || []).map((t) => `${chip((c.fit || {})[t.id])} <span class="small">${esc(t.title)}</span>`).join(' &nbsp; ')}</p>
  <p class="small">${esc(c.why)}${c.does ? ` — ${esc(c.does)}` : ''}</p>
  ${(R.flows || []).filter((f) => f.competitor === c.id).map(flowBoard).join('') || '<p class="small">No flow documented.</p>'}
</article>`).join('')}

${dirs.length ? `<h2 id="directions">The directions</h2>
<div class="grid">${dirs.map((d) => `<section class="dir">
  <h3><span class="badge">${esc(d.id)}</span>${esc(d.title || '')}</h3>
  <p class="kind">${esc(KIND[d.kind] || d.kind)}${flow.chosen === d.id ? ' · chosen' : ''}</p>
  ${d.layout || d.hero ? `<p class="small"><b>Layout</b> ${esc(d.layout || '—')}${d.hero ? ` · <b>Read first</b> ${esc(d.hero)}` : ''}</p>` : ''}
  ${d.summary ? `<p>${esc(d.summary)}</p>` : ''}
  ${(d.fresh || []).length ? `<ul>${d.fresh.map((f) => { const m = findings.find((x) => x.id === f); return `<li><a href="#${esc(f)}">${esc(m ? m.title : f)}</a></li>`; }).join('')}</ul>` : '<p class="small">Uses no new pattern: the product as it is.</p>'}
  ${(qa.newTokens || []).filter((t) => t.dir === d.id).length ? `<p class="small">New tokens, for designer sign-off: ${(qa.newTokens || []).filter((t) => t.dir === d.id).map((t) => `<code>${esc(t.name)}: ${esc(t.value)}</code>`).join(', ')}</p>` : ''}
</section>`).join('')}</div>` : ''}

<h2 id="references">References${R.mobbin_unavailable ? '' : ' from Mobbin'}</h2>
<div class="grid">${(R.mobbin || []).map(card).join('')}${(R.web || []).map(card).join('')}</div>

<h2 id="trends">Trends</h2>
<div class="grid">${(R.trends || []).map((t) => `<section class="trend" id="${esc(t.id || '')}"><p class="small">${t.kind ? esc(t.kind === 'visual' ? 'Visual' : 'UX') + ' · ' : ''}${esc(t.date || '')}${t.source ? ' · ' + esc(t.source) : ''}</p><h3>${link(t.url, t.title)}</h3><p>${esc(t.takeaway)}</p></section>`).join('')}</div>

<h2 id="decisions">Decisions</h2>
<div class="wrap"><table><thead><tr><th>Date</th><th>Decision</th><th>Why</th></tr></thead><tbody>${(R.decisions || []).map((d) => `<tr><td class="small">${esc(d.date)}</td><td>${esc(d.what)}</td><td class="small">${esc(d.why || '')}</td></tr>`).join('')}</tbody></table></div>
${(R.rules || []).length ? `<h3>Rules verified</h3><div class="wrap"><table><thead><tr><th>Competitor</th><th>Rule</th><th>Source</th><th>Read</th></tr></thead><tbody>${R.rules.map((r) => `<tr id="${esc(r.id)}"><td>${esc(nameOf(r.competitor))}</td><td>${esc(r.rule)}</td><td class="small">${link(r.url, r.title)}</td><td class="small">${esc(r.read)}</td></tr>`).join('')}</tbody></table></div>` : ''}

${(R.rounds || []).length ? `<h2>Change requests</h2>
<div class="grid">${R.rounds.map((r, i) => `<section class="move"><p class="small">Round ${i + 1}${r.date ? ' · ' + esc(r.date) : ''}</p><h3>${esc(r.asked)}</h3><p class="small">References: ${(r.refs || []).map(refName).join(', ') || '—'}${(r.options || []).length ? ` · options in the prototype: ${r.options.map(esc).join(', ')}` : ''}</p></section>`).join('')}</div>` : ''}
</main>
</body>
</html>
`;
writeFileSync(join(RES, 'board.html'), html);

/* the findings summary: what someone reads instead of the board */
const md = (s) => String(s == null ? '' : s).replace(/\|/g, '\\|').replace(/\n/g, ' ');
const summary = [
  `# ${R.feature || flow.title || 'Feature'} — research summary`, '',
  `${R.question || ''}`, '',
  `${R.depth === 'light' ? 'Light' : 'Full'} study, ${R.made || ''}. Ranked by: ${R.goal || '—'}.${R.approved ? ` Competitors approved by ${R.approved.by} on ${R.approved.date}.` : ''}`, '',
  `**Compared:** ${short.map((c) => `${c.name} (${c.why})`).join('; ') || '—'}.`, '',
  '## Top findings', '',
  '| # | Recommendation | Gaps | Seen at | Impact | Effort | Lands |', '|---|---|---|---|---|---|---|',
  ...findings.map((f, i) => `| ${i + 1} | ${md(f.title)} | ${(f.gaps || []).join(', ')} | ${(f.seen_at || []).map(nameOf).map(md).join(', ')} | ${f.impact || ''} | ${f.effort || ''} | ${md(f.lands)} |`), '',
  '## Where they are ahead', '', ...(theyLead.length ? theyLead.map((k) => `- ${k.title}`) : ['- nowhere in this comparison']), '',
  '## Where Profolio is ahead — keep it', '', ...(weLead.length ? weLead.map((k) => `- ${k.title}`) : ['- nowhere in this comparison']), '',
  ...(unanswered.length ? ['## No evidence found', '', ...unanswered.map((g) => `- ${g.id} ${g.title}: ${g.evidence}`), ''] : []),
  ...(dirs.length ? ['## The directions', '', ...dirs.map((d) => `- **${d.id} · ${d.title || ''}** (${d.layout || '—'}; read first: ${d.hero || '—'}): ${(d.fresh || []).map((f) => (findings.find((x) => x.id === f) || {}).title || f).join('; ') || 'the product as it is'}`), ''] : []),
  `The board: ${flow.research && flow.research.board_url ? flow.research.board_url : 'research/board.html'}`, '',
].join('\n');
writeFileSync(join(RES, 'summary.md'), summary);

const n = (k) => (R[k] || []).length;
console.log(`  ${relative(process.cwd(), join(RES, 'board.html'))} and summary.md — ${n('gaps')} gaps · ${short.length} competitors shortlisted of ${real.length} · ${n('flows')} flows · ${n('rules')} rules · ${caps.length} capabilities · ${n('mobbin')} Mobbin and ${n('web')} web references · ${n('trends')} trends · ${findings.length} findings · ${dirs.length} directions${n('rounds') ? ` · ${n('rounds')} change request(s)` : ''}`);
for (const w of check.warnings) console.log(`  warn  ${w}`);
for (const e of check.errors) console.log(`  error ${e}`);
if (check.errors.length) { console.log(`  → ${check.errors.length} research error(s): fix research.json and run again (research/README.md)`); process.exit(1); }
console.log(`  → the research passes its checks (${R.depth || '?'} study: ${DEPTH[R.depth] ? `${DEPTH[R.depth].shortlist.join('–')} competitors, ${DEPTH[R.depth].findings.join('–')} findings` : '—'})`);
