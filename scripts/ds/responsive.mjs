#!/usr/bin/env node
/**
 * The responsive rulebook — how Profolio KSA's web layout (1440) becomes its
 * phone layout (375), read off the two compiled layouts rather than written
 * from memory.
 *
 * Every rule on the page is counted from the product: the overlays the phone
 * swaps (a web modal that opens as a phone drawer, found by pairing the two
 * layouts' states by the control that opens them), the components whose size
 * changes (each component's most used variant, measured in both layouts), the
 * components only one layout draws, and the breakpoints the stylesheet still
 * carries. A designer making a screen responsive reads the rules; a rule
 * links to the states it was counted from.
 *
 *   node scripts/ds/responsive.mjs
 *
 * Reads data/design-kb.json, data/ds/specs.json, data/ds/tokens.json.
 * Writes deliverables/responsive.html.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const D = join(ROOT, 'deliverables');
const json = (p, d) => (existsSync(join(ROOT, p)) ? JSON.parse(readFileSync(join(ROOT, p), 'utf8')) : d);
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const kb = json('data/design-kb.json', { screens: [], components: [] });
const specs = json('data/ds/specs.json', {});
const tokens = json('data/ds/tokens.json', {});
const rel = (p) => (p ? p.replace(/^deliverables\//, '') : null);
const link = (p, t) => (p ? `<a href="${rel(p)}">${esc(t)}</a>` : esc(t));

/* ── 1 · overlays: what each web kind becomes on a phone ─────────────────── */
const OVERLAY = ['modal', 'drawer', 'popover', 'dropdown', 'select', 'picker', 'tooltip', 'tour', 'message', 'tab', 'inline'];
const swaps = new Map();                          /* "modal→drawer" → [[screen, state]] */
const same = new Map();                           /* kind → count drawn the same on both */
const webOnlyKinds = new Map(), phoneOnlyKinds = new Map();
for (const s of kb.screens) {
  for (const x of s.states) {
    if (!OVERLAY.includes(x.kind)) continue;
    if (x.responsiveName && x.responsiveKind && x.responsiveKind !== x.kind) {
      const k = `${x.kind}→${x.responsiveKind}`;
      if (!swaps.has(k)) swaps.set(k, []);
      swaps.get(k).push([s, x]);
    } else if (x.files.web && x.files.responsive) same.set(x.kind, (same.get(x.kind) || 0) + 1);
    else if (x.files.web) webOnlyKinds.set(x.kind, (webOnlyKinds.get(x.kind) || 0) + 1);
    else if (x.files.responsive) phoneOnlyKinds.set(x.kind, (phoneOnlyKinds.get(x.kind) || 0) + 1);
  }
}
const swapRows = [...swaps.entries()].sort((a, b) => b[1].length - a[1].length);

/* ── 2 · components whose size changes ──────────────────────────────────── */
const bySlug = new Map();
for (const [id, v] of Object.entries(specs)) {
  if (!bySlug.has(v.component)) bySlug.set(v.component, { name: v.name, level: v.level, web: [], mobile: [] });
  bySlug.get(v.component)[v.device === 'mobile' ? 'mobile' : 'web'].push({ id, ...v });
}
const main = (list) => [...list].sort((a, b) => b.count - a.count)[0];
const sizeRows = [];
for (const [slug, c] of bySlug) {
  if (!c.web.length || !c.mobile.length || c.level === 'page' || c.level === 'template') continue;
  /* the same variant in both layouts where there is one, else the most used */
  const w = main(c.web);
  const m = c.mobile.find((x) => x.sig === w.sig) || main(c.mobile);
  const d = [];
  const h = [w.spec.size[1], m.spec.size[1]];
  if (Math.abs(h[0] - h[1]) >= 2) d.push(`height ${Math.round(h[0])} → ${Math.round(h[1])}`);
  if (w.spec.type && m.spec.type && w.spec.type.size !== m.spec.type.size) d.push(`type ${w.spec.type.size} → ${m.spec.type.size}`);
  const pw = w.spec.padding.join(' '), pm = m.spec.padding.join(' ');
  if (pw !== pm) d.push(`padding ${pw} → ${pm}`);
  if (w.spec.radius[0] !== m.spec.radius[0]) d.push(`radius ${w.spec.radius[0]} → ${m.spec.radius[0]}`);
  if (Math.abs(w.spec.size[0] - m.spec.size[0]) >= 40 && m.spec.size[0] >= 300) d.push(`width ${Math.round(w.spec.size[0])} → ${Math.round(m.spec.size[0])} (full width)`);
  if (d.length) sizeRows.push({ slug, name: c.name, level: c.level, d, sameVariant: m.sig === w.sig });
}
sizeRows.sort((a, b) => ['atom', 'molecule', 'organism'].indexOf(a.level) - ['atom', 'molecule', 'organism'].indexOf(b.level) || a.name.localeCompare(b.name));

