#!/usr/bin/env node
/**
 * The runtime's smaller pieces, as the 2026-10-14 rerun needed them, in a built prototype:
 * - a sum in a text binding: data-pf-text="{@balance-@price}";
 * - a pattern's value per row: data-pf-var="--pfk-value: $.score" on a score ring;
 * - skeleton rows from a list whose row is itself a button keep the row's shape, and never copy
 *   the selected row's look;
 * - the kit loads before a direction's new.css, as in the screen itself, so the direction wins.
 *
 *   node tests/kit/runtime-pieces.mjs          exit 1 if a piece does not work
 */
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { launch } from '../../skill/qa/browser.mjs';

const SK = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'skill');
const FEAT = 'designs/_t-pieces', DIR = join(SK, FEAT);
rmSync(DIR, { recursive: true, force: true });
for (const d of ['A', 'B']) mkdirSync(join(DIR, d), { recursive: true });
const rows = [{ id: 'r1', name: 'Villa in Al Malqa', score: 72 }, { id: 'r2', name: 'Flat in Al Olaya', score: 35 }, { id: 'r3', name: 'Land in Hittin', score: 90 }];
writeFileSync(join(DIR, 'flow.json'), JSON.stringify({
  name: '_t-pieces', title: 'Pieces', platforms: ['web'], start: 's1', pages: 'none',
  directions: [{ id: 'A', kind: 'existing', layout: 'table', hero: 'the name' }, { id: 'B', kind: 'competitor', layout: 'cards', hero: 'the ring' }],
  screens: [{ id: 'scr', title: 'Pieces', directions: { A: { web: 'A/s.html' }, B: { web: 'B/s.html' } } }],
  states: [{ id: 's1', set: { balance: 100, price: 40, row: 'r1' } }],
}));
const screen = (css) => `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="../../../kit/kit.css">${css ? '<link rel="stylesheet" href="new.css">' : ''}
<script type="application/json" id="pf-state">{"balance": 0, "price": 0, "row": ""}</script>
<script type="application/json" id="pf-data">${JSON.stringify({ rows })}</script></head><body>
<p id="calc" data-pf-text="{@balance-@price}"></p>
<div data-pf-list="rows" id="list"><template><button class="pfk-tile" data-pf-set="row=$.id" data-pf-class="pfk-tile--on: row=$.id"><span class="pfk-ring" data-pf-var="--pfk-value: $.score"><span class="pfk-ring__value" data-pf-text="$.score"></span></span><span class="pfk-tile__title" data-pf-text="$.name"></span><span>Unlock</span></button></template></div>
<div id="skel" data-pf-skeleton="rows" data-pf-rows="2"></div>
<div id="over" class="pfk-tile pfx-over">over</div>
</body></html>`;
writeFileSync(join(DIR, 'A', 's.html'), screen(false));
writeFileSync(join(DIR, 'B', 's.html'), screen(true));
writeFileSync(join(DIR, 'B', 'new.css'), '.pfx-over { padding: 3px; }\n');
const built = spawnSync('node', ['qa/prototype.mjs', FEAT, '--no-qa'], { cwd: SK, encoding: 'utf8' });

let failed = 0;
const expect = (ok, what) => { console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${what}`); if (!ok) failed++; };
const b = await launch({ install: true, log: console.log });
if (b.error) { console.log(`  no browser — ${b.error}`); process.exit(3); }
try {
  const p = await b.page({ width: 1440, height: 900 });
  await p.goto(pathToFileURL(join(DIR, 'prototype.html')).href);
  for (let t = 0; t < 80 && !(await p.evaluate(() => !!window.__pfp)); t++) await new Promise((r) => setTimeout(r, 250));
  expect(await p.evaluate(() => !!window.__pfp), `the prototype builds and boots${await p.evaluate(() => !!window.__pfp) ? '' : ': ' + (built.stdout + built.stderr).slice(-400)}`);
  await p.evaluate(() => window.__pfp.dir('B'));
  await p.evaluate(() => window.__pfp.go('s1', 'web'));
  await new Promise((r) => setTimeout(r, 600));
  const got = await p.evaluate(() => {
    const d = document.getElementById('pfp-frame').contentDocument, w = d.defaultView;
    const items = [...d.querySelectorAll('#list > .pfk-tile')];
    const skel = [...d.querySelectorAll('#skel > [data-pf-skeleton-row]')];
    return {
      calc: d.getElementById('calc').textContent.trim(),
      values: items.map((e) => e.querySelector('.pfk-ring').style.getPropertyValue('--pfk-value')),
      on: items.map((e) => e.classList.contains('pfk-tile--on')),
      skel: skel.map((e) => ({ tag: e.tagName, on: e.classList.contains('pfk-tile--on'), h: Math.round(e.getBoundingClientRect().height), bars: e.querySelectorAll('.pfk-skel').length })),
      row: Math.round((items[0] || d.body).getBoundingClientRect().height),
      pad: w.getComputedStyle(d.getElementById('over')).paddingTop,
    };
  });
  expect(got.calc === '60', `a sum in a text binding: {@balance-@price} → ${got.calc}`);
  expect(JSON.stringify(got.values) === '["72","35","90"]', `data-pf-var sets each row's ring (${got.values.join(', ')})`);
  expect(got.on[0] === true && !got.on[1], 'the selected row is drawn selected');
  expect(got.skel.length === 2 && got.skel.every((s) => s.tag === 'BUTTON' && !s.on && s.bars >= 2 && Math.abs(s.h - got.row) <= 12), `skeleton rows keep a button row's shape, its texts as bars, never selected (${JSON.stringify(got.skel)}; a real row is ${got.row} px)`);
  expect(got.pad === '3px', `the direction's new.css wins over the kit, as in the screen (padding ${got.pad})`);
} finally {
  await b.close();
  rmSync(DIR, { recursive: true, force: true });
}
console.log(failed ? `  ${failed} check(s) failed` : '  the runtime\'s pieces work');
process.exit(failed ? 1 : 0);
