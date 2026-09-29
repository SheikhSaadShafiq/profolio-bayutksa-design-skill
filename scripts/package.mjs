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
 *   product/                       flags, copy (English and Arabic), roles, routes, KSA
 *
 * The levels are the catalogue's, with the placements approved for the
 * package (2026-09-29): the 144 icons are one atom; the three layout
 * templates and the sections of a single page are organisms; a route's own
 * container is not a component but its page's `source`; twelve borderline
 * components move (MOVE). A page-level component this does not know yet is
 * placed as an organism and named in the output, for review.
 *
 * `used_on` is DERIVED: every page file is scanned for each component's own
 * classes (the ones no other component carries).
 *
 * The hand-written parts — SKILL.md, qa/, examples/ — are never touched.
 *
 *   node scripts/package.mjs          (npm run package, after npm run ds)
 */
import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync, rmSync, copyFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ALL } from './pages-list.mjs';

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

/* the derived parts are rebuilt from nothing every time */
for (const d of ['atoms', 'molecules', 'organisms', 'pages', 'css', 'product', 'registry.json', 'tokens.md']) rmSync(join(SKILL, d), { recursive: true, force: true });

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
const pageClasses = new Map();                     /* page slug → every class its files use */
const pageStates = new Map();                      /* page slug → state → Set(devices) */
const CLASS_ATTR = / class="([^"]*)"/g;
for (const f of pageFiles) {
  const html = read(f.src);
  write(outOf(f), rewritePage(html, f));
  const set = pageClasses.get(f.page) || pageClasses.set(f.page, new Set()).get(f.page);
  for (const m of html.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '').matchAll(CLASS_ATTR)) for (const x of m[1].split(/\s+/)) if (x) set.add(x);
  if (f.state) { const s = pageStates.get(f.page) || pageStates.set(f.page, new Map()).get(f.page); (s.get(f.state) || s.set(f.state, new Set()).get(f.state)).add(f.dev); }
}
write('pages/prototype.js', read(join(DS, 'prototype.package.js')));

/* ── 4 · used_on: every page scanned for each component's own classes ── */
const usedOn = (c) => {
  const own = ownClasses(c);
  const probe = own.length ? own : classesOf.get(c.key);
  if (!probe.length) return [];
  return [...pageClasses.entries()].filter(([, set]) => probe.some((x) => set.has(x))).map(([p]) => p).sort();
};

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
  const html = transformComponent(read(src), c, meta);
  const file = `${DIR[c.final]}/${c.slug}.html`;
  write(file, html);
  components[c.slug] = { level: c.final, file, classes: meta.classes, variants: variantsOf(c), states: statesIn(html), tokens: meta.tokens, used_on: meta.used_on, source: meta.source, layouts: [c.web ? 'web' : null, c.mobile ? '375' : null].filter(Boolean) };
}
/* the icons: one atom */
{
  const tiles = icons.map((c) => {
    const i = byKey.get(c.key); const v = i && i.variants[0];
    return `<figure class="ds-icon" id="${c.slug}"><div class="ds-icon-art">${v ? v.html : ''}</div><figcaption><b>${esc(c.name)}</b><code>${esc(c.def)}</code></figcaption></figure>`;
  }).join('\n');
  const cls = [...new Set(icons.flatMap((c) => classesOf.get(c.key)))];
  const used = [...new Set(icons.flatMap((c) => usedOn(c)))].sort();
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
  components.icon = { level: 'atom', file: 'atoms/icon.html', classes: cls, variants: icons.map((c) => c.name), states: ['default'], tokens: [], used_on: used, source: [...new Set(icons.map((c) => c.def))].join(' · '), layouts: ['web', '375'] };
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
/* the flags that gate a page: the true/false constants whose referencing
   files include a file that draws the page (flags.md) */
const flagRows = [...read(join(REFS, 'flags.md')).matchAll(/^\| `([A-Z0-9_]+)` \| `?([^|`]*)`? \| ([^\n]*) \|$/gm)].map((m) => ({ flag: m[1], value: m[2].trim(), files: [...m[3].matchAll(/`([^`]+)`/g)].map((x) => x[1]) }));
const gates = flagRows.filter((f) => /^(true|false)$/.test(f.value));
const PUBLIC = new Set(['invite', 'maintenance', 'process-payment', 'post-ad']);
const pages = {};
/* the shell: what (nearly) every signed-in page draws — the header, the
   rail, their menus. Listed once, not on every page. */
