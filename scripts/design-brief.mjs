#!/usr/bin/env node
/**
 * A PRD in, a design brief out.
 *
 * The product agent writes a PRD in product words — "let agency staff mark a
 * daily-rental listing as booked from the listings page". Before a single
 * artboard, the skill has to know which of the ~360 compiled screens and
 * states that touches, what the design must cover (who, which layout, which
 * data and form states, which steps), which of the product's own strings fit,
 * which flags can switch the surface off — and, named plainly, what does not
 * exist yet. This reads the PRD, splits it into requirements and each
 * requirement into the separate asks it makes, searches the design knowledge
 * base for each ask (scripts/lib/design-search.mjs, the engine design-find
 * uses, with a wider synonym list for PRD language), and writes that down.
 *
 *   node scripts/design-brief.mjs prd.md
 *   node scripts/design-brief.mjs prd.md --out brief.md
 *   node scripts/design-brief.mjs prd.md --json [--out brief.json]
 *
 * Reads: data/design-kb.json (every compiled screen and state), the product's
 * translation.json (en + ar) and kb/product/copy/*.html (where each string
 * ships), kb/product/flags.html and kb/pages/<route>.html (the flags each
 * route reads), and the product source for which flags the code behind a
 * matched surface reads.
 *
 * It finds; it does not decide. Every match carries its evidence (the words
 * it matched, the file to open) and a confidence, and every ask it could not
 * place is listed as a gap — "new design needed" — rather than forced onto
 * the nearest screen. How it decides:
 *
 *   - an ask is searched with the title of the feature it sits under
 *     ("R1 — Mark as booked from My Listings"), so "each range can be
 *     removed" is looked for in the booking modal, not everywhere;
 *   - a screen the PRD names ("on the dashboard") is where the ask must be
 *     met — a match on another screen is a pattern to reuse, not coverage;
 *   - coverage is the share of the ask's own words the best STATE on that
 *     screen has, each word weighted by how rare it is in the knowledge base;
 *     words that describe behaviour rather than a surface ("says", "starts",
 *     "keeps") weigh a fifth. ≥ 60% exists · 40–60% partly · < 40% gap.
 *
 * BRIEF_DEBUG='<words of one ask>' prints that ask's ranked candidates and
 * each word's coverage, to see why it matched what it matched.
 */
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, basename, relative } from 'node:path';
import {
  ROOT, REPO, loadKb, buildDocs, search, words, stem, expand, loadCopy,
  PRD_SYNONYMS, PRD_STOP,
} from './lib/design-search.mjs';

/* ── arguments ───────────────────────────────────────────────────────── */
const args = process.argv.slice(2);
const opt = (n) => { const i = args.indexOf(n); return i > -1 ? args[i + 1] : null; };
const FILE = args.find((a, i) => !a.startsWith('--') && args[i - 1] !== '--out');
const OUT = opt('--out'), JSON_OUT = args.includes('--json');
if (!FILE || args.includes('--help')) {
  console.error('usage: node scripts/design-brief.mjs <prd.md|prd.txt> [--out brief.md] [--json]');
  process.exit(2);
}
if (!existsSync(FILE)) { console.error(`no such file: ${FILE}`); process.exit(2); }
const kb = loadKb();
if (!kb) { console.error('data/design-kb.json is missing — run node scripts/ds/design-kb.mjs'); process.exit(2); }

