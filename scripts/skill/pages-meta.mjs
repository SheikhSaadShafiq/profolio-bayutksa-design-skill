/**
 * What a session needs to know about pages, states, roles, routes, flows and
 * the fixture's clock — measured from the product's routes source and the
 * compiled files, for scripts/package.mjs (sections 8 and 9).
 *
 *   routes        the product's own route patterns (src/tenant/common/routes/
 *                 appRoutes.js — KSA adds none: src/tenant/bayut/routes/index.js
 *                 is {}), matched to the URL the recorder visited, which is kept
 *                 as fixture_url: /post-listing/:id/upgrade, not /88241126/
 *   headings      a compiled file's main heading, primary button and toast,
 *                 read statically (the open modal or drawer first, else the
 *                 page's content — never the header or the rail)
 *   flows         registry.flows steps as {id, heading, primary, toast?, base?}
 *   roles         a state's role from its name (as-staff, as-individual,
 *                 <state>-as-staff, <state>-as-individual; any other is the
 *                 owner fixture) but for the few states compiled for another
 *                 account (the harness step's fixture mode, design-kb.json:
 *                 compiledFor, stateRolesFor); the pages a role has no route
 *                 to or gets as another component, the states a role cannot
 *                 open, the ones that show the owner's credits
 *   clock         the moment the fixture was recorded, from data/live/*.capture.json
 *   roles.md / routes.md   their text
 *
 * Node stdlib only. Sections 0–6 are pure functions over strings and plain
 * objects; the readers of the disk are loadRoutesSource(), capturedAt() and
 * section 7 (routesFor, flowsFor, clockFor, productTexts — what package.mjs
 * calls), and they only read. Nothing here writes a file.
 */
