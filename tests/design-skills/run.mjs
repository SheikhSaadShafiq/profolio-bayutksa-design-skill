#!/usr/bin/env node
/**
 * The design-* skills work on a product that is not Profolio: the plug-and-play rule,
 * tested. tests/design-skills/fixtures/acme is a made-up shop with a Tailwind theme, a
 * stylesheet and two order screens, one with known defects and one clean.
 *
 *   - the build: every skill's frontmatter, version, changelog, and no product named inside;
 *   - design-context reads Acme's colours, font, spacing base, motion and breakpoints;
 *   - design-qa blocks the defective screen on each defect, and passes the clean one;
 *   - design-qa runs as a wireframe without the visual checks.
 *
 *   node tests/design-skills/run.mjs        exit 1 if a skill misses what it must catch
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SK = join(ROOT, 'design-skills');
const FIX = join(ROOT, 'tests', 'design-skills', 'fixtures', 'acme');
const TMP = join(tmpdir(), 'design-skills-test');
rmSync(TMP, { recursive: true, force: true }); mkdirSync(TMP, { recursive: true });
let failed = 0;
const expect = (ok, what) => { console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${what}`); if (!ok) failed++; };
const require_html = (dir) => { try { readFileSync(join(dir, 'report.html')); return 'report.html'; } catch { return ''; } };
const run = (cmd, args) => spawnSync(cmd, args, { cwd: ROOT, encoding: 'utf8' });

/* the build's checks */
const check = run('node', ['scripts/design-skills.mjs', '--check']);
expect(check.status === 0, `every design-* skill passes the build's checks${check.status ? ': ' + check.stdout.trim() : ''}`);

/* design-context on a product it has never seen */
const card = join(TMP, 'context.json');
/* the product's code: its theme and stylesheet, not the screens a design is made of */
run('python3', [join(SK, '_shared', 'scan.py'), join(FIX, 'tailwind.config.js'), join(FIX, 'src'), '--name', 'Acme', '--out', card]);
const c = JSON.parse(readFileSync(card, 'utf8'));
expect(c.tokens.color.brand && c.tokens.color.brand.value === '#5B21B6', 'design-context reads the brand colour from the Tailwind theme');
expect(Object.values(c.tokens.type.families).some((f) => f.value === 'Inter'), 'design-context reads the font family');
expect(c.grid.web && c.grid.web.base === 8, 'design-context derives the 8 px spacing base from the stylesheet');
expect(Object.keys(c.tokens.motion.durations).includes('--duration-fast'), 'design-context reads the named motion duration');
expect(Object.keys(c.tokens.breakpoints).length === 2, 'design-context reads the two breakpoints');
expect(c.tokens.color.brand.provenance === 'derived' && c.tokens.motion.durations['--duration-fast'].provenance === 'measured', 'every value says where it came from: a Tailwind literal is derived, a custom property measured');

/* design-qa on the same product */
const qa = (screens, out, extra = []) => {
  const r = run('node', [join(SK, 'design-qa', 'scripts', 'render.mjs'), '--screens', screens, '--platforms', 'web', '--out', out, ...extra]);
  if (r.status === 3) { console.log('  no browser — the render checks did not run'); process.exit(3); }
  const s = run('python3', [join(SK, 'design-qa', 'scripts', 'run.py'), '--root', FIX, '--screens', screens, '--rendered-dir', out, '--out', out, ...extra]);
  return { status: s.status, report: JSON.parse(readFileSync(join(out, 'report.json'), 'utf8')) };
};
const bad = qa(join(FIX, 'bad.html'), join(TMP, 'bad'));
const has = (check, re) => bad.report.findings.some((f) => f.check === check && (!re || re.test(f.message)));
expect(bad.status === 2 && bad.report.verdict === 'blocked', 'design-qa blocks the screen with defects');
expect(has('lay.align', /“Customer” sits 12 px right/), 'lay.align: a header 12 px off its column');
expect(has('lay.squashed') && has('lay.controls'), 'lay.squashed and lay.controls: the 18 px button among 36 px ones');
expect(has('a11y.contrast.body', /1\.63:1/), 'a11y.contrast.body: 1.63:1 text');
expect(has('a11y.focusring'), 'a11y.focusring: a button with no visible focus, found by Tab');
expect(has('int.clip', /Sort/), 'int.clip: the Sort menu opens inside a box that clips it');
expect(has('mot.reduced') && has('mot.infinite'), 'mot.reduced and mot.infinite: an endless animation that ignores reduced motion');
expect(has('brk.render', /480 px/), 'brk.render: the fixed grid scrolls sideways at 480 px');
expect(has('ovf.long'), 'ovf.long: a 200-character value breaks the row');
expect(/interactions/.test(bad.report.render_coverage || ''), `the report says what was checked (${bad.report.render_coverage})`);
const clean = qa(join(FIX, 'clean.html'), join(TMP, 'clean'));
const others = clean.report.findings.filter((f) => f.check !== 'cov.empty');
expect(clean.report.verdict === 'pass_with_warnings' && !clean.report.counts.blocker && clean.report.findings.some((f) => f.check === 'cov.empty') && !others.length, `design-qa passes the clean screen, saying its empty state was not checked (no states list)${others.length ? ': ' + others.map((f) => f.check + ' ' + f.message).join(' | ') : ''}`);
expect(clean.report.scope.profile === 'hifi' && /report\.html/.test(require_html(join(TMP, 'clean'))), 'it writes report.html beside report.json');
const wire = qa(join(FIX, 'bad.html'), join(TMP, 'wire'), ['--profile', 'wireframe']);
expect(!wire.report.findings.some((f) => /^(a11y\.contrast|mot\.|res\.font)/.test(f.check)) && wire.report.findings.some((f) => f.check === 'lay.align'), 'as a wireframe: the visual checks wait, the layout checks run');

