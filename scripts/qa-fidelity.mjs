#!/usr/bin/env node
/**
 * Every painted box on the page, against the product's.
 *
 * WHY THIS EXISTS — the two checks above it both stop short
 *
 * `qa-design.mjs` scores REGIONS, and a region is a hand-written entry naming
 * how to find one box on each side. There are 48 of them, and they cover the
 * shell, Listings, the settings form and the overlays. There is not one for a
 * donut, a timeline entry, a metric tab, a segmented control, a wizard section
 * or a chart — so Reports, Credits Usage, Ad License and LMS Leads are, below
 * the header, measured by nothing. A hand-maintained list does not fail when a
 * page is missing from it. It just says nothing, in a voice that sounds like
 * a pass.
 *
 * `qa-body.mjs` counts what a body is made of — cards, charts, empty states,
 * controls by role. That catches a missing card. It cannot catch a card that
 * is 40px too wide, and its headline number is a NODE RATIO, which is mostly a
 * statement about how generously antd wraps: Reports Summary reads 42% with
 * every card, chart and control present and correct.
 *
 * So this compares the boxes that PAINT. For each page it takes every node on
 * both sides that actually draws something — a background, a border, a glyph,
 * an image — matches them to each other by where they are and what kind of
 * thing they are, and reports every pair that disagrees and everything that
 * went unmatched. No list to maintain: a page cannot be missing from this,
 * because the pages are the input.
 *
 *   node scripts/qa-fidelity.mjs                  every page
 *   node scripts/qa-fidelity.mjs --page reports-summary
 *   node scripts/qa-fidelity.mjs --top 25         longer worklist
 *   node scripts/qa-fidelity.mjs --strict         exit non-zero below the gate
 *
 * Writes data/qa/fidelity.json — the ledger, one row per page.
 *
 * WHAT IT REPORTS, and why in this order: one wrong box moves every box inside
 * it, so a flat list of 300 differences is 300 symptoms of maybe four causes.
 * A difference is a ROOT when the nearest painted ancestor above it matched
 * cleanly. Roots are reported first, and fixing one usually clears a dozen.
 */
import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const LIVE = join(ROOT, 'data', 'live');
const OURS = join(ROOT, 'data', 'ours');
const arg = (n, d) => { const i = process.argv.indexOf(n); return i > -1 ? process.argv[i + 1] : d; };
const strict = process.argv.includes('--strict');
const TOP = Number(arg('--top', 8));

/* how close is close enough. 2px absorbs sub-pixel layout and the odd
   half-pixel border; anything past it is a real disagreement someone chose. */
const PX = 2;
/* the paint properties worth holding a matched pair to. Geometry is compared
   separately; these are the ones that change nothing about the box and
   everything about the design. */
const PAINT = ['backgroundColor', 'color', 'fontSize', 'fontWeight', 'lineHeight',
  'borderTopWidth', 'borderTopColor', 'borderTopLeftRadius', 'boxShadow', 'textAlign', 'display'];

const rgb = (v) => String(v).replace(/\s+/g, '').replace(/^rgba\((\d+),(\d+),(\d+),1\)$/, 'rgb($1,$2,$3)');
const px = (v) => { const m = /(-?[\d.]+)px/.exec(String(v)); return m ? +m[1] : null; };
const clear = (v) => v === 'rgba(0, 0, 0, 0)' || v === 'transparent';

/* antd's Card declares its radius as a clamp() and the browser reports the
   DECLARATION; a stylesheet that writes the resolved 8px is right. Same
   allowance derive-layout.mjs makes. */
const samePaint = (p, a, b) => {
  if (a === undefined || b === undefined) return a === b;
  const un = (v) => { const s = String(v); if (!s.startsWith('clamp(')) return v; const m = s.match(/([\d.]+)px/g); return m ? m[m.length - 1] : v; };
  a = un(a); b = un(b);
  const na = px(a), nb = px(b);
  if (na !== null && nb !== null) return Math.abs(na - nb) <= 1;
  return rgb(a) === rgb(b);
};

/* ── what counts as a painted box ────────────────────────────────────────
   A wrapper that draws nothing is not part of the design; it is how a library
   chose to nest things. Counting it is what makes a node ratio meaningless.
   A node paints when it has a ground, an edge, or is itself the content. */
