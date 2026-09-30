#!/usr/bin/env node
/**
 * The skill package — skill/ — cut out of the compiled design system.
 *
 * deliverables/ is the design system as a site: an index, a page per
 * component with everything known about it, every page and state compiled
 * from the product. skill/ is the same material cut for an agent that reads
 * one file at a time (skill/SKILL.md routes it):
 *
 *   registry.json                  every component and page, dense — read on every task
 *   tokens.md                      every token: value · provenance · what it controls
 *   atoms/ molecules/ organisms/   a file per component: its variants (web and 375),
 *                                  states, classes, tokens and source — nothing else
 *   pages/                         every page and state, web and 375, clickable
 *   css/                           the stylesheets, byte for byte
 *   product/                       flags, copy (English and Arabic; copy/rendered/: what each
 *                                  screen draws), roles, routes, KSA, usage, pages/ (labels)
 *
 * The levels are the catalogue's, with the placements approved for the
 * package (2026-09-29): the 144 icons are one atom; the three layout
 * templates and the sections of a single page are organisms; a route's own
 * container is not a component but its page's `source`; twelve borderline
 * components move (MOVE). A page-level component this does not know yet is
 * placed as an organism and named in the output, for review.
 *
 * `used_on` is DERIVED from one scan of the markers of every page and state
 * file, web and 375 (data-pf-i; antd by its root class): scripts/skill/usage.mjs.
 *
 * The hand-written parts — SKILL.md, qa/, examples/ — are never touched.
 *
 *   node scripts/package.mjs          (npm run package, after npm run ds)
 */
import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync, rmSync, copyFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ALL } from './pages-list.mjs';
import { execSync } from 'node:child_process';
import { makeContext, scanFile, emptyUsage, addFile, deriveUsage, registryFields, modStateNames, modsSection, usageMarkdown, checkUsage } from './skill/usage.mjs';
import { listPageFiles, loadTranslations, loadFixtureStrings, loadCodeStrings, buildRenderedCopy, copyAreaGates, copyMd } from './skill/rendered-copy.mjs';
import { buildLabels, fixtureData } from './skill/labels.mjs';
import { flagsFor, loadProduct } from './skill/flags.mjs';
import { routesFor, flowsFor, clockFor, productTexts, stateRolesFor } from './skill/pages-meta.mjs';
import { scopedTokens } from './skill/scoped-tokens.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const D = join(ROOT, 'deliverables');
const DS = join(ROOT, 'data', 'ds');
const SKILL = join(ROOT, 'skill');
const REFS = join(ROOT, '.build', 'references');
const read = (p) => readFileSync(p, 'utf8');
const json = (p, d = null) => (existsSync(p) ? JSON.parse(read(p)) : d);
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const write = (rel, body) => { const p = join(SKILL, rel); mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, body); };
const need = (p, how) => { if (!existsSync(p)) { console.error(`  missing ${p.slice(ROOT.length + 1)} — ${how}`); process.exit(2); } };
need(join(DS, 'catalogue.json'), 'run npm run ds');
need(join(ROOT, 'data', 'design-kb.json'), 'run npm run ds');
need(join(REFS, 'flags.md'), 'run npm run build');
/* the product's source, read-only, beside this repo: the flags, routes and translations are read from it */
const PRODUCT = process.argv.includes('--repo') ? process.argv[process.argv.indexOf('--repo') + 1] : join(ROOT, '..', process.env.PROFOLIO_REPO || 'profolio-reactjs');
need(join(PRODUCT, 'src/tenant/bayut/constants/constants.js'), 'pass --repo <path to profolio-reactjs>');

/* the derived parts are rebuilt from nothing every time */
for (const d of ['atoms', 'molecules', 'organisms', 'pages', 'css', 'product', 'kb', 'registry.json', 'tokens.md', 'qa/lib']) rmSync(join(SKILL, d), { recursive: true, force: true });

const catalogue = json(join(DS, 'catalogue.json'));
const inst = json(join(DS, 'instances.json'));
const specs = json(join(DS, 'specs.json'), {});
const tokens = json(join(DS, 'tokens.json'));
const kb = json(join(ROOT, 'data', 'design-kb.json'));
const byKey = new Map(inst.components.map((c) => [c.key, c]));

/* ── 1 · where each component goes ──────────────────────────────────── */
const DIR = { atom: 'atoms', molecule: 'molecules', organism: 'organisms' };
const TITLE = { atom: 'Atom', molecule: 'Molecule', organism: 'Organism' };
/* a route's own container: the page itself, not a component */
const FOLD = new Set([
  'Home@src/home.js', 'CreateAdLicense@src/container/pages/ad-license/index.js', 'AgencyStaffPage@src/container/pages/agancy-staff/agancy-staff.js',
  'AgentPerformance@src/container/pages/agent-performance/AgentPerformance.js', 'CreditsUsage@src/container/pages/credits-usage/credits-usage.js',
  'Listings@src/tenant/bayut/components/listing/listings.js', 'LeadsManagement@src/container/pages/lms/leads-management.js',
  'PostListingLandingPage@src/container/pages/post-listing/post-listing-landing.js', 'ListingPerformance@src/container/pages/reports/listing-performance.js',
  'UserSettings@src/container/pages/user-settings/user-settings.js', 'AgencySettingsPage@src/container/pages/user-settings/agancy-settings.js',
  'UserProfile@src/container/pages/user-settings/profile.js', 'Listings@src/container/pages/listings/listings.js', 'PropShop@src/container/pages/prop-shop/prop-shop.js',
  'PropShop@src/tenant/common/components/prop-shop/prop-shop.js', 'LeadsReports@src/container/pages/reports/leads-reports.js',
  'ListingReports@src/container/pages/reports/listing-reports.js', 'ReportsSummary@src/container/pages/reports/reports-summary.js',
  'UserPassword@src/container/pages/user-settings/password.js', 'Licenses@src/container/pages/user-settings/license.js',
  'AgencyStaffMobilePage@src/container/pages/agancy-staff/agency-staff-mobile.js',
  /* the routes compiled after the approval, by the same rule */
  'Checkout@src/container/pages/payment/checkout.js', 'Dashboard@src/container/pages/dashboard/dashboard.js', 'Maintenance@src/container/pages/Maintenance.js',
  'PostListing@src/container/pages/post-listing/post-listing.js', 'UpgradeListing@src/container/pages/post-listing/upgrade-listing.js',
  'UpgradeListingPage@src/tenant/bayut/components/upgrade-listing/upgrade-listing.js', 'PaymentProcess@src/container/pages/payment/payment-process.js',
  'InviteUserPage@src/container/pages/invite-user/invite-user.js',
]);
/* the approved moves of borderline placements */
const MOVE = {
  AgencyInfoCard: 'organism', MobileCardView: 'organism',
  TableActions: 'molecule', ProductTag: 'molecule', PlatformListingActions: 'molecule', PlatformActions: 'molecule', ListingDetailCompact: 'molecule',
  GenerateContentField: 'molecule', CardComponent: 'molecule', NotificationCard: 'molecule', SuccessModalContent: 'molecule', TitleDescriptionWithAnimation: 'molecule',
  /* page-sized only because it covers the page while it loads: a spinner */
  Spinner: 'atom',
};
const SECTION = new Set(['AgentBages', 'TeamPerformanceTable', 'LeadListingsTable', 'OfferedPackages', 'ListingPerformanceTable', 'HeaderComponent', 'PostListingMenuScrim',
  'Leaderboard', 'AgentActivity', 'AgentProfileCard', 'TruBroker', 'ListingStatsByDateTable', 'ListingBreakDownByDateTable',
  /* sections of the routes compiled after the approval */
  'PaymentMethods', 'AgentBagesInfo', 'AgentProfileCardSkeleton', 'TruBrokerSkeleton', 'LeaderboardSkeleton', 'TruPoints']);
const newcomers = [];
const idOf = (c) => `${c.name}@${c.def}`;
const icons = catalogue.filter((c) => c.group === 'Icons');
const folded = catalogue.filter((c) => c.level === 'page' && FOLD.has(idOf(c)));
const placed = catalogue.filter((c) => c.group !== 'Icons' && !(c.level === 'page' && FOLD.has(idOf(c)))).map((c) => {
  let level = MOVE[c.name] || c.level;
  if (level === 'template') level = 'organism';
  if (level === 'page') { level = 'organism'; if (!SECTION.has(c.name)) newcomers.push(`${c.name} (${c.def}) — page-level, placed as an organism`); }
  return { ...c, final: level };
});