import { readFileSync, readdirSync, existsSync, openSync, readSync, closeSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { execSync } from 'node:child_process';

/* ── 0 · a tiny JS scanner: brackets, strings, template literals, comments ── */
/* every bracket pair in a JS source, strings and comments skipped:
   { open: Map(openIndex → closeIndex), parent: Map(openIndex → enclosing openIndex) } */
function brackets(src) {
  const open = new Map(), parent = new Map(), stack = [], tmpl = [];
  const CLOSE = { ')': '(', ']': '[', '}': '{' };
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (c === '/' && src[i + 1] === '/') { i = src.indexOf('\n', i); if (i < 0) break; continue; }
    if (c === '/' && src[i + 1] === '*') { i = src.indexOf('*/', i + 2) + 1; if (i <= 0) break; continue; }
    if (c === '"' || c === "'") { for (i++; i < src.length && src[i] !== c; i++) if (src[i] === '\\') i++; continue; }
    if (c === '`' || (c === '}' && tmpl.length && tmpl[tmpl.length - 1] === stack.length)) {
      /* a template literal's text, up to its end or its next ${ */
      if (c === '}') { tmpl.pop(); }
      for (i++; i < src.length; i++) {
        if (src[i] === '\\') { i++; continue; }
        if (src[i] === '`') break;
        if (src[i] === '$' && src[i + 1] === '{') { i++; tmpl.push(stack.length); break; }
      }
      continue;
    }
    if (c === '(' || c === '[' || c === '{') { parent.set(i, stack.length ? stack[stack.length - 1] : -1); stack.push(i); }
    else if (CLOSE[c]) { const o = stack.pop(); if (o !== undefined) open.set(o, i); }
  }
  return { open, parent };
}
const lineAt = (src, i) => src.slice(0, i).split('\n').length;
const strip = (s) => s.replace(/\/\/[^\n]*|\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ').trim();

/* ── 1 · routes: the product's patterns ───────────────────────────────── */
/**
 * Every route object in appRoutes.js: { key, path, component, line, gate, public, memberArea, premium, agencyPage, permission }.
 * `path` has the app's `${path}` prefix taken away (router.js calls app('', …));
 * a settings sub-route is composed under its parent's route (/user-settings/licenses).
 * `gate` is every condition the object sits behind (the ...(cond && {…}) and
 * ...(cond ? […] : []) spreads around it), as written.
 * @param {string} src  the text of src/tenant/common/routes/appRoutes.js
 */
export function parseRoutes(src) {
  const { open, parent } = brackets(src);
  const out = [];
  const tpl = (s) => s.replace(/\$\{path\}/g, '');
  /* the function a position sits in: `const name = (…) =>` before its body */
  const fnOf = (i) => {
    let best = null;
    for (const m of src.matchAll(/const (\w+) = \([^)]*\) => /g)) if (m.index < i) best = m[1];
    return best;
  };
  /* the conditions around an object: walk up its enclosing brackets; a
     '(' right after '...' opens a spread, and its text up to the bracket
     holding the object is the condition */
  const gateOf = (at) => {
    const conds = [];
    let child = at;
    for (let p = parent.get(at); p !== undefined && p >= 0; child = p, p = parent.get(p)) {
      if (src[p] !== '(' || !/\.\.\.\s*$/.test(src.slice(Math.max(0, p - 6), p))) continue;
      let cond = src.slice(p + 1, child);
      const q = topLevelIndex(cond, '?');
      if (q > -1) {
        const colon = topLevelIndex(cond.slice(q + 1), ':');
        cond = colon > -1 ? `!(${cond.slice(0, q)})` : cond.slice(0, q);
      } else cond = cond.replace(/&&\s*$/, '');
      conds.unshift(strip(cond));
    }
    return conds;
  };
  const topLevelIndex = (s, ch) => {
    let d = 0;
    for (let i = 0; i < s.length; i++) {
      const c = s[i];
      if (c === '(' || c === '[' || c === '{') d++;
      else if (c === ')' || c === ']' || c === '}') d--;
      else if (c === ch && d === 0 && !(ch === '?' && (s[i + 1] === '.' || s[i + 1] === '?'))) return i;
    }
    return -1;
  };
  for (const m of src.matchAll(/\bpath:\s*(`[^`]*`|'[^']*')/g)) {
    /* the object literal the path is a property of: the innermost { … } around it */
    const o = [...open.keys()].filter((k) => src[k] === '{' && k < m.index && open.get(k) > m.index).sort((a, b) => b - a)[0];
    if (o === undefined) continue;
    const body = src.slice(o, open.get(o) + 1);
    const prop = (k) => { const r = body.match(new RegExp(`\\b${k}:\\s*(\`[^\`]*\`|'[^']*'|[^,\\n}]+)`)); return r ? strip(r[1]) : null; };
    const key = (src.slice(Math.max(0, o - 60), o).match(/(\w+):\s*$/) || [])[1] || null;
    const fn = fnOf(o);
    out.push({
      key, fn, path: tpl(m[1].slice(1, -1)), route: prop('route') && tpl(prop('route').replace(/^[`']|[`']$/g, '')),
      component: (prop('Component') || '').replace(/^'|'$/g, ''), line: lineAt(src, m.index), gate: gateOf(o),
      public: fn === 'publicRoutes', memberArea: prop('isMemberArea') === 'true', premium: prop('isPremiumUserPage') === 'true',
      agencyPage: prop('isAgencyPage') === 'true', permission: prop('permission'), subRoutes: (body.match(/subRoutes:\s*(\w+)\(/) || [])[1] || null,
    });
  }
  /* a sub-route list's entries sit under the route that names it */
  for (const r of out.filter((x) => x.subRoutes)) {
    const base = (r.route || r.path.replace(/\/\*$/, ''));
    for (const s of out.filter((x) => x.fn === r.subRoutes)) {
      s.path = base + s.path;
      s.gate = [...r.gate, ...s.gate];
      s.under = r.key;
    }
  }
  return out;
}

/**
 * The product route a recorded URL was taken from: the pattern whose literal
 * segments match most (a wildcard route loses to a precise one), with the
 * URL's query keys as :placeholders — the page reads them (checkout.js:65
 * cart_id, invite-user.js:101 token). `src` is every route object with that
 * pattern (/user-settings/licenses is two: LicensesPage for a user who is not
 * the agency admin, AgencyLicensesPage for the admin).
 * @returns {{route: string, fixture_url?: string, src: object[]}|null}
 */
export function matchRoute(url, routes) {
  const [pathPart, query = ''] = url.split('?');
  let best = null;
  for (const r of routes) {
    if (r.subRoutes) continue;
    const segs = r.path.split('/').filter(Boolean);
    const re = new RegExp(`^/${segs.map((x) => (x === '*' ? '.*' : x.startsWith(':') ? '[^/]+' : x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))).join('/')}/?$`);
    if (!re.test(pathPart)) continue;
    const score = segs.filter((x) => x !== '*' && !x.startsWith(':')).length * 10 - segs.filter((x) => x === '*').length * 5 - segs.filter((x) => x.startsWith(':')).length;
    if (!best || score > best.score) best = { score, list: [r] };
    else if (score === best.score && r.path === best.list[0].path) best.list.push(r);
  }
  if (!best) return null;
  const keys = query ? query.split('&').map((kv) => kv.split('=')[0]).filter(Boolean) : [];
  const route = best.list[0].path + (keys.length ? `?${keys.map((k) => `${k}=:${k}`).join('&')}` : '');
  return { route, ...(route !== url ? { fixture_url: url } : {}), src: best.list };
}

/**
 * Every page's route: { [slug]: matchRoute(recorded URL) }. A page whose URL
 * no pattern matches keeps its recorded URL as route, and is named in `unmatched`.
 * KSA's own routes (src/tenant/bayut/routes/index.js) are spread over the
 * common ones (routes/index.js); they are {} at the product's commit, and
 * anything else is named in `warning`, since this reads the common file only.
 * @param {Record<string,string>} recorded  slug → the URL the recorder visited (scripts/pages-list.mjs ALL)
 */
export function pageRoutes(appRoutesSrc, recorded, tenantSrc = null) {
  const routes = parseRoutes(appRoutesSrc);
  const out = {}, unmatched = [];
  for (const [slug, url] of Object.entries(recorded)) {
    const m = matchRoute(url, routes);
    if (m) out[slug] = m; else { out[slug] = { route: url }; unmatched.push(slug); }
  }
  const warning = tenantSrc !== null && !/^\s*export default \{\s*\};?\s*$/.test(tenantSrc) ? 'src/tenant/bayut/routes/index.js is not {} — its routes override the common ones and are not read' : null;
  return { routes: out, unmatched, all: routes, warning };
}

/**
 * Who the product gives each page's route to, as appRoutes.js writes it: the
 * conditions its object sits behind, and what app(…, asArray) filters on
 * (home.js routes only that list): a route without isMemberArea, or with
 * isPremiumUserPage, needs user.is_package_user (the member area is the
 * users without one); isAgencyPage needs user.agency; a permission needs
 * user.permissions[it].
 * @returns {Record<string, {route: string, lines: number[], when: string[][]}>}  one `when` per route object
 */
export function routeGates(routes) {
  const out = {};
  for (const [slug, m] of Object.entries(routes)) {
    if (!m.src) continue;
    const when = m.src.map((r) => [
      ...r.gate,
      /* a member-area user (not a package user) is given only isMemberArea routes; isPremiumUserPage asks the same */
      ...(!r.public && !r.under && (!r.memberArea || r.premium) ? ['user.is_package_user'] : []),
      ...(!r.under && r.agencyPage ? ['user.agency'] : []),
      ...(!r.under && r.permission ? [`user.permissions[${r.permission}]`] : []),
    ].concat(m.src.length > 1 ? [`→ ${r.component}`] : []));
    if (when.some((w) => w.length)) out[slug] = { route: m.route, lines: m.src.map((r) => r.line), when };
  }
  return out;
}

/** where the product checkout is (build.mjs: ../profolio-reactjs, or PROFOLIO_REPO), its appRoutes.js and commit */
export function loadRoutesSource(root, repo = process.env.PROFOLIO_REPO ? resolve(root, process.env.PROFOLIO_REPO) : join(root, '..', 'profolio-reactjs')) {
  const file = join(repo, 'src', 'tenant', 'common', 'routes', 'appRoutes.js');
  if (!existsSync(file)) return null;
  const tenant = join(repo, 'src', 'tenant', 'bayut', 'routes', 'index.js');
  let commit = null;
  try { commit = execSync('git rev-parse --short HEAD', { cwd: repo, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch {}
  return { src: readFileSync(file, 'utf8'), tenantSrc: existsSync(tenant) ? readFileSync(tenant, 'utf8') : null, commit, file: 'src/tenant/common/routes/appRoutes.js' };
}

/* ── 2 · reading a compiled file: heading, primary button, toast ──────── */
const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr', 'param']);
const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
const decode = (s) => (s.indexOf('&') < 0 ? s : s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
  if (e[0] === '#') { const n = /^#x/i.test(e) ? parseInt(e.slice(2), 16) : +e.slice(1); return Number.isFinite(n) ? String.fromCodePoint(n) : m; }
  return ENT[e.toLowerCase()] ?? m;
}));
const TAG = /<!--[\s\S]*?-->|<(\/?)([a-zA-Z][\w:-]*)((?:\s+[^\s=>/]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?)*)\s*(\/?)>/g;
const ATTR = /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;

/** the compiled file's body as a tree of { tag, a: attrs, k: children (nodes or strings), p: parent } */
export function parseHtml(html) {
  const start = html.search(/<body\b/i);
  const src = start > -1 ? html.slice(start) : html;
  const root = { tag: '#root', a: {}, k: [], p: null };
  let cur = root, last = 0, m;
  TAG.lastIndex = 0;
  while ((m = TAG.exec(src))) {
    if (m.index > last && cur.tag !== 'script' && cur.tag !== 'style') { const t = src.slice(last, m.index); if (t.trim()) cur.k.push(decode(t)); }
    last = TAG.lastIndex;
    if (m[0].startsWith('<!--') || !m[2]) continue;
    const tag = m[2].toLowerCase();
    if (m[1]) { for (let x = cur; x && x !== root; x = x.p) if (x.tag === tag) { cur = x.p; break; } continue; }
    const a = {};
    for (const at of m[3].matchAll(ATTR)) a[at[1].toLowerCase()] = decode(at[2] ?? at[3] ?? at[4] ?? '');
    const el = { tag, a, k: [], p: cur };
    cur.k.push(el);
    if (tag === 'script' || tag === 'style') {
      const end = src.indexOf(`</${tag}`, last);
      last = TAG.lastIndex = end < 0 ? src.length : end;
      cur = el;
      continue;
    }
    if (!VOID.has(tag) && !m[4]) cur = el;
  }
  return root;
}
const cls = (el) => (el.a && el.a.class ? el.a.class.split(/\s+/) : []);
const has = (el, c) => cls(el).includes(c);
const hiddenSelf = (el) => {
  const st = (el.a.style || '').replace(/\s+/g, '');
  return /display:none|visibility:hidden/.test(st) || 'hidden' in el.a
    || cls(el).some((c) => /^pf-(popover|dropdown|select-dropdown|tooltip|picker-dropdown)-hidden$/.test(c) || c === 'pf-drawer-content-wrapper-hidden');
};
const hidden = (el) => { for (let x = el; x && x.tag !== '#root'; x = x.p) if (typeof x === 'object' && hiddenSelf(x)) return true; return false; };
const walk = function* (el) { for (const k of el.k) if (typeof k === 'object') { yield k; yield* walk(k); } };
export const textOf = (el) => (typeof el === 'string' ? el : el.tag === 'script' || el.tag === 'style' || el.tag === 'svg' ? '' : el.k.map(textOf).join(' ')).replace(/\s+/g, ' ').trim();
const first = (scope, test) => { for (const el of walk(scope)) if (test(el) && !hidden(el)) return el; return null; };
const inside = (el, test) => { for (let x = el.p; x && x.tag !== '#root'; x = x.p) if (test(x)) return true; return false; };
const HEADING = /^h[1-6]$/;
const isPrimary = (el) => el.tag === 'button' && has(el, 'pf-btn-primary');
const isButton = (el) => el.tag === 'button' && has(el, 'pf-btn') && !has(el, 'pf-modal-close') && !has(el, 'pf-drawer-close');
const label = (el) => { const t = textOf(el); return t ? t + ('disabled' in el.a ? ' (disabled)' : '') : null; };

/**
 * What a compiled file shows first: the open modal's or drawer's title and
 * its primary button when one is open, else the content's first heading and
 * its first primary button (the header and the rail are not the page); and
 * the toast, when one is up.
 * @returns {{heading: string|null, primary: string|null, toast?: string, over?: 'modal'|'drawer'}}
 */
export function readHead(html) {
  const doc = parseHtml(html);
  const overlays = [];
  for (const el of walk(doc)) {
    if (has(el, 'pf-modal-wrap') && !hidden(el)) { const m = first(el, (x) => has(x, 'pf-modal')); if (m) overlays.push(['modal', m]); }
    else if (has(el, 'pf-drawer') && has(el, 'pf-drawer-open') && !hidden(el)) { const d = first(el, (x) => has(x, 'pf-drawer-content')); if (d) overlays.push(['drawer', d]); }
  }
  const content = first(doc, (x) => x.tag === 'main' && has(x, 'pf-layout-content')) || doc;
  const shell = (x) => has(x, 'pf-layout-header') || has(x, 'pf-layout-sider');
  let heading = null, primary = null, over;
  if (overlays.length) {
    const [kind, top] = overlays[overlays.length - 1];
    over = kind;
    const t = first(top, (x) => (has(x, 'pf-modal-title') || has(x, 'pf-drawer-title') || HEADING.test(x.tag)) && textOf(x));
    heading = t ? textOf(t) : null;
    const b = first(top, isPrimary) || [...walk(top)].filter((x) => isButton(x) && !hidden(x)).pop();
    primary = b ? label(b) : null;
  }
  /* the content's heading: an h1–h6 drawn as one (a Title the product sets
     below 16px is a label — the form's "Main Features"), else the first
     card's title (checkout's "Payment Method"); a page with neither has none */
  const size = (x) => { const m = (x.a.style || '').match(/font-size:\s*([\d.]+)px/); return m ? +m[1] : null; };
  if (!heading) {
    const h = first(content, (x) => HEADING.test(x.tag) && !inside(x, shell) && textOf(x) && !((size(x) ?? 16) < 16))
      || first(content, (x) => has(x, 'pf-card-head-title') && !inside(x, shell) && textOf(x));
    heading = h ? textOf(h) : null;
  }
  if (!primary && !over) { const b = first(content, (x) => isPrimary(x) && !inside(x, shell) && textOf(x)); primary = b ? label(b) : null; }
  const n = first(doc, (x) => has(x, 'pf-message-notice-content') || has(x, 'pf-notification-notice-message'));
  const toast = n ? textOf(n) : '';
  return { heading, primary, ...(toast ? { toast } : {}), ...(over ? { over } : {}) };
}

/* ── 3 · flows: each step's own heading and primary action ────────────── */
/**
 * registry.flows, as step objects read from each step's compiled file. A
 * step drawn in place (no modal or drawer) whose heading is not its page
 * file's carries `base`: what the page file itself — and so every other state
 * of that page — shows. post-listing-upgrade's steps 9–10 are the posted
 * upsell; pages/post-listing-upgrade.html is the draft ("Almost There!" ·
 * Post Listing), and inline-insufficient-credits is one of the draft's states.
 * `primary` is the first primary button the step shows (the open modal's or
 * drawer's, else the content's), "(disabled)" when it is.
 * @param {Record<string, {screen: string, state: string}[]>} kbFlows  design-kb.json → flows
 * @param {(page: string, state: string|null) => string|null} htmlOf  the step's (or, with null, the page's) web file — or its 375 one — as text
 * @returns {Record<string, {id: string, heading: string|null, primary: string|null, toast?: string, base?: string}[]>}
 */
export function flowSteps(kbFlows, htmlOf) {
  const out = {}, bases = new Map();
  const baseOf = (page) => { if (!bases.has(page)) { const h = htmlOf(page, null); bases.set(page, h ? readHead(h) : null); } return bases.get(page); };
  for (const [name, steps] of Object.entries(kbFlows || {})) {
    out[name] = steps.map((s) => {
      const html = htmlOf(s.screen, s.state);
      const h = html ? readHead(html) : { heading: null, primary: null };
      const b = !h.over && h.heading ? baseOf(s.screen) : null;
      const base = b && b.heading && b.heading !== h.heading ? `${b.heading}${b.primary ? ` · ${b.primary}` : ''}` : null;
      return { id: `${s.screen}/${s.state}`, heading: h.heading, primary: h.primary, ...(h.toast ? { toast: h.toast } : {}), ...(base ? { base } : {}) };
    });
  }
  return out;
}

/* ── 4 · roles: a state's role is in its name ─────────────────────────── */
export const ROLE_SUFFIX = { staff: 'as-staff', individual: 'as-individual' };
/** 'staff' | 'individual' | 'owner' — as-staff, <state>-as-staff …; every other state is the owner fixture */
export function stateRole(state) {
  const n = String(state).split('@')[0];
  for (const [role, s] of Object.entries(ROLE_SUFFIX)) if (n === s || n.endsWith(`-${s}`)) return role;
  return 'owner';
}
/** the state a role variant is of: modal-x-as-staff → modal-x; as-staff → '' (the page itself) */
export const roleBase = (state) => String(state).split('@')[0].replace(/(^|-)as-(staff|individual)$/, '');

/** the account a harness fixture mode signs in as: `staff` and `individual`
    (alone or after a data mode, `lf-low-credits+staff`), `member` (a user
    with no package: the member area); any other mode is the owner's
    account with other data (empty, error, form-fail, non-saudi …) */
export function modeRole(mode) {
  const m = String(mode || '');
  for (const role of Object.keys(ROLE_SUFFIX)) if (m === role || m.endsWith(`+${role}`)) return role;
  return m === 'member' ? 'member' : 'owner';
}

/**
 * The states compiled for another account than their name says — the
 * exceptions to "a state's role is in its name": the harness step's fixture
 * mode (harness/interactions/*.mjs `mode`, carried into data/design-kb.json)
 * signs in as a role the name does not carry. At the time of writing:
 * user-settings-user-profile/modal-convert-to-agency (mode individual —
 * only the individual broker has Convert to Agency) and the member area's
 * two (mode member). One entry per compiled file: a design-kb state pairs
 * its web file and its 375 one, whose name can differ.
 * @param {{screens?: {slug: string, states?: {name: string, mode?: string|null, files?: Record<string, string|null>}[]}[]}} kb
 * @returns {{page: string, state: string, device: 'web'|'mobile', role: string, mode: string}[]}
 */
export function compiledFor(kb) {
  const out = [];
  for (const sc of (kb && kb.screens) || []) for (const x of sc.states || []) {
    if (!x.mode) continue;
    const role = modeRole(x.mode);
    for (const [dev, rel] of Object.entries(x.files || {})) {
      const m = String(rel || '').match(/(?:^|\/)([a-z0-9-]+?)--([^/]+)\.html$/);
      if (!m || m[1] !== sc.slug || stateRole(m[2]) === role) continue;
      out.push({ page: sc.slug, state: m[2], device: dev === 'web' ? 'web' : 'mobile', role, mode: x.mode });
    }
  }
  return out;
}

/**
 * registry.pages[x].state_roles: { state: account } for the states of a page
 * compiled for another account than their name says (compiledFor). A state
 * not listed is the account its name gives (stateRole). Only the pages that
 * have one; a state's two layouts are one entry (they agree).
 * @param {Record<string, {states: string[]}>} pages  registry.pages
 */
export function stateRolesFor(pages, kb) {
  const out = {};
  for (const e of compiledFor(kb)) {
    if (!pages[e.page] || !(pages[e.page].states || []).some((s) => s.split('@')[0] === e.state)) continue;
    (out[e.page] ||= {})[e.state] = e.role;
  }
  return out;
}

/**
 * The controls on a compiled page file that open one of its states: every
 * element compile.mjs marked with data-pf-go (the harness's and the
 * explorer's triggers, marked before the freeze), outside the header and the
 * rail — the shell is every account's. Its label is its own text, its
 * aria-label or title, else — an icon, a switch — the text around it: the
 * nearest ancestor that has any, up to four levels and 60 characters (the
 * licence card's switch → "Share with agency staff", the agency selector's
 * icon → the agency's name). null when there is none.
 * @returns {{state: string, label: string|null}[]}
 */
export function pageTriggers(html, page) {
  const doc = parseHtml(html);
  const shell = (x) => has(x, 'pf-layout-header') || has(x, 'pf-layout-sider');
  const out = [];
  for (const el of walk(doc)) {
    const go = el.a['data-pf-go'];
    if (!go || shell(el) || inside(el, shell)) continue;
    /* deliverables/: states/<page>--<state>.html; skill/pages/: <page>/<state>[.mobile].html */
    const m = go.match(/^(?:states\/)?([a-z0-9-]+?)--([^/]+?)\.html$/) || go.match(/^([a-z0-9-]+)\/([^/]+?)(?:\.mobile)?\.html$/);
    if (!m || (page && m[1] !== page)) continue;
    let label = textOf(el) || el.a['aria-label'] || el.a.title || null;
    if (!label) for (let x = el.p, n = 0; x && x.tag !== '#root' && n < 4; x = x.p, n++) {
      const t = textOf(x);
      if (t) { label = t.length <= 60 ? t : null; break; }
    }
    out.push({ state: m[2], label });
  }
  return out;
}

const GENERIC_LABEL = /^(icon|svg|div|span|img|button|a|li|p|x|i|input|label|textarea|select)$/i;

/**
 * The states a role cannot reach: the control that opens them is on one
 * account's render of the page and not on the role's own render of it (same
 * page, same layout). A label with a digit is fixture data and is never
 * compared, nor a generic one ("icon", "svg"), nor one the page does not show.
 *
 *   owner states   the trigger is the element on the owner's page file that
 *                  links to the state (pageTriggers), else the explorer's
 *                  trigger label; looked for on as-staff and as-individual.
 *                  A state stays reachable when another state of the page
 *                  opens the same modal or drawer (its title and primary
 *                  button) from a control the role has — the phone's feedback
 *                  sheet, which the explorer also reached from an icon, is
 *                  opened by the FEEDBACK tab on every render
 *   another account's  (compiledFor) the trigger is the open overlay's title
 *                  when that account's own render draws it (Convert to
 *                  Agency on as-individual), looked for on the owner's page
 *                  and on the other role's render
 *
 * A state's own descendants (<state>__…) go with it.
 * @param {{page: string, device: string, states: {name: string, label?: string, shell?: boolean}[], nested?: object[]}[]} explored  data/states/*.json (+ mobile/)
 * @param {(page: string, device: string, state: string|null) => string|null} textOfFile  a compiled file's visible text lines, joined by \n
 * @param {Record<string, string[]>} allStates  page → registry states
 * @param {object} [o]
 * @param {(page: string, device: string) => {state: string, label: string|null}[]} [o.triggers]  pageTriggers() of the owner's page file
 * @param {(page: string, device: string, state: string) => {heading: string|null, primary: string|null, over?: string}|null} [o.head]  readHead() of a state's file
 * @param {object[]} [o.others]  compiledFor()
 * @returns {{page: string, state: string, device: string, trigger: string, not: string[], from?: string}[]}
 */
export function unreachable(explored, textOfFile, allStates, { triggers = () => [], head = () => null, others = [] } = {}) {
  const out = [];
  const lines = (t) => new Set(t.split('\n'));
  const renders = (page, device) => {
    const R = {};
    for (const role of Object.keys(ROLE_SUFFIX)) { const t = textOfFile(page, device, ROLE_SUFFIX[role]); if (t) R[role] = lines(t); }
    return R;
  };
  const kinOf = (page, name) => { const kin = (allStates[page] || []).map((s) => s.split('@')[0]).filter((s) => s === name || s.startsWith(`${name}__`)); return kin.length ? kin : [name]; };
  const usable = (lab, B) => !!lab && !/\d/.test(lab) && !GENERIC_LABEL.test(lab) && B.has(lab);
  const other = new Set(others.map((e) => `${e.page}|${e.device}|${e.state}`));
  /* the modal or drawer a state opens: its title and primary button (the last segment of a nested name is what is on top) */
  const keyOf = (page, device, name) => {
    if (!/^(modal|drawer)-/.test(name.split('__').pop())) return null;
    const h = head(page, device, name);
    return h && h.over && h.heading ? `${device}|${h.over}|${h.heading}|${h.primary || ''}` : null;
  };
  /* the owner's states, page by page and layout by layout */
  const byPage = new Map();
  for (const d of explored) byPage.set(`${d.page}|${d.device}`, d);
  const found = [];
  const openers = new Map();                         /* overlay → every label seen opening it, any page of the layout */
  for (const k of new Set([...byPage.keys(), ...Object.keys(allStates).flatMap((p) => ['web', 'mobile'].map((dev) => `${p}|${dev}`))])) {
    const [page, device] = k.split('|');
    const base = textOfFile(page, device, null);
    if (!base) continue;
    const B = lines(base), R = renders(page, device);
    if (!Object.keys(R).length) continue;
    const d = byPage.get(k) || { states: [], nested: [] };
    const shellState = new Set((d.states || []).filter((s) => s.shell).map((s) => s.name));
    /* each state's trigger label: the linked control first, the explorer's label else */
    const trig = new Map();
    for (const t of triggers(page, device)) if (!trig.has(t.state) && !shellState.has(t.state)) trig.set(t.state, t.label);
    for (const st of [...(d.states || []), ...(d.nested || [])]) if (!st.shell && !(trig.has(st.name) && usable(trig.get(st.name), B))) trig.set(st.name, (st.label || '').trim());
    for (const [name, lab] of trig) {
      if (other.has(`${page}|${device}|${name}`) || stateRole(name) !== 'owner' || !usable(lab, B)) continue;
      const f = { page, device, name, lab, R, not: Object.keys(R).filter((r) => !R[r].has(lab)) };
      found.push(f);
      if (!f.not.length) { const key = keyOf(page, device, name); if (key) (openers.get(key) || openers.set(key, new Set()).get(key)).add(lab); }
    }
  }
  /* a state stays reachable when the same modal or drawer is opened — on this
     page or another of the layout — by a control the role's render has */
  for (const f of found) {
    if (!f.not.length) continue;
    const key = keyOf(f.page, f.device, f.name);
    const alt = key && openers.has(key) ? [...openers.get(key)] : [];
    const not = f.not.filter((r) => !alt.some((l) => f.R[r].has(l)));
    if (not.length) for (const s of kinOf(f.page, f.name)) out.push({ page: f.page, state: s, device: f.device, trigger: f.lab, not });
  }
  /* the states compiled for another account: their trigger on that account's render */
  const ACCOUNT_RENDER = { owner: null, ...ROLE_SUFFIX };
  for (const e of others) {
    if (!(e.role in ACCOUNT_RENDER)) continue;                   /* the member area has no render of its own to look on */
    const own = textOfFile(e.page, e.device, ACCOUNT_RENDER[e.role]);
    const h = head(e.page, e.device, e.state);
    const lab = h && h.over ? h.heading : null;
    if (!own || !usable(lab, lines(own))) continue;
    const not = Object.keys(ACCOUNT_RENDER).filter((r) => r !== e.role).filter((r) => { const t = textOfFile(e.page, e.device, ACCOUNT_RENDER[r]); return t && !lines(t).has(lab); });
    if (not.length) for (const s of kinOf(e.page, e.state)) out.push({ page: e.page, state: s, device: e.device, trigger: lab, not, from: e.role });
  }
  return out;
}

/* ── who each fixture account is, as the product's user object has it: the
   owner is the agency's admin (harness/fixtures/user.json agency_admin true),
   the staff user is not (harness/fixtures/profile.mjs STAFF_CURRENT
   agency_admin false), the individual has no agency and is not an admin
   (profile.mjs INDIVIDUAL: agency null, agency_admin false);
   transformers/user.js:98 makes agency_admin is_agency_admin. All three are
   package users — a user with none is the member area. ─────────────────── */
export const ROLE_FACTS = {
  owner: { is_agency_admin: true, agency: true, is_package_user: true },
  staff: { is_agency_admin: false, agency: true, is_package_user: true },
  individual: { is_agency_admin: false, agency: false, is_package_user: true },
};
/** whether a route object's conditions hold for an account: only the
    `user`, `user.x`, `!user.x` terms are read (joined by &&); any other term
    — a tenant constant, a permission — is the same for every account here
    and is taken as true. null when a term reads a fact not in ROLE_FACTS */
export function gateHolds(conds, facts) {
  for (const c of conds) for (const t of String(c).split('&&').map((s) => s.trim().replace(/^\((.*)\)$/, '$1'))) {
    const m = t.match(/^(!*)\s*user(?:\s*\.\s*(\w+))?$/);
    if (!m) continue;
    const v = m[2] ? facts[m[2]] : true;
    if (v === undefined) return null;
    if ((m[1].length % 2 ? !v : !!v) === false) return false;
  }
  return true;
}
/**
 * The pages whose one route is two components, chosen by who is signed in
 * (appRoutes.js: /user-settings/licenses is LicensesPage for a user who is
 * not the agency's admin, AgencyLicensesPage for the admin), where a role's
 * render is not the owner's (the content differs): that role sees another
 * component, and none of the owner's own content states is its.
 * @param {Record<string, {route: string, src?: {component: string, line: number, gate: string[]}[]}>} routes  routesFor().routes
 * @param {(page: string, role: string) => string[]|null} contentOf  contentLines of the web render
 * @returns {{page: string, owner: string, lines: number[], roles: {role: string, component: string}[]}[]}
 */
export function componentSwaps(routes, contentOf) {
  const out = [];
  for (const [page, m] of Object.entries(routes || {})) {
    if (!m.src || m.src.length < 2 || new Set(m.src.map((r) => r.component)).size < 2) continue;
    const pick = (role) => { const ok = m.src.filter((r) => gateHolds(r.gate || [], ROLE_FACTS[role]) === true); return ok.length === 1 ? ok[0].component : null; };
    const owner = pick('owner');
    if (!owner) continue;
    const mine = (contentOf(page, 'owner') || []).join('\n');
    const roles = Object.keys(ROLE_SUFFIX).map((role) => ({ role, component: pick(role) }))
      .filter((x) => x.component && x.component !== owner && contentOf(page, x.role) && contentOf(page, x.role).join('\n') !== mine);
    if (roles.length) out.push({ page, owner, lines: m.src.map((r) => r.line), roles });
  }
  return out;
}

/** a compiled file's visible text, one line per text node — the reader unreachable() compares */
export function visibleLines(html) {
  const doc = parseHtml(html);
  const out = [];
  const go = (el) => {
    if (el.tag === 'script' || el.tag === 'style' || el.tag === 'svg' || (el.tag !== '#root' && hiddenSelf(el))) return;
    for (const k of el.k) { if (typeof k === 'string') { const t = k.replace(/\s+/g, ' ').trim(); if (t) out.push(t); } else go(k); }
  };
  go(doc);
  /* a control's label is often split over nodes ("Get", "Titanium"): add each element's whole text too */
  for (const el of walk(doc)) if ((el.tag === 'button' || el.tag === 'a' || has(el, 'pf-dropdown-trigger')) && !hidden(el)) { const t = textOf(el); if (t) out.push(t); }
  return out.join('\n');
}

/* ── 5 · the fixture's clock ──────────────────────────────────────────── */
/**
 * The moment the fixture was recorded: the capture times of the compiled
 * files (data/live/<name>.capture.json → capturedAt, the product's render
 * frozen for each file). The fixture's dates are computed from that moment
 * (harness/fixtures.mjs day(): UTC midnight, n days back), so a relative date
 * on a page — "an hour ago", "3 days ago", Last 7 Days — is relative to it.
 * The harness browser sets no timezoneId (harness/page.mjs openPage), so it
 * renders a time of day in the compiling machine's zone; `zone` says which
 * (measured: see RENDER_ZONE).
 * @param {string[]} times  capturedAt ISO strings, one per compiled file
 */
export function fixtureClock(times, zone = RENDER_ZONE) {
  const ts = times.filter(Boolean).sort();
  if (!ts.length) return null;
  const at = (iso, h) => new Date(Date.parse(iso) + h * 36e5).toISOString().slice(0, 16).replace('T', ' ');
  const from = ts[0], to = ts[ts.length - 1];
  const days = [...new Set(ts.map((t) => at(t, 3).slice(0, 10)))];
  const span = (h) => (at(from, h).slice(0, 10) === at(to, h).slice(0, 10) ? `${at(from, h)}–${at(to, h).slice(11)}` : `${at(from, h)} – ${at(to, h)}`);
  return { day: days.length === 1 ? days[0] : `${days[0]}…${days[days.length - 1]}`, riyadh: span(3), utc: span(0), shown_in: `${zone.name} (UTC${zone.offset})`, files: ts.length };
}
/** a capture's capturedAt, read from its first bytes (data/live/*.capture.json run to megabytes) */
export function capturedAt(path) {
  if (!existsSync(path)) return null;
  const fd = openSync(path, 'r'), buf = Buffer.alloc(512);
  try { readSync(fd, buf, 0, 512, 0); } finally { closeSync(fd); }
  return (buf.toString('utf8').match(/"capturedAt":"([^"]+)"/) || [])[1] || null;
}
/** the capture of a compiled file: data/live/<page>[--<state>][--mobile].capture.json */
export const captureOf = (root, { page, state, dev }) => join(root, 'data', 'live', `${page}${state ? `--${state}` : ''}${dev === 'mobile' ? '--mobile' : ''}.capture.json`);

/* The zone the compiled pages show a time of day in — measured, not assumed:
   the lms fixture writes its times in Riyadh time (harness/fixtures/lms.mjs
   riyadh(), at(1, 12, 30) → 12:30+03:00) and the compiled page shows them two
   hours later (lms-leads.html "2:30 pm"; the lead drawer: 16:05 → "6:05 pm",
   21:14 → "11:14 pm", 9:37 → "11:37 am") — UTC+5, the compiling Mac's
   Asia/Karachi. Change it here if the harness is given timezoneId 'Asia/Riyadh'
   and the pages are compiled again. */
export const RENDER_ZONE = { name: 'Asia/Karachi', offset: '+5', hours: 5 };

/* ── 6 · the product/ texts ───────────────────────────────────────────── */
const row = (cells) => `| ${cells.join(' | ')} |`;

/**
 * product/routes.md
 * @param {{pages: object, PUBLIC: Set<string>, flows: object, routeSrc?: {file: string, commit: string|null}}} o
 */
export function routesMd({ pages, PUBLIC, flows, routeSrc = null, gates = {} }) {
  const esc = (s) => String(s).replace(/\|/g, '\\|');
  return `# Routes

Every compiled screen: its **route** — the product's own pattern, from \`${routeSrc ? routeSrc.file : 'src/tenant/common/routes/appRoutes.js'}\`${routeSrc && routeSrc.commit ? ` @ ${routeSrc.commit}` : ''} (KSA adds none) — the URL the fixture was recorded at, whether it needs a signed-in account, its files and its states. \`registry.json\` has the same (\`route\`, \`fixture_url\`), with aliases, components, flags and roles.

Quote the **route** (\`/post-listing/:id/upgrade\`) in a design and a QA note, never the fixture URL: its ids and tokens are the invented account's. A \`:placeholder\` after \`?\` is a query key the page reads.

${row(['page', 'route', 'fixture URL', 'title', 'access', 'web', '375', 'states'])}
${row(['---', '---', '---', '---', '---', '---', '---', '---'])}
${Object.entries(pages).map(([s, p]) => row([s, `\`${p.route}\``, p.fixture_url ? `\`${p.fixture_url}\`` : '=', p.title, PUBLIC.has(s) ? 'public' : 'signed in', `\`${p.file}\``, p.mobile ? `\`${p.mobile}\`` : '—', p.states.length])).join('\n')}
${Object.keys(gates).length ? `
## Who the product gives each route to

As \`appRoutes.js\` writes it: the conditions a route's object sits behind, and what \`app(…, asArray)\` filters the list on — \`home.js\` routes only that list, so a route a user fails renders nothing. A page not listed has none: any signed-in user, the member area's too (the public pages need no account).

${row(['page', 'route', 'appRoutes.js', 'only when'])}
${row(['---', '---', '---', '---'])}
${Object.entries(gates).map(([s, g]) => row([s, `\`${g.route}\``, g.lines.map((l) => `:${l}`).join(' '), g.when.map((w) => w.map((c) => (c.startsWith('→') ? c : `\`${esc(c)}\``)).join(' · ')).join('; or ')])).join('\n')}
` : ''}
## Flows

Numbered steps across pages; each step is a state file (\`pages/<page>/<state>.html\`), shown by its own heading and first primary button (\`registry.flows\`: \`{id, heading, primary, toast?, base?}\`; \`base\` is what the page file itself shows when a step drawn in place is not it). On a page, → and ← walk the flow and its primary button goes on.

${Object.entries(flows).map(([n, steps]) => `**${n}**\n\n${steps.map((x, i) => `${i + 1}. \`${x.id}\` — ${x.heading ? `“${x.heading}”` : 'no heading'}${x.primary ? ` · ${x.primary}` : ''}${x.toast ? ` · toast “${x.toast}”` : ''}${x.base ? ` — not \`pages/${x.id.split('/')[0]}.html\`, which is “${x.base.replace(' · ', '” · ')}${x.base.includes(' · ') ? '' : '”'}: that page's other states are drawn on it` : ''}`).join('\n')}`).join('\n\n')}
`;
}

/**
 * product/roles.md
 * @param {object} o
 * @param {Record<string, object>} o.pages  registry.pages
 * @param {Set<string>} o.PUBLIC  the pages with no account
 * @param {object|null} o.clock  fixtureClock()
 * @param {object[]} o.gaps  unreachable()
 * @param {object[]} o.redirects  roleRedirects() (web)
 * @param {Record<string, object>} o.gates  routeGates()
 * @param {{owner: object, staff: object, individual: object}} o.credit  creditsOf() of each role's dashboard
 * @param {object[]} o.creditList  creditStates()
 * @param {{heading: string, primary: string}|null} o.draft  readHead() of pages/post-listing-upgrade.html
 * @param {string|null} o.alert  the insufficient-credits alert, as its file shows it
 */
export function rolesMd({ pages, PUBLIC, clock, gaps = [], redirects = [], gates = {}, credit = null, creditList = [], draft = null, alert = null, others = [], swaps = [] }) {
  const acc = (s, name) => (pages[s] && pages[s].states.some((x) => x.split('@')[0] === name) ? '✓' : '—');
  const esc = (s) => String(s).replace(/\|/g, '\\|');
  const lay = (d) => (d === 'mobile' ? '375' : 'web');
  const WORD = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
  const count = (n) => WORD[n] || String(n);
  /* the states compiled for another account, one row per state (its layouts together) */
  const byOther = new Map();
  for (const e of others) { const k = `${e.page}/${e.state}`; const x = byOther.get(k) || byOther.set(k, { ...e, devices: new Set() }).get(k); x.devices.add(lay(e.device)); }
  const members = [...byOther.values()].filter((e) => e.role === 'member');
  const inRegistry = Object.values(pages).some((p) => p.state_roles);
  /* the agency selector, where a role has none: the gaps whose own file lists "<trigger> (Agency)" */
  const noSelector = (role) => [...new Set(gaps.filter((g) => g.selector && g.not.includes(role)).map((g) => g.page))];
  const selectorText = (role) => { const ps = noSelector(role); return ps.length ? `; no agency selector (${ps.map((p) => `\`${p}\``).join(', ')}: below)` : ''; };
  const variants = Object.entries(pages).flatMap(([p, e]) => e.states.filter((s) => stateRole(s) !== 'owner' && roleBase(s)).map((s) => `\`${p}/${s}\``));
  const byState = new Map();
  for (const g of gaps) { const k = `${g.page}/${g.state}`; const e = byState.get(k) || byState.set(k, { ...g, devices: new Set(), not: new Set() }).get(k); e.devices.add(g.device === 'mobile' ? '375' : 'web'); g.not.forEach((r) => e.not.add(r)); }
  const noRoute = new Map();
  for (const r of redirects) { const e = noRoute.get(r.page) || noRoute.set(r.page, { shows: r.shows, roles: [] }).get(r.page); e.roles.push(r.role); }
  const c = credit || {};
  const fig = (x) => (x ? `${x.available} available of ${x.total} (${x.used} used) · ${x.plan}` : '');
  const byPage = new Map();
  for (const x of creditList.filter((y) => y.shows)) (byPage.get(x.page) || byPage.set(x.page, { states: [], shows: new Set() }).get(x.page)).states.push(x.state), x.shows.forEach((v) => byPage.get(x.page).shows.add(v));
  const moded = creditList.filter((y) => y.mode);
  /* a state's role variants, where compiled: " (+ -as-staff, -as-individual)" */
  const withRoles = (p, st) => { const have = Object.values(ROLE_SUFFIX).filter((r) => (pages[p] ? pages[p].states : []).some((x) => x.split('@')[0] === `${st}-${r}`)); return have.length ? ` (+ ${have.map((r) => `-${r}`).join(', ')})` : ''; };
  const listed = new Set(creditList.map((y) => `${y.page}/${y.state}`));
  const plain = Object.entries(pages).flatMap(([p, e]) => e.states.map((s) => s.split('@')[0]).filter((s) => /credit|top-up/.test(s) && stateRole(s) === 'owner' && !/^flow-/.test(s) && !listed.has(`${p}/${s}`)).map((s) => `\`${p}/${s}\`${withRoles(p, s)}`));
  return `# Roles

Three kinds of signed-in account see Profolio KSA, and a screen can differ for each. Each signed-in page's **default render** is compiled three times: as the **agency owner** (the page itself), as an **agency staff** user (state \`as-staff\`) and as an **individual** broker (\`as-individual\`). Its other states are compiled as the owner, but for the role variants listed below${byOther.size ? ` and the ${count(byOther.size)} states compiled for another account (*States compiled for another account*)` : ''}.

**A state's role is in its name.** \`as-staff\` and \`<state>-as-staff\` are the staff account; \`as-individual\` and \`<state>-as-individual\` the individual one. **Every state not named as-staff / as-individual / *-as-staff / *-as-individual is the owner fixture** — loading, empty, error, every message-*, modal-*, drawer-* and inline-* included${byOther.size ? ` — **except the ${count(byOther.size)} states compiled for another account**, listed below${inRegistry ? ' and in \`registry.pages[x].state_roles\` (state → account)' : ''}` : ''}. \`registry.pages[x].roles\` lists the roles a page's default render is compiled for${inRegistry ? '' : '; a state carries no role of its own'}. An \`as-<role>\` page combined with a state compiled for another role is not compiled: list the combination under [TBC], naming both files.

| role | who | how it is compiled | what changes |
|---|---|---|---|
| owner | the agency's admin | the fixture account | — the default${c.owner ? `; credits ${fig(c.owner)}` : ''} |
| staff | a user inside an agency, not its admin | fixture mode \`staff\`, recorded from a real staff account | 9 rail items (no Agency Staff); own leads only; no Agency Staff or Agency Settings page (below)${selectorText('staff')}; profile 50%${c.staff ? `; credits ${fig(c.staff)}` : ''} |
| individual | a broker with no agency | fixture mode \`individual\`: the owner's record with the agency taken away (not recorded) | 9 rail items (no Agency Staff); no Agency Staff or Agency Settings page; the broker's own FAL licence${selectorText('individual')}; the leaderboard instead of the team table; "Individual" on User Settings; Convert to Agency${c.individual ? `; the owner's credits (${c.individual.available})` : ''} |
| public | not signed in | — | maintenance, the payment return and the magic post-ad link have no shell and no account. The agency invitation (\`/invite\`) is not public: it opens inside the shell, for any signed-in account (compiled as the owner) |

${members.length ? `${count(members.length).replace(/^./, (x) => x.toUpperCase())} state${members.length > 1 ? 's are' : ' is'} a fourth account, the **member area** — a user with no package (\`users/current\` \`is_package_user: false\`, fixture mode \`member\`): ${members.map((e) => `\`${e.page}/${e.state}\``).join(' and ')}.\n` : ''}${variants.length ? `\nRole variants of a state compiled so far: ${variants.join(', ')}.\n` : ''}${byOther.size ? `
## States compiled for another account