const paints = (n) => {
  const s = n.style || {};
  if (!n.box || n.box.w < 4 || n.box.h < 4) return false;
  if (s.display === 'none' || s.opacity === '0') return false;
  if (['svg', 'img', 'use', 'input', 'textarea', 'select'].includes(n.tag)) return true;
  if (!clear(s.backgroundColor)) return true;
  if (['borderTopWidth', 'borderBottomWidth', 'borderInlineStartWidth', 'borderInlineEndWidth']
    .some((k) => (px(s[k]) || 0) > 0)) return true;
  if (s.boxShadow && s.boxShadow !== 'none') return true;
  /* a leaf is text or a glyph — the thing a reader actually sees */
  if (!(n.children || []).length) return true;
  return false;
};

/* Kind, so a button is never matched to a card just because they overlap.
   Deliberately coarse: the two sides are different markup for the same design,
   and anything finer starts rejecting true pairs. */
const kindOf = (n) => {
  const c = n.class || [];
  if (['svg', 'use', 'img'].includes(n.tag)) return 'glyph';
  if (['input', 'textarea', 'select'].includes(n.tag)) return 'field';
  if (n.tag === 'button' || n.tag === 'a' || c.some((x) => /^(ant-btn|pf-btn)$/.test(x))) return 'control';
  if ((n.children || []).length) return 'surface';
  return 'leaf';
};

const collect = (root, origin) => {
  const out = [];
  const walk = (n, parent) => {
    let self = null;
    if (paints(n)) {
      self = {
        tag: n.tag, kind: kindOf(n),
        cls: (n.class || []).filter((c) => !/^(css|ant-motion|styleProfolio)/.test(c)).slice(0, 3).join('.'),
        x: Math.round(n.box.x - origin.x), y: Math.round(n.box.y - origin.y),
        w: Math.round(n.box.w), h: Math.round(n.box.h),
        style: n.style || {}, parent, depth: parent ? parent.depth + 1 : 0,
      };
      out.push(self);
    }
    for (const k of n.children || []) walk(k, self || parent);
  };
  walk(root, null);

  /* ONE BOX PER RECTANGLE. antd stacks four divs on the same 533×240 — a
     styled-components wrapper, a layout div, another wrapper, then the card —
     and we draw one <section>. Left alone, the matcher pairs one of the four
     and reports the other three missing, and the score becomes a measure of
     how deeply the library nests rather than of how the page looks. A
     rectangle is a rectangle however many elements draw it: keep the one with
     the strongest paint (a ground or an edge beats a bare wrapper), and among
     equals the innermost, which is the one carrying the real class name. */
  const seen = new Map();
  const strength = (n) => {
    const st = n.style || {};
    let k = 0;
    if (!clear(st.backgroundColor)) k += 4;
    if ((px(st.borderTopWidth) || 0) > 0) k += 2;
    if (st.boxShadow && st.boxShadow !== 'none') k += 1;
    return k;
  };
  for (const n of out) {
    const key = `${n.x},${n.y},${n.w},${n.h}`;
    const had = seen.get(key);
    if (!had || strength(n) > strength(had) || (strength(n) === strength(had) && n.depth > had.depth)) seen.set(key, n);
  }
  const kept = new Set(seen.values());
  /* re-point parents at the survivor above them, so the root-cause test still
     walks a real chain */
  for (const n of kept) { let p = n.parent; while (p && !kept.has(p)) p = p.parent; n.parent = p || null; }
  return out.filter((n) => kept.has(n));
};

/* overlap as a fraction of the union — 1 is the same box, 0 is disjoint */
const iou = (a, b) => {
  const x = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x));
  const y = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
  const i = x * y;
  return i / (a.w * a.h + b.w * b.h - i);
};

const contentOf = (tree, re) => {
  const find = (n) => {
    if ((n.class || []).some((c) => re.test(c))) return n;
    for (const k of n.children || []) { const r = find(k); if (r) return r; }
    return null;
  };
  return find(tree);
};

const pages = readdirSync(LIVE)
  .filter((f) => /\.capture\.json$/.test(f) && !f.includes('--') && !f.endsWith('.real.capture.json'))
  .map((f) => f.replace(/\.capture\.json$/, ''))
  .filter((p) => existsSync(join(OURS, `${p}.capture.json`)))
  .filter((p) => !arg('--page') || p === arg('--page'))
  .sort();

