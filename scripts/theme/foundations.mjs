#!/usr/bin/env node
/**
 * The NEW My Listings' foundations — its tokens, as the designer declares them
 * (authoring/themes/new/my-listings.tokens.json) and as its build paints them
 * (data/theme/painted.json, from scripts/theme/painted.mjs).
 *
 * These are My Listings' tokens only. The redesign starts there (Profolio
 * 2.0); every other page keeps the current theme, whose foundations stay as
 * they are. So nothing here replaces a current token: the new ones are named
 * --pf-ml-* and live in their own file.
 *
 * What the Foundations section shows is measured, not assumed: each token
 * with how often the new build paints it, the typefaces by their share of the
 * text, the teal that stays (and exactly where), and every place the tokens
 * and the build disagree.
 *
 *   node scripts/theme/foundations.mjs
 *
 * Writes deliverables/new-theme/tokens.css, data/theme/foundations.html (the
 * catalogue embeds it under Foundations) and data/theme/foundations.json
 * (scripts/package.mjs writes it into the skill's tokens.md).
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const T = JSON.parse(readFileSync(join(ROOT, 'authoring', 'themes', 'new', 'my-listings.tokens.json'), 'utf8'));
const P = JSON.parse(readFileSync(join(ROOT, 'data', 'theme', 'painted.json'), 'utf8'));
const STATES = JSON.parse(readFileSync(join(ROOT, 'data', 'theme', 'states.json'), 'utf8'));
const CUR = existsSync(join(ROOT, 'data', 'ds', 'tokens.json')) ? JSON.parse(readFileSync(join(ROOT, 'data', 'ds', 'tokens.json'), 'utf8')) : null;
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const wbr = (s) => esc(s).replace(/([a-z])([A-Z0-9])/g, '$1<wbr>$2');
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
const kebab = (s) => String(s).replace(/([a-z])([A-Z0-9])/g, '$1-$2').replace(/^-/, 'm').toLowerCase();

/* ── what is painted ────────────────────────────────────────────────── */
const hexUses = new Map(P.colours.map((c) => [c.value, c]));
const usesOf = (hex) => (hexUses.get(String(hex).toUpperCase()) || { uses: 0 }).uses;
const lum = (hex) => { const m = String(hex).match(/^#([\da-f]{2})([\da-f]{2})([\da-f]{2})/i); if (!m) return 0; const ch = (v) => { v = parseInt(v, 16) / 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * ch(m[1]) + 0.7152 * ch(m[2]) + 0.0722 * ch(m[3]); };
const states = Object.values(STATES).filter((s) => s.file);
const web = states.filter((s) => !s.file.includes('/mobile/')).length, phone = states.length - web;
/* the current theme's names for a value, to say what a carried-over colour is */
const curNames = new Map();
if (CUR) for (const p of CUR.palettes) for (const r of p.rows) for (const c of r.colours) if (/^#/.test(c.value)) (curNames.get(c.value.toUpperCase()) || curNames.set(c.value.toUpperCase(), []).get(c.value.toUpperCase())).push(c.name);

/* ── tokens.css ─────────────────────────────────────────────────────── */
const vars = [];
const C = T.color;
vars.push('  /* primary — the green ramp, lightest (−1) to darkest (11); 8 is the brand green */');
for (const k of Object.keys(C.primary).sort((a, b) => +a - +b)) vars.push(`  --pf-ml-primary-${k === '-1' ? 'm1' : k}: ${C.primary[k]};`);
for (const g of ['brand', 'tint', 'status', 'text', 'border', 'surface', 'gradient']) { vars.push(`  /* ${g} */`); for (const [k, v] of Object.entries(C[g])) vars.push(`  --pf-ml-${g}-${kebab(k)}: ${v};`); }
vars.push('  /* radius, px */'); for (const [k, v] of Object.entries(T.radius)) vars.push(`  --pf-ml-radius-${k}: ${v}px;`);
vars.push('  /* space, px */'); for (const [k, v] of Object.entries(T.space)) vars.push(`  --pf-ml-space-${k}: ${v}px;`);
vars.push('  /* type — the families, then each role as a font shorthand (phone, 360pt) */');
const FALLBACK = { ui: 'Geist, "Helvetica Neue", Helvetica, sans-serif', app: 'Lato, sans-serif', chrome: 'Figtree, sans-serif', mono: '"JetBrains Mono", ui-monospace, monospace' };
for (const [k, v] of Object.entries(T.type.family)) vars.push(`  --pf-ml-font-${k}: ${FALLBACK[k] || v};`);
for (const [k, r] of Object.entries(T.type)) if (k !== 'family') { vars.push(`  --pf-ml-type-${kebab(k)}: ${r.weight} ${r.size}px/${r.line}px var(--pf-ml-font-${r.family === 'Figtree' ? 'chrome' : 'ui'});`); if (r.color) vars.push(`  --pf-ml-type-${kebab(k)}-color: ${r.color};`); }
vars.push('  /* motion */'); for (const [k, m] of Object.entries(T.motion)) vars.push(`  --pf-ml-motion-${kebab(k)}: ${m.duration}ms ${m.curve};${m.note ? ` /* ${m.note} */` : ''}`);
vars.push('  /* elevation */'); for (const [k, v] of Object.entries(T.elevation)) vars.push(`  --pf-ml-elevation-${kebab(k)}: ${v};`);
vars.push('  /* touch targets, px */'); for (const [k, v] of Object.entries(T.target)) vars.push(`  --pf-ml-target-${kebab(k)}: ${v}px;`);
mkdirSync(join(ROOT, 'deliverables', 'new-theme'), { recursive: true });
writeFileSync(join(ROOT, 'deliverables', 'new-theme', 'tokens.css'), `/* My Listings — new theme (Profolio 2.0, not yet live) · [design]
   The designer's tokens (authoring/themes/new/my-listings.tokens.json, "${T.$meta.name}",
   base ${T.$meta.base}, updated ${T.$meta.updated}) as CSS custom properties.
   MY LISTINGS ONLY — every other page keeps ../tokens.css (the current theme).
   Written by scripts/theme/foundations.mjs; how often the build paints each: design-system.html#new-theme-tokens. */
:root {
${vars.join('\n')}
}
`);

/* a gradient token, as the build computes it (hex stops become rgb, spaces after commas) */
const gradientUses = (v) => { const norm = (x) => String(x).replace(/#([\da-f]{6})/gi, (m, h) => `rgb(${parseInt(h.slice(0, 2), 16)},${parseInt(h.slice(2, 4), 16)},${parseInt(h.slice(4), 16)})`).replace(/\s+/g, ''); const g = P.gradients.find((x) => norm(x.value) === norm(v)); return g ? g.uses : 0; };

/* ── the Foundations subsection ─────────────────────────────────────── */
const chip = (name, hex, { key, note } = {}) => {
  const n = /^#/.test(hex) ? usesOf(hex) : null;
  return `<figure class="ds-chip${key ? ' ds-chip--key' : ''}${lum(hex) > 0.9 ? ' ds-chip--pale' : ''}" title="${esc(name)} · ${esc(hex)}"><i style="background:${hex}"></i><figcaption><b>${wbr(name)}</b><code>${esc(String(hex).toUpperCase())}</code><span>${n === null ? 'declared' : n ? plural(n, 'use') : 'declared, not painted'}</span>${note ? `<em>${esc(note)}</em>` : ''}</figcaption></figure>`;
};
const ramp = (label, items) => `<div class="ds-ramp"><div class="ds-ramp-label">${esc(label)}</div><div class="ds-ramp-row">${items.join('')}</div></div>`;
const primary = Object.keys(C.primary).sort((a, b) => +a - +b).map((k) => chip(`primary ${k}`, C.primary[k], { key: k === '8', note: k === '8' ? 'brand green' : '' }));
const group = (g, notes = {}) => Object.entries(C[g]).filter(([, v]) => /^#/.test(v)).map(([k, v]) => chip(`${g}.${k}`, v, { note: notes[k] }));

/* teal: where the new My Listings still paints it, and under which names */
const TEALS = ['#006169', '#F2FAFA', '#F7FCFC', '#4F7B7D'];
const tealRows = TEALS.map((h) => ({ hex: h, uses: usesOf(h), parts: (hexUses.get(h) || { parts: [] }).parts, names: [...(curNames.get(h) || []).map((n) => `${n} (current theme)`), ...Object.entries(C.tint).filter(([, v]) => v.toUpperCase() === h).map(([k]) => `tint.${k} (new)`)] })).filter((r) => r.uses);
const namedTeal = tealRows.filter((r) => r.names.length);

const fam = P.families.filter((f) => f.uses > 0);
const famTotal = fam.reduce((a, f) => a + f.uses, 0) || 1;
const share = (f) => `${Math.round((1000 * ((fam.find((x) => x.family === f) || { uses: 0 }).uses)) / famTotal) / 10}%`;
const figtreeWords = [...new Set(P.text.filter((t) => t.family === 'Figtree').sort((a, b) => b.uses - a.uses).flatMap((t) => t.words).filter((w) => w.length > 3 && !/^\d/.test(w)))].slice(0, 6);
const geistWeights = [...new Set(P.text.filter((t) => t.family === 'Geist').map((t) => Math.round(t.weight / 100) * 100))].sort();

/* type as drawn, per layout: whole sizes drawn five times or more */
const scale = (device) => {
  const by = new Map();
  for (const t of P.text.filter((x) => x.family === 'Geist' && x.devices.includes(device) && Number.isInteger(x.size))) {
    const e = by.get(t.size) || by.set(t.size, { size: t.size, uses: 0, w: new Map(), words: [] }).get(t.size);
    e.uses += t.uses; e.w.set(t.weight, (e.w.get(t.weight) || 0) + t.uses); e.words.push(...t.words);
  }
  return [...by.values()].filter((e) => e.uses >= 5).sort((a, b) => b.size - a.size);
};
const scaleHtml = (device) => `<div class="ds-typescale">${scale(device).map((e) => { const ws = [...e.w.entries()].sort((a, b) => b[1] - a[1]); const words = [...new Set(e.words.filter((w) => w.length >= 4 && w.length <= 34 && !/^[\d\s.,%+-]+$/.test(w)))].slice(0, 3); return `<div class="ds-ts-row"><div class="ds-ts-spec"><b>${e.size}</b></div><div class="ds-ts-sample" style="font-family:Geist,sans-serif;font-size:${e.size}px;font-weight:${ws[0][0]}">${esc(words.join(' · '))}</div><div class="ds-ts-weights">${ws.slice(0, 5).map(([w, n]) => `<span style="font-weight:${w}">${w}<small>${n}</small></span>`).join('')}</div><div class="ds-ts-uses">${e.uses}</div></div>`; }).join('')}</div>`;
const roles = Object.entries(T.type).filter(([k]) => k !== 'family');
const SAMPLE = { price: '1,500,000', subtype: 'Apartment for Sale', location: 'Al Hazm, West Riyadh', stat: '1,288', label: 'Views', sheetTitle: 'Listing Performance', body: 'Buyers find it but do not enquire. Trust and detail convert views into leads.' };
const rolesHtml = `<div class="ds-styles">${roles.map(([k, r]) => `<div class="ds-style"><div class="ds-style-sample" style="font-family:${r.family === 'Figtree' ? 'Figtree' : 'Geist'},sans-serif;font-size:${r.size}px;line-height:${r.line}px;font-weight:${r.weight};${r.color ? `color:${r.color}` : ''}">${esc(SAMPLE[k] || k)}</div><div class="ds-style-meta"><b>${esc(k)}</b><span>${r.size} / ${r.line} · ${r.weight}</span><span>${esc(r.family || 'Geist')}</span>${r.color ? `<code>${esc(r.color)}</code>` : ''}<code>--pf-ml-type-${kebab(k)}</code></div></div>`).join('')}</div>`;

/* corners: the token scale, with what is painted at each */
const radUses = new Map(P.radii.map((r) => [r.value, r.uses]));
const tokenCorner = (k, v) => { const val = v >= 999 ? 'pill' : `${v}px`; const n = v >= 999 ? radUses.get('pill') || 0 : (radUses.get(val) || 0) + (radUses.get(`${v}px ${v}px 0px 0px`) || 0); return `<figure class="ds-corner${v >= 999 ? ' ds-corner--pill' : ''}"><i style="border-radius:${v >= 999 ? '999px' : v === 20 ? '20px 20px 0 0' : `${v}px`};border-color:#28B16D;background:#E9F7F0"></i><figcaption><b>${esc(k)} · ${v >= 999 ? 'pill' : `${v}px`}</b><code>--pf-ml-radius-${k}</code><span>${n ? plural(n, 'use') : 'declared, not painted'}${v === 20 ? ' · top corners, a sheet' : ''}</span></figcaption></figure>`; };
const tokenRadii = new Set(Object.values(T.radius).flatMap((v) => (v >= 999 ? ['pill'] : [`${v}px`, `${v}px ${v}px 0px 0px`])));
const offScale = P.radii.filter((r) => !tokenRadii.has(r.value) && r.value !== 'circle' && r.uses >= 2);

/* where the tokens and the build disagree */
const mismatch = [];
const shadowsPainted = P.shadows.map((s) => s.value);
/* a shadow, as its colour and lengths, whichever order it was written in */
const shadow = (v) => {
  const colour = (String(v).match(/rgba?\([^)]*\)/) || [''])[0].replace(/\s+/g, '').replace(/^rgb\((.*)\)$/, 'rgba($1,1)');
  const lens = String(v).replace(/rgba?\([^)]*\)/, '').replace(/inset/, '').trim().split(/\s+/).map((x) => parseFloat(x) || 0);
  while (lens.length < 4) lens.push(0);
  return `${colour} ${lens.join(' ')}${/inset/.test(v) ? ' inset' : ''}`;
};
for (const [k, v] of Object.entries(T.elevation)) {
  if (shadowsPainted.some((s) => shadow(s) === shadow(v))) continue;
  const [x, y] = shadow(v).split(' ').slice(1, 3);
  const near = P.shadows.filter((s) => { const [a, b] = shadow(s.value).split(' ').slice(1, 3); return a === x && b === y && /inset/.test(s.value) === /inset/.test(v); });
  const at = near.map((s) => `${s.value} on ${[...new Set((s.parts || []).map((p) => p.replace(/^(web|mobile):/, '')))].join(', ')}`);
  mismatch.push({ token: `elevation.${k}`, declared: v, painted: near.length ? `not painted as declared — at that offset the build paints ${at.join('; ')}` : 'painted nowhere in the compiled states' });
}
/* the words each role draws on a phone listing card and its sheets — the fixture's own prices
   and view counts, its subtypes, places, stat labels and sheet titles */
const ROLE_WORDS = {
  price: /^(1,500,000|640,000|960,000|895,000|850,000)$/,
  subtype: /^(Apartment|Villa|Townhouse) for (Sale|Rent|Daily Rental)$/,
  location: /^[A-Z][a-z]+ ?[A-Za-z]*, (North |South |East |West |Central )?(Riyadh|Jeddah|Madinah)$/,
  stat: /^(1,288|988|4,180|1,640|22,412|12,855)$/,
  label: /^(Views|Clicks|Leads)$/,
  sheetTitle: /^(Listing Performance|Filters|Sort listings|Share Bayut Link|Request Services|Listing actions|Delete this listing\?|TruCheck|How to Earn Quality Score\?|Date range)$/,
};
const styleOf = (x) => `${x.family} ${x.size}/${x.lh} · ${x.weight}${x.colour ? ` · ${x.colour}` : ''}`;
/* a role holds when every phone string it draws has its face, size, line height, weight and
   colour; otherwise each style the phone draws it in is named, with where and how often */
for (const [k, r] of roles) {
  const face = r.family || 'Geist';
  const want = `${face} ${r.size}/${r.line} · ${r.weight}${r.color ? ` · ${r.color.toUpperCase()}` : ''}`;
  /* a title is a title's size: a menu item with a title's words is not one; a stat label sits
     over its value at 11px — the trend's Views / Clicks / Leads switch (12px) is a control */
  const own = (P.strings || []).filter((x) => x.device === 'mobile' && ROLE_WORDS[k] && ROLE_WORDS[k].test(x.w) && (k !== 'sheetTitle' || x.size >= 16) && (k !== 'label' || x.size <= 11));
  if (!own.length) continue;
  const groups = new Map();
  for (const x of own) { const key = r.color ? styleOf(x) : styleOf({ ...x, colour: null }); const g = groups.get(key) || groups.set(key, { n: 0, parts: new Set(), w: x.w }).get(key); g.n += x.n; g.parts.add(x.part); }
  if ([...groups.keys()].every((g) => g === want)) continue;
  const list = [...groups.entries()].sort((a, b) => b[1].n - a[1].n).slice(0, 3).map(([st, g]) => `${st} ×${g.n} (${[...g.parts].slice(0, 3).join(', ')}; "${g.w}")`);
  mismatch.push({ token: `type.${k}`, declared: want, painted: `the phone draws it as ${list.join('; ')}` });
}
/* the sheet's corner: the top corners of every phone sheet */
{
  /* a sheet's corners: the top-only radii of the phone's sheets, 10px and up (a tag's 3px is not a sheet) */
  const tops = P.radii.filter((x) => /^(\d+)px \1px 0px 0px$/.test(x.value) && parseFloat(x.value) >= 10).map((x) => ({ ...x, parts: (x.parts || []).filter((p) => p.startsWith('mobile:') && /sheet$/i.test(p)) })).filter((x) => x.parts.length);
  const off = tops.filter((x) => x.value !== `${T.radius.sheet}px ${T.radius.sheet}px 0px 0px`);
  if (off.length) mismatch.push({ token: 'radius.sheet', declared: `${T.radius.sheet}px (top corners)`, painted: tops.map((x) => `${x.value.split(' ')[0]} on ${[...new Set(x.parts.filter((p) => p.startsWith('mobile:')).map((p) => p.slice(7)))].join(', ')}`).join('; ') });
}
/* touch targets: what a finger can hit on the phone, below the declared minimum */
{
  /* an icon button: a square-ish control a finger aims at (not a glyph, not a sheet's grab handle) */
  const small = (P.targets || []).filter((t) => t.device === 'mobile').map((t) => ({ ...t, w: +t.size.split('x')[0], h: +t.size.split('x')[1] })).filter((t) => Math.min(t.w, t.h) < T.target.iconButton && t.w <= 60 && t.h <= 60 && Math.min(t.w, t.h) >= 20 && Math.max(t.w, t.h) / Math.min(t.w, t.h) <= 1.5);
  if (small.length) mismatch.push({ token: 'target.iconButton', declared: `${T.target.iconButton}px (target.min ${T.target.min}px)`, painted: `the phone's icon buttons are ${small.sort((a, b) => b.n - a.n).slice(0, 4).map((t) => `${t.size} (${[...new Set(t.parts)].slice(0, 2).join(', ')}${t.labels[0] ? `; "${t.labels[0]}"` : ''})`).join(', ')}` });
}
/* the translucent colours (the scrim) and the page ground, per layout */
const rgbaHex = (v) => { const m = String(v).match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/); if (!m) return null; const h = '#' + [m[1], m[2], m[3]].map((x) => (+x).toString(16).padStart(2, '0')).join('').toUpperCase(); return m[4] === undefined || +m[4] === 1 ? h : `${h} ${Math.round(+m[4] * 100)}%`; };
for (const [g, vals] of Object.entries(C)) for (const [k, v] of Object.entries(vals)) {
  if (!/^rgba/.test(v)) continue;
  const want = rgbaHex(v);
  if (hexUses.has(want)) continue;
  const alpha = want.split(' ')[1];
  const near = P.colours.filter((c) => c.value.endsWith(` ${alpha}`)).sort((a, b) => b.uses - a.uses)[0];
  mismatch.push({ token: `color.${g}.${k}`, declared: v, painted: near ? `not painted — the build's ${alpha} layer is ${near.value} (${near.uses} uses)` : 'not painted' });
}
for (const dev of ['web', 'mobile']) {
  const grounds = (P.grounds || []).filter((x) => x.device === dev).sort((a, b) => b.states - a.states);
  if (grounds.length && grounds[0].colour !== C.surface.page.toUpperCase()) mismatch.push({ token: 'color.surface.page', declared: C.surface.page, painted: `the ${dev === 'web' ? 'web' : 'phone'} page is ${grounds[0].colour} (${grounds[0].label}, ${grounds[0].states} states)` });
}
for (const f of Object.entries(T.type.family)) if (!fam.some((x) => x.family === f[1])) mismatch.push({ token: `type.family.${f[0]}`, declared: f[1], painted: 'not painted' });
if ((P.sar || []).length) {
  const places = [...new Set(P.sar.map((x) => `${x.part} (${x.device === 'mobile' ? 'phone' : 'web'})`))];
  const samples = [...new Set(P.sar.map((x) => x.words))].slice(0, 4).map((w) => `"${w}"`);
  mismatch.push({ token: 'currency', declared: 'the product writes the riyal as its icon glyph, never "SAR"', painted: `"SAR" as text in ${places.join(', ')} — e.g. ${samples.join(', ')}` });
}

const lato = fam.find((f) => f.family === 'Lato');
const html = `
<h3 id="new-theme-tokens">My Listings — new theme <small>Profolio 2.0 · not yet live · My Listings only</small></h3>
<p class="ds-note">The redesign starts with My Listings. These are <b>its</b> tokens — the designer’s <code>tokens.json</code> (“${esc(T.$meta.name)}”, base ${esc(T.$meta.base)}, ${esc(T.$meta.updated)}) — held against what its build paints, measured off the ${states.length} compiled states of the new My Listings (${web} web at 1440, ${phone} phone at 360). Every other page keeps the current theme above. The values are in <a href="new-theme/tokens.css"><code>new-theme/tokens.css</code></a> as <code>--pf-ml-*</code>; they replace no current token. The handover draws My Listings with its own header and rail; whether the product’s shell changes with it is [TBC].</p>
<h4>Typefaces</h4>
<div class="ds-faces">
<figure class="ds-face"><div class="ds-face-art" style="font-family:Geist,sans-serif">Aa</div><figcaption><h4 style="font-family:Geist,sans-serif">Geist</h4><p>Latin · variable, 300–800 · <b>My Listings only</b> · ${share('Geist')} of the text the new My Listings draws</p>
<div class="ds-face-line" style="font-family:Geist,sans-serif">ABCDEFGHIJKLMNOPQRSTUVWXYZ<br>abcdefghijklmnopqrstuvwxyz<br>0123456789 · 1,500,000 · 52nd of 240</div>
<div class="ds-face-weights">${geistWeights.map((w) => `<span style="font-family:Geist,sans-serif;font-weight:${w}">${w}</span>`).join('')}</div></figcaption></figure>
<figure class="ds-face"><div class="ds-face-art">Aa</div><figcaption><h4>Figtree</h4><p>Latin · the product’s face, kept for the chrome · ${share('Figtree')} of the new My Listings’ text</p>
<div class="ds-face-line">${esc(figtreeWords.join(' · '))}</div></figcaption></figure>
</div>
<p class="ds-note">Geist is the UI face (<code>type.family.ui</code>) and appears only on My Listings — nowhere else in the product. Figtree (<code>type.family.chrome</code>) draws the web page title, the empty states, the modals and most sheet and drawer titles; the Listing Performance drawer and sheet titles are Geist. ${lato ? `Lato (<code>type.family.app</code>) draws only the phone’s page title, “My Listings”, and the artboard’s 9:41 status bar (the designer’s device frame).` : ''} JetBrains Mono (<code>type.family.mono</code>) is painted nowhere. Arabic stays Droid Arabic Kufi; the handover has no Arabic.</p>
<h4>Colour</h4>
<div class="ds-palette"><p class="ds-note">The green is the primary now: the ramp runs −1 to 11 around the brand green (8, <code>#28B16D</code>). In the current theme the primary is teal (<code>#006169</code>) and this green is <code>secondaryColor</code>; the new My Listings drops <code>colorPrimaryActive</code> and builds its states from the green (pressed 10, ink 9, deep 11).</p>
${ramp('Primary', primary)}
${ramp('Brand', group('brand'))}
${ramp('Tints', group('tint', { teal050: 'the rank and quality cards' }))}
${ramp('Status', group('status'))}
${ramp('Text', group('text'))}
${ramp('Border', group('border'))}
${ramp('Surface', group('surface'))}
${ramp('Gradients', Object.entries(C.gradient).map(([k, v]) => `<figure class="ds-chip ds-chip--wide" title="${esc(v)}"><i style="background:${v}"></i><figcaption><b>gradient.${esc(k)}</b><code>${esc(v)}</code><span>${gradientUses(v) ? plural(gradientUses(v), 'use') : 'declared, not painted'}</span></figcaption></figure>`))}
</div>
<div class="ds-palette"><h4>Teal, where it stays</h4><p class="ds-note">Teal stays in the rank and Quality Score explainers: the How to Earn Quality Score drawer (web) and sheet (phone) paint the current theme’s teal, and the rank and quality cards sit on <code>tint.teal050</code>. Measured, it appears in four more places: three kept from the current product — the rail’s active item, the TruCheck glyph in a row’s actions, the selected metric pill of the performance trend (<code>#F2FAFA</code>) — and the onboarding tour’s hero card, a <code>#F2FAFA</code> → <code>#F0FAF5</code> gradient into the green tint.</p>
${ramp('Teal', namedTeal.map((r) => chip(r.names[0].replace(/ \(.*\)$/, ''), r.hex, { note: r.names.map((n) => n.replace(/^[^(]*\(/, '(')).join(' ') })))}
</div>
<h4>Type roles <small>tokens.json — the phone’s roles, at 360pt</small></h4>
${rolesHtml}
<h4>Type as drawn <small>Geist, every whole size drawn five times or more — the web at 1440, then the phone at 360</small></h4>
<h5>Web</h5>${scaleHtml('web')}
<h5>Phone</h5>${scaleHtml('mobile')}
<h4>Corners</h4>
<div class="ds-corners">${Object.entries(T.radius).map(([k, v]) => tokenCorner(k, v)).join('')}</div>
${offScale.length ? `<p class="ds-note">Also drawn, off the token scale: ${offScale.map((r) => `<code>${esc(r.value)}</code> ×${r.uses}`).join(' ')}.</p>` : ''}
<h4>Space, elevation, motion, targets</h4>
<table class="ds-table"><thead><tr><th>token</th><th>value</th></tr></thead><tbody>
${Object.entries(T.space).map(([k, v]) => `<tr><td><code>space.${esc(k)}</code></td><td>${v}px <span class="ds-bar" style="display:inline-block;vertical-align:middle;width:${v * 3}px;height:8px;border-radius:2px;background:#28B16D"></span></td></tr>`).join('')}
${Object.entries(T.elevation).map(([k, v]) => `<tr><td><code>elevation.${esc(k)}</code></td><td><code>${esc(v)}</code></td></tr>`).join('')}
${Object.entries(T.motion).map(([k, m]) => `<tr><td><code>motion.${esc(k)}</code></td><td>${m.duration}ms · <code>${esc(m.curve)}</code>${m.note ? ` · ${esc(m.note)}` : ''}</td></tr>`).join('')}
${Object.entries(T.target).map(([k, v]) => `<tr><td><code>target.${esc(k)}</code></td><td>${v}px</td></tr>`).join('')}
</tbody></table>
${mismatch.length ? `<h4>Where the tokens and the build disagree <small>[TBC] with the designer</small></h4>
<table class="ds-table"><thead><tr><th>token</th><th>tokens.json</th><th>the build paints</th></tr></thead><tbody>${mismatch.map((m) => `<tr><td><code>${esc(m.token)}</code></td><td><code>${esc(m.declared)}</code></td><td>${esc(m.painted)}</td></tr>`).join('')}</tbody></table>` : ''}`;
writeFileSync(join(ROOT, 'data', 'theme', 'foundations.html'), html);
writeFileSync(join(ROOT, 'data', 'theme', 'foundations.json'), JSON.stringify({
  meta: T.$meta, states: { web, phone },
  families: fam.map((f) => ({ family: f.family, share: share(f.family), devices: f.devices })),
  colours: [...Object.entries(C.primary).map(([k, v]) => ({ token: `color.primary.${k}`, css: `--pf-ml-primary-${k === '-1' ? 'm1' : k}`, value: v, uses: usesOf(v) })),
    ...['brand', 'tint', 'status', 'text', 'border', 'surface', 'gradient'].flatMap((g) => Object.entries(C[g]).map(([k, v]) => ({ token: `color.${g}.${k}`, css: `--pf-ml-${g}-${kebab(k)}`, value: v, uses: /^#/.test(v) ? usesOf(v) : g === 'gradient' ? gradientUses(v) : /^rgba/.test(v) ? (hexUses.get(rgbaHex(v)) || { uses: 0 }).uses : null })))],
  teal: tealRows, radius: T.radius, space: T.space, type: T.type, motion: T.motion, elevation: T.elevation, target: T.target, mismatch,
}, null, 1));
console.log(`  deliverables/new-theme/tokens.css — ${vars.filter((v) => v.includes('--')).length} tokens · data/theme/foundations.html · ${mismatch.length} disagreements · teal in ${tealRows.length} values`);
for (const m of mismatch) console.log(`    ${m.token}: ${m.declared} → ${m.painted}`);
