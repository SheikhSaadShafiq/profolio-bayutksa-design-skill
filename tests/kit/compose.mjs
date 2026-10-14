#!/usr/bin/env node
/**
 * The composer (skill/qa/compose.mjs) makes a screen the QA accepts, at every folder depth:
 * a direction's screen (B, with its new.css), a direction A screen (none), and a screen at the
 * design's root. A block taken from another compiled page goes in, its file named in pf-also,
 * and qa/validate.py passes the result. No browser needed.
 *
 *   node tests/kit/compose.mjs          exit 1 on the first thing the composer gets wrong
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const SKILL = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'skill');
const FEAT = 'designs/_t-compose';
const DIR = join(SKILL, FEAT);
rmSync(DIR, { recursive: true, force: true });
mkdirSync(DIR, { recursive: true });
writeFileSync(join(DIR, 'flow.json'), '{"name": "_t-compose", "states": [{"id": "a"}]}');
for (const f of ['state.json', 'data.json', 'actions.json']) writeFileSync(join(DIR, f), '{}');

const compose = (args, input) => {
  const r = spawnSync('node', ['qa/compose.mjs', ...args], { cwd: SKILL, encoding: 'utf8', input });
  return { ok: r.status === 0, out: (r.stdout || '') + (r.stderr || '') };
};
let failed = 0;
const expect = (ok, what) => { console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${what}`); if (!ok) failed++; };
const read = (f) => readFileSync(join(SKILL, f), 'utf8');
/* every local href and src resolves from the screen's own folder */
const broken = (f) => [...read(f).matchAll(/\s(?:href|src|data-src)="([^"#?]+)"/g)].map((m) => m[1])
  .filter((u) => !/^(https?:|data:|mailto:|tel:|javascript:|\/)/.test(u))
  .filter((u) => !existsSync(resolve(SKILL, dirname(f), u)));

try {
  /* B: three folders up, its new.css made and linked, the JSON pulled in */
  const B = `${FEAT}/B/listings.html`;
  const s = compose(['start', 'pages/listings.html', B]);
  expect(s.ok && existsSync(join(SKILL, B)), `start makes ${B}`);
  const h = read(B);
  expect(/<meta name="pf-base" content="pages\/listings\.html">/.test(h) && !/name="pf-compiled"/.test(h), 'pf-base names the compiled file, pf-compiled gone');
  expect(!/<script\b(?![^>]*application\/json)/i.test(h), 'the compiled scripts are dropped');
  expect(h.includes('href="../../../css/tokens.css"') && h.includes('href="../../../kit/kit.css"'), 'tokens.css and kit.css linked three folders up');
  expect(h.includes('href="new.css"') && existsSync(join(DIR, 'B', 'new.css')) && /Direction B/.test(read(`${FEAT}/B/new.css`)), "B's new.css made, with its header, and linked");
  expect(['pf-state', 'pf-data', 'pf-actions'].every((id) => new RegExp(`id="${id}" data-src="\\.\\./${id.slice(3)}\\.json"`).test(h)), 'the three JSON blocks point at ../state.json, ../data.json, ../actions.json');
  const bad = broken(B);
  expect(!bad.length, `every local link resolves (${bad.slice(0, 3).join(', ') || 'all'})`);

  /* a block from another compiled page, inserted, its file named */
  const f = compose(['find', 'pages/agency-staff.html', '.pf-card']);
  expect(f.ok && /^\s+1\s+<div class="pf-card[^"]*creditCard/m.test(f.out), 'find lists the matches by index');
  const blk = compose(['block', 'pages/agency-staff.html', '.pf-card', '--nth', '1']);
  expect(blk.ok && /creditCard/.test(blk.out.slice(0, 200)), 'block prints the second card whole');
  const ins = compose(['insert', B, 'main', '-', '--prepend'], blk.out);
  expect(ins.ok && /<main\b[^>]*>\s*<div class="pf-card[^"]*creditCard/.test(read(B)), 'insert puts it first in main, from stdin');
  const al = compose(['also', B, 'pages/agency-staff.html']);
  expect(al.ok && /<meta name="pf-also" content="pages\/agency-staff\.html">/.test(read(B)), 'also names its file in pf-also');
  const rep = compose(['replace', B, '.pf-card.creditCard', '-'], '<div class="pfk-stack" data-pf-new-copy>Replaced</div>');
  expect(rep.ok && read(B).includes('data-pf-new-copy>Replaced</div>') && !/creditCard/.test(read(B)), 'replace swaps the element for new markup');

  /* A: no stylesheet of its own; the design's root: two folders up */
  const A = `${FEAT}/A/listings.html`, R = `${FEAT}/listings.mobile.html`;
  compose(['start', 'pages/listings.html', A]);
  expect(!read(A).includes('new.css') && !existsSync(join(DIR, 'A', 'new.css')), 'A links no new.css and gets none');
  const r = compose(['start', 'pages/listings.mobile.html', R]);
  expect(r.ok && read(R).includes('href="../../css/tokens.css"') && /data-src="data\.json"/.test(read(R)) && !broken(R).length, 'a root screen links two folders up and its JSON beside it');
  const e = compose(['start', 'pages/listings.html', `${FEAT}/A/empty.html`, '--empty', 'main']);
  expect(e.ok && /<main\b[^>]*>\s*<\/main>/.test(read(`${FEAT}/A/empty.html`)), '--empty keeps main and drops its children');

  /* the QA's static check accepts what the composer made */
  const v = spawnSync('python3', ['qa/validate.py', B, A, R], { cwd: SKILL, encoding: 'utf8' });
  expect(v.status === 0, `qa/validate.py passes the three screens${v.status ? ':\n' + (v.stdout + v.stderr).split('\n').filter((l) => /FAIL|✗/.test(l)).slice(0, 5).join('\n') : ''}`);

  /* refusals */
  expect(!compose(['start', 'pages/listings.html', 'elsewhere/x.html']).ok, 'start refuses a screen outside designs/');
  expect(!compose(['block', 'pages/agency-staff.html', '.no-such-class']).ok, 'block fails on a selector that matches nothing');
} finally {
  rmSync(DIR, { recursive: true, force: true });
}
console.log(failed ? `  ${failed} check(s) failed` : '  the composer makes screens the QA accepts');
process.exit(failed ? 1 : 0);
