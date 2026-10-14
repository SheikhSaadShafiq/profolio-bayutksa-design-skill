/**
 * The research behind a design, checked: designs/<feature>/research/research.json against
 * research/README.md (the competitive UX flow method, scaled by the size of the change).
 *
 *   import { checkResearch, DEPTH } from './research.mjs'
 *   const { errors, warnings, freshById, ids } = checkResearch(R, { now })
 *
 * qa/prototype.mjs runs it with the directions; qa/board.mjs runs it while the research is
 * still going, so it can be fixed before any screen is drawn.
 *
 * Depth (research.json "depth"), from the size of the change (INTAKE.md § 4):
 *   light: a new section, or a change to a page: 3–4 competitors, 3–6 gaps
 *   full:  a new page, or a redesign: 5–6 competitors, 6–10 gaps, one flow board each
 *   (a small fix has no research)
 */
export const DEPTH = {
  light: { gaps: [3, 6], traits: [3, 5], candidates: 6, shortlist: [3, 4], alternates: 1, flows: 3, perCompetitor: false, capabilities: 3, findings: [4, 8], rules: 0, wide: 6, refs: 4, apps: 2 },
  full: { gaps: [6, 10], traits: [4, 5], candidates: 10, shortlist: [5, 6], alternates: 2, flows: 0, perCompetitor: true, capabilities: 5, findings: [8, 12], rules: 1, wide: 8, refs: 6, apps: 3 },
};
export const GROUPS = { ksa: 'KSA portals\' agent tools', regional: 'regional and global agent tools', saas: 'best-in-class SaaS for the pattern', bayut: 'Bayut\'s and dubizzle\'s own markets' };
export const SIZES = ['layout', 'hero', 'language', 'detail'];   // how much a finding changes the design
const SEEN = ['site', 'app-store', 'mobbin', 'help-centre', 'press', 'search-summary'];
const FIT = ['yes', 'partly', 'no'];
const HAVE = ['yes', 'partly', 'no', 'not-checked'];
const words = (t) => String(t || '').trim().split(/\s+/).filter(Boolean).length;
const fitScore = (c) => Object.values(c.fit || {}).reduce((s, v) => s + (v === 'yes' ? 1 : v === 'partly' ? 0.5 : 0), 0);