const signedIn = Object.keys(ALL).filter((s) => !PUBLIC.has(s) && existsSync(join(SKILL, 'pages', `${s}.html`)));
const SHELL = new Set(Object.entries(components).filter(([, c]) => signedIn.filter((p) => c.used_on.includes(p)).length >= Math.ceil(signedIn.length * 0.9)).map(([s]) => s));
const levelLists = (slug) => {
  const out = { organisms: [], molecules: [], atoms: [] };
  for (const [s, c] of Object.entries(components)) if (c.used_on.includes(slug) && !(SHELL.has(s) && !PUBLIC.has(slug))) out[DIR[c.level]].push(s);
  return out;
};
const unowned = new Map();                            /* class → pages, for classes no component styles */
const componentClass = new Set(Object.values(components).flatMap((c) => c.classes));
for (const [slug, set] of pageClasses) for (const x of set) if (!componentClass.has(x)) (unowned.get(x) || unowned.set(x, new Set()).get(x)).add(slug);
for (const slug of Object.keys(ALL)) {
  if (!existsSync(join(SKILL, 'pages', `${slug}.html`))) continue;
  const screen = kb.screens.find((s) => s.slug === slug) || {};
  const st = pageStates.get(slug) || new Map();
  const states = [...st.entries()].map(([name, devs]) => (devs.has('web') && devs.has('mobile') ? name : devs.has('web') ? `${name}@web` : `${name}@375`)).sort();
  const sources = folded.filter((c) => Object.keys(c.pages || {}).some((p) => p === slug || p === `${slug}--mobile`)).map((c) => c.def);
  /* the page's own files: its containers and the components not in the shell */
  const drawnBy = new Set([...sources, ...Object.entries(components).filter(([s, c]) => c.used_on.includes(slug) && !SHELL.has(s)).map(([, c]) => c.source)]);
  const flags = gates.filter((g) => g.files.some((f) => drawnBy.has(f))).map((g) => `${g.flag}=${g.value}`);
  const roles = PUBLIC.has(slug) ? ['public'] : ['owner', ...(st.has('as-staff') ? ['staff'] : []), ...(st.has('as-individual') ? ['individual'] : [])];
  pages[slug] = {
    route: ALL[slug], file: `pages/${slug}.html`, ...(existsSync(join(SKILL, 'pages', `${slug}.mobile.html`)) ? { mobile: `pages/${slug}.mobile.html` } : {}),
    title: screen.title || slug, aliases: ALIASES[slug] || [], ...levelLists(slug), flags, roles, states,
    source: [...new Set(sources)], own: [...unowned.entries()].filter(([, ps]) => ps.size === 1 && ps.has(slug)).map(([x]) => x).sort(),
  };
}
const utilities = [...unowned.entries()].filter(([, ps]) => ps.size > 1).map(([x]) => x).sort();
const flows = {};
for (const [name, steps] of Object.entries(kb.flows || {})) flows[name] = steps.map((s) => `${s.screen}/${s.state}`);
const registry = {
  built: new Date().toISOString().slice(0, 10), product: (read(join(REFS, 'flags.md')).match(/profolio-reactjs@(\w+)/) || [])[1] || null,
  counts: { atoms: Object.values(components).filter((c) => c.level === 'atom').length, molecules: Object.values(components).filter((c) => c.level === 'molecule').length, organisms: Object.values(components).filter((c) => c.level === 'organism').length, icons: icons.length, pages: Object.keys(pages).length, states: Object.values(pages).reduce((n, p) => n + p.states.length, 0) },
  shell: { components: [...SHELL].sort(), flags: gates.filter((g) => g.files.some((f) => [...SHELL].some((x) => components[x].source === f))).map((g) => `${g.flag}=${g.value}`) },
  components, pages, flows, utilities,
};
writeFileSync(join(SKILL, 'registry.json'), JSON.stringify(registry));

/* ── 9 · product/ ───────────────────────────────────────────────────── */
mkdirSync(join(SKILL, 'product', 'copy'), { recursive: true });
copyFileSync(join(REFS, 'flags.md'), join(SKILL, 'product', 'flags.md'));
const areas = readdirSync(join(REFS, 'copy')).filter((f) => f.endsWith('.md')).sort();
for (const f of areas) copyFileSync(join(REFS, 'copy', f), join(SKILL, 'product', 'copy', f));
const copyCount = (f) => (read(join(REFS, 'copy', f)).match(/^\| (?!English|---)/gm) || []).length;
write('product/copy.md', `# Copy — the product's own strings

English beside Arabic, verbatim, from the product's translation files and code — one file per area. Use these exact words; a string the design needs that is not here is new copy, marked \`data-pf-new-copy\` and put to the designer in both languages.

| area | strings | file |
|---|---|---|
${areas.map((f) => `| ${f.replace(/\.md$/, '')} | ${copyCount(f)} | copy/${f} |`).join('\n')}
`);
const row = (cells) => `| ${cells.join(' | ')} |`;
write('product/routes.md', `# Routes

Every compiled screen: its route, whether it needs a signed-in account, its files and its states. \`registry.json\` has the same, with aliases, components, flags and roles.

${row(['page', 'route', 'title', 'access', 'web', '375', 'states'])}
${row(['---', '---', '---', '---', '---', '---', '---'])}
${Object.entries(pages).map(([s, p]) => row([s, `\`${p.route}\``, p.title, PUBLIC.has(s) ? 'public' : 'signed in', `\`${p.file}\``, p.mobile ? `\`${p.mobile}\`` : '—', p.states.length])).join('\n')}

