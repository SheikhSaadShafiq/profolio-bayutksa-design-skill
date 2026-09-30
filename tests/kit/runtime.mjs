#!/usr/bin/env node
/**
 * The prototype works: the worked example (skill/examples/leads-marketplace), built and driven
 * the way a person uses it:
 * - the rail expands for a moving pointer only, pushes the page aside and shows the new item;
 * - the bell opens the product's notifications, styled, on the design's own 2.0 page;
 * - filter to nothing, clear, buy a lead;
 * - switch the locked-contact option; read the fields the source did not share;
 * - open TruLeads from the rail; open the phone's menu.
 *
 *   node tests/kit/runtime.mjs          exit 1 if an interaction does not do what it should
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { launch } from '../../skill/qa/browser.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SK = join(ROOT, 'skill');
const EX = join(SK, 'examples', 'leads-marketplace');
const OWNERS = JSON.parse(readFileSync(join(EX, 'data.json'), 'utf8')).owner.many;
const built = spawnSync('node', ['qa/prototype.mjs', 'examples/leads-marketplace', '--no-qa'], { cwd: SK, encoding: 'utf8' });
if (![0, 3].includes(built.status)) { console.log(built.stdout + built.stderr); process.exit(1); }

const b = await launch({ install: true, log: console.log });
if (b.error) { console.log(`  no browser — ${b.error}`); process.exit(3); }
const p = await b.page({ width: 1600, height: 1000 });
await p.goto(pathToFileURL(join(EX, 'prototype.html')).href);
for (let t = 0; t < 80 && !(await p.evaluate(() => !!window.__pfp)); t++) await new Promise((r) => setTimeout(r, 250));
await p.evaluate(() => window.__pfp.go('owner', 'web'));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const until = async (fn, ms = 4000) => { for (let t = 0; t < ms; t += 100) { const v = await fn(); if (v) return v; await wait(100); } return fn(); };
/* inside the screen: click what a person would click, read what they would see */
const inFrame = (fn, arg) => p.evaluate(([src, a]) => { const w = document.getElementById('pfp-frame').contentWindow; return new w.Function('w', 'd', 'a', src)(w, w.document, a); }, [fn, arg]);
const click = (sel, text) => inFrame(`const e=[...d.querySelectorAll(a[0])].find(x=>x.offsetParent&&(!a[1]||x.textContent.replace(/\\s+/g,' ').trim().startsWith(a[1]))); if(!e) return 'none'; e.dispatchEvent(new w.MouseEvent('click',{bubbles:true})); return 'ok';`, [sel, text]);
const shown = (text) => inFrame(`return [...d.querySelectorAll('body *')].some(x=>x.offsetParent&&!x.children.length&&x.textContent.trim()===a);`, text);
const seen = (sel) => inFrame(`return [...d.querySelectorAll(a)].some(x=>x.offsetParent);`, sel);
const get = (k) => inFrame('return w.pf.get(a);', k);
/* the product's layer over the screen: whether it is open, what it reported, its document */
const layerOpen = () => inFrame(`return !!d.querySelector('iframe[data-pf-layer]');`);
const lastLayer = () => inFrame(`const l=w.pf.layerLog; return l.length ? JSON.parse(JSON.stringify(l[l.length-1])) : null;`);
const inLayer = (fn, arg) => inFrame(`const f=d.querySelector('iframe[data-pf-layer]'); if(!f||!f.contentDocument) return null; return new f.contentWindow.Function('w','d','a',a[0])(f.contentWindow,f.contentDocument,a[1]);`, [fn, arg]);
const ready = (re) => until(async () => { const l = await lastLayer(); return l && re.test(l.path) && l.info && l.info.type === 'ready' ? l : null; });
/* the design's text nearest the left edge, below the header: an expanded rail must not lie over it */
const leftmost = () => inFrame(`const t=d.createTreeWalker(d.body,4),r=d.createRange();let m=1e9;for(let n=t.nextNode();n;n=t.nextNode()){const e=n.parentElement;if(!n.textContent.trim()||!e||!e.offsetParent||e.closest('.pf-layout-sider,.pf-layout-header,[data-pf-layer],script,style,template'))continue;r.selectNodeContents(n);const b=r.getBoundingClientRect();if(b.width<1||b.top<64||b.top>w.innerHeight)continue;m=Math.min(m,b.left);}return Math.round(m);`);
/* where an element of the screen is on the page, for the real pointer (the screen is scaled to fit) */
const at = (sel) => p.evaluate((s) => { const f = document.getElementById('pfp-frame'), e = f.contentDocument.querySelector(s); if (!e) return null; const fr = f.getBoundingClientRect(), k = fr.width / f.offsetWidth, r = e.getBoundingClientRect(); return { x: fr.left + (r.left + r.width / 2) * k, y: fr.top + (r.top + r.height / 2) * k, k }; }, sel);
const styled = (l) => l.info.texts > 0 && l.info.boxes.some((x) => x.visible && !x.scrim) && !Object.keys(l.info.fonts).some((f) => /^(times( new roman)?|serif)$/i.test(f));

