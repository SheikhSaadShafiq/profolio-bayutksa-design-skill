/**
 * The design search engine — shared by scripts/design-find.mjs (a few words
 * from the command line) and scripts/design-brief.mjs (every requirement of a
 * PRD).
 *
 * A PRD says "let staff see their own leads only" or "add a discount to a
 * listing"; the design system says lms-leads--as-staff and
 * listings--action-discount. This searches the design knowledge base
 * (data/design-kb.json, written by scripts/ds/design-kb.mjs) — every
 * screen's purpose and copy, every state's trigger, title, controls and
 * strings, every component's name and source — and translates the words a
 * PRD uses into the words the product uses (SYNONYMS) on the way.
 *
 *   import { loadKb, buildDocs, search } from './lib/design-search.mjs';
 *   const docs = buildDocs(loadKb());
 *   const { scored, qSyn } = search(docs, 'mark a daily rental as booked');
 *
 * search() with its defaults is exactly what design-find has always done;
 * design-brief passes PRD_SYNONYMS and PRD_STOP (a wider net for long
 * sentences) and explain: true (which words each result matched).
 *
 * Also here, because both tools read them: the product's shipped copy
 * (translation.json, English and Arabic, and the copy areas in
 * kb/product/copy/) — loadCopy().
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');                /* skill/ */
export const KB_PATH = join(ROOT, 'kb', 'design-kb.json');
export const REPO = join(ROOT, '..', process.env.PROFOLIO_REPO || 'profolio-reactjs');

/** data/design-kb.json, or null when it has not been built */
export const loadKb = (path = KB_PATH) => (existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : null);

export const STOP = new Set('a an the to of for in on and or with as is are be should can could would will user users page screen show shows see able want wants when where that this it its from by at into new add adding let lets allow allows via each any all'.split(' '));
/* A PRD's sentences carry more glue than a search box does. */
export const PRD_STOP = new Set([...STOP, ...'i we you they them their theirs our ours your yours he she his her him me my us who whom whose which what why how so such than then there here also only just very really more most less other others some same both either neither not no nor without within per via upon onto over under about above below after before during while until if whether else otherwise unless get gets got getting given give gives make makes made making need needs needed must shall may might do does did done doing have has had having been being was were am use uses used using like e.g i.e etc eg ie able feature features requirement requirements story stories acceptance criteria criterion given then scenario so-that order ensure ensures ensuring currently existing today now also-see one two case cases time times way ways thing things kind something anything everything someone anyone everyone people person'.split(' ')]);
PRD_STOP.delete('new'); PRD_STOP.delete('add'); PRD_STOP.delete('adding');

