#!/usr/bin/env node
/**
 * The NEW My Listings' foundations — its tokens, as the designer declares them
 * (authoring/themes/new/my-listings.tokens.json) and as its build paints them
 * (data/theme/painted.json, from scripts/theme/painted.mjs).
 *
 * These are My Listings' tokens only. The redesign starts there (Profolio
 * 2.0); every other page keeps the current theme, whose foundations stay as
 * they are. Nothing here replaces a current token: the new ones are named
 * --pf-ml-* and live in their own file.
 *
 * Tokens follow the build (the designer's decision, 2026-09-29). Where
 * tokens.json and the build disagree, the token takes what the build paints:
 *   · a declared value the build paints somewhere stays, and the build's other
 *     values for the same thing become named variants (radius.sheet 20 on the
 *     content sheets, radius.sheetAction 16 on the action sheets);
 *   · a declared value the build paints nowhere gives way to the build's main
 *     value — the one on the most layers, then the most uses — and the rest
 *     become variants;
 *   · a rule (target.min), or a value with nothing in the build to follow (Lato;
 *     JetBrains Mono — the build's only mono text is a photo placeholder's
 *     caption), is kept, and says why.
 * A derived screen (Mark as Booked, composed by derive.mjs) is never evidence:
 * painted.mjs leaves it out.
 * tokens.json's own values are kept beside them (tokens.resolved.json, the
 * Foundations' table), so the designer can see every change.
 *
 *   node scripts/theme/foundations.mjs
 *
 * Writes deliverables/new-theme/tokens.css (the adjusted tokens) and
 * tokens.resolved.json, data/theme/foundations.html (the catalogue embeds it
 * under Foundations) and data/theme/foundations.json (scripts/package.mjs
 * writes it into the skill's tokens.md).
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
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/* ── what is painted ────────────────────────────────────────────────── */
const hexUses = new Map(P.colours.map((c) => [c.value, c]));
const usesOf = (hex) => (hexUses.get(String(hex).toUpperCase()) || { uses: 0 }).uses;
const lum = (hex) => { const m = String(hex).match(/^#([\da-f]{2})([\da-f]{2})([\da-f]{2})/i); if (!m) return 0; const ch = (v) => { v = parseInt(v, 16) / 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * ch(m[1]) + 0.7152 * ch(m[2]) + 0.0722 * ch(m[3]); };
const states = Object.values(STATES).filter((s) => s.file);
const web = states.filter((s) => !s.file.includes('/mobile/')).length, phone = states.length - web;
const derived = states.filter((s) => s.derived);
const curNames = new Map();
if (CUR) for (const p of CUR.palettes) for (const r of p.rows) for (const c of r.colours) if (/^#/.test(c.value)) (curNames.get(c.value.toUpperCase()) || curNames.set(c.value.toUpperCase(), []).get(c.value.toUpperCase())).push(c.name);
/* a shadow, as its colour and lengths, whichever order it was written in */
const shadow = (v) => {
  const colour = (String(v).match(/rgba?\([^)]*\)/) || [''])[0].replace(/\s+/g, '').replace(/^rgb\((.*)\)$/, 'rgba($1,1)');
  const lens = String(v).replace(/rgba?\([^)]*\)/, '').replace(/inset/, '').trim().split(/\s+/).map((x) => parseFloat(x) || 0);
  while (lens.length < 4) lens.push(0);
  return `${colour} ${lens.join(' ')}${/inset/.test(v) ? ' inset' : ''}`;
};
/* a computed shadow written as a token is (x y blur [spread] colour) */
const shadowToken = (computed) => {
  if (!computed || computed === 'none') return 'none';
  const colour = (computed.match(/rgba?\([^)]*\)/) || [''])[0].replace(/\s+/g, '');
  const lens = computed.replace(/rgba?\([^)]*\)/, '').replace(/inset/, '').trim().split(/\s+/).map((x) => (parseFloat(x) ? `${parseFloat(x)}px` : '0'));
  if (lens[3] === '0') lens.pop();
  return `${/inset/.test(computed) ? 'inset ' : ''}${lens.join(' ')} ${colour}`.replace(/^inset (.*)$/, '$1 inset');
};
const rgbaHex = (v) => { const m = String(v).match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/); if (!m) return null; const h = '#' + [m[1], m[2], m[3]].map((x) => (+x).toString(16).padStart(2, '0')).join('').toUpperCase(); return m[4] === undefined || +m[4] === 1 ? h : `${h} ${Math.round(+m[4] * 100)}%`; };
const hexPctRgba = (v) => { const m = String(v).match(/^#([\da-f]{2})([\da-f]{2})([\da-f]{2})(?: (\d+)%)?$/i); return m ? (m[4] ? `rgba(${parseInt(m[1], 16)},${parseInt(m[2], 16)},${parseInt(m[3], 16)},${+m[4] / 100})` : `#${m[1]}${m[2]}${m[3]}`.toUpperCase()) : v; };
const gradientUses = (v) => { const norm = (x) => String(x).replace(/#([\da-f]{6})/gi, (m, h) => `rgb(${parseInt(h.slice(0, 2), 16)},${parseInt(h.slice(2, 4), 16)},${parseInt(h.slice(4), 16)})`).replace(/\s+/g, ''); const g = P.gradients.find((x) => norm(x.value) === norm(v)); return g ? g.uses : 0; };
const partsText = (parts) => [...new Set(parts.map((p) => p.replace(/^(web|mobile):/, '')))].join(', ');

/* ── tokens follow the build ────────────────────────────────────────── */
const R = structuredClone(T);                            /* the tokens, adjusted */
const variants = [];                                     /* { token, css, value, of, where, uses } */
const adjusted = [];                                     /* { token, declared, value, basis, variants } */
const kept = [];                                         /* { token, value, why } */
const addVariant = (group, name, value, of, where, uses, css, sample) => { variants.push({ token: `${group}.${name}`, css: css || `--pf-ml-${kebab(group === 'type' ? `type-${name}` : `${group}-${name}`)}`, value, of, where, uses, ...(sample ? { sample } : {}) }); return `${group}.${name}`; };

/* a variant's name, from where it is drawn */
const suffixOf = (g) => {
  const parts = [...g.parts];
  if (parts.every((p) => /Listing Performance bottom sheet/.test(p))) return 'Performance';
  if (parts.every((p) => /How to Earn Quality Score/.test(p))) return 'Explainer';
  if (parts.every((p) => /sheet$/i.test(p))) return 'Sheet';
  if ([...g.states].every((s) => /ad-license/.test(s))) return 'License';
  if ([...g.states].every((s) => /^tab-(draft|pending|removed)/.test(s))) return 'NotLive';
  return 'Card';
};

/* elevation: each token held to the thing it names — the phone's sheets, a listing card, a toast */
for (const [k, v] of Object.entries(T.elevation)) {
  if (P.shadows.some((s) => shadow(s.value) === shadow(v))) continue;
  let found = null;
  if (k === 'sheet') found = P.shadows.filter((s) => (s.parts || []).some((p) => /^mobile:.*sheet$/i.test(p))).sort((a, b) => b.uses - a.uses)[0];
  else if (P.named && P.named.some((x) => x.kind === k)) { const n = P.named.filter((x) => x.kind === k).sort((a, b) => b.n - a.n)[0]; found = { value: n.value, parts: n.parts.map((p) => `${n.device}:${p}`), uses: n.n }; }
  if (!found) { kept.push({ token: `elevation.${k}`, value: v, why: 'painted nowhere in the compiled states — nothing to follow' }); continue; }
  const value = shadowToken(found.value);
  R.elevation[k] = value;
  /* another sheet that casts its own shadow is a variant, named by the sheet */
  /* a sheet's own shadow is cast upward (negative y); a shadow inside a sheet (a knob, a card) is not one */
  const upward = (v) => (String(v).replace(/rgba?\([^)]*\)/, '').trim().split(/\s+/).map(parseFloat)[1] || 0) < 0;
  const extra = k !== 'sheet' ? [] : P.shadows.filter((s) => s !== found && upward(s.value) && (s.parts || []).length && s.parts.every((p) => /^mobile:.*sheet$/i.test(p))).map((s) => addVariant('elevation', `sheet${suffixOf({ parts: new Set(s.parts.map((p) => p.slice(7))), states: new Set() })}`, shadowToken(s.value), 'elevation.sheet', partsText(s.parts), s.uses));
  adjusted.push({ token: `elevation.${k}`, declared: v, value, basis: value === 'none' ? `no ${k === 'card' ? 'listing card' : k} paints a shadow` : `the build paints it on ${partsText(found.parts)}`, variants: extra });
}

/* type roles: the style each role's own words are drawn in — the phone's (tokens.json is the
   phone's, 360pt), and the web's where it differs, as a variant */
const ROLE_WORDS = {
  price: /^(1,500,000|640,000|960,000|895,000|850,000)$/,
  subtype: /^(Apartment|Villa|Townhouse) for (Sale|Rent|Daily Rental)$/,
  location: /^[A-Z][a-z]+ ?[A-Za-z]*, (North |South |East |West |Central )?(Riyadh|Jeddah|Madinah)$/,
  stat: /^(1,288|988|4,180|1,640|22,412|12,855)$/,
  label: /^(Views|Clicks|Leads)$/,
  sheetTitle: /^(Listing Performance|Filters|Sort listings|Share Bayut Link|Request Services|Listing actions|Delete this listing\?|TruCheck|How to Earn Quality Score\?|Date range|Mark as Booked)$/,
};
const FACE = { Figtree: 'chrome', Geist: 'ui', Lato: 'app' };
/* where a variant is drawn, in words: its parts, and the screens when there are few */
const whereOf = (g) => { const states = [...g.states].map((s) => s.replace(/-full$/, '')).filter((s, i, a) => a.indexOf(s) === i); return `${[...g.parts].map((p) => (p === 'screen' ? 'the list' : p)).join(', ')}${states.length <= 6 ? ` (${states.join(', ')})` : ` (${states.length} states)`}`; };
const styleKey = (x, withColour) => `${x.family}|${x.size}|${x.lh}|${x.weight}|${withColour ? x.colour : ''}`;
/* a title is a title's size (a menu item with a title's words is not one); a stat label sits
   over its value at 11px on the phone, 12px on the web (the phone trend's Views / Clicks / Leads
   switch, 12px, is a control); a stat is a figure whose block names its metric */
const isRole = (k, x) => (ROLE_WORDS[k].test(x.w) || (k === 'stat' && x.hint === 'stat')) && (k !== 'sheetTitle' || x.size >= 16) && (k !== 'label' || x.size <= (x.device === 'web' ? 12 : 11));
const groupsOf = (k, dev, withColour) => {
  const groups = new Map();
  for (const x of (P.strings || []).filter((y) => y.device === dev && isRole(k, y))) { const key = styleKey(x, withColour); const g = groups.get(key) || groups.set(key, { x, n: 0, parts: new Set(), states: new Set(), w: x.w }).get(key); g.n += x.n; g.parts.add(x.part); (x.states || []).forEach((s) => g.states.add(s)); }
  return groups;
};
for (const [k, r] of Object.entries(T.type)) {
  if (k === 'family' || !ROLE_WORDS[k]) continue;
  const face = r.family || 'Geist';
  const groups = groupsOf(k, 'mobile', !!r.color);
  if (!groups.size) continue;
  const declaredKey = `${face}|${r.size}|${r.line}|${r.weight}|${r.color ? r.color.toUpperCase() : ''}`;
  const ranked = [...groups.values()].sort((a, b) => b.parts.size - a.parts.size || b.n - a.n);
  const main = groups.get(declaredKey) || ranked[0];
  const role = (g) => ({ family: g.x.family, size: g.x.size, line: g.x.lh, weight: g.x.weight, ...(r.color ? { color: g.x.colour } : {}) });
  const styleText = (s) => `${s.family} ${s.size}/${s.line} · ${s.weight}${s.color ? ` · ${s.color}` : ''}`;
  R.type[k] = role(main);
  const extra = [], minor = [], roles = [main];
  const used = new Set();
  for (const g of ranked) {
    if (g === main) continue;
    /* a style drawn on four screens or more is a role of its own; fewer is an exception, noted */
    if (g.states.size >= 4) {
      let name = `${k}${suffixOf(g)}`; while (used.has(name)) name += 'Alt'; used.add(name);
      extra.push(addVariant('type', name, role(g), `type.${k}`, whereOf(g), g.n, undefined, g.w));
      roles.push(g);
    } else minor.push(`${styleText(role(g))} ×${g.n} (${[...g.parts].join(', ')})`);
  }
  /* the web's own: its main style for the role, when no phone token already holds it */
  const webMain = [...groupsOf(k, 'web', !!r.color).values()].sort((a, b) => b.parts.size - a.parts.size || b.n - a.n)[0];
  const heldBy = webMain && roles.find((g) => styleKey(g.x, !!r.color) === styleKey(webMain.x, !!r.color));
  if (webMain && heldBy && heldBy !== main) { const v = variants.find((x) => x.token === `type.${k}${suffixOf(heldBy)}`); if (v) v.where += `; the web: ${whereOf(webMain)}`; }
  else if (webMain && !heldBy && webMain.states.size >= 4) extra.push(addVariant('type', `${k}Web`, role(webMain), `type.${k}`, `the web: ${whereOf(webMain)}`, webMain.n, undefined, webMain.w));
  const basis = `the phone draws it so ×${main.n} (${[...main.parts].join(', ')}; "${main.w}")${minor.length ? `; also, rarely, ${minor.join('; ')}` : ''}${webMain ? `; the web draws it ${styleText(role(webMain))} ×${webMain.n}` : ''}`;
  /* a declared style the build draws stays as it is: kept, with its variants */
  if (main === groups.get(declaredKey)) kept.push({ token: `type.${k}`, value: styleText(R.type[k]), why: `as declared — ${basis}`, variants: extra });
  else adjusted.push({ token: `type.${k}`, declared: styleText({ family: face, size: r.size, line: r.line, weight: r.weight, color: r.color }), value: styleText(R.type[k]), basis, variants: extra });
}

/* a sheet's corners: the top-only radii of the phone's sheets */
{
  const tops = P.radii.filter((x) => /^(\d+)px \1px 0px 0px$/.test(x.value) && parseFloat(x.value) >= 10).map((x) => ({ px: parseFloat(x.value), parts: (x.parts || []).filter((p) => p.startsWith('mobile:') && /sheet$/i.test(p)).map((p) => p.slice(7)) })).filter((x) => x.parts.length).sort((a, b) => b.parts.length - a.parts.length);
  const declared = tops.find((x) => x.px === T.radius.sheet);
  const others = tops.filter((x) => x.px !== T.radius.sheet);
  if (others.length) {
    const main = declared || tops[0];
    R.radius.sheet = main.px;
    const extra = others.filter((x) => x !== main).map((x, i) => addVariant('radius', i ? `sheetAction${i + 1}` : 'sheetAction', x.px, 'radius.sheet', x.parts.join(', '), x.parts.length));
    if (declared) kept.push({ token: 'radius.sheet', value: `${main.px}px`, why: `as declared — ${main.px}px on ${main.parts.join(', ')}; the action sheets draw ${others.map((x) => `${x.px}px`).join(', ')} (a variant)`, variants: extra });
    else adjusted.push({ token: 'radius.sheet', declared: `${T.radius.sheet}px`, value: `${main.px}px`, basis: `${main.px}px on ${main.parts.join(', ')}`, variants: extra });
  }
}

/* touch targets: what a finger aims at on the phone. tokens.json's icon button is the card's
   (spec: "Action row … icon buttons 44 x 44"), so the value is the size the build draws in a
   listing card; the other icon buttons are variants named by where they sit */
{
  const placeOfB = (b) => Object.entries(b.places || {}).sort((x, y) => y[1] - x[1])[0]?.[0] || 'screen';
  const buttons = (P.targets || []).filter((t) => t.device === 'mobile').map((t) => ({ ...t, w: +t.size.split('x')[0], h: +t.size.split('x')[1] })).filter((t) => t.w <= 60 && t.h <= 60 && Math.min(t.w, t.h) >= 20 && Math.max(t.w, t.h) / Math.min(t.w, t.h) <= 1.5).map((b) => ({ ...b, place: placeOfB(b) })).sort((a, b) => b.n - a.n);
  if (buttons.length && !buttons.some((b) => b.w === T.target.iconButton && b.h === T.target.iconButton)) {
    const main = buttons.find((b) => b.place === 'listing card') || buttons[0];
    R.target.iconButton = Math.min(main.w, main.h);
    const where = (b) => (b.place === 'listing card' ? 'a listing card' : b.place === 'list header' ? "the list header (filter, sort)" : `the ${b.place}`);
    const nameOf = (b) => (b.place === 'list header' ? 'iconButtonHeader' : /sheet$/i.test(b.place) ? 'iconButtonSheet' : b.place === 'listing card' ? 'iconButtonCard' : 'iconButtonAlt');
    const used = new Set();
    const extra = buttons.filter((b) => b !== main && Math.min(b.w, b.h) !== R.target.iconButton).filter((b, i, a) => a.findIndex((c) => Math.min(c.w, c.h) === Math.min(b.w, b.h)) === i).map((b) => { let name = nameOf(b); while (used.has(name)) name += 'Alt'; used.add(name); return addVariant('target', name, Math.min(b.w, b.h), 'target.iconButton', where(b), b.n); });
    adjusted.push({ token: 'target.iconButton', declared: `${T.target.iconButton}px`, value: `${R.target.iconButton}px`, basis: `the build draws a listing card's icon buttons at ${main.size} ×${main.n}; elsewhere ${buttons.filter((b) => b !== main).map((b) => `${b.size} ×${b.n} (${where(b)})`).join(', ')}`, variants: extra });
    kept.push({ token: 'target.min', value: `${T.target.min}px`, why: `a rule, not a size: the build's icon buttons are below it (${[...new Set(buttons.map((b) => Math.min(b.w, b.h)))].join(', ')}px) — accessibility, [TBC] with the designer` });
  }
}

/* the translucent colours (the scrim), and the page's ground per layout */
for (const [g, vals] of Object.entries(T.color)) for (const [k, v] of Object.entries(vals)) {
  if (!/^rgba/.test(v)) continue;
  const want = rgbaHex(v);
  if (hexUses.has(want)) continue;
  const alpha = want.split(' ')[1];
  const near = P.colours.filter((c) => c.value.endsWith(` ${alpha}`)).sort((a, b) => b.uses - a.uses)[0];
  if (!near) { kept.push({ token: `color.${g}.${k}`, value: v, why: 'painted nowhere' }); continue; }
  R.color[g][k] = hexPctRgba(near.value);
  /* the same colour at another strength, laid over ten states or more, is a variant — named by
     what it dims (the web's drawers dim less than its modals) */
  const base = near.value.split(' ')[0];
  const extra = P.colours.filter((c) => c !== near && c.value.startsWith(`${base} `) && (c.roles || {}).ground && c.states >= 10).map((c) => {
    const list = c.stateList || [];
    const drawers = list.length && list.filter((x) => /^web:drawer-/.test(x)).length >= list.length * 0.6;
    const nDrawers = list.filter((x) => /^web:drawer-/.test(x)).length, rest = list.length - nDrawers;
    return addVariant('color', `${g}.${k}${drawers ? 'Drawer' : c.value.split(' ')[1].replace('%', '')}`, hexPctRgba(c.value), `color.${g}.${k}`, drawers ? `the web drawers' backdrop, ${plural(nDrawers, 'state')}${rest ? `; also ${plural(rest, 'other state')} (${[...new Set(list.filter((x) => !/^web:drawer-/.test(x)).map((x) => x.replace(/-\d+$/, '').replace(/-no-listings.*$/, '').replace(/^mobile:tour$/, 'the phone onboarding tour')))].join(', ')})` : ''}` : `${plural(c.states, 'state')}`, c.states, `--pf-ml-${kebab(g)}-${kebab(k)}${drawers ? '-drawer' : `-${c.value.split(' ')[1].replace('%', '')}`}`);
  });
  adjusted.push({ token: `color.${g}.${k}`, declared: v, value: R.color[g][k], basis: `the build's ${alpha} layer (its modals' and sheets' backdrop), ${plural(near.states, 'state')}`, variants: extra });
}
{
  const ground = (dev) => (P.grounds || []).filter((x) => x.device === dev).sort((a, b) => b.states - a.states)[0];
  const ph = ground('mobile'), wb = ground('web');
  if (ph && ph.colour !== T.color.surface.page.toUpperCase()) {
    R.color.surface.page = ph.colour;
    const extra = wb && wb.colour !== ph.colour ? [addVariant('color', 'surface.pageWeb', wb.colour, 'color.surface.page', `the web page, ${wb.states} states`, wb.states, '--pf-ml-surface-page-web')] : [];
    adjusted.push({ token: 'color.surface.page', declared: T.color.surface.page, value: ph.colour, basis: `the phone's page, ${ph.states} states (tokens.json is the phone's)`, variants: extra });
  }
}
const fam = P.families.filter((f) => f.uses > 0);
for (const [k, f] of Object.entries(T.type.family)) {
  if (fam.some((x) => x.family === f)) continue;
  const mono = k === 'mono' && fam.find((x) => /mono/i.test(x.family));
  kept.push({ token: `type.family.${k}`, value: f, why: mono ? `not painted; the build's only monospace text (${mono.family}, ${plural(mono.uses, 'use')}) is the photo placeholder's caption, a stand-in for the listing photo — nothing to follow` : k === 'app' ? 'painted nowhere — the phone header that drew it is the product\'s now (the shell is kept)' : 'painted nowhere — nothing to follow' });
}

/* the designer's decisions applied to the screens themselves */
const riyal = states.reduce((n, s) => n + ((s.decisions || []).map((d) => +((d.match(/riyal ×(\d+)/) || [])[1] || 0)).reduce((a, b) => a + b, 0)), 0);
const riyalStates = states.filter((s) => (s.decisions || []).some((d) => /riyal/.test(d))).length;
/* "SAR" the capture left as typed: inside an editable field (a user's own text) */
const sarKept = states.filter((s) => existsSync(join(ROOT, s.file)) && /contenteditable="true"[^>]*>[^<]*\bSAR\b/.test(readFileSync(join(ROOT, s.file), 'utf8'))).length;
const shellStates = states.filter((s) => (s.decisions || []).includes('header')).length;
const railStates = states.filter((s) => (s.decisions || []).includes('rail')).length;
const decisions = [
  { what: 'The product shell is kept', how: `every screen (${shellStates} of ${states.length}) draws the product's own header, and every web screen (${railStates} of ${web}) its rail, in place of the handover's (scripts/theme/shell.mjs) — on a phone the rail is the header menu's drawer; the new theme is measured without them` },
  { what: 'The riyal is a glyph', how: `"SAR" written out became the official riyal sign (kit/riyal.svg, the product's icon-font glyph; the handover's own rough icon("sar") is redrawn the same way) in ${plural(riyal, 'place')} across ${plural(riyalStates, 'state')}${sarKept ? ` — kept as typed inside the agent's own listing description (an editable field) in ${plural(sarKept, 'state')}, by decision` : ''}` },
  { what: 'The drawer is 780px', how: 'both builds draw the Listing Performance drawer 780 wide (spec 02b agrees); 03 · F’s 680 is the Quality Score drawer’s width' },
  { what: 'Mark as Booked is derived', how: `${plural(derived.length, 'screen')} composed in the build from its own booking values, tagged [derived], until the handover draws it` },
];

/* ── tokens.css: the adjusted tokens ────────────────────────────────── */
const vars = [];
const C = R.color;
const note = (token) => { const a = adjusted.find((x) => x.token === token); return a ? ` /* tokens.json: ${a.declared} — follows the build */` : ''; };
vars.push('  /* primary — the green ramp, lightest (−1) to darkest (11); 8 is the brand green */');
for (const k of Object.keys(C.primary).sort((a, b) => +a - +b)) vars.push(`  --pf-ml-primary-${k === '-1' ? 'm1' : k}: ${C.primary[k]};`);
for (const g of ['brand', 'tint', 'status', 'text', 'border', 'surface', 'gradient']) {
  vars.push(`  /* ${g} */`);
  for (const [k, v] of Object.entries(C[g])) vars.push(`  --pf-ml-${g}-${kebab(k)}: ${v};${note(`color.${g}.${k}`)}`);
  for (const x of variants.filter((x) => x.token.startsWith(`color.${g}.`))) vars.push(`  ${x.css}: ${x.value}; /* variant of ${x.of}: ${x.where} */`);
}
vars.push('  /* radius, px */');
for (const [k, v] of Object.entries(R.radius)) vars.push(`  --pf-ml-radius-${k}: ${v}px;${note(`radius.${k}`)}`);
for (const x of variants.filter((x) => x.token.startsWith('radius.'))) vars.push(`  ${x.css}: ${x.value}px; /* variant of ${x.of}: ${x.where} */`);
vars.push('  /* space, px */'); for (const [k, v] of Object.entries(R.space)) vars.push(`  --pf-ml-space-${k}: ${v}px;`);
vars.push('  /* type — the families, then each role as a font shorthand (phone, 360pt) */');
const FALLBACK = { ui: 'Geist, "Helvetica Neue", Helvetica, sans-serif', app: 'Lato, sans-serif', chrome: 'Figtree, sans-serif', mono: '"JetBrains Mono", ui-monospace, monospace' };
for (const [k, v] of Object.entries(R.type.family)) vars.push(`  --pf-ml-font-${k}: ${FALLBACK[k] || v};`);
const typeVar = (css, r) => [`  ${css}: ${r.weight} ${r.size}px/${r.line === 'normal' ? 'normal' : `${r.line}px`} var(--pf-ml-font-${FACE[r.family] || 'ui'});`, ...(r.color ? [`  ${css}-color: ${r.color};`] : [])];
for (const [k, r] of Object.entries(R.type)) if (k !== 'family') { const lines = typeVar(`--pf-ml-type-${kebab(k)}`, r); lines[0] += note(`type.${k}`); vars.push(...lines); }
for (const x of variants.filter((x) => x.token.startsWith('type.'))) { const lines = typeVar(x.css, x.value); lines[0] += ` /* variant of ${x.of}: ${x.where} */`; vars.push(...lines); }
vars.push('  /* motion */'); for (const [k, m] of Object.entries(R.motion)) vars.push(`  --pf-ml-motion-${kebab(k)}: ${m.duration}ms ${m.curve};${m.note ? ` /* ${m.note} */` : ''}`);
vars.push('  /* elevation */'); for (const [k, v] of Object.entries(R.elevation)) vars.push(`  --pf-ml-elevation-${kebab(k)}: ${v};${note(`elevation.${k}`)}`);
for (const x of variants.filter((x) => x.token.startsWith('elevation.'))) vars.push(`  ${x.css}: ${x.value}; /* variant of ${x.of}: ${x.where} */`);
vars.push('  /* touch targets, px */');
for (const [k, v] of Object.entries(R.target)) vars.push(`  --pf-ml-target-${kebab(k)}: ${v}px;${note(`target.${k}`)}${kept.some((x) => x.token === `target.${k}`) ? ' /* a rule the build breaks — [TBC] */' : ''}`);
for (const x of variants.filter((x) => x.token.startsWith('target.'))) vars.push(`  ${x.css}: ${x.value}px; /* variant of ${x.of}: ${x.where} */`);
mkdirSync(join(ROOT, 'deliverables', 'new-theme'), { recursive: true });
writeFileSync(join(ROOT, 'deliverables', 'new-theme', 'tokens.css'), `/* My Listings — new theme (Profolio 2.0, not yet live) · [design]
   The designer's tokens (authoring/themes/new/my-listings.tokens.json, "${T.$meta.name}",
   base ${T.$meta.base}, updated ${T.$meta.updated}), following the build where the two
   disagreed (the designer's decision, 2026-09-29): ${adjusted.length} adjusted, ${variants.length} variants.
   tokens.json's own values: tokens.resolved.json → $adjusted.
   MY LISTINGS ONLY — every other page keeps ../tokens.css (the current theme).
   Written by scripts/theme/foundations.mjs. */
:root {
${vars.join('\n')}
}
`);
writeFileSync(join(ROOT, 'deliverables', 'new-theme', 'tokens.resolved.json'), JSON.stringify({ ...R, $meta: { ...T.$meta, resolved: 'tokens follow the build — the designer’s decision, 2026-09-29' }, $variants: variants, $adjusted: adjusted, $kept: kept }, null, 2));

/* ── the Foundations subsection ─────────────────────────────────────── */
const chip = (name, hex, { key, note: n2 } = {}) => {
  const n = /^#/.test(hex) ? usesOf(hex) : null;
  return `<figure class="ds-chip${key ? ' ds-chip--key' : ''}${lum(hex) > 0.9 ? ' ds-chip--pale' : ''}" title="${esc(name)} · ${esc(hex)}"><i style="background:${hex}"></i><figcaption><b>${wbr(name)}</b><code>${esc(String(hex).toUpperCase())}</code><span>${n === null ? 'the build’s' : n ? plural(n, 'use') : 'declared, not painted'}</span>${n2 ? `<em>${esc(n2)}</em>` : ''}</figcaption></figure>`;
};
const ramp = (label, items) => `<div class="ds-ramp"><div class="ds-ramp-label">${esc(label)}</div><div class="ds-ramp-row">${items.join('')}</div></div>`;
const primary = Object.keys(C.primary).sort((a, b) => +a - +b).map((k) => chip(`primary ${k}`, C.primary[k], { key: k === '8', note: k === '8' ? 'brand green' : '' }));
const group = (g, notes = {}) => [...Object.entries(C[g]).map(([k, v]) => [`${g}.${k}`, v, notes[k] || (adjusted.some((a) => a.token === `color.${g}.${k}`) ? 'follows the build' : '')]), ...variants.filter((x) => x.token.startsWith(`color.${g}.`)).map((x) => [x.token.slice(6), x.value, `variant: ${x.where}`])].filter(([, v]) => /^#|^rgba/.test(v)).map(([name, v, n]) => chip(name, v, { note: n }));
const TEALS = ['#006169', '#F2FAFA', '#F7FCFC', '#4F7B7D'];
const tealRows = TEALS.map((h) => ({ hex: h, uses: usesOf(h), parts: (hexUses.get(h) || { parts: [] }).parts, names: [...(curNames.get(h) || []).map((n) => `${n} (current theme)`), ...Object.entries(C.tint).filter(([, v]) => v.toUpperCase() === h).map(([k]) => `tint.${k} (new)`)] })).filter((r) => r.uses);
const namedTeal = tealRows.filter((r) => r.names.length);
const famTotal = fam.reduce((a, f) => a + f.uses, 0) || 1;
const share = (f) => `${Math.round((1000 * ((fam.find((x) => x.family === f) || { uses: 0 }).uses)) / famTotal) / 10}%`;
const figtreeWords = [...new Set(P.text.filter((t) => t.family === 'Figtree').sort((a, b) => b.uses - a.uses).flatMap((t) => t.words).filter((w) => w.length > 3 && !/^\d/.test(w)))].slice(0, 6);
const geistWeights = [...new Set(P.text.filter((t) => t.family === 'Geist').map((t) => Math.round(t.weight / 100) * 100))].sort();
const scale = (device) => {
  const by = new Map();
  for (const t of P.text.filter((x) => x.family === 'Geist' && x.devices.includes(device) && Number.isInteger(x.size))) {
    const e = by.get(t.size) || by.set(t.size, { size: t.size, uses: 0, w: new Map(), words: [] }).get(t.size);
    e.uses += t.uses; e.w.set(t.weight, (e.w.get(t.weight) || 0) + t.uses); e.words.push(...t.words);
  }
  return [...by.values()].filter((e) => e.uses >= 5).sort((a, b) => b.size - a.size);
};
const scaleHtml = (device) => `<div class="ds-typescale">${scale(device).map((e) => { const ws = [...e.w.entries()].sort((a, b) => b[1] - a[1]); const words = [...new Set(e.words.filter((w) => w.length >= 4 && w.length <= 34 && !/^[\d\s.,%+-]+$/.test(w)))].slice(0, 3); return `<div class="ds-ts-row"><div class="ds-ts-spec"><b>${e.size}</b></div><div class="ds-ts-sample" style="font-family:Geist,sans-serif;font-size:${e.size}px;font-weight:${ws[0][0]}">${esc(words.join(' · '))}</div><div class="ds-ts-weights">${ws.slice(0, 5).map(([w, n]) => `<span style="font-weight:${w}">${w}<small>${n}</small></span>`).join('')}</div><div class="ds-ts-uses">${e.uses}</div></div>`; }).join('')}</div>`;
const SAMPLE = { price: '1,500,000', subtype: 'Apartment for Sale', location: 'Al Hazm, West Riyadh', stat: '1,288', label: 'Views', sheetTitle: 'Delete this listing?', body: 'Buyers find it but do not enquire. Trust and detail convert views into leads.' };
const roleRow = (name, css, r, sample, n2) => `<div class="ds-style"><div class="ds-style-sample" style="font-family:${r.family || 'Geist'},sans-serif;font-size:${r.size}px;line-height:${r.line === 'normal' ? 'normal' : `${r.line}px`};font-weight:${r.weight};${r.color ? `color:${r.color}` : ''}">${esc(sample)}</div><div class="ds-style-meta"><b>${esc(name)}</b><span>${r.size} / ${r.line} · ${r.weight}</span><span>${esc(r.family || 'Geist')}</span>${r.color ? `<code>${esc(r.color)}</code>` : ''}<code>${esc(css)}</code>${n2 ? `<span>${esc(n2)}</span>` : ''}</div></div>`;
const rolesHtml = `<div class="ds-styles">${Object.entries(R.type).filter(([k]) => k !== 'family').map(([k, r]) => roleRow(k, `--pf-ml-type-${kebab(k)}`, r, SAMPLE[k] || k, adjusted.some((a) => a.token === `type.${k}`) ? 'follows the build' : '')).join('')}${variants.filter((x) => x.token.startsWith('type.')).map((x) => roleRow(x.token.slice(5), x.css, x.value, x.sample || SAMPLE[x.of.slice(5)] || x.of, `variant: ${x.where}`)).join('')}</div>`;
const radUses = new Map(P.radii.map((r) => [r.value, r.uses]));
const tokenCorner = (k, v, n2) => { const val = v >= 999 ? 'pill' : `${v}px`; const n = v >= 999 ? radUses.get('pill') || 0 : /sheet/.test(k) ? radUses.get(`${v}px ${v}px 0px 0px`) || 0 : (radUses.get(val) || 0) + (radUses.get(`${v}px ${v}px 0px 0px`) || 0); return `<figure class="ds-corner${v >= 999 ? ' ds-corner--pill' : ''}"><i style="border-radius:${v >= 999 ? '999px' : /sheet/.test(k) ? `${v}px ${v}px 0 0` : `${v}px`};border-color:#28B16D;background:#E9F7F0"></i><figcaption><b>${esc(k)} · ${v >= 999 ? 'pill' : `${v}px`}</b><code>--pf-ml-radius-${kebab(k)}</code><span>${n ? plural(n, 'use') : 'declared, not painted'}${/sheet/.test(k) ? ' · top corners' : ''}</span>${n2 ? `<em>${esc(n2)}</em>` : ''}</figcaption></figure>`; };
const tokenRadii = new Set([...Object.values(R.radius), ...variants.filter((x) => x.token.startsWith('radius.')).map((x) => x.value)].flatMap((v) => (v >= 999 ? ['pill'] : [`${v}px`, `${v}px ${v}px 0px 0px`])));
const offScale = P.radii.filter((r) => !tokenRadii.has(r.value) && r.value !== 'circle' && r.uses >= 2);
const lato = fam.find((f) => f.family === 'Lato');
const html = `
<h3 id="new-theme-tokens">My Listings — new theme <small>Profolio 2.0 · not yet live · My Listings only</small></h3>
<p class="ds-note">The redesign starts with My Listings. These are <b>its</b> tokens — the designer’s <code>tokens.json</code> (“${esc(T.$meta.name)}”, base ${esc(T.$meta.base)}, ${esc(T.$meta.updated)}) — <b>following the build</b> where the two disagreed (the designer’s decision, 29 Sep 2026): ${plural(adjusted.length, 'token')} adjusted, ${plural(variants.length, 'variant')} added, tokens.json’s own values kept in the table below. Measured off the ${states.length} compiled states of the new My Listings (${web} web at 1440, ${phone} phone at 360). Every other page keeps the current theme above, and so does the shell: the screens draw the product’s own header, and on the web its rail. The values are in <a href="new-theme/tokens.css"><code>new-theme/tokens.css</code></a> as <code>--pf-ml-*</code>; they replace no current token.</p>
<h4>Typefaces</h4>
<div class="ds-faces">
<figure class="ds-face"><div class="ds-face-art" style="font-family:Geist,sans-serif">Aa</div><figcaption><h4 style="font-family:Geist,sans-serif">Geist</h4><p>Latin · variable, 300–800 · <b>My Listings only</b> · ${share('Geist')} of the text the new My Listings draws</p>
<div class="ds-face-line" style="font-family:Geist,sans-serif">ABCDEFGHIJKLMNOPQRSTUVWXYZ<br>abcdefghijklmnopqrstuvwxyz<br>0123456789 · 1,500,000 · 52nd of 240</div>
<div class="ds-face-weights">${geistWeights.map((w) => `<span style="font-family:Geist,sans-serif;font-weight:${w}">${w}</span>`).join('')}</div></figcaption></figure>
<figure class="ds-face"><div class="ds-face-art">Aa</div><figcaption><h4>Figtree</h4><p>Latin · the product’s face, kept for the chrome · ${share('Figtree')} of the new My Listings’ text</p>
<div class="ds-face-line">${esc(figtreeWords.join(' · '))}</div></figcaption></figure>
</div>
<p class="ds-note">Geist is the UI face (<code>type.family.ui</code>) and appears only on My Listings — nowhere else in the product. Figtree (<code>type.family.chrome</code>) draws the empty states, the modals and most sheet and drawer titles (the web page title is the product header's now — the current theme); the Listing Performance drawer and sheet titles are Geist. ${lato ? `Lato (<code>type.family.app</code>) is still drawn in ${plural(lato.uses, 'place')}.` : 'Lato (<code>type.family.app</code>) drew only the artboard’s own top — its status bar and title — which the product’s header now replaces.'} JetBrains Mono (<code>type.family.mono</code>) is painted nowhere (the only monospace text is the photo placeholder's caption, a stand-in for the listing photo). Arabic stays Droid Arabic Kufi; the handover has no Arabic.</p>
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
<div class="ds-palette"><h4>Teal, where it stays</h4><p class="ds-note">Teal stays in the rank and Quality Score explainers: the How to Earn Quality Score drawer (web) and sheet (phone) paint the current theme’s teal, and the rank and quality cards sit on <code>tint.teal050</code>. Measured, it appears in three more places: the TruCheck glyph in a row’s actions and the selected metric pill of the performance trend (<code>#F2FAFA</code>), both kept from the current product, and the onboarding tour’s hero card, a <code>#F2FAFA</code> → <code>#F0FAF5</code> gradient into the green tint. (The product’s own header, and on the web its rail, are the current theme.)</p>
${ramp('Teal', namedTeal.map((r) => chip(r.names[0].replace(/ \(.*\)$/, ''), r.hex, { note: r.names.map((n) => n.replace(/^[^(]*\(/, '(')).join(' ') })))}
</div>
<h4>Type roles <small>the phone’s roles, at 360pt — each as the phone draws its own words</small></h4>
${rolesHtml}
<h4>Type as drawn <small>Geist, every whole size drawn five times or more — the web at 1440, then the phone at 360</small></h4>
<h5>Web</h5>${scaleHtml('web')}
<h5>Phone</h5>${scaleHtml('mobile')}
<h4>Corners</h4>
<div class="ds-corners">${Object.entries(R.radius).map(([k, v]) => tokenCorner(k, v, adjusted.some((a) => a.token === `radius.${k}`) ? 'follows the build' : '')).join('')}${variants.filter((x) => x.token.startsWith('radius.')).map((x) => tokenCorner(x.token.slice(7), x.value, `variant: ${x.where}`)).join('')}</div>
${offScale.length ? `<p class="ds-note">Also drawn, off the token scale: ${offScale.map((r) => `<code>${esc(r.value)}</code> ×${r.uses}`).join(' ')}.</p>` : ''}
<h4>Space, elevation, motion, targets</h4>
<table class="ds-table"><thead><tr><th>token</th><th>value</th></tr></thead><tbody>
${Object.entries(R.space).map(([k, v]) => `<tr><td><code>space.${esc(k)}</code></td><td>${v}px <span class="ds-bar" style="display:inline-block;vertical-align:middle;width:${v * 3}px;height:8px;border-radius:2px;background:#28B16D"></span></td></tr>`).join('')}
${Object.entries(R.elevation).map(([k, v]) => `<tr><td><code>elevation.${esc(k)}</code></td><td><code>${esc(v)}</code>${adjusted.some((a) => a.token === `elevation.${k}`) ? ' · follows the build' : ''}</td></tr>`).join('')}
${Object.entries(R.motion).map(([k, m]) => `<tr><td><code>motion.${esc(k)}</code></td><td>${m.duration}ms · <code>${esc(m.curve)}</code>${m.note ? ` · ${esc(m.note)}` : ''}</td></tr>`).join('')}
${Object.entries(R.target).map(([k, v]) => `<tr><td><code>target.${esc(k)}</code></td><td>${v}px${adjusted.some((a) => a.token === `target.${k}`) ? ' · follows the build' : ''}${kept.some((x) => x.token === `target.${k}`) ? ' · a rule the build breaks — [TBC]' : ''}</td></tr>`).join('')}
${variants.filter((x) => x.token.startsWith('target.')).map((x) => `<tr><td><code>${esc(x.token)}</code></td><td>${x.value}px · variant: ${esc(x.where)}</td></tr>`).join('')}
</tbody></table>
<h4>Adjusted to the build <small>tokens follow the build — the designer’s decision, 29 Sep 2026</small></h4>
<table class="ds-table"><thead><tr><th>token</th><th>tokens.json</th><th>now</th><th>why</th></tr></thead><tbody>${adjusted.map((a) => `<tr><td><code>${esc(a.token)}</code></td><td><code>${esc(a.declared)}</code></td><td><code>${esc(a.value)}</code>${(a.variants || []).length ? `<br>+ ${a.variants.map((v) => `<code>${esc(v)}</code>`).join(', ')}` : ''}</td><td>${esc(a.basis)}</td></tr>`).join('')}</tbody></table>
${kept.length ? `<h4>Kept as declared</h4><table class="ds-table"><thead><tr><th>token</th><th>value</th><th>why</th></tr></thead><tbody>${kept.map((k) => `<tr><td><code>${esc(k.token)}</code></td><td><code>${esc(k.value)}</code></td><td>${esc(k.why)}</td></tr>`).join('')}</tbody></table>` : ''}
<h4>Decisions applied to the screens</h4>
<table class="ds-table"><tbody>${decisions.map((d) => `<tr><td>${esc(d.what)}</td><td>${esc(d.how)}</td></tr>`).join('')}</tbody></table>`;
writeFileSync(join(ROOT, 'data', 'theme', 'foundations.html'), html);
writeFileSync(join(ROOT, 'data', 'theme', 'foundations.json'), JSON.stringify({
  meta: T.$meta, states: { web, phone, derived: derived.length },
  families: fam.map((f) => ({ family: f.family, share: share(f.family), devices: f.devices })),
  colours: [...Object.entries(C.primary).map(([k, v]) => ({ token: `color.primary.${k}`, css: `--pf-ml-primary-${k === '-1' ? 'm1' : k}`, value: v, uses: usesOf(v) })),
    ...['brand', 'tint', 'status', 'text', 'border', 'surface', 'gradient'].flatMap((g) => Object.entries(C[g]).map(([k, v]) => ({ token: `color.${g}.${k}`, css: `--pf-ml-${g}-${kebab(k)}`, value: v, uses: /^#/.test(v) ? usesOf(v) : g === 'gradient' ? gradientUses(v) : /^rgba/.test(v) ? (hexUses.get(rgbaHex(v)) || { uses: 0 }).uses : null })))],
  teal: tealRows, radius: R.radius, space: R.space, type: R.type, motion: R.motion, elevation: R.elevation, target: R.target,
  declared: { radius: T.radius, type: T.type, elevation: T.elevation, target: T.target, color: T.color },
  variants, adjusted, kept, decisions,
}, null, 1));
console.log(`  deliverables/new-theme/tokens.css — ${vars.filter((v) => v.includes('--')).length} tokens · ${adjusted.length} adjusted to the build · ${variants.length} variants · ${kept.length} kept`);
for (const a of adjusted) console.log(`    ${a.token}: ${a.declared} → ${a.value}${(a.variants || []).length ? ` (+ ${a.variants.join(', ')})` : ''}`);
for (const k of kept) console.log(`    kept ${k.token}: ${k.why}`);