/* ── 2 · classes ────────────────────────────────────────────────────── */
const CSS = read(join(D, 'profolio.css')), CSS_M = existsSync(join(D, 'profolio.mobile.css')) ? read(join(D, 'profolio.mobile.css')) : '';
const styled = new Set([...(CSS + CSS_M).matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)].map((m) => m[1]));
const sigClasses = (c) => {
  const i = byKey.get(c.key);
  return [...new Set((i ? i.variants : []).flatMap((v) => (v.variant.split('|')[1] || '').split('.').filter(Boolean)))];
};
const allComponents = [...placed, ...icons];
const classesOf = new Map(allComponents.map((c) => [c.key, sigClasses(c).filter((x) => styled.has(x))]));
/* a class carried by one component only identifies it */
const owners = new Map();
for (const c of allComponents) for (const x of classesOf.get(c.key)) (owners.get(x) || owners.set(x, new Set()).get(x)).add(c.key);
const ownClasses = (c) => classesOf.get(c.key).filter((x) => owners.get(x).size === 1);

/* ── 3 · pages: copied with their links re-pointed ──────────────────── */
const compiledFile = (p) => /<meta name="pf-compiled"/.test(read(p).slice(0, 6000));
const pageFiles = [];
for (const [dir, dev] of [['', 'web'], ['mobile', 'mobile']]) {
  const base = join(D, dir);
  for (const f of readdirSync(base).filter((f) => f.endsWith('.html'))) {
    const slug = f.replace(/\.html$/, '');
    if (ALL[slug] && compiledFile(join(base, f))) pageFiles.push({ src: join(base, f), dev, page: slug, state: null });
  }
  const sd = join(base, 'states');
  if (existsSync(sd)) for (const f of readdirSync(sd).filter((f) => f.endsWith('.html'))) {
    const m = f.match(/^([a-z0-9-]+?)--(.+)\.html$/);
    if (m && ALL[m[1]]) pageFiles.push({ src: join(sd, f), dev, page: m[1], state: m[2] });
  }
}
const outOf = ({ dev, page, state }) => `pages/${page}${state ? `/${state}` : ''}${dev === 'mobile' ? '.mobile' : ''}.html`;
const rewritePage = (html, { dev, page, state }) => {
  const up = state ? '../../' : '../';
  const mob = dev === 'mobile' ? '.mobile' : '';
  html = html.replace(/((?:href|src)=")(?:\.\.\/)*((?:profolio(?:\.mobile)?|fonts|tokens|ds)\.css|sprite\.svg)(#[^"]*)?"/g, (m, a, f, h) => `${a}${up}css/${f}${h || ''}"`);
  html = html.replace(/src="(?:\.\.\/)*prototype\.js"/g, `src="${state ? '../' : ''}prototype.js"`);
  /* this page's states: from the page (states/<page>--x.html), from a state (<page>--x.html) */
  html = html.replace(/(["'])(?:states\/)?([a-z0-9-]+?)--([^"'/]+?)\.html\1/g, (m, q, p, s) => (p === page ? `${q}${state ? '' : `${page}/`}${s}${mob}.html${q}` : m));
  /* and back to the page */
  if (state) html = html.replace(new RegExp(`(["'])\\.\\./${page}\\.html\\1`, 'g'), `$1../${page}${mob}.html$1`);
  return html;
};
/* where each component is drawn: one scan of every file's markers (scripts/skill/usage.mjs) */
const LEVEL = new Map([...placed.filter((c) => existsSync(join(D, 'components', `${c.slug}.html`))).map((c) => [c.slug, c.final]), ['icon', 'atom']]);
const UCTX = makeContext(catalogue, FOLD, LEVEL);
const USAGE = emptyUsage();
const pageClasses = new Map();                     /* page slug → every class its files use */
const pageStates = new Map();                      /* page slug → state → Set(devices) */
const CLASS_ATTR = / class="([^"]*)"/g;
for (const f of pageFiles) {
  const html = read(f.src);
  write(outOf(f), rewritePage(html, f));
  addFile(USAGE, { ...f, out: outOf(f) }, scanFile(html, UCTX));
  const set = pageClasses.get(f.page) || pageClasses.set(f.page, new Set()).get(f.page);
  for (const m of html.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '').matchAll(CLASS_ATTR)) for (const x of m[1].split(/\s+/)) if (x) set.add(x);
  if (f.state) { const s = pageStates.get(f.page) || pageStates.set(f.page, new Map()).get(f.page); (s.get(f.state) || s.set(f.state, new Set()).get(f.state)).add(f.dev); }
}
write('pages/prototype.js', read(join(DS, 'prototype.package.js')));

/* ── 4 · used_on: where each component's marker is ───────────────────── */
/* public: no account, no shell — appRoutes.js publicRoutes(). /invite is not
   one: an app() route, drawn in withAdminLayout(Home) for any signed-in
   account (src/router.js, the catch-all route → RenderIfLoggedIn → Home) */
const PUBLIC = new Set(['maintenance', 'process-payment', 'post-ad']);
const U = deriveUsage(USAGE, { publicPages: PUBLIC, ctx: UCTX });
const usedOn = (c) => U.usedOn.get(c.slug) || [];