/* ── 3 · only in one layout ─────────────────────────────────────────────── */
const compName = new Map(kb.components.map((c) => [c.slug, c]));
const onlyWeb = new Map(), onlyPhone = new Map();
for (const s of kb.screens) {
  for (const x of s.onlyWeb || []) { if (!onlyWeb.has(x)) onlyWeb.set(x, []); onlyWeb.get(x).push(s.slug); }
  for (const x of s.onlyResponsive || []) { if (!onlyPhone.has(x)) onlyPhone.set(x, []); onlyPhone.get(x).push(s.slug); }
}
/* a component one layout draws on some screen but the other layout draws
   elsewhere is not layout-only — keep those that no screen of the other
   layout has */
const allWeb = new Set(kb.screens.flatMap((s) => (s.components || []).map((c) => c.slug)));
const allPhone = new Set(kb.screens.flatMap((s) => (s.componentsResponsive || []).map((c) => c.slug)));
const trulyWeb = [...onlyWeb.entries()].filter(([x]) => !allPhone.has(x)).filter(([x]) => compName.get(x) && compName.get(x).level !== 'page');
const trulyPhone = [...onlyPhone.entries()].filter(([x]) => !allWeb.has(x)).filter(([x]) => compName.get(x) && compName.get(x).level !== 'page');

/* ── 4 · the shell ──────────────────────────────────────────────────────── */
const shellOf = (dev) => {
  const pick = (slugRe) => Object.values(specs).filter((v) => (v.device || 'web') === dev && slugRe.test(v.component)).sort((a, b) => b.count - a.count)[0];
  const header = pick(/^antd-layout-header$/), sider = pick(/^antd-layout-sider$/);
  return { header: header && header.spec.size, sider: sider && sider.spec.size };
};
const shell = { web: shellOf('web'), mobile: shellOf('mobile') };

/* ── 5 · the breakpoints the stylesheet still carries ───────────────────── */
const bps = (tokens.breakpoints || []).slice(0, 14);

/* ── 6 · per screen: what the phone does with it ───────────────────────── */
const screenRows = kb.screens.map((s) => {
  const w = s.states.filter((x) => x.files.web).length, m = s.states.filter((x) => x.files.responsive).length;
  const ow = (s.onlyWeb || []).map((x) => compName.get(x)).filter((c) => c && ['organism', 'molecule'].includes(c.level)).slice(0, 4);
  const op = (s.onlyResponsive || []).map((x) => compName.get(x)).filter((c) => c && ['organism', 'molecule'].includes(c.level)).slice(0, 4);
  return { s, w, m, ow, op };
});

const kinds = (m) => [...m.entries()].sort((a, b) => b[1] - a[1]).map(([k, n]) => `${esc(k)} ${n}`).join(' · ') || '—';
const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Responsive rules — Profolio KSA design system</title>
<link rel="stylesheet" href="ds.css">
</head>
<body class="ds ds-qa">
<nav class="ds-crumbs"><a href="design-system.html">Profolio KSA design system</a> <span>›</span> Responsive rules</nav>
<main class="ds-main">
<header class="ds-head">
  <p class="ds-kicker">The responsive rulebook</p>
  <h1>Web to phone</h1>
  <p class="ds-lede">How the product's web layout (1440) becomes its phone layout (375) — every rule counted from the two compiled layouts, with the states it was counted from. ${kb.counts ? `${kb.counts.web} web and ${kb.counts.responsive} responsive files.` : ''}</p>
</header>

<section class="ds-section"><h2>How the product chooses</h2>
<p class="ds-note">By <b>device</b>, not by window width: <code>isMobile()</code> in <code>src/utility/general.js</code> reads the user agent, and a phone gets a different component tree — a header with a menu button, the rail as a drawer, listings as cards. A narrow desktop window gets the web layout, squeezed. Inside each layout the stylesheet still carries width breakpoints:</p>
<ul class="ds-uses">${bps.map(([q, n]) => `<li><code>${esc(q.replace(/^@media\s*/, ''))}</code> <small>${n}×</small></li>`).join('')}</ul>
</section>