if (!pages.length) { console.error('  no page with captures on both sides'); process.exit(2); }

const rows = [];
for (const page of pages) {
  const live = JSON.parse(readFileSync(join(LIVE, `${page}.capture.json`), 'utf8'));
  const ours = JSON.parse(readFileSync(join(OURS, `${page}.capture.json`), 'utf8'));
  const lc = contentOf(live.tree, /^ant-layout-content$/);
  const oc = contentOf(ours.tree, /^pf-content$/);
  if (!lc || !oc) { rows.push({ page, fault: 'no content region on one side' }); continue; }

  /* the content frame itself is not a box on the page — it is the page. Its
     height is how long the page is, which is reported on its own line rather
     than as a wrong box that also makes every box inside it a non-root. */
  const L = collect(lc, lc.box).filter((n) => !(n.x === 0 && n.y === 0 && n.w === Math.round(lc.box.w)));
  const O = collect(oc, oc.box).filter((n) => !(n.x === 0 && n.y === 0 && n.w === Math.round(oc.box.w)));

  /* Greedy best-first. Every candidate pair of the same kind whose boxes
     overlap at all, sorted by how well they overlap, and each node used once.
     Greedy rather than optimal on purpose: an optimal assignment over a few
     thousand boxes is slow and, where it differs, differs on pairs that are
     ambiguous anyway. */
  const cands = [];
  for (let i = 0; i < L.length; i++) {
    for (let j = 0; j < O.length; j++) {
      /* No kind test. It was here to stop a card pairing with a button, which
         an IoU floor of 0.5 already prevents — and what it actually did was
         refuse every pair where the two sides draw the same design with
         different elements. That is most of them: the prototype renders a
         <button role="tab"> where antd renders an <input>, and one <svg> where
         a chart library emits a tree. qa-body.mjs learned this and was taught
         the conventions; this reintroduced the mistake and reported our whole
         Reports page as boxes the product does not have. Geometry is the
         question being asked, so geometry is the only test. */
      const s = iou(L[i], O[j]);
      if (s >= 0.5) cands.push([s, i, j]);
    }
  }
  cands.sort((a, b) => b[0] - a[0]);
  const li = new Array(L.length).fill(-1), oj = new Array(O.length).fill(-1);
  for (const [, i, j] of cands) { if (li[i] < 0 && oj[j] < 0) { li[i] = j; oj[j] = i; } }

  const diffs = [];
  for (let i = 0; i < L.length; i++) {
    const a = L[i];
    if (li[i] < 0) { diffs.push({ kind: 'missing', node: a, why: 'the product draws it, we do not' }); continue; }
    const b = O[li[i]];
    const geo = [];
    for (const k of ['x', 'y', 'w', 'h']) if (Math.abs(a[k] - b[k]) > PX) geo.push(`${k} ${a[k]}→${b[k]}`);
    const paint = [];
    for (const p of PAINT) if (!samePaint(p, a.style[p], b.style[p])) paint.push(`${p} ${a.style[p]} → ${b.style[p]}`);
    if (geo.length || paint.length) diffs.push({ kind: geo.length ? 'moved' : 'painted', node: a, mate: b, geo, paint });
    a.matched = b; b.matched = a;
  }
  for (let j = 0; j < O.length; j++) if (oj[j] < 0) diffs.push({ kind: 'extra', node: O[j], why: 'we draw it, the product does not' });

  /* A difference is a ROOT when the nearest painted ancestor above it matched
     and agreed. One wrong container moves everything in it, so without this a
     page reports three hundred symptoms of four causes. */
  const cleanUp = (n) => {
    for (let p = n.parent; p; p = p.parent) {
      if (!p.matched) return false;
      return !diffs.some((d) => d.node === p);
    }
    return true;                                    /* nothing above it: a root by default */
  };
  for (const d of diffs) d.root = d.kind === 'extra' ? true : cleanUp(d.node);

  /* TWO numbers, because they are two different problems and one blended
     score hides both. COVERAGE is how much of the product's page we draw at
     all — a body that is missing a card fails here, and qa-body already says
     so. FIDELITY is, of the boxes we DO draw, how many are in the right place
     with the right paint. Fidelity is what nothing measured before this, and
     a page can sit at 100% of it while covering half the screen. */
  const missing = diffs.filter((d) => d.kind === 'missing').length;
  const moved = diffs.filter((d) => d.kind === 'moved').length;
  const painted = diffs.filter((d) => d.kind === 'painted').length;
  const matched = L.length - missing;
  const clean = matched - moved - painted;
  const coverage = L.length ? (matched / L.length) * 100 : 0;
  const fidelity = matched ? (clean / matched) * 100 : 0;
  rows.push({
    page,
    live: L.length, ours: O.length, matched, clean, missing, moved, painted,
    extra: diffs.filter((d) => d.kind === 'extra').length,
    pageHeight: [Math.round(lc.box.h), Math.round(oc.box.h)],
    coverage: +coverage.toFixed(1), fidelity: +fidelity.toFixed(1),
    score: +fidelity.toFixed(1),
    /* biggest boxes first among the roots — the largest wrong thing is both
       the most visible and the most likely to be holding others wrong */
    worklist: diffs.filter((d) => d.root)
      .sort((a, b) => (b.node.w * b.node.h) - (a.node.w * a.node.h))
      .slice(0, 40)
      .map((d) => ({
        kind: d.kind,
        at: `${d.node.tag}${d.node.cls ? '.' + d.node.cls : ''}`,
        box: `${d.node.w}×${d.node.h} @${d.node.x},${d.node.y}`,
        detail: d.geo?.length ? d.geo.join(' · ') : d.paint?.length ? d.paint.join(' · ') : d.why,
      })),
  });
}

