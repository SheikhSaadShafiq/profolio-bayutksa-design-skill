#!/usr/bin/env node
/**
 * Gate 1 shows three complete hi-fi directions, built from research. This builds one design
 * three ways from the compiled pages/reports-summary.html — A the product's components, B a
 * competitor-led pattern in the product's tokens, C a bold one with a new token — with its
 * research.json and board, and runs the whole QA (qa/prototype.mjs --shots):
 *   - the good design: no directions, direction, fresh or research error; the player switches
 *     A/B/C and each draws its own screen; every direction is rendered; the board is built;
 *   - one broken copy per rule, built without the visual QA: each fails with its check.
 * A bare fixture fails checks it does not set out to meet (the matrix, dead controls): only
 * the checks above are judged.
 *
 *   node tests/kit/directions-catches.mjs          exit 1 if a rule lets its break through
 */
import { writeFileSync, readFileSync, mkdirSync, rmSync, existsSync, readdirSync, utimesSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SK = join(ROOT, 'skill');
const BASE = 'pages/reports-summary.html';
if (!existsSync(join(SK, BASE))) {
  const f = spawnSync('python3', ['qa/fetch.py', 'reports-summary'], { cwd: SK, encoding: 'utf8' });
  if (f.status) { console.log(f.stdout + f.stderr); process.exit(2); }
}
spawnSync('python3', ['qa/fetch.py', '--css'], { cwd: SK, encoding: 'utf8' });

/* a direction's screen: the compiled page, its links three folders up, and what the direction adds at the top */
const screen = (dir, add = '', css = false) => readFileSync(join(SK, BASE), 'utf8')
  .replace(/<meta name="pf-compiled"[^>]*>/, `<meta name="pf-base" content="${BASE}">`)
  .replace(/<script\b(?![^>]*application\/json)[^>]*>[\s\S]*?<\/script>/g, '')
  .replace(/(href|src)="\.\.\//g, '$1="../../../')
  .replace('</head>', `<link rel="stylesheet" href="../../../kit/kit.css">${css ? '<link rel="stylesheet" href="new.css">' : ''}<script type="application/json" id="pf-state" data-src="../state.json"></script></head>`)
  .replace(/(<div class="pf-layout atbd-main-layout[^>]*>)/, `$1${add}`);
const B_ADD = '<section class="pfx-summary" data-pf-fresh="f1"><p class="pfx-summary__line">Leads up 12% this week, led by Al Malqa</p></section>';
const C_ADD = '<section class="pfx-band" data-pf-fresh="f2 f3"><p class="pfx-band__line">3 agents brought 70% of this week\'s leads</p></section>';
const B_CSS = '.pfx-summary { margin: 16px 24px 0; padding: 12px 16px; border-radius: var(--pf-border-radius-lg); background: var(--pf-color-primary-bg); color: var(--pf-color-primary); }\n.pfx-summary__line { margin: 0; }\n';
const C_CSS = ':root { --pfx-ink: #0b3d2e; /* [new] a deeper green for the insight band */ --pfx-wash: #e3f2ec; /* [new] its quiet ground */ }\n.pfx-band { margin: 16px 24px 0; padding: 14px 18px; border-radius: 12px; background: var(--pfx-wash); color: var(--pfx-ink); }\n.pfx-band__line { margin: 0; font-weight: 600; }\n';

const research = () => ({
  feature: 'Agency Report', question: 'An agency owner sees which agents bring leads and spend credits', made: '2026-10-14',
  competitors: [
    { id: 'c1', name: 'Wasalt Business', group: 'ksa', url: 'https://wasalt.sa/en/corporate', why: 'the KSA broker app agents already use' },
    { id: 'c2', name: 'Property Finder PF Expert', group: 'regional', url: 'https://www.propertyfinder.ae/partnerhub/pf-expert/', why: 'performance analytics beside leads' },
    { id: 'c3', name: 'Rightmove Plus', group: 'regional', url: 'https://hub.rightmove.co.uk/rightmove-plus/', why: 'market-share and lead reports' },
    { id: 'c4', name: 'Stripe Dashboard', group: 'saas', url: 'https://stripe.com', why: 'reports with period comparison' },
    { id: 'c5', name: 'Mixpanel', group: 'saas', url: 'https://mixpanel.com', why: 'insights in words' },
    { id: 'c6', name: 'Profolio UAE', group: 'bayut', url: 'https://www.bayut.com', why: 'the same report next door' },
  ],
  mobbin: ['Stripe', 'Mixpanel', 'Linear', 'Stripe', 'HubSpot', 'Mixpanel'].map((app, i) => ({ id: `m${i + 1}`, app, kind: 'screen', title: 'Report overview', url: `https://mobbin.com/screens/fixture-${i + 1}`, borrow: 'the comparison sits beside each number', avoid: 'too many tabs' })),
  mobbin_unavailable: null, web: [],
  trends: [
    { id: 't1', title: 'Dashboards that start with the answer', url: 'https://example.com/a', date: '2026-05', source: 'fixture', takeaway: 'lead with one sentence' },
    { id: 't2', title: 'Insight-first analytics', url: 'https://example.com/b', date: '2026-03', source: 'fixture', takeaway: 'explain the change' },
  ],
  fresh: [
    { id: 'f1', title: 'One line on what changed this week', what: 'a summary above the table', refs: ['m1', 't1'] },
    { id: 'f2', title: 'An insight band', what: 'the biggest driver in words', refs: ['m2', 't2'] },
    { id: 'f3', title: 'Agents ranked by contribution', what: 'who brought the leads', refs: ['m5', 'c3'] },
  ],
  rounds: [],
});
const flow = () => ({
  name: 'dirs', title: 'Agency Report — three directions', platforms: ['web'], start: 'report', pages: 'none',
  directions: [
    { id: 'A', kind: 'existing', title: 'The product as it is', label: 'Existing', summary: 'Summary page reordered', fresh: [] },
    { id: 'B', kind: 'competitor', title: 'Stripe-style summary', label: 'Competitor-led', summary: 'a one-line summary', fresh: ['f1'] },
    { id: 'C', kind: 'bold', title: 'Insight-first', label: 'Bold', summary: 'an insight band in a new green', fresh: ['f2', 'f3'] },
  ],
  screens: [{ id: 'report', title: 'Agency Report', directions: { A: { web: 'A/report.html' }, B: { web: 'B/report.html' }, C: { web: 'C/report.html' } } }],
  states: [{ id: 'report', title: 'Agency Report', set: {} }],
});
const design = (name, tweak = (x) => x) => {
  const dir = join(SK, 'designs', `_test-${name}`);
  rmSync(dir, { recursive: true, force: true });
  for (const d of ['A', 'B', 'C', 'research']) mkdirSync(join(dir, d), { recursive: true });
  const parts = tweak({ flow: flow(), research: research(), A: screen('A'), B: screen('B', B_ADD, true), C: screen('C', C_ADD, true), bcss: B_CSS, ccss: C_CSS, acss: null, board: true });
  writeFileSync(join(dir, 'flow.json'), JSON.stringify(parts.flow, null, 1));
  writeFileSync(join(dir, 'state.json'), '{}');
  for (const d of ['A', 'B', 'C']) writeFileSync(join(dir, d, 'report.html'), parts[d]);
  writeFileSync(join(dir, 'B', 'new.css'), parts.bcss);
  writeFileSync(join(dir, 'C', 'new.css'), parts.ccss);
  if (parts.acss) writeFileSync(join(dir, 'A', 'new.css'), parts.acss);
  writeFileSync(join(dir, 'research', 'research.json'), JSON.stringify(parts.research, null, 1));
  if (parts.board) spawnSync('node', ['qa/board.mjs', `designs/_test-${name}`], { cwd: SK, encoding: 'utf8' });
  if (parts.board === 'stale') { const t = new Date(Date.now() - 3600e3); utimesSync(join(dir, 'research', 'board.html'), t, t); }
  return dir;
};
const run = (name, tweak, args = ['--no-qa']) => {
  const dir = design(name, tweak);
  const r = spawnSync('node', ['qa/prototype.mjs', `designs/_test-${name}`, ...args], { cwd: SK, encoding: 'utf8' });
  if (r.status === 3 && !args.includes('--no-qa')) { console.log('  no browser — the QA did not run'); process.exit(3); }
  let rep = { issues: [] };
  try { rep = JSON.parse(readFileSync(join(dir, 'qa', 'prototype.json'), 'utf8')); } catch { /* no report */ }
  return { dir, rep, out: r.stdout + r.stderr, has: (check, re) => (rep.issues || []).some((i) => i.check === check && i.level === 'error' && (!re || re.test(i.message))) };
};

let failed = 0;
const expect = (ok, what) => { console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${what}`); if (!ok) failed++; };
const JUDGED = ['directions', 'direction', 'fresh', 'research'];

/* the good design, QA'd in a browser */
const good = run('dirs-good', (x) => x, ['--shots']);
const bad = (good.rep.issues || []).filter((i) => i.level === 'error' && JUDGED.includes(i.check));
expect(!bad.length, `three directions with their research pass directions, direction, fresh and research${bad.length ? ': ' + bad[0].message : ''}`);
expect(existsSync(join(good.dir, 'research', 'board.html')) && /Fresh moves/.test(readFileSync(join(good.dir, 'research', 'board.html'), 'utf8')), 'the board is built: competitors, references, trends, fresh moves');
expect(/× 3 directions/.test(good.rep.coverage || ''), `every direction is rendered (${good.rep.coverage || 'no coverage'})`);
const shots = existsSync(join(good.dir, 'qa', 'shots')) ? readdirSync(join(good.dir, 'qa', 'shots')) : [];
expect(['A', 'B', 'C'].every((d) => shots.some((f) => f.startsWith(d + '.report.'))), 'a shot of each direction');
expect((good.rep.newTokens || []).length === 2 && good.rep.newTokens.every((t) => t.dir === 'C' && t.why), 'the bold direction\'s new tokens are listed for sign-off');
expect(/## Directions[\s\S]*\[new\] token `--pfx-ink/.test(readFileSync(join(good.dir, 'qa', 'handoff.md'), 'utf8')), 'the handoff lists the directions and the new tokens');
{
  const { launch } = await import('../../skill/qa/browser.mjs');
  const b = await launch({ install: false });
  if (!b.error) {
    const p = await b.page({ width: 1600, height: 1000 });
    await p.goto(pathToFileURL(join(good.dir, 'prototype.html')).href);
    for (let t = 0; t < 80 && !(await p.evaluate(() => !!window.__pfp)); t++) await new Promise((r) => setTimeout(r, 250));
    const drawn = async (d) => { await p.evaluate((x) => window.__pfp.dir(x), d); return p.evaluate(() => { const d = document.getElementById('pfp-frame').contentDocument; return ['pfx-summary', 'pfx-band'].filter((c) => d.querySelector('.' + c)); }); };
    const ids = await p.evaluate(() => window.__pfp.directions());
    const a = await drawn('A'), bb = await drawn('B'), c = await drawn('C');
    const ink = await p.evaluate(() => { const e = document.getElementById('pfp-frame').contentDocument.querySelector('.pfx-band'); return e ? getComputedStyle(e).color : null; });
    expect(JSON.stringify(ids) === '["A","B","C"]' && !a.length && JSON.stringify(bb) === '["pfx-summary"]' && JSON.stringify(c) === '["pfx-band"]', `the player switches A/B/C, each its own screen (A ${a}, B ${bb}, C ${c})`);
    expect(ink === 'rgb(11, 61, 46)', `C draws in its new token (--pfx-ink → ${ink})`);
    expect(await p.evaluate(() => !!document.querySelector('[data-dir-btn="C"]') && /Research board/.test(document.body.textContent)), 'the player has the direction switch and the research board link');
    await b.close();
  }
}

/* one break per rule */
expect(run('dirs-a-css', (x) => ({ ...x, A: screen('A', '', true), acss: '.pfx-x { color: var(--pf-color-primary); }' })).has('direction', /draws only the product's components/), 'A with a stylesheet of its own fails `direction`');
expect(run('dirs-b-hex', (x) => ({ ...x, bcss: B_CSS + '.pfx-summary { color: #ff5a00; }' })).has('direction', /competitor-led\) keeps the product's colours/), 'B with a colour of its own fails `direction`');
expect(run('dirs-c-note', (x) => ({ ...x, ccss: C_CSS.replace('/* [new] a deeper green for the insight band */', '') })).has('direction', /needs a \/\* \[new\] why \*\/ note/), 'C with a new token and no [new] note fails `direction`');
expect(run('dirs-c-literal', (x) => ({ ...x, ccss: C_CSS + '.pfx-band { border-color: rgb(1, 2, 3); }' })).has('direction', /declare each new colour or face once/), 'C with a colour outside a --pfx- token fails `direction`');
expect(run('dirs-product-class', (x) => ({ ...x, bcss: B_CSS + '.pf-card { border-radius: 0; }' })).has('direction', /styles \.pf-card/), 'a direction restyling a product class fails `direction`');
expect(run('dirs-unmarked', (x) => ({ ...x, C: screen('C', C_ADD.replace(' data-pf-fresh="f2 f3"', ' data-pf-fresh="f2"'), true) })).has('fresh', /f3/), 'a fresh move listed and not drawn fails `fresh`');
expect(run('dirs-no-existing', (x) => ({ ...x, flow: { ...x.flow, directions: x.flow.directions.map((d) => (d.id === 'A' ? { ...d, kind: 'competitor', fresh: ['f1'] } : d)) }, A: screen('A', B_ADD.replace('pfx-summary', 'pfx-summary-a'), false) })).has('directions', /existing components/), 'no direction of existing components fails `directions`');
expect(run('dirs-groups', (x) => ({ ...x, research: { ...x.research, competitors: x.research.competitors.filter((c) => c.group !== 'bayut') } })).has('research', /group "bayut"/), 'a competitor group missing fails `research`');
expect(run('dirs-few-refs', (x) => ({ ...x, research: { ...x.research, mobbin: x.research.mobbin.slice(0, 3) } })).has('research', /at least 6 Mobbin references/), 'fewer than six Mobbin references fails `research`');
expect(run('dirs-no-trends', (x) => ({ ...x, research: { ...x.research, trends: [] } })).has('research', /2 recent trend/), 'no trends fails `research`');
expect(run('dirs-bad-ref', (x) => ({ ...x, research: { ...x.research, fresh: x.research.fresh.map((f) => (f.id === 'f2' ? { ...f, refs: ['m99'] } : f)) } })).has('research', /m99/), 'a fresh move from no real reference fails `research`');
expect(run('dirs-stale-board', (x) => ({ ...x, board: 'stale' })).has('research', /board\.html is missing or older/), 'a board older than its research fails `research`');
const web = run('dirs-no-mobbin', (x) => ({ ...x, research: { ...x.research, mobbin: [], mobbin_unavailable: 'the connector is not set up', web: x.research.mobbin.map((r) => ({ ...r, id: 'w' + r.id.slice(1), url: 'https://example.com/' + r.id })) , fresh: x.research.fresh.map((f) => ({ ...f, refs: f.refs.map((r) => r.replace(/^m/, 'w')) })) } }));
expect(!web.has('research') && (web.rep.issues || []).some((i) => i.check === 'research' && i.level === 'warn' && /Mobbin was not available/.test(i.message)), 'without Mobbin, six web references pass, with a warning to say so');

if (!process.argv.includes('--keep')) for (const f of readdirSync(join(SK, 'designs')).filter((f) => f.startsWith('_test-dirs'))) rmSync(join(SK, 'designs', f), { recursive: true, force: true });
console.log(failed ? `  ${failed} check(s) failed` : '  gate 1 holds three researched directions, and each rule catches its break');
process.exit(failed ? 1 : 0);
