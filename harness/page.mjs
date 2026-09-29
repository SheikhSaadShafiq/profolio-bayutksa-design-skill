/**
 * One harness page: a signed-in fixture account on the harness Vite server,
 * every API call answered from harness/fixtures.mjs, nothing leaving the
 * machine but Google Fonts (answered locally, see capture.mjs for why).
 *
 * capture.mjs grew this inline; compile.mjs needs exactly the same page, and
 * two copies of a route handler drift the way two copies of a shell did. So
 * the handler lives here — and capture.mjs uses it too (prepareContext,
 * routeHandler), so the two cannot answer a page differently.
 *
 *   import { openPage, settle } from './page.mjs';
 *   const { page, ctx, log } = await openPage(browser, base, { locale: 'en', mode: () => MODE });
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { answer, THUMB, AVATAR_SVG } from './fixtures.mjs';
import { searchLocations } from './fixtures/payments.mjs';
import { REPO } from './serve.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const FONTS_CSS = readFileSync(join(HERE, '..', 'deliverables', 'fonts.css'), 'utf8');
const UID = JSON.parse(readFileSync(join(HERE, 'fixtures', 'user.json'), 'utf8')).user.id;
export { FONTS_CSS };

import { DEVICES } from './devices.mjs';
export { DEVICES };

/* ── the data modes: 'slow' and 'error' ───────────────────────────────────
   Every other mode is a different ANSWER (harness/fixtures/*.mjs). These two
   are what happens to the answers, and they are decided here, per request:

     'slow'   the page's content is held open — never answered — so what is
              captured is what the product paints while it waits: its
              skeletons, its spinners
     'error'  the page's content answers 500 in the API's refusal envelope, so
              what is captured is what the product paints when its data
              request fails

   Either way the SHELL still answers — the session, the header and the rail —
   because a page whose shell never arrives is a full-page spinner
   (renderIfLoggedIn) or the sign-in redirect, not that page's loading or
   error state. The shell is what every page asks for (data/live/*.log.json
   list it on all of them):

     users/current            the session; nothing mounts without it (router.js)
     users/:id + languages,   getUserSettingsDetail — the header avatar asks on
       area_units,            every page (auth-info/info.js:28); it reads only
       experience_list        the photo, and this account has none
     agencies/:id             router.js:66 → loginUser.agency and its users list
     notifications(/stats)    the bell and its count
     lms/leads/stats          the rail's unseen-leads badge (apis/common.js)
     tenants/current          the Feedback tab
     products                 getActiveProducts (router.js:65)
     dashboard/account_manager  Help & Support in the rail
     user/favorites, user/searches/saved, bnb/listing_bookings
                              the member area's header (navbar.js)

   …EXCEPT on the pages whose own content IS one of those calls: the settings
   form (and the Preferences card) are the header's own getUserSettingsDetail
   URLs, and Agency Settings and Agency Staff are agencies/:id. There they are
   held or failed with the rest of the content — the header draws the same
   glyph either way, since the photo is the only thing it reads from them. */
const SHELL = [
  /^\/api\/surge\/users\/current$/,
  /^\/api\/surge\/users\/\d+$/,
  /^\/api\/surge\/(languages|area_units|experience_list)$/,
  /^\/api\/surge\/agencies\/\d+$/,
  /^\/api\/surge\/notifications(\/stats)?$/,
  /^\/api\/surge\/lms\/leads\/stats$/,
  /^\/api\/surge\/tenants\/current$/,
  /^\/api\/surge\/products$/,
  /^\/api\/surge\/dashboard\/account_manager$/,
  /^\/api\/user\/(favorites|searches\/saved)/,
  /^\/bnb\/listing_bookings$/,
];
const OWN_CONTENT = [
  [/^\/user-settings\/(user-profile|preferences)\/?$/, /^\/api\/surge\/(users\/\d+|languages|area_units|experience_list)$/],
  [/^\/(user-settings\/agency-profile|agency-staff)\/?$/, /^\/api\/surge\/agencies\/\d+$/],
];
/* the API's own refusal envelope ({ success: false, errors: [...] }, as the
   recorded staff account was refused team_performance) and the product's own
   generic message (locales/en "Something went wrong, please try again") —
   in case a page prints what it was told */
