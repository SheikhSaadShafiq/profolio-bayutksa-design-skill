#!/usr/bin/env node
/**
 * The QA opens what a person would open. v2's QA passed a prototype whose menus and shell were
 * broken once opened, because it only looked at each state at load. This builds a one-screen
 * design twice, its sort menu inside a box that clips it and then free, and runs the whole QA
 * (qa/prototype.mjs): the clipped menu must fail it with `clip`; the free one must not.
 *
 *   node tests/kit/sweep-catches.mjs          exit 1 if the sweep misses the clipped menu
 */
import { writeFileSync, readFileSync, mkdirSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SK = join(ROOT, 'skill');
const flow = { name: 'sweep', title: 'A menu, for the QA sweep', platforms: ['web'], start: 'list', pages: 'none', screens: [{ id: 'list', title: 'List', web: 'list.html' }], states: [{ id: 'list', title: 'List', set: {} }] };
const screen = (clip) => `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>List</title><meta name="pf-device" content="web">
<link rel="stylesheet" href="${join(SK, 'kit', 'kit.css')}"></head>
<body style="margin:0;padding:24px">
<div style="height:56px;${clip ? 'overflow:hidden;' : ''}padding:8px">
  <div class="pfk-anchor">
    <button class="pfk-outline" type="button" data-pf-menu="sort"><span data-pf-show="sort=added">Newest First</span><span data-pf-show="sort=price">Lowest Price</span></button>
    <div class="pfk-menu" data-pf-menu-panel="sort">${[['added', 'Newest First'], ['price', 'Lowest Price'], ['-price', 'Highest Price']].map(([v, l]) => `<button class="pfk-menu__item" type="button" data-pf-set="sort=${v}; menu=''">${l}</button>`).join('')}</div>
  </div>
</div>
<script type="application/json" id="pf-state">{"sort":"added"}</script>
</body></html>`;

let failed = 0;
const expect = (ok, what) => { console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${what}`); if (!ok) failed++; };
for (const clip of [true, false]) {
  const dir = join(tmpdir(), 'pf-sweep-' + (clip ? 'clipped' : 'free'));
  rmSync(dir, { recursive: true, force: true }); mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'flow.json'), JSON.stringify(flow));
  writeFileSync(join(dir, 'list.html'), screen(clip));
  const r = spawnSync('node', ['qa/prototype.mjs', dir], { cwd: SK, encoding: 'utf8' });
  if (r.status === 3) { console.log('  no browser — the sweep did not run'); process.exit(3); }
  let rep = { issues: [] };
  try { rep = JSON.parse(readFileSync(join(dir, 'qa', 'prototype.json'), 'utf8')); } catch { /* no report */ }
  /* a bare fixture fails the static checks (no matrix, no pf-base): only the sweep is judged here */
  const clipped = rep.issues.filter((i) => i.check === 'clip');
  expect(/1 interactions/.test(rep.coverage || ''), `the sweep opened the menu (${rep.coverage || 'no coverage'})`);
  if (clip) expect(r.status === 1 && clipped.some((i) => /cut off/.test(i.message)), 'a menu that opens cut off fails the QA with clip');
  else expect(!clipped.length, `the same menu, free, is not flagged${clipped.length ? ': ' + clipped[0].message : ''}`);
}
console.log(failed ? `  ${failed} check(s) failed` : '  the sweep opens the menu and sees it cut off');
process.exit(failed ? 1 : 0);
