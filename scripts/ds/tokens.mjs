#!/usr/bin/env node
/**
 * The foundations — read out of what the product actually paints with.
 *
 * A token list typed from a theme file says what the product INTENDS. This
 * reads deliverables/profolio.css — the rules the compiled pages are painted
 * by, nothing else — and counts every colour, size, space, radius, shadow and
 * curve that is really used, then names each one from the two places the
 * product names things:
 *
 *   src/theme/index.js themeColors   the product's own names (primaryColor…)
 *   data/antd-tokens.json            antd's resolved theme (colorPrimary,
 *                                    colorText, borderRadiusLG…)
 *
 * A value with no name in either is still listed — with its count — because a
 * literal the product uses forty times is a token nobody wrote down, and the
 * design system should say so rather than hide it.
 *
 *   node scripts/ds/tokens.mjs
 *
 * Writes data/ds/tokens.json (with the Foundations HTML the catalogue embeds)
 * and deliverables/tokens.css (the named values as custom properties).
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { splitRules, preludeOf, declsOf } from './css.mjs';
import { foundations } from './foundations.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const REPO = join(ROOT, '..', process.env.PROFOLIO_REPO || 'profolio-reactjs');
const CSS = readFileSync(join(ROOT, 'deliverables', 'profolio.css'), 'utf8');
const antd = JSON.parse(readFileSync(join(ROOT, 'data', 'antd-tokens.json'), 'utf8'));

/* ── every declaration, with the at-rule it sits under ────────────────── */
const decls = [];
const media = new Map();
const walk = (rules, at = '') => {
  for (const r of rules) {
    const pre = preludeOf(r);
    if (/^@(media|supports|layer|container)/.test(pre)) {
      if (pre.startsWith('@media')) media.set(pre, (media.get(pre) || 0) + 1);
      walk(splitRules(r.slice(r.indexOf('{') + 1, r.lastIndexOf('}'))), pre);
    } else if (!pre.startsWith('@')) {
      for (const [p, v] of declsOf(r)) decls.push({ p, v, sel: pre, at });
    }
  }
};
walk(splitRules(CSS));

/* ── colours ──────────────────────────────────────────────────────────── */
const hex2 = (n) => n.toString(16).padStart(2, '0');
const norm = (c) => {
  c = c.trim().toLowerCase();
  let m;
  if ((m = c.match(/^#([0-9a-f]{3,8})$/))) {
    let h = m[1];
    if (h.length <= 4) h = [...h].map((x) => x + x).join('');
    const a = h.length === 8 ? parseInt(h.slice(6), 16) / 255 : 1;
    return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16), a: +a.toFixed(3) };
  }
  if ((m = c.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,/]+([\d.]+%?))?\s*\)$/))) {
    const a = m[4] === undefined ? 1 : m[4].endsWith('%') ? parseFloat(m[4]) / 100 : +m[4];
    return { r: +m[1], g: +m[2], b: +m[3], a: +(+a).toFixed(3) };
  }
  if (c === 'white') return { r: 255, g: 255, b: 255, a: 1 };
  if (c === 'black') return { r: 0, g: 0, b: 0, a: 1 };
  return null;
};
const key = (o) => o.a === 1 ? `#${hex2(o.r)}${hex2(o.g)}${hex2(o.b)}` : `rgba(${o.r}, ${o.g}, ${o.b}, ${o.a})`;
const COLOR_RE = /#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)|\b(?:white|black)\b/g;

/* names, product first */
const names = new Map();
const addName = (value, name, source) => { const o = norm(String(value)); if (!o) return; const k = key(o); (names.get(k) || names.set(k, []).get(k)).push({ name, source }); };
const themeFile = join(REPO, 'src', 'theme', 'index.js');
const themeColors = {};
if (existsSync(themeFile)) {
  const src = readFileSync(themeFile, 'utf8');
  const block = src.slice(src.indexOf('const themeColors'), src.indexOf('};', src.indexOf('const themeColors')));
  for (const m of block.matchAll(/(\w+):\s*'([^']+)'/g)) { themeColors[m[1]] = m[2]; addName(m[2], m[1], 'theme'); }
}
const SEMANTIC = /^color(?!.*(Hover|Active)$)|^(boxShadow|borderRadius|fontSize|lineHeight|controlHeight|padding|margin|motion)/;
for (const [k, v] of Object.entries(antd.token)) if (typeof v === 'string' && /^color[A-Z]/.test(k)) addName(v, k, 'antd');