<section class="ds-section"><h2>The shell</h2>
<table class="ds-scale"><tr><th></th><th>web · 1440</th><th>phone · 375</th></tr>
<tr><td>header</td><td>${shell.web.header ? `${Math.round(shell.web.header[0])} × ${Math.round(shell.web.header[1])}` : '—'}</td><td>${shell.mobile.header ? `${Math.round(shell.mobile.header[0])} × ${Math.round(shell.mobile.header[1])}, with the menu button, the page title, notifications and the account` : '—'}</td></tr>
<tr><td>navigation</td><td>the rail: ${shell.web.sider ? `${Math.round(shell.web.sider[0])}px collapsed` : 'collapsed'}, 220px on hover (<a href="states/dashboard--rail-expanded.html">expanded</a>)</td><td>a drawer the menu button opens (<a href="mobile/states/dashboard--mobile-menu.html">menu</a>) — no rail</td></tr>
<tr><td>on the dashboard</td><td>—</td><td>an app-install banner, 66px, fixed above the header (<a href="mobile/dashboard.html">dashboard</a>)</td></tr>
</table>
</section>

<section class="ds-section"><h2>Overlays</h2>
<p class="ds-note">The same control, opened in both layouts: what it opens on the web, and what it opens on a phone. Paired by the control that opens them.</p>
<table class="ds-scale"><tr><th>rule</th><th>times</th><th>for example</th></tr>
${swapRows.map(([k, list]) => `<tr><td><b>${esc(k.replace('→', ' on the web → '))} on a phone</b></td><td>${list.length}</td><td>${list.slice(0, 4).map(([s, x]) => `${esc(s.slug)}: ${link(x.files.web, x.name)} → ${link(x.files.responsive, x.responsiveName)}`).join('<br>')}</td></tr>`).join('\n')}
<tr><td>the same kind in both layouts</td><td>${[...same.values()].reduce((a, b) => a + b, 0)}</td><td>${kinds(same)}</td></tr>
<tr><td>on the web only</td><td>${[...webOnlyKinds.values()].reduce((a, b) => a + b, 0)}</td><td>${kinds(webOnlyKinds)} — mostly hover-opened popovers and tooltips, which a phone has no pointer for</td></tr>
<tr><td>on a phone only</td><td>${[...phoneOnlyKinds.values()].reduce((a, b) => a + b, 0)}</td><td>${kinds(phoneOnlyKinds)}</td></tr>
</table>
</section>

<section class="ds-section"><h2>Components that change size</h2>
<p class="ds-note">Each component's most used variant, measured in both layouts (the same variant where the phone has it). ${sizeRows.length} change; the rest are the same size on a phone.</p>
<table class="ds-scale"><tr><th>component</th><th>level</th><th>web → phone</th></tr>
${sizeRows.slice(0, 80).map((r) => `<tr><td><a href="components/${r.slug}.html">${esc(r.name)}</a>${r.sameVariant ? '' : ' <small>(another variant)</small>'}</td><td>${esc(r.level)}</td><td>${r.d.map(esc).join(' · ')}</td></tr>`).join('\n')}
</table>
</section>

<section class="ds-section"><h2>Only in one layout</h2>
<h3>Only on the web <small>${trulyWeb.length}</small></h3>
<ul class="ds-chips">${trulyWeb.slice(0, 60).map(([x, sc]) => `<li><a href="components/${x}.html">${esc(compName.get(x).name)}</a> <small>${esc(compName.get(x).level)} · ${sc.length} screen${sc.length > 1 ? 's' : ''}</small></li>`).join('')}</ul>
<h3>Only on a phone <small>${trulyPhone.length}</small></h3>
<ul class="ds-chips">${trulyPhone.slice(0, 60).map(([x, sc]) => `<li><a href="components/${x}.html">${esc(compName.get(x).name)}</a> <small>${esc(compName.get(x).level)} · ${sc.length} screen${sc.length > 1 ? 's' : ''}</small></li>`).join('')}</ul>
</section>

<section class="ds-section"><h2>Screen by screen</h2>
<table class="ds-scale"><tr><th>screen</th><th>states web · phone</th><th>only on the web</th><th>only on a phone</th></tr>
${screenRows.map(({ s, w, m, ow, op }) => `<tr><td><a href="../kb/screens/${s.slug}.html">${esc(s.title)}</a></td><td>${w} · ${m}</td><td>${ow.map((c) => `<a href="components/${c.slug}.html">${esc(c.name)}</a>`).join(', ') || '—'}</td><td>${op.map((c) => `<a href="components/${c.slug}.html">${esc(c.name)}</a>`).join(', ') || '—'}</td></tr>`).join('\n')}
</table>
</section>
</main>
</body>
</html>
`;
writeFileSync(join(D, 'responsive.html'), html);
console.log(`  deliverables/responsive.html — ${swapRows.length} overlay rules (${swapRows.map(([k, l]) => `${k} ${l.length}`).join(', ')}) · ${sizeRows.length} components change size · ${trulyWeb.length} web-only · ${trulyPhone.length} phone-only`);