/* ── the ledger ─────────────────────────────────────────────────────────── */
console.log('\n  page                          product  drawn  cover   moved  paint  clean  FIDELITY   height');
for (const r of rows) {
  if (r.fault) { console.log(`  ${r.page.padEnd(29)} ${r.fault}`); continue; }
  const h = r.pageHeight[0] === r.pageHeight[1] ? `${r.pageHeight[0]}` : `${r.pageHeight[0]}→${r.pageHeight[1]}`;
  console.log(`  ${r.page.padEnd(29)} ${String(r.live).padStart(7)} ${String(r.matched).padStart(6)} `
    + `${(r.coverage.toFixed(0) + '%').padStart(6)} ${String(r.moved).padStart(7)} ${String(r.painted).padStart(6)} `
    + `${String(r.clean).padStart(6)} ${(r.fidelity.toFixed(1) + '%').padStart(9)}   ${h}`);
}

const ranked = rows.filter((r) => !r.fault).sort((a, b) => a.score - b.score);
for (const r of ranked.slice(0, Number(arg('--pages', 3)))) {
  if (!r.worklist.length) continue;
  console.log(`\n  ── ${r.page} · ${r.score}% · the ${Math.min(TOP, r.worklist.length)} biggest root cause(s)`);
  for (const w of r.worklist.slice(0, TOP)) {
    console.log(`     ${w.kind.padEnd(8)} ${w.at.padEnd(34)} ${w.box.padEnd(18)} ${w.detail}`);
  }
}

const ok = rows.filter((r) => !r.fault);
const cov = ok.reduce((n, r) => n + r.matched, 0) / Math.max(1, ok.reduce((n, r) => n + r.live, 0)) * 100;
const fid = ok.reduce((n, r) => n + r.clean, 0) / Math.max(1, ok.reduce((n, r) => n + r.matched, 0)) * 100;
console.log(`\n  coverage ${cov.toFixed(1)}%  — of the boxes the product paints, how many we paint at all`);
console.log(`  fidelity ${fid.toFixed(1)}%  — of those, how many sit within ${PX}px and in the same paint\n`);
const overall = fid;

mkdirSync(join(ROOT, 'data', 'qa'), { recursive: true });
writeFileSync(join(ROOT, 'data', 'qa', 'fidelity.json'),
  JSON.stringify({ at: new Date().toISOString(), tolerancePx: PX, coverage: +cov.toFixed(1), fidelity: +fid.toFixed(1), rows }, null, 2));

if (strict && rows.some((r) => r.fault || r.score < 95)) process.exit(1);
