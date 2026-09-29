#!/usr/bin/env node
/**
 * Write deliverables/prototype.js — page-to-page navigation for the compiled
 * site.
 *
 * WHY: the product navigates with click HANDLERS, not links. A rail item is an
 * <li role="menuitem"> whose onClick calls react-router's navigate(); a
 * settings tab is an <a> with no href. Frozen into static HTML, none of them
 * goes anywhere — the compiled pages looked like the product and could not be
 * walked through like it. compile.mjs already wires every trigger that opens a
 * STATE (data-pf-go); this wires every click that goes to another SCREEN.
 *
 * It is resolved at click time, from three tables, so adding a page never
 * means recompiling the others:
 *
 *   ROUTES   product route → compiled file (scripts/pages-list.mjs ALL)
 *   MENU     a rail item's key (its data-menu-id) → route. Read off the rail
 *            itself, then filled in from the product's own
 *            src/tenant/common/menuList/menuList.js
 *   LABELS   every control harness/explore.mjs clicked and saw CHANGE THE URL
 *            (data/states/*.json links) → where it went. Labels that name
 *            nothing (an icon, a number, a listing's id) are left out.
 *
 * A destination that is not compiled says so in a toast instead of doing
 * nothing, so a reviewer knows it is a gap and not a dead control.
 *
 *   node scripts/ds/prototype.mjs
 */
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ALL } from '../pages-list.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const REPO = join(ROOT, '..', process.env.PROFOLIO_REPO || 'profolio-reactjs');
const norm = (p) => (p || '').replace(/^https?:\/\/[^/]+/, '').replace(/^\/(en|ar)(?=\/|$)/, '').replace(/[?#].*$/, '').replace(/\/$/, '') || '/dashboard';

/* ── ROUTES, per layout: a phone page goes to phone pages ─────────────── */
const ROUTES = {}, ROUTES_M = {};
for (const [slug, route] of Object.entries(ALL)) {
  /* keyed as a link is looked up: the path alone (/checkout?cart_id=… is /checkout) */
  if (existsSync(join(ROOT, 'deliverables', `${slug}.html`))) ROUTES[norm(route)] ||= `${slug}.html`;
  if (existsSync(join(ROOT, 'deliverables', 'mobile', `${slug}.html`))) ROUTES_M[norm(route)] ||= `${slug}.html`;
}
/* ── every compiled file, by layout: for the web ↔ phone switch and the flows ── */
const filesIn = (rel) => (existsSync(join(ROOT, 'deliverables', rel)) ? readdirSync(join(ROOT, 'deliverables', rel)).filter((f) => f.endsWith('.html')).map((f) => f.replace(/\.html$/, '')) : []);
const FILES = { web: [...filesIn('').filter((n) => ALL[n]), ...filesIn('states')], mobile: [...filesIn('mobile'), ...filesIn('mobile/states')] };
/* flows: states named <page>--flow-<flow>-<nn>-<what>, in order, per layout */
const FLOWS = { web: {}, mobile: {} };
for (const dev of ['web', 'mobile']) {
  for (const n of FILES[dev]) {
    const m = n.match(/^([a-z0-9-]+)--flow-([a-z0-9]+(?:-[a-z0-9]+)*?)-(\d{2})-/);
    if (m) (FLOWS[dev][m[2]] ||= []).push([Number(m[3]), n]);
  }
  for (const k of Object.keys(FLOWS[dev])) FLOWS[dev][k] = FLOWS[dev][k].sort((a, b) => a[0] - b[0]).map(([, n]) => n);
}

/* ── LABELS, from what the explorer saw navigate ──────────────────────── */
const LABELS = {};
const GENERIC = /^(icon|svg|div|span|img|button|a|li|p|x|i|\d+|[\W_]+)$/i;
for (const f of readdirSync(join(ROOT, 'data', 'states')).filter((f) => f.endsWith('.json'))) {
  for (const l of JSON.parse(readFileSync(join(ROOT, 'data', 'states', f), 'utf8')).links || []) {
    const label = (l.label || '').trim();
    if (!label || GENERIC.test(label) || label.length > 32 || /[?]preview=/.test(l.to) || /^\/ar\//.test(l.to)) continue;
    if (/\?/.test(l.to)) continue;                               /* a query is a state of the same page, not a screen */
    LABELS[label] ||= norm(l.to);
  }
}

/* ── MENU, from the rail and the product's own menu list ─────────────── */
const MENU = {};
const dash = join(ROOT, 'deliverables', 'dashboard.html');
if (existsSync(dash)) {
  const html = readFileSync(dash, 'utf8');
  for (const m of html.matchAll(/<li[^>]*title="([^"]*)"[^>]*data-menu-id="rc-menu-uuid-\d+-\d+-([^"]+)"/g)) {
    const title = m[1].replace(/&amp;/g, '&'), key = m[2];
    if (LABELS[title]) MENU[key] = LABELS[title];
  }
}
const menuList = join(REPO, 'src', 'tenant', 'common', 'menuList', 'menuList.js');
if (existsSync(menuList)) {
  const src = readFileSync(menuList, 'utf8');
  /* a key and the first path that follows it inside the same entry (top-level
     entries declare key first), or a path followed by its key (the children) */
  for (const m of src.matchAll(/key:\s*'([^']+)'[\s\S]{0,400}?path:\s*'([^']+)'/g)) MENU[m[1]] ||= m[2];
  for (const m of src.matchAll(/path:\s*'([^']+)',\s*key:\s*'([^']+)'/g)) MENU[m[2]] = m[1];
}

/* ── the script ────────────────────────────────────────────────────────── */
/* where a file sits, in the two layouts the pages are published in */
const LAYOUTS = {
  /* deliverables/<page>.html, states/<page>--<state>.html, mobile/… (a
     single-file bundle says where itself: window.PF_SELF) */
  deliverables: `
  var here = window.PF_SELF || ((location.pathname.match(/\\/deliverables\\/(.*)$/) || [])[1]) || location.pathname.split('/').slice(-2).join('/');
  here = decodeURIComponent(here);
  var phone = /^mobile\\//.test(here);
  var inStates = /(^|\\/)states\\//.test(here);
  var ROUTES = phone ? ${JSON.stringify(ROUTES_M)} : ${JSON.stringify(ROUTES)};
  var root = inStates ? '../' : '';
  var name = here.replace(/^(mobile\\/)?(states\\/)?/, '').replace(/\\.html$/, '');
  function routeFile(f) { return root + f; }
  /* the file for a name in a layout, from here */
  function fileFor(n, dev) {
    var st = n.indexOf('--') > -1;
    var up = (phone ? '../' : '') + (inStates ? '../' : '');
    return up + (dev === 'mobile' ? 'mobile/' : '') + (st ? 'states/' : '') + n + '.html';
  }`,
  /* the skill package (scripts/package.mjs): pages/<page>.html,
     pages/<page>.mobile.html, pages/<page>/<state>.html and <state>.mobile.html */
  package: `
  var here = decodeURIComponent(((location.pathname.match(/\\/pages\\/(.*)$/) || [])[1]) || location.pathname.split('/').slice(-2).join('/'));
  var phone = /\\.mobile\\.html$/.test(here);
  var inStates = here.indexOf('/') > -1;
  var ROUTES = phone ? ${JSON.stringify(ROUTES_M)} : ${JSON.stringify(ROUTES)};
  var root = inStates ? '../' : '';
  var name = here.replace(/(\\.mobile)?\\.html$/, '').replace('/', '--');
  function routeFile(f) { return root + f.replace(/\\.html$/, phone ? '.mobile.html' : '.html'); }
  /* the file for a name in a layout, from here */
  function fileFor(n, dev) {
    var i = n.indexOf('--');
    return root + (i > -1 ? n.slice(0, i) + '/' + n.slice(i + 2) : n) + (dev === 'mobile' ? '.mobile' : '') + '.html';
  }`,
};
const script = (LAYOUT) => `/* Page-to-page navigation for the compiled Profolio KSA pages.
   Generated by scripts/ds/prototype.mjs — do not edit. The product navigates
   with click handlers, which a static page does not have; this resolves those
   clicks to the compiled pages. States are wired by data-pf-go (compile.mjs). */
(function () {
  var MENU = ${JSON.stringify(MENU)};
  var LABELS = ${JSON.stringify(LABELS)};
  var FILES = ${JSON.stringify(FILES)};
  var FLOWS = ${JSON.stringify(FLOWS)};
${LAYOUT}
  function norm(p) {
    p = (p || '').replace(/^https?:\\/\\/[^/]+/, '').replace(/^\\/(en|ar)(?=\\/|$)/, '').replace(/[?#].*$/, '').replace(/\\/$/, '');
    return p || '/dashboard';
  }
  function toast(msg) {
    var t = document.createElement('div');
    t.textContent = msg;
    t.setAttribute('style', 'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:2147483647;background:#1f2328;color:#fff;font:13px/1.45 system-ui,-apple-system,sans-serif;padding:10px 14px;border-radius:8px;box-shadow:0 6px 20px rgba(0,0,0,.25);max-width:80vw;pointer-events:none');
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 2800);
  }
  function go(route, label) {
    var r = norm(route), f = ROUTES[r];
    if (f) location.href = routeFile(f);
    else toast((label ? '“' + label + '” — ' : '') + r + ' is not compiled into this prototype yet');
  }
  function text(el) { return (el.getAttribute('aria-label') || el.getAttribute('title') || el.innerText || '').trim().replace(/\\s+/g, ' '); }
  /* the file for a name in a layout, from here */

  /* a flow's steps: the primary button or → goes on, ← goes back */
  var flow = null, step = -1;
  (function () {
    var list = FLOWS[phone ? 'mobile' : 'web'];
    for (var k in list) { var i = list[k].indexOf(name); if (i > -1) { flow = list[k]; step = i; } }
  })();
  function toStep(i) { if (flow && flow[i]) location.href = fileFor(flow[i], phone ? 'mobile' : 'web'); }
  /* M: the same screen in the other layout — the same state, or its
     counterpart (a modal on the web is often a drawer on a phone) */
  var stemOf = function (n) { return n.replace(/--(modal|drawer|popover|dropdown|select|picker|tooltip|inline|tab|message)-/, '--'); };
  function otherLayout() {
    var dev = phone ? 'web' : 'mobile', list = FILES[dev];
    if (list.indexOf(name) > -1) return location.href = fileFor(name, dev);
    for (var i = 0; i < list.length; i++) if (stemOf(list[i]) === stemOf(name)) return location.href = fileFor(list[i], dev);
    var pageOnly = name.split('--')[0];
    if (list.indexOf(pageOnly) > -1) { toast('No ' + (dev === 'mobile' ? 'phone' : 'web') + ' version of this state — opening the page'); return location.href = fileFor(pageOnly, dev); }
    toast('No ' + (dev === 'mobile' ? 'phone' : 'web') + ' version of this screen');
  }
  document.addEventListener('keydown', function (e) {
    var t = e.target;
    if (t && (t.isContentEditable || /^(input|textarea|select)$/i.test(t.tagName))) return;
    if (e.key === 'm' || e.key === 'M') { e.preventDefault(); otherLayout(); }
    else if (flow && e.key === 'ArrowRight') { e.preventDefault(); toStep(step + 1); }
    else if (flow && e.key === 'ArrowLeft') { e.preventDefault(); toStep(step - 1); }
  });
  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0) return;
    var t = e.target;
    if (!t || !t.closest) return;
    var a = t.closest('a[href]');
    if (a) {
      var h = a.getAttribute('href');
      if (/^\\/(en|ar)?(\\/|$)/.test(h)) { e.preventDefault(); go(h, text(a)); }
      return;
    }
    var mi = t.closest('[data-menu-id]');
    if (mi) {
      var m = /^rc-menu-uuid-\\d+-\\d+-(.+)$/.exec(mi.getAttribute('data-menu-id') || '');
      if (m && MENU[m[1]]) { e.preventDefault(); go(MENU[m[1]], text(mi)); return; }
    }
    /* in a flow, the step's primary action goes to the next step */
    if (flow && step < flow.length - 1) {
      var pb = t.closest('.pf-btn-primary, .pf-btn-color-primary.pf-btn-variant-solid, button[type=submit]');
      if (pb) { e.preventDefault(); toStep(step + 1); return; }
    }
    for (var el = t, n = 0; el && el !== document.body && n < 6; el = el.parentElement, n++) {
      var l = text(el);
      if (l && LABELS[l]) { e.preventDefault(); go(LABELS[l], l); return; }
      if (el.getBoundingClientRect().width > 420) break;
    }
  }, false);
})();
`;
writeFileSync(join(ROOT, 'deliverables', 'prototype.js'), script(LAYOUTS.deliverables));
/* the same script for the skill package's layout — scripts/package.mjs copies it to skill/pages/ */
mkdirSync(join(ROOT, 'data', 'ds'), { recursive: true });
writeFileSync(join(ROOT, 'data', 'ds', 'prototype.package.js'), script(LAYOUTS.package));
console.log(`  deliverables/prototype.js — ${Object.keys(ROUTES).length} web and ${Object.keys(ROUTES_M).length} phone routes · ${Object.keys(MENU).length} rail keys · ${Object.keys(LABELS).length} labelled links · ${Object.keys(FLOWS.web).length} web and ${Object.keys(FLOWS.mobile).length} phone flows`);
console.log('  rail:', Object.entries(MENU).map(([k, v]) => `${k}→${v}${ROUTES[v] ? '' : ' (not compiled)'}`).join('  '));
