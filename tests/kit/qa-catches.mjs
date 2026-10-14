#!/usr/bin/env node
/**
 * The Design QA catches what went wrong in the Leads Marketplace test (2026-09-30) and passes
 * what the kit draws (and, since v2.4, what the cold tests' directions got wrong: faint text, a
 * squeezed message, a covered button). Each fixture is a small page. The first holds one defect per check; the
 * second is a clean kit table. qa.js runs in a headless browser (skill/qa/browser.mjs).
 *
 *   node tests/kit/qa-catches.mjs          exit 1 if a defect goes unseen or the clean page fails
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';
import { launch } from '../../skill/qa/browser.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const KIT = (f) => readFileSync(join(ROOT, 'skill', 'kit', f), 'utf8');
const TMP = join(tmpdir(), 'pf-kit-tests');
mkdirSync(TMP, { recursive: true });
const page = (name, body, css = '') => { const f = join(TMP, name + '.html'); writeFileSync(f, `<!doctype html><html><head><meta charset="utf-8"><style>${KIT('kit.css')}${css}</style></head><body style="margin:0;font:14px system-ui">${body}</body></html>`); return pathToFileURL(f).href; };

/* one of each defect, the way the old prototype had them */
const BAD = page('bad', `
  <div style="width:1200px;margin:20px">
    <div style="display:grid;grid-template-columns:300px 300px 300px 300px;background:#f5f5f5">
      <div style="padding:12px 0 12px 16px">Contact</div><div style="padding:12px 0 12px 12px">Price</div><div style="padding:12px 0 12px 12px">Location</div><div style="padding:12px">Action</div>
    </div>
    ${[1, 2, 3].map((i) => `<div style="display:grid;grid-template-columns:300px 300px 300px 300px;align-items:center;padding:16px 0">
      <div style="padding:0 16px">Lead ${i}</div><div>1,${i}00,000</div><div>Riyadh</div>
      <div><span style="display:inline-flex;align-items:center;padding:0 16px;height:${i === 2 ? 17 : 42}px;background:#28B16D;color:#fff;cursor:pointer">${i === 2 ? 'View in TruLeads' : 'Buy lead'}</span></div></div>`).join('')}
  </div>
  <button style="display:inline-flex;gap:6px;height:40px;cursor:pointer" data-pf-do="x">Buy for <span>40</span> credits</button>
  <div style="cursor:pointer;padding:10px;background:#eee;display:inline-block">Select City</div>
  <p>Price: SAR 2,450,000</p>
  <svg width="11" height="12" viewBox="0 0 11 12"><path d="M7.9 0 9.9 0 8.8 7.2 6.8 7.6Z"></path></svg>
  <div style="width:1200px;margin:20px">
    <div style="display:grid;grid-template-columns:repeat(6,200px);background:#f5f5f5"><div>Contact</div><div>Property</div><div>Price</div><div>Beds</div><div>Location</div><div>Action</div></div>
    ${[1, 2].map(() => `<div style="display:flex;gap:30px;padding:16px">${[90, 150, 60, 130, 70].map((w) => `<div style="width:${w}px;height:14px;background:#efefef"></div>`).join('')}</div>`).join('')}
  </div>
  <div data-pf-item style="display:flex;gap:12px;margin:20px"><span data-pf-text="$.district"></span><span data-pf-text="$.beds">undefined</span></div>
  <div style="position:relative;height:24px;margin:20px;font:14px/20px monospace"><span style="position:absolute;left:0;top:0">Al Malqa, Riyadh</span><span style="position:absolute;left:9.6ch;top:0">4 Beds · 5 Baths</span></div>
  <div class="pfx-band" style="background:#fff;margin:20px;padding:8px"><span style="color:#c8c8c8">Spend is up this week</span></div>
  <div style="background:#fff;margin:20px;padding:8px"><span style="color:#b0b0b0">Last synced an hour ago</span></div>
  <div style="width:70px;margin:20px;font:14px/20px system-ui">Your credits were topped up today</div>
  <div style="position:relative;margin:20px;width:300px;height:48px"><button data-pf-do="x" style="height:40px;padding:0 16px">Pay now</button><div style="position:absolute;inset:0;background:rgba(255,255,255,.92)">Processing your card</div></div>`);