const FAILURE = JSON.stringify({ success: false, errors: ['Something went wrong, please try again'] });

/** what the data mode does to one request: 'hang', 'fail' or null (answer it)
 *  @param apiPath   the request's pathname
 *  @param pagePath  the page's route, locale stripped (/user-settings/preferences) */
export function dataMode(mode, apiPath, pagePath = '') {
  if (mode !== 'slow' && mode !== 'error') return null;
  const own = OWN_CONTENT.some(([pg, api]) => pg.test(pagePath) && api.test(apiPath));
  if (!own && SHELL.some((re) => re.test(apiPath))) return null;
  return mode === 'slow' ? 'hang' : 'fail';
}

/* the page a request was made from, as a route: /en/user-settings/x → /user-settings/x */
const pageOf = (r) => {
  try { return new URL(r.request().frame().url()).pathname.replace(/^\/(en|ar)(?=\/|$)/, '') || '/'; } catch { return ''; }
};

/* a member-area user (users/current says is_package_user false) is served on
   the CLASSIFIED site's origin — that is where the product sends one
   (useAppRedirection.js getPathToRedirect: a member-area user whose origin is
   not getClassifiedBaseURL() is location.replace()d there, on every load).
   The harness has one origin, and harness/env leaves REACT_APP_CLASSIFIED_URL
   empty, so the product redirected the page to itself forever (63 reloads in
   50 s) and the member area never mounted. So in a member-area mode the
   product's platform variables (src/utility/variables.js — generated, `{}`
   here; env.js reads classifiedBaseURL from it before the env var) name this
   origin as the classified site's. No redirect, and the classified header
   (@bayut-sa/header, which builds every link with new URL(path, baseURL))
   has a base it can parse. A package user's variables are never touched. */
const isMemberArea = (mode) => {
  try { return answer('GET', '/api/surge/users/current', '', mode)?.user?.is_package_user === false; } catch { return false; }
};