/* ── 5 · tokens a component consumes: its measured values, by token name ── */
const TOKCSS = read(join(D, 'tokens.css'));
const VARS = [...TOKCSS.matchAll(/(--pf-[\w-]+)\s*:\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]);
const hex = (c) => {
  c = String(c || '').trim().toLowerCase();
  let m = c.match(/^#([0-9a-f]{3})$/); if (m) return '#' + [...m[1]].map((x) => x + x).join('');
  if (/^#[0-9a-f]{6,8}$/.test(c)) return c.length === 9 && c.endsWith('ff') ? c.slice(0, 7) : c;
  m = c.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,/]+([\d.]+))?\s*\)$/);
  if (!m) return c;
  const h = (x) => Math.round(+x).toString(16).padStart(2, '0');
  const a = m[4] === undefined || +m[4] === 1 ? '' : h(+m[4] * 255);
  return `#${h(m[1])}${h(m[2])}${h(m[3])}${a}`;
};
const colourVars = new Map(), lengthVars = new Map();
for (const [n, v] of VARS) {
  if (/^#|^rgb/i.test(v)) (colourVars.get(hex(v)) || colourVars.set(hex(v), []).get(hex(v))).push(n);
  else if (/^\d+px$/.test(v)) (lengthVars.get(`${n.includes('radius') ? 'radius' : n.includes('font-size') ? 'font' : 'other'}|${v}`) || lengthVars.set(`${n.includes('radius') ? 'radius' : n.includes('font-size') ? 'font' : 'other'}|${v}`, []).get(`${n.includes('radius') ? 'radius' : n.includes('font-size') ? 'font' : 'other'}|${v}`)).push(n);
}
const tokensOf = (c) => {
  const out = new Set();
  for (const s of Object.values(specs)) {
    if (s.component !== c.slug) continue;
    const sp = s.spec || {};
    /* one name per value: tokens.css lists the theme's names before antd's */
    const first = (list) => { if (list && list.length) out.add(list[0]); };
    for (const col of [sp.fill, sp.borderColor, sp.type && sp.type.colour, sp.icon && sp.icon.colour]) if (col) first(colourVars.get(hex(col)));
    if (sp.radius && sp.radius[0]) first(lengthVars.get(`radius|${Math.round(sp.radius[0])}px`));
    if (sp.type && sp.type.size) first(lengthVars.get(`font|${parseFloat(sp.type.size)}px`));
  }
  return [...out].sort();
};

/* ── 6 · component files ────────────────────────────────────────────── */
const FINAL = new Map(placed.map((c) => [c.slug, c]));
const ICONS = new Set(icons.map((c) => c.slug));
const variantsOf = (c) => {
  const i = byKey.get(c.key);
  const own = new Set(ownClasses(c));
  return [...new Set((i ? i.variants : []).map((v) => {
    const mods = (v.variant.split('|')[1] || '').split('.').filter((x) => x && !own.has(x)).map((x) => x.replace(/^pf-/, ''));
    return `${v.device === 'mobile' ? '375 · ' : ''}${mods.slice(0, 4).join(' · ') || 'default'}`;
  }))].slice(0, 16);
};
const statesIn = (html) => {
  const sec = (html.match(/<section class="ds-section" id="states">([\s\S]*?)<\/section>/) || [])[1];
  const out = ['default'];
  if (sec) {
    const cols = [...(sec.match(/<tr><th><\/th>([\s\S]*?)<\/tr>/) || ['', ''])[1].matchAll(/<th>([^<]+)<\/th>/g)].map((m) => m[1]);
    const rows = [...sec.matchAll(/<tr><th[^>]*>[\s\S]*?<\/tr>/g)].map((m) => [...m[0].matchAll(/ds-how--(\w+)/g)].map((x) => x[1]));
    cols.forEach((col, i) => { if (col !== 'default' && rows.some((r) => r[i] && r[i] !== 'none')) out.push(col); });
  } else if (/<h2>Interaction states<\/h2>/.test(html)) out.push('hover', 'focus', 'active');
  return [...new Set(out)];
};
const pageHref = (m, mob, p, s) => (ALL[p] ? `href="../pages/${p}${s ? `/${s}` : ''}${mob ? '.mobile' : ''}.html"` : m);
const transformComponent = (html, c, meta) => {
  const lvl = c.final;
  html = html.replace('<meta charset="utf-8">', `<meta charset="utf-8">\n<meta name="pf-component" content="${c.slug}">`)
    .replace('href="../profolio.css"', 'href="../css/profolio.css"').replace('href="states.css"', 'href="../css/states.css"').replace('href="../ds.css"', 'href="../css/ds.css"')
    .replaceAll('../profolio.mobile.css', '../css/profolio.mobile.css').replaceAll('../fonts.css', '../css/fonts.css')
    .replace(/<nav class="ds-crumbs">[\s\S]*?<\/nav>/, `<nav class="ds-crumbs">Profolio KSA <span>›</span> ${DIR[lvl]} <span>›</span> ${esc(c.name)}</nav>`)
    .replace(/<p class="ds-kicker">(Atom|Molecule|Organism|Template|Page)\b/, `<p class="ds-kicker">${TITLE[lvl]}`)
    .replace(/\n<section class="ds-section">\n<h2>(?:Used inside|In the knowledge base|Where it appears)<\/h2>[\s\S]*?\n<\/section>/g, '')
    .replace(/href="\.\.\/(mobile\/)?(?:states\/)?([a-z0-9-]+?)(?:--([^"]+?))?\.html"/g, pageHref)
    .replace(/<a href="([a-z0-9-]+)\.html">([^<]*)<\/a>/g, (m, s, t) => (FINAL.has(s) ? `<a href="../${DIR[FINAL.get(s).final]}/${s}.html">${t}</a>` : ICONS.has(s) ? `<a href="../atoms/icon.html#${s}">${t}</a>` : t));
  const summary = `
<section class="ds-section" id="classes">
<h2>Classes, tokens, source</h2>
<p class="ds-note">What this component is made of in the stylesheet, and the named values it paints with — its full entry is <code>components["${c.slug}"]</code> in <code>registry.json</code>.</p>
<h3>Classes <small>${meta.classes.length}</small></h3>
<ul class="ds-chips">${meta.classes.map((x) => `<li><code>.${esc(x)}</code></li>`).join('') || '<li>none styled</li>'}</ul>
<h3>Tokens <small>${meta.tokens.length}</small></h3>
<ul class="ds-chips">${meta.tokens.map((x) => `<li><code>${esc(x)}</code></li>`).join('') || '<li>no named token — its values are literals (tokens.md lists them)</li>'}</ul>
<h3>Source</h3>
<p class="ds-note"><code>${esc(meta.source)}</code> · used on ${meta.used_on.length} page${meta.used_on.length === 1 ? '' : 's'}</p>
</section>`;
  return html.replace('</header>', `</header>\n${summary}`);
};
const components = {};
for (const c of placed) {
  const src = join(D, 'components', `${c.slug}.html`);
  if (!existsSync(src)) continue;
  const meta = { classes: classesOf.get(c.key), tokens: tokensOf(c), used_on: usedOn(c), source: c.family === 'base' ? `antd ${c.name}, themed by the product` : c.def };
  let html = transformComponent(read(src), c, meta);
  { const at = html.lastIndexOf('</main>'); html = html.slice(0, at) + modsSection(U, c.slug, esc) + '\n' + html.slice(at); }
  const file = `${DIR[c.final]}/${c.slug}.html`;
  write(file, html);
  components[c.slug] = { level: c.final, file, classes: meta.classes, variants: variantsOf(c), states: [...new Set([...statesIn(html), ...modStateNames(U, c.slug)])], tokens: meta.tokens, ...registryFields(U, c.slug), source: meta.source, layouts: [c.web ? 'web' : null, c.mobile ? '375' : null].filter(Boolean) };
}
/* the icons: one atom */
{
  const tiles = icons.map((c) => {
    const i = byKey.get(c.key); const v = i && i.variants[0];
    return `<figure class="ds-icon" id="${c.slug}"><div class="ds-icon-art">${v ? v.html : ''}</div><figcaption><b>${esc(c.name)}</b><code>${esc(c.def)}</code></figcaption></figure>`;
  }).join('\n');
  const cls = [...new Set(icons.flatMap((c) => classesOf.get(c.key)))];
  const used = U.usedOn.get('icon') || [];
  write('atoms/icon.html', `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="pf-component" content="icon">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Icon — Profolio KSA</title>
<link rel="stylesheet" href="../css/profolio.css">
<link rel="stylesheet" href="../css/ds.css">
<style>.ds-icons{display:grid;grid-template-columns:repeat(auto-fill,minmax(168px,1fr));gap:10px}.ds-icon{margin:0;padding:14px;border:1px solid var(--ds-line);border-radius:10px}.ds-icon-art{display:flex;align-items:center;justify-content:center;height:48px;margin-bottom:10px;color:var(--ds-ink);font-size:24px}.ds-icon b{display:block;font-size:12px}.ds-icon code{display:block;color:var(--ds-ink-3);font-size:10.5px;overflow-wrap:anywhere}</style>
</head>
<body class="ds">
<nav class="ds-crumbs">Profolio KSA <span>›</span> atoms <span>›</span> Icon</nav>
<main class="ds-main">
<header class="ds-head"><p class="ds-kicker">Atom · the product's icons</p><h1>Icon</h1>
<p class="ds-lede">Every icon the product draws — ${icons.length}, each an inline SVG component from the product's own icon files, shown as the pages draw it. Use one by its name; never draw a glyph. The same glyphs are in <code>css/sprite.svg</code>.</p></header>
<section class="ds-section" id="classes"><h2>Classes, source</h2><ul class="ds-chips">${cls.map((x) => `<li><code>.${esc(x)}</code></li>`).join('')}</ul>
<p class="ds-note">${[...new Set(icons.map((c) => c.def))].map((d) => `<code>${esc(d)}</code>`).join(' · ')} · used on ${used.length} pages</p></section>
<section class="ds-section" id="variants"><h2>Icons <small>${icons.length}</small></h2><div class="ds-icons">
${tiles}
</div></section>
</main>
</body>
</html>
`);
  components.icon = { level: 'atom', file: 'atoms/icon.html', classes: cls, variants: icons.map((c) => c.name), states: ['default'], tokens: [], ...registryFields(U, 'icon'), source: [...new Set(icons.map((c) => c.def))].join(' · '), layouts: ['web', '375'] };
}

/* ── 7 · css ────────────────────────────────────────────────────────── */
for (const f of ['profolio.css', 'profolio.mobile.css', 'tokens.css', 'fonts.css', 'ds.css', 'sprite.svg']) if (existsSync(join(D, f))) { mkdirSync(join(SKILL, 'css'), { recursive: true }); copyFileSync(join(D, f), join(SKILL, 'css', f)); }
copyFileSync(join(D, 'components', 'states.css'), join(SKILL, 'css', 'states.css'));

