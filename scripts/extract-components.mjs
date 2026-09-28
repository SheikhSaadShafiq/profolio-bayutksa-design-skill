#!/usr/bin/env node
/**
 * Cut each component out of the one stylesheet, into a file you can lift.
 *
 * WHY THIS EXISTS
 * The deliverable is one self-contained HTML file, and the way it gets used is
 * that somebody carves components out of it. Until now that meant: find a class
 * in an 852KB page, find its rules somewhere in a 180KB stylesheet, then chase
 * every `var(--x)` back through a 770-line :root by hand. 119 pf-* classes and
 * 179 component docs, and nothing mapping one to the other.
 *
 * So this does the carving. For every section of deliverables/components.html —
 * which is the only authority on which classes belong to which component, and
 * which check.mjs already holds the pages to — it writes a standalone page
 * carrying THAT COMPONENT AND NOTHING ELSE:
 *
 *   · every rule in profolio.css whose selector names one of its classes,
 *     in source order, comments intact
 *   · every custom property those rules reach, TRANSITIVELY (a token whose
 *     value is another token pulls that one in too), resolved against :root
 *   · the eleven classless base rules — the reset, and the element defaults
 *     the specimens actually sit on
 *   · the @keyframes it animates with, if any
 *   · the sprite symbols its specimens <use>, and no others
 *   · its own specimens, one per documented state, with their labels
 *   · the source citation and open questions the catalogue records for it
 *
 * The page chrome is in its own <style data-chrome> block and its own x-*
 * classes, both marked, so deleting them leaves exactly the component.
 *
 *   node scripts/extract-components.mjs
 *
 * Reads   deliverables/components.html, profolio.css, sprite.svg
 *         deliverables/*.html                (to count where each is used)
 * Writes  deliverables/components/<id>.html  one per catalogued component
 *         deliverables/components/index.html
 *         data/components.json               the same, for tooling
 *
 * WHAT IT DOES NOT DO: decide anything. It reports the classes the catalogue
 * demonstrates and the rules the stylesheet holds for them. If a component's
 * file comes out missing a rule, the fix is in the catalogue or the stylesheet,
 * not here — and scripts/qa-components.mjs is what proves it came out whole,
 * by rendering both and comparing every box.
 */

