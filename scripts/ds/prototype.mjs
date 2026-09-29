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
  /* where this file sits, from prototype.js's own address (the pages/
     folder): pages/<page>.html, pages/<page>.mobile.html,
     pages/<page>/<state>.html and <state>.mobile.html — or designs/<x>.html,
     a design made with the skill, whose copied links are resolved from the
     compiled file its pf-base names */
  var me = document.currentScript && document.currentScript.src;
  var at = location.href.replace(/[?#].*$/, '');
  var root = me ? me.replace(/[^/]*$/, '') : '';
  var design = /\\/designs\\/[^/]+$/.test(location.pathname);
  var here = decodeURIComponent(root && at.indexOf(root) === 0 ? at.slice(root.length) : ((location.pathname.match(/\\/pages\\/(.*)$/) || [])[1]) || location.pathname.split('/').slice(-2).join('/'));
  var phone = /\\.mobile\\.html$/.test(here);
  var inStates = !design && here.indexOf('/') > -1;
  var ROUTES = phone ? ${JSON.stringify(ROUTES_M)} : ${JSON.stringify(ROUTES)};
  if (!root) root = design ? '../pages/' : inStates ? '../' : '';
  var designName = design ? 'designs/' + here.split('/').pop().replace(/(\\.mobile)?\\.html$/, '') : '';
  /* a design is named, for the flows, as the compiled file its pf-base names
     (pages/credits-usage/flow-top-up-01-choose-amount.html →
     credits-usage--flow-top-up-01-choose-amount): a design copied from a
     flow step walks that flow — → and its primary button to the next
     compiled step, ← to the one before. M is the design's own (below) */
  var pfBase = design && document.querySelector('meta[name="pf-base"]');
  pfBase = pfBase ? pfBase.getAttribute('content') || '' : '';
  var name = design ? (/^pages\\/[^/]+(\\/[^/]+)?\\.html$/.test(pfBase) ? pfBase.replace(/^pages\\//, '').replace(/(\\.mobile)?\\.html$/, '').replace('/', '--') : designName) : here.replace(/(\\.mobile)?\\.html$/, '').replace('/', '--');
  function routeFile(f) { return root + f.replace(/\\.html$/, phone ? '.mobile.html' : '.html'); }
  /* the file for a name in a layout, from here */
  function fileFor(n, dev) {
    var i = n.indexOf('--');
    return root + (i > -1 ? n.slice(0, i) + '/' + n.slice(i + 2) : n) + (dev === 'mobile' ? '.mobile' : '') + '.html';
  }
  if (design) (function () {
    /* a design: its links were copied with the compiled file, relative to
       where that file sits. One that now points at nothing is resolved
       from the file pf-base names; M opens the design's own twin */
    var dir = at.replace(/[^/]*$/, ''), up = new URL('../', dir).href;
    var bm = document.querySelector('meta[name="pf-base"]'), base = bm && bm.getAttribute('content');
    var baseURL = base && new URL(base, new URL('../', root)).href;
    var basePage = base ? base.replace(/^pages\\//, '').split('/')[0].replace(/(\\.mobile)?\\.html$/, '') : '';
    var baseIsState = !!base && /^pages\\/[^/]+\\/[^/]+$/.test(base);
    var list = FILES[phone ? 'mobile' : 'web'];
    function broken(u) {
      if (!baseURL || u.indexOf(root) === 0) return false;
      if (u.indexOf(dir) === 0) {
        var rest = u.slice(dir.length).replace(/[?#].*$/, '');
        return rest.indexOf('/') > -1 || (baseIsState && list.indexOf(basePage + '--' + rest.replace(/(\\.mobile)?\\.html$/, '')) > -1);
      }
      return u.indexOf(up) === 0;
    }
    function fix(u) {
      var a = dir.split('/'), b = u.split('/'), i = 0;
      while (i < a.length - 1 && i < b.length - 1 && a[i] === b[i]) i++;
      var f = new URL(new Array(a.length - i).join('../') + b.slice(i).join('/'), baseURL).href;
      return f.indexOf(root) === 0 ? f : null;
    }
    function exists(u, then) {
      if (/^https?:$/.test(location.protocol) && window.fetch) return fetch(u, { method: 'HEAD' }).then(function (r) { then(r.ok); }, function () { then(true); });
      /* file:// has no HEAD: a <script> element's load or error says
         whether the file is there — an HTML file is not run, it fails to
         parse at its first "<" */
      var s = document.createElement('script');
      /* its parse error, muted for a file:// script ("Script error.", no file name), is not the page's */
      function quiet(e) { if (e.filename === s.src || (!e.filename && e.message === 'Script error.')) e.preventDefault(); }
      function done(ok) { s.remove(); window.removeEventListener('error', quiet, true); then(ok); }
      window.addEventListener('error', quiet, true);
      s.onload = function () { done(true); };
      s.onerror = function () { done(false); };
      s.src = u;
      (document.head || document.documentElement).appendChild(s);
    }
    /* back — Escape, the mask, ✕, Cancel — goes where the copied state's own
       script says, resolved from its file; to the design's own page
       (designs/<name>.html) when that file is there */
    var back = null, backFrom = '';
    function wire() {
      var go = document.querySelectorAll('[data-pf-go]');
      for (var k = 0; k < go.length; k++) {
        var u = new URL(go[k].getAttribute('data-pf-go'), at).href;
        if (broken(u) && fix(u)) go[k].setAttribute('data-pf-go', fix(u));
      }
      var s = document.querySelectorAll('script:not([src])');
      for (var j = 0; j < s.length && !backFrom; j++) { var m = /location\\.href='([^']+)'/.exec(s[j].textContent); if (m) backFrom = new URL(m[1], at).href; }
      if (!backFrom || !broken(backFrom)) return;
      back = fix(backFrom);
      var own = designName.indexOf('--') > -1 ? dir + designName.slice(8).split('--')[0] + (phone ? '.mobile' : '') + '.html' : null;
      if (own) exists(own, function (ok) { if (ok) back = own; });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire); else wire();
    document.addEventListener('keydown', function (e) {
      var t = e.target;
      if (t && (t.isContentEditable || /^(input|textarea|select)$/i.test(t.tagName))) return;
      if (e.key === 'Escape' && back) { e.stopPropagation(); location.href = back; }
      else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault(); e.stopImmediatePropagation();
        var to = at.replace(/(\\.mobile)?\\.html$/, phone ? '.html' : '.mobile.html');
        exists(to, function (ok) { if (ok) location.href = to; else toast('No ' + (phone ? 'web' : 'phone') + ' version of this design — ' + to.split('/').pop()); });
      }
    });
    /* the copied script's own mask, ✕ and Cancel: the browser's navigate
       event catches the navigation it starts; without it, the same clicks */
    if (window.navigation && navigation.addEventListener) navigation.addEventListener('navigate', function (e) {
      var u = e.destination && e.destination.url;
      if (!u || !e.cancelable || !broken(u)) return;
      var to = u === backFrom && back ? back : fix(u);
      if (to) { e.preventDefault(); setTimeout(function () { location.href = to; }, 0); }
    });
    else window.addEventListener('click', function (e) {
      var t = e.target, b;
      if (!back || !t || !t.closest || t.closest('[data-pf-go]')) return;
      b = t.closest('button,a,[role=button]');
      if (t.matches('.pf-modal-wrap,.pf-drawer-mask,.pf-modal-mask,.pf-tour-mask') || t.closest('.pf-modal-close,.pf-drawer-close,.pf-tour-close,.pf-message-notice-close,.pf-notification-notice-close,[aria-label="Close"],[aria-label="close"]') || (b && /^(cancel|close|back|dismiss|not now|skip|later|no|\\u0625\\u0644\\u063a\\u0627\\u0621|\\u0625\\u063a\\u0644\\u0627\\u0642|\\u0631\\u062c\\u0648\\u0639)$/i.test((b.innerText || '').trim()))) location.href = back;
    }, true);
  })();`,
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
