#!/usr/bin/env node
/**
 * The Design QA catches what went wrong in the Leads Marketplace test (2026-09-30) and passes
 * what the kit draws. Each fixture is a small page. The first holds one defect per check; the
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
  </div>`);

/* the kit's table: aligned by construction */
const GOOD = page('good', `
  <div class="pfk-table" style="--pfk-cols: minmax(0,1.3fr) minmax(0,1fr) minmax(0,1fr) 200px;width:1100px;margin:20px">
    <div class="pfk-thead"><div class="pfk-th">Contact</div><div class="pfk-th">Price</div><div class="pfk-th">Location</div><div class="pfk-th pfk-th--end">Actions</div></div>
    ${[1, 2, 3].map((i) => `<div class="pfk-tr"><div class="pfk-td"><span class="pfk-value">Lead ${i}</span></div>
      <div class="pfk-td"><span class="pfk-amount pfk-value--strong"><i class="pfk-riyal" aria-label="SAR"></i><span>1,${i}00,000</span></span></div>
      <div class="pfk-td"><span class="pfk-value">Riyadh</span></div>
      <div class="pfk-td pfk-td--end"><button class="pfk-btn${i === 2 ? ' pfk-btn--soft' : ''}" data-pf-do="x"><span>${i === 2 ? 'View in TruLeads →' : 'Buy for 40 Credits'}</span></button></div></div>`).join('')}
  </div>`);

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
const good = await run(GOOD);
const gerr = good.issues.filter((i) => i.level === 'error' && i.check !== 'fonts');
expect(!gerr.length, `the kit's table passes (${gerr.map((i) => i.check + ': ' + i.message).join(' | ') || 'no errors'})`);
await b.close();
console.log(failed ? `  ${failed} check(s) failed` : '  the Design QA sees every defect and passes the kit');
process.exit(failed ? 1 : 0);