export const stem = (w) => (w.length > 5 && w.endsWith('ies') ? w.slice(0, -3) + 'y' : w.length > 5 && w.endsWith('ing') ? w.slice(0, -3) : w.length > 4 && w.endsWith('ed') ? w.slice(0, -2) : w.length > 3 && w.endsWith('es') && !w.endsWith('ses') ? w.slice(0, -2) : w.length > 3 && w.endsWith('s') ? w.slice(0, -1) : w);
export const words = (t, stop = STOP) => String(t || '').toLowerCase().replace(/[’']/g, '').split(/[^a-z0-9؀-ۿ-]+/).filter((w) => w && !stop.has(w)).map(stem);

/* the words a PRD uses → the words the product uses. Kept small and explicit
   so a wrong one can be argued with. */
export const SYNONYMS = {
  lead: ['truleads', 'lms', 'lead', 'enquiry'], enquiry: ['lead'], inquiry: ['lead'], crm: ['lead', 'task'],
  book: ['booked', 'booking'], booking: ['booked', 'booking'], reserve: ['booked'], reservation: ['booked'],
  boost: ['upgrade', 'hot', 'signature', 'refresh'], promote: ['upgrade', 'hot', 'signature'], feature: ['upgrade', 'signature', 'feature'], upgrade: ['upgrade', 'hot', 'signature', 'refresh'],
  licence: ['license'], permit: ['license', 'permit'], rega: ['rega', 'license'], fal: ['fal', 'license'], brokerage: ['fal', 'license', 'brokerage'],
  staff: ['staff', 'agent', 'user'], employee: ['staff', 'user'], team: ['staff', 'team'], agent: ['agent', 'staff', 'broker'], broker: ['broker', 'trubroker'],
  credit: ['credits'], balance: ['credits', 'balance'], wallet: ['credits'], topup: ['top-up', 'credits'], 'top-up': ['top-up', 'credits'],
  package: ['package', 'plan'], plan: ['package', 'plan'], subscription: ['package'],
  delete: ['delete', 'remove'], remove: ['delete', 'removed'], archive: ['removed'],
  filter: ['filter', 'filters'], search: ['search', 'filter'], sort: ['sort'],
  notification: ['notifications', 'notification'], alert: ['notifications'], bell: ['notifications'],
  profile: ['profile', 'settings'], account: ['account', 'profile', 'settings'], setting: ['settings'],
  discount: ['discount', 'off'], offer: ['discount'], price: ['price', 'discount'],
  photo: ['photography', 'image', 'photo'], photography: ['photography'], image: ['image', 'photography'], picture: ['image', 'photography'],
  video: ['videography', 'video'], videography: ['videography'],
  verify: ['verified', 'verification', 'nafath', 'otp'], verification: ['verified', 'nafath', 'otp'], nafath: ['nafath'], otp: ['otp', 'code'],
  report: ['reports', 'report'], analytics: ['reports', 'insights', 'performance'], insight: ['insights'], stat: ['performance', 'reports'], performance: ['performance'],
  date: ['date', 'calendar'], calendar: ['calendar', 'date'], range: ['date', 'range'],
  help: ['help', 'support'], support: ['help', 'support'], contact: ['contact', 'help'],
  app: ['app', 'download'], download: ['download'],
  trucheck: ['trucheck'], quality: ['quality', 'health', 'score'], health: ['health', 'quality'],
  daily: ['daily'], rental: ['rent', 'rental'], rent: ['rent'], sale: ['sale', 'sell'], sell: ['sale', 'sell'],
  empty: ['empty', 'no record', 'no data'], loading: ['loading', 'skeleton', 'spinner'], error: ['error', 'failed'],
  menu: ['menu', 'rail', 'navigation'], navigation: ['menu', 'rail'], sidebar: ['rail', 'sider', 'menu'],
  invite: ['invite'], password: ['password'], language: ['language', 'arabic'], logout: ['logout', 'sign out'],
  post: ['post', 'listing'], listing: ['listing', 'listings'], property: ['property', 'listing'], ad: ['ad', 'license', 'listing'],
  tour: ['tour'], onboarding: ['tour', 'intro'], congratulation: ['congratulations', 'completed'],
};

/* PRD language is wider than a search box: whole sentences, product-manager
   words ("availability", "prompt", "admin"), and the product's names for
   things spelled the way a PRD spells them. These are ADDED to SYNONYMS for
   design-brief; design-find keeps the list above. Keys are stems (see stem()). */
const PRD_EXTRA = {
  /* bookings and availability — BookedUntilModal, the Booked chip */
  booked: ['booked', 'booking'], availability: ['booked', 'booking', 'date', 'range'], available: ['booked', 'available'], unavailable: ['booked', 'range'],
  occupancy: ['booked', 'booking'], occupied: ['booked'], block: ['booked', 'range'], blocked: ['booked', 'range'], blackout: ['booked', 'range'],
  night: ['daily', 'night'], nightly: ['daily', 'night'], 'short-term': ['daily', 'rental'], holiday: ['daily', 'rental'], vacation: ['daily', 'rental'], stay: ['daily', 'rental'],
  'daily-rental': ['daily', 'rental', 'rent'],
  /* who — the three roles */
  admin: ['admin', 'agency', 'owner'], owner: ['owner', 'agency', 'admin'], manager: ['manager', 'admin'], principal: ['agency', 'admin'],
  individual: ['individual', 'member', 'seller'], seller: ['seller', 'individual', 'member'], landlord: ['individual', 'seller'], freelancer: ['individual'],
  member: ['member', 'staff', 'user'], colleague: ['staff', 'agent'], subuser: ['staff', 'user'], 'sub-user': ['staff', 'user'],
  /* money */
  quota: ['credits', 'quota'], point: ['credits', 'points'], recharge: ['top-up', 'credits'], refill: ['top-up', 'credits'], purchase: ['buy', 'package', 'credits'], buy: ['buy', 'package', 'top-up'],
  pay: ['payment', 'pay'], payment: ['payment', 'pay', 'checkout'], checkout: ['checkout', 'payment'], cost: ['price', 'credits'], limit: ['limit', 'credit'], cap: ['limit', 'capping'], capping: ['limit', 'capping'],
  insufficient: ['insufficient', 'credits'], exhausted: ['insufficient', 'credits'],
  /* surfaces */
  prompt: ['modal', 'popup', 'message'], popup: ['modal', 'popup'], 'pop-up': ['modal', 'popup'], dialog: ['modal'], dialogue: ['modal'], modal: ['modal'],
  nudge: ['message', 'toast', 'banner'], toast: ['message', 'success'], snackbar: ['message'], banner: ['banner', 'alert'], hint: ['tooltip', 'info'], tip: ['tooltip', 'tip'], tooltip: ['tooltip'],
  panel: ['drawer'], sheet: ['drawer'], 'side-panel': ['drawer'], drawer: ['drawer'], dropdown: ['dropdown', 'select'], picker: ['picker', 'date'],
  badge: ['badge', 'tag'], chip: ['tag', 'badge'], label: ['tag', 'label'], tag: ['tag'],
  table: ['table', 'row'], row: ['row', 'table'], column: ['column', 'table'], card: ['card'], widget: ['widget', 'card'], chart: ['chart', 'graph'], graph: ['chart', 'graph'],
  tab: ['tab'], step: ['step'], wizard: ['step'], stepper: ['step'],
  pick: ['picker', 'select', 'date'], choose: ['select'], select: ['select', 'selected'],
  /* places a PRD names */
  dashboard: ['dashboard', 'overview'], overview: ['overview', 'dashboard'], home: ['dashboard', 'overview'], homepage: ['dashboard', 'overview'],
  inventory: ['listing', 'listings'], portfolio: ['listing', 'listings'], unit: ['unit', 'listing', 'project'], project: ['project', 'unit'],
  truleads: ['truleads', 'lead'], enquire: ['lead'], contactee: ['lead'], caller: ['lead', 'call'], call: ['call', 'lead'], whatsapp: ['whatsapp', 'lead'],
  leaderboard: ['leaderboard', 'trupoints'], trupoints: ['trupoints'], trubroker: ['trubroker'], badges: ['badge'],
  /* verbs */
  mark: ['mark'], edit: ['edit', 'update'], update: ['update', 'edit'], modify: ['edit', 'update'], change: ['change', 'edit'], rename: ['edit', 'name'],
  create: ['add', 'new', 'create'], add: ['add'], new: ['new', 'add'], submit: ['submit', 'save'], save: ['save', 'saved'], confirm: ['confirm', 'submit'], apply: ['apply'],
  cancel: ['cancel', 'close'], dismiss: ['close', 'cancel'], close: ['close'], request: ['request', 'ask'], ask: ['request', 'contact'], approve: ['approve', 'approved'], reject: ['rejected', 'reject'],
  view: ['view', 'detail'], open: ['open', 'view'], preview: ['preview'], detail: ['detail', 'details'], history: ['history', 'timeline'], timeline: ['timeline', 'history'],
  export: ['download', 'export'], share: ['share'], copy: ['copy'], assign: ['assign', 'assigned'], transfer: ['transfer', 'owner'], reassign: ['assign', 'owner'],
  deactivate: ['delete', 'removed'], disable: ['disable', 'off'], enable: ['enable', 'on'], hide: ['hide'], restore: ['restore'], renew: ['renew', 'auto-renew'], expire: ['expiry', 'expire'], expiry: ['expiry', 'expire'],
  upload: ['upload', 'image'], attach: ['attachment', 'upload'], gallery: ['image', 'photography'], media: ['image', 'video'],
  /* data and form states */
  fail: ['failed', 'error'], failure: ['failed', 'error'], wrong: ['error', 'failed'], success: ['success', 'successfully'], successful: ['success', 'successfully'], saved: ['save', 'success', 'successfully'],
  zero: ['empty', 'no'], nothing: ['empty', 'no record'], none: ['empty', 'no'], spinner: ['loading', 'spinner'], skeleton: ['loading', 'skeleton'], validation: ['error', 'required', 'valid'], invalid: ['error', 'valid'], required: ['required'],
  /* the market */
  location: ['location', 'city'], city: ['city', 'location'], district: ['location'], neighbourhood: ['location'], neighborhood: ['location'],
  sms: ['sms'], email: ['email'], phone: ['phone', 'mobile'], mobile: ['mobile', 'phone'],
  translate: ['arabic', 'english', 'language'], arabic: ['arabic'], english: ['english'],
  metric: ['performance', 'reports', 'views'], kpi: ['performance', 'reports'], impression: ['views'], click: ['clicks'],
};
/* keyed by STEM, because a query's words are stemmed before the lookup
   ("blocked" → block, "saved" → sav) */
export const PRD_SYNONYMS = (() => {
  const out = { ...SYNONYMS };
  for (const [k, v] of Object.entries(PRD_EXTRA)) { const s = stem(k); out[s] = [...new Set([...(out[s] || []), ...v])]; }
  return out;
})();

/** the query's own words, and the product's words its synonyms add */
export const expand = (query, { synonyms = SYNONYMS, stop = STOP } = {}) => {
  const q = words(query, stop);
  const qSyn = [...new Set(q.flatMap((w) => (synonyms[w] || []).map(stem)))].filter((w) => !q.includes(w));
  return { q, qSyn };
};

/* ── the documents ─────────────────────────────────────────────────── */
export const buildDocs = (kb) => {
  const docs = [];
  for (const s of kb.screens) {
    docs.push({ type: 'screen', kind: 'screen', screen: s.slug, name: s.slug, title: s.title, what: s.purpose, how: `route ${s.route}`, files: s.files, kbPage: `kb/screens/${s.slug}.html`,
      fields: [[s.title, 4], [s.slug, 3], [s.route, 2], [s.purpose, 3], [s.lines.join(' '), 0.7]] });
    for (const x of s.states) {
      docs.push({ type: 'state', kind: x.kind, screen: s.slug, name: `${s.slug}--${x.name}`, title: x.title || x.name, what: x.shows, how: x.how, files: x.files, kbPage: `kb/screens/${s.slug}.html`,
        fields: [[x.name.replace(/-/g, ' '), 4], [x.title, 4], [x.how, 2.5], [x.shows, 2], [x.buttons.join(' '), 2], [x.note, 1.5], [x.lines.join(' '), 1], [`${s.title} ${s.slug}`, 1.2], [x.mode || '', 3], [x.responsiveName ? x.responsiveName.replace(/-/g, ' ') : '', 2]] });
      if (x.responsiveName) docs[docs.length - 1].what = `${x.shows}  [web: ${x.kind} · phone: ${x.responsiveKind}]`;
    }
  }
  for (const c of kb.components) {
    docs.push({ type: 'component', kind: 'component', screen: null, name: c.slug, title: c.name, what: `${c.level} · ${c.group}${c.def ? ` · ${c.def}` : ''} · ${c.web} web / ${c.responsive} responsive variants`, how: `used on ${c.screens.slice(0, 8).join(', ')}`, files: { web: c.file, responsive: c.responsive ? `${c.file}#responsive` : null },
      fields: [[c.name.replace(/([a-z])([A-Z])/g, '$1 $2'), 4], [c.slug.replace(/-/g, ' '), 3], [c.group, 1], [c.def || '', 1.5], [c.level, 1]] });
  }
  return docs;
};

/* ── score ─────────────────────────────────────────────────────────────
   search(docs, query, opts) → { query, q, qSyn, scored } — scored is every
   document that matched, best first; each is the document plus its score
   (and, with explain, the query words it matched and how many).

   device     'web' | 'responsive' — only what exists in that layout
   kind       one state kind (modal, drawer…), 'screen' or 'component'
   screen     one screen's slug
   synonyms   the synonym table (default SYNONYMS — design-find's)
   stop       the stop words (default STOP)
   boost      { <screen slug>: factor } — multiply a screen's documents
   explain    add matched: [words], synMatched: [words], hits to each result
   prep       a function applied to the query AND every field's text before
              it is split into words — design-brief uses it to undo what
              stem() does to "dates" and "saving"; default: none */
export const search = (docs, query, { device = null, kind = null, screen = null, synonyms = SYNONYMS, stop = STOP, boost = null, explain = false, prep = null } = {}) => {
  const P = prep || ((t) => t);
  const { q, qSyn } = expand(P(query), { synonyms, stop });
  const phrase = query.toLowerCase().replace(/\s+/g, ' ').trim();
  const scored = [];
  for (const d of docs) {
    if (device === 'web' && !d.files.web) continue;
    if (device === 'responsive' && !d.files.responsive) continue;
    if (kind && d.kind !== kind) continue;
    if (screen && d.screen !== screen) continue;
    let score = 0, hits = 0;
    const matched = explain ? [] : null, synMatched = explain ? [] : null;
    const bags = d.fields.map(([t, w]) => [new Set(words(prep ? P(t || '') : t)), String(t || '').toLowerCase(), w]);
    for (const w of q) {
      let best = 0;
      for (const [bag, raw, wt] of bags) if (bag.has(w) || (w.length > 3 && [...bag].some((b) => b.startsWith(w)))) best = Math.max(best, wt);
      if (best) { hits++; if (explain) matched.push(w); }
      score += best;
    }
    for (const w of qSyn) { let best = 0; for (const [bag, , wt] of bags) if (bag.has(w)) best = Math.max(best, wt); score += best * 0.5; if (explain && best) synMatched.push(w); }
    if (phrase.length > 4 && bags.some(([, raw]) => raw.includes(phrase))) score += 6;
    /* every word of the query found somewhere counts for more than one word found many times */
    if (q.length > 1) score *= 0.5 + 0.5 * (hits / q.length);
    if (d.type === 'screen') score *= 1.1;
    if (boost && d.screen && boost[d.screen]) score *= boost[d.screen];
    if (score > 0) scored.push(explain ? { ...d, score: +score.toFixed(2), matched, synMatched, hits } : { ...d, score: +score.toFixed(2) });
  }
  scored.sort((a, b) => b.score - a.score);
  return { query, q, qSyn, scored };
};

/** how often each word appears across the documents' text — for weighting a
    long requirement's rare words above its common ones */
export const documentFrequency = (docs) => {
  const df = new Map();
  for (const d of docs) {
    const seen = new Set();
    for (const [t] of d.fields) for (const w of words(t)) seen.add(w);
    for (const w of seen) df.set(w, (df.get(w) || 0) + 1);
  }
  return df;
};

/* ── the product's shipped copy ──────────────────────────────────────
   translation.json is flat: key → English. The key is usually the English
   too, but not always ("low_credit_balance_unified_hint" → "You are running
   low on credits…"), so both are kept. The copy areas in kb/product/copy/
   say where a string ships (the directory whose components call t() with
   it); a string in no area is in translation.json but not called by name
   anywhere the build could see — possibly another tenant's. */
const unescapeHtml = (s) => String(s).replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');
let COPY = null;
export const loadCopy = () => {
  if (COPY) return COPY;
  const read = (p) => { try { return JSON.parse(readFileSync(p, 'utf8')); } catch { return {}; } };
  const en = read(join(REPO, 'src', 'locales', 'en', 'translation.json'));
  const ar = read(join(REPO, 'src', 'locales', 'ar', 'translation.json'));
  const areas = new Map();                                     /* English → Set(area) */
  const arOf = new Map();                                      /* English → Arabic, as the copy pages print it */
  const dir = join(ROOT, 'kb', 'product', 'copy');
  if (existsSync(dir)) {
    for (const f of readdirSync(dir).filter((f) => f.endsWith('.html'))) {
      const area = f.replace(/\.html$/, '');
      const html = readFileSync(join(dir, f), 'utf8');
      for (const m of html.matchAll(/<tr><td>([\s\S]*?)<\/td><td>([\s\S]*?)<\/td><\/tr>/g)) {
        const e = unescapeHtml(m[1]).trim(), a = unescapeHtml(m[2]).trim();
        if (!e) continue;
        if (!areas.has(e)) areas.set(e, new Set());
        areas.get(e).add(area);
        if (a && a !== '—' && !arOf.has(e)) arOf.set(e, a);
      }
    }
  }
  const strings = [];
  for (const [key, value] of Object.entries(en)) {
    if (typeof value !== 'string') continue;
    const text = value.replace(/<[^>]+>/g, '').trim();
    if (!text) continue;
    strings.push({ key, en: text, ar: arOf.get(text) || (typeof ar[key] === 'string' ? ar[key].replace(/<[^>]+>/g, '').trim() : null), areas: [...(areas.get(text) || areas.get(key) || [])] });
  }
  COPY = { en, ar, strings, areas, available: Object.keys(en).length > 0 };
  return COPY;
};