/* ── 8 · registry: pages ────────────────────────────────────────────── */
const ALIASES = {
  dashboard: ['overview', 'home', 'main screen', 'dashboard'],
  listings: ['my listings', 'listings', 'properties', 'ads', 'listing management'],
  'credits-usage': ['credits usage', 'credit history', 'credit spend'],
  'ad-license': ['get a new ad license', 'ad licence request', 'REGA ad license', 'advertising licence'],
  'lms-leads': ['truleads', 'leads', 'CRM', 'lead management'],
  'reports-summary': ['reports', 'summary report', 'reports summary'],
  'reports-listing-report': ['listing report', 'listing performance report'],
  'reports-leads-reports': ['leads report', 'leads by channel'],
  'user-settings-user-profile': ['user settings', 'my profile', 'profile', 'account settings'],
  'user-settings-agency-profile': ['agency settings', 'agency profile', 'company profile'],
  'user-settings-change-password': ['change password', 'password'],
  'agency-staff': ['agency staff', 'team', 'users', 'staff management'],
  'agent-performance': ['agent performance', 'trubroker', 'trupoints', 'badges', 'leaderboard'],
  packages: ['credits & packages', 'packages', 'buy credits', 'top up', 'plans'],
  'post-listing': ['post a listing', 'new listing', 'create a listing', 'add a property'],
  'user-settings-licenses': ['licenses', 'FAL licence', 'brokerage licence'],
  'post-listing-edit': ['listing form', 'edit listing', 'listing details', 'draft listing'],
  'post-listing-upgrade': ['upgrade listing', 'hot listing', 'signature listing', 'choose listing type'],
  'post-ad': ['magic post ad', 'post ad link', 'public listing form'],
  checkout: ['checkout', 'payment', 'pay', 'order summary'],
  'process-payment': ['payment processing', 'payment return'],
  invite: ['agency invitation', 'invite', 'join an agency'],
  maintenance: ['maintenance page', 'under maintenance', 'downtime'],
  'user-settings-preferences': ['preferences', 'notification settings', 'smart credit utilization'],
};
/* the flags (scripts/skill/flags.mjs): per page, every true/false key read by a file compiled
   into any of its files, the shell's files aside (shell.flags); and product/flags.md */
const FLAGS = flagsFor({ product: loadProduct(PRODUCT), catalogue, components, pageFiles, routes: ALL, publicPages: PUBLIC });
/* the product's route patterns (appRoutes.js); the URL the recorder visited stays as fixture_url */
const RT = routesFor(ROOT, ALL, FLAGS.sha);
for (const n of RT.notes) console.log(`  routes: ${n}`);
const pages = {};
/* the shell: what the layout draws around the content on (nearly) every
   signed-in page — the header, the rail, their menus; never in a route's own
   content, never where the layout is not (usage.mjs). Listed once, not on
   every page. */
const SHELL = U.shell;
const levelLists = (slug) => U.lists.get(slug) || { organisms: [], molecules: [], atoms: [] };
const unowned = new Map();                            /* class → pages, for classes no component styles */
const componentClass = new Set(Object.values(components).flatMap((c) => c.classes));
for (const [slug, set] of pageClasses) for (const x of set) if (!componentClass.has(x)) (unowned.get(x) || unowned.set(x, new Set()).get(x)).add(slug);
for (const slug of Object.keys(ALL)) {
  if (!existsSync(join(SKILL, 'pages', `${slug}.html`))) continue;
  const screen = kb.screens.find((s) => s.slug === slug) || {};
  const st = pageStates.get(slug) || new Map();
  const states = [...st.entries()].map(([name, devs]) => (devs.has('web') && devs.has('mobile') ? name : devs.has('web') ? `${name}@web` : `${name}@375`)).sort();
  const sources = [...(U.sources.get(slug) || [])].sort();
  const roles = PUBLIC.has(slug) ? ['public'] : ['owner', ...(st.has('as-staff') ? ['staff'] : []), ...(st.has('as-individual') ? ['individual'] : [])];
  pages[slug] = {
    route: RT.routes[slug].route, ...(RT.routes[slug].fixture_url ? { fixture_url: RT.routes[slug].fixture_url } : {}), file: `pages/${slug}.html`, ...(existsSync(join(SKILL, 'pages', `${slug}.mobile.html`)) ? { mobile: `pages/${slug}.mobile.html` } : {}),
    title: screen.title || slug, aliases: ALIASES[slug] || [], ...levelLists(slug), flags: FLAGS.pageFlags[slug] || [], roles, states,
    source: [...new Set(sources)], own: [...unowned.entries()].filter(([, ps]) => ps.size === 1 && ps.has(slug)).map(([x]) => x).sort(),
  };
}
/* the states compiled for another account than their name says (pages-meta compiledFor): { state: account } */
for (const [slug, sr] of Object.entries(stateRolesFor(pages, kb))) if (pages[slug]) pages[slug].state_roles = sr;
/* ── 8b · what each page shows, what each component is made of — read from
      the compiled DOM (scripts/skill/labels.mjs): pages[x].labels,
      components[x].anatomy, product/pages/<page>.md ─────────────────── */
{
  const copyEn = new Set();
  for (const f of readdirSync(join(REFS, 'copy')).filter((f) => f.endsWith('.md')))
    for (const m of read(join(REFS, 'copy', f)).matchAll(/^\| (.+?) \| .* \|$/gm)) if (!/^(English|---)/.test(m[1])) copyEn.add(m[1].trim());
  const FX = join(ROOT, 'harness');
  const fixtures = fixtureData([join(FX, 'fixtures.mjs'), ...(existsSync(join(FX, 'fixtures')) ? readdirSync(join(FX, 'fixtures')).filter((f) => /\.(mjs|json)$/.test(f)).map((f) => join(FX, 'fixtures', f)) : [])].filter(existsSync).map(read));
  /* every translation the product has, not only those the build saw called by name */
  for (const e of loadTranslations({ repo: PRODUCT, copyDir: join(REFS, 'copy') }).exact.keys()) copyEn.add(e);
  const shown = buildLabels({ pages: ALL, routes: RT.routes, components, catalogue, read: (rel) => read(join(D, rel)), exists: (rel) => existsSync(join(D, rel)), copy: copyEn, data: fixtures });
  if (shown.clashes && shown.clashes.length) console.log(`  anatomy — ${shown.clashes.length} group(s) of different components read the same`);
  for (const [s, l] of Object.entries(shown.labels)) if (pages[s]) pages[s].labels = l;
  for (const [s, a] of Object.entries(shown.anatomy)) if (components[s]) components[s].anatomy = a;
  for (const [s, m] of Object.entries(shown.md)) write(`product/pages/${s}.md`, m);
  console.log(`  labels — ${Object.keys(shown.labels).length} pages, ${shown.bytes.labels} B · anatomy — ${Object.keys(shown.anatomy).length} components, ${shown.bytes.anatomy} B · product/pages/ ${Object.keys(shown.md).length} files`);
}
const utilities = [...unowned.entries()].filter(([, ps]) => ps.size > 1).map(([x]) => x).sort();
/* each step {id, heading, primary, toast?, base?}, read from its compiled file; the clock from the captures */
const flows = flowsFor(kb.flows, pageFiles);
const CLOCK = clockFor(ROOT, pageFiles);
/* every file under css/, and the prototype script — re-listed once the new theme adds css/new-theme/ */
function assetsOf() {
  const walk = (d) => readdirSync(join(SKILL, d), { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(`${d}/${e.name}`) : e.name.startsWith('.') ? [] : [`${d}/${e.name}`]));
  return [...walk('css'), 'pages/prototype.js'].sort();
}
/* the .skill packs every compiled page and component in screens.tar.xz (scripts/skill-file.mjs); qa/fetch.py unpacks them */
const SOURCE = { archive: 'screens.tar.xz', assets: assetsOf() };
const registry = {
  built: new Date().toISOString().slice(0, 10), product: FLAGS.sha, clock: CLOCK.registry,
  counts: { atoms: Object.values(components).filter((c) => c.level === 'atom').length, molecules: Object.values(components).filter((c) => c.level === 'molecule').length, organisms: Object.values(components).filter((c) => c.level === 'organism').length, icons: icons.length, pages: Object.keys(pages).length, states: Object.values(pages).reduce((n, p) => n + p.states.length, 0) },
  shell: { components: [...SHELL].sort(), flags: FLAGS.shellFlags },
  components, pages, flows, utilities,
  /* antd writes these elements' position inline at runtime; qa/validate.py check 1 lets a design re-measure them (left, width, height, transform, in px or %) */
  runtime_geometry: ['.pf-tabs-ink-bar', '.pf-tabs-nav-list'],
  /* where the .skill fetches what it lacks: the public repo, at the branch this was built on
     (SKILL_REF=main for a release). raw + a package path is the file's GitHub link; assets are
     the shared files every page links (css/, the prototype script) — qa/fetch.py --css */
  source: SOURCE,
};
/* the registry's promises about usage (#4, #21) — qa/validate.py check 7 says the same */
{ const bad = checkUsage(registry); if (bad.length) { console.error(`  usage check — ${bad.length} failure(s):\n    ${bad.slice(0, 20).join('\n    ')}`); process.exit(1); } }
writeFileSync(join(SKILL, 'registry.json'), JSON.stringify(registry));