export function checkResearch(R, { now = Date.now() } = {}) {
  const errors = [], warnings = [];
  const need = (cond, msg) => { if (!cond) errors.push(msg); };
  const warn = (msg) => warnings.push(msg);
  const ids = new Set(), freshById = new Map();
  const D = DEPTH[R.depth];
  need(D, `depth is "light" (a new section, or a change to a page) or "full" (a new page, or a redesign) — got ${JSON.stringify(R.depth)}`);
  const L = D || DEPTH.full;
  const inRange = (n, [lo, hi]) => n >= lo && n <= hi;

  /* 1 · the frame: gaps, the experience's traits, the goal findings are ranked by */
  const gaps = R.gaps || [], gapIds = new Set(gaps.map((g) => g.id));
  need(inRange(gaps.length, L.gaps), `${L.gaps[0]}–${L.gaps[1]} gaps for a ${R.depth || 'full'} study, each a flow or state a competitor could show (G1, G2 …) — ${gaps.length} given`);
  for (const g of gaps) need(/^G\d+$/.test(g.id || '') && g.title, `gap ${JSON.stringify(g)}: needs an id (G1) and a one-line title`);
  const traits = R.traits || [], traitIds = traits.map((t) => t.id);
  need(inRange(traits.length, L.traits), `${L.traits[0]}–${L.traits[1]} traits that define the experience (the fit test, T1 …) — ${traits.length} given`);
  for (const t of traits) need(/^T\d+$/.test(t.id || '') && t.title, `trait ${JSON.stringify(t)}: needs an id (T1) and what it is`);
  need(typeof R.goal === 'string' && R.goal.trim(), 'goal: what the findings are ranked by ("unlocks per agency per week")');

  /* 2 · competitors: a long list from the four groups, scored for fit, shortlisted, approved */
  const comps = R.competitors || [], real = comps.filter((c) => !c.none);
  for (const c of comps) {
    if (c.none) { need(GROUPS[c.group], `competitor entry ${JSON.stringify(c)}: group is one of ${Object.keys(GROUPS).join(', ')}`); warn(`group "${c.group}": searched, nothing does this job (${c.none}) — say so in the plan`); continue; }
    need(c.id && c.name && GROUPS[c.group] && c.why && /^https?:/.test(c.url || ''), `competitor ${JSON.stringify(c.name || c)}: needs id, name, group (${Object.keys(GROUPS).join(', ')}), why it fits, and its url`);
    need(!c.seen || SEEN.includes(c.seen), `competitor ${c.name}: seen is one of ${SEEN.join(', ')}`);
    need(traitIds.every((t) => FIT.includes((c.fit || {})[t])), `competitor ${c.name}: fit scores every trait (${traitIds.join(', ')}) as yes, partly or no`);
    need(['strong', 'partial', 'none'].includes(c.mobbin), `competitor ${c.name}: mobbin coverage is strong, partial or none (one quick search_flows naming it)`);
    need(['shortlist', 'alternate', 'dropped'].includes(c.status), `competitor ${c.name}: status is shortlist, alternate or dropped`);
    if (c.id) ids.add(c.id);
  }
  need(real.length >= L.candidates, `a long list of at least ${L.candidates} candidates, scored for fit — ${real.length} given`);
  for (const [g, label] of Object.entries(GROUPS)) need(comps.some((c) => c.group === g), `no candidate from ${label} (group "${g}") — or, searched and none does this job: { "group": "${g}", "none": "what you searched" }`);
  const short = real.filter((c) => c.status === 'shortlist');
  need(inRange(short.length, L.shortlist), `${L.shortlist[0]}–${L.shortlist[1]} competitors shortlisted for a ${R.depth || 'full'} study — ${short.length} given`);
  need(real.filter((c) => c.status === 'alternate').length >= L.alternates, `at least ${L.alternates} alternate${L.alternates > 1 ? 's' : ''}, in case the PM swaps one`);
  const weakest = Math.min(...short.map(fitScore));
  for (const c of real.filter((x) => x.status === 'dropped' && fitScore(x) > weakest)) warn(`${c.name} fits better (${fitScore(c)} of ${traits.length}) than a shortlisted competitor (${weakest}): pick by experience, not by market`);
  need(R.approved && /^\d{4}-\d{2}-\d{2}/.test(R.approved.date || '') && R.approved.by, 'approved: the PM approved the shortlist in the intake reply — { "date": "YYYY-MM-DD", "by": "…", "note": "swaps, if any" }');

  /* 3 · Mobbin: wide (short nouns), then deep (each app by name, one journey per gap) */
  const refs = R.mobbin || [], web = R.web || [];
  if (!R.mobbin_unavailable) {
    const Q = R.queries || [], wide = Q.filter((q) => q.pass === 'wide');
    need(wide.length >= L.wide, `at least ${L.wide} wide Mobbin queries, 1–3 words each ("lead marketplace", "credit wallet") — ${wide.length} in research.json queries`);
    const apps = real.map((c) => c.name.toLowerCase().split(/[\s(]/)[0]).filter((a) => a.length > 2);
    for (const q of Q) {
      need(q.q && ['wide', 'deep'].includes(q.pass), `query ${JSON.stringify(q)}: needs q and pass ("wide" or "deep")`);
      const n = words(q.q);
      if (q.pass === 'wide' && n > 3) errors.push(`wide query “${q.q}” is ${n} words: 1–3, naming the thing ("lead marketplace"), not describing a layout`);
      if (q.pass === 'wide' && q.mode === 'standard') warn(`wide query “${q.q}” ran in standard mode: deep mode ranks short queries far better`);
      if (q.pass === 'deep' && !(q.app || apps.some((a) => String(q.q).toLowerCase().includes(a)))) errors.push(`deep query “${q.q}” names no app: start it with one ("Zillow landlord reviews a renter lead") — the app's name keeps a longer query on target`);
      if (q.pass === 'deep' && n > 14) warn(`deep query “${q.q}” is ${n} words: one journey, plainly`);
    }
  }
  for (const r of [...refs, ...web]) { need(r.id && r.app && /^https?:/.test(r.url || '') && r.borrow, `reference ${JSON.stringify(r.id || r.app || r)}: needs id, app, url, and what to borrow`); if (r.id) ids.add(r.id); }
  if (R.mobbin_unavailable) {
    warn(`Mobbin was not available: ${R.mobbin_unavailable} — the references come from the web; say so to the user`);
    need(web.length >= L.refs, `Mobbin was not available, so at least ${L.refs} web references are needed — ${web.length} given`);
  } else {
    need(refs.length >= L.refs, `at least ${L.refs} Mobbin references from the wide pass — ${refs.length} given`);
    need(new Set(refs.map((r) => r.app)).size >= L.apps, `the Mobbin references come from at least ${L.apps} different products`);
    for (const r of refs) need(/mobbin\.com/.test(r.url || ''), `Mobbin reference ${r.id}: cite its mobbin_url`);
  }

  /* 4 · rules, read on the company's own help pages, dated */
  const rules = R.rules || [], ruleIds = new Set(rules.map((r) => r.id));
  for (const r of rules) {
    need(/^R\d+$/.test(r.id || '') && ids.has(r.competitor) && r.rule && r.title && /^https?:/.test(r.url || '') && /^\d{4}-\d{2}-\d{2}$/.test(r.read || ''), `rule ${JSON.stringify(r.id || r.rule || r)}: needs id (R1), competitor, the rule in a sentence, the help page's title and url, and the date read (YYYY-MM-DD)`);
    if (r.id) ids.add(r.id);
  }
  need(rules.length >= L.rules, `at least ${L.rules} rule read on a competitor's own help page (expiry, limits, who sees what) — ${rules.length} given`);

  /* 5 · flows, one board each: steps, the rule, what they do well, what to adopt */
  const flows = R.flows || [];
  for (const f of flows) {
    const where = `flow ${f.id || f.title || '?'}`;
    need(/^F\d+$/.test(f.id || '') && f.title && short.some((c) => c.id === f.competitor), `${where}: needs id (F1), a plain title, and a shortlisted competitor`);
    need((f.gaps || []).length && f.gaps.every((g) => gapIds.has(g)), `${where}: tag the gaps it answers (${[...gapIds].join(', ')})`);
    need(/^https?:/.test(f.url || ''), `${where}: its Mobbin flow url (or the page it was seen on)`);
    const steps = f.steps || [];
    need(steps.length >= 2 && steps.length <= 5 && steps.every((s) => Number.isInteger(s.pos) && s.caption), `${where}: 2–5 steps, each with its position in the flow (pos) and a caption of what the user sees and does`);
    for (const s of steps) if (words(s.caption) > 30) warn(`${where} step ${s.pos}: a caption of ${words(s.caption)} words — keep it under 30`);
    need('rule' in f && (f.rule === null || ruleIds.has(f.rule)), `${where}: "rule" is a rule id (R1) when a rule governs it, else null`);
    need(f.well && f.adopt, `${where}: what they do well, and what to adopt — a change to a named screen ("Add Decline to the offer card")`);
    if (f.id) ids.add(f.id);
  }
  if (L.perCompetitor) for (const c of short) need(flows.some((f) => f.competitor === c.id), `${c.name} is shortlisted and has no flow documented`);
  need(flows.length >= Math.max(L.flows, 1), `at least ${Math.max(L.flows, L.perCompetitor ? short.length : 0, 1)} flows documented — ${flows.length} given`);

  /* 6 · the capability matrix: us and every shortlisted competitor, "not-checked" where unseen */
  const caps = R.capabilities || [];
  need(caps.length >= L.capabilities, `at least ${L.capabilities} capabilities compared — ${caps.length} given`);
  for (const k of caps) {
    need(/^K\d+$/.test(k.id || '') && k.title && (k.gaps || []).every((g) => gapIds.has(g)), `capability ${JSON.stringify(k.id || k.title || k)}: needs id (K1), what it is, and its gaps`);
    for (const who of ['us', ...short.map((c) => c.id)]) need(HAVE.includes((k.values || {})[who]), `capability ${k.id}: “${who}” is yes, partly, no or not-checked ("not-checked" when you didn't see it either way)`);
    if (k.id) ids.add(k.id);
  }

  /* 7 · trends: UX and visual, recent */
  const trends = R.trends || [];
  const ageOf = (t) => { const ym = /^\d{4}-\d{2}/.test(t.date || '') ? t.date.slice(0, 7) : /^\d{4}/.test(t.date || '') ? t.date.slice(0, 4) + '-12' : null; return ym ? (now - Date.parse(ym + '-01')) / 864e5 : Infinity; };
  need(trends.some((t) => t.kind === 'visual'), 'at least 1 visual trend (kind "visual"): what the best products look like now — beside the UX ones (kind "ux")');
  need(trends.filter((t) => ageOf(t) <= 548).length >= 2, `at least 2 trends from the last 18 months — ${trends.filter((t) => ageOf(t) <= 548).length} given`);
  for (const t of trends) {
    need(t.title && /^https?:/.test(t.url || '') && t.takeaway && /^\d{4}(-\d{2})?/.test(t.date || '') && ['ux', 'visual'].includes(t.kind), `trend ${JSON.stringify(t.title || t)}: needs title, url, date (YYYY-MM, or YYYY), kind ("ux" or "visual") and its takeaway`);
    if (ageOf(t) > 548 && ageOf(t) !== Infinity) warn(`trend “${t.title}” is from ${t.date}: older than 18 months`);
    if (t.id) ids.add(t.id);
  }

  /* 8 · the findings, ranked: what the directions draw */
  const fresh = R.fresh || [];
  need(inRange(fresh.length, L.findings), `${L.findings[0]}–${L.findings[1]} findings, merged and ranked — ${fresh.length} given`);
  need(fresh.filter((f) => SIZES.includes(f.size) && f.size !== 'detail').length >= 2, 'at least 2 findings change the layout, the hero or the visual language (size "layout", "hero" or "language"), not a detail');
  let seenMedium = false;
  for (const f of fresh) {
    const where = `finding ${f.id || f.title || '?'}`;
    need(f.id && f.title && f.what && SIZES.includes(f.size), `${where}: needs id, title, size (${SIZES.join(', ')}) and what it changes`);
    need(['high', 'medium'].includes(f.impact) && ['S', 'M', 'L'].includes(f.effort), `${where}: impact (high: removes a drop-off or dead end in the main path; medium: clearer or faster) and effort (S: copy or a state; M: a new screen or step; L: a new surface)`);
    need((f.gaps || []).length && f.gaps.every((g) => gapIds.has(g)), `${where}: the gaps it fixes`);
    need((f.seen_at || []).length && typeof f.lands === 'string' && f.lands.trim(), `${where}: seen_at (where it was seen) and lands (the screen it changes in the product)`);
    for (const r of [...(f.refs || []), ...(f.seen_at || [])]) need(ids.has(r), `${where}: “${r}” is no competitor, reference, flow, rule, capability or trend id`);
    if (f.impact === 'medium') seenMedium = true;
    else if (f.impact === 'high' && seenMedium) errors.push(`${where}: a high-impact finding below a medium one — rank them, high first`);
    if (f.id) freshById.set(f.id, f);
  }

  /* 9 · every gap answered, or said to have no evidence */
  for (const g of gaps) if (!g.evidence && !flows.some((f) => (f.gaps || []).includes(g.id)) && !fresh.some((f) => (f.gaps || []).includes(g.id))) errors.push(`gap ${g.id} (${g.title}): no flow or finding answers it — document one, or say "evidence": "none found: what was searched"`);

  /* 10 · the decisions log */
  need((R.decisions || []).length && R.decisions.every((d) => /^\d{4}-\d{2}-\d{2}/.test(d.date || '') && d.what), 'decisions: the log — the shortlist and any swaps, rules verified, what was not checked — each { "date", "what", "why" }');

  return { errors, warnings, freshById, ids, short };
}