## Flows

Numbered steps across pages; each step is a state file. On a page, → and ← walk the flow and its primary button goes on.

${Object.entries(flows).map(([n, steps]) => `**${n}** — ${steps.map((x, i) => `${i + 1} \`${x}\``).join(' → ')}`).join('\n\n')}
`);
const acc = (s, name) => (pages[s] && pages[s].states.some((x) => x.split('@')[0] === name) ? '✓' : '—');
write('product/roles.md', `# Roles

Three kinds of signed-in account see Profolio KSA, and a screen can differ for each. Every signed-in page is compiled three times: as the **agency owner** (the page itself), as an **agency staff** user (\`<state>\` \`as-staff\`) and as an **individual** broker (\`as-individual\`).

| role | who | how it is compiled | what changes |
|---|---|---|---|
| owner | the agency's admin | the fixture account | — the default |
| staff | a user inside an agency, not its admin | fixture mode \`staff\`, recorded from a real staff account | 9 rail items (no Agency Settings); own leads only; a restricted Agency Staff page; Agency Settings redirects to User Settings; titanium package; profile 50% |
| individual | a broker with no agency | fixture mode \`individual\`: the owner's record with the agency taken away (not recorded) | no Agency Staff, no Agency Settings; the broker's own FAL licence; no agency selector on the dashboard; the leaderboard instead of the team table; "Individual" on User Settings; Convert to Agency |
| public | not signed in | — | invite, maintenance, the payment return and the magic post-ad link have no shell and no account |

## By page

${row(['page', 'owner', 'staff', 'individual'])}
${row(['---', '---', '---', '---'])}
${Object.keys(pages).map((s) => row([s, PUBLIC.has(s) ? 'public' : '✓', acc(s, 'as-staff'), acc(s, 'as-individual')])).join('\n')}

A ✓ is a compiled file: \`pages/<page>/as-staff.html\`, \`as-individual.html\` (and \`.mobile.html\`).
`);
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
for (const [n, v] of VARS) {
  const k = hex(v), names = namedFor.get(k) || [];
  const src = /^--pf-color-/.test(n) || /^--pf-(border-radius|font-size|control-height|padding|margin|motion-ease|font-family|box-shadow)/.test(n) ? 'antd' : 'theme';
  let what = /^#|^rgb/i.test(v) ? controls(k) || 'declared; not painted on the compiled pages' : '';
  if (/border-radius/.test(n)) { const cor = (tokens.corners || []).find((c) => c.value === v); what = cor ? `corner radius — ${cor.uses} uses: ${cor.who.map(who).slice(0, 3).join(', ')}` : 'corner radius'; }
  else if (/font-size/.test(n)) { const s = (tokens.typeScale || []).find((t) => `${t.size}px` === v); what = s ? `text size — ${s.uses} uses, weights ${s.weights.map(([w]) => w).join('/')}${s.lh ? `, line height ${s.lh}px` : ''}` : 'text size'; }
  else if (/control-height/.test(n)) what = 'height of inputs, selects and buttons';
  else if (/padding|margin/.test(n)) what = `antd spacing step (${n.replace('--pf-', '')})`;
  else if (/motion-ease/.test(n)) what = 'easing curve';
  else if (/font-family/.test(n)) what = 'every text: Figtree, then Droid Arabic Kufi for Arabic';
  else if (/box-shadow/.test(n)) what = 'elevation';
  T(n, v, `[src] ${src}${names.length ? ` ${names.map((x) => x.name).slice(0, 2).join(', ')}` : ''}`, what);
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

token · value · provenance · what it controls. [src] named in the product's theme (src/theme/index.js) or antd's resolved tokens; [px] measured from the compiled pages; [TBC] not sourced. css/tokens.css holds the [src] ones as custom properties.

| token | value | tag | controls |
|---|---|---|---|
${lines.join('\n')}
`);

/* ── the count ──────────────────────────────────────────────────────── */
const c = registry.counts;
console.log(`  skill/ — ${c.atoms} atoms (icon holds ${c.icons}) · ${c.molecules} molecules · ${c.organisms} organisms · ${c.pages} pages · ${c.states} states · ${pageFiles.length} page files · ${lines.length} tokens · ${areas.length} copy areas · registry ${Math.round(JSON.stringify(registry).length / 1024)} KB`);
console.log(`  ${folded.length} page containers folded into pages[].source · ${utilities.length} utility classes · ${Object.values(pages).reduce((n, p) => n + p.own.length, 0)} page-own classes`);
if (newcomers.length) console.log(`  placed by rule, for review:\n    ${newcomers.join('\n    ')}`);
