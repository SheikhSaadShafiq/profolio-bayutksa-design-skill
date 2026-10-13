#!/usr/bin/env node
/**
 * The rail is the product's, and a design changes it only through flow.json shell.rail.
 *
 * Feedback on a real prototype (2026-10-12): to add "Agency Report" under Reports, it drew its
 * own left nav — expanded for good, with no collapsed rail, its buttons in the browser's default
 * style. This builds that screen twice from the compiled pages/reports-summary.html and runs the
 * whole QA (qa/prototype.mjs --shots):
 *   - good: the compiled rail as it is, and shell.rail adding Agency Report (NEW) under Reports.
 *     No `rail` or `unstyled` issue; the sweep opens the Reports group, and Agency Report shows
 *     in it, with the product's NEW chip;
 *   - bad: the rail replaced by a hand-built, expanded navigation. It fails with `rail` and
 *     `unstyled`.
 * A bare fixture fails static checks it does not set out to meet (no matrix, styles of its own):
 * only these two checks and the sweep are judged.
 *
 *   node tests/kit/rail-catches.mjs          exit 1 if a broken rail passes or a good one fails
 */
import { writeFileSync, readFileSync, mkdirSync, rmSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SK = join(ROOT, 'skill');
const BASE = 'pages/reports-summary.html';
if (!existsSync(join(SK, BASE)) || !existsSync(join(SK, 'pages/reports-summary/rail-expanded-reports.html'))) {
  const f = spawnSync('python3', ['qa/fetch.py', 'reports-summary', 'rail-expanded', 'rail-expanded-reports'], { cwd: SK, encoding: 'utf8' });
  if (f.status) { console.log(f.stdout + f.stderr); process.exit(2); }
}

/* a design screen from the compiled page, as HOW A HI-FI IS MADE says: pf-base, links two up, kit.css, no scripts */
const screen = (rail) => {
  let h = readFileSync(join(SK, BASE), 'utf8')
    .replace(/<meta name="pf-compiled"[^>]*>/, `<meta name="pf-base" content="${BASE}">`)
    .replace(/<script\b(?![^>]*application\/json)[^>]*>[\s\S]*?<\/script>/g, '')
    .replace(/(href|src)="\.\.\//g, '$1="../../')
    .replace('</head>', '<link rel="stylesheet" href="../../kit/kit.css"><script type="application/json" id="pf-state">{}</script></head>');
  if (rail) {
    const a = h.indexOf('<aside'), b = h.indexOf('</aside>', a) + '</aside>'.length;
    h = h.slice(0, a) + rail + h.slice(b);
  }
  return h;
};
/* the feedback's navigation, by hand: expanded, a submenu written out, the browser's own buttons */
const HAND = `<aside class="pf-layout-sider" style="position:fixed;left:0;top:60px;bottom:0;width:248px;background:#fff">
<button type="button">&lt;</button>
<ul>${['Overview', 'Post Listing', 'My Listings', 'Credits Usage', 'TruLeads', 'Agent Performance'].map((x) => `<li>${x}</li>`).join('')}
<li>Reports<ul><li>Summary</li><li>Listing Report</li><li>Leads &amp; Reach Report</li><li>Agency Report <span>NEW</span></li></ul></li>
${['Agency Staff', 'Settings', 'Credits &amp; Packages'].map((x) => `<li>${x}</li>`).join('')}</ul>
<button type="button">العربية</button><button type="button">Help &amp; Support</button></aside>`;

const flow = (name) => ({
  name, title: 'Agency Report', platforms: ['web'], start: 'report', pages: 'none',
  screens: [{ id: 'report', title: 'Agency Report', web: 'report.html' }],
  states: [{ id: 'report', title: 'Agency Report', set: {} }],
  shell: { rail: { add: [{ key: 'agency-report', label: 'Agency Report', under: 'reports', after: 'leads-reports', page: 'report', tag: 'NEW' }], selected: 'agency-report' } },
});

let failed = 0;
const expect = (ok, what) => { console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${what}`); if (!ok) failed++; };

/* first, the product's own navigation as compiled, on every page that draws it: the rail
   collapsed at 60 px, expanded at 220, the Reports group open with its three children uncut, the
   phone's menu likewise, and no control in the browser's default style */
{
  const { launch } = await import('../../skill/qa/browser.mjs');
  const b = await launch({ install: false });
  if (b.error) { console.log('  no browser — the QA did not run'); process.exit(3); }
  const REG = JSON.parse(readFileSync(join(SK, 'registry.json'), 'utf8'));
  const pages = Object.entries(REG.pages).filter(([, p]) => (p.states || []).some((s) => s.startsWith('rail-expanded-reports'))).map(([id]) => id);
  const MEASURE = () => {
    const s = document.querySelector('.pf-layout-sider');
    const range = document.createRange(), cut = [], kids = [];
    if (s) for (const li of s.querySelectorAll('li[data-menu-id], .pf-menu-submenu-title')) {
      const r = li.getBoundingClientRect(); if (r.width < 4 || r.height < 4 || getComputedStyle(li).visibility !== 'visible') continue;
      let right = 0; const w = document.createTreeWalker(li, NodeFilter.SHOW_TEXT);
      for (let t = w.nextNode(); t; t = w.nextNode()) { if (!t.textContent.trim()) continue; range.selectNodeContents(t); right = Math.max(right, range.getBoundingClientRect().right); }
      if (right > Math.min(r.right, s.getBoundingClientRect().right) + 1) cut.push(li.textContent.trim());
      if (li.closest('ul.pf-menu-sub')) kids.push(li.textContent.trim());
    }
    const ua = [...document.querySelectorAll('button, select, input[type=button], input[type=submit]')].filter((x) => x.getBoundingClientRect().width > 0 && /outset|inset/.test(getComputedStyle(x).borderTopStyle)).map((x) => x.textContent.trim());
    return { w: s ? Math.round(s.getBoundingClientRect().width) : null, cut, kids, ua };
  };
  const at = async (pg, file, size) => { pg = pg || await b.page(size); await pg.goto(pathToFileURL(join(SK, 'pages', file)).href); await new Promise((r) => setTimeout(r, 300)); return [pg, await pg.evaluate(MEASURE)]; };
  const bad = { collapsed: [], expanded: [], group: [], phone: [], cut: [], ua: [] };
  let web = null, phone = null, r;
  for (const id of pages) {
    [web, r] = await at(web, `${id}.html`, { width: 1440, height: 900 }); if (r.w !== 60) bad.collapsed.push(`${id} ${r.w}`); bad.ua.push(...r.ua.map((x) => `${id}: ${x}`));
    [web, r] = await at(web, `${id}/rail-expanded.html`); if (r.w !== 220) bad.expanded.push(`${id} ${r.w}`); bad.cut.push(...r.cut.map((x) => `${id} expanded: ${x}`));
    [web, r] = await at(web, `${id}/rail-expanded-reports.html`); if (r.w !== 220 || r.kids.length !== 3) bad.group.push(`${id} ${r.w}px, ${r.kids.length} children`); bad.cut.push(...r.cut.map((x) => `${id} group: ${x}`));
    if (existsSync(join(SK, 'pages', id, 'mobile-menu-reports.mobile.html'))) {
      [phone, r] = await at(phone, `${id}/mobile-menu-reports.mobile.html`, { width: 375, height: 812 }); if (r.kids.length !== 3) bad.phone.push(`${id} ${r.kids.length} children`); bad.cut.push(...r.cut.map((x) => `${id} phone: ${x}`));
    } else bad.phone.push(`${id}: no mobile-menu-reports`);
  }
  await b.close();
  const say = (a) => (a.length ? ': ' + a.slice(0, 4).join(' · ') : '');
  expect(pages.length >= 20, `the product's rail, compiled on ${pages.length} pages`);
  expect(!bad.collapsed.length, `collapsed at 60 px when a page opens${say(bad.collapsed)}`);
  expect(!bad.expanded.length, `expanded at 220 px${say(bad.expanded)}`);
  expect(!bad.group.length, `the Reports group opens with its 3 children (rail-expanded-reports)${say(bad.group)}`);
  expect(!bad.phone.length, `the phone's menu opens it too (mobile-menu-reports)${say(bad.phone)}`);
  expect(!bad.cut.length, `no label is cut off${say(bad.cut)}`);
  expect(!bad.ua.length, `no control in the browser's default style${say(bad.ua)}`);
}

const run = (name, rail) => {
  const dir = join(SK, 'designs', `_test-${name}`);
  rmSync(dir, { recursive: true, force: true }); mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'flow.json'), JSON.stringify(flow(name)));
  writeFileSync(join(dir, 'report.html'), screen(rail));
  const r = spawnSync('node', ['qa/prototype.mjs', `designs/_test-${name}`, '--shots'], { cwd: SK, encoding: 'utf8' });
  if (r.status === 3) { console.log('  no browser — the QA did not run'); process.exit(3); }
  let rep = { issues: [] };
  try { rep = JSON.parse(readFileSync(join(dir, 'qa', 'prototype.json'), 'utf8')); } catch { /* no report */ }
  const shots = existsSync(join(dir, 'qa', 'shots')) ? readdirSync(join(dir, 'qa', 'shots')) : [];
  return { dir, rep, shots, of: (c) => (rep.issues || []).filter((i) => i.check === c && i.level === 'error') };
};