/* ── 9 · product/ ───────────────────────────────────────────────────── */
mkdirSync(join(SKILL, 'product', 'copy'), { recursive: true });
write('product/flags.md', FLAGS.md);
write('product/usage.md', usageMarkdown(U));
const areas = readdirSync(join(REFS, 'copy')).filter((f) => f.endsWith('.md')).sort();
for (const f of areas) copyFileSync(join(REFS, 'copy', f), join(SKILL, 'product', 'copy', f));
const copyCount = (f) => (read(join(REFS, 'copy', f)).match(/^\| (?!English|---)/gm) || []).length;
const row = (cells) => `| ${cells.join(' | ')} |`;
const TEXTS = productTexts({ root: ROOT, pages, PUBLIC, flows, R: RT, pageFiles, kb, clock: CLOCK.full });
write('product/routes.md', TEXTS.routes);
write('product/roles.md', TEXTS.roles);
/* the KSA rules (authoring/ksa.html), as markdown */
{
  const src = join(ROOT, 'authoring', 'ksa.html');
  if (existsSync(src)) {
    let h = read(src).replace(/[\s\S]*?<body[^>]*>/i, '').replace(/<\/body>[\s\S]*/i, '');
    h = h.replace(/<(script|style|nav)\b[\s\S]*?<\/\1>/gi, '')
      .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, '\n# $1\n').replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, '\n## $1\n').replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, '\n### $1\n')
      .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '- $1\n').replace(/<\/?(ul|ol)[^>]*>/gi, '\n')
      .replace(/<tr[^>]*>([\s\S]*?)<\/tr>/gi, (m, r) => `| ${[...r.matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi)].map((x) => x[1].trim()).join(' | ')} |\n`)
      .replace(/<\/?(table|thead|tbody)[^>]*>/gi, '\n')
      .replace(/<code>([\s\S]*?)<\/code>/gi, '`$1`').replace(/<(strong|b)>([\s\S]*?)<\/\1>/gi, '**$2**').replace(/<(em|i)>([\s\S]*?)<\/\1>/gi, '*$2*')
      .replace(/<a [^>]*>([\s\S]*?)<\/a>/gi, '$1').replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '\n$1\n').replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&rsquo;/g, '’')
      .replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
    /* a table's header needs its --- row */
    h = h.replace(/^(\|[^\n]+\|)\n(?!\|\s*---)(?=\|)/gm, (m, head) => `${head}\n${head.replace(/[^|]+/g, ' --- ')}\n`);
    write('product/ksa.md', `${h}\n`);
  }
}

/* ── 10 · tokens.md ─────────────────────────────────────────────────── */
const PAINTED = json(join(DS, 'painted.json'), { colours: [] });
const paintedCol = new Map();
for (const c of PAINTED.colours) { const k = hex(c.value); const e = paintedCol.get(k) || paintedCol.set(k, { uses: 0, roles: new Map(), who: new Map() }).get(k); e.uses += c.uses; for (const [r, n] of c.roles) e.roles.set(r, (e.roles.get(r) || 0) + n); for (const [w, n] of c.who) e.who.set(w, (e.who.get(w) || 0) + n); }
const ROLE = { ink: 'text', ground: 'fill', edge: 'border' };
const who = (x) => x.replace(/^pf-/, '').replace(/--\w+$/, '').replace(/-styled$/, '').replace(/^btn$/, 'button').replace(/-/g, ' ');
const controls = (k) => {
  const e = paintedCol.get(k);
  if (!e) return '';
  return `${[...e.roles.entries()].sort((a, b) => b[1] - a[1]).map(([r, n]) => `${ROLE[r] || r} ${n}`).join(' · ')} — ${[...new Set([...e.who.entries()].sort((a, b) => b[1] - a[1]).map(([w]) => who(w)))].slice(0, 4).join(', ')}`;
};
const namedFor = new Map(tokens.colours.map((c) => [hex(c.value), c.names]));
const lines = [];
const T = (token, value, tag, what) => lines.push(`| \`${token}\` | \`${value}\` | ${tag} | ${String(what).replace(/\|/g, '/')} |`);
/* a global token a component resets inside itself (.styleProfolio.pf-btn { --pf-control-height: 36px }) gets its own row, under the token's */
const SCOPED = scopedTokens({ 'profolio.css': read(join(D, 'profolio.css')), 'profolio.mobile.css': read(join(D, 'profolio.mobile.css')) }, new Map(VARS));
for (const [n, v] of VARS) {
  const k = hex(v), names = namedFor.get(k) || [];
  const src = /^--pf-color-/.test(n) || /^--pf-(border-radius|font-size|control-height|padding|margin|motion-ease|font-family|box-shadow)/.test(n) ? 'antd' : 'theme';
  let what = /^#|^rgb/i.test(v) ? controls(k) || 'declared; not painted on the compiled pages' : '';
  if (/border-radius/.test(n)) { const cor = (tokens.corners || []).find((c) => c.value === v); what = cor ? `corner radius — ${cor.uses} uses: ${cor.who.map(who).slice(0, 3).join(', ')}` : 'corner radius'; }
  else if (/font-size/.test(n)) { const s = (tokens.typeScale || []).find((t) => `${t.size}px` === v); what = s ? `text size — ${s.uses} uses, weights ${s.weights.map(([w]) => w).join('/')}${s.lh ? `, line height ${s.lh}px` : ''}` : 'text size'; }
  else if (/control-height/.test(n)) what = '';                /* SCOPED.wording writes it, from the stylesheets */
  else if (/padding|margin/.test(n)) what = `antd spacing step (${n.replace('--pf-', '')})`;
  else if (/motion-ease/.test(n)) what = 'easing curve';
  else if (/font-family/.test(n)) what = 'every text: Figtree, then Droid Arabic Kufi for Arabic';
  else if (/box-shadow/.test(n)) what = 'elevation';
  T(n, v, `[src] ${src}${names.length ? ` ${names.map((x) => x.name).slice(0, 2).join(', ')}` : ''}`, SCOPED.wording(n, what));
  lines.push(...SCOPED.rowsFor(n));
}
for (const s of tokens.typeScale || []) T(`type-${s.size}`, `${s.size}px / ${s.lh ? `${s.lh}px` : 'normal'} · ${s.weights.map(([w]) => w).join('/')}`, '[px]', `text drawn at ${s.size}px — ${s.uses} uses${s.tokens.length ? ` (${s.tokens.join(', ')})` : ''}; e.g. ${s.sample}`);
for (const c of tokens.corners || []) T(`radius-${c.value.replace('%', 'pct')}`, c.value === 'pill' ? '999px' : c.value === 'circle' ? '50%' : c.value, c.tokens.length ? `[src] antd ${c.tokens.join(', ')}` : '[px]', `corners — ${c.uses} uses: ${c.who.map(who).slice(0, 3).join(', ')}`);
for (const [v, n] of tokens.spacing || []) T(`space-${v}`, `${v}px`, '[px]', `padding, margin or gap — ${n} rules`);
for (const [v, n] of (tokens.shadows || []).slice(0, 20)) T(`shadow-${lines.length}`, v, '[px]', `box-shadow — ${n} rules`);
for (const [v, n] of tokens.zIndex || []) T(`z-${v}`, v, '[px]', `stacking — ${n} rules`);
for (const [v, n] of (tokens.breakpoints || []).slice(0, 20)) T(`bp-${(v.match(/\d+/) || ['x'])[0]}`, v.replace(/^@media\s*/, ''), '[px]', `media query — ${n} rules`);
/* the colours the product paints that neither its theme nor antd names */
const unnamed = tokens.colours.filter((c) => !c.names.length).sort((a, b) => b.count - a.count);
for (const c of unnamed) T(hex(c.value), c.value, '[px] unnamed', controls(hex(c.value)) || `${c.count} rules: ${c.use}`);
write('tokens.md', `# Tokens

token · value · provenance · what it controls. [src] named in the product's theme (src/theme/index.js) or antd's resolved tokens; [px] measured from the compiled pages; [TBC] not sourced. A row \`--x\` inside \`.y\` is a component's own reset of a global token: it wins inside that component; its source is the selector to grep in css/. css/tokens.css holds the [src] ones as custom properties.

| token | value | tag | controls |
|---|---|---|---|
${lines.join('\n')}
`);

