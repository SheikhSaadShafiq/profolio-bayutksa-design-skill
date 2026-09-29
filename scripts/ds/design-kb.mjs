#!/usr/bin/env node
/**
 * The design knowledge base — every screen and every state of it, web and
 * responsive, written down so the skill can FIND the design a PRD needs
 * instead of remembering it.
 *
 * The design system (deliverables/) is pictures: a compiled page, a compiled
 * state, a component page. A PRD is words — "let an agent mark a daily rental
 * as booked", "staff should not see agency settings". Between the two there
 * was nothing but the file names, and a file name like
 * listings--tooltip-upgrade-unavailable says little to a search. So this
 * reads every compiled file back — what is open in it, its title, the strings
 * it renders, the controls in it, which components it adds to its page, how
 * the page reaches it, whether it matches the product — and writes it down
 * twice:
 *
 *   data/design-kb.json        the index scripts/design-find.mjs searches
 *   kb/screens/index.html      every screen, every state, one table
 *   kb/screens/<page>.html     one screen: what it is for, what it is made of,
 *                              every state with how to reach it and the file
 *                              to open, web beside responsive
 *
 * The text in a compiled page was rendered for the FIXTURE account: its
 * labels, headings, buttons and messages are the product's own copy; its
 * names, numbers, addresses and listings are invented. The index keeps both,
 * because both are what a search for a screen runs into.
 *
 *   node scripts/ds/design-kb.mjs
 */
import pkg from 'playwright';
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { ALL } from '../pages-list.mjs';
import { DEVICES } from '../../harness/devices.mjs';

const { chromium } = pkg;
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const D = join(ROOT, 'deliverables');
const OUT = join(ROOT, 'kb', 'screens');
const json = (p, d = null) => (existsSync(join(ROOT, p)) ? JSON.parse(readFileSync(join(ROOT, p), 'utf8')) : d);
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* What each screen is FOR, from the user's side, in one line — the thing a
   PRD names. Written from what the compiled screen shows. */