let failed = 0;
const expect = (ok, what) => { console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${what}`); if (!ok) failed++; };

/* the rail: a pointer resting on it at load does nothing; a moving one expands it over a pushed page */
const home = await leftmost();
await inFrame(`d.querySelector('.pf-layout-sider').dispatchEvent(new w.PointerEvent('pointerover',{bubbles:true})); return 1;`); await wait(500);
expect(!(await layerOpen()), 'a pointer resting on the rail at load does not expand it');
expect(await inFrame(`const li=d.querySelector('.pf-layout-sider [data-menu-id$="-leads-marketplace"]'); return !!li && li.classList.contains('pf-menu-item-selected') && li.previousElementSibling.matches('[data-menu-id$="-leads"]');`), 'the page\'s rail has Leads Marketplace after TruLeads, selected');
const item = await at('.pf-layout-sider li[data-menu-id$="-leads"]');
await p.mouse.move(item.x + 300 * item.k, item.y); await p.mouse.move(item.x, item.y, { steps: 6 });
const rail = await ready(/rail-expanded/);
expect(!!rail && styled(rail), 'a moving pointer on the rail expands it, styled');
const box = rail && rail.info.boxes.find((x) => !x.scrim);
expect(!!box && (await leftmost()) >= box.x + box.w - 2, `the expanded rail pushes the page aside (text from ${home}px to ${await leftmost()}px, rail ends at ${box ? Math.round(box.x + box.w) : '?'}px)`);
expect(JSON.stringify(await inLayer(`const li=d.querySelector('[data-menu-id$="-leads-marketplace"]'); return li && [li.previousElementSibling.matches('[data-menu-id$="-leads"]'), li.classList.contains('pf-menu-item-selected'), li.textContent.replace(/\\s+/g,' ').trim()];`)) === '[true,true,"Leads Marketplace"]', 'the expanded rail shows Leads Marketplace after TruLeads, selected');
await p.mouse.move(item.x + 600 * item.k, item.y + 200 * item.k, { steps: 4 }); await until(async () => !(await layerOpen()), 2000);
expect(!(await layerOpen()) && (await leftmost()) === home, 'moving off the rail closes it and the page returns');

/* the bell, on the design's own 2.0 page: the product's notifications, in its own styles */
await click('[data-pf-go*="popover-notifications"]');
const bell = await ready(/popover-notifications/);
expect(!!bell && styled(bell) && (await inLayer(`return /Notifications/.test(d.body.innerText);`)), 'the bell opens the product\'s notifications, visible and styled');
await inLayer(`d.body.dispatchEvent(new w.MouseEvent('click',{bubbles:true})); return 1;`); await wait(300);
expect(!(await layerOpen()), 'clicking outside the notifications closes them');

await click('[data-pf-menu="city"]'); await wait(150);
await click('[data-pf-menu-panel="city"] .pfk-menu__item', 'Abha'); await wait(200);
expect(await shown('No leads match these filters'), 'a city with no leads shows the no-results state');
await click('.pfk-btn', 'Clear filters'); await wait(200);
expect((await get('count.owner')) === OWNERS.length, `Clear filters brings every lead back (${OWNERS.length})`);
await click('.pfk-btn', 'Buy for 40 Credits'); await wait(200);
expect((await get('overlay')) === 'buy', 'Buy opens the buy dialog');
const id = await get('lead'), who = OWNERS.find((r) => r.id === id);
await click('[data-pf-overlay="buy"] .pfk-btn', 'Buy for 40 Credits'); await wait(1900);
expect((await get('balance')) === 72840, 'buying deducts the price from the balance (72,880 → 72,840)');
expect(!!who && (await shown(who.name)), `the bought row unblurs to the contact (${who ? who.name : id})`);
expect(await inFrame(`return !!d.querySelector('.pfk-toast');`), 'a toast confirms it');

/* the locked contact: each option in the player changes the contact cell */
for (const [v, sel, what] of [['mask', '.pfk-masked', 'B masks the name and phone'], ['avatar', '.pfk-avatar', 'C shows initials and a lock'], ['blur', '.pfk-teaser', 'A blurs the contact behind a lock chip']]) {
  await p.evaluate((x) => document.querySelector(`#pfp-options [data-option="opt.lock"][data-value="${x}"]`).click(), v); await wait(300);
  const pressed = await p.evaluate(() => { const e = document.querySelector('#pfp-options [aria-pressed="true"]'); return e && e.getAttribute('data-value'); });
  expect((await seen(`[data-pf-item] ${sel}`)) && pressed === v, `option ${what}`);
}

/* fields the source did not share: a fallback, never a blank or "undefined" */
expect(await shown('Not shared'), 'a lead without rooms or a price says "Not shared"');
expect(!(await inFrame(`return [...d.querySelectorAll('[data-pf-item] *')].some(e=>e.offsetParent&&!e.children.length&&/^(undefined|null|NaN)$/.test(e.textContent.trim()));`)), 'no row shows "undefined", "null" or "NaN"');

await p.evaluate(() => window.__pfp.go('insufficient'));
expect((await get('overlay')) === 'insufficient', 'a low balance opens Not Enough Credits instead');
await click('li[data-menu-id$="-leads"]'); await wait(1500);
expect(await inFrame(`return /TruLeads/.test(d.title + d.body.textContent.slice(0, 4000));`), 'the rail opens TruLeads (its compiled page)');
expect(!(await inFrame('return w.pf.errors.length;')), 'the runtime reported no error');

/* the phone: the menu opens the product's drawer, with the new item */
await p.evaluate(() => window.__pfp.go('owner', 'phone'));
expect(await shown('Rooms not shared'), 'the phone card says "Rooms not shared" for a lead without them');
await click('[data-pf-go*="mobile-menu"]');
const menu = await ready(/mobile-menu/);
expect(!!menu && styled(menu), 'the phone\'s menu opens the product\'s drawer, styled');
expect(!!(await inLayer(`return !!d.querySelector('[data-menu-id$="-leads-marketplace"]');`)), 'the phone\'s menu has Leads Marketplace');
expect(!(await inFrame('return w.pf.errors.length;')), 'the runtime reported no error on the phone');
await b.close();
console.log(failed ? `  ${failed} interaction(s) failed` : '  every interaction works');
process.exit(failed ? 1 : 0);