/* ── 11 · the new theme: My Listings, Profolio 2.0 ─────────────────── */
/* compiled from the designer's handover by scripts/theme/ (not yet the
   product). Its pages sit where every page does — pages/listings-new.html,
   pages/listings-new/<state>.html — so a design copied from one keeps its
   links; its fonts and tokens are css/new-theme/. */
const NT = join(D, 'new-theme');
const themeStates = json(join(ROOT, 'data', 'theme', 'states.json'), null);
const themeF = json(join(ROOT, 'data', 'theme', 'foundations.json'), null);
if (existsSync(join(NT, 'listings.html')) && themeStates && themeF) {
  mkdirSync(join(SKILL, 'css', 'new-theme'), { recursive: true });
  for (const f of ['tokens.css', 'fonts.css', 'tokens.resolved.json']) copyFileSync(join(NT, f), join(SKILL, 'css', 'new-theme', f));
  const ntClasses = new Set();
  const place = (src, out) => {
    const depth = out.split('/').length - 1;                  /* pages/x.html → 1, pages/x/y.html → 2 */
    let h = read(join(NT, src)).replace(/<link rel="stylesheet" href="[^"]*fonts\.css">/, `<link rel="stylesheet" href="${'../'.repeat(depth)}css/new-theme/fonts.css">\n<link rel="stylesheet" href="${'../'.repeat(depth)}css/new-theme/tokens.css">`);
    for (const m of h.replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, '').matchAll(/\sclass="([^"]*)"/g)) for (const x of m[1].split(/\s+/)) if (x) ntClasses.add(x);
    write(out, h);
  };
  const states = [];
  const notes = { web: {}, mobile: {} };
  const derivedStates = {};
  for (const [key, e] of Object.entries(themeStates)) {
    if (!e.file) continue;
    const [device, name] = key.split(':');
    const mob = device === 'mobile';
    const src = e.file.replace(/^deliverables\/new-theme\//, '');
    place(src, name === 'page' ? `pages/listings-new${mob ? '.mobile' : ''}.html` : `pages/listings-new/${name}${mob ? '.mobile' : ''}.html`);
    notes[device][name] = e.note;
    if (e.derived) (derivedStates[device] || (derivedStates[device] = [])).push(name);
    if (name !== 'page') states.push([name, device]);
  }
  const byName = new Map();
  for (const [n, d] of states) (byName.get(n) || byName.set(n, new Set()).get(n)).add(d);
  const same = Object.entries(themeStates).filter(([, e]) => e.same).map(([k, e]) => `${k.replace(':', ' ')} = ${e.same.replace(':', ' ')}`);
  registry.pages['listings-new'] = {
    route: '/listings', theme: 'new', status: 'design — Profolio 2.0, not yet live; compiled from the designer\'s handover (Draft 3, 15 Sep 2026)',
    file: 'pages/listings-new.html', mobile: 'pages/listings-new.mobile.html', frame: { web: '1440x900', mobile: '360x800' },
    title: 'My Listings — new theme', aliases: ['new my listings', 'my listings 2.0', 'profolio 2.0', 'listing performance drawer', 'quality score', 'listing rank'],
    tokens: 'tokens.md → My Listings — new theme · css/new-theme/tokens.css (--pf-ml-*)', fonts: 'css/new-theme/fonts.css',
    spec: ['product/listings-new/README.md', 'product/listings-new/web-spec.md', 'product/listings-new/phone-spec.md'],
    roles: ['owner'], flags: [],
    states: [...byName.entries()].map(([n, ds]) => (ds.size === 2 ? n : ds.has('web') ? `${n}@web` : `${n}@360`)).sort(),
    notes: { web: notes.web, phone: notes.mobile }, own: [...ntClasses].sort(),
    derived: { web: derivedStates.web || [], phone: derivedStates.mobile || [], why: 'drawn by neither build; composed from the build\'s own data (product/listings-new/README.md → Derived)' },
  };
  registry.pages.listings.themes = { current: 'listings', new: 'listings-new' };
  registry.themes = {
    current: { scope: 'every page', tokens: 'tokens.md (the first table) · css/tokens.css', typefaces: ['Figtree', 'Droid Arabic Kufi'] },
    new: { scope: ['listings'], page: 'listings-new', status: 'not yet live — due about mid-October 2026', tokens: 'tokens.md → My Listings — new theme · css/new-theme/tokens.css', typefaces: ['Geist (UI, My Listings only)', 'Figtree (titles, chrome)'], teal: 'the rank and Quality Score explainers; also the TruCheck glyph, the trend\'s selected metric pill and the tour\'s hero gradient', shell: 'the product shell is kept (the designer, 2026-09-29): every screen draws the product\'s own header, and the web screens its rail', tokens_follow: 'the build (the designer, 2026-09-29)', riyal: 'the build\'s glyph, svg[data-pf-riyal] — copy it from a listings-new file, height max(7px, 0.6 × the amount\'s font-size), width × 11/12, fill currentColor; never SAR, never the icon-font class (the designer, 2026-09-29)', same },
  };
  registry.counts.pages = Object.keys(registry.pages).length;
  registry.counts.states = Object.values(registry.pages).reduce((n, p) => n + p.states.length, 0);
  registry.source.assets = assetsOf();
  writeFileSync(join(SKILL, 'registry.json'), JSON.stringify(registry));
  /* the spec, in the designer's words, and what the skill needs to know first */
  for (const f of ['web-spec.md', 'phone-spec.md']) if (existsSync(join(ROOT, 'data', 'theme', 'spec', f))) { mkdirSync(join(SKILL, 'product', 'listings-new'), { recursive: true }); copyFileSync(join(ROOT, 'data', 'theme', 'spec', f), join(SKILL, 'product', 'listings-new', f)); }
  const stateTable = (dev) => [...byName.entries()].filter(([, ds]) => ds.has(dev)).map(([n]) => `| \`${n}\` | ${notes[dev][n]} | \`pages/listings-new/${n}${dev === 'mobile' ? '.mobile' : ''}.html\` |`).join('\n');
  write('product/listings-new/README.md', `# My Listings — the new theme

Profolio 2.0 starts with My Listings. Its redesign is **not live yet** (due about mid-October
2026). What is compiled here is the designer's handover — the build embedded in the spec —
lifted out at its own size and held to it pixel for pixel (≤0.5%): the design, not yet the
product. At launch the product is compiled again and compared.

## When to use it

- **Only My Listings** (\`/listings\`) has a new theme. Every other page stays the current theme.
- **The shell stays the product's** (the designer's decision, 29 Sep 2026): every screen draws the
  product's own header, and every web screen its rail — the current theme — in place of the
  handover's. On a phone the product's 60px header replaces the artboard's status bar and title
  (its rail is the header menu's drawer). Design inside it; never restyle it.
- The intake asks every PRD for its design language — current Profolio or Profolio 2.0 (INTAKE.md, D4); 2.0 exists only for My Listings.
- A page that has not been redesigned (dashboard, leads, reports …) is never drawn in the new
  theme — there are no new tokens for it.

## Its rules

- **Tokens**: \`tokens.md\` → *My Listings — new theme*; as CSS, \`css/new-theme/tokens.css\`
  (\`--pf-ml-*\`), My Listings' only. They **follow the build** where tokens.json and the build
  disagreed (the designer's decision): ${(themeF.adjusted || []).length} adjusted, ${(themeF.variants || []).length} named variants added,
  tokens.json's own values kept in \`tokens.md\` and \`css/new-theme/tokens.resolved.json\`. The type
  roles are the phone's (tokens.json is the phone's, 360pt); the web's card roles are the \`*Web\`
  variants, and the web's card stat is \`type.statPerformance\` (16 · 700).
- **Primary is the green**: a ramp −1…11 around \`#28B16D\` (8). The current theme's teal primary
  and \`colorPrimaryActive\` are gone from My Listings; the green was \`secondaryColor\`.
- **Teal stays in the rank and Quality Score explainers** — the How to Earn Quality Score drawer
  (web) and sheet (phone), the rank and quality cards (\`tint.teal050\`). It also shows on the
  TruCheck glyph, the trend's selected metric pill, and the onboarding tour's hero card (a
  \`#F2FAFA\` → \`#F0FAF5\` gradient).
- **Geist is the UI face, on My Listings only.** Figtree draws the empty states, the modals and
  most sheet and drawer titles (the web page title is the product header's — the current theme);
  the Listing Performance drawer and sheet titles are Geist. Arabic is not in the handover.
- **The riyal is a glyph** — never "SAR": the screens draw the build's own riyal glyph wherever the
  handover wrote "SAR" (the designer's decision). An amount you add: copy the build's
  \`svg[data-pf-riyal]\` (or a card price's glyph) from a \`listings-new\` file and put it before the
  number, sized to it: height max(7px, 0.6 × the amount's font-size), width height × 11/12, fill
  \`currentColor\`, \`vertical-align: baseline\`, \`margin-inline-end: 0.22em\` only where a space
  followed — the current theme's icon-font class (\`.currency-Saudi_Riyal_Symbol\`) does not load here.
  A user's own text (a listing description) keeps "SAR" as they typed it.
- **Markup**: the handover's build writes its styles inline. A block copied from a
  \`listings-new\` file keeps them (name that file in pf-base or pf-also); a value you add is
  \`var(--pf-ml-…)\`, or [TBC].
- **Web 1440 × 900 and phone 360 × 800** (the designer's base, not the product's 375).
- **The Listing Performance drawer is 780px** — both builds, and 02b; 03 · F's table says 680,
  which is the Quality Score drawer's width.

## Derived — composed from the builds' own data, until the handover draws them

- **Mark as Booked** (03 · J; the phone's row menu for a daily rental) is specified and its logic
  is in both builds, but neither draws it. \`modal-mark-as-booked*\` (web) and
  \`sheet-mark-as-booked*\` (phone) compose it in the Request Services modal's and sheet's chrome
  from the build's own values — kinds, calendar cells and their colours, hint, confirm label —
  laid out as the spec's table says. Tagged \`pf-derived\`; replace them when the handover draws it.
  The toast after confirming (\`toast-booked\`) is the build's own.

## Where the handover disagrees with itself — for the designer

- The phone's Ad License tab is drawn by the build, but 02's scenario chip asks for a tab it does
  not have ("license", not "adlicense"), so the chip shows an empty body. \`tab-ad-license-requests\`
  is captured by selecting the tab itself.
- The closed drawers are parked beside the web frame and still cast their shadow into it: a grey
  band down the right edge of every web screen but the one where the open More Filters drawer
  covers that edge. It is in the build (so in every compiled file); it is not in the spec — do not
  draw it.
- The phone's Amenities picker chip opens the listing's second fix, which on that listing is the
  interior-images fix, so the picker never shows; \`sheet-amenities\` opens the amenities fix
  (the third) with the picker, as the build does on the listings where it is second.
- 02c and the phone spec call No active listings "the only state that offers the explainer"; the
  web build also offers See how scores work on No drafts, Nothing waiting for approval and No
  removed listings, and the phone build on No drafts.
- 03's cards B–D describe the tabs as 2, 3 and 4 rows; the build lists 6, 7 and 12 (the
  \`tab-*-full\` states show every row).
- 03 · J says confirming Mark as Booked raises a green toast; both builds draw it dark (#1D1D1F,
  white text) — \`toast-booked\` is the build's.
- 02c's nine case chips on the web only tint a row; each case's drawer is its own state
  (\`drawer-case-*\`). On the phone the chips pin that case first in the list (\`case-*\`); each
  case's performance sheet is its own state (\`sheet-case-*\`).
${(themeF.kept || []).filter((k) => /TBC/.test(k.why)).map((k) => `- \`${k.token}\` ${k.value}: ${k.why}.`).join('\n')}