const PURPOSE = {
  dashboard: 'Overview — the agency at a glance: listings by purpose and upgrade, the credits balance, performance and leads over a date range, and the latest listings.',
  listings: 'My Listings — every listing by status tab (Active, Draft, Pending, Removed, Ad License Requests), filtered and searched, each row with its performance, status, upgrades and actions.',
  'credits-usage': 'Credits Usage — the current package’s credits (available, used, total), how they were spent by product, and the history of every application.',
  'ad-license': 'Get a New Ad License — the REGA advertising-licence request: purpose, property type and details, ownership document, then payment.',
  'lms-leads': 'TruLeads — every lead from calls, WhatsApp, SMS and email, with call insights, filters, and a lead drawer holding its tasks and history.',
  'reports-summary': 'Reports · Summary — listings by purpose and upgrade, and where they are, by location.',
  'reports-listing-report': 'Reports · Listing Report — each listing’s performance, by date.',
  'reports-leads-reports': 'Reports · Leads — views, clicks and leads by channel over time, by purpose.',
  'user-settings-user-profile': 'User Settings — the signed-in user’s own profile: photo, Nafath verification, contact details, languages, experience, service areas and description.',
  'user-settings-agency-profile': 'Agency Settings — the agency’s name, logo and contacts. Agency owner only: a staff user is sent to User Settings.',
  'user-settings-change-password': 'Change Password — old password, new password, confirm.',
  'agency-staff': 'Agency Staff — the agency’s users: invite, set credit limits, edit, delete. Agency owner only: a staff user sees an empty page.',
  'agent-performance': 'Agent Performance — TruBroker progress, TruPoints, the badges (Quality Lister, Responsive Broker, Super Lister) and the leaderboard; an agency owner also sees the team.',
  packages: 'Credits & Packages — the current package and its credits, the packages on offer by duration, and credit top-ups.',
  'post-listing': 'Post a Listing — begins with the REGA Ad License Number; without one, the way to get an Ad License through Bayut.',
  'user-settings-licenses': 'Licenses — the FAL brokerage licences of the user and the agency; adding one earns the Verified badge.',
  'user-settings-preferences': 'Preferences — three switches, each saved the moment it is flipped: Smart Credit Utilization, Push Notification, and Image and Details Usage (Bayut’s marketing campaigns).',
  'post-listing-edit': 'Post a Listing · the form — the listing as its REGA licence filled it in: property type, images and videos, the map pin, specifications, amenities, title and description; a live listing ends in Update, a draft in Save Changes and Post Listing with the credits it needs.',
  'post-listing-upgrade': 'Post a Listing · upgrade — how the listing is published (Basic, Hot or Signature Listing) and the services added to it (photography, videography, drone footage), paid in credits; once posted, the congratulations and the upsell.',
  'post-ad': 'Magic Post Ad — a public link to a listing draft already written for the agent (photos, title, description): the listing form under the lite Bayut header, sent with Post Listing, no sign-in.',
  checkout: 'Checkout — where every purchase ends (credits, a package, an ad licence): the payment methods, the chosen method’s form, the Order Summary with Pay, and the result — purchased, declined or cancelled.',
  'process-payment': 'Processing payment — where the payment gateway sends the customer back: a full-page spinner while the result is asked for, then Checkout.',
  invite: 'Agency Invitation — an agent invited to join an agency: who invited them, Accept or Reject; an expired link says so.',
  maintenance: 'Maintenance — the public page shown while Profolio is under scheduled maintenance.',
};
/* the state KINDS, in the order a screen's table lists them */
const KIND_ORDER = ['flow', 'form', 'modal', 'drawer', 'popover', 'dropdown', 'select', 'picker', 'tooltip', 'tour', 'message', 'tab', 'inline', 'data', 'account', 'shell', 'other'];
const KIND_TITLE = { flow: 'Flows (numbered steps)', form: 'Forms (errors, filled, saved, failed)', modal: 'Modals', drawer: 'Drawers', popover: 'Popovers', dropdown: 'Dropdowns & menus', select: 'Select lists', picker: 'Date pickers', tooltip: 'Tooltips', tour: 'Tours', message: 'Messages', tab: 'Tabs', inline: 'Changes in place', data: 'Data states (loading, empty, error, variants of the data)', account: 'Account variants (who is signed in)', shell: 'The shell (header, rail, menus)', other: 'Other' };
/* the fixture modes, and what each says about the account or the data */
const MODE_TEXT = {
  staff: 'signed in as an agency STAFF user (not the agency admin): titanium package, profile 50%, call and WhatsApp tracking off',
  incomplete: 'the profile is 90% complete',
  member: 'an individual member (not an agency)',
  projects: 'listings that are units of a project',
  error: 'the list query failed',
  slow: 'the data is still loading',
  'non-saudi': 'the user is not a Saudi national',
  individual: 'signed in as an INDIVIDUAL broker — no agency: no Agency Staff, no Agency Settings, the broker’s own FAL licence, Convert to Agency',
  empty: 'the account is brand new — no listings, leads, traffic, credit spend, licences or staff yet',
  'preferences-flipped': 'every preference switch is the other way round',
};
/* a mode that is an ANSWER rather than an account or its data — a save
   refused, a payment declined, an upload failed: the state is what the
   answer opens (a toast, a modal, a form's errors), and its note says how */
const RESPONSE_MODE = /^(form-fail|lead-duplicate|photo-rejected|pay-|lf-)/;

/* ── what is on disk ─────────────────────────────────────────────────── */
const compiledIn = (rel) => (existsSync(join(D, rel)) ? readdirSync(join(D, rel)).filter((f) => f.endsWith('.html')).map((f) => rel + f) : [])
  .filter((rel) => /<meta name="pf-compiled"/.test(readFileSync(join(D, rel), 'utf8').slice(0, 8000)));
const files = { web: [...compiledIn(''), ...compiledIn('states/')], mobile: [...compiledIn('mobile/'), ...compiledIn('mobile/states/')] };
const nameOf = (rel) => rel.split('/').pop().replace(/\.html$/, '');