/* the kit's table: aligned by construction; a hidden empty field; a text that wraps beside another */
const GOOD = page('good', `
  <div class="pfk-table" style="--pfk-cols: minmax(0,1.3fr) minmax(0,1fr) minmax(0,1fr) 200px;width:1100px;margin:20px">
    <div class="pfk-thead"><div class="pfk-th">Contact</div><div class="pfk-th">Price</div><div class="pfk-th">Location</div><div class="pfk-th pfk-th--end">Actions</div></div>
    ${[1, 2, 3].map((i) => `<div class="pfk-tr"><div class="pfk-td"><span class="pfk-value">Lead ${i}</span></div>
      <div class="pfk-td"><span class="pfk-amount pfk-value--strong"><i class="pfk-riyal" aria-label="SAR"></i><span>1,${i}00,000</span></span></div>
      <div class="pfk-td"><span class="pfk-value">Riyadh</span></div>
      <div class="pfk-td pfk-td--end"><button class="pfk-btn${i === 2 ? ' pfk-btn--soft' : ''}" data-pf-do="x"><span>${i === 2 ? 'View in TruLeads →' : 'Buy for 40 Credits'}</span></button></div></div>`).join('')}
  </div>
  <div data-pf-item style="margin:20px"><span data-pf-text="$.city">Riyadh</span><span data-pf-text="$.district" style="display:none"></span></div>
  <p style="width:260px;margin:20px;font:14px/20px monospace"><span>Riyadh, Al Malqa district, north of the ring road</span> <b>Villa</b></p>`);

/* the kit's visual elements (v2.4), as a direction draws them: they pass the QA as they are */
const ELEMENTS = page('elements', `
  <div style="width:1200px;margin:20px;display:flex;flex-direction:column;gap:16px">
    <div class="pfk-band"><span class="pfk-band__text">5 new leads match your listings today</span><button class="pfk-btn pfk-btn--secondary" data-pf-do="x"><span>See them</span></button></div>
    <div class="pfk-stats">${['New today', 'Exact matches', 'Last slot'].map((l, i) => `<button class="pfk-stat" data-pf-do="x"><span class="pfk-stat__value">${i + 2}</span><span class="pfk-stat__label">${l}</span><span class="pfk-delta pfk-delta--${i ? 'down' : 'up'}">${i ? '−1' : '+2'} since yesterday</span></button>`).join('')}</div>
    <div class="pfk-split"><div class="pfk-grid" style="--pfk-min: 300px">${[1, 2, 3, 4].map((i) => `<article class="pfk-tile">
      <div class="pfk-tile__head"><div class="pfk-ring"><span class="pfk-ring__value">${60 + i * 8}</span></div><div class="pfk-grow"><p class="pfk-tile__title">Villa in Al Malqa</p><p class="pfk-tile__meta">Wanted · Buy · added ${i} hours ago</p></div></div>
      <div class="pfk-tile__figure">2,450,000</div>
      <div class="pfk-ichips"><span class="pfk-ichip pfk-ichip--good">3 exact matches</span><span class="pfk-ichip">5 beds</span><span class="pfk-ichip pfk-ichip--warn">1 slot left</span></div>
      <div class="pfk-row"><span class="pfk-meter"><span class="pfk-meter__seg pfk-meter__seg--on"></span><span class="pfk-meter__seg pfk-meter__seg--on"></span><span class="pfk-meter__seg"></span></span><span class="pfk-tile__meta">2 of 3 agencies</span></div>
      <div class="pfk-tile__foot"><span class="pfk-avatars"><span class="pfk-avatar">NH</span><span class="pfk-avatar">RS</span><span class="pfk-avatars__more">+1</span></span><button class="pfk-btn" data-pf-do="x"><span>Unlock</span></button></div>
    </article>`).join('')}</div>
    <aside class="pfk-split__side"><div class="pfk-tile"><p class="pfk-tile__title">Your matching listings</p><div class="pfk-bar" style="--pfk-value: 60"></div><ol class="pfk-steps"><li><span class="pfk-steps__dot pfk-steps__dot--done">1</span><span>Unlock the lead</span></li><li><span class="pfk-steps__dot">2</span><span>Call within a day</span></li></ol></div></aside></div>
  </div>`);