## States — web, 1440 × 900 (\`-full\`: the whole screen, grown until nothing scrolls)

| state | what it shows | file |
|---|---|---|
| — | ${(themeStates['web:page'] || {}).note} | \`pages/listings-new.html\` |
${stateTable('web')}

## States — phone, 360 × 800

| state | what it shows | file |
|---|---|---|
| — | ${(themeStates['mobile:page'] || {}).note} | \`pages/listings-new.mobile.html\` |
${stateTable('mobile')}

Reached two ways, kept once: ${same.join('; ')}.

## The spec, in the designer's words

\`web-spec.md\` (1440) and \`phone-spec.md\` (360): summary, screens with their element tables and
rules, interaction and motion, assets, edge cases, acceptance criteria, gestures, accessibility,
performance budget, platform notes, open questions.
`);
  /* tokens.md: the new theme's tokens, after the current ones */
  const nt = [];
  /* a token that follows the build says what tokens.json had, and why */
  const adj = new Map((themeF.adjusted || []).map((a) => [a.token, a]));
  const keptT = new Map((themeF.kept || []).map((k) => [k.token, k]));
  const NTR = (token, css, value, what, tag) => nt.push(`| \`${token}\` | ${css.split(' + ').map((x) => `\`${x}\``).join(' + ')} | \`${value}\` | ${tag || (adj.has(token) ? '[adjusted]' : '[design]')} | ${adj.has(token) ? `follows the build — tokens.json: \`${adj.get(token).declared}\`; ${adj.get(token).basis}` : keptT.has(token) ? `kept — ${keptT.get(token).why}` : what} |`.replace(/\n/g, ' '));
  for (const c of themeF.colours) NTR(c.token, c.css, c.value, c.uses === null ? 'declared' : c.uses ? `painted — ${c.uses} uses` : 'declared, not painted');
  for (const [k, v] of Object.entries(themeF.radius)) NTR(`radius.${k}`, `--pf-ml-radius-${k}`, v >= 999 ? '999px' : `${v}px`, 'corner radius');
  for (const [k, v] of Object.entries(themeF.space)) NTR(`space.${k}`, `--pf-ml-space-${k}`, `${v}px`, 'padding, margin or gap');
  for (const [k, v] of Object.entries(themeF.type.family)) NTR(`type.family.${k}`, `--pf-ml-font-${k}`, v, (themeF.families.find((f) => f.family === v) || {}).share ? `${themeF.families.find((f) => f.family === v).share} of the text` : 'not painted');
  for (const x of themeF.variants || []) NTR(x.token, typeof x.value === 'object' && x.value.color ? `${x.css} + ${x.css}-color` : x.css, typeof x.value === 'object' ? `${x.value.size}/${x.value.line} · ${x.value.weight}${x.value.family ? ` · ${x.value.family}` : ''}${x.value.color ? ` · ${x.value.color}` : ''}` : /^(radius|target)\./.test(x.token) ? `${x.value}px` : x.value, `variant of \`${x.of}\` — ${x.where}`, '[variant]');
  nt.push('| currency | `svg[data-pf-riyal]` | the build\'s riyal glyph | [decision] | the screens draw the build\'s riyal glyph wherever the handover wrote "SAR"; an amount you add copies it from a listings-new file, before the number: height max(7px, 0.6 × the amount\'s font-size), width height × 11/12, fill currentColor, margin-inline-end 0.22em only where a space followed |');
  for (const [k, r] of Object.entries(themeF.type)) if (k !== 'family') { const css = `--pf-ml-type-${k.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()}`; NTR(`type.${k}`, r.color ? `${css} + ${css}-color` : css, `${r.size}/${r.line} · ${r.weight}${r.family ? ` · ${r.family}` : ''}${r.color ? ` · ${r.color}` : ''}`, 'type role (phone, 360pt) — drawn as declared'); }
  for (const [k, m] of Object.entries(themeF.motion)) NTR(`motion.${k}`, `--pf-ml-motion-${k.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()}`, `${m.duration}ms ${m.curve}`, m.note || 'motion');
  for (const [k, v] of Object.entries(themeF.elevation)) NTR(`elevation.${k}`, `--pf-ml-elevation-${k.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()}`, v, 'elevation — painted as declared');
  for (const [k, v] of Object.entries(themeF.target)) NTR(`target.${k}`, `--pf-ml-target-${k.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()}`, `${v}px`, 'touch target');
  write('tokens.md', `${read(join(SKILL, 'tokens.md'))}
## My Listings — new theme

**My Listings only** (Profolio 2.0, not yet live) — the designer's \`tokens.json\` (${themeF.meta.name}, base ${themeF.meta.base}, ${themeF.meta.updated}), **following the build** where the two disagreed (the designer's decision, 29 Sep 2026), measured off the new My Listings' ${themeF.states.web + themeF.states.phone} compiled states. As CSS: \`css/new-theme/tokens.css\`; tokens.json's own values: \`css/new-theme/tokens.resolved.json\` → \`$adjusted\`. [design] = the designer's, as declared; [adjusted] = changed to what the build paints; [variant] = a second value the build paints for the same thing, named by where; [decision] = the designer's decision (29 Sep 2026). A type role is a font shorthand; its colour is the \`-color\` property beside it. Every other page uses the table above.

| token | css | value | tag | measured |
|---|---|---|---|---|
${nt.join('\n')}
`);
  console.log(`  new theme — pages/listings-new: ${byName.size} states (${states.filter(([, d]) => d === 'web').length} web, ${states.filter(([, d]) => d === 'mobile').length} phone) · ${nt.length} tokens · ${ntClasses.size} runtime classes`);
}