/* the steps that were written by hand carry a note, a mode and the devices */
const HAND = {};
for (const f of readdirSync(join(ROOT, 'harness', 'interactions')).filter((f) => f.endsWith('.mjs'))) {
  const list = (await import(pathToFileURL(join(ROOT, 'harness', 'interactions', f)).href)).default || [];
  /* <page>.mobile.mjs holds the page's phone-only steps: they are the page's */
  const scope = f.replace(/\.mjs$/, '').replace(/\.mobile$/, '');
  for (const st of list) HAND[`${scope}|${st.name}`] ||= { note: st.note || '', mode: st.mode || null, shell: scope.startsWith('_') };
}
/* the states every page has (harness/interactions/_*.mjs): the shell's,
   then the rest — accounts, data, … */
const SHARED = ['_shell', '_mobile', ...[...new Set(Object.keys(HAND).map((k) => k.split('|')[0]))].filter((x) => x.startsWith('_') && x !== '_shell' && x !== '_mobile').sort()];
/* the ones the explorer found carry the trigger: what was clicked or hovered */
const EXPLORED = {};
for (const [dev, dir] of [['web', 'data/states'], ['mobile', 'data/states/mobile']]) {
  if (!existsSync(join(ROOT, dir))) continue;
  for (const f of readdirSync(join(ROOT, dir)).filter((f) => f.endsWith('.json'))) {
    const d = JSON.parse(readFileSync(join(ROOT, dir, f), 'utf8'));
    for (const st of d.states || []) EXPLORED[`${dev}|${d.page}|${st.name}`] = st;
    /* one level down (explore.mjs --nested): the parent's own record rides along */
    for (const n of d.nested || []) EXPLORED[`${dev}|${d.page}|${n.name}`] = { ...n, parentState: (d.states || []).find((x) => x.name === n.parent) };
    if (d.page === 'dashboard') for (const st of (d.states || []).filter((s) => s.shell)) EXPLORED[`${dev}|*|${st.name}`] = st;
  }
}
const compileRows = new Map((json('data/qa/compile.json', { rows: [] }).rows || []).map((r) => [r.name, r]));
const catalogue = json('data/ds/catalogue.json', []);
const kbLinks = json('data/ds/kb-links.json', { byPage: {}, byDef: {} });

/* ── read every compiled file back ─────────────────────────────────── */
const READ = () => {
  const vis = (el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 1 && r.height > 1 && s.visibility !== 'hidden' && +s.opacity > 0.05; };
  const clean = (t) => (t || '').replace(/\s+/g, ' ').trim();
  const linesOf = (el, max) => {
    const seen = new Set(), out = [];
    for (const l of (el.innerText || '').split('\n')) { const t = clean(l); if (t && t.length <= 100 && !seen.has(t)) { seen.add(t); out.push(t); if (out.length >= max) break; } }
    return out;
  };
  const KINDS = [
    ['modal', '.pf-modal-wrap:not([style*="display: none"]) .pf-modal'],
    ['drawer', '.pf-drawer-content'],
    ['popover', '.pf-popover:not(.pf-popover-hidden)'],
    ['select', '.pf-select-dropdown:not(.pf-select-dropdown-hidden)'],
    ['dropdown', '.pf-dropdown:not(.pf-dropdown-hidden)'],
    ['picker', '.pf-picker-dropdown:not(.pf-picker-dropdown-hidden)'],
    ['tooltip', '.pf-tooltip:not(.pf-tooltip-hidden)'],
    ['tour', '.pf-tour'],
    ['message', '.pf-message-notice, .pf-notification-notice'],
  ];
  const open = [];
  for (const [kind, sel] of KINDS) {
    for (const el of document.querySelectorAll(sel)) {
      if (!vis(el)) continue;
      const t = el.querySelector('.pf-modal-title, .pf-drawer-title, .pf-popover-title, .pf-tour-title');
      const r = el.getBoundingClientRect();
      open.push({
        kind, title: t ? clean(t.innerText) : '', w: Math.round(r.width), h: Math.round(r.height), lines: linesOf(el, 30),
        buttons: [...new Set([...el.querySelectorAll('button, .pf-btn, [role=button]')].filter(vis).map((b) => clean(b.innerText || b.getAttribute('aria-label') || '')).filter((x) => x && x.length < 50))].slice(0, 12),
      });
    }
  }
  const content = document.querySelector('.pf-layout-content') || document.querySelector('main') || document.body;
  const region = (el) => (el.closest('.pf-layout-header') ? 'header' : el.closest('.pf-layout-sider') ? 'rail' : el.closest('.pf-drawer-content') ? 'drawer' : el.closest('tr') ? 'table row' : el.closest('.pf-tabs-nav, .pf-segmented') ? 'tabs' : 'content');
  const go = [...document.querySelectorAll('[data-pf-go]')].map((el) => ({
    href: el.getAttribute('data-pf-go'),
    label: clean(el.getAttribute('aria-label') || el.getAttribute('title') || el.innerText || '').slice(0, 60) || (el.querySelector('svg') ? 'an icon' : el.tagName.toLowerCase()),
    region: region(el),
  }));
  const tabs = [...content.querySelectorAll('.pf-tabs-tab-active, .pf-segmented-item-selected, .pf-radio-button-wrapper-checked')].map((e) => clean(e.innerText)).filter(Boolean);
  return { open, lines: linesOf(content, 80), go, tabs, height: document.documentElement.scrollHeight };
};