/* a phone: a link-sized button is too small to tap; a link inside a sentence is not a target of its own */
const TAPS = page('taps', `<div style="padding:16px;font:14px/20px system-ui"><button data-pf-do="x" style="all:unset;font-size:12px;line-height:16px;cursor:pointer">3 exact · 2 near</button>
  <p>Leads stay for 90 days. <a href="#x">Learn how unlocking works</a> before you spend credits on one.</p></div>`);

const b = await launch({ install: true, log: console.log });
if (b.error) { console.log(`  no browser — ${b.error}`); process.exit(3); }
const p = await b.page({ width: 1440, height: 900 });
const run = async (url) => { await p.goto(url); return p.evaluate((src) => { const s = document.createElement('script'); s.textContent = src; document.head.appendChild(s); return window.pfQA({}); }, KIT('qa.js')); };

let failed = 0;
const expect = (ok, what) => { console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${what}`); if (!ok) failed++; };
const bad = await run(BAD);
const has = (check, re) => bad.issues.some((i) => i.check === check && (!re || re.test(i.message)));
expect(has('align', /“Price” sits 12 px right/), 'align: a header 12 px right of its column');
expect(has('controls', /View in TruLeads.*17 px tall; the other buttons in its column are 42 px/), 'controls: a squashed button among 42 px ones');
expect(has('spacing', /3 flex items/), 'spacing: a label split into flex items');
expect(has('dead', /Select City/), 'dead: a clickable box that does nothing');
expect(has('currency', /SAR/), 'currency: an amount written with SAR');
expect(has('currency', /sketch/), 'currency: the 2.0 handover\'s rough riyal');
expect(has('skeleton', /does not follow/), 'skeleton: blocks that do not follow the columns');
expect(has('blank', /“district” shows nothing/), 'blank: a field the data lacks renders nothing');
expect(has('blank', /renders as “undefined”/), 'blank: a field renders as “undefined”');
expect(has('overlap', /Al Malqa, Riyadh.*overlaps.*4 Beds/), 'overlap: two texts drawn over each other');
const lvl = (check, re) => (bad.issues.find((i) => i.check === check && re.test(i.message)) || {}).level;
expect(lvl('contrast', /Spend is up this week/) === 'error', 'contrast: faint text in a direction\'s own pattern (pfx-*) is an error');
expect(lvl('contrast', /Last synced/) === 'warn', 'contrast: faint text in the product\'s palette is a warning, for the designer');
expect(has('squeezed', /Your credits were topped up today/), 'squeezed: a message wrapped a word or two per line');
expect(has('covered', /Pay now.*covered by/), 'covered: a button under another element cannot be clicked');
const good = await run(GOOD);
const gerr = good.issues.filter((i) => i.level === 'error' && i.check !== 'fonts');
expect(!gerr.length, `the kit's table passes (${gerr.map((i) => i.check + ': ' + i.message).join(' | ') || 'no errors'})`);
const el = await run(ELEMENTS);
const eerr = el.issues.filter((i) => i.level === 'error' && i.check !== 'fonts');
expect(!eerr.length, `the kit's visual elements pass (${eerr.map((i) => i.check + ': ' + i.message).join(' | ').slice(0, 300) || 'no errors'})`);
const ph = await b.page({ width: 375, height: 812 });
await ph.goto(TAPS);
const taps = await ph.evaluate((src) => { const s = document.createElement('script'); s.textContent = src; document.head.appendChild(s); return window.pfQA({}); }, KIT('qa.js'));
expect(taps.issues.some((i) => i.check === 'targets' && i.level === 'error' && /3 exact · 2 near.*under 24 px/.test(i.message)) && !taps.issues.some((i) => i.check === 'targets' && /Learn how/.test(i.message)), 'targets: a link-sized button on a phone is an error; a link in a sentence is exempt');
await b.close();
console.log(failed ? `  ${failed} check(s) failed` : '  the Design QA sees every defect and passes the kit');
process.exit(failed ? 1 : 0);