/* ── 12 · the copy each screen draws: product/copy/rendered/, and copy.md ── */
/* after §11, so the new My Listings' pages are read too. The product's
   source gives every translation (the copy tables hold only what t('…') calls
   by name), the code's own literals and the flag gates. */
{
  const rc = buildRenderedCopy({
    files: listPageFiles(join(SKILL, 'pages')),
    translations: loadTranslations({ repo: PRODUCT, copyDir: join(REFS, 'copy') }),
    fixtures: loadFixtureStrings(join(ROOT, 'harness')),
    code: loadCodeStrings(PRODUCT),
    css: { web: read(join(SKILL, 'css', 'profolio.css')), mobile: read(join(SKILL, 'css', 'profolio.mobile.css')) },
  });
  for (const [rel, body] of Object.entries(rc.files)) write(rel, body);
  const copyGates = copyAreaGates({ repo: PRODUCT, flagsMd: read(join(REFS, 'flags.md')), areas: areas.map((f) => f.replace(/\.md$/, '')), drawn: rc.drawn });
  write('product/copy.md', copyMd({ areas: areas.map((f) => ({ area: f.replace(/\.md$/, ''), strings: copyCount(f) })), gates: copyGates, pages: rc.pages }));
  console.log(`  rendered copy — ${rc.stats.pages} pages · ${rc.stats.rows} rows (${Object.entries(rc.stats.byIs).map(([k, n]) => `${k} ${n}`).join(' · ')}) · ${(Object.values(rc.files).reduce((n, b) => n + Buffer.byteLength(b), 0) / 1048576).toFixed(2)} MB · ${[...copyGates.values()].filter((g) => g.hidden).length} copy area(s) hidden by a flag`);
}

/* ── 13 · the design knowledge base: kb/design-kb.json, searched by qa/find.mjs ── */
/* every screen's purpose and copy, every state's trigger, title, controls and strings
   (data/design-kb.json, scripts/ds/design-kb.mjs), with the skill's own paths — so a
   session goes from a PRD's words to the files, and fetches them from the public repo.
   The new My Listings joins it from its ledger. */
{
  const skillPath = (f) => {
    if (!f) return null;
    let m = f.match(/^deliverables\/(mobile\/)?states\/([a-z0-9-]+?)--(.+)\.html$/);
    if (m) return `pages/${m[2]}/${m[3]}${m[1] ? '.mobile' : ''}.html`;
    m = f.match(/^deliverables\/(mobile\/)?([a-z0-9-]+)\.html$/);
    if (m) return `pages/${m[2]}${m[1] ? '.mobile' : ''}.html`;
    return f;
  };
  const files = (x) => ({ web: skillPath(x && x.web), responsive: skillPath(x && x.responsive) });
  const cap = (a, n) => (Array.isArray(a) ? a.slice(0, n) : []);
  const screens = kb.screens.filter((s) => registry.pages[s.slug]).map((s) => ({
    slug: s.slug, route: registry.pages[s.slug].route, title: s.title, purpose: s.purpose, lines: cap(s.lines, 150), files: files(s.files),
    states: (s.states || []).map((x) => ({ name: x.name, kind: x.kind, how: x.how || '', title: x.title || '', shows: x.shows || '', lines: cap(x.lines, 60), buttons: cap(x.buttons, 20), note: x.note || '', mode: x.mode || null, ...(x.responsiveName ? { responsiveName: x.responsiveName, responsiveKind: x.responsiveKind } : {}), files: files(x.files) })),
  }));
  if (registry.pages['listings-new'] && themeStates) {
    const byName = new Map();
    for (const [key, e] of Object.entries(themeStates)) {
      if (!e.file) continue;
      const [device, name] = key.split(':');
      if (name === 'page') continue;
      const x = byName.get(name) || byName.set(name, { name, kind: (name.match(/^(drawer|sheet|modal|menu|tab|toast|empty|tour|skeleton|case)/) || ['', 'screen'])[1], how: e.how || '', title: '', shows: `${e.note}${e.derived && !/\[derived\]/.test(e.note || '') ? ' [derived]' : ''}`, lines: [], buttons: [], note: e.note || '', mode: null, files: { web: null, responsive: null } }).get(name);
      x.files[device === 'mobile' ? 'responsive' : 'web'] = `pages/listings-new/${name}${device === 'mobile' ? '.mobile' : ''}.html`;
    }
    screens.push({ slug: 'listings-new', route: '/listings', title: 'My Listings — Profolio 2.0 (new theme, not yet live)', purpose: `${(themeStates['web:page'] || {}).note || 'The redesigned My Listings'} — the designer's handover, compiled; My Listings only`, lines: ['Profolio 2.0', 'new theme', 'Listing Performance', 'Quality Score', 'rank'], files: { web: 'pages/listings-new.html', responsive: 'pages/listings-new.mobile.html' }, states: [...byName.values()] });
  }
  const comps = (kb.components || []).filter((c) => registry.components[c.slug] || /Icon$/.test(c.name || '')).map((c) => ({ slug: c.slug, name: c.name, level: c.level, group: c.group, def: c.def, web: c.web, responsive: c.responsive, screens: cap(c.screens, 30), file: registry.components[c.slug] ? registry.components[c.slug].file : `atoms/icon.html#${c.slug}` }));
  const out = { at: kb.at, about: 'The design knowledge base: every screen and state, what it is for, how it is reached, what it shows; paths are the skill\'s. Search it with node qa/find.mjs "<words>".', screens, components: comps, flows: kb.flows || {} };
  write('kb/design-kb.json', JSON.stringify(out));
  /* the search engine, the generator's own (scripts/lib/design-search.mjs), pointed at kb/ */
  write('qa/lib/design-search.mjs', read(join(ROOT, 'scripts', 'lib', 'design-search.mjs'))
    .replace("export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');", "export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');                /* skill/ */")
    .replace("export const KB_PATH = join(ROOT, 'data', 'design-kb.json');", "export const KB_PATH = join(ROOT, 'kb', 'design-kb.json');"));
  console.log(`  design knowledge base — ${screens.length} screens · ${screens.reduce((n, s) => n + s.states.length, 0)} states · ${comps.length} components · ${Math.round(JSON.stringify(out).length / 1024)} KB`);
}

/* ── the count ──────────────────────────────────────────────────────── */
const c = registry.counts;
console.log(`  skill/ — ${c.atoms} atoms (icon holds ${c.icons}) · ${c.molecules} molecules · ${c.organisms} organisms · ${c.pages} pages · ${c.states} states · ${pageFiles.length} page files · ${lines.length} tokens · ${areas.length} copy areas · registry ${Math.round(JSON.stringify(registry).length / 1024)} KB`);
console.log(`  usage — ${U.fileCount} files scanned · ${[...U.usedOn.values()].filter((x) => x.length).length} components drawn · shell ${U.shell.size} · ${U.unresolved.size} markers name no registry component`);
console.log(`  ${folded.length} page containers folded into pages[].source · ${utilities.length} utility classes · ${Object.values(pages).reduce((n, p) => n + p.own.length, 0)} page-own classes`);
if (newcomers.length) console.log(`  placed by rule, for review:\n    ${newcomers.join('\n    ')}`);
