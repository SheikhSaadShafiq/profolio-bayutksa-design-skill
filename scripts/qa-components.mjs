#!/usr/bin/env node
/**
 * Prove each extracted component file is WHOLE.
 *
 * extract-components.mjs decides which rules a component needs by looking at
 * which selectors name its classes. That is a guess dressed as a rule, and it
 * is wrong in exactly one way that matters: a component can be styled by a
 * selector that never mentions its class — a descendant rule, an element rule,
 * an inherited font. Cut the file on class names alone and the component looks
 * right in the catalogue and falls apart on its own.
 *
 * So this renders both and compares them. The same specimen, in
 * deliverables/components.html and in deliverables/components/<id>.html, walked
 * in document order, every element's box and the computed styles that a missing
 * rule would move. Any disagreement is a rule the extractor did not carry.
 *
 *   node scripts/qa-components.mjs              every component
 *   node scripts/qa-components.mjs --id badge   one
 *   node scripts/qa-components.mjs --strict     exit non-zero on any diff
 *
 * Writes data/qa/components.json.
 *
 * The comparison is only fair because .x-stage in the extracted file
 * reproduces .cat-stage from the catalogue exactly — same padding, gap,
 * min-height and grounds. If that stops being true this reports every
 * component as broken, which is the right failure: it means the two pages are
 * no longer showing the same thing.
 */
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const { chromium } = pkg;
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const D = join(ROOT, 'deliverables');
const arg = (n) => { const i = process.argv.indexOf(n); return i > -1 ? process.argv[i + 1] : undefined; };
const strict = process.argv.includes('--strict');

const manifest = JSON.parse(readFileSync(join(ROOT, 'data', 'components.json'), 'utf8'));
const only = arg('--id');
const components = manifest.components.filter((c) => !only || c.id === only);
if (!components.length) { console.error(`  no component "${only}"`); process.exit(2); }

/* The properties a missing rule actually moves. Geometry first — a dropped
   display or padding shows up there — then the paint, because a dropped colour
   or radius changes nothing about the box and everything about the component. */
const PROPS = ['display', 'position', 'fontSize', 'fontWeight', 'fontFamily', 'lineHeight',
  'color', 'backgroundColor', 'borderTopWidth', 'borderTopColor', 'borderTopLeftRadius',
  'paddingTop', 'paddingInlineStart', 'marginTop', 'gap', 'flexDirection', 'alignItems',
  'boxShadow', 'opacity', 'textAlign', 'inset'];

/* Walk a stage's subtree, skipping nothing: an element the extractor forgot is
   usually a child, not the root. Keyed by position so the two sides line up
   without needing ids. */
const WALK = (stageSel, PROPS) => {
  const out = [];
  for (const stage of document.querySelectorAll(stageSel)) {
    const items = [];
    const walk = (n, path) => {
      const cs = getComputedStyle(n);
      const b = n.getBoundingClientRect();
      const style = {};
      for (const p of PROPS) style[p] = cs[p];
      items.push({
        path, tag: n.tagName.toLowerCase(),
        cls: [...n.classList].filter((c) => !/^(cat|x)-/.test(c)).join(' '),
        w: Math.round(b.width * 10) / 10, h: Math.round(b.height * 10) / 10, style,
      });
      [...n.children].forEach((c, i) => walk(c, `${path}/${i}`));
    };
    [...stage.children].forEach((c, i) => walk(c, String(i)));
    out.push(items);
  }
  return out;
};

/* Freeze motion on BOTH sides before measuring. getBoundingClientRect returns
   the ROTATED box, so .pf-spin-dot — a 27px square on a 1.2s linear rotate —
   measures 38 at 45 degrees and 27 at 0. The first run of this reported eleven
   differences on `spin` and every one of them was the two pages being caught at
   different moments of the same animation. A comparison has to stop the clock. */
const FREEZE = '*,*::before,*::after{animation:none !important;transition:none !important}';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

await page.goto(`file://${join(D, 'components.html')}`, { waitUntil: 'load' });
await page.addStyleTag({ content: FREEZE });
await page.evaluate(() => document.fonts.ready);

/* the catalogue, section by section — the same stage selector the extractor read */
const left = {};
for (const c of components) {
  left[c.id] = await page.evaluate(([sel, props, fn]) =>
    new Function('stageSel', 'PROPS', `return (${fn})(stageSel, PROPS)`)(sel, props),
  [`#c-${c.id} .cat-stage`, PROPS, WALK.toString()]);
}

const rows = [];
for (const c of components) {
  const file = join(D, 'components', `${c.id}.html`);
  if (!existsSync(file)) { rows.push({ id: c.id, fault: 'no file' }); continue; }
  await page.goto(`file://${file}`, { waitUntil: 'load' });
  await page.addStyleTag({ content: FREEZE });
  await page.evaluate(() => document.fonts.ready);
  const right = await page.evaluate(([sel, props, fn]) =>
    new Function('stageSel', 'PROPS', `return (${fn})(stageSel, PROPS)`)(sel, props),
  ['.x-stage', PROPS, WALK.toString()]);

  const L = left[c.id], R = right;
  const diffs = [];
  if (L.length !== R.length) diffs.push({ what: 'stages', live: L.length, ours: R.length });
  for (let s = 0; s < Math.min(L.length, R.length); s++) {
    const a = L[s], b = R[s];
    if (a.length !== b.length) diffs.push({ what: `stage ${s} elements`, live: a.length, ours: b.length });
    for (let i = 0; i < Math.min(a.length, b.length); i++) {
      const x = a[i], y = b[i];
      const where = `${x.tag}${x.cls ? '.' + x.cls.split(' ').join('.') : ''}`;
      if (Math.abs(x.w - y.w) > 1) diffs.push({ what: `${where} width`, live: x.w, ours: y.w });
      if (Math.abs(x.h - y.h) > 1) diffs.push({ what: `${where} height`, live: x.h, ours: y.h });
      for (const p of PROPS) {
        if (x.style[p] !== y.style[p]) diffs.push({ what: `${where} ${p}`, live: x.style[p], ours: y.style[p] });
      }
    }
  }
  const elements = L.reduce((n, s) => n + s.length, 0);
  rows.push({ id: c.id, name: c.name, stages: L.length, elements, diffs: diffs.slice(0, 40), n: diffs.length });
}

await browser.close();

console.log('\n  component                        stages  elements  verdict');
let bad = 0;
for (const r of rows) {
  if (r.fault) { console.log(`  ${r.id.padEnd(32)} ${'—'.padStart(6)} ${'—'.padStart(9)}  ${r.fault}`); bad++; continue; }
  const ok = r.n === 0;
  if (!ok) bad++;
  console.log(`  ${r.id.padEnd(32)} ${String(r.stages).padStart(6)} ${String(r.elements).padStart(9)}  `
    + (ok ? 'identical' : `${r.n} difference(s)`));
  if (!ok) for (const d of r.diffs.slice(0, 6)) console.log(`      ${d.what}: catalogue ${d.live} · extracted ${d.ours}`);
}
console.log(`\n  ${rows.length - bad} of ${rows.length} extracted file(s) render identically to the catalogue\n`);

mkdirSync(join(ROOT, 'data', 'qa'), { recursive: true });
writeFileSync(join(ROOT, 'data', 'qa', 'components.json'), JSON.stringify({ at: new Date().toISOString(), rows }, null, 2));
if (strict && bad) process.exit(1);