These carry no role in their name, yet the harness compiled them with another account signed in (the step's fixture \`mode\`, \`harness/interactions/<page>.mjs\` → \`data/design-kb.json\`). Read them as that account's, not the owner's:

${row(['state', 'account', 'fixture mode', 'layout'])}
${row(['---', '---', '---', '---'])}
${[...byOther.values()].map((e) => row([`\`${e.page}/${e.state}\``, e.role, `\`${e.mode}\``, [...e.devices].join(', ')])).join('\n')}

${members.length ? 'The member area is its own account: the owner, staff and individual accounts are package users and never get it. ' : ''}A state the owner or another role cannot open is in *States a role cannot open*.
` : ''}${noRoute.size ? `
## Pages a role has no route to

The role's render has no such page — the product does not give it the route (\`appRoutes.js\`; \`routes.md\` → *Who the product gives each route to*) — so none of the page's owner states exists for that role:

${[...noRoute.entries()].map(([p, e]) => `- \`${p}\` — as ${e.roles.join(' and as ')}, ${e.shows ? `it shows ${pages[e.shows] ? pages[e.shows].title : e.shows} (\`${e.shows}\`)` : 'the content is empty'}${gates[p] ? ` (only when \`${gates[p].when[0].join(' && ')}\`)` : ''}.`).join('\n')}
` : ''}${swaps.length ? `
## Pages a role gets as another component

The route is one, the component is not: \`appRoutes.js\` gives the page's route to a different component by who is signed in, and the role's render shows it. None of the owner's own content states is what the role sees there — the role's own loading, empty, error and messages are not compiled: say so under [TBC].

${swaps.map((s) => { const by = new Map(); for (const r of s.roles) (by.get(r.component) || by.set(r.component, []).get(r.component)).push(r.role); return `- \`${s.page}\` — ${[...by].map(([cmp, rs]) => `as ${rs.join(' and as ')}, ${cmp}`).join('; ')}; the owner's is ${s.owner} (\`appRoutes.js\` ${s.lines.map((l) => `:${l}`).join(', ')}).`; }).join('\n')}
` : ''}${byState.size ? `
## States a role cannot open

