#!/usr/bin/env node
/**
 * Design QA — the whole design system held to the product three ways, in one
 * report.
 *
 *   1. PIXELS  every compiled page and state, web (1440) and responsive (375),
 *      against the product's own render of it (data/qa/compile.json: each file
 *      was screenshotted and diffed when it was compiled), again on the one
 *      shared stylesheet (data/qa/stylesheet.json), and every component
 *      variant cut out of them against the same element in its page
 *      (data/qa/components.json).
 *   2. LIVE    the compiled pages against the REAL product on two real
 *      accounts, box by box — geometry and paint (scripts/qa-fidelity.mjs
 *      --real): the owner at 1440; the staff user at 1440 and at 375, held to
 *      the as-staff state compiled for them. The two accounts' data is not the
 *      fixture's, so a row count or a text width differs for reasons that are
 *      not design; COVERAGE (the real boxes we draw at all) is the number that
 *      says the design is there.
 *   3. CODE    what the compiled files render, against the product's source:
 *      every data-pf-src names a real file and line; every UI string on
 *      screen is the product's copy (translation.json) or its code, or is
 *      fixture data; nothing renders undefined, NaN, [object Object] or a raw
 *      {{placeholder}}; every image and font loads; every state link lands on
 *      a compiled file.
 *
 * And the responsive layout's own findings — where the PRODUCT overflows a
 * phone's width. Those are the product's, reproduced faithfully, and listed so
 * a redesign knows about them.
 *
 *   node scripts/design-qa.mjs
 *
 * Writes data/qa/design-qa.json and deliverables/design-qa.html.
 */
