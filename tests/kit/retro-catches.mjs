#!/usr/bin/env node
/**
 * The retro (qa/retro.mjs) runs on a locked design only, and what it sends is about the skill.
 * This builds a small locked design — flow.json with a chosen direction that adds one component,
 * its web screen and new.css, a passing run log and a retro.md — and runs the retro without a push:
 *   - the good design: assembled, with the QA's numbers, the agent's sections and the proposed
 *     component's markup and meta;
 *   - one broken copy per rule: not locked, the last full run failed, a section missing, an e-mail
 *     address, a phone number — each refused (exit 1) with its reason.
 *
 *   node tests/kit/retro-catches.mjs          exit 1 if a rule lets its break through
 *   KEEP=1 node tests/kit/retro-catches.mjs   leave the fixtures in skill/designs/retro-t*
 */
import { writeFileSync, readFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SK = join(ROOT, 'skill');
const HOME = join(SK, 'designs');

const FLOW = {
  name: 'retro-t', title: 'Retro test', platforms: ['web'], start: 'report', variations: 'new', chosen: 'B', locked: '2026-10-16',
  directions: [
    { id: 'A', kind: 'system', title: 'The product', layout: 'table' },
    { id: 'B', kind: 'competitor', title: 'One-line summary', layout: 'dashboard',
      components: [{ name: 'Week summary', class: 'pfx-summary', why: 'the product has no one-line summary of a period' }] },
  ],
  screens: [{ id: 'report', title: 'Report', directions: { A: { web: 'A/web/report.html' }, B: { web: 'B/web/report.html' } } }],
};
const WEB = '<!doctype html><html><head><link rel="stylesheet" href="../new.css"></head><body><main>'
  + '<section class="pfx-summary" data-pf-fresh="f1"><p class="pfx-summary__line">Leads up 12% this week</p><section class="inner"></section></section>'
  + '<p>after</p></main></body></html>';
const CSS = '.pfx-summary { padding: 12px 16px; }\n';
const RETRO = `# Retro

## What was asked
A weekly summary on the report page.

## Decisions
D10 new components: one summary line.

## Where the skill got in the way
The registry slice for reports took three reads.

## Suggestions for the skill
Index the report components by page.
`;
const RUNS = [
  { at: '2026-10-15T10:00:00Z', ran: 1, partial: null, errors: 3, warnings: 1, coverage: '80%', checks: { direction: 2, matrix: 1 } },
  { at: '2026-10-15T11:00:00Z', ran: 1, partial: 'report', errors: 1, warnings: 0, coverage: '', checks: { direction: 1 } },
  { at: '2026-10-16T09:00:00Z', ran: 1, partial: null, errors: 0, warnings: 0, coverage: '100%', checks: {} },
];

function build(name, edit = (x) => x) {
  const x = edit({ flow: structuredClone(FLOW), retro: RETRO, runs: structuredClone(RUNS) });
  const dir = join(HOME, name);
  rmSync(dir, { recursive: true, force: true });
  for (const d of ['A/web', 'B/web', 'qa']) mkdirSync(join(dir, d), { recursive: true });
  writeFileSync(join(dir, 'flow.json'), JSON.stringify({ ...x.flow, name }, null, 1));
  writeFileSync(join(dir, 'A/web/report.html'), '<!doctype html><p>A</p>');
  writeFileSync(join(dir, 'B/web/report.html'), WEB);
  writeFileSync(join(dir, 'B/new.css'), CSS);
  if (x.runs) writeFileSync(join(dir, 'qa', 'runs.jsonl'), x.runs.map((r) => JSON.stringify(r)).join('\n') + '\n');
  if (x.retro != null) writeFileSync(join(dir, 'retro.md'), x.retro);
  return dir;
}
const run = (name, edit) => {
  const dir = build(name, edit);
  const r = spawnSync('node', ['qa/retro.mjs', `designs/${name}`, '--no-push'], { cwd: SK, encoding: 'utf8' });
  return { dir, status: r.status, out: r.stdout + r.stderr };
};

let failed = 0;
const expect = (ok, what) => { console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${what}`); if (!ok) failed++; };
const made = [];
console.log('  the retro runs on a locked design only, and each rule catches its break');

/* the good design */
const good = run('retro-t');
made.push(good.dir);
const today = new Date().toISOString().slice(0, 10);
const file = join(good.dir, 'qa', 'retro', 'feedback', 'retros', `${today}-retro-t.md`);
const body = existsSync(file) ? readFileSync(file, 'utf8') : '';
expect(good.status === 0, `a locked, passing design with a retro.md is assembled (exit ${good.status})`);
expect(/## What the QA measured/.test(body) && /QA runs\*\*: 3 \(2 full, 1 partial\) · errors on the first full run: 3 · last: 100%/.test(body), 'the retro carries the QA\'s own numbers');
expect(/What failed most, over all runs\*\*: direction 3 · matrix 1/.test(body), 'the retro names what failed most');
expect(/variations new/.test(body) && /chosen \*\*B\*\*/.test(body), 'the retro names D10 and the chosen direction');
expect(['What was asked', 'Decisions', 'Where the skill got in the way', 'Suggestions for the skill'].every((s) => body.includes(`## ${s}`)), 'the agent\'s four sections are in it');
const P = join(good.dir, 'qa', 'retro', 'storybook', 'proposed', 'retro-t');
const html = existsSync(join(P, 'week-summary.html')) ? readFileSync(join(P, 'week-summary.html'), 'utf8') : '';
const meta = existsSync(join(P, 'week-summary.json')) ? JSON.parse(readFileSync(join(P, 'week-summary.json'), 'utf8')) : {};
expect(/^<section class="pfx-summary"[\s\S]*<section class="inner"><\/section><\/section>\n$/.test(html), 'the proposed component\'s markup is its whole element, nested tags and all');
expect(meta.class === 'pfx-summary' && meta.direction === 'B' && meta.date === '2026-10-16' && meta.status === 'proposed' && meta.css === CSS, 'the proposed component\'s meta has its class, direction, date and CSS');
expect(/## Proposed components[\s\S]*\*\*Week summary\*\*/.test(body), 'the retro lists the proposed component');

/* each rule refuses its break */
const breaks = [
  ['retro-t-open', (x) => ({ ...x, flow: { ...x.flow, locked: undefined } }), /"locked"/, 'a design not locked is refused'],
  ['retro-t-red', (x) => ({ ...x, runs: [...x.runs, { ran: 1, partial: null, errors: 2, checks: {} }] }), /last full QA run did not pass/, 'a design whose last full run failed is refused'],
  ['retro-t-norun', (x) => ({ ...x, runs: null }), /last full QA run did not pass/, 'a design with no QA run is refused'],
  ['retro-t-none', (x) => ({ ...x, retro: null }), /retro\.md is missing/, 'a missing retro.md is refused'],
  ['retro-t-short', (x) => ({ ...x, retro: x.retro.replace(/## Where the skill got in the way[\s\S]*?(?=## )/, '') }), /no "## Where the skill got in the way" section/, 'a retro.md without a section is refused'],
  ['retro-t-mail', (x) => ({ ...x, retro: x.retro + '\nThe PM, pm.name@example.com, chose B.\n' }), /an e-mail address \(pm\.name@example\.com\)/, 'a retro.md with an e-mail address is refused'],
  ['retro-t-phone', (x) => ({ ...x, retro: x.retro + '\nCall the agent on +966 55 123 4567.\n' }), /a phone number \(\+966 55 123 4567\)/, 'a retro.md with an international phone number is refused'],
  ['retro-t-local', (x) => ({ ...x, retro: x.retro + '\nOr 055 123 4567.\n' }), /a phone number \(055 123 4567\)/, 'a retro.md with a local phone number is refused'],
];
for (const [name, edit, re, what] of breaks) {
  const r = run(name, edit);
  made.push(r.dir);
  expect(r.status === 1 && re.test(r.out) && !existsSync(join(r.dir, 'qa', 'retro')), what);
}

/* a usage error */
const u = spawnSync('node', ['qa/retro.mjs'], { cwd: SK, encoding: 'utf8' });
expect(u.status === 2, 'no design folder is a usage error (exit 2)');

if (!process.env.KEEP) for (const d of made) rmSync(d, { recursive: true, force: true });
console.log(failed ? `\n  ${failed} rule(s) let their break through` : '\n  every rule holds');
process.exit(failed ? 1 : 0);