The control that opens them is on one account's render of the page and not on the role's own render of it, same page and layout: the owner's page for the owner's states (the control that links to the state, else the explorer's trigger — looked for on \`as-staff\` / \`as-individual\`); that account's render for a state compiled for another account. A hand-written state with no control of its own, on a page the role gets as another component, goes with that component:

${row(['state', 'opened by', 'not drawn for', 'layout'])}
${row(['---', '---', '---', '---'])}
${[...byState.values()].map((g) => row([`\`${g.page}/${g.state}\``, g.via ? `— hand-written; the page is ${g.via} for them` : `“${esc(g.trigger)}”${g.from ? ` (on \`${g.from === 'owner' ? `${g.page}` : `${g.page}/as-${g.from}`}\`)` : ''}`, [...g.not].join(', '), [...g.devices].join(', ')])).join('\n')}
` : ''}${creditList.length ? `
## States that show the owner's credits

${c.owner ? `The owner has ${fig(c.owner)}; the staff account ${fig(c.staff)}; the individual the owner's own. ` : ''}These owner states' own modal or drawer shows an owner figure; as staff it would be the staff account's — compiled only where a variant is marked (+ -as-staff):

${[...byPage.entries()].map(([p, e]) => `- \`${p}\` (${[...e.shows].join(', ')}): ${e.states.map((s) => `\`${s}\`${withRoles(p, s)}`).join(', ')}`).join('\n')}
${moded.map((y) => `- \`${y.page}/${y.state}\`${withRoles(y.page, y.state)} — fixture mode \`${y.mode}\`${alert ? `: “${alert.text}”, ${c.owner && alert.widget === c.owner.available ? `computed against the low-credit fixture while its credits widget shows the owner's ${alert.widget} — the two disagree` : `beside Available Credits ${alert.widget}`}` : ''}${y.page === 'post-listing-upgrade' && draft ? `. It is a state of the draft upgrade page (“${draft.heading}” · ${draft.primary}), not of the posted one (\`registry.flows['post-listing']\` step 9)` : ''}.`).join('\n')}
${plain.length ? `\nThe other credits states — ${plain.join(', ')} — open no modal or drawer with an owner figure (explainers, top-up forms) — though the page behind them may show the owner's balance.\n` : ''}` : ''}
Whether a staff or individual user sees any other owner state the same way is not compiled: say so under [TBC].
${clock ? `
## The fixture's clock

The fixture is recorded on **${clock.day}** — ${clock.riyadh.slice(11)} Asia/Riyadh (${clock.utc.slice(11)} UTC), each of the ${clock.files} compiled files at its own moment. Its dates are computed from that moment (\`harness/fixtures.mjs\` \`day()\`: UTC midnight, n days back), so "today" on every compiled page is ${clock.day}, and a relative date — "an hour ago", "3 days ago", Last 7 Days, a posted-on date — is relative to it. A time of day is shown in ${clock.shown_in}, the zone the pages were compiled in, not Riyadh: a lead task the fixture sets at 12:30 Riyadh shows "2:30 pm". Never quote a fixture time as Riyadh time.
` : ''}
## By page

${row(['page', 'owner', 'staff', 'individual'])}
${row(['---', '---', '---', '---'])}
${Object.keys(pages).map((s) => row([s, PUBLIC.has(s) ? 'public' : '✓', acc(s, 'as-staff'), acc(s, 'as-individual')])).join('\n')}

A ✓ is a compiled file: \`pages/<page>/as-staff.html\`, \`as-individual.html\` (and \`.mobile.html\`).
`;
}

/** the visible text inside the page's own content (main), header, rail and overlays left out */
export function contentLines(html) {
  const doc = parseHtml(html);
  const main = first(doc, (x) => x.tag === 'main' && has(x, 'pf-layout-content'));
  if (!main) return null;
  const out = [];
  const go = (el) => {
    if (el.tag === 'script' || el.tag === 'style' || el.tag === 'svg' || hiddenSelf(el) || has(el, 'pf-layout-footer')) return;
    for (const k of el.k) { if (typeof k === 'string') { const t = k.replace(/\s+/g, ' ').trim(); if (t) out.push(t); } else go(k); }
  };
  go(main);
  return out;
}

/**
 * What a role's render of a page shows when the product gives that role no
 * such page: nothing (the content is empty), or another page's content.
 * @param {string[]} slugs  signed-in pages
 * @param {(page: string, role: 'owner'|'staff'|'individual') => string[]|null} contentOf  contentLines of the web render
 * @returns {{page: string, role: string, shows: string|null}[]}
 */
export function roleRedirects(slugs, contentOf) {
  const out = [];
  for (const role of Object.keys(ROLE_SUFFIX)) {
    const key = new Map(slugs.map((s) => [s, (contentOf(s, role) || []).join('\n')]));
    for (const s of slugs) {
      const c = contentOf(s, role);
      if (!c) continue;
      if (!c.length) { out.push({ page: s, role, shows: null }); continue; }
      if (key.get(s) === (contentOf(s, 'owner') || []).join('\n')) continue;
      /* the same content as another page's, for this role: it is that page
         when it carries more of the lines only that page's owner render has
         (Agency Name, Agency Logo …) than of the lines only this one's has */
      const only = (x, y) => { const Y = new Set(contentOf(y, 'owner') || []); return new Set((contentOf(x, 'owner') || []).filter((l) => !Y.has(l))); };
      const hits = (set) => c.filter((l) => set.has(l)).length;
      const same = slugs.find((q) => q !== s && key.get(q) === key.get(s) && hits(only(q, s)) > hits(only(s, q)));
      if (same) out.push({ page: s, role, shows: same });
    }
  }
  return out;
}

/** the text of the open modal or drawer on top, or null when none is open */
export function overlayLines(html) {
  const doc = parseHtml(html);
  let top = null;
  for (const el of walk(doc)) {
    if (has(el, 'pf-modal-wrap') && !hidden(el)) top = first(el, (x) => has(x, 'pf-modal')) || top;
    else if (has(el, 'pf-drawer') && has(el, 'pf-drawer-open') && !hidden(el)) top = first(el, (x) => has(x, 'pf-drawer-content')) || top;
  }
  if (!top) return null;
  const out = [];
  const go = (el) => { if (el.tag === 'script' || el.tag === 'style' || el.tag === 'svg' || hiddenSelf(el)) return; for (const k of el.k) { if (typeof k === 'string') { const t = k.replace(/\s+/g, ' ').trim(); if (t) out.push(t); } else go(k); } };
  go(top);
  return out;
}

/** the credits a render's Credits Balance card shows: the line after each label (the dashboard's) */
export const creditsOf = (lines) => {
  const after = (re) => { const i = lines.findIndex((l) => re.test(l)); return i > -1 ? lines[i + 1] : null; };
  return { available: after(/^Available Credits:?$/), used: after(/^Used$/), total: after(/^Total$/), plan: after(/^Current Plan$/) };
};

/**
 * The owner states whose own modal or drawer shows the owner's credit
 * figures — a figure (available, used, total) the staff account's differs
 * from — or that a credits fixture mode made (design-kb: lf-low-credits).
 * An explainer that only names credits ("What are Bayut Credits?") is the
 * same for every role and is not one of them.
 * @param {Record<string, string[]>} states  page → registry states
 * @param {(page: string, state: string) => string|null} htmlOf  a state's web file (or its 375 one)
 * @param {{owner: object, staff: object}} credit  creditsOf() of each role's dashboard
 * @param {Record<string, string>} modes  "page/state" → fixture mode (design-kb)
 * @returns {{page: string, state: string, shows: string[]|null, mode: string|null}[]}
 */
export function creditStates(states, htmlOf, credit, modes = {}) {
  const figures = ['available', 'used', 'total'].map((k) => credit.owner[k]).filter((v, i) => v && v !== credit.staff[['available', 'used', 'total'][i]]);
  const out = [];
  for (const [page, list] of Object.entries(states)) {
    for (const s of list) {
      const name = s.split('@')[0];
      if (stateRole(name) !== 'owner' || /^flow-/.test(name)) continue;
      const mode = modes[`${page}/${name}`] || null;
      const html = htmlOf(page, name);
      const ov = html ? overlayLines(html) : null;
      const shows = ov ? [...new Set(ov.filter((l) => figures.includes(l)))] : [];
      if (shows.length || /credit/.test(mode || '')) out.push({ page, state: name, shows: shows.length ? shows : null, mode: /credit/.test(mode || '') ? mode : null });
    }
  }
  return out;
}

/* ── 7 · what scripts/package.mjs calls ───────────────────────────────── */
/* pageFiles are package.mjs section 3's: { src, dev: 'web'|'mobile', page, state|null } */
const indexFiles = (pageFiles) => {
  const by = new Map(pageFiles.map((f) => [`${f.dev}|${f.page}|${f.state || ''}`, f.src]));
  const cache = new Map();
  const html = (dev, page, state) => { const p = by.get(`${dev}|${page}|${state || ''}`); if (!p) return null; if (!cache.has(p)) cache.set(p, readFileSync(p, 'utf8')); return cache.get(p); };
  return { html, either: (page, state) => html('web', page, state) || html('mobile', page, state) };
};

/**
 * Section 8, before the pages loop: every page's route pattern and fixture URL.
 * Without the product checkout the recorded URL stays the route (and says so).
 * @returns {{routes: Record<string, {route: string, fixture_url?: string}>, gates: object, src: object|null, notes: string[]}}
 */
export function routesFor(root, ALL, product = null) {
  const src = loadRoutesSource(root);
  if (!src) return { routes: Object.fromEntries(Object.entries(ALL).map(([k, v]) => [k, { route: v }])), gates: {}, src: null, notes: ['no product checkout at ../profolio-reactjs (or PROFOLIO_REPO): routes are the recorded URLs'] };
  const pr = pageRoutes(src.src, ALL, src.tenantSrc);
  const notes = [pr.warning, pr.unmatched.length ? `no route pattern for ${pr.unmatched.join(', ')}` : null, product && src.commit && src.commit !== product ? `routes read at ${src.commit}, the build at ${product}` : null].filter(Boolean);
  return { routes: pr.routes, gates: routeGates(pr.routes), src, notes };
}

/** Section 8: registry.flows as step objects */
export const flowsFor = (kbFlows, pageFiles) => { const f = indexFiles(pageFiles); return flowSteps(kbFlows, f.either); };

/** Section 8: the fixture's clock — `registry` is registry.clock ({ day, riyadh, shown_in }), `full` is for roles.md */
export function clockFor(root, pageFiles) {
  const full = fixtureClock(pageFiles.map((f) => capturedAt(captureOf(root, f))));
  return { registry: full && { day: full.day, riyadh: full.riyadh, shown_in: full.shown_in }, full };
}

/**
 * Section 9: the text of product/routes.md and product/roles.md.
 * @param {object} o
 * @param {string} o.root
 * @param {Record<string, object>} o.pages  registry.pages, final
 * @param {Set<string>} o.PUBLIC
 * @param {object} o.flows  registry.flows
 * @param {object} o.R  routesFor()
 * @param {object[]} o.pageFiles
 * @param {object} o.kb  data/design-kb.json
 * @param {object|null} o.clock  clockFor().full
 */
export function productTexts({ root, pages, PUBLIC, flows, R, pageFiles, kb, clock }) {
  const f = indexFiles(pageFiles);
  const lines = new Map();
  const linesOf = (dev, page, state) => { const k = `${dev}|${page}|${state || ''}`; if (!lines.has(k)) { const h = f.html(dev, page, state); lines.set(k, h ? visibleLines(h) : null); } return lines.get(k); };
  /* the explorer's triggers, web and 375 */
  const explored = [];
  for (const [dev, dir] of [['web', join(root, 'data', 'states')], ['mobile', join(root, 'data', 'states', 'mobile')]]) {
    if (!existsSync(dir)) continue;
    for (const n of readdirSyncSafe(dir)) explored.push({ ...JSON.parse(readFileSync(join(dir, n), 'utf8')), device: dev });
  }
  const states = Object.fromEntries(Object.entries(pages).filter(([, p]) => !p.theme).map(([k, p]) => [k, p.states]));
  /* the states compiled for another account (the harness's fixture mode), of the pages here */
  const others = compiledFor(kb).filter((e) => (states[e.page] || []).some((s) => s.split('@')[0] === e.state));
  const heads = new Map();
  const headOf = (page, dev, state) => { const k = `${dev}|${page}|${state}`; if (!heads.has(k)) { const h = f.html(dev, page, state); heads.set(k, h ? readHead(h) : null); } return heads.get(k); };
  const trigs = new Map();
  const triggersOf = (page, dev) => { const k = `${dev}|${page}`; if (!trigs.has(k)) { const h = f.html(dev, page, null); trigs.set(k, h ? pageTriggers(h, page) : []); } return trigs.get(k); };
  const gaps = unreachable(explored, (page, dev, state) => linesOf(dev, page, state), states, { triggers: triggersOf, head: headOf, others });
  const signedIn = Object.keys(states).filter((s) => !PUBLIC.has(s));
  const contents = new Map();
  const contentOf = (page, role) => { const k = `${page}|${role}`; if (!contents.has(k)) { const h = f.html('web', page, role === 'owner' ? null : ROLE_SUFFIX[role]); contents.set(k, h ? contentLines(h) : null); } return contents.get(k); };
  const redirects = roleRedirects(signedIn, contentOf);
  /* a page whose route is another component for a role: its hand-written states with no
     control of their own (no data-pf-go to them, not the explorer's) go with the component —
     not the shell's, the data states' or the accounts' */
  const swaps = componentSwaps(R.routes, contentOf);
  /* each compiled file's kind (design-kb pairs a web state and its 375 one, whose name can differ) */
  const kinds = new Map();
  for (const sc of kb.screens || []) for (const x of sc.states || []) for (const [dev, rel] of Object.entries(x.files || {})) {
    const m = String(rel || '').match(/(?:^|\/)([a-z0-9-]+?)--([^/]+)\.html$/);
    if (m && m[1] === sc.slug) kinds.set(`${dev === 'web' ? 'web' : 'mobile'}|${sc.slug}/${m[2]}`, x.kind);
  }
  const shellNames = new Set(explored.flatMap((d) => (d.states || []).filter((s) => s.shell).map((s) => `${d.device}|${s.name}`)));
  const byExplorer = new Set(explored.flatMap((d) => [...(d.states || []), ...(d.nested || [])].map((s) => `${d.page}|${d.device}|${s.name}`)));
  const listedGap = new Set(gaps.map((g) => `${g.page}|${g.device}|${g.state}`));
  for (const sw of swaps) for (const dev of ['web', 'mobile']) {
    const linked = new Set(triggersOf(sw.page, dev).map((t) => t.state));
    for (const id of states[sw.page] || []) {
      const name = id.split('@')[0], kind = kinds.get(`${dev}|${sw.page}/${name}`);
      if (!f.html(dev, sw.page, name) || stateRole(name) !== 'owner' || shellNames.has(`${dev}|${name}`) || others.some((e) => e.page === sw.page && e.state === name)) continue;
      if (linked.has(name) || byExplorer.has(`${sw.page}|${dev}|${name}`) || listedGap.has(`${sw.page}|${dev}|${name}`)) continue;
      if (['data', 'account', 'shell'].includes(kind) || (!kind && !/^(message|modal|drawer|form|popover|dropdown|tooltip|inline)-/.test(name))) continue;
      gaps.push({ page: sw.page, state: name, device: dev, trigger: null, via: sw.roles.map((r) => r.component).filter((v, i, a) => a.indexOf(v) === i).join(' / '), not: sw.roles.map((r) => r.role) });
    }
  }
  /* the agency selector: a gap whose own file lists its trigger as "<name> (Agency)" */
  for (const g of gaps) { const l = g.trigger && linesOf(g.device, g.page, g.state); if (l && l.split('\n').includes(`${g.trigger} (Agency)`)) g.selector = true; }
  const card = (state) => { const l = linesOf('web', 'dashboard', state); return l ? creditsOf(l.split('\n')) : {}; };
  const credit = { owner: card(null), staff: card('as-staff'), individual: card('as-individual') };
  const modes = {};
  for (const sc of kb.screens || []) for (const x of sc.states || []) if (x.mode) modes[`${sc.slug}/${x.name}`] = x.mode;
  const creditList = credit.owner.available ? creditStates(states, f.either, credit, modes) : [];
  const base = f.html('web', 'post-listing-upgrade', null);
  const draft = base ? readHead(base) : null;
  const ic = linesOf('web', 'post-listing-upgrade', 'inline-insufficient-credits');
  let alert = null;
  if (ic) { const L = ic.split('\n'); const i = L.findIndex((l) => /^Insufficient Credits/.test(l)); if (i > -1) alert = { text: L.slice(i, i + 5).join(' ').replace(/\s+/g, ' ').replace(/ at checkout.*$/, ' at checkout'), widget: creditsOf(L).available }; }
  return {
    routes: routesMd({ pages, PUBLIC, flows, routeSrc: R.src, gates: R.gates }),
    roles: rolesMd({ pages, PUBLIC, clock, gaps, redirects, gates: R.gates, credit: credit.owner.available ? credit : null, creditList, draft, alert, others, swaps }),
  };
}
const readdirSyncSafe = (dir) => { try { return readdirSync(dir).filter((n) => n.endsWith('.json')); } catch { return []; } };