import pkg from 'playwright';
import { readFileSync, writeFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { DEVICES } from '../harness/devices.mjs';
import { ALL } from './pages-list.mjs';

const { chromium } = pkg;
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const D = join(ROOT, 'deliverables');
const REPO = join(ROOT, '..', process.env.PROFOLIO_REPO || 'profolio-reactjs');
const json = (p, d = null) => (existsSync(join(ROOT, p)) ? JSON.parse(readFileSync(join(ROOT, p), 'utf8')) : d);
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const PIXEL_BAR = 0.5, COMP_BAR = 1.0;

/* ── the compiled files ───────────────────────────────────────────────── */
const compiledIn = (rel) => (existsSync(join(D, rel)) ? readdirSync(join(D, rel)).filter((f) => f.endsWith('.html')).map((f) => rel + f) : [])
  .filter((r) => /<meta name="pf-compiled"/.test(readFileSync(join(D, r), 'utf8').slice(0, 8000)));
const FILES = [...compiledIn('').map((r) => ['web', r]), ...compiledIn('states/').map((r) => ['web', r]), ...compiledIn('mobile/').map((r) => ['mobile', r]), ...compiledIn('mobile/states/').map((r) => ['mobile', r])];
const dataName = (dev, rel) => rel.split('/').pop().replace(/\.html$/, '') + (dev === 'mobile' ? '--mobile' : '');

/* ── the product's words: its translations, and every literal in its code ── */
const norm = (s) => String(s).toLowerCase().replace(/[‎‏]/g, '').replace(/\s+/g, ' ').replace(/[\s:*.]+$/, '').trim();
const copy = new Set(), code = new Set();
const place = [];
const tr = join(REPO, 'src', 'locales', 'en', 'translation.json');
if (existsSync(tr)) {
  const reEsc = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const walk = (v) => { if (v && typeof v === 'object') return Object.entries(v).forEach(([k, x]) => { if (typeof x === 'string') { copy.add(norm(x)); copy.add(norm(k)); if (/\{\{/.test(x)) place.push(new RegExp('^' + norm(x).split(/\{\{[^}]*\}\}/).map(reEsc).join('.+') + '$')); } else walk(x); }); };
  walk(JSON.parse(readFileSync(tr, 'utf8')));
}
const srcFiles = [];
const walkDir = (d) => { for (const n of readdirSync(d)) { const p = join(d, n); const st = statSync(p); if (st.isDirectory()) { if (!/node_modules|\.git|locales/.test(n)) walkDir(p); } else if (/\.(jsx?|tsx?|json)$/.test(n) && st.size < 2e6) srcFiles.push(p); } };
if (existsSync(join(REPO, 'src'))) walkDir(join(REPO, 'src'));
for (const f of srcFiles) {
  const t = readFileSync(f, 'utf8');
  for (const m of t.matchAll(/'([^'\n]{2,120})'|"([^"\n]{2,120})"|`([^`$\n]{2,120})`/g)) code.add(norm(m[1] || m[2] || m[3]));
  for (const m of t.matchAll(/>([^<>{}\n]{2,120})</g)) code.add(norm(m[1]));
}
/* the fixture account's own words — names, addresses, listing titles, API labels */
const fixture = new Set();
for (const f of [join(ROOT, 'harness', 'fixtures.mjs'), join(ROOT, 'harness', 'fixtures', 'user.json'), ...readdirSync(join(ROOT, 'harness', 'fixtures')).filter((f) => f.endsWith('.mjs')).map((f) => join(ROOT, 'harness', 'fixtures', f))]) {
  if (!existsSync(f)) continue;
  for (const m of readFileSync(f, 'utf8').matchAll(/'([^'\n]{2,160})'|"([^"\n]{2,160})"|`([^`\n]{2,160})`/g)) fixture.add(norm((m[1] || m[2] || m[3]).replace(/\$\{[^}]*\}/g, '')));
}
const fixtureList = [...fixture].filter((x) => x.length >= 4);
const classify = (s) => {
  const n = norm(s);
  if (!n) return null;
  if (copy.has(n) || place.some((r) => r.test(n))) return 'copy';
  if (code.has(n)) return 'code';
  if (/\d/.test(n) || /^[\W_]+$/.test(n) || /@|\+966|www\.|https?:/.test(n)) return 'data';
  if (fixture.has(n) || fixtureList.some((f) => f.includes(n) || n.includes(f))) return 'data';
  /* a string split across elements: part of a longer piece of copy */
  if (n.length >= 6 && [...copy].some((c) => c.length > n.length && c.includes(n))) return 'copy';
  return 'unmatched';
};

/* ── in the page ─────────────────────────────────────────────────────── */
const INSPECT = () => {
  const vis = (el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none'; };
  const text = document.body.innerText || '';
  const bad = [];
  for (const re of [/\bundefined\b/g, /\bNaN\b/g, /\[object Object\]/g, /Invalid Date/g, /\{\{[^}]*\}\}/g, /(^|\s)null(\s|$)/g]) for (const m of text.matchAll(re)) bad.push(text.slice(Math.max(0, m.index - 30), m.index + 40).replace(/\s+/g, ' ').trim());
  const brokenImg = [...document.images].filter((i) => vis(i) && i.complete && i.naturalWidth === 0).map((i) => (i.getAttribute('src') || '').slice(0, 60));
  const fontsBad = [...document.fonts].filter((f) => f.status === 'error').map((f) => f.family);
  const go = [...document.querySelectorAll('[data-pf-go]')].map((e) => e.getAttribute('data-pf-go'));
  const src = [...new Set([...document.querySelectorAll('[data-pf-src]')].map((e) => e.getAttribute('data-pf-src')))];
  /* the chrome of the interface, where the strings are the product's copy:
     controls, labels, headings, tabs, menus, titles, placeholders, empties */
  const UI = 'button, label, th, h1, h2, h3, h4, h5, .pf-btn, .pf-tabs-tab, .pf-menu-item, .pf-form-item-label, .pf-modal-title, .pf-drawer-title, .pf-popover-title, .pf-tooltip-inner, .pf-empty-description, .pf-select-selection-placeholder, .pf-segmented-item-label, .pf-radio-wrapper, .pf-checkbox-wrapper, .pf-card-head-title, .pf-statistic-title, .pf-tag, .pf-typography, [role=tab], [role=menuitem]';
  const strings = new Set();
  for (const el of document.querySelectorAll(UI)) {
    if (!vis(el)) continue;
    for (const line of (el.innerText || '').split('\n')) { const t = line.replace(/\s+/g, ' ').trim(); if (t && t.length <= 90) strings.add(t); }
  }
  for (const el of document.querySelectorAll('[placeholder]')) if (vis(el)) strings.add(el.getAttribute('placeholder').trim());
  const W = document.documentElement.scrollWidth;
  return { bad: [...new Set(bad)].slice(0, 12), brokenImg, fontsBad: [...new Set(fontsBad)], go, src, strings: [...strings], width: W, vw: innerWidth };
};

const browser = await chromium.launch();
const ctxs = { web: await browser.newContext(DEVICES.web), mobile: await browser.newContext({ viewport: DEVICES.mobile.viewport, deviceScaleFactor: 1 }) };
const pagesQA = [];
const allSrc = new Set();
const strAll = new Map();                                     /* string → { cls, where: Set } */
for (const [dev, rel] of FILES) {
  const pg = await ctxs[dev].newPage();
  await pg.route('**/*', (r) => (/^(file|data|about):/.test(r.request().url()) ? r.continue() : r.abort()));
  await pg.goto(pathToFileURL(join(D, rel)).href, { waitUntil: 'load' });
  await pg.evaluate(() => document.fonts.ready);
  const r = await pg.evaluate(INSPECT);
  await pg.close();
  const deadGo = r.go.filter((h) => !existsSync(join(D, dirname(rel), h)));
  r.src.forEach((s) => allSrc.add(s));
  for (const s of r.strings) { const k = norm(s); if (!strAll.has(k)) strAll.set(k, { s, cls: classify(s), where: new Set() }); strAll.get(k).where.add(dataName(dev, rel)); }
  pagesQA.push({ name: dataName(dev, rel), device: dev, file: `deliverables/${rel}`, bad: r.bad, brokenImg: r.brokenImg, fontsBad: r.fontsBad, links: r.go.length, deadGo, overflow: r.width > r.vw + 1 ? r.width - r.vw : 0, width: r.width });
}
await browser.close();

/* ── source references: every data-pf-src names a real file and line ──── */
const srcBad = [];
for (const s of allSrc) {
  const [file, line] = s.split(':');
  const f = join(REPO, file);
  if (!existsSync(f)) { srcBad.push(`${s} — no such file`); continue; }
  if (line && Number(line) > readFileSync(f, 'utf8').split('\n').length) srcBad.push(`${s} — past the end of the file`);
}

/* ── the ledgers ─────────────────────────────────────────────────────── */
const compile = new Map((json('data/qa/compile.json', { rows: [] }).rows || []).map((r) => [r.name, r]));
const sheet = new Map((json('data/qa/stylesheet.json', { rows: [] }).rows || []).map((r) => [r.name, r]));
const comps = json('data/qa/components.json', { results: {} });
const live = {
  /* the compiled copy against the product's own render, the same data on
     both sides — box by box, the strictest measure there is */
  harness: json('data/qa/fidelity.json'),
  harnessMobile: json('data/qa/fidelity-mobile.json'),
  owner: json('data/qa/fidelity-real.json'),
  staff: json('data/qa/fidelity-real-b-as-staff.json'),
  staffMobile: json('data/qa/fidelity-real-b-as-staff-mobile.json'),
};
for (const p of pagesQA) {
  const c = compile.get(p.name), s = sheet.get(p.name);
  p.pixel = c ? c.pct : null;
  p.sheet = s ? s.pct : null;
  p.ok = (p.pixel === null || p.pixel <= PIXEL_BAR) && !p.bad.length && !p.brokenImg.length && !p.deadGo.length && !p.fontsBad.length;
}
const cr = Object.values(comps.results || {}).filter((r) => r.level !== 'page' && r.pct !== null && !Number.isNaN(r.pct));
const compBy = (dev) => { const x = cr.filter((r) => (r.device || 'web') === dev); return { n: x.length, ok: x.filter((r) => r.ok).length, near: x.filter((r) => r.pct <= 2).length }; };
const strings = [...strAll.values()];
const strBy = (cls) => strings.filter((x) => x.cls === cls).length;
const summary = {
  files: { web: pagesQA.filter((p) => p.device === 'web').length, responsive: pagesQA.filter((p) => p.device === 'mobile').length },
  pixel: ['web', 'mobile'].map((d) => { const x = pagesQA.filter((p) => p.device === d && p.pixel !== null); return { device: d, n: x.length, ok: x.filter((p) => p.pixel <= PIXEL_BAR).length, worst: x.sort((a, b) => b.pixel - a.pixel).slice(0, 5).map((p) => `${p.name} ${p.pixel}%`) }; }),
  unscored: pagesQA.filter((p) => p.pixel === null).map((p) => p.name),
  sheet: { n: pagesQA.filter((p) => p.sheet !== null).length, ok: pagesQA.filter((p) => p.sheet !== null && p.sheet <= PIXEL_BAR).length },
  components: { web: compBy('web'), responsive: compBy('mobile') },
  live: Object.fromEntries(Object.entries(live).map(([k, v]) => [k, v ? { coverage: v.coverage, fidelity: v.fidelity, exact: v.exact, pages: (v.rows || []).length } : null])),
  copy: { strings: strings.length, copy: strBy('copy'), code: strBy('code'), data: strBy('data'), unmatched: strBy('unmatched') },
  source: { refs: allSrc.size, bad: srcBad.length },
  sanity: { withBadText: pagesQA.filter((p) => p.bad.length).length, brokenImages: pagesQA.filter((p) => p.brokenImg.length).length, deadLinks: pagesQA.reduce((a, p) => a + p.deadGo.length, 0), fontErrors: pagesQA.filter((p) => p.fontsBad.length).length },
  overflow: pagesQA.filter((p) => p.device === 'mobile' && p.overflow > 0).map((p) => ({ name: p.name, width: p.width })),
  /* the prototype: how much of it clicks through */
  prototype: {
    links: pagesQA.reduce((a, p) => a + p.links, 0),
    filesWithLinks: pagesQA.filter((p) => p.links > 0).length,
    nested: pagesQA.filter((p) => p.name.includes('__')).length,
    flows: [...new Set(pagesQA.map((p) => (p.name.match(/--flow-([a-z0-9]+(?:-[a-z0-9]+)*?)-\d{2}-/) || [])[1]).filter(Boolean))].length,
    flowSteps: pagesQA.filter((p) => /--flow-/.test(p.name)).length,
  },
};
const report = { at: new Date().toISOString(), bars: { pixel: PIXEL_BAR, component: COMP_BAR }, summary, pages: pagesQA, srcBad, unmatched: strings.filter((x) => x.cls === 'unmatched').map((x) => ({ s: x.s, where: [...x.where].slice(0, 6) })).slice(0, 300), live };
writeFileSync(join(ROOT, 'data', 'qa', 'design-qa.json'), JSON.stringify(report, null, 1));

/* ── what this QA found, and what became of it ─────────────────────────
   Written by hand: a number says how far off something is, not why. Each
   entry is a defect the QA of 2026-09-28 traced to a cause, with the fix or
   the reason it stays. */
const FINDINGS = [
  { area: 'Responsive', what: 'Fixed bars (the app-install banner, the header) were 433px wide on a 375px phone.', why: 'The compiled pages carried a generic viewport meta; without the product\'s maximum-scale=1.0, user-scalable=0 a phone widens its layout viewport to the product\'s horizontal overflow. A full-page screenshot hid it.', status: 'fixed — scripts/compile.mjs copies the product\'s own viewport meta' },
  { area: 'Responsive', what: 'The app-install banner lost its text column; the phone dashboard was 0.35% off.', why: 'A link inside a link: legal in the DOM React builds, impossible in parsed HTML — the parser closed the outer link.', status: 'fixed — such elements are written <pf-el> and restored on load (scripts/lib/nested-a.mjs); the phone dashboard is now 0.003%' },
  { area: 'Web + responsive', what: 'Agent Performance was 0.5–0.9% off on every state; each badge description sat 5px high.', why: 'A <div> inside a <p>: the parser closed the <p> and left an empty <p></p> with margins after it.', status: 'fixed — the same rule set covers blocks in <p>, links in links, buttons in buttons, forms in forms, headings in headings' },
  { area: 'Web', what: 'A quality popover on Reports · Listing Report was missing from its compiled state.', why: 'It was frozen mid-entrance, still carrying antd\'s zoom-appear classes; the copy has no keyframes to finish the animation, so it stayed at opacity 0.', status: 'fixed — compile freezes only a settled page, and entering motion classes are dropped' },
  { area: 'Web + responsive', what: 'Dropdowns, select lists and pickers opened on the other side of their field in the reference shot.', why: 'A full-page shot resizes the viewport and antd re-places open overlays; the frozen copy kept the first placement.', status: 'fixed — any open overlay, or any scrolled box, is shot at the viewport' },
  { area: 'Web + responsive', what: 'A clicked or hovered control showed its hover colour in the product and not in the copy.', why: 'A static page has no pointer.', status: 'fixed — freeze.js marks what is hovered, focused or pressed, and the compiled CSS matches the mark as well as the pseudo-class' },
  { area: 'Responsive', what: 'Half the phone component cut-outs failed; 31 reference shots were blank.', why: 'Mobile emulation lays fixed and overflowing content out against a widened layout viewport, and element shots outside the visual viewport come out empty; shooting an off-canvas element scrolled clipped containers and moved every later shot.', status: 'fixed — responsive components are collected in a plain 375 window (what a component page\'s frame is), off-canvas and clipped-away elements are skipped, and scroll offsets are put back' },
  { area: 'Components', what: 'Inline components and centred text were a fraction of a pixel off.', why: 'clientWidth is rounded (72 for 72.39), and an inline box takes no vertical margin.', status: 'fixed — widths come from the rect, and an inline cut-out is placed by the box around it' },
  { area: 'Harness', what: 'One failed state could spoil every state after it (the congratulations modal kept reopening; a navigation in flight interrupted the next page load).', why: 'A harness flag set by a state that timed out stayed set.', status: 'fixed — flags are spent by the load they were set for, and a failed state leaves the page' },
  { area: 'Harness', what: 'The explorer found 17 dashboard states where it had found 24.', why: 'Richer fixture data put more controls before the 60-candidate cap.', status: 'fixed — breadth first (one control of every kind before any repeat), up to 120; 157 web and 119 responsive states found' },
  { area: 'Stylesheet', what: 'The web and the responsive layout shared one stylesheet whose single cascade order suited neither.', why: 'The same rules come in different orders on a phone’s pages (80,553 disagreements merged together).', status: 'fixed — one stylesheet per layout: profolio.css for the web, profolio.mobile.css for the responsive layout' },
  { area: 'Stylesheet', what: '29 of 532 files — dashboard popovers and drawers over the recent-listings table, and three responsive inline states — do not render the same on their layout’s shared stylesheet.', why: 'Opening those overlays injects the product’s styles in an order that contradicts the table’s rules in the shared order: the table’s columns move.', status: 'open — each keeps its own CSS inline and stays within the pixel bar; split per layout, the same 29 remain' },
  { area: 'Components', what: '26 reference shots were blank — controls deep inside drawers (filters, details, leaderboard).', why: 'The reference un-clipped every ancestor, which threw away the drawer body\'s scroll and left the control below a fixed box\'s edge, where no scroll reaches.', status: 'fixed — the control is scrolled into view inside its own boxes, and only boxes it does not fit in are un-clipped' },
  { area: 'Knowledge base', what: 'The same control opened a modal on the web and a drawer on a phone, and read as two unrelated states.', why: 'The product swaps the component by device; the explorer names each after what it is.', status: 'fixed — paired by trigger into one state with both files' },
  { area: 'Skill', what: 'SKILL.md said the product never writes "SAR" beside a price.', why: 'It does once, in copy: "Get one through Bayut, starting from SAR 250." (ad-license-form.js:106).', status: 'fixed — the rule now names that sentence as the one exception' },
  { area: 'Product', what: 'The package plan icons (Bronze, Silver, Gold, Platinum, Starter…) paint with each other’s gradients on /packages.', why: 'Every one of them uses the same SVG ids — a, b, c, d, e (src/components/svg.js, an optimiser’s output) — and url(#b) resolves to the first id="b" on the page.', status: 'reported — the pages show what the product paints; each icon’s component page shows it with its own gradient, and says it differs from the product' },
  { area: 'Components', what: 'A card with a sticky header came out 44px lower in its example.', why: 'In a short example frame the sticky header sticks; in its page it sat in the flow.', status: 'fixed — a cut-out keeps sticky boxes where they were' },
  { area: 'Product · phone', what: 'The listings filter “Posted On” cannot open its calendar on a phone.', why: 'listings.js gives every filter an analytics onClick and filters.js spreads it over the date filter’s own; on a phone the calendar sheet follows only that prop, so a tap fires the event and nothing else.', status: 'reported — the web state exists; the phone has none' },
  { area: 'Product · phone', what: 'The sticky “All Listings” bar never gets its shadow.', why: 'The code compares scrollY with the bar’s offsetTop, and a stuck bar’s offsetTop is always scrollY + 74.', status: 'reported — compiled as it renders (listings--sticky-filters)' },
  { area: 'Product · phone', what: 'Reports · Leads: the “Traffic and Leads by date” list cannot be filtered on a phone; Reports · Listing: its pagination does nothing.', why: 'The list is given its filters and never renders them; the page change is wired to an empty function.', status: 'reported' },
  { area: 'Product · phone', what: 'The FEEDBACK tab covers the right edge of most phone pages (x 341–375, y 292–439) and takes any tap there.', why: 'It is fixed over the content; controls under it (the Agent Performance badge filter) cannot be tapped.', status: 'reported' },
  { area: 'Product', what: 'After a 3-D Secure payment for an ad licence, the product congratulates the user on “Credits Purchased”.', why: 'The 3-D Secure return drops ?ad_license=true (payment-process.js:32), which is what selects the ad-licence success modal.', status: 'reported — the in-page completion path shows the right modal and is what the flow compiles' },
  { area: 'Product', what: 'The area unit is written three ways: “Sq. M.” in the product’s copy, “sqm” (web) and “sq. m.” (phone) in the listing preview of the discount drawer.', why: 'The preview prints the unit the API sends; the copy writes its own.', status: 'reported — a design writes Sq. M. (design-lint fails anything else); the compiled pages show what the product prints' },
  { area: 'Skill', what: 'SKILL.md sent designs to start from kb/pages/_shell.html, whose markup fails the design lint (a 74px header, Lato, weight 900, 14 invented classes).', why: 'It was written before the pages were compiled from the product.', status: 'fixed — designs start from a compiled page, cut at div.pf-div' },
  { area: 'Product', what: 'At 375 the product is wider than the phone (about 433px).', why: 'The product\'s own layout; reproduced faithfully.', status: 'reported — listed below for a redesign' },
  { area: 'Product', what: '/user-settings/preferences crashes for any account without a photo.', why: 'common/transformers/user.js:35 reads profile_image.sizes.thumbnail with no guard.', status: 'reported — compiled on an image record whose sizes are empty, which renders the same' },
  { area: 'Harness', what: 'The member-area listings did not mount, and the credit-info drawer never opened.', why: 'The member area redirects to the classified site’s origin (it reloaded itself 63 times); the credit-info step clicked the promo banner’s button.', status: 'fixed — the classified origin is answered locally; the step clicks the Credits Balance info button' },
  { area: 'Product', what: 'In error states the product prints “Error! [object Object]” and “Cannot convert undefined or null to object”.', why: 'Its composite queries read e.error on allSettled results, which is never set, so a failure goes undetected; the mappers then throw on the missing data and the widget prints the thrown object.', status: 'reported — the error states show what the product prints' },
  { area: 'Responsive', what: 'ad-license with the city select open was 2.8% off: the form panel showed its content 42px higher than the product.', why: 'The copy put the panel back at its scroll before the web fonts arrived; they reflowed the text above it, and the browser’s scroll anchoring moved the panel to keep what it showed.', status: 'fixed — scroll offsets are put back again once the fonts are in; the state is now within the bar' },
];
report.findings = FINDINGS;
writeFileSync(join(ROOT, 'data', 'qa', 'design-qa.json'), JSON.stringify(report, null, 1));

/* ── the report page ─────────────────────────────────────────────────── */
const pct = (a, b) => (b ? `${((a / b) * 100).toFixed(1)}%` : '—');
const cell = (x, bar) => (x === null || x === undefined ? '<td class="qa-na">—</td>' : `<td class="${x <= bar ? 'qa-ok' : 'qa-off'}">${x}%</td>`);
const pageHref = (p) => p.file.replace(/^deliverables\//, '');
const bySlug = Object.keys(ALL).map((slug) => {
  const rows = pagesQA.filter((p) => p.name.replace(/--mobile$/, '').split('--')[0] === slug);
  const states = [...new Set(rows.map((p) => p.name.replace(/--mobile$/, '')))].sort((a, b) => (a === slug ? -1 : b === slug ? 1 : a.localeCompare(b)));
  return { slug, rows, states };
});
const liveRows = (v) => (v && v.rows ? v.rows.filter((r) => !r.fault).map((r) => `<tr><td>${esc(r.page)}</td><td>${r.coverage ?? '—'}%</td><td>${r.fidelity ?? '—'}%</td><td>${r.exact ?? '—'}%</td></tr>`).join('') : '');
const s = summary;
const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Design QA — Profolio KSA design system</title>
<link rel="stylesheet" href="ds.css">
</head>
<body class="ds ds-qa">
<nav class="ds-crumbs"><a href="design-system.html">Profolio KSA design system</a> <span>›</span> Design QA</nav>
<main class="ds-main">
<header class="ds-head">
  <p class="ds-kicker">Design QA · ${report.at.slice(0, 10)}</p>
  <h1>Is it the product?</h1>
  <p class="ds-lede">Every compiled page, state and component, held to the product three ways: its <b>pixels</b> against the product's own render, its <b>boxes</b> against the live product on two real accounts, and its <b>words and sources</b> against the product's code. ${s.files.web} web files at 1440 and ${s.files.responsive} responsive files at 375. Generated by <code>scripts/design-qa.mjs</code>; the numbers are in <code>data/qa/design-qa.json</code>.</p>
</header>

<section class="ds-section"><h2>Scoreboard</h2>
<table class="ds-scale">
<tr><th>check</th><th>web · 1440</th><th>responsive · 375</th><th>bar</th></tr>
<tr><td>Pages &amp; states within the pixel bar of the product's render</td><td>${s.pixel[0].ok} / ${s.pixel[0].n} (${pct(s.pixel[0].ok, s.pixel[0].n)})</td><td>${s.pixel[1].ok} / ${s.pixel[1].n} (${pct(s.pixel[1].ok, s.pixel[1].n)})</td><td>≤ ${PIXEL_BAR}% of pixels differ</td></tr>
<tr><td>…and again on its layout's stylesheet (profolio.css, profolio.mobile.css)</td><td colspan="2">${s.sheet.ok} / ${s.sheet.n} (${pct(s.sheet.ok, s.sheet.n)})</td><td>≤ ${PIXEL_BAR}%</td></tr>
<tr><td>Component variants identical to where they were cut from</td><td>${s.components.web.ok} / ${s.components.web.n} (${pct(s.components.web.ok, s.components.web.n)})</td><td>${s.components.responsive.ok} / ${s.components.responsive.n} (${pct(s.components.responsive.ok, s.components.responsive.n)})</td><td>≤ ${COMP_BAR}% of pixels differ</td></tr>
<tr><td>Every painted box against the product's own render (same data), ±1px</td><td>${s.live.harness ? `exact ${s.live.harness.exact}% · coverage ${s.live.harness.coverage}%` : 'not measured'}</td><td>${s.live.harnessMobile ? `exact ${s.live.harnessMobile.exact}% · coverage ${s.live.harnessMobile.coverage}%` : 'not measured'}</td><td>position, size and paint within 1px</td></tr>
<tr><td>Against the live product — the owner's account</td><td>${s.live.owner ? `coverage ${s.live.owner.coverage}% · exact ${s.live.owner.exact}%` : 'not measured'}</td><td>—</td><td rowspan="2">boxes ±1px; data differs by account</td></tr>
<tr><td>Against the live product — a staff account (as-staff)</td><td>${s.live.staff ? `coverage ${s.live.staff.coverage}% · exact ${s.live.staff.exact}%` : 'not measured'}</td><td>${s.live.staffMobile ? `coverage ${s.live.staffMobile.coverage}% · exact ${s.live.staffMobile.exact}%` : 'not measured'}</td></tr>
<tr><td>UI strings that are the product's copy or code</td><td colspan="2">${s.copy.copy + s.copy.code} of ${s.copy.strings - s.copy.data} interface strings (${pct(s.copy.copy + s.copy.code, s.copy.strings - s.copy.data)}); ${s.copy.data} more are fixture data — names, numbers, listings</td><td>every label from translation.json or the code</td></tr>
<tr><td>Source references (<code>data-pf-src</code>) that name a real file and line</td><td colspan="2">${s.source.refs - s.source.bad} of ${s.source.refs}</td><td>all</td></tr>
<tr><td>The prototype: links between files · files that link onward</td><td colspan="2">${s.prototype.links} links · ${s.prototype.filesWithLinks} of ${s.files.web + s.files.responsive} files · ${s.prototype.flows} flows in ${s.prototype.flowSteps} steps · ${s.prototype.nested} states reached from inside an overlay</td><td>every link lands on a file</td></tr>
<tr><td>Files rendering undefined / NaN / a raw placeholder</td><td colspan="2">${s.sanity.withBadText}</td><td>0</td></tr>
<tr><td>Broken images · font errors · state links to nowhere</td><td colspan="2">${s.sanity.brokenImages} · ${s.sanity.fontErrors} · ${s.sanity.deadLinks}</td><td>0 · 0 · 0</td></tr>
</table>
</section>

<section class="ds-section"><h2>What the QA found</h2>
<p class="ds-note">Each number below says how far something is from the product; this says why, for every cause the QA traced — and what became of it.</p>
<table class="ds-scale"><tr><th>area</th><th>found</th><th>cause</th><th>now</th></tr>
${FINDINGS.map((f) => `<tr><td>${esc(f.area)}</td><td>${esc(f.what)}</td><td>${esc(f.why)}</td><td class="${/^fixed/.test(f.status) ? 'qa-ok' : /^open/.test(f.status) ? 'qa-off' : 'qa-na'}">${esc(f.status)}</td></tr>`).join('\n')}
</table>
</section>

<section class="ds-section"><h2>Pixels — every page and state</h2>
<p class="ds-note">The compiled file against a screenshot of the product rendering the same page and state, full page or viewport as the state is shown. Green is within ${PIXEL_BAR}%.</p>
${bySlug.map((g) => `<h3>${esc(g.slug)} <small>${g.states.length} files per layout</small></h3>
<table class="ds-scale qa-table"><tr><th>page / state</th><th>web</th><th>responsive</th><th>notes</th></tr>
${g.states.map((st) => { const w = g.rows.find((p) => p.name === st), m = g.rows.find((p) => p.name === `${st}--mobile`); const notes = [...(w ? w.bad : []), ...(m ? m.bad : [])].slice(0, 2).map((b) => `renders “${b}”`).concat([...(w ? w.deadGo : []), ...(m ? m.deadGo : [])].slice(0, 2).map((d) => `link to missing ${d}`)); return `<tr><td>${w ? `<a href="${pageHref(w)}">${esc(st)}</a>` : esc(st)}${m ? ` · <a href="${pageHref(m)}">responsive</a>` : ''}</td>${w ? cell(w.pixel, PIXEL_BAR) : '<td class="qa-na">—</td>'}${m ? cell(m.pixel, PIXEL_BAR) : '<td class="qa-na">—</td>'}<td>${notes.map(esc).join('<br>')}</td></tr>`; }).join('\n')}
</table>`).join('\n')}
</section>

<section class="ds-section"><h2>Against the live product</h2>
<p class="ds-note">Every box that paints, matched to the live product's box by where it is and what it is (<code>scripts/qa-fidelity.mjs</code>). <b>Coverage</b>: of the live boxes, how many we draw at all. <b>Fidelity</b>: of ours, how many are built right relative to their parent. <b>Exact</b>: how many land within ±1px of the live box's absolute position, size and paint. A real account's data is not the fixture's — another row, a longer name — so exact is a floor, not a verdict.</p>
${[['The product’s own render, same data — web', live.harness], ['The product’s own render, same data — responsive', live.harnessMobile], ['The owner’s real account, web', live.owner], ['A staff user’s real account, web (as-staff)', live.staff], ['A staff user’s real account, responsive (as-staff)', live.staffMobile]].map(([t, v]) => `<h3>${t}${v ? ` <small>coverage ${v.coverage}% · fidelity ${v.fidelity}% · exact ${v.exact}%</small>` : ''}</h3>${v ? `<table class="ds-scale"><tr><th>page</th><th>coverage</th><th>fidelity</th><th>exact</th></tr>${liveRows(v)}</table>` : '<p class="ds-note">Not measured.</p>'}`).join('\n')}
</section>

<section class="ds-section"><h2>Against the code</h2>
<h3>Copy <small>${s.copy.strings} distinct interface strings</small></h3>
<p class="ds-note">${s.copy.copy} are in the product's <code>src/locales/en/translation.json</code>, ${s.copy.code} are written in its components, ${s.copy.data} are the fixture account's data. ${s.copy.unmatched} are none of these${s.copy.unmatched ? ' — listed below; each is a string the render produced that neither the copy nor the code spells out in one piece (a sentence assembled from parts, a label from the API)' : ''}.</p>
${report.unmatched.length ? `<table class="ds-scale"><tr><th>string</th><th>seen on</th></tr>${report.unmatched.slice(0, 60).map((u) => `<tr><td>${esc(u.s)}</td><td>${u.where.map(esc).join(', ')}</td></tr>`).join('')}</table>` : ''}
<h3>Sources <small>${s.source.refs} distinct file:line references</small></h3>
<p class="ds-note">Every element the product drew carries the file and line that drew it (<code>data-pf-src</code>, from React's own debug info). ${srcBad.length ? `${srcBad.length} do not resolve:` : 'All of them name a file that exists in the product and a line inside it.'}</p>
${srcBad.length ? `<ul>${srcBad.slice(0, 30).map((x) => `<li><code>${esc(x)}</code></li>`).join('')}</ul>` : ''}
</section>

<section class="ds-section"><h2>The responsive layout — the product's own findings</h2>
<p class="ds-note">Reproduced as the product draws them, and listed so a redesign starts from them. At a phone's 375px the product is wider than the phone on ${s.overflow.length} of ${s.files.responsive} files — the page scrolls sideways.</p>
${s.overflow.length ? `<table class="ds-scale"><tr><th>file</th><th>width at 375</th></tr>${s.overflow.map((o) => `<tr><td>${esc(o.name)}</td><td>${o.width}px</td></tr>`).join('')}</table>` : ''}
</section>
</main>
</body>
</html>
`;
writeFileSync(join(D, 'design-qa.html'), html);
console.log(`  pixels: web ${s.pixel[0].ok}/${s.pixel[0].n} · responsive ${s.pixel[1].ok}/${s.pixel[1].n} within ${PIXEL_BAR}%${s.unscored.length ? ` · ${s.unscored.length} unscored` : ''}`);
console.log(`  components: web ${s.components.web.ok}/${s.components.web.n} · responsive ${s.components.responsive.ok}/${s.components.responsive.n}`);
console.log(`  live: owner ${s.live.owner ? s.live.owner.coverage + '%' : '—'} · staff ${s.live.staff ? s.live.staff.coverage + '%' : '—'} · staff responsive ${s.live.staffMobile ? s.live.staffMobile.coverage + '%' : '—'} coverage`);
console.log(`  copy: ${s.copy.copy} copy · ${s.copy.code} code · ${s.copy.data} data · ${s.copy.unmatched} unmatched of ${s.copy.strings}`);
console.log(`  sources: ${s.source.refs - s.source.bad}/${s.source.refs} resolve · bad text in ${s.sanity.withBadText} files · ${s.sanity.brokenImages} broken images · ${s.sanity.deadLinks} dead links · ${s.sanity.fontErrors} font errors`);
console.log(`  responsive overflow: ${s.overflow.length} files wider than 375`);
console.log(`  prototype: ${s.prototype.links} links in ${s.prototype.filesWithLinks} files · ${s.prototype.flows} flows (${s.prototype.flowSteps} steps) · ${s.prototype.nested} nested states`);
console.log('  deliverables/design-qa.html · data/qa/design-qa.json');