const rel = (p) => { const r = relative(ROOT, p); return !r || r.startsWith('..') ? p : r; };
const readText = (p) => (existsSync(p) ? readFileSync(p, 'utf8') : '');
const unesc = (s) => String(s).replace(/<[^>]+>/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
const uniq = (a) => [...new Set(a)];
const clip = (s, n) => { s = String(s || '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1) + '…' : s; };

/* ═══ 1. THE PRD ═══════════════════════════════════════════════════════
   Markdown or plain text: headings make sections, a section's title says
   what kind of section it is, bullets and numbered items are requirements,
   a paragraph's sentences are requirements when they ask for something,
   "As a …, I want …" is a story and Given/When/Then is a criterion. */
const SECTION_KINDS = [
  ['stories', /\b(user stories|stories|jobs to be done|jtbd|use cases?)\b/i],
  ['criteria', /\b(acceptance( criteria)?|definition of done|dod|test cases?|scenarios?)\b/i],
  ['out', /\b(out of scope|not in scope|non[- ]goals?|won'?t (do|have)|excluded|exclusions|future work)\b/i],
  ['questions', /\b(open questions?|questions|tbd|to be decided|unknowns?)\b/i],
  ['analytics', /\b(analytics|tracking|ga4|instrumentation|telemetry|events)\b/i],
  ['nfr', /\b(non[- ]functional|nfrs?|constraints|platforms?|locali[sz]ation|accessibility|devices?|browsers?|languages?)\b/i],
  ['roles', /^(users?|personas?|roles?|audience|who( it'?s for)?|target users?|user types?|actors?)\s*$/i],
  ['skip', /^(background|context|problem( statement)?|goals?|objectives?|motivation|summary|overview|tl;?dr|success metrics?|metrics|kpis?|stakeholders?|owners?|timeline|milestones?|rollout|release( plan)?|appendix|references?|glossary|changelog|revision history|risks?|dependencies|assumptions|why)\b/i],
];
const kindOf = (title) => (SECTION_KINDS.find(([, re]) => re.test(title.replace(/^\s*(?:\d+(?:\.\d+)*|[A-Z])[.)]\s*/, '').trim())) || ['requirements'])[0];
/* a requirements section whose title names a feature gives its items context */
const GENERIC_TITLE = /^(requirements?|functional( requirements?)?|features?|scope|details?|specs?|specification|ux|design|flows?|behaviou?rs?|user experience|in scope|must haves?|nice to haves?|p[0-3])$/i;
const ID_PREFIX = /^\s*(?:(?:R|FR|REQ|F|US|AC)[-\s]?\d+(?:\.\d+)*|\d+(?:\.\d+)*|[A-Z][.)])\s*[.)]?\s*[—–:-]?\s*/i;
const featureTitle = (s) => (s.kind === 'requirements' && s.title && !GENERIC_TITLE.test(s.title.replace(ID_PREFIX, '').trim())
  ? s.title.replace(ID_PREFIX, '').trim() : null);

const parsePrd = (text) => {
  const lines = text.replace(/\r\n?/g, '\n').split('\n');
  const prd = { title: null, sections: [] };
  let sec = { level: 0, title: '', path: [], kind: 'top', items: [] };
  prd.sections.push(sec);
  const stack = [];
  let para = [], item = null;
  const flushItem = () => { if (item) { sec.items.push(item); item = null; } };
  const flushPara = () => {
    if (!para.length) return;
    const t = para.join(' ').replace(/\s+/g, ' ').trim();
    para = [];
    /* Given/When/Then written as lines of one paragraph is one criterion */
    if (/^given\b/i.test(t)) { sec.items.push({ text: t, from: 'paragraph' }); return; }
    for (const s of t.split(/(?<=[.!?])\s+(?=[A-Z"“])/)) if (s.trim()) sec.items.push({ text: s.trim(), from: 'paragraph' });
  };
  const heading = (level, title) => {
    flushItem(); flushPara();
    title = title.replace(/[*_`]/g, '').trim();
    if (level === 1 && !prd.title) { prd.title = title; return; }
    while (stack.length && stack[stack.length - 1].level >= level) stack.pop();
    const parentKind = stack.length ? stack[stack.length - 1].kind : null;
    let kind = kindOf(title);
    /* a subsection inherits its parent's kind unless its own title says otherwise */
    if (kind === 'requirements' && parentKind && parentKind !== 'top' && parentKind !== 'skip') kind = parentKind;
    sec = { level, title, path: [...stack.map((s) => s.title), title], kind, items: [] };
    stack.push(sec);
    prd.sections.push(sec);
  };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].replace(/\t/g, '    ');
    let m;
    if ((m = line.match(/^\s{0,3}(#{1,6})\s+(.*?)\s*#*\s*$/))) { heading(m[1].length, m[2]); continue; }
    /* setext headings */
    if (line.trim() && /^\s*(=+|-+)\s*$/.test(lines[i + 1] || '') && !/^\s*([-*+•]|\d+[.)])\s/.test(line) && !item && !para.length) { heading(/=/.test(lines[i + 1]) ? 1 : 2, line.trim()); i++; continue; }
    /* a bold line on its own, or a short line ending in a colon, is a heading in many PRDs */
    if ((m = line.match(/^\s*\*\*([^*]{2,80})\*\*:?\s*$/)) || (!item && !para.length && (m = line.match(/^([A-Z][^.!?:]{2,60}):\s*$/)))) { heading(Math.max(3, (stack.length ? stack[stack.length - 1].level : 2) + 1), m[1]); continue; }
    if ((m = line.match(/^(\s*)([-*+•]|\d+[.)]|[a-z][.)]|\[[ xX]\])\s+(.*)$/))) {
      flushItem(); flushPara();
      item = { text: m[3].replace(/^\[[ xX]\]\s+/, ''), indent: m[1].length, from: 'bullet' };
      continue;
    }
    if (!line.trim()) { flushItem(); flushPara(); continue; }
    if (/^\s*(\|.*\||```|---+\s*$)/.test(line)) continue;                    /* tables, fences, rules */
    if (item) { item.text += ' ' + line.trim(); continue; }
    para.push(line.trim());
  }
  flushItem(); flushPara();
  /* a bullet that ends in a colon introduces the deeper bullets under it */
  for (const s of prd.sections) {
    let lead = null;
    for (const it of s.items) {
      it.text = it.text.replace(/\*\*|__|`/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').trim();
      if (/:$/.test(it.text)) { lead = it; it.lead = true; continue; }
      if (lead && (it.indent || 0) > (lead.indent || 0)) it.context = lead.text.replace(/:$/, '');
      else lead = null;
    }
  }
  if (!prd.title) prd.title = (text.split('\n').find((l) => l.trim()) || basename(FILE)).replace(/^#+\s*/, '').trim().slice(0, 120);
  return prd;
};

/* ═══ 2. THE PRODUCT'S KNOWLEDGE ═══════════════════════════════════════ */
const docs = buildDocs(kb);
const N = docs.length;
let normaliseRef = (t) => t;                                  /* set below, once normalise() exists */
const docBag = () => { if (!docBag.v) docBag.v = docs.map((d) => { const s = new Set(); for (const [t] of d.fields) for (const w of words(normaliseRef(t || ''))) s.add(w); return s; }); return docBag.v; };
const dfCache = new Map();
/* document frequency with search()'s own matching rule: a word longer than
   three letters also matches the words it begins */
const df = (w) => {
  if (!dfCache.has(w)) { let n = 0; for (const b of docBag()) if (b.has(w) || (w.length > 3 && [...b].some((x) => x.startsWith(w)))) n++; dfCache.set(w, n); }
  return dfCache.get(w);
};
/* words that say what happens rather than what is on screen — rare in a
   design's text, so rarity alone would call them its most telling words */
const WEAK = new Set('say says said start starts started try tries tried keep keeps kept offer offers pick picks open opens click clicks clicked tap taps press presses happen happens appear appears go goes come comes know knows find finds look looks give take put bring let make one more next each first last still already again back always never instead exist current help helps stuck contact customer customers week day today want wants able taken free'.split(' ').map(stem));
/* who does it is covered by the Roles line, not by a screen's words */
const ROLE_WORDS = new Set('staff agent agency owner admin member individual seller landlord employee broker manager user team colleague'.split(' ').map(stem));
const idf = (w) => Math.log(1 + N / (1 + df(w))) * (WEAK.has(w) ? 0.2 : ROLE_WORDS.has(w) ? 0.3 : 1);
/* the stemmer shared with design-find cuts "dates" to "dat" and "saving" to
   "sav" — three letters, too short to match "date" or "save" by prefix — and
   "bookings" to "booking" where the product says "Booked". Put the base word
   back before searching. */
const normalise = (t) => t
  .replace(/\b(date|save|page|type|rate|note|close|use|share|move|price|range|change|image|message|package|badge|license|licence|invite|update|create|delete|remove|manage|schedule|complete|value|title|profile|size)(s|d)\b/gi, '$1')
  .replace(/\b(sav|dat|pag|typ|rat|not|clos|us|shar|mov|pric|rang|chang|imag|messag|packag|invit|updat|creat|delet|remov|manag|schedul|complet)ing\b/gi, '$1e')
  .replace(/\b(\w{3,}ing)s\b/gi, '$1')
  .replace(/\b(\w*[aeiou])([bcdfgklmnprstvz])\2ing\b/gi, '$1$2');           /* overlapping → overlap */
normaliseRef = normalise;
const screenBySlug = new Map(kb.screens.map((s) => [s.slug, s]));
const stateOf = (name) => { const [slug, st] = name.split('--'); const s = screenBySlug.get(slug); return s ? s.states.find((x) => x.name === st) : null; };

/* flags: the KSA tenant's constants, and which route pages read which */
const FLAGS = new Map();
for (const m of readText(join(ROOT, 'kb', 'product', 'flags.html')).matchAll(/<tr><td><code>([A-Z][A-Z0-9_]+)<\/code><\/td><td>([\s\S]*?)<\/td><td>([\s\S]*?)<\/td><\/tr>/g)) {
  FLAGS.set(m[1], { name: m[1], value: unesc(m[2]), refs: [...m[3].matchAll(/<code>([^<]+)<\/code>/g)].map((x) => x[1]) });
}
const flagEffect = (name, value) => {
  const v = String(value).trim();
  if (/^(HIDE|DISABLE)_/.test(name)) return v === 'true' ? 'off' : v === 'false' ? 'on' : 'depends';
  if (v === 'true') return 'on';
  if (v === 'false') return 'off';
  if (/=>/.test(v)) return 'value';
  return /isDevelopment|isMobile|&&|\|\||\?/.test(v) ? 'depends' : 'value';
};
const flagValue = (v) => (/^\{/.test(v) ? '{…}' : clip(v, 48));
const EFFECT_TEXT = { off: '**off in KSA** — what it gates is not in this product', on: 'on in KSA', depends: 'depends on the environment', value: 'a value' };
const ROUTE_PAGES = [];
const pagesDir = join(ROOT, 'kb', 'pages');
if (existsSync(pagesDir)) {
  for (const f of readdirSync(pagesDir).filter((f) => f.endsWith('.html') && !f.includes('.board.') && !f.startsWith('_'))) {
    const t = unesc(readText(join(pagesDir, f)).replace(/<\/?(pre|code)[^>]*>/g, '\n'));
    const route = (t.match(/\broute\s+(\/\S*)/) || [])[1];
    const flagLine = (t.match(/\bflags\s+(.*?)\s+(?:states|uses|lang)\b/) || [])[1] || '';
    const flags = [...flagLine.matchAll(/\b([A-Z][A-Z0-9_]{2,})\b(\s*\(gates the route\))?/g)].map((x) => ({ name: x[1], gates: !!x[2] }));
    if (route) ROUTE_PAGES.push({ file: `kb/pages/${f}`, route, flags });
  }
}
const routePageOf = (screen) => {
  if (!screen) return null;
  if (screen.kb && existsSync(join(ROOT, screen.kb))) return ROUTE_PAGES.find((p) => p.file === screen.kb) || { file: screen.kb, route: screen.route, flags: [] };
  const exact = ROUTE_PAGES.find((p) => p.route === screen.route);
  if (exact) return exact;
  const last = screen.route.split('/').filter(Boolean).pop();
  return ROUTE_PAGES.find((p) => p.route.split('/').filter(Boolean).pop() === last) || null;
};

/* the product source, for the flags the code behind a surface reads — one
   pass over src, only if the product repo sits beside this one */
let FLAG_FILES = null;
const flagFiles = () => {
  if (FLAG_FILES) return FLAG_FILES;
  FLAG_FILES = new Map();
  const src = join(REPO, 'src');
  if (!existsSync(src) || !FLAGS.size) return FLAG_FILES;
  const re = new RegExp(`\\b(${[...FLAGS.keys()].join('|')})\\b`, 'g');
  const walk = (d) => {
    for (const n of readdirSync(d)) {
      const p = join(d, n); const st = statSync(p);
      if (st.isDirectory()) { if (!/node_modules|\.git|locales|__tests__/.test(n)) walk(p); continue; }
      if (!/\.(jsx?|tsx?)$/.test(n) || st.size > 1.5e6 || /tenant\/(?!bayut|common)[^/]+\//.test(p)) continue;
      const found = new Set([...readFileSync(p, 'utf8').matchAll(re)].map((m) => m[1]));
      if (found.size) FLAG_FILES.set(relative(REPO, p), found);
    }
  };
  walk(src);
  return FLAG_FILES;
};
/* the source directory a copy area came from (scripts/build.mjs areaOf) */
const areaDirs = (area) => {
  if (area === 'shell') return ['src/layout/'];
  let m;
  if ((m = area.match(/^page-(.+)$/))) return [`src/container/pages/${m[1]}/`];
  if ((m = area.match(/^common-(.+)$/))) return [`src/components/common/${m[1]}/`];
  if ((m = area.match(/^tenant-(.+)$/))) return [`src/tenant/bayut/components/${m[1]}/`, `src/tenant/common/components/${m[1]}/`];
  return [`src/components/${area}/`, `src/components/${area}.js`];
};
const flagsInFiles = (paths) => {
  const out = new Map();
  for (const [file, set] of flagFiles()) {
    const hit = paths.find((p) => (p.endsWith('/') ? file.startsWith(p) : file === p));
    if (hit) for (const f of set) { if (!out.has(f)) out.set(f, new Set()); out.get(f).add(file); }
  }
  return out;
};

/* the product's copy, and how rare each of its words is */
const COPY = loadCopy();
const copyIdx = COPY.strings.map((s) => ({ ...s, toks: uniq(words(s.en.replace(/[‐-―]/g, ' '), PRD_STOP)), nWords: s.en.split(/\s+/).length }));
const copyDf = new Map();
for (const c of copyIdx) for (const w of c.toks) copyDf.set(w, (copyDf.get(w) || 0) + 1);
const copyIdf = (w) => Math.log(1 + copyIdx.length / (1 + (copyDf.get(w) || 0)));
const copyByText = new Map(copyIdx.map((c) => [c.en.toLowerCase(), c]));

/* ═══ 3. READING A REQUIREMENT ══════════════════════════════════════════ */
/* The screens a PRD names, in the words a PRD names them. "agency staff" is
   also a role, so the staff page needs a page word after it. */
const SCREEN_HINTS = [
  ['dashboard', /\b(dashboard|overview (page|screen)|home ?page|home screen)\b/i, 1.6],
  ['listings', /\b((the )?listings? (page|screen|table|list|tab|grid)|my listings|manage listings|listing management|the listings)\b/i, 1.6],
  ['listings', /\blistings\b/i, 1.2],
  ['lms-leads', /\b(truleads|leads? (page|screen|table|list|inbox|management|drawer|details?)|lead management|crm)\b/i, 1.6],
  ['credits-usage', /\b(credits? usage|usage history|credit history|credits? history)\b/i, 1.6],
  ['packages', /\b(credits (&|and) packages|packages? page|buy (credits|a package)|pricing page|plans page|packages)\b/i, 1.5],
  ['agency-staff', /\b(agency staff (page|screen|list|table|tab)|staff (page|screen|management|list)|manage (agency )?(staff|users|team)|users page|team page|open agency staff)\b/i, 1.6],
  ['agent-performance', /\b(agent performance|trubroker|trupoints|leaderboard)\b/i, 1.6],
  ['reports-summary', /\b(reports? summary|summary report)\b/i, 1.6],
  ['reports-listing-report', /\b(listing reports?|listings? performance report)\b/i, 1.6],
  ['reports-leads-reports', /\b(leads? (&|and) reach report|leads? reports?|reach report)\b/i, 1.6],
  ['user-settings-user-profile', /\b(user settings|user profile|my profile|profile (page|settings)|settings page)\b/i, 1.5],
  ['user-settings-agency-profile', /\b(agency settings|agency profile)\b/i, 1.6],
  ['user-settings-change-password', /\b(change password|password (page|settings))\b/i, 1.6],
  ['user-settings-licenses', /\b(licen[cs]es (page|settings|tab)|fal licen[cs]es?)\b/i, 1.5],
  ['post-listing', /\b(post (a )?listing|create (a )?listing|new listing|listing form)\b/i, 1.6],
  ['ad-license', /\b(ad licen[cs]e|advertising licen[cs]e|rega licen[cs]e)\b/i, 1.5],
].filter(([slug]) => screenBySlug.has(slug));
const screenHints = (text) => {
  const out = new Map();
  for (const [slug, re, f] of SCREEN_HINTS) { const m = text.match(re); if (m && (!out.has(slug) || out.get(slug).factor < f)) out.set(slug, { slug, factor: f, said: m[0] }); }
  return [...out.values()].sort((a, b) => b.factor - a.factor);
};
const ROLE_RE = {
  owner: /\b(agency owners?|agency admins?|owners?|admins?|account owners?|principals?|managers?)\b/i,
  staff: /\b(agency staff|staff( users?| members?)?|agents?|employees?|team members?|sub-?users?|brokers?)\b/i,
  individual: /\b(individual( sellers?| users?| owners?)?|sellers?|landlords?|freelancers?|private (owners?|sellers?))\b/i,
};
const ROLE_NAME = { owner: 'agency owner', staff: 'agency staff', individual: 'individual seller' };
const rolesIn = (t) => Object.keys(ROLE_RE).filter((r) => ROLE_RE[r].test(t));
const OTHER_MARKETS = /\b(oman|bahrain|qatar|jordan|egypt|zameen|pakistan|uae|dubai|abu dhabi|lebanon)\b/i;
const OFF_PRODUCT = [
  [/\b(profolio[- ]lite|member area|lite experience)\b/i, 'Profolio-lite / the member area is v2 and not specified — stop and say so rather than applying Profolio chrome.'],
  [/\b(console|control panel|moderation|ops tool)\b/i, 'The internal Console / Control Panel is a different surface — not Profolio.'],
  [/\bjarvis\b/i, 'Jarvis is the CRM — note the connection, do not design it.'],
  [/\b(listing detail page|search results page|public profile|consumer (site|side|app))\b/i, 'The consumer side of bayut.sa belongs to Strat — only the Profolio side is designed here.'],
];

/* One requirement often asks for several things at once. Split on ";", on
   sentence ends, and on "and <verb>" — each part is searched alone, so
   "mark it as booked and see booked dates on the dashboard" finds both. */
const VERBS = 'see|view|get|gets|mark|marks|edit|edits|add|adds|remove|removes|delete|deletes|show|shows|receive|receives|set|sets|select|selects|upload|uploads|open|opens|ask|asks|send|sends|pick|picks|save|saves|choose|chooses|filter|filters|sort|sorts|share|shares|download|downloads|request|requests|pay|pays|buy|buys|assign|assigns|change|changes|update|updates|create|creates|invite|invites|notify|notifies|display|displays';
const KEEP_HYPHEN = new Set(['top-up', 'auto-renew', 'sub-user', 'e-mail', 'pop-up', 'check-in', 'check-out', 'follow-up', 'sign-in', 'sign-out', 'log-in', 'opt-in', 'add-on', 'short-term', 'side-panel', 'daily-rental']);
const dehyphen = (t) => t.split(/(\s+)/).map((tok) => { const core = tok.toLowerCase().replace(/^[^a-z]+|[^a-z]+$/g, ''); return core.includes('-') && !KEEP_HYPHEN.has(core) ? tok.replace(/(?<=[a-z])-(?=[a-z])/gi, ' ') : tok; }).join('').replace(/\bdaily-rental\b/gi, 'daily-rental daily rental');
const facetsOf = (req) => {
  let t = req.text.replace(/\s+/g, ' ').trim();
  let actor = null, condition = null;
  const story = t.match(/^\s*as\s+(?:an?|the)\s+(.+?),?\s+i\s+(?:want|need|would like|wish|expect|should be able|can)\s+(?:to\s+)?(.*)$/i);
  if (story) { actor = story[1]; t = story[2]; }
  const why = t.match(/,?\s+so\s+(?:that|i|we|they)\b(.*)$/i);
  if (why) t = t.slice(0, why.index);
  const cond = (actor || '').match(/\b(without|with no|with 0|with zero|who (?:has|have) no)\s+(.+)$/i) || req.text.match(/\b(without|with no|with 0|with zero|who (?:has|have) no)\s+([a-z-]+)/i);
  if (cond) condition = `${cond[1]} ${cond[2]}`.trim();
  if (req.kind === 'criteria' || /^given\b/i.test(t)) return { actor, condition, parts: [t] };
  const parts = t.split(new RegExp(`\\s*;\\s*|(?<=[a-z0-9)])\\.\\s+(?=[A-Z])|,?\\s+(?:and|while|but|then)\\s+(?=(?:${VERBS})\\b)`, 'i'))
    .map((s) => s.trim().replace(/[.;,]+$/, '')).filter((s) => words(dehyphen(s), PRD_STOP).length >= 2);
  return { actor, condition, parts: parts.length ? parts : [t] };
};
/* a condition ("without credits") is also words the copy says it in */
const CONDITION_WORDS = [[/credit|balance|quota|points?/i, 'insufficient low balance top-up'], [/booking|booked/i, 'no bookings'], [/lead/i, 'no leads'], [/listing/i, 'no record found'], [/licen[cs]e/i, 'license required']];

/* what a part asks the design to cover, from its words */
const NEEDS = {
  data: /\b(lists?|table|tables|card|cards|widget|dashboard|reports?|calendar|history|charts?|summary|feed|leaderboard|stats?|count|dates|overview|skeleton|loading|empty state|no \w+ it shows)\b/i,
  form: /\b(mark|marks|add|adds|edit|edits|save|saves|saving|saved|submit|submits|select|selects|pick|picks|enter|enters|set|sets|upload|uploads|update|updates|change|changes|create|creates|delete|deletes|remove|removes|removed|fill|fills|type|input|form|field|fields|dialog|modal)\b/i,
  flow: /\b(then|after|once|steps?|flow|wizard|confirm|confirms|otp|verify|verifies|approve|approves|notif\w*|sends?|asks?|asking|prompts?|redirect\w*)\b/i,
  phone: /\b(phone|mobile|375|responsive|small screens?|app)\b/i,
  arabic: /\b(arabic|rtl|right[- ]to[- ]left)\b/i,
  message: /\b(says?|message|messages|explains?|prompt|error|errors|label|labels|text|copy|title|toast|confirmation)\b/i,
};

/* ═══ 4. MATCHING ONE ASK ════════════════════════════════════════════════ */
const synOf = (w) => (PRD_SYNONYMS[w] || []).map(stem);
/* Coverage, field by field. A state's document also carries its screen's
   title and the fixture mode (buildDocs: fields 7 and 8) — where it is and
   who is signed in, not what it shows — so a word found only there counts
   a third. A synonym counts half. Matching is search()'s own: the word, or
   a word it begins when it is longer than three letters. */
const isContext = (d, i) => d.type === 'state' && (i === 7 || i === 8);
const bagCache = new Map();
const bagsOf = (d) => {
  const k = `${d.type}:${d.name}`;
  if (!bagCache.has(k)) bagCache.set(k, d.fields.map(([t], i) => ({ bag: new Set(words(normalise(t || ''))), ctx: isContext(d, i) })));
  return bagCache.get(k);
};
const inBag = (bag, w) => bag.has(w) || (w.length > 3 && [...bag].some((b) => b.startsWith(w)));
const coverage = (q, d) => {
  const bags = bagsOf(d);
  let got = 0, all = 0;
  const per = q.map((w) => {
    const syns = synOf(w).filter((x) => x !== w);
    let c = 0;
    for (const { bag, ctx } of bags) {
      if (inBag(bag, w)) c = Math.max(c, ctx ? 0.35 : 1);
      else if (syns.some((x) => bag.has(x))) c = Math.max(c, ctx ? 0.15 : 0.5);
    }
    const wt = idf(w); got += c * wt; all += wt;
    return { w, c, wt };
  });
  return { cov: all ? got / all : 0, per };
};
/* the word of an ask a match must have to count as the thing itself: its
   rarest word that names something (not a verb of speech, not a role, not
   the screen) */
const SURFACE = new Set('prompt popup pop-up dialog dialogue modal drawer panel sheet tooltip hint toast snackbar banner card widget button link page screen table row column list section tab chip badge label icon field form message view'.split(' ').map(stem));
const keyWord = (q, skip) => q.filter((w) => !WEAK.has(w) && !ROLE_WORDS.has(w) && !SURFACE.has(w) && !skip.has(w)).sort((a, b) => idf(b) - idf(a))[0] || null;
const SHELL_ASK = /\b(menu|rail|sidebar|side ?bar|header|navigation|nav|notif\w*|bell|help|support|download (the )?app|account menu|profile menu|language|switch(er)?|log ?out|sign ?out)\b/i;
const confidenceOf = (cov) => (cov >= 0.6 ? 'high' : cov >= 0.4 ? 'medium' : 'low');
const opts = { synonyms: PRD_SYNONYMS, stop: PRD_STOP };
const PATTERN_MIN = 0.45;                  /* a state this close to a new ask is worth reusing */

const matchPart = (askText, ctxText, reqHints = []) => {
  let hints = screenHints(askText);
  if (!hints.length && ctxText) hints = screenHints(ctxText);
  if (!hints.length && reqHints.length) hints = reqHints;
  const hostWords = new Set(hints.flatMap((h) => words(normalise(h.said), PRD_STOP)));
  /* the words naming the screen are met by being on it */
  const askQ = uniq(expand(normalise(dehyphen(askText)), opts).q).filter((w) => (!hostWords.has(w) || words(askText, PRD_STOP).length <= 2) && !/^\d+$/.test(w));
  const shellAsk = SHELL_ASK.test(askText);
  const boost = Object.fromEntries(hints.map((h) => [h.slug, h.factor]));
  const query = normalise(dehyphen(ctxText ? `${askText} ${ctxText}` : askText));
  const { q, scored } = search(docs, query, { ...opts, boost, explain: true, prep: normalise });
  const seen = new Set(), ranked = [];
  for (const d of scored.slice(0, 80)) {
    /* shell and account states repeat on every screen — keep one of each */
    if (d.kind === 'shell' || d.kind === 'account') {
      const key = `${d.kind}|${d.name.split('--').pop()}`;
      if (seen.has(key) && !hints.some((h) => h.slug === d.screen)) continue;
      seen.add(key);
    }
    const all = coverage(uniq(q).filter((w) => !hostWords.has(w)), d), own = coverage(askQ, d);
    /* the header, the rail and their overlays are on every screen; they are
       the answer only when the ask is about them */
    const shellPenalty = d.kind === 'shell' && !shellAsk ? 0.4 : 1;
    ranked.push({ ...d, covAll: all.cov, cov: own.cov * shellPenalty, per: own.per, rank: d.score * (0.5 + all.cov) * (0.5 + own.cov) * shellPenalty });
  }
  ranked.sort((a, b) => b.rank - a.rank);
  if (process.env.BRIEF_DEBUG && askText.toLowerCase().includes(process.env.BRIEF_DEBUG.toLowerCase())) {
    console.error(`\n[debug] “${askText}” q=${askQ.join(',')} hints=${hints.map((h) => h.slug)} key=${keyWord(askQ, hostWords)}`);
    for (const d of ranked.slice(0, 12)) console.error(`  ${d.rank.toFixed(1).padStart(6)} ${d.cov.toFixed(2)} ${d.name}  ${d.per.map((p) => `${p.w}:${p.c}@${p.wt.toFixed(1)}`).join(' ')}`);
  }
  const states = ranked.filter((d) => d.type === 'state');
  const screens = ranked.filter((d) => d.type === 'screen');
  const comps = ranked.filter((d) => d.type === 'component' && d.cov >= 0.2).slice(0, 4);
  /* the state anywhere whose text says most of what this ask says — the
     pattern to reuse when the named screen does not have it */
  const dataClass = /\b(loading|skeleton|spinner)\b/i.test(askText) ? 'loading' : /\b(empty|no \w+ (it|they) shows?|nothing to show|zero state)\b/i.test(askText) ? 'empty' : /\b(fails?|failed|error)\b/i.test(askText) && NEEDS.data.test(`${askText} ${ctxText || ''}`) ? 'error' : null;
  const classed = dataClass ? states.filter((d) => { const x = stateOf(d.name); return x && STATE_CLASSES[dataClass](x); }) : [];
  /* prefer states that have the ask's key word: "notification" beats "send" */
  const key0 = keyWord(askQ, hostWords);
  const hasKey = (d) => !key0 || (d.per.find((p) => p.w === key0) || { c: 0 }).c >= 0.5;
  const pool = classed.length ? classed : states;
  const pattern = [...pool].sort((a, b) => (hasKey(b) - hasKey(a)) || b.cov - a.cov || b.rank - a.rank)[0] || null;
  let host = hints.length ? hints[0].slug
    : states[0] && states[0].cov >= 0.4 ? states[0].screen
      : screens[0] && screens[0].cov >= 0.5 ? screens[0].screen : null;
  const onHost = host ? states.filter((d) => d.screen === host) : states;
  const best = onHost[0] || null;
  const top = best ? best.cov : 0;
  const key = keyWord(askQ, hostWords);
  const keyHit = best && key ? (best.per.find((p) => p.w === key) || { c: 1 }).c >= 0.5 : true;
  const status = top >= 0.6 && keyHit ? 'covered' : top >= 0.4 && (keyHit || top >= 0.5) ? 'partial' : 'gap';
  /* something new with no screen named goes where its nearest pattern is —
     said as a guess */
  let inferred = !hints.length && !!host;
  if (!host && status === 'gap' && pattern && pattern.cov >= PATTERN_MIN) { host = pattern.screen; inferred = true; }
  const ref = best && best.cov >= 0.25 ? best : pattern;
  const missing = (ref ? ref.per.filter((p) => p.c < 0.5).sort((a, b) => b.wt - a.wt).map((p) => p.w) : askQ).filter((w) => !WEAK.has(w) && !ROLE_WORDS.has(w) && !hostWords.has(w));
  const elsewhere = states.filter((d) => d.screen !== host && d.cov >= Math.max(0.4, top + 0.1)).sort((a, b) => b.cov - a.cov).slice(0, 2);
  return { q: askQ, key, host, inferred, hints, status, confidence: confidenceOf(top), best: status === 'gap' && inferred && !best ? null : best, pattern, places: onHost.filter((d) => d.cov >= 0.25).slice(0, 3), elsewhere, comps, screens: screens.slice(0, 2), missing };
};

/* ═══ 5. WHAT A SCREEN ALREADY HAS ══════════════════════════════════════ */
const STATE_CLASSES = {
  staff: (x) => /(^|-)as-staff($|-)/.test(x.name) || x.mode === 'staff',
  individual: (x) => /(^|-)as-individual($|-)/.test(x.name) || x.mode === 'member' || x.mode === 'individual',
  loading: (x) => /(^|-)(loading|skeleton|slow)($|-)/.test(x.name) || x.mode === 'slow',
  empty: (x) => /(^|-)(empty|no-data|no-records?|no-results?)($|-)/.test(x.name) || x.mode === 'empty' || /\bthe empty state\b/i.test(`${x.how} ${x.note}`),
  error: (x) => (/(^|-)error($|-)/.test(x.name) && !/errors/.test(x.name)) || x.mode === 'error',
  errors: (x) => /(^|-)(errors|invalid|validation|required)($|-)/.test(x.name) || /form-errors?/.test(x.name),
  filled: (x) => /(^|-)(filled|prefilled)($|-)/.test(x.name),
  saved: (x) => /(^|-)(saved|success|updated|message-save[\w-]*)($|-)/.test(x.name),
  failed: (x) => /(^|-)(failed|failure|save-failed)($|-)/.test(x.name),
  flow: (x) => /^flow-/.test(x.name) || x.kind === 'flow',
};
const statesOf = (slug, cls) => { const s = screenBySlug.get(slug); return s ? s.states.filter(STATE_CLASSES[cls]) : []; };
const anywhere = (cls) => kb.screens.flatMap((s) => s.states.filter(STATE_CLASSES[cls]).map((x) => `${s.slug}--${x.name}`));
const fileNote = (files) => `web ${files.web ? '✓' : '✗'} · 375 ${files.responsive ? '✓' : '✗'}`;
/* how the phone draws this product's overlays — measured from the compiled
   pairs: a modal on the web is often a drawer on the phone */
const phoneKinds = (() => {
  const m = {};
  for (const s of kb.screens) for (const x of s.states) if (x.files.web && x.files.responsive && x.responsiveKind && x.responsiveKind !== x.kind) { const k = `${x.kind}→${x.responsiveKind}`; m[k] = (m[k] || 0) + 1; }
  return m;
})();

const mustCover = (part, ctx) => {
  const t = part.text, m = part.match, host = m.host, screen = host ? screenBySlug.get(host) : null;
  const out = { roles: [], layouts: [], data: [], form: [], flows: [], conditions: [] };
  /* who */
  const named = uniq([...rolesIn(t), ...rolesIn(ctx.actor || ''), ...ctx.reqRoles]);
  const roles = named.length ? named : ctx.prdRoles.length ? ctx.prdRoles : ['owner', 'staff', 'individual'];
  for (const r of roles) {
    const why = named.includes(r) ? 'named' : ctx.prdRoles.includes(r) ? 'a PRD user' : 'no role named — confirm';
    if (!screen) { out.roles.push({ role: r, why, have: null, note: 'no screen yet' }); continue; }
    if (r === 'owner') { out.roles.push({ role: r, why, have: { name: screen.slug, files: screen.files }, note: 'the compiled pages are the agency owner' }); continue; }
    const v = statesOf(host, r)[0];
    out.roles.push({ role: r, why, have: v ? { name: `${host}--${v.name}`, files: v.files } : null, note: v ? '' : r === 'individual' ? `no ${host}--as-individual compiled yet — design from the owner page and say what differs` : `no ${host}--as-staff compiled — design it` });
  }
  /* which layouts: the matched state in both, or — for something new — the
     screen it goes on, to start from */
  const target = m.status !== 'gap' && m.best ? m.best : null;
  const files = target ? target.files : screen ? screen.files : { web: null, responsive: null };
  const isNew = !target;
  out.layouts.push({ layout: 'web 1440', have: files.web || null, isNew, of: target ? target.name : host });
  const drawn = target && target.type === 'state' && !files.responsive && phoneKinds[`${target.kind}→drawer`] ? `the phone draws ${phoneKinds[`${target.kind}→drawer`]} of this product's compiled ${target.kind}s as drawers` : '';
  out.layouts.push({ layout: 'responsive 375', have: files.responsive || null, isNew, of: target ? target.name : host, note: files.responsive ? '' : drawn });
  /* data states: what the screen shows while loading, empty, failed */
  if (NEEDS.data.test(t) && screen) {
    for (const c of ['loading', 'empty', 'error']) {
      const have = statesOf(host, c);
      const elsewhere = have.length ? [] : anywhere(c).slice(0, 2);
      out.data.push({ state: c, have: have.map((x) => ({ name: `${host}--${x.name}`, files: x.files })), pattern: elsewhere });
    }
  }
  /* form states */
  if (NEEDS.form.test(t)) {
    const on = uniq([host, m.best && m.best.screen].filter(Boolean));
    for (const c of ['errors', 'filled', 'saved', 'failed']) {
      const have = on.flatMap((slug) => statesOf(slug, c).map((x) => ({ name: `${slug}--${x.name}`, files: x.files })));
      out.form.push({ state: c, have, pattern: have.length ? [] : anywhere(c).slice(0, 1) });
    }
  }
  /* flows: the steps, when the ask has steps */
  if (NEEDS.flow.test(t) || (m.best && ['modal', 'drawer'].includes(m.best.kind) && NEEDS.form.test(t))) {
    const on = uniq([host, m.best && m.best.screen].filter(Boolean));
    const flows = on.flatMap((slug) => statesOf(slug, 'flow').map((x) => ({ name: `${slug}--${x.name}`, files: x.files, how: x.how })));
    const qs = new Set(m.q);
    const relevant = flows.filter((f) => words(`${f.name.replace(/-/g, ' ')} ${f.how}`).some((w) => qs.has(w)));
    out.flows.push({ have: relevant.length ? relevant : [], other: relevant.length ? [] : flows.slice(0, 3).map((f) => f.name), note: 'design the steps: trigger → overlay → success / failure' });
  }
  if (ctx.condition && t.toLowerCase().includes(ctx.condition.toLowerCase().split(' ').pop())) out.conditions.push(ctx.condition);
  return out;
};

/* ═══ 6. COPY AND FLAGS FOR ONE REQUIREMENT ═════════════════════════════ */
const copyFor = (parts, onScreenLines, condition) => {
  let q = uniq(parts.flatMap((p) => p.match.q)).filter((w) => !WEAK.has(w));
  if (condition) for (const [re, extra] of CONDITION_WORDS) if (re.test(condition)) q = uniq([...q, ...words(extra, PRD_STOP)]);
  const qs = new Set(q);
  const syn = new Set(q.flatMap(synOf).filter((w) => !qs.has(w)));
  const hitOf = (w) => qs.has(w) || (w.length > 4 && q.some((x) => x.length > 3 && (w.startsWith(x) || x.startsWith(w))));
  const scoredCopy = [];
  for (const c of copyIdx) {
    if (!c.toks.length || c.en.length > 140) continue;
    let s = 0, hit = 0;
    for (const w of c.toks) { if (hitOf(w)) { s += copyIdf(w); hit++; } else if (syn.has(w)) s += copyIdf(w) * 0.4; }
    if (!hit) continue;
    const own = hit / c.toks.length;                               /* how much of the string is about this */
    s *= 0.4 + own;
    if (c.toks.length / c.nWords < 0.4 && c.nWords > 2) s *= 0.5;  /* mostly glue words: a sentence, not a label */
    if (c.areas.length) s *= 1.3;                                  /* ships in a known area */
    if (onScreenLines.has(c.en.toLowerCase())) s *= 1.6;           /* already on the matched screen */
    if (c.toks.length > 10) s *= 0.7;
    scoredCopy.push({ ...c, s, onScreen: onScreenLines.has(c.en.toLowerCase()) });
  }
  scoredCopy.sort((a, b) => b.s - a.s);
  const out = [], seen = new Set();
  for (const c of scoredCopy) { const k = c.en.toLowerCase().replace(/[.!?:]+$/, ''); if (seen.has(k)) continue; seen.add(k); out.push(c); if (out.length >= 8) break; }
  return out;
};

const GENERIC_FLAG_WORDS = new Set(['enabled', 'enable', 'show', 'hide', 'is', 'has', 'have', 'allow', 'disable', 'flag', 'key', 'path', 'url', 'id', 'on', 'off', 'to', 'for', 'the', 'of', 'in', 'with', 'new', 'v2', 'data', 'type', 'mode'].map(stem));
/* the flags this ask depends on: named by it, or read by the code behind the
   state it matched (the component files, and the source of the copy area its
   strings ship from). Each screen's route flags are listed with the screen. */
const flagsFor = (parts) => {
  const out = new Map();
  const add = (name, why) => { const f = FLAGS.get(name); if (!f) return; if (!out.has(name)) out.set(name, { name, value: f.value, effect: flagEffect(name, f.value), why: [] }); out.get(name).why.push(why); };
  /* the ask's own naming words — no synonyms, no roles: "staff" must not
     bring in every flag with USER in its name */
  const q = new Set(parts.flatMap((p) => p.match.q).filter((w) => !WEAK.has(w) && !ROLE_WORDS.has(w) && !SURFACE.has(w)));
  for (const name of FLAGS.keys()) {
    const fw = name.toLowerCase().split('_').map(stem).filter((w) => !GENERIC_FLAG_WORDS.has(w));
    if (!fw.length) continue;
    const hit = fw.filter((w) => q.has(w));
    if (hit.length >= Math.min(2, fw.length) && hit.length / fw.length >= 0.5) add(name, `its name is what this asks about (“${hit.join(' ')}”)`);
  }
  const paths = [], areasSeen = new Set();
  for (const p of parts) {
    for (const c of p.match.comps) { const def = (String(c.what).match(/\bsrc\/\S+\.js\b/) || [])[0]; if (def) paths.push(def); }
    const b = p.match.status !== 'gap' ? p.match.best : null;
    const x = b ? stateOf(b.name) : null;
    if (!x) continue;
    const areaCount = new Map();
    for (const line of uniq([x.title, ...x.lines, ...x.buttons].filter(Boolean))) {
      const hit = copyByText.get(line.toLowerCase());
      if (hit && hit.areas.length && hit.areas.length <= 6) for (const a of hit.areas) areaCount.set(a, (areaCount.get(a) || 0) + 1);
    }
    for (const [a, n] of areaCount) if (n >= 2 && !areasSeen.has(a)) { areasSeen.add(a); paths.push(...areaDirs(a)); }
  }
  for (const [name, files] of flagsInFiles(uniq(paths))) add(name, `read by ${[...files].slice(0, 2).join(', ')}${files.size > 2 ? ` +${files.size - 2}` : ''}`);
  const rank = { off: 0, depends: 1, on: 2, value: 3 };
  return [...out.values()].sort((a, b) => rank[a.effect] - rank[b.effect] || a.name.localeCompare(b.name));
};

/* ═══ 7. THE WHOLE PRD ═══════════════════════════════════════════════════ */
const prdText = readFileSync(FILE, 'utf8');
const prd = parsePrd(prdText);
const reqs = [];
const context = { roles: [], layouts: [], languages: [], analytics: [], out: [], questions: [], scope: [] };
const n = { req: 0, story: 0, ac: 0 };
for (const s of prd.sections) {
  const items = s.items.filter((it) => !it.lead);
  if (s.kind === 'roles') { for (const it of items) context.roles.push(...rolesIn(it.text)); continue; }
  if (s.kind === 'out') { context.out.push(...items.map((it) => it.text)); continue; }
  if (s.kind === 'questions') { context.questions.push(...items.map((it) => it.text)); continue; }
  if (s.kind === 'analytics') { context.analytics.push(...items.map((it) => it.text)); continue; }
  if (s.kind === 'nfr') {
    for (const it of items) { if (NEEDS.phone.test(it.text)) context.layouts.push(it.text); if (NEEDS.arabic.test(it.text)) context.languages.push(it.text); }
    continue;
  }
  if (s.kind === 'skip') continue;
  const idm = s.title.match(/^\s*((?:R|FR|REQ|F)[-\s]?\d+(?:\.\d+)?)\b/i);
  const feature = featureTitle(s);
  let k = 0;
  for (const it of items) {
    const isStory = /^\s*as\s+(an?|the)\s+/i.test(it.text);
    const isAc = s.kind === 'criteria' || /^\s*given\b/i.test(it.text);
    /* a paragraph sentence counts only when it asks for something */
    if (it.from === 'paragraph' && !isStory && !isAc && !/\b(should|must|shall|can|will|needs? to|allow|let|lets|show|shows|display|see|want)\b/i.test(it.text)) continue;
    if (s.kind === 'top' && !isStory && !/\b(should|must|shall|want|allow|let)\b/i.test(it.text)) continue;
    const id = isAc ? `AC${++n.ac}` : isStory ? `US${++n.story}` : idm ? `${idm[1].toUpperCase().replace(/\s/g, '')}.${++k}` : `R${++n.req}`;
    reqs.push({ id, section: s.path.join(' › ') || '(top)', feature, kind: isAc ? 'criteria' : isStory ? 'story' : 'requirement', text: (it.context ? `${it.context}: ` : '') + it.text });
  }
}
context.roles = uniq(context.roles);
if (!context.roles.length) context.roles = uniq(rolesIn(prd.title));
for (const [re, why] of OFF_PRODUCT) if (re.test(prdText)) context.scope.push(why);
const markets = uniq([...prdText.matchAll(new RegExp(OTHER_MARKETS.source, 'gi'))].map((m) => m[0].toLowerCase()));
if (markets.length) context.scope.push(`The PRD names ${markets.join(', ')} — this system is Profolio KSA only; another market's flow is not this product.`);
if (context.languages.length || /\barabic\b/i.test(prdText)) context.scope.push('Arabic is asked for — no Arabic screen has been compiled yet: design English, and say Arabic is pending rather than mirroring by hand. The Arabic strings below ship with the product.');

for (const r of reqs) {
  const { actor, condition, parts } = facetsOf(r);
  const reqRoles = rolesIn(r.text);
  /* a part that names no screen is on its requirement's screen — when the
     requirement names exactly one */
  const reqHints = screenHints(r.text).length === 1 ? screenHints(r.text) : [];
  r.parts = parts.map((text) => ({ text, match: matchPart(text, r.feature, reqHints) }));
  for (const p of r.parts) p.cover = mustCover(p, { actor, condition, reqRoles, prdRoles: context.roles });
  const onScreen = new Set();
  for (const p of r.parts) for (const d of [p.match.best, p.match.pattern].filter(Boolean)) {
    const x = stateOf(d.name);
    if (x) for (const l of [x.title, ...x.lines, ...x.buttons]) if (l) onScreen.add(l.toLowerCase());
  }
  r.copy = COPY.available ? copyFor(r.parts, onScreen, condition) : [];
  /* an ask that describes a message nobody has written yet */
  r.copyGap = r.parts.filter((p) => NEEDS.message.test(p.text) && p.match.status !== 'covered' && !r.copy.some((c) => c.s > 8)).map((p) => p.text);
  r.flags = flagsFor(r.parts);
  r.roles = uniq([...reqRoles, ...rolesIn(actor || '')]);
  r.condition = condition;
  const st = r.parts.map((p) => p.match.status);
  r.status = st.every((s) => s === 'covered') ? 'covered' : st.every((s) => s === 'gap') ? 'gap' : st.includes('gap') ? 'partial (has a gap)' : 'partial';
}

/* the design work, deduplicated across requirements: one line per thing to
   draw, on the screen it goes on */
const work = new Map();
/* the state a feature's other asks were found in: a new ask of the same
   feature on the same screen is a new state OF it ("saving shows a success
   message" is the saved state of the booking modal), not a new screen */
const featureState = new Map();
for (const r of reqs) for (const p of r.parts) if (p.match.status !== 'gap' && p.match.best && r.feature) {
  const k = `${r.feature}|${p.match.host}`;
  if (!featureState.has(k)) featureState.set(k, p.match.best);
}
for (const r of reqs) for (const p of r.parts) {
  const m = p.match;
  if (m.status !== 'gap') continue;
  const sibling = r.feature && featureState.get(`${r.feature}|${m.host}`);
  const parent = (sibling && coverage(m.q, sibling).cov >= 0.2 ? sibling : null) || (m.pattern && m.pattern.screen === m.host && m.pattern.cov >= PATTERN_MIN ? m.pattern : null);
  if (parent) m.parent = parent;
}
for (const r of reqs) for (const p of r.parts) {
  const m = p.match;
  const where = m.host || '(screen to decide)';
  if (m.parent) {
    const key = `${where}|old|${m.parent.name}`;
    if (!work.has(key)) work.set(key, { where, label: m.parent.name, isNew: false, feature: false, status: 'partial', reqs: [], asks: [], words: new Set(), roles: new Set(), web: m.parent.files.web, phone: m.parent.files.responsive, phoneNote: '', data: new Set(), form: new Set(), flows: false, patterns: new Set(), newStates: [] });
    const w = work.get(key);
    w.status = 'partial';
    w.reqs.push(r.id);
    (w.newStates = w.newStates || []).push(clip(p.text, 70));
    for (const x of p.cover.roles) w.roles.add(x.role);
    for (const x of p.cover.form) if (!x.have.length) w.form.add(x.state);
    if (m.pattern && m.pattern.name !== m.parent.name && m.pattern.cov >= PATTERN_MIN) w.patterns.add(m.pattern.name);
    continue;
  }
  const isNew = m.status === 'gap';
  const label = isNew ? (r.feature ? `${r.feature} — ${clip(p.text, 70)}` : clip(p.text, 80)) : m.best.name;
  const key = `${where}|${isNew ? `new|${r.feature || p.text}` : `old|${label}`}`;
  if (!work.has(key)) work.set(key, { where, label, isNew, feature: !!(isNew && r.feature), status: m.status, reqs: [], asks: [], words: new Set(), roles: new Set(), web: null, phone: null, phoneNote: '', data: new Set(), form: new Set(), flows: false, patterns: new Set(), newStates: [] });
  const w = work.get(key);
  for (const x of m.q) if (!WEAK.has(x) && !ROLE_WORDS.has(x)) w.words.add(x);
  w.reqs.push(r.id);
  w.asks.push(p.text);
  if (!isNew && m.status !== w.status && m.status === 'partial') w.status = 'partial';
  const [web, phone] = p.cover.layouts;
  w.web = w.web || web.have; w.phone = w.phone || phone.have; if (phone.note) w.phoneNote = phone.note;
  for (const x of p.cover.roles) w.roles.add(x.role);
  for (const x of p.cover.data) if (!x.have.length) w.data.add(x.state);
  for (const x of p.cover.form) if (!x.have.length) w.form.add(x.state);
  if (p.cover.flows.length && !p.cover.flows[0].have.length) w.flows = true;
  if (isNew && m.pattern && m.pattern.cov >= PATTERN_MIN) w.patterns.add(m.pattern.name);
}
/* a story and the feature it restates are one thing to draw: fold a new
   item into another new item on the same screen when most of its words are
   that item's words */
const order = [...work.keys()];
for (const [k, w] of [...work]) {
  if (!w.isNew) continue;
  const earlier = order.slice(0, order.indexOf(k)).map((x) => work.get(x)).filter(Boolean);
  const into = earlier.find((o) => o.isNew && o.where === w.where && o.where !== '(screen to decide)' && (!w.feature || !o.feature || o.label.split(' — ')[0] === w.label.split(' — ')[0]) &&
    [...w.words].filter((x) => o.words.has(x)).length >= Math.max(1, Math.ceil(Math.min(w.words.size, o.words.size) * 0.5)));
  if (!into) continue;
  into.reqs.push(...w.reqs); into.asks.push(...w.asks);
  for (const x of w.words) into.words.add(x);
  for (const x of w.roles) into.roles.add(x);
  for (const x of w.data) into.data.add(x);
  for (const x of w.form) into.form.add(x);
  for (const x of w.patterns) into.patterns.add(x);
  into.flows = into.flows || w.flows;
  work.delete(k);
}
/* the screens this PRD touches */
const touched = uniq(reqs.flatMap((r) => r.parts.map((p) => p.match.host)).filter(Boolean)).map((slug) => {
  const s = screenBySlug.get(slug), page = routePageOf(s);
  return {
    slug, title: s.title, route: s.route, files: s.files, notes: `kb/screens/${slug}.html`, routePage: page ? page.file : null,
    staff: statesOf(slug, 'staff').map((x) => `${slug}--${x.name}`), individual: statesOf(slug, 'individual').map((x) => `${slug}--${x.name}`),
    data: Object.fromEntries(['loading', 'empty', 'error'].map((c) => [c, statesOf(slug, c).map((x) => `${slug}--${x.name}`)])),
    flows: statesOf(slug, 'flow').map((x) => `${slug}--${x.name}`),
    flags: page ? page.flags.map((f) => ({ name: f.name, gates: f.gates, value: FLAGS.has(f.name) ? FLAGS.get(f.name).value : null, effect: FLAGS.has(f.name) ? flagEffect(f.name, FLAGS.get(f.name).value) : 'unknown' })) : [],
    asks: reqs.filter((r) => r.parts.some((p) => p.match.host === slug)).map((r) => r.id),
  };
});

/* ═══ 8. WRITING IT DOWN ═════════════════════════════════════════════════ */
const md = [];
const L = (s = '') => md.push(s);
const code = (s) => `\`${s}\``;
const fileLinks = (files) => [files.web ? `web ${code(files.web)}` : 'web —', files.responsive ? `375 ${code(files.responsive)}` : '375 —'].join(' · ');
const statusWord = { covered: 'exists', partial: 'partly exists', gap: 'GAP — new design needed', 'partial (has a gap)': 'partly exists, with a gap' };
const icon = { covered: '●', partial: '◐', gap: '○', 'partial (has a gap)': '◐' };
/* a stem back to the word the PRD wrote ("upcom" → "upcoming") */
const asWritten = (w, text) => {
  for (const tok of String(text).toLowerCase().replace(/[’']/g, '').split(/[^a-z0-9؀-ۿ-]+/)) if (tok && words(normalise(dehyphen(tok)), PRD_STOP).includes(w)) return tok;
  return w;
};
const wordsList = (ws, n = 5, text = '') => uniq(ws.slice(0, n).map((w) => asWritten(w, text))).map((w) => `“${w}”`).join(', ');
const allParts = reqs.flatMap((r) => r.parts.map((p) => ({ r, p })));
const gaps = allParts.filter(({ p }) => p.match.status === 'gap');
const partials = allParts.filter(({ p }) => p.match.status === 'partial');

L(`# Design brief — ${prd.title}`);
L();
L(`From ${code(rel(FILE))} · design KB of ${String(kb.at).slice(0, 10)} (${kb.counts.screens} screens, ${kb.counts.states} states, ${kb.counts.components} components) · ${code('node scripts/design-brief.mjs')}`);
L();
L('A starting point for the proposal (SKILL.md, *How you work*, step 1), not the proposal. Every match is a file to open, with the words it matched and a confidence; every ask with nothing to open is a gap.');
L();
L('## At a glance');
L();
if (!reqs.length) L('**No requirements found.** A requirement is a bullet or numbered item, a user story ("As a …, I want …"), a Given/When/Then criterion, or a sentence that asks for something (should, must, can, will, show, let) — outside Background, Goals, Out of scope and the like. Nothing was matched; check the PRD\'s format.\n');
L(`${reqs.length} requirements making ${allParts.length} asks: **${allParts.filter(({ p }) => p.match.status === 'covered').length} exist** in the design system, **${partials.length} partly**, **${gaps.length} need new design**.`);
L();
L('| | Req | Ask | Where | Best existing match | Confidence |');
L('|---|---|---|---|---|---|');
for (const { r, p } of allParts) {
  const m = p.match;
  const first = r.parts[0] === p;
  L(`| ${icon[m.status]} | ${first ? r.id : ''} | ${clip(p.text, 72).replace(/\|/g, '/')} | ${m.host || '—'} | ${m.status === 'gap' ? `**new**${m.pattern && m.pattern.cov >= PATTERN_MIN ? ` · pattern: ${code(m.pattern.name)}` : ''}` : code(m.best.name)} | ${m.status === 'gap' ? '—' : `${m.confidence} (${Math.round(m.best.cov * 100)}%)`} |`);
}
L();
L('● exists · ◐ partly — the place exists, not everything the ask says · ○ new design needed. Percentages: the share of the ask\'s words the state has, rare words counting most; “~word” was found by a synonym.');
L();

L('## Gaps — new design needed');
L();
if (!gaps.length && !partials.length) L('None: every ask has a compiled screen or state.');
for (const { r, p } of gaps) {
  const m = p.match;
  L(`- **${r.id} — ${clip(p.text, 150).replace(/[.!?…]+$/, '')}.** ${m.host ? `Nothing on ${code(m.host)} does this` : 'No screen or state does this'}${m.missing.length ? ` (not found: ${wordsList(m.missing, 4, p.text)})` : ''}.` +
    `${m.pattern && m.pattern.cov >= PATTERN_MIN ? ` Nearest pattern: ${code(m.pattern.name)} (${Math.round(m.pattern.cov * 100)}%).` : ''}` +
    ` ${m.host ? `Start from ${code(screenBySlug.get(m.host).files.web)}.` : 'Where does it go? The PRD does not say — ask.'} Remake it, or will the designer supply it?`);
}
for (const { r, p } of partials) {
  const m = p.match;
  L(`- ${r.id} — ${clip(p.text, 120).replace(/[.!?…]+$/, '')}: partly, in ${code(m.best.name)}${m.missing.length ? ` — not found: ${wordsList(m.missing, 4, p.text)}` : ''}.`);
}
L();

L('## Design checklist');
L();
L('One line per thing to draw, on the screen it goes on. Tick each layout, role and state as it is drawn.');
L();
for (const w of work.values()) {
  const head = w.isNew ? `**NEW** — ${w.label}` : `${code(w.label)} (${statusWord[w.status]})`;
  L(`- [ ] **${w.where}** · ${head} · ${uniq(w.reqs).join(', ')}`);
  const lay = [
    `web 1440 ${w.isNew ? (w.web ? `start from ${code(w.web)}` : 'new') : w.web ? `✓ ${code(w.web)}` : '— design'}`,
    `375 ${w.isNew ? (w.phone ? `start from ${code(w.phone)}` : 'new') : w.phone ? `✓ ${code(w.phone)}` : `— design${w.phoneNote ? ` (${w.phoneNote})` : ''}`}`,
  ].join(' · ');
  L(`  - ${lay}`);
  if (w.isNew && uniq(w.asks).length > 1) L(`  - asks: ${uniq(w.asks).slice(0, 4).map((t) => `“${clip(t, 70)}”`).join(' · ')}`);
  if (w.newStates && w.newStates.length) L(`  - new states of it: ${uniq(w.newStates).map((t) => `“${t}”`).join(' · ')}`);
  const extra = [
    w.roles.size ? `roles: ${[...w.roles].map((r) => ROLE_NAME[r]).join(', ')}` : '',
    w.data.size ? `data states to design: ${[...w.data].join(', ')}` : '',
    w.form.size ? `form states to design: ${[...w.form].join(', ')}` : '',
    w.flows ? 'the steps (flow)' : '',
    w.patterns.size ? `reuse: ${[...w.patterns].slice(0, 2).map(code).join(', ')}` : '',
  ].filter(Boolean).join(' · ');
  if (extra) L(`  - ${extra}`);
}
L();

if (touched.length) {
  L('## Screens this PRD touches');
  L();
  for (const s of touched) {
    L(`### ${s.slug} — ${s.title} · ${code(s.route)}`);
    L();
    L(`${fileLinks(s.files)} · every state: ${code(s.notes)}${s.routePage ? ` · roles, flags, source: ${code(s.routePage)}` : ''} · asks: ${s.asks.join(', ')}`);
    L();
    L(`- Compiled variants: agency owner ✓ (the page) · agency staff ${s.staff.length ? `✓ ${s.staff.map(code).join(', ')}` : '✗'} · individual seller ${s.individual.length ? `✓ ${s.individual.map(code).join(', ')}` : '✗ not compiled yet'}`);
    L(`- Data states compiled: ${Object.entries(s.data).map(([k, v]) => `${k} ${v.length ? `✓ ${v.map(code).join(', ')}` : '✗'}`).join(' · ')}${s.flows.length ? ` · flows: ${s.flows.map(code).join(', ')}` : ' · no flow-… states'}`);
    if (s.flags.length) {
      const off = s.flags.filter((f) => f.effect === 'off'), gate = s.flags.filter((f) => f.gates);
      L(`- Route flags (${code(s.routePage)}): ${s.flags.map((f) => `${code(f.name)} ${f.effect === 'off' ? '**off**' : f.effect === 'on' ? 'on' : f.value ? `= ${code(flagValue(f.value))}` : '?'}`).join(' · ')}${gate.length ? `. ${gate.map((f) => code(f.name)).join(', ')} gates the route itself` : ''}${off.length ? `. What an **off** flag gates is not in KSA — do not design it.` : ''}`);
    }
    L();
  }
}

L('## Requirements');
L();
for (const r of reqs) {
  L(`### ${r.id} · ${clip(r.text, 110)}`);
  L();
  L(`> ${r.text}`);
  L('>');
  L(`> ${r.section} · ${r.kind} · ${statusWord[r.status]}`);
  L();
  for (const [i, p] of r.parts.entries()) {
    const m = p.match;
    if (r.parts.length > 1) { L(`**Ask ${i + 1} of ${r.parts.length} — ${clip(p.text, 120)}**`); L(); }
    L(`${icon[m.status]} ${statusWord[m.status]}${m.status === 'gap' ? '' : ` · confidence ${m.confidence}`} · ${m.host ? `on ${code(m.host)}${m.hints.length ? ` (the PRD says “${m.hints[0].said}”)` : m.inferred ? ' (inferred from the nearest pattern — confirm)' : ''}` : 'no screen named'}${m.parent ? ` · a new state of ${code(m.parent.name)}` : ''}`);
    L();
    const show = m.status === 'gap' ? [] : m.places;
    if (show.length) {
      for (const d of show) {
        const got = d.per.filter((x) => x.c >= 0.5).map((x) => (x.c >= 1 ? asWritten(x.w, p.text) : `~${asWritten(x.w, p.text)}`));
        const shown = uniq(got).filter((w) => !(w.startsWith('~') && got.includes(w.slice(1))));
        L(`1. ${code(d.name)} — ${d.kind} · ${confidenceOf(d.cov)}, ${Math.round(d.cov * 100)}%${shown.length ? ` (has ${shown.slice(0, 7).join(', ')})` : ''}`);
        if (d.what) L(`   shows: ${clip(d.what, 140)}`);
        if (d.how) L(`   how: ${clip(d.how, 140)}`);
        L(`   ${fileLinks(d.files)}`);
      }
      L();
    }
    const pats = m.status === 'gap' ? [m.pattern, ...m.elsewhere].filter((d, j, a) => d && d.cov >= PATTERN_MIN && a.findIndex((x) => x && x.name === d.name) === j).slice(0, 2) : m.elsewhere;
    if (pats.length) {
      L(`${m.status === 'gap' ? 'Nearest patterns to reuse' : 'Also elsewhere'}: ${pats.map((d) => `${code(d.name)} (${Math.round(d.cov * 100)}% — ${clip(d.what, 70)}; ${fileLinks(d.files)})`).join(' · ')}`);
      L();
    }
    if (m.status !== 'covered' && m.missing.length) { L(`Not in the design system: ${wordsList(m.missing, 6, p.text)}.`); L(); }
    if (m.comps.length) { L(`Components: ${m.comps.map((c) => `${code(c.title)} ${code(c.files.web)}${c.files.responsive ? ' (web + responsive)' : ' (web only)'}`).join(' · ')}`); L(); }
    const c = p.cover;
    L('Must cover:');
    L(`- Roles: ${c.roles.map((x) => `${ROLE_NAME[x.role]}${x.why === 'named' ? '' : ` (${x.why})`} ${x.have ? `✓ ${code(x.have.name)} (${fileNote(x.have.files)})` : `— ${x.note}`}`).join('; ')}`);
    L(`- Layouts: ${c.layouts.map((l) => `${l.layout} ${l.isNew ? (l.have ? `new — start from ${code(l.have)}` : 'new') : l.have ? `✓ ${code(l.have)}` : `— design${l.note ? ` (${l.note})` : ''}`}`).join('; ')}`);
    if (c.data.length) L(`- Data: ${c.data.map((x) => `${x.state} ${x.have.length ? `✓ ${x.have.map((h) => code(h.name)).join(', ')}` : `— design${x.pattern.length ? ` (compiled elsewhere: ${code(x.pattern[0])})` : ''}`}`).join('; ')}. A failed list query shows the same “No Record Found” empty state as an empty one.`);
    if (c.form.length) L(`- Form: ${c.form.map((x) => `${x.state} ${x.have.length ? `✓ ${x.have.map((h) => code(h.name)).join(', ')}` : `— design${x.pattern.length ? ` (compiled elsewhere: ${code(x.pattern[0])})` : ''}`}`).join('; ')}. A disabled control is dimmed to 0.54.`);
    if (c.flows.length) L(`- Flow: ${c.flows[0].have.length ? c.flows[0].have.map((f) => code(f.name)).join(', ') : `none compiled for this — ${c.flows[0].note}${c.flows[0].other.length ? ` (flows on this screen: ${c.flows[0].other.map(code).join(', ')})` : ''}`}`);
    if (c.conditions.length) L(`- Condition: ${c.conditions.join('; ')} — draw the account in that condition; the compiled pages are the fixture's`);
    L();
  }
  if (r.copy.length) {
    L('Product copy that fits — use these exact words; the Arabic ships with them:');
    L();
    L('| English | Arabic | Ships in |');
    L('|---|---|---|');
    for (const c of r.copy) L(`| ${c.en.replace(/\|/g, '/')}${c.onScreen ? ' *(on the matched state)*' : ''} | ${(c.ar || '—').replace(/\|/g, '/')} | ${c.areas.length ? c.areas.slice(0, 2).map((a) => code(`kb/product/copy/${a}.html`)).join(' ') + (c.areas.length > 2 ? ` +${c.areas.length - 2}` : '') : 'translation.json only — confirm it ships in KSA'} |`);
    L();
  }
  if (r.copyGap.length) { L(`**New copy needed:** no shipped string says what ${r.copyGap.map((t) => `“${clip(t, 90)}”`).join(' / ')} describes. Write it as new copy (EN + AR) for the product agent to confirm — never as if it shipped.`); L(); }
  if (r.flags.length) {
    L(`Flags this depends on: ${r.flags.slice(0, 6).map((f) => `${code(f.name)} = ${code(flagValue(f.value))} (${EFFECT_TEXT[f.effect]}; ${uniq(f.why)[0]})`).join(' · ')}${r.flags.length > 6 ? ` · +${r.flags.length - 6} more` : ''}`);
    L();
  }
}

if (context.scope.length || context.layouts.length || context.analytics.length || context.out.length || context.questions.length) {
  L('## From the rest of the PRD');
  L();
  for (const s of context.scope) L(`- Scope: ${s}`);
  if (context.layouts.length) L(`- Layouts asked for: ${context.layouts.map((t) => `“${clip(t, 80)}”`).join('; ')} — each ask above names its web 1440 and responsive 375 file.`);
  if (context.analytics.length) L(`- Analytics (for the page template's ga4 field): ${context.analytics.map((t) => clip(t, 70)).join('; ')}`);
  for (const t of context.out) L(`- Out of scope — do not design: ${t}`);
  for (const t of context.questions) L(`- Open question — ask before designing: ${t}`);
  L();
}
L('## Next');
L();
L('1. Open every ✓ file; click through each page — every trigger links to its state.');
L('2. For each screen in the checklist, fill in the page template header (kb/pages/_shell.html) and stop for approval.');
L('3. After producing, lint each artboard with its phone pair: `node scripts/design-lint.mjs <design.html> --pair <design-375.html>`.');
L();

const cover = (c) => c;
const json = {
  prd: { file: rel(FILE), title: prd.title, sections: prd.sections.filter((s) => s.title).map((s) => ({ title: s.path.join(' › '), kind: s.kind, items: s.items.length })), ...context },
  kb: { at: kb.at, counts: kb.counts },
  summary: { requirements: reqs.length, asks: allParts.length, exist: allParts.filter(({ p }) => p.match.status === 'covered').length, partly: partials.length, new: gaps.length },
  requirements: reqs.map((r) => ({
    id: r.id, section: r.section, feature: r.feature, kind: r.kind, text: r.text, status: r.status, roles: r.roles, condition: r.condition,
    asks: r.parts.map((p) => ({
      text: p.text, status: p.match.status, confidence: p.match.status === 'gap' ? null : p.match.confidence, screen: p.match.host, screenInferred: !!p.match.inferred, newStateOf: p.match.parent ? p.match.parent.name : null,
      namedScreen: p.match.hints.length ? { screen: p.match.hints[0].slug, said: p.match.hints[0].said } : null,
      matches: (p.match.status === 'gap' ? [] : p.match.places).map((d) => ({ name: d.name, kind: d.kind, screen: d.screen, coverage: +d.cov.toFixed(2), confidence: confidenceOf(d.cov), has: d.per.filter((x) => x.c >= 1).map((x) => asWritten(x.w, p.text)), hasBySynonym: d.per.filter((x) => x.c >= 0.5 && x.c < 1).map((x) => asWritten(x.w, p.text)), what: d.what, how: d.how, files: d.files, notes: d.kbPage })),
      patterns: [p.match.pattern, ...p.match.elsewhere].filter((d, j, a) => d && d.cov >= PATTERN_MIN && a.findIndex((x) => x && x.name === d.name) === j).map((d) => ({ name: d.name, coverage: +d.cov.toFixed(2), files: d.files })),
      components: p.match.comps.map((c) => ({ name: c.title, slug: c.name, files: c.files })),
      notFound: p.match.status === 'covered' ? [] : uniq(p.match.missing.map((w) => asWritten(w, p.text))),
      mustCover: cover(p.cover),
    })),
    copy: r.copy.map((c) => ({ en: c.en, ar: c.ar, key: c.key, areas: c.areas, onScreen: c.onScreen })),
    newCopyNeeded: r.copyGap,
    flags: r.flags.map((f) => ({ name: f.name, value: f.value, effect: f.effect, why: uniq(f.why) })),
  })),
  gaps: gaps.map(({ r, p }) => ({ requirement: r.id, ask: p.text, screen: p.match.host, notFound: uniq(p.match.missing.map((w) => asWritten(w, p.text))), pattern: p.match.pattern && p.match.pattern.cov >= PATTERN_MIN ? { name: p.match.pattern.name, coverage: +p.match.pattern.cov.toFixed(2), files: p.match.pattern.files } : null })),
  screens: touched,
  checklist: [...work.values()].map((w) => ({ screen: w.where, what: w.label, isNew: w.isNew, status: w.status, requirements: uniq(w.reqs), newStates: uniq(w.newStates || []), web: w.web, responsive: w.phone, roles: [...w.roles], dataToDesign: [...w.data], formToDesign: [...w.form], flowToDesign: w.flows, reuse: [...w.patterns] })),
};

const text = JSON_OUT ? JSON.stringify(json, null, 1) : md.join('\n');
if (OUT) { writeFileSync(OUT, text + '\n'); console.error(`wrote ${OUT} — ${json.summary.requirements} requirements, ${json.summary.asks} asks: ${json.summary.exist} exist, ${json.summary.partly} partly, ${json.summary.new} new`); }
else console.log(text);