const colours = new Map();
for (const d of decls) {
  for (const m of d.v.matchAll(COLOR_RE)) {
    const o = norm(m[0]);
    if (!o) continue;
    const k = key(o);
    const e = colours.get(k) || colours.set(k, { value: k, o, count: 0, props: new Map() }).get(k);
    e.count++;
    const fam = /background/.test(d.p) ? 'ground' : /border|outline/.test(d.p) ? 'edge' : /shadow/.test(d.p) ? 'shadow' : /^color$|fill|stroke|caret|text-decoration/.test(d.p) ? 'ink' : 'other';
    e.props.set(fam, (e.props.get(fam) || 0) + 1);
  }
}
const colourList = [...colours.values()].map((e) => ({
  value: e.value, count: e.count, use: [...e.props.entries()].sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ${n}`).join(' · '),
  names: (names.get(e.value) || []).sort((a, b) => (a.source === 'theme' ? -1 : 1) - (b.source === 'theme' ? -1 : 1)),
})).sort((a, b) => b.count - a.count);

/* ── scales ───────────────────────────────────────────────────────────── */
const tally = (pred, pick = (d) => d.v) => {
  const m = new Map();
  for (const d of decls) if (pred(d)) { const v = pick(d); if (v) m.set(v, (m.get(v) || 0) + 1); }
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
};
const px = (v) => { const m = /^(-?[\d.]+)px$/.exec(v.trim()); return m ? +m[1] : null; };
const families = tally((d) => d.p === 'font-family');
const sizes = tally((d) => d.p === 'font-size' && px(d.v) !== null).sort((a, b) => px(a[0]) - px(b[0]));
const weights = tally((d) => d.p === 'font-weight');
const lineHeights = tally((d) => d.p === 'line-height');
/* type STYLES: the size / line-height / weight a rule sets together */
const styles = new Map();
{
  const byRule = new Map();
  for (const d of decls) { if (!['font-size', 'line-height', 'font-weight'].includes(d.p)) continue; const k = d.sel + '|' + d.at; (byRule.get(k) || byRule.set(k, {}).get(k))[d.p] = d.v; }
  for (const s of byRule.values()) if (s['font-size'] && px(s['font-size']) !== null) {
    const k = `${s['font-size']} / ${s['line-height'] || '—'} / ${s['font-weight'] || '—'}`;
    styles.set(k, (styles.get(k) || 0) + 1);
  }
}
const typeStyles = [...styles.entries()].sort((a, b) => px(b[0].split(' / ')[0]) - px(a[0].split(' / ')[0]) || b[1] - a[1]);
const spaceVals = new Map();
for (const d of decls) {
  if (!/^(padding|margin|gap|row-gap|column-gap)(-|$)/.test(d.p)) continue;
  for (const t of d.v.split(/\s+/)) { const n = px(t); if (n !== null && n > 0 && n <= 96) spaceVals.set(n, (spaceVals.get(n) || 0) + 1); }
}
const spacing = [...spaceVals.entries()].sort((a, b) => a[0] - b[0]);
const radii = tally((d) => /^border(-(top|bottom|start|end)-(left|right|start|end))?-radius$/.test(d.p));
const shadows = tally((d) => d.p === 'box-shadow' && d.v !== 'none');
const curves = tally((d) => /transition|animation/.test(d.p), (d) => (d.v.match(/cubic-bezier\([^)]*\)|\bease(-in-out|-in|-out)?\b|\blinear\b/g) || []).join(', ') || null);
const durations = tally((d) => /transition|animation/.test(d.p), (d) => (d.v.match(/\b[\d.]+m?s\b/g) || []).join(', ') || null);
const zs = tally((d) => d.p === 'z-index').sort((a, b) => +a[0] - +b[0]);
const bps = [...media.entries()].sort((a, b) => b[1] - a[1]);
const motionName = (v) => Object.entries(antd.token).find(([k, x]) => /^motionEase/.test(k) && typeof x === 'string' && x.replace(/\s/g, '') === v.replace(/\s/g, ''))?.[0];

/* ── tokens.css: the named values, as custom properties ───────────────── */
const kebab = (s) => s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').replace(/([a-z])(\d)/g, '$1-$2').toLowerCase();
const cssVars = [];
for (const [n, v] of Object.entries(themeColors)) if (norm(v)) cssVars.push(`  --pf-${kebab(n.replace(/Color$/, ''))}: ${v};`);
for (const [k, v] of Object.entries(antd.token)) {
  if (typeof v === 'string' && /^color[A-Z]/.test(k) && norm(v)) cssVars.push(`  --pf-${kebab(k)}: ${v};`);
  if (typeof v === 'number' && /^(borderRadius(SM|LG|XS)?|fontSize(SM|LG|XL|Heading\d)?|controlHeight(SM|LG)?|padding(XXS|XS|SM|MD|LG|XL)?|margin(XXS|XS|SM|MD|LG|XL)?)$/.test(k)) cssVars.push(`  --pf-${kebab(k)}: ${v}px;`);
  if (typeof v === 'string' && /^(motionEase\w+|fontFamily|boxShadow(Secondary|Tertiary)?)$/.test(k)) cssVars.push(`  --pf-${kebab(k)}: ${v};`);
}
writeFileSync(join(ROOT, 'deliverables', 'tokens.css'), `/* ═══════════════════════════════════════════════════════════════════════════
   PROFOLIO KSA — DESIGN TOKENS
   The product's named values as custom properties: its own theme
   (src/theme/index.js themeColors) and antd's resolved theme tokens
   (data/antd-tokens.json, antd ${antd.antdVersion}). profolio.css is the
   product's compiled CSS and carries literal values, exactly as the product
   paints them; design-system.html#foundations shows which of these each
   literal is and how often it is used. Generated by scripts/ds/tokens.mjs.
   ═══════════════════════════════════════════════════════════════════════ */
:root {
${[...new Set(cssVars)].join('\n')}
}
`);

/* ── the Foundations section (scripts/ds/foundations.mjs) ──────────────── */
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const named = colourList.filter((c) => c.names.length);
const unnamed = colourList.filter((c) => !c.names.length);
const theme = named.filter((c) => c.names.some((n) => n.source === 'theme'));
const antdOnly = named.filter((c) => !c.names.some((n) => n.source === 'theme'));
const table = (head, rows) => `<table class="ds-scale"><thead><tr>${head.map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table>`;
/* what the compiled pages paint (scripts/ds/painted.mjs) */
const paintedFile = join(ROOT, 'data', 'ds', 'painted.json');
const painted = existsSync(paintedFile) ? JSON.parse(readFileSync(paintedFile, 'utf8')) : null;
/* the Arabic specimen: the product's own strings for two of its labels */
const arabic = (() => {
  try {
    const flat = (o, p = '', out = {}) => { for (const [k, v] of Object.entries(o)) { const kk = p ? `${p}.${k}` : k; if (v && typeof v === 'object') flat(v, kk, out); else out[kk] = v; } return out; };
    const en = flat(JSON.parse(readFileSync(join(REPO, 'src', 'locales', 'en', 'translation.json'), 'utf8')));
    const ar = flat(JSON.parse(readFileSync(join(REPO, 'src', 'locales', 'ar', 'translation.json'), 'utf8')));
    return ['My Listings', 'Post a Listing', 'Credits Usage'].map((w) => ar[Object.keys(en).find((k) => en[k] === w)]).filter(Boolean);
  } catch { return []; }
})();
const rest = `
<h3>Spacing <small>padding, margin and gap values up to 96px</small></h3>
${table(['value', 'uses', ''], spacing.map(([v, n]) => `<tr><td><code>${v}px</code></td><td>${n}</td><td><span class="ds-bar" style="width:${Math.min(v * 4, 384)}px"></span></td></tr>`))}
<h3>Elevation</h3>
${table(['box-shadow', 'uses', ''], shadows.slice(0, 20).map(([v, n]) => `<tr><td><code>${esc(v)}</code></td><td>${n}</td><td><span class="ds-shadow" style="box-shadow:${esc(v)}"></span></td></tr>`))}
<h3>Motion</h3>
${table(['easing', 'uses', 'antd token'], curves.slice(0, 16).map(([v, n]) => `<tr><td><code>${esc(v)}</code></td><td>${n}</td><td>${esc(v.split(', ').map((x) => motionName(x) || '').filter(Boolean).join(', '))}</td></tr>`))}
${table(['duration', 'uses'], durations.slice(0, 16).map(([v, n]) => `<tr><td><code>${esc(v)}</code></td><td>${n}</td></tr>`))}
<h3>Layering</h3>
${table(['z-index', 'uses'], zs.map(([v, n]) => `<tr><td><code>${esc(v)}</code></td><td>${n}</td></tr>`))}
<h3>Breakpoints</h3>
${table(['media query', 'rules'], bps.slice(0, 24).map(([v, n]) => `<tr><td><code>${esc(v)}</code></td><td>${n}</td></tr>`))}
`;
const F = foundations({ norm, key, themeColors, antd, colourList, painted, arabic, rest });
const html = F.html;
mkdirSync(join(ROOT, 'data', 'ds'), { recursive: true });
writeFileSync(join(ROOT, 'data', 'ds', 'tokens.json'), JSON.stringify({ at: new Date().toISOString(), colours: colourList, families, typeStyles, sizes, weights, lineHeights, spacing, radii, shadows, curves, durations, zIndex: zs, breakpoints: bps, palettes: F.palettes, typeScale: F.typeScale, paintedStyles: F.typeStyles, corners: F.corners, partialCorners: F.partialCorners, html }, null, 1));
console.log(`  ${decls.length} declarations · ${colourList.length} colours (${theme.length} theme-named, ${antdOnly.length} antd-named, ${unnamed.length} unnamed) · ${typeStyles.length} type styles · ${spacing.length} spacing values · ${radii.length} radii · ${shadows.length} shadows`);
console.log(`  wrote deliverables/tokens.css (${[...new Set(cssVars)].length} custom properties) and data/ds/tokens.json`);