const browser = await chromium.launch();
const ctxs = { web: await browser.newContext(DEVICES.web), mobile: await browser.newContext({ viewport: DEVICES.mobile.viewport, deviceScaleFactor: 1 }) };
const read = {};
let n = 0;
for (const dev of ['web', 'mobile']) {
  for (const rel of files[dev]) {
    const pg = await ctxs[dev].newPage();
    await pg.route('**/*', (r) => (/^(file|data|about):/.test(r.request().url()) ? r.continue() : r.abort()));
    await pg.goto(pathToFileURL(join(D, rel)).href, { waitUntil: 'load' });
    const head = readFileSync(join(D, rel), 'utf8').slice(0, 8000);
    const meta = (k) => ((head.match(new RegExp(`<meta name="${k}" content="([^"]*)"`)) || [])[1] || '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
    read[`${dev}|${nameOf(rel)}`] = { rel: `deliverables/${rel}`, note: meta('pf-state-note'), ...(await pg.evaluate(READ)) };
    await pg.close();
    n++;
  }
}
await browser.close();

/* ── one record per screen, one per state, web and responsive merged ──── */
const compOf = (name) => catalogue.filter((c) => c.pages[name]).map((c) => ({ slug: c.slug, name: c.name, level: c.level, count: c.pages[name] }));
const scoreOf = (name) => { const r = compileRows.get(name); return r ? r.pct : null; };
const kindOf = (full, hand, expl, r) => {
  /* a state one level down is the kind of what it opened */
  const name = full.includes('__') ? full.split('__').pop() : full;
  if (/^flow-/.test(full)) return 'flow';
  if (/^form-/.test(name)) return 'form';
  if (/^message-/.test(name)) return 'message';
  if (hand && /^(staff|individual)$/.test(hand.mode || '') && !/-as-(staff|individual)$/.test(name)) return 'account';
  if (hand && hand.mode && !RESPONSE_MODE.test(hand.mode)) return 'data';
  if (/^(loading|error|empty)/.test(name)) return 'data';
  if (hand && hand.shell) return 'shell';
  if (expl && expl.shell) return 'shell';
  const k = (r && r.open.length ? r.open[r.open.length - 1].kind : null) || (expl && expl.kind) || (name.match(/^(modal|drawer|popover|dropdown|select|picker|tooltip|tour|tab|inline)/) || [])[1];
  if (k === 'inline' && /^tab-/.test(name)) return 'tab';
  return KIND_ORDER.includes(k) ? k : 'other';
};
const screens = [];
for (const [slug, route] of Object.entries(ALL)) {
  const base = { web: read[`web|${slug}`], mobile: read[`mobile|${slug}`] };
  if (!base.web && !base.mobile) continue;
  const stateNames = [...new Set(['web', 'mobile'].flatMap((dev) => files[dev].map(nameOf).filter((x) => x.startsWith(slug + '--')).map((x) => x.slice(slug.length + 2))))];
  const states = [];
  for (const st of stateNames) {
    const r = { web: read[`web|${slug}--${st}`], mobile: read[`mobile|${slug}--${st}`] };
    const hand = HAND[`${slug}|${st}`] || SHARED.map((x) => HAND[`${x}|${st}`]).find(Boolean);
    const expl = EXPLORED[`web|${slug}|${st}`] || EXPLORED[`mobile|${slug}|${st}`] || EXPLORED[`web|*|${st}`] || EXPLORED[`mobile|*|${st}`];
    const any = r.web || r.mobile;
    const top = any.open.length ? any.open[any.open.length - 1] : null;
    /* how the page reaches it: the trigger the explorer used, else the
       compiled page's own link to it, else the hand-written note */
    const link = (base.web || base.mobile).go.find((g) => g.href.endsWith(`${slug}--${st}.html`));
    let trig = expl && !/^(icon|svg|div|span|img|button|a|li|p|x|i|input|textarea|label|select)$/i.test(expl.label || '') ? `${expl.action} “${expl.label}”` : link && link.label !== 'an icon' ? `click “${link.label}”` : expl ? `${expl.action} an icon${expl.title ? ` (opens “${expl.title}”)` : ''}` : null;
    if (trig && expl && expl.parentState) trig = `in the ${expl.parentState.kind} “${expl.parentState.label || expl.parent}” opens: ${trig}`;
    const how = hand && hand.mode && MODE_TEXT[hand.mode] && !/-as-(staff|individual)$/.test(st) ? `the page as it renders when ${MODE_TEXT[hand.mode]}`
      : hand && hand.mode && hand.note ? hand.note
      : hand && hand.mode ? `the page as it renders when the fixture is in mode “${hand.mode}”`
      : trig ? `${trig}${link ? ` in the ${link.region}` : ''}` : (hand && hand.note) || '';
    /* what it shows: the overlay's title and its first lines; for a change
       in place, the lines the page did not have before */
    const baseLines = new Set((base.web || base.mobile).lines);
    const fresh = top ? top.lines : any.lines.filter((l) => !baseLines.has(l));
    const kind = kindOf(st, hand, expl, any);
    const adds = ['web', 'mobile'].flatMap((dev) => { const nm = dev === 'mobile' ? `${slug}--${st}--mobile` : `${slug}--${st}`; const pn = dev === 'mobile' ? `${slug}--mobile` : slug; return catalogue.filter((c) => c.pages[nm] && (!c.pages[pn] || c.pages[nm] > c.pages[pn])).map((c) => c.slug); });
    states.push({
      name: st, kind, how,
      title: top ? top.title : '',
      shows: (top && top.title ? [top.title, ...fresh.filter((l) => l !== top.title)] : fresh).slice(0, 6).join(' · ').slice(0, 260),
      lines: [...new Set([...(top ? top.lines : fresh)])].slice(0, 30),
      buttons: top ? top.buttons : [],
      tabs: any.tabs,
      mode: hand ? hand.mode : null,
      note: (r.web && r.web.note) || (r.mobile && r.mobile.note) || (hand && hand.note) || '',
      files: { web: r.web ? r.web.rel : null, responsive: r.mobile ? r.mobile.rel : null },
      score: { web: r.web ? scoreOf(`${slug}--${st}`) : null, responsive: r.mobile ? scoreOf(`${slug}--${st}--mobile`) : null },
      adds: [...new Set(adds)].slice(0, 16),
    });
  }
  /* The same control often opens a modal on the web and a drawer on a phone
     (the product swaps the component by device): the explorer names each
     after what was clicked, so the two carry the same stem — one state,
     two layouts. */
  const stem = (n) => n.replace(/^(modal|drawer|popover|dropdown|select|picker|tooltip|inline|tab|message)-/, '');
  /* the shell's states the phone names differently: the rail is the menu
     drawer, the account popover is the profile drawer */
  const ALIAS = [[/^rail-expanded$/, /^mobile-menu$/], [/^popover-[a-z-]+-agency-user$/, /^drawer-profile-information-/], [/^popover-account$/, /^drawer-profile-information-/]];
  for (const w of states.filter((x) => x.files.web && !x.files.responsive)) {
    const m = states.find((x) => x !== w && !x.files.web && x.files.responsive && stem(x.name) === stem(w.name) && stem(x.name) !== x.name)
      || states.find((x) => x !== w && !x.files.web && x.files.responsive && ALIAS.some(([a, b]) => a.test(w.name) && b.test(x.name)));
    if (!m) continue;
    w.files.responsive = m.files.responsive;
    w.score.responsive = m.score.responsive;
    w.responsiveName = m.name;
    w.responsiveKind = m.kind;
    w.adds = [...new Set([...w.adds, ...m.adds])].slice(0, 16);
    if (!w.lines.length) w.lines = m.lines;
    states.splice(states.indexOf(m), 1);
  }
  states.sort((a, b) => KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind) || a.name.localeCompare(b.name));
  /* flows: flow-<flow>-<nn>-<what> steps, in order, wherever they land */
  for (const x of states) { const m = x.name.match(/^flow-([a-z0-9]+(?:-[a-z0-9]+)*?)-(\d{2})-(.+)$/); if (m) { x.flow = m[1]; x.step = Number(m[2]); x.stepName = m[3].replace(/-/g, ' '); } }
  const comps = compOf(slug).sort((a, b) => b.count - a.count);
  const compsM = compOf(`${slug}--mobile`).sort((a, b) => b.count - a.count);
  screens.push({
    slug, route, purpose: PURPOSE[slug] || '',
    title: (PURPOSE[slug] || slug).split(' — ')[0],
    files: { web: base.web ? base.web.rel : null, responsive: base.mobile ? base.mobile.rel : null },
    kb: kbLinks.byPage[slug] ? `kb/${kbLinks.byPage[slug].href}` : null,
    score: { web: scoreOf(slug), responsive: scoreOf(`${slug}--mobile`) },
    lines: (base.web || base.mobile).lines.slice(0, 60),
    components: comps.slice(0, 40), componentsResponsive: compsM.slice(0, 40),
    onlyWeb: comps.filter((c) => !compsM.some((m) => m.slug === c.slug)).map((c) => c.slug),
    onlyResponsive: compsM.filter((c) => !comps.some((m) => m.slug === c.slug)).map((c) => c.slug),
    states,
  });
}
const components = catalogue.map((c) => ({
  slug: c.slug, name: c.name, level: c.level, group: c.group, def: c.def, family: c.family, web: c.web, responsive: c.mobile, match: c.match,
  file: `deliverables/components/${c.slug}.html`,
  screens: [...new Set(Object.keys(c.pages).map((p) => p.replace(/--mobile$/, '').split('--')[0]))],
  states: Object.keys(c.pages).filter((p) => p.includes('--') && !/^[^-]+(-[^-]+)*--mobile$/.test(p)).slice(0, 60),
}));
/* every flow, across the screens its steps land on */
const flows = {};
for (const s of screens) for (const x of s.states) if (x.flow) (flows[x.flow] ||= []).push({ step: x.step, what: x.stepName, screen: s.slug, state: x.name, files: x.files, shows: x.shows });
for (const k of Object.keys(flows)) flows[k].sort((a, b) => a.step - b.step);
const kb = {
  at: new Date().toISOString(),
  about: 'Every compiled screen and state of Profolio KSA (web at 1440, responsive at 375), what each shows and how it is reached, with the file to open. Text is as rendered on the fixture account: labels are the product copy, names and numbers are invented. Search it with: node scripts/design-find.mjs "<words>".',
  counts: { screens: screens.length, states: screens.reduce((a, s) => a + s.states.length, 0), web: files.web.length, responsive: files.mobile.length, components: components.length, flows: Object.keys(flows).length },
  screens, components, flows,
};
writeFileSync(join(ROOT, 'data', 'design-kb.json'), JSON.stringify(kb, null, 1));