const good = run('rail-good', null);
expect(!good.of('rail').length, `the compiled rail with shell.rail passes \`rail\`${good.of('rail').length ? ': ' + good.of('rail')[0].message : ''}`);
expect(!good.of('unstyled').length, `nothing is unstyled${good.of('unstyled').length ? ': ' + good.of('unstyled')[0].message : ''}`);
expect(!good.of('overflow').length && !good.of('shell').length, `the expanded rail and the open group push the page aside, and it does not scroll sideways${[...good.of('overflow'), ...good.of('shell')].length ? ': ' + [...good.of('overflow'), ...good.of('shell')][0].message : ''}`);
expect(good.shots.some((f) => /-group\.web\.png$/.test(f)), `the sweep opened the Reports group (${good.rep.coverage || 'no coverage'})`);
expect(existsSync(join(good.dir, 'prototype.html')) && /rail-expanded-reports/.test(readFileSync(join(good.dir, 'prototype.html'), 'utf8')), 'the prototype holds the open group (pages/reports-summary/rail-expanded-reports.html)');
expect(!(good.rep.issues || []).some((i) => i.check === 'rail' && /icon draws nothing/.test(i.message)), 'every rail icon draws in the expanded rail and the open group (Post Listing\'s clip path is the header\'s)');

const bad = run('rail-bad', HAND);
expect(bad.of('rail').some((i) => /248 px wide/.test(i.message)), 'a hand-built, expanded rail fails `rail` (248 px wide when the screen opens)');
expect(bad.of('rail').some((i) => /lost item/.test(i.message)), 'its items are not the product\'s: `rail` names the ones it lost');
expect(bad.of('unstyled').some((i) => /Help & Support/.test(i.message)), 'its buttons in the browser\'s default style fail `unstyled`');

if (!process.argv.includes('--keep')) for (const n of ['rail-good', 'rail-bad']) rmSync(join(SK, 'designs', `_test-${n}`), { recursive: true, force: true });
console.log(failed ? `  ${failed} check(s) failed` : '  the QA holds the rail to the product\'s, and shell.rail adds to a group');
process.exit(failed ? 1 : 0);
