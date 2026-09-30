#!/usr/bin/env node
/**
 * The prototype works: the worked example (skill/examples/leads-marketplace), built and driven
 * the way a person uses it — filter to nothing, clear, buy a lead, open TruLeads from the rail,
 * open the bell's notifications.
 *
 *   node tests/kit/runtime.mjs          exit 1 if an interaction does not do what it should
 */
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { launch } from '../../skill/qa/browser.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SK = join(ROOT, 'skill');
const built = spawnSync('node', ['qa/prototype.mjs', 'examples/leads-marketplace', '--no-qa'], { cwd: SK, encoding: 'utf8' });
if (![0, 3].includes(built.status)) { console.log(built.stdout + built.stderr); process.exit(1); }

const b = await launch({ install: true, log: console.log });
if (b.error) { console.log(`  no browser — ${b.error}`); process.exit(3); }
const p = await b.page({ width: 1600, height: 1000 });
await p.goto(pathToFileURL(join(SK, 'examples', 'leads-marketplace', 'prototype.html')).href);
for (let t = 0; t < 80 && !(await p.evaluate(() => !!window.__pfp)); t++) await new Promise((r) => setTimeout(r, 250));
await p.evaluate(() => window.__pfp.go('owner', 'web'));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
/* inside the screen: click what a person would click, read what they would see */
const inFrame = (fn, arg) => p.evaluate(([src, a]) => { const w = document.getElementById('pfp-frame').contentWindow; return new w.Function('w', 'd', 'a', src)(w, w.document, a); }, [fn, arg]);
const click = (sel, text) => inFrame(`const e=[...d.querySelectorAll(a[0])].find(x=>x.offsetParent&&(!a[1]||x.textContent.replace(/\\s+/g,' ').trim().startsWith(a[1]))); if(!e) return 'none'; e.dispatchEvent(new w.MouseEvent('click',{bubbles:true})); return 'ok';`, [sel, text]);
const shown = (text) => inFrame(`return [...d.querySelectorAll('body *')].some(x=>x.offsetParent&&!x.children.length&&x.textContent.trim()===a);`, text);
const get = (k) => inFrame('return w.pf.get(a);', k);

let failed = 0;
const expect = (ok, what) => { console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${what}`); if (!ok) failed++; };

await click('[data-pf-menu="city"]'); await wait(150);
await click('[data-pf-menu-panel="city"] .pfk-menu__item', 'Abha'); await wait(200);
expect(await shown('No leads match these filters'), 'a city with no leads shows the no-results state');
await click('.pfk-btn', 'Clear filters'); await wait(200);
expect((await get('count.owner')) === 8, 'Clear filters brings every lead back');
await click('.pfk-btn', 'Buy for 40 Credits'); await wait(200);
expect((await get('overlay')) === 'buy', 'Buy opens the buy dialog');
await click('[data-pf-overlay="buy"] .pfk-btn', 'Buy for 40 Credits'); await wait(1900);
expect((await get('balance')) === 72840, 'buying deducts the price from the balance (72,880 → 72,840)');
expect(await shown('Abdulrahman Al-Zahrani'), 'the bought row unblurs to the contact');
expect(await inFrame(`return !!d.querySelector('.pfk-toast');`), 'a toast confirms it');
await p.evaluate(() => window.__pfp.go('insufficient'));
expect((await get('overlay')) === 'insufficient', 'a low balance opens Not Enough Credits instead');
await click('li[data-menu-id$="-leads"]'); await wait(1500);
expect(await inFrame(`return /TruLeads/.test(d.title + d.body.textContent.slice(0, 4000));`), 'the rail opens TruLeads (its compiled page)');
await click('[data-pf-go*="popover-notifications"]'); await wait(800);
expect(await inFrame(`return [...d.querySelectorAll('[data-pf-shell-open]')].some(e=>/Notifications/.test(e.textContent));`), 'the bell opens the product\'s notifications over it');
expect(!(await inFrame('return w.pf.errors.length;')), 'the runtime reported no error');
await b.close();
console.log(failed ? `  ${failed} interaction(s) failed` : '  every interaction works');
process.exit(failed ? 1 : 0);