/* ── kb/screens — content only, the kb stylesheet, like every kb page ─── */
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
const page = (title, crumbs, body) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)} — Profolio KSA</title>
<link rel="stylesheet" href="../kb.css">
</head>
<body>
<nav><a href="../index.html">Profolio KSA</a> › ${crumbs}</nav>
<main>
${body}
</main>
</body>
</html>
`;
const fileLink = (rel, label) => (rel ? `<a href="../../${rel}">${esc(label)}</a>` : '—');
const pct = (x) => (x === null || x === undefined ? '—' : `${x}%`);
const compLink = (c) => `<a href="../../deliverables/components/${c.slug}.html">${esc(c.name)}</a>`;
const bySlug = new Map(components.map((c) => [c.slug, c]));

for (const s of screens) {
  const groups = KIND_ORDER.map((k) => [k, s.states.filter((x) => x.kind === k)]).filter(([, l]) => l.length);
  const body = `<h1>${esc(s.title)}</h1>
<p>${esc(s.purpose)}</p>
<table>
<tr><th>route</th><td><code>${esc(s.route)}</code></td></tr>
<tr><th>web · 1440</th><td>${fileLink(s.files.web, s.files.web || '')} ${s.score.web !== null ? `<small>(${pct(s.score.web)} from the product)</small>` : ''}</td></tr>
<tr><th>responsive · 375</th><td>${fileLink(s.files.responsive, s.files.responsive || 'not compiled')} ${s.score.responsive !== null ? `<small>(${pct(s.score.responsive)} from the product)</small>` : ''}</td></tr>
<tr><th>states</th><td>${s.states.length} — ${s.states.filter((x) => x.files.web).length} web, ${s.states.filter((x) => x.files.responsive).length} responsive</td></tr>
${s.kb ? `<tr><th>route notes</th><td><a href="../${s.kb.replace(/^kb\//, '')}">${esc(s.kb)}</a> — roles, flags and source</td></tr>` : ''}
</table>
<p>Open the page and click through it: every trigger that opens one of these states is a link to it, and every state links back. The percentages are the compiled file’s pixel difference from the product it was compiled from.</p>
${groups.map(([k, list]) => `<h2>${esc(KIND_TITLE[k])} <small>${list.length}</small></h2>
<table>
<tr><th>state</th><th>how to reach it</th><th>what it shows</th><th>web</th><th>responsive</th></tr>
${list.map((x) => `<tr><td><code>${esc(x.name)}</code>${x.responsiveName ? `<br><small>on a phone: a ${esc(x.responsiveKind)} — <code>${esc(x.responsiveName)}</code></small>` : ''}${x.adds.length ? `<br><small>adds ${x.adds.slice(0, 6).map((a) => (bySlug.get(a) ? compLink(bySlug.get(a)) : esc(a))).join(', ')}</small>` : ''}</td><td>${esc(x.how)}</td><td>${esc(x.shows)}${x.buttons.length ? `<br><small>controls: ${x.buttons.map(esc).join(' · ')}</small>` : ''}</td><td>${x.files.web ? `${fileLink(x.files.web, 'open')} <small>${pct(x.score.web)}</small>` : '—'}</td><td>${x.files.responsive ? `${fileLink(x.files.responsive, 'open')} <small>${pct(x.score.responsive)}</small>` : '—'}</td></tr>`).join('\n')}
</table>`).join('\n')}
<h2>Made of</h2>
<p>The components on the page itself, most used first (a state’s own additions are listed beside it above).</p>
<p><strong>Web:</strong> ${s.components.slice(0, 30).map((c) => `${compLink(c)} <small>${c.count}×</small>`).join(' · ') || '—'}</p>
<p><strong>Responsive:</strong> ${s.componentsResponsive.slice(0, 30).map((c) => `${compLink(c)} <small>${c.count}×</small>`).join(' · ') || '—'}</p>
${s.onlyResponsive.length ? `<p><strong>Only in the responsive layout:</strong> ${s.onlyResponsive.map((x) => (bySlug.get(x) ? compLink(bySlug.get(x)) : esc(x))).join(' · ')}</p>` : ''}
${s.onlyWeb.length ? `<p><strong>Only in the web layout:</strong> ${s.onlyWeb.map((x) => (bySlug.get(x) ? compLink(bySlug.get(x)) : esc(x))).join(' · ')}</p>` : ''}
<h2>What the page says</h2>
<p><small>As rendered on the fixture account — labels are the product’s copy; names, numbers and listings are invented.</small></p>
<p>${s.lines.slice(0, 50).map(esc).join(' · ')}</p>
`;
  writeFileSync(join(OUT, `${s.slug}.html`), page(s.title, `<a href="index.html">Screens &amp; states</a> › ${esc(s.title)}`, body));
}
const idx = `<h1>Screens &amp; states</h1>
<p>Every screen the design system compiled, and every state of it — ${kb.counts.states} states over ${kb.counts.screens} screens, ${kb.counts.web} web files (1440) and ${kb.counts.responsive} responsive files (375). Each screen’s page says what it is for, what it is made of, and how to reach each state, with the file to open.</p>
<p><strong>Designing from a PRD?</strong> Search this instead of guessing a file name: <code>node scripts/design-find.mjs "mark a daily rental as booked"</code> lists the screens, states and components that match, best first, with their files. The same index is <code>data/design-kb.json</code>.</p>
<table>
<tr><th>screen</th><th>route</th><th>what it is for</th><th>states</th><th>web</th><th>responsive</th></tr>
${screens.map((s) => `<tr><td><a href="${s.slug}.html">${esc(s.title)}</a></td><td><code>${esc(s.route)}</code></td><td>${esc(s.purpose.split(' — ').slice(1).join(' — ') || s.purpose)}</td><td>${s.states.length}</td><td>${fileLink(s.files.web, 'page')}</td><td>${fileLink(s.files.responsive, 'page')}</td></tr>`).join('\n')}
</table>
${Object.keys(flows).length ? `<h2>Flows</h2>
<p>End-to-end journeys, step by step. Open a step and press → / ← (or its primary button) to walk the flow in the prototype.</p>
<table>
<tr><th>flow</th><th>steps</th></tr>
${Object.entries(flows).map(([k, st]) => `<tr><td><strong>${esc(k.replace(/-/g, ' '))}</strong></td><td>${st.map((x) => `${String(x.step).padStart(2, '0')} ${x.files.web ? fileLink(x.files.web, x.what) : esc(x.what)}${x.files.responsive ? ` <small>(${fileLink(x.files.responsive, 'phone')})</small>` : ''} <small>on ${esc(x.screen)}</small>`).join('<br>')}</td></tr>`).join('\n')}
</table>` : ''}
<h2>By kind</h2>
<table>
<tr><th>kind</th><th>states</th><th>where</th></tr>
${KIND_ORDER.map((k) => [k, screens.flatMap((s) => s.states.filter((x) => x.kind === k).map((x) => [s, x]))]).filter(([, l]) => l.length).map(([k, l]) => `<tr><td>${esc(KIND_TITLE[k])}</td><td>${l.length}</td><td>${[...new Set(l.map(([s]) => s.slug))].map((sl) => `<a href="${sl}.html">${esc(sl)}</a>`).join(' · ')}</td></tr>`).join('\n')}
</table>
`;
writeFileSync(join(OUT, 'index.html'), page('Screens & states', 'Screens &amp; states', idx));

/* kb/index.html is generated by scripts/kb.mjs; link this section into it */
const kbIndex = join(ROOT, 'kb', 'index.html');
if (existsSync(kbIndex)) {
  let h = readFileSync(kbIndex, 'utf8').replace(/\n?<!-- design-kb -->[\s\S]*?<!-- \/design-kb -->/, '');
  const block = `\n<!-- design-kb --><h2 id="screens">Screens &amp; states</h2>\n<p><a href="screens/index.html">Every compiled screen and state</a>, web and responsive — what each shows, how to reach it, the file to open. Search it with <code>node scripts/design-find.mjs "&lt;words&gt;"</code>.</p><!-- /design-kb -->`;
  h = h.includes('</main>') ? h.replace('</main>', `${block}\n</main>`) : h + block;
  writeFileSync(kbIndex, h);
}
console.log(`  data/design-kb.json — ${kb.counts.screens} screens · ${kb.counts.states} states · ${kb.counts.web} web files · ${kb.counts.responsive} responsive · ${kb.counts.components} components (read ${n} files)`);
console.log(`  kb/screens/ — ${screens.length + 1} pages`);