/* Algolia's side of a locations search (see the route handler) */
const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET, POST, OPTIONS' };
const everyPlace = () => searchLocations({ hitsPerPage: 1000 }).hits;
/* a multi-query's params arrive as a query string; its arrays as JSON */
const paramsOf = (qs) => Object.fromEntries([...new URLSearchParams(qs || '')].map(([k, v]) => {
  try { return [k, /^[[{]/.test(v) ? JSON.parse(v) : v]; } catch { return [k, v]; }
}));
async function algolia(r, u) {
  const req = r.request();
  if (req.method() === 'OPTIONS') return r.fulfill({ status: 204, headers: CORS });
  let data = {};
  try { data = JSON.parse(req.postData() || '{}'); } catch {}
  let body;
  if (/^\/1\/indexes\/\*\/objects$/.test(u.pathname)) {
    const all = everyPlace();
    body = { results: (data.requests || []).map((q) => all.find((h) => h.objectID === String(q.objectID)) || null) };
  } else if (/^\/1\/indexes\/\*\/queries$/.test(u.pathname)) {
    body = { results: (data.requests || []).map((q) => searchLocations(paramsOf(q.params))) };
  } else if (/^\/1\/indexes\/[^/]*\/query$/.test(u.pathname)) {
    body = searchLocations(data);
  } else if (/^\/1\/indexes\/[^/]*\/[^/]+$/.test(u.pathname) && req.method() === 'GET') {
    const id = decodeURIComponent(u.pathname.split('/').pop());
    const hit = everyPlace().find((h) => h.objectID === id);
    if (!hit) return r.fulfill({ status: 404, contentType: 'application/json', headers: CORS, body: JSON.stringify({ message: 'ObjectID does not exist', status: 404 }) });
    body = hit;
  } else {
    return r.abort();                     /* anything else Algolia offers is not a search: nothing */
  }
  return r.fulfill({ status: 200, contentType: 'application/json', headers: CORS, body: JSON.stringify(body) });
}

/** the harness's cookie and first-visit flags, on a new context — every page
    the harness opens, capture's and compile's alike */
export async function prepareContext(ctx) {
  /* Every first-visit walkthrough is dismissed, the way a returning user has
     them: the LMS intro modal and the three antd Tours (dashboard,
     management, lead_detail — useGetTourStepsForLms.js:114). A state that
     wants one OPEN sets sessionStorage 'pf-harness-tour' to its section and
     reloads; sessionStorage survives the reload, and this leaves that one out. */
  await ctx.addInitScript((uid) => {
    try {
      /* the app's own document only — a frame inside it is not the app, and
         must not set or spend these */
      if (window.top !== window) return;
      /* a flag is spent by the load it was set for: a state that fails
         half-way cannot leave one behind for the next */
      const take = (k) => { const v = sessionStorage.getItem(k); if (v) sessionStorage.removeItem(k); return v; };
      const hide = { hide: true };
      const lms = { introModal: hide, dashboard: hide, management: hide, lead_detail: hide };
      const show = take('pf-harness-tour');
      if (show) delete lms[show];
      localStorage.setItem('tapTargets', JSON.stringify({ lms }));
      /* the "Profile Completed" congratulations modal shows once, when the
         score reaches 100 and localStorage has not yet seen it
         (withAdminLayout.js:106-126). A returning user has seen it; the
         dashboard state 'modal-profile-completed' asks for it back. */
      const key = `showCompletionModal_${uid}`;
      if (take('pf-harness-congrats')) localStorage.removeItem(key);
      else localStorage.setItem(key, '100');
      /* the Quality Lister congratulations modal on /agent-performance shows
         once per badge, until localStorage holds true for it
         (AgentPerformance.js:128-137). A returning user has seen it; a state
         that wants it back sets sessionStorage 'pf-harness-quality'. */
      const quality = `qualityListerShown_${uid}`;
      if (take('pf-harness-quality')) localStorage.removeItem(quality);
      else localStorage.setItem(quality, 'true');
    } catch {}
  }, UID);
  await ctx.addCookies([{ name: 'byt_cd', value: 'harness-token', domain: '127.0.0.1', path: '/' }]);
}

/** the one route handler: `page.route('**' + '/*', routeHandler({ base, mode, log }))`
 *  @param mode  () => the answer-set mode right now (a state step changes it) */
export function routeHandler({ base, mode = () => null, log = { answered: [], unanswered: [], errors: [], blocked: 0 } }) {
  const appHost = new URL(base).host;
  return async (r) => {
    const u = new URL(r.request().url());
    /* Google Fonts is the one off-origin request worth answering rather than
       blocking: useAppInit.js fetches Figtree there, and Figtree is what the
       product paints with. Blocking it made the product render in the system
       fallback while our page rendered in a real face, so every text width
       differed for a reason that had nothing to do with our markup. Serve the
       same embedded faces deliverables/fonts.css carries. */
    if (/^fonts\.(googleapis|gstatic)\.com$/.test(u.host)) {
      if (u.host === 'fonts.googleapis.com') {
        log.fonts = 'served from deliverables/fonts.css';
        return r.fulfill({ status: 200, contentType: 'text/css', body: FONTS_CSS });
      }
      return r.abort();          /* the faces are already inlined in that CSS */
    }
    /* the phone field's country flag is fetched from the flag library's own
       site (react-phone-number-input → purecatamphetamine.github.io); the
       product ships the same files in node_modules/country-flag-icons, so
       they are answered from there — the harness still reaches nothing
       outside */
    if (u.host === 'purecatamphetamine.github.io' && /^\/country-flag-icons\/3x2\/[A-Z]{2}\.svg$/.test(u.pathname)) {
      const flag = join(REPO, 'node_modules', 'country-flag-icons', '3x2', u.pathname.split('/').pop());
      if (existsSync(flag)) return r.fulfill({ status: 200, contentType: 'image/svg+xml', headers: { 'access-control-allow-origin': '*' }, body: readFileSync(flag) });
    }
    /* the Algolia locations index. Every City / District / Location select —
       /ad-license, the listing form, User and Agency Settings, the listings
       and leads filters — searches it straight from the browser
       (services/algolia, algoliasearch 4), and harness/env leaves the app id
       empty, so the host is -dsn.algolia.net (then -1…-3.algolianet.com).
       Blocked, every one of those selects stayed empty. It is answered here
       from harness/fixtures/payments.mjs searchLocations() — 20 cities and
       their districts, with the listings' own location ids — in the three
       forms the client sends: one search (POST 1/indexes/<index>/query, its
       params as JSON), several (POST 1/indexes/[*]/queries, each params a
       query string) and objects by id (POST 1/indexes/[*]/objects —
       locationFilter.js:52 hydrates the locations a filter already holds;
       [*] is a literal asterisk). Only the locations index is ever
       searched on KSA (the projects index has no caller). The harness still
       reaches nothing outside. */
    if (/(^|[.-])algolia(net)?\.(net|com)$/.test(u.host)) return algolia(r, u);
    if (u.host !== appHost) { log.blocked++; return r.abort(); }         /* nothing else leaves the sandbox */
    if (u.pathname.startsWith('/harness-img/')) return r.fulfill({ status: 200, contentType: THUMB.contentType, body: u.pathname.includes('avatar') ? AVATAR_SVG : THUMB.body });
    const MODE = mode();
    /* the classified origin, for a member-area user — see isMemberArea */
    if (u.pathname === '/src/utility/variables.js' && isMemberArea(MODE)) {
      log.memberArea = `classifiedBaseURL = ${u.origin} (src/utility/variables.js)`;
      return r.fulfill({ status: 200, contentType: 'application/javascript',
        body: `export default { bayut: { classifiedBaseURL: ${JSON.stringify(u.origin)} } };\n` });
    }
    /* /api/ is Surge; /bnb/ is the stays API the member header counts
       bookings from (apis/user.js getUserBookings) — same origin, relative */
    if (u.pathname.startsWith('/api/') || u.pathname.startsWith('/bnb/')) {
      const method = r.request().method();
      const route = pageOf(r);
      const held = dataMode(MODE, u.pathname, route);
      if (held === 'fail') {
        log.mode = 'error: content answers 500, the shell answers';
        return r.fulfill({ status: 500, contentType: 'application/json', body: FAILURE });
      }
      if (held === 'hang') {
        log.mode = 'slow: content held open, the shell answers';
        return new Promise(() => {});      /* never settles; the step snaps the skeleton */
      }
      /* the page's route rides along: an answer is the account's whichever
         page asks, but one product bug needs to know (profile.mjs NO_PHOTO) */
      const body = answer(method, u.pathname, u.search, MODE, route);
      (body === undefined ? log.unanswered : log.answered).push(`${method} ${u.pathname}`);
      /* never abort an API call: an aborted request pins a skeleton forever, a 200 lands in an empty state */
      return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body ?? {}) });
    }
    return r.continue();
  };
}

export async function openPage(browser, base, { locale = 'en', mode = () => null, device = 'web' } = {}) {
  const ctx = await browser.newContext({ ...DEVICES[device], locale: locale === 'ar' ? 'ar-SA' : 'en' });
  await prepareContext(ctx);
  const page = await ctx.newPage();
  const log = { answered: [], unanswered: [], errors: [], blocked: 0 };
  page.on('pageerror', (e) => log.errors.push(String(e).slice(0, 300)));
  await page.route('**/*', routeHandler({ base, mode, log }));
  return { page, ctx, log };
}

/* the same settle every capture uses */
export async function settle(page) {
  try { await page.waitForLoadState('networkidle', { timeout: 20_000 }); } catch {}
  try {
    await page.waitForFunction(() => ![...document.querySelectorAll('.ant-spin-spinning, .ant-skeleton-active')]
      .some((el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; }), null, { timeout: 15_000 });
  } catch {}
  await page.waitForTimeout(1200);
}
