/* The prototype player (kit/player.js). It is the page qa/prototype.mjs writes around a
   design: one file holding every screen, state, stylesheet and product page the prototype
   opens. A screen runs in its own frame at its real size (1440 × 900 on the web, 375 × 812
   on a phone) with kit/runtime.js inside it. The player:
     - lists the states;
     - switches between web and phone (M);
     - holds the scenario controls;
     - shows each state's notes and the QA result.
   A headless run (qa/prototype.mjs) drives it through window.__pfp. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var M = JSON.parse($('pfp-manifest').textContent);
  var RUNTIME = $('pfp-runtime').textContent;
  var QA = $('pfp-qa').textContent;
  var KITCSS = $('pfp-kitcss').textContent;
  var blobs = {};
  Array.prototype.forEach.call(document.querySelectorAll('script[data-path]'), function (s) { blobs[s.getAttribute('data-path')] = s; });
  var cache = {};
  var SIZE = { web: [1440, 900], phone: [375, 812] };

  /* ── files: gzip + base64 in the page, text when asked for ───────────── */
  function file(path) {
    if (cache[path]) return cache[path];
    var s = blobs[path];
    if (!s) return Promise.resolve(null);
    var b64 = s.textContent.trim(), bin = atob(b64), bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    var p;
    if (s.type === 'application/gzip-base64') {
      if (!window.DecompressionStream) return Promise.reject(new Error('This browser cannot open the prototype (no DecompressionStream) — use a current Chrome, Safari or Firefox'));
      p = new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).text();
    } else p = Promise.resolve(new TextDecoder().decode(bytes));
    cache[path] = p;
    return p;
  }
  function frameHtml(path, boot) {
    return file(path).then(function (html) {
      if (html == null) throw new Error(path + ' is not in this prototype');
      var links = [], re = /<link data-pf-css="([^"]+)"[^>]*>/g, m;
      while ((m = re.exec(html))) links.push(m[1]);
      return Promise.all(links.map(file)).then(function (css) {
        var byPath = {};
        links.forEach(function (p, i) { byPath[p] = css[i] || ''; });
        html = html.replace(/<link data-pf-css="([^"]+)"[^>]*>/g, function (all, p) { return '<style data-pf-css="' + p + '">' + byPath[p] + '</style>'; });
        var inject = '<style data-pf-kit>' + KITCSS + '</style>' +
          '<script>window.PF_BOOT=' + JSON.stringify(boot).replace(/</g, '\\u003c') + '<\/script>' +
          '<script>' + RUNTIME + '<\/script><script>' + QA + '<\/script>';
        var at = html.search(/<\/body>\s*(<\/html>\s*)?$/i);
        return at > -1 ? html.slice(0, at) + inject + html.slice(at) : html + inject;
      });
    });
  }

  /* ── the page ────────────────────────────────────────────────────────── */
  var root = $('pfp');
  var frame = $('pfp-frame'), device = $('pfp-device');
  var cur = { entry: null, platform: (M.platforms && M.platforms[0]) || 'web', state: null, ready: false };
  var overrides = {}, snapshot = {}, waiters = [], qaWait = {}, frameErrors = [];

  function el(tag, attrs, kids) {
    var e = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) { if (k === 'text') e.textContent = attrs[k]; else if (k === 'on') Object.keys(attrs.on).forEach(function (ev) { e.addEventListener(ev, attrs.on[ev]); }); else e.setAttribute(k, attrs[k]); });
    (kids || []).forEach(function (c) { if (c) e.appendChild(c); });
    return e;
  }
  function toast(msg) {
    var t = el('div', { class: 'pfp-toast', role: 'status', text: msg });
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 2600);
  }
  function sizeOf(entry, platform) { return (entry && entry.size && entry.size[platform]) || SIZE[platform] || SIZE.web; }
  function fit() {
    var s = sizeOf(cur.entry, cur.platform);
    frame.style.width = s[0] + 'px'; frame.style.height = s[1] + 'px';
    var shot = root.getAttribute('data-mode') === 'shot';
    var avail = Math.max(320, $('pfp-stage').clientWidth - 32);
    var k = shot ? 1 : Math.min(1, avail / s[0]);
    if (cur.platform === 'phone' && !shot) k = Math.min(1, Math.max(0.5, (window.innerHeight - 140) / s[1]));
    frame.style.transform = k === 1 ? 'none' : 'scale(' + k + ')';
    device.style.width = Math.round(s[0] * k) + 'px'; device.style.height = Math.round(s[1] * k) + 'px';
    device.setAttribute('data-platform', cur.platform);
    $('pfp-caption').textContent = (cur.entry ? (cur.entry.title || cur.entry.id) + ' · ' : '') + (cur.platform === 'phone' ? 'Phone' : 'Web') + ' · ' + s[0] + ' × ' + s[1] + (k < 1 ? ' · shown at ' + Math.round(k * 100) + '%' : '');
  }
  window.addEventListener('resize', fit);

  function find(to) {
    to = String(to || '');
    var s = M.screens.filter(function (x) { return x.id === to || x.route === to; })[0];
    if (s) return s;
    var pages = M.pages || {};
    if (pages[to]) return pages[to];
    return Object.keys(pages).map(function (k) { return pages[k]; }).filter(function (p) { return p.route === to || p.route === to.replace(/\/$/, ''); })[0] || null;
  }
  function load(entry, state, carry) {
    var path = entry.files[cur.platform] || entry.files.web || entry.files.phone;
    if (!entry.files[cur.platform]) toast('No ' + cur.platform + ' layout for ' + (entry.title || entry.id) + ' — showing ' + (entry.files.web ? 'web' : 'phone'));
    cur.entry = entry; cur.ready = false; frameErrors = [];
    var boot = { screen: entry.id, file: path, platform: cur.platform, state: state || null, carry: carry || null, menu: M.menu || {}, labels: M.labels || {} };
    fit();
    return frameHtml(path, boot).then(function (html) { frame.srcdoc = html; }, function (e) { toast(e.message); });
  }
  function whenReady() { return new Promise(function (r) { if (cur.ready) r(); else waiters.push(r); }); }
  function send(msg) { try { frame.contentWindow.postMessage(msg, '*'); } catch (e) { /* not loaded */ } }

  function stateById(id) { return M.states.filter(function (s) { return s.id === id; })[0]; }
  function payload(st) {
    var set = {};
    Object.keys(overrides).forEach(function (k) { set[k] = overrides[k]; });
    Object.keys(st.set || {}).forEach(function (k) { set[k] = st.set[k]; });
    return { set: set, do: st.do || [] };
  }
  var applied = {};
  function go(id) {
    var st = stateById(id);
    if (!st) { toast('No state "' + id + '"'); return Promise.resolve(); }
    cur.state = id;
    var entry = find(st.screen) || M.screens[0];
    notes();
    if (!cur.entry || cur.entry.id !== entry.id || !cur.ready) {
      return load(entry, payload(st)).then(whenReady);
    }
    return new Promise(function (r) {
      var key = Math.random().toString(36).slice(2);
      applied[key] = r;
      send({ pf: 'apply', state: payload(st), id: key });
      setTimeout(function () { if (applied[key]) { delete applied[key]; r(); } }, 5000);
    });
  }
  function setPlatform(p) {
    if (p === cur.platform || !SIZE[p]) return Promise.resolve();
    cur.platform = p;
    Array.prototype.forEach.call(document.querySelectorAll('[data-platform-btn]'), function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-platform-btn') === p)); });
    if (cur.state) { var st = stateById(cur.state); return load(find(st.screen) || M.screens[0], payload(st)).then(whenReady); }
    return load(cur.entry || M.screens[0], null, snapshot).then(whenReady);
  }

  window.addEventListener('message', function (ev) {
    var m = ev.data;
    if (!m || !m.pf || ev.source !== frame.contentWindow) return;
    if (m.pf === 'ready') { cur.ready = true; snapshot = m.state || {}; syncControls(); var w = waiters; waiters = []; w.forEach(function (f) { f(); }); }
    else if (m.pf === 'applied') { snapshot = m.state || {}; syncControls(); if (applied[m.id]) { applied[m.id](); delete applied[m.id]; } }
    else if (m.pf === 'state') { snapshot = m.state || {}; syncControls(); }
    else if (m.pf === 'error') { frameErrors.push(m.message); }
    else if (m.pf === 'go') { go(m.state); }
    else if (m.pf === 'platform') { setPlatform(cur.platform === 'web' ? 'phone' : 'web'); }
    else if (m.pf === 'page') {
      var t = find(m.to);
      if (!t) { toast('“' + m.to + '” is not part of this prototype'); return; }
      cur.state = null; notes();
      load(t, null, m.state || snapshot);
    } else if (m.pf === 'file') {
      var path = resolve(m.path, m.from);
      (path ? file(path) : Promise.resolve(null)).then(function (html) {
        send({ pf: 'file', id: m.id, html: html || '' });
      });
    } else if (m.pf === 'qa') { if (qaWait[m.id]) { qaWait[m.id](m.result); delete qaWait[m.id]; } }
  });
  /* a compiled state a click names (data-pf-go): the bundler's alias, the same folder, or
     the same state of another page — the shell's states are the same on every page */
  function resolve(target, from) {
    var alias = (M.alias || {})[target];
    if (alias && blobs[alias]) return alias;
    var dir = String(from || '').replace(/[^/]*$/, '');
    var parts = (dir + target).split('/'), out = [];
    parts.forEach(function (p) { if (p === '..') out.pop(); else if (p && p !== '.') out.push(p); });
    var joined = out.join('/');
    if (blobs[joined]) return joined;
    var name = target.split('/').pop().replace(/^[\w-]+--/, '');
    var phone = /\.mobile\.html$/.test(name) || cur.platform === 'phone';
    var base = name.replace(/(\.mobile)?\.html$/, '');
    var hit = Object.keys(blobs).filter(function (k) { return /^pages\/[^/]+\//.test(k) && k.split('/').pop().replace(/(\.mobile)?\.html$/, '') === base && /\.mobile\.html$/.test(k) === phone; })[0];
    return hit || null;
  }

  /* ── the controls ────────────────────────────────────────────────────── */
  function build() {
    var bar = $('pfp-bar');
    var title = el('div', { class: 'pfp-title' }, [el('b', { text: M.title || M.name || 'Prototype' }), el('span', { text: (M.wireframe ? 'Wireframe — structure and flow, not visuals' : 'Prototype') + ' · Profolio KSA' + (M.theme ? ' · ' + M.theme : '') })]);
    bar.appendChild(title);
    if (M.screens.length > 1) {
      var sel = el('select', { 'aria-label': 'Screen', on: { change: function () { var s = find(this.value); cur.state = null; notes(); load(s, null, snapshot); } } });
      M.screens.forEach(function (s) { sel.appendChild(el('option', { value: s.id, text: s.title || s.id })); });
      bar.appendChild(el('div', { class: 'pfp-group' }, [el('label', { text: 'Screen' }), sel]));
    }
    if ((M.platforms || []).length > 1) {
      var seg = el('div', { class: 'pfp-seg', role: 'group', 'aria-label': 'Layout' });
      M.platforms.forEach(function (p) { seg.appendChild(el('button', { type: 'button', 'data-platform-btn': p, 'aria-pressed': String(p === cur.platform), text: p === 'phone' ? 'Phone' : 'Web', on: { click: function () { setPlatform(p); } } })); });
      bar.appendChild(el('div', { class: 'pfp-group' }, [seg]));
    }
    (M.controls || []).forEach(function (c) {
      var sel = el('select', { 'data-control': c.key, 'aria-label': c.label, on: { change: function () { var v = c.options[this.selectedIndex][0]; overrides[c.key] = v; send({ pf: 'set', key: c.key, value: v }); } } });
      c.options.forEach(function (o, i) { sel.appendChild(el('option', { value: String(i), text: o[1] })); });
      bar.appendChild(el('div', { class: 'pfp-group' }, [el('label', { text: c.label }), sel]));
    });
    bar.appendChild(el('button', { type: 'button', text: 'Restart', on: { click: function () { overrides = {}; go(M.start || M.states[0].id); } } }));
    var q = M.qa || {};
    var qaBtn = el('button', { type: 'button', class: 'pfp-qa', 'data-state': !q.ran ? 'warn' : q.errors ? 'fail' : 'pass', text: !q.ran ? 'QA not run' : q.errors ? 'QA: ' + q.errors + ' issue' + (q.errors > 1 ? 's' : '') : 'QA passed', on: { click: function () { runQA(); } } });
    bar.appendChild(qaBtn);
    if (q.ran && q.errors) root.insertBefore(el('div', { class: 'pfp-banner', text: 'Design QA found ' + q.errors + ' issue' + (q.errors > 1 ? 's' : '') + ' — this prototype is not ready to share. Open QA for the list.' }), $('pfp-main'));
    else if (!q.ran && !M.wireframe) root.insertBefore(el('div', { class: 'pfp-banner', 'data-kind': 'warn', text: 'Visual QA did not run where this was built' + (q.note ? ' (' + q.note + ')' : '') + ' — press QA to check it in this browser.' }), $('pfp-main'));
    var groups = {};
    M.states.forEach(function (s) { var g = s.group || 'States'; (groups[g] = groups[g] || []).push(s); });
    var box = $('pfp-states');
    Object.keys(groups).forEach(function (g) {
      var row = el('div', { class: 'pfp-sg' });
      groups[g].forEach(function (s) { row.appendChild(el('button', { type: 'button', 'data-state-btn': s.id, 'aria-pressed': 'false', text: s.title || s.id, on: { click: function () { go(s.id); } } })); });
      box.appendChild(el('div', {}, [el('h3', { text: g }), row]));
    });
  }
  function syncControls() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-control]'), function (sel) {
      var c = (M.controls || []).filter(function (x) { return x.key === sel.getAttribute('data-control'); })[0];
      var v = snapshot[c.key], i = c.options.map(function (o) { return String(o[0]); }).indexOf(String(v));
      if (i > -1 && sel.selectedIndex !== i) sel.selectedIndex = i;
    });
  }
  function notes() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-state-btn]'), function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-state-btn') === cur.state)); });
    var st = cur.state && stateById(cur.state), box = $('pfp-note');
    box.textContent = '';
    if (!st) { box.appendChild(el('p', { class: 'pfp-muted', text: 'Browsing freely — pick a state to jump to it.' })); return; }
    box.appendChild(el('h2', { text: st.title || st.id }));
    if (st.notes) box.appendChild(el('p', { text: st.notes }));
    if (st.try && st.try.length) box.appendChild(el('div', {}, [el('h3', { text: 'Try' }), el('ul', {}, st.try.map(function (t) { return el('li', { text: t }); }))]));
  }

  /* ── QA, in this browser ─────────────────────────────────────────────── */
  function qa(opts) {
    return whenReady().then(function () {
      return new Promise(function (r) {
        var id = Math.random().toString(36).slice(2);
        qaWait[id] = function (res) { res.frameErrors = frameErrors.slice(); r(res); };
        send({ pf: 'qa', id: id, options: opts || {}, delay: 120 });
        setTimeout(function () { if (qaWait[id]) { delete qaWait[id]; r({ issues: [{ level: 'error', check: 'qa', message: 'QA did not answer in this frame' }] }); } }, 15000);
      });
    });
  }
  function runQA() {
    qa({ draw: true }).then(function (res) {
      var box = $('pfp-issues');
      box.textContent = '';
      var list = (res.issues || []);
      box.appendChild(el('h3', { text: 'QA · this state · ' + cur.platform }));
      if (!list.length) box.appendChild(el('p', { class: 'pfp-muted', text: 'No issues in this state.' }));
      else box.appendChild(el('ul', {}, list.map(function (i) { return el('li', { 'data-level': i.level, text: (i.level === 'warn' ? 'Warning · ' : '') + i.message }); })));
      (M.qa && M.qa.issues || []).length && box.appendChild(el('p', { class: 'pfp-muted', text: 'At build: ' + M.qa.errors + ' error(s), ' + M.qa.warnings + ' warning(s) across all states.' }));
    });
  }

  window.__pfp = {
    manifest: M,
    size: function () { return sizeOf(cur.entry, cur.platform); },
    go: function (id, platform) { return (platform ? setPlatform(platform) : Promise.resolve()).then(function () { return go(id); }).then(function () { return new Promise(function (r) { setTimeout(r, 250); }); }); },
    qa: qa,
    shot: function (on) { root.setAttribute('data-mode', on ? 'shot' : ''); fit(); },
    state: function () { return snapshot; },
    errors: function () { return frameErrors.slice(); },
  };

  build();
  if (/[#&?]shot\b/.test(location.href)) root.setAttribute('data-mode', 'shot');
  fit();
  go(M.start || (M.states[0] && M.states[0].id));
})();