/* design-deliverables, end to end: the hi-fi's QA, the gate, ids, assembly, one bundled file */
const DEL = join(FIX, 'deliver'), DSK = join(SK, 'design-deliverables', 'scripts');
const hifi = qa(join(DEL, 'orders.html'), join(TMP, 'dq'), ['--states', join(DEL, 'states.json')]);
expect(!hifi.report.counts.blocker, `the delivered screen passes its QA (${hifi.report.verdict}${hifi.report.counts.blocker ? ': ' + hifi.report.findings.filter((f) => f.severity === 'blocker').map((f) => f.check).join(', ') : ''})`);
const v = run('python3', [join(SK, '_shared', 'validate.py'), join(SK, 'design-qa', 'schema', 'report.schema.json'), join(TMP, 'dq', 'report.json')]);
expect(v.status === 0, `design-qa's report.json validates against its own schema${v.status ? ': ' + v.stdout.trim().split('\n')[0] : ''}`);
expect(/hidden states/.test(hifi.report.render_coverage || ''), `a state the screen holds hidden ([data-state]) is rendered and checked (${hifi.report.render_coverage})`);
writeFileSync(join(TMP, 'bad', 'waivers.json'), JSON.stringify({ waivers: [{ check: 'lay.align', screen: bad.report.findings.find((f) => f.check === 'lay.align').screen }] }));
const w2 = run('python3', [join(SK, 'design-qa', 'scripts', 'run.py'), '--root', FIX, '--screens', join(FIX, 'bad.html'), '--rendered-dir', join(TMP, 'bad'), '--out', join(TMP, 'bad')]);
const wr = JSON.parse(readFileSync(join(TMP, 'bad', 'report.json'), 'utf8'));
expect(wr.findings.some((f) => f.check === 'qa.waiver') && !wr.findings.some((f) => f.check === 'lay.align' && f.waived), 'a waiver without its reason, owner and expiry is ignored, and reported');
const blk = run('python3', [join(DSK, 'assemble.py'), '--feature', 'x', '--version', '1', '--screens', join(FIX, 'bad.html'), '--report', join(TMP, 'bad', 'report.json'), '--out', join(TMP, 'src-bad')]);
expect(blk.status === 3, 'assemble.py refuses a BLOCKED report');
const frag = run('python3', [join(DSK, 'consume_report.py'), '--report', join(TMP, 'dq', 'report.json'), '--out', join(TMP, 'frag')]);
expect(frag.status === 0, 'consume_report.py turns the report into section fragments');
const refuse = run('python3', [join(DSK, 'consume_report.py'), '--report', join(TMP, 'wire', 'report.json'), '--out', join(TMP, 'frag-wire')]);
expect(refuse.status === 3, "the gate refuses a wireframe's report");
mkdirSync(join(TMP, 'ann'), { recursive: true });
run('python3', [join(DSK, 'assign_ids.py'), '--screen', join(DEL, 'orders.html'), '--name', 'orders', '--ledger', join(TMP, 'ids.json'), '--write', '--annotate', join(TMP, 'ann', 'orders.html')]);
const ann = readFileSync(join(TMP, 'ann', 'orders.html'), 'utf8');
expect(/<button class="btn" data-node-id="\d+:\d+">/.test(ann) && !/<(html|head|body)[^>]*data-node-id/.test(ann), 'node ids land on the controls, never on <html>, <head> or <body>');
const asm = run('python3', [join(DSK, 'assemble.py'), '--feature', 'orders', '--version', '1', '--screens', join(TMP, 'ann'), '--report', join(TMP, 'dq', 'report.json'), '--fragments', join(TMP, 'frag'), '--written', join(DEL, 'sections'), '--context', card, '--ids', join(TMP, 'ids.json'), '--out', join(TMP, 'src')]);
expect(asm.status === 0, `assemble.py builds the document's source${asm.status ? ': ' + asm.stderr.trim() : ''}`);
const bun = run('python3', [join(DSK, 'bundle.py'), '--src', join(TMP, 'src'), '--out', join(TMP, 'orders-v1.html'), '--feature', 'orders', '--version', '1', '--ids', join(TMP, 'ids.json'), '--qa-report', join(TMP, 'dq', 'report.json')]);
expect(bun.status === 0, `bundle.py makes one self-contained file${bun.status ? ': ' + (bun.stdout + bun.stderr).trim().split('\n').slice(-1)[0] : ''}`);
const { launch } = await import(pathToFileURL(join(SK, '_shared', 'browser.mjs')).href);
const br = await launch({ install: false });
if (!br.error) {
  const pg = await br.page({ width: 1280, height: 900 });
  await pg.goto(pathToFileURL(join(TMP, 'orders-v1.html')).href);
  await new Promise((r) => setTimeout(r, 600));
  const doc = await pg.evaluate(() => ({ sections: [...document.querySelectorAll('section')].map((s) => s.id), frames: [...document.querySelectorAll('iframe.screen')].map((f) => !!(f.contentDocument && f.contentDocument.querySelector('[data-node-id]') && f.contentDocument.getElementById('rl-hint'))), ids: !!document.getElementById('__ids') }));
  expect(['summary', 'state-screens', 'screens-redlines', 'accessibility', 'acceptance', 'open-questions'].every((s) => doc.sections.includes(s)), `the deliverable has its sections (${doc.sections.join(', ')})`);
  expect(doc.frames.length && doc.frames.every(Boolean), 'each screen sits in its own frame, with its node ids and the redline inspector');
  await br.close();
}

console.log(failed ? `  ${failed} check(s) failed` : '  the design-* skills work on a product that is not Profolio');
process.exit(failed ? 1 : 0);