import { readFileSync, writeFileSync, readdirSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const D = join(ROOT, 'deliverables');
const OUT = join(D, 'components');

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const text = (html) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

/* ── 1 · the stylesheet, as rules ────────────────────────────────────────
   A brace walk, not a parser. Comments are blanked for the SCAN so a brace
   inside one cannot shift the depth, but every slice is taken from the
   original text, so the rules keep their comments — which is most of what
   makes this stylesheet worth reading. */
const css = readFileSync(join(D, 'profolio.css'), 'utf8');
const scan = css.replace(/\/\*[\s\S]*?\*\//g, (m) => ' '.repeat(m.length));

function rulesIn(from, to, offset = 0) {
  const out = [];
  let depth = 0, selStart = from;
  for (let i = from; i < to; i++) {
    const ch = scan[i + offset];
    if (ch === '{') { if (depth === 0) { const raw = scan.slice(selStart, i + offset); out.push({ sel: raw.trim(), open: i + offset, from: selStart + raw.length - raw.trimStart().length }); } depth++; }
    else if (ch === '}') { depth--; if (depth === 0) { out[out.length - 1].close = i + offset; selStart = i + offset + 1; } }
  }
  return out.filter((r) => r.close !== undefined);
}

const top = [];
{
  let depth = 0, selStart = 0;
  for (let i = 0; i < scan.length; i++) {
    const ch = scan[i];
    if (ch === '{') { if (depth === 0) { const raw = scan.slice(selStart, i); top.push({ sel: raw.trim(), open: i, from: selStart + raw.length - raw.trimStart().length }); } depth++; }
    else if (ch === '}') { depth--; if (depth === 0) { top[top.length - 1].close = i; selStart = i + 1; } }
  }
}
/* the slice that reproduces a rule verbatim, comments and all — back up over
   any comment that sits immediately above the selector, because that comment is
   the provenance note and belongs with the rule it explains */
const slice = (r) => {
  /* r.from, not r.open - r.sel.length: the selector was TRIMMED, so deriving
     its start from its length lands past the start by however much whitespace
     sat between it and the brace. The tag variants are written in a column —
     `.pf-tag[data-tone="basic"]    {` — and each lost exactly as many leading
     characters as it had trailing spaces, so `.pf-tag[data-tone="hot"]` shipped
     as `g[data-tone="hot"]` and silently matched nothing. Record where the
     selector begins when you find it. */
  let start = r.from;
  /* Walk back over whitespace and take the one comment directly above, which is
     the provenance note for this rule. This was a regex — /\/\*[\s\S]*?\*\/\s*$/
     over the whole prefix — and its lazy middle backtracked across every
     comment in the file until one of them could reach the end, so a single
     "rule" arrived carrying tens of kilobytes of unrelated stylesheet. One
     component came out 2.8MB. A scan cannot run away; a backtracking match can. */
  let i = start;
  while (i > 0 && /\s/.test(css[i - 1])) i--;
  if (css.slice(i - 2, i) === '*/') {
    const at = css.lastIndexOf('/*', i - 2);
    if (at >= 0) start = at;
  }
  return css.slice(start, r.close + 1).replace(/^\s+/, '');
};

const rootRule = top.find((r) => r.sel === ':root');
const baseRules = top.filter((r) => r.sel !== ':root' && !r.sel.startsWith('@') && !/\./.test(r.sel));
const classRules = top.filter((r) => /\./.test(r.sel) && !r.sel.startsWith('@'));
const atRules = top.filter((r) => r.sel.startsWith('@'));

/* ── 2 · the tokens, and what each one reaches ──────────────────────────── */
const TOKENS = new Map();      /* --name -> its declaration, with the comment that justifies it */
{
  const body = css.slice(rootRule.open + 1, rootRule.close);
  /* PER DECLARATION, not per line. The spacing scale puts eight tokens on one
     line — `--sp-0:0px;  --sp-2:2px;  --sp-4:4px;  --sp-8:8px; …` — and a
     line-wise parse kept only the first of each. Every token after it was
     missing from the closure, so `width:var(--sp-20)` resolved to nothing,
     and an icon that should be 20px rendered at an SVG's default 300×150.
     A stylesheet is declarations; only its comments are lines. */
  for (const line of body.split('\n')) {
    const decls = [...line.matchAll(/(--[\w-]+)\s*:\s*([^;]*);/g)];
    if (!decls.length) continue;
    const trailing = decls.length === 1 ? (line.match(/;\s*(\/\*.*?\*\/)\s*$/) || [, ''])[1] : '';
    for (const d of decls) TOKENS.set(d[1], `  ${d[1]}:${d[2].trim()};${trailing ? '  ' + trailing : ''}`);
  }
}
const tokensUsedIn = (s) => [...new Set([...s.matchAll(/var\((--[\w-]+)/g)].map((m) => m[1]))];
function tokenClosure(seed) {
  const want = new Set();
  const queue = [...seed];
  while (queue.length) {
    const t = queue.shift();
    if (want.has(t) || !TOKENS.has(t)) continue;
    want.add(t);
    for (const next of tokensUsedIn(TOKENS.get(t))) queue.push(next);
  }
  /* emit in :root's own order — a token list sorted alphabetically loses the
     grouping the stylesheet spent comments establishing */
  return [...TOKENS.keys()].filter((t) => want.has(t));
}

/* ── 3 · the catalogue, as components ───────────────────────────────────── */
/* A <div> holding a specimen holds more <div>s, so "up to the next </div>" is
   not where it ends. The first cut of this used a lazy regex and paid for it
   twice over: fifteen sections came out with no specimen at all, and the ones
   that did match ran past their own section — .pf-filter swallowed the page and
   arrived carrying 1.6MB of stylesheet. Count the tags. */
function divs(html, cls, withTag) {
  const out = [];
  /* the class may not be the whole attribute — `class="cat-item cat-fill"` is
     ten of the thirty-nine sections, and demanding the closing quote dropped
     every one of them */
  const open = new RegExp(`<div class="[^"]*\\b${cls}\\b[^"]*"`, 'g');
  let m;
  while ((m = open.exec(html))) {
    let i = html.indexOf('>', m.index + m[0].length - 1) + 1;
    let depth = 1;
    const start = i;
    /* the WHOLE opening tag, not the class attribute the regex stopped at —
       `<div class="cat-item" data-wide="true">` carries the width modifier
       after the quote that ended the match, and rebuilding the tag from m[0]
       threw it away, so every full-width specimen came out shrink-to-fit */
    const openTag = html.slice(m.index, i);
    const tag = /<(\/?)div\b/g;
    tag.lastIndex = i;
    let t;
    while (depth > 0 && (t = tag.exec(html))) { depth += t[1] ? -1 : 1; i = t.index + t[0].length; }
    out.push(withTag ? openTag + html.slice(start, html.lastIndexOf('<', i)) : html.slice(start, html.lastIndexOf('<', i)));
    open.lastIndex = i;
  }
  return out;
}

const cat = readFileSync(join(D, 'components.html'), 'utf8');
/* Split on where each section STARTS, not on the first </section>: several
   specimens are themselves a <section class="pf-card">, and a lazy match ended
   on the inner one — ten components came out with no states and so were never
   written at all. */
const marks = [...cat.matchAll(/<section class="cat-sec" id="(c-[\w-]+)">/g)];
const sections = marks
  .map((m, k) => [m[1], cat.slice(m.index + m[0].length, k + 1 < marks.length ? marks[k + 1].index : cat.length)])
  .map(([id, body]) => {
    const head = (body.match(/<header>([\s\S]*?)<\/header>/) || [, ''])[1];
    const name = text((head.match(/<h2>([\s\S]*?)<\/h2>/) || [, id])[1]);
    const codes = [...head.matchAll(/<code>([^<]*)<\/code>/g)].map((m) => m[1].trim());
    const primary = codes[0] || '';
    const src = text((head.match(/<span class="src">([\s\S]*?)<\/span>/) || [, ''])[1]);
    /* Four sections carry a bare cat-stage with no cat-item around it — one
       unlabelled specimen, usually a whole table or layout. Falling through to
       the stages directly is the difference between 35 components and 39. */
    const items = divs(body, 'cat-item', true);
    /* keep the bare stage's OWN opening tag — rewrapping it as a plain
       <div class="cat-stage"> threw away its data-stack, and the header, whose
       only specimen is a bare stretched stage, came out shrink-to-fit */
    const specimens = (items.length ? items : divs(body, 'cat-stage', true).map((st) => `<div class="cat-item" data-wide="true">${st}</div>`))
      .map((item) => {
      const stage = divs(item, 'cat-stage')[0] || '';
      return {
        label: text((item.match(/<span class="cat-label">([\s\S]*?)<\/span>/) || [, ''])[1]),
        markup: stage.trim(),
        ground: (item.match(/<div class="[^"]*\bcat-stage\b[^"]*"[^>]*data-ground="([^"]*)"/) || [, ''])[1],
        stack: /<div class="[^"]*\bcat-stage\b[^"]*"[^>]*data-stack="true"/.test(item),
        /* the item's own width, which decides the stage's — a fixed 520 for
           cat-fill, the whole column for data-wide, shrink-to-fit otherwise */
        fill: /^<div class="[^"]*\bcat-fill\b/.test(item),
        wide: /^<div[^>]*data-wide="true"/.test(item) || !/^<div class="[^"]*\bcat-item\b/.test(item),
      };
    }).filter((s) => s.markup);
    const notes = [...body.matchAll(/<div class="cat-note"(?: data-kind="([^"]*)")?>([\s\S]*?)<\/div>/g)]
      .map((m) => ({ kind: m[1] || 'note', text: text(m[2]) }));
    /* Two sections are documentation, not demonstration: they carry a spec
       table and no stage. `layout primitives` still names its classes in the
       header, so it has something to cut; `prototype layer` names data
       attributes and has no CSS at all, and is skipped below rather than
       written as an empty file. */
    const declared = codes.filter((c) => /^\.[\w-]/.test(c)).flatMap((c) => c.split(/\s+/))
      .filter((c) => c.startsWith('.')).map((c) => c.slice(1));
    return { id, name, primary, src, specimens, notes, declared };
  });

/* the classes a component OWNS are the ones its own specimens wear — the
   catalogue's chrome is not part of any component */
const classesOf = (sec) => {
  const fromSpecimens = [...new Set(sec.specimens.flatMap((s) =>
    [...s.markup.matchAll(/class="([^"]+)"/g)].flatMap((m) => m[1].split(/\s+/))))]
    .filter((c) => c && !/^cat-/.test(c));
  return fromSpecimens.length ? fromSpecimens : sec.declared;
};

const selClasses = (sel) => new Set([...sel.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)].map((m) => m[1]));

/* ── 3b · the tier, from YOUR OWN taxonomy ───────────────────────────────
   canvas/ holds three files — Atoms, Molecules, Organisms — and their section
   headings are the design system's own classification. They name no classes,
   so the join has to be written down; each entry below cites the canvas
   section it comes from, and anything with no section is marked derived.

   Where a component is COARSER than its canvas section — ours bundles more
   than the section describes — that is recorded rather than smoothed over. It
   is the honest reading of a catalogue that grew page by page: `filter` owns
   the text input, the select and the label that the canvas lists as three
   separate atoms, and `tabs` owns the card the tab strip sits in.  */
const CANVAS = {
  /* Atoms */
  button:        ['atom', 'Button'],
  tile:          ['atom', 'Icon container'],
  avatar:        ['atom', 'Avatar & badge'],
  badge:         ['atom', 'Avatar & badge'],
  tag:           ['atom', 'Product tag'],
  status:        ['atom', 'Tag'],
  spin:          ['atom', 'Spinner, skeleton & progress'],
  ring:          ['atom', 'Spinner, skeleton & progress'],
  seg:           ['atom', 'Segmented'],
  divider:       ['atom', 'Divider, rate, bullet & tooltip'],
  tooltip:       ['atom', 'Divider, rate, bullet & tooltip'],
  'header-action': ['atom', 'Link'],
  /* Molecules */
  date:          ['molecule', 'Date controls'],
  pager:         ['molecule', 'Pagination'],
  action:        ['molecule', 'Action group'],
  applied:       ['molecule', 'Action group'],
  stat:          ['molecule', 'Statistic'],
  inline:        ['molecule', 'Stats with percentage'],
  metric:        ['molecule', 'Stats with percentage'],
  switcher:      ['molecule', 'Avatar meta row'],
  listing:       ['molecule', 'Thumbnail & badges'],
  chip:          ['molecule', 'Filter summary chip'],
  plan:          ['molecule', 'Compact & gradient card'],
  meter:         ['molecule', 'Health & completion'],
  /* Organisms */
  layout:        ['organism', 'App layout'],
  header:        ['organism', 'Header'],
  rail:          ['organism', 'Sidebar'],
  card:          ['organism', 'Card frame'],
  alert:         ['organism', 'Banner'],
  chart:         ['organism', 'Dashboard widgets'],
  table:         ['organism', 'Data table'],
  filter:        ['organism', 'Filter panel'],
  tabs:          ['organism', 'Data table'],
  modal:         ['organism', 'Modal'],
  drawer:        ['organism', 'Drawer'],
  popover:       ['organism', 'Notification & toast'],
  empty:         ['organism', 'Empty states'],
};

/* What each component actually CONTAINS, measured off its own specimens: the
   other components whose root class appears inside it. Not the tier — nesting
   depth calls the sidebar an atom, because its specimen holds nothing but its
   own items — but the evidence beside the tier, and the thing that would catch
   a section being filed under the wrong one. */
const rootOf = (sec) => (sec.primary.match(/^\.([\w-]+)/) || [, ''])[1];
const ROOTS = Object.fromEntries(sections.map((s) => [rootOf(s), s.id.replace(/^c-/, '')]).filter(([k]) => k));
const containsOf = (sec, cls) => [...new Set(cls.map((c) => ROOTS[c]).filter((x) => x && x !== sec.id.replace(/^c-/, '')))];

/* ── 4 · the icons ──────────────────────────────────────────────────────── */
const sprite = readFileSync(join(D, 'sprite.svg'), 'utf8');
const SYMBOLS = new Map([...sprite.matchAll(/<symbol id="([^"]+)"[\s\S]*?<\/symbol>/g)].map((m) => [m[1], m[0]]));

/* ── 5 · where each component is actually used ──────────────────────────── */
const pageFiles = readdirSync(D).filter((f) => f.endsWith('.html')
  && !/bundled|components|not-built|inline-art|qa-|\.qa\.|profolio-ksa/.test(f));
const pageText = Object.fromEntries(pageFiles.map((f) => [f, readFileSync(join(D, f), 'utf8')]));
const usage = (cls) => pageFiles
  .map((f) => [f.replace(/\.html$/, ''), cls.reduce((n, c) =>
    n + (pageText[f].match(new RegExp(`class="[^"]*\\b${c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g')) || []).length, 0)])
  .filter(([, n]) => n > 0)
  .sort((a, b) => b[1] - a[1]);

/* ── 6 · write one file per component ───────────────────────────────────── */
if (existsSync(OUT)) rmSync(OUT, { recursive: true });
mkdirSync(OUT, { recursive: true });

const CHROME = `
/* ── PAGE CHROME — not part of the component. Delete this block and every
      element whose class starts x-, and what is left is the component.

      .x-stage reproduces .cat-stage from deliverables/components.html to the
      pixel — same padding, gap, min-height, border and grounds — because
      qa-components.mjs compares this page against that one box for box, and a
      stage of a different size would report every component as broken.

      The last two rules are the catalogue's own staging hacks, carried over
      for the same reason: an overlay positions itself against a page it does
      not have here, so it is pinned static to be visible at all. They are
      presentation for this sheet, not the component's own CSS. ── */
/* no font-family here: the base rule below sets the product's own stack on
   <body>, and a chrome rule with higher specificity silently re-fonted every
   component measured through it */
.x-wrap{width:1120px;margin:0 auto;padding:32px 0 64px}
.x-fill{width:520px;max-width:100%}
.x-item[data-wide="true"]{flex:1 1 100%}
.x-h1{font-size:28px;font-weight:700;margin:0 0 4px;color:#272B41}
.x-sel{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:13px;color:#006169}
.x-src{display:block;margin-top:10px;font-size:13px;line-height:1.5;color:#707070;max-width:70ch}
.x-note{margin-top:12px;padding:10px 12px;border-inline-start:3px solid #F0A742;background:#FFF8EC;font-size:13px;line-height:1.5;color:#4f4f4f;max-width:70ch}
.x-note[data-kind="tbc"]{border-color:#F73131;background:#FFF1F1}
.x-hr{border:0;border-top:1px solid #E6E6E6;margin:28px 0}
.x-h2{font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#9D9D9D;margin:0 0 14px}
.x-row{display:flex;flex-wrap:wrap;gap:20px;align-items:flex-start;margin-block-end:20px}
/* min-width:0, as .cat-main has it: without it a flex item's automatic minimum
   is its CONTENT, so the table's stage grew to 1177 where the catalogue holds
   it to the column's 1120 and lets the table overflow inside */
.x-item{display:flex;flex-direction:column;gap:8px;min-width:0}
/* .cat-label to the letter — 11px (--fs-tag), uppercased, letter-spaced, bold.
   The item is a flex column sized by its WIDEST child, so the label's metrics
   decide the stage's width, and a plain lowercase 11px label made three
   components measure narrower than the thing they were cut from. */
.x-label{font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:#9D9D9D;font-weight:700}
.x-stage{
  min-width:0;
  background:#F6F7FB;border:1px dashed #DEDEDE;
  border-radius:4px;padding:16px;
  display:flex;align-items:center;gap:12px;min-height:54px;
}
.x-stage[data-ground="white"]{background:#fff}
.x-stage[data-ground="dark"]{background:#272B41}
.x-stage[data-stack="true"]{flex-direction:column;align-items:stretch}
.x-stage .pf-popover,.x-stage .pf-drawer-head{position:static}
.x-stage .pf-noti{background:#fff}
.x-stage .pf-spin{block-size:120px}
.x-meta{font-size:13px;color:#707070;line-height:1.7}
.x-meta code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;color:#006169}
`.trim();

const manifest = [];
const skipped = [];
for (const sec of sections) {
  const cls = classesOf(sec);
  if (!cls.length) { skipped.push({ id: sec.id.replace(/^c-/, ''), name: sec.name, why: 'documents attributes, not classes — nothing in the stylesheet to cut' }); continue; }
  const want = new Set(cls);

  const mine = classRules.filter((r) => [...selClasses(r.sel)].some((c) => want.has(c)));
  /* inside @media, the same test, rule by rule */
  const media = atRules.filter((a) => a.sel.startsWith('@media')).map((a) => {
    const inner = rulesIn(a.open + 1, a.close, 0).filter((r) => [...selClasses(r.sel)].some((c) => want.has(c)));
    return inner.length ? { sel: a.sel, inner } : null;
  }).filter(Boolean);

  /* `mine` ONLY. The media rules are emitted below inside their @media, and
     including them here as well put the breakpoint's declarations in the
     unconditional cascade — `.pf-card{border:0}` from the 991px rule applied at
     every width, so every extracted card lost its border. A rule that is
     conditional has to stay inside its condition. */
  const bodyCss = mine.map(slice).join('\n');
  const mediaCss = media.flatMap((m) => m.inner).map(slice).join('\n');
  const frames = atRules.filter((a) => a.sel.startsWith('@keyframes')
    && (bodyCss + mediaCss).includes(a.sel.replace(/^@keyframes\s+/, '')));

  const baseText = baseRules.map(slice).join('\n');
  const tokens = tokenClosure([...tokensUsedIn(bodyCss), ...tokensUsedIn(mediaCss), ...tokensUsedIn(baseText)]);

  const icons = [...new Set(sec.specimens.flatMap((s) =>
    [...s.markup.matchAll(/<use href="#([\w-]+)"/g)].map((m) => m[1])))].filter((i) => SYMBOLS.has(i));

  const used = usage(cls);

  const css1 = [
    `/* ── ${sec.name} · ${cls.length} class(es), ${mine.length + media.reduce((n, m) => n + m.inner.length, 0)} rule(s), ${tokens.length} token(s)`,
    `      cut from deliverables/profolio.css by scripts/extract-components.mjs ── */`,
    '',
    '/* the custom properties these rules reach, transitively */',
    ':root{',
    ...tokens.map((t) => TOKENS.get(t)),
    '}',
    '',
    '/* the base every page sits on */',
    baseText,
    '',
    '/* the component */',
    bodyCss,
    ...(media.length ? ['', ...media.map((m) => `${m.sel}{\n${m.inner.map(slice).join('\n')}\n}`)] : []),
    ...(frames.length ? ['', ...frames.map(slice)] : []),
  ].join('\n');

  const html = `<!doctype html>
<html lang="en" dir="ltr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(sec.name)} — Profolio KSA</title>
<!-- GENERATED by scripts/extract-components.mjs — do not edit.
     Everything below the chrome block is this component and only this
     component. Lift the <style>, the <svg> symbols and the markup. -->
<!-- the product's own faces; a relative file, so this page still opens offline -->
<link rel="stylesheet" href="../fonts.css">
<style data-chrome>
${CHROME}
</style>
<style>
${css1}
</style>
</head>
<body>
<svg xmlns="http://www.w3.org/2000/svg" hidden aria-hidden="true">
${icons.map((i) => SYMBOLS.get(i)).join('\n')}
</svg>
<div class="x-wrap">
  <h1 class="x-h1">${esc(sec.name)}</h1>
  <div class="x-sel">${esc(sec.primary || cls.map((c) => '.' + c).join(' '))}</div>
  ${sec.src ? `<span class="x-src">${esc(sec.src)}</span>` : ''}
${sec.notes.map((n) => `  <div class="x-note" data-kind="${esc(n.kind)}">${esc(n.text)}</div>`).join('\n')}
  <hr class="x-hr">
  <h2 class="x-h2">states</h2>
  <div class="x-row">
${sec.specimens.map((s) => `    <div class="x-item${s.fill ? ' x-fill' : ''}"${s.wide ? ' data-wide="true"' : ''}><span class="x-label">${esc(s.label)}</span><div class="x-stage"${s.ground ? ` data-ground="${esc(s.ground)}"` : ''}${s.stack ? ' data-stack="true"' : ''}>${s.markup}</div></div>`).join('\n')}
  </div>
  <hr class="x-hr">
  <h2 class="x-h2">what you are lifting</h2>
  <div class="x-meta">
    classes — ${cls.map((c) => `<code>.${esc(c)}</code>`).join(' ')}<br>
    tokens — ${tokens.length ? tokens.map((t) => `<code>${esc(t)}</code>`).join(' ') : '<em>none</em>'}<br>
    icons — ${icons.length ? icons.map((i) => `<code>#${esc(i)}</code>`).join(' ') : '<em>none</em>'}<br>
    used on — ${used.length ? used.map(([p, n]) => `<code>${esc(p)}</code>&nbsp;×${n}`).join(' · ') : '<em>no page in this deliverable</em>'}
  </div>
</div>
</body>
</html>
`;
  writeFileSync(join(OUT, `${sec.id.replace(/^c-/, '')}.html`), html);
  const cid = sec.id.replace(/^c-/, '');
  const [tier, section] = CANVAS[cid] || ['unfiled', ''];
  manifest.push({
    id: cid, name: sec.name, primary: sec.primary, src: sec.src,
    tier, canvasSection: section, contains: containsOf(sec, cls),
    css: css1, specimens: sec.specimens, notes: sec.notes,
    classes: cls, tokens, icons, rules: mine.length + media.reduce((n, m) => n + m.inner.length, 0),
    states: sec.specimens.map((s) => s.label), notes: sec.notes,
    usedOn: Object.fromEntries(used), bytes: Buffer.byteLength(html),
  });
}

/* ── 7 · the index ──────────────────────────────────────────────────────── */
const orphanClasses = (() => {
  const claimed = new Set(manifest.flatMap((m) => m.classes));
  const all = new Set(classRules.flatMap((r) => [...selClasses(r.sel)]).filter((c) => /^pf-/.test(c)));
  return [...all].filter((c) => !claimed.has(c)).sort();
})();

const index = `<!doctype html>
<html lang="en" dir="ltr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Components — Profolio KSA</title>
<link rel="stylesheet" href="../fonts.css">
<style>
${CHROME}
table{border-collapse:collapse;width:100%;font-size:13px}
th{text-align:start;font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:#9D9D9D;padding:0 12px 8px 0;font-weight:700}
td{padding:9px 12px 9px 0;border-top:1px solid #EFEFEF;vertical-align:top;color:#4f4f4f}
td a{color:#006169;font-weight:600;text-decoration:none}
td a:hover{text-decoration:underline}
.num{text-align:end;font-variant-numeric:tabular-nums;color:#707070}
.on{color:#707070;font-size:12px}
</style>
</head>
<body>
<div class="x-wrap">
  <h1 class="x-h1">Components</h1>
  <span class="x-src">One file per component, cut out of <code>deliverables/profolio.css</code>:
  its rules, every custom property they reach transitively, the base reset, the sprite
  symbols its states use, and the states themselves. Open one and lift it — the page
  chrome is in its own marked block and its own <code>x-</code> classes.</span>
  <hr class="x-hr">
  <table>
    <tr><th>component</th><th>selector</th><th class="num">classes</th><th class="num">rules</th><th class="num">tokens</th><th>states</th><th>used on</th></tr>
${manifest.map((m) => `    <tr><td><a href="${m.id}.html">${esc(m.name)}</a></td><td><code>${esc(m.primary)}</code></td><td class="num">${m.classes.length}</td><td class="num">${m.rules}</td><td class="num">${m.tokens.length}</td><td class="on">${m.states.map(esc).join(', ')}</td><td class="on">${Object.keys(m.usedOn).length ? Object.entries(m.usedOn).slice(0, 3).map(([p, n]) => `${esc(p)}&nbsp;×${n}`).join(', ') : '—'}</td></tr>`).join('\n')}
  </table>
${orphanClasses.length ? `  <hr class="x-hr">
  <h2 class="x-h2">not in any component</h2>
  <div class="x-meta">${orphanClasses.length} <code>pf-</code> class(es) the stylesheet defines that no catalogue
  section demonstrates, so nothing here can cut them out:<br>${orphanClasses.map((c) => `<code>.${esc(c)}</code>`).join(' ')}</div>` : ''}
</div>
</body>
</html>
`;
writeFileSync(join(OUT, 'index.html'), index);
mkdirSync(join(ROOT, 'data'), { recursive: true });
writeFileSync(join(ROOT, 'data', 'components.json'), JSON.stringify({
  at: new Date().toISOString(), components: manifest, skipped, orphanClasses,
}, null, 2));

const kb = manifest.reduce((n, m) => n + m.bytes, 0);
console.log(`\n  deliverables/components/ — ${manifest.length} component(s), ${(kb / 1024).toFixed(0)}KB`);
console.log(`  ${manifest.reduce((n, m) => n + m.classes.length, 0)} classes · `
  + `${manifest.reduce((n, m) => n + m.rules, 0)} rules · `
  + `${new Set(manifest.flatMap((m) => m.tokens)).size} distinct tokens`);
for (const k of skipped) console.log(`  skipped ${k.name} — ${k.why}`);
if (orphanClasses.length) console.log(`  ${orphanClasses.length} pf- class(es) in no component: ${orphanClasses.slice(0, 8).join(' ')}${orphanClasses.length > 8 ? ' …' : ''}`);
console.log(`  → deliverables/components/index.html · data/components.json\n`);
