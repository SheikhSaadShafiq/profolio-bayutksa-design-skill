/* Profolio KSA prototype runtime (kit/runtime.js).
   It makes a design screen behave. It is wired only by data-pf-* attributes and three JSON
   blocks, never by matching text; kit/README.md is the reference. It runs inside each
   screen of a prototype (qa/prototype.mjs inlines it), or on its own when a design is served
   over http.

   Data, in the screen:
     <script type="application/json" id="pf-state">   the variables' first values
     <script type="application/json" id="pf-data">    the lists' rows ({"owner": [...]}, or per
                                                       dataset: {"owner": {"many": [...], "none": []}})
     <script type="application/json" id="pf-actions"> named actions: lists of steps
   Bindings:  data-pf-show · data-pf-text · data-pf-class · data-pf-attr · data-pf-value
              data-pf-list (+ <template>) · data-pf-overlay · data-pf-menu-panel · data-pf-skeleton
   Actions:   data-pf-set · data-pf-toggle · data-pf-open · data-pf-close · data-pf-menu · data-pf-do
              data-pf-go · data-pf-page · data-pf-toast · data-pf-href · data-pf-busy · data-pf-inert
   The shell is the product's own and is handled here. The rail opens the other pages and
   expands; the header's bell, avatar, Post a Listing and help open the compiled states their
   data-pf-go names, over this screen. */
(function () {
  'use strict';
  if (window.pf && window.pf.version) return;

  var BOOT = window.PF_BOOT || {};
  var inFrame = window.parent && window.parent !== window;
  var S = {};                 // the variables
  var INIT = {};              // their first values (pf-state), for a reset
  var RAW = {};               // pf-data as written
  var LIVE = {};              // pf-data as changed by actions (per list, per dataset)
  var ACTIONS = {};
  var errors = [];
  var dead = [];
  var fast = false;           // a scenario applies its steps without waiting
  var rendering = false, dirty = false, counted = {};

  /* ── errors: kept for QA, never thrown at the viewer ─────────────────── */
  function fail(msg) {
    errors.push(String(msg));
    if (window.console) console.warn('[pf] ' + msg);
    post({ pf: 'error', message: String(msg) });
  }
  window.addEventListener('error', function (e) { fail(e.message + (e.filename ? ' (' + e.filename.split('/').pop() + ':' + e.lineno + ')' : '')); });

  function post(msg) { if (inFrame) try { window.parent.postMessage(msg, '*'); } catch (e) { /* no player */ } }

  /* ── values ──────────────────────────────────────────────────────────── */
  function literal(s) {
    s = String(s).trim();
    if (s === '') return '';
    if (s === 'true') return true;
    if (s === 'false') return false;
    if (s === 'null') return null;
    if (/^-?\d+(\.\d+)?$/.test(s)) return +s;
    if ((s[0] === "'" && s[s.length - 1] === "'") || (s[0] === '"' && s[s.length - 1] === '"')) return s.slice(1, -1);
    return s;
  }
  function field(item, path) {
    var v = item;
    path.split('.').forEach(function (k) { v = v == null ? undefined : v[k]; });
    return v;
  }
  /* one operand: 'text' · 12 · @key · $.field · $index · a bare word (a key on the left, text on the right) */
  function operand(tok, scope, bareIsKey) {
    if (tok == null) return undefined;
    if (tok[0] === '@') return S[tok.slice(1)];
    if (tok === '$index') return scope ? scope.index : undefined;
    if (tok.slice(0, 2) === '$.') return scope ? field(scope.item, tok.slice(2)) : undefined;
    if (tok === '$') return scope ? scope.item : undefined;
    if (bareIsKey && /^[A-Za-z_][\w.-]*$/.test(tok) && tok !== 'true' && tok !== 'false' && tok !== 'null') return S[tok];
    return literal(tok);
  }
  /* {@balance - $.price} — + - * / over numbers, left to right */
  function arith(src, scope) {
    var parts = src.match(/'[^']*'|"[^"]*"|[@$]?[\w.$]+|[-+*/]/g) || [];
    var acc = null, op = '+';
    parts.forEach(function (p) {
      if (/^[-+*/]$/.test(p)) { op = p; return; }
      var v = operand(p, scope, true);
      if (acc === null) { acc = v; return; }
      var a = +acc, b = +v;
      acc = op === '+' ? (typeof acc === 'string' && isNaN(a) ? acc + v : a + b) : op === '-' ? a - b : op === '*' ? a * b : b ? a / b : 0;
    });
    return acc;
  }
  function value(src, scope) {
    src = String(src).trim();
    if (src[0] === '{' && src[src.length - 1] === '}') return arith(src.slice(1, -1), scope);
    if (src[0] === '@' || src === '$index' || src.slice(0, 2) === '$.' || src === '$') return operand(src, scope, false);
    return literal(src);
  }
  function truthy(v) { return !(v === undefined || v === null || v === false || v === '' || v === 0 || v === 'false'); }
  function same(a, b) {
    if (a === undefined || a === null) a = '';
    if (b === undefined || b === null) b = '';
    if (typeof a === 'number' || typeof b === 'number') { if (a !== '' && b !== '' && !isNaN(+a) && !isNaN(+b)) return +a === +b; }
    if (Array.isArray(a)) return a.map(String).indexOf(String(b)) > -1;
    return String(a) === String(b);
  }

  /* ── expressions: a=b && (c>2 || !d) ─────────────────────────────────── */
  var exprCache = {};
  function tokens(src) {
    var out = [], re = /\s*('(?:[^'])*'|"(?:[^"])*"|&&|\|\||>=|<=|!=|==|[=<>!()]|[^\s=<>!()&|]+)/g, m;
    while ((m = re.exec(src)) && m[0].trim()) out.push(m[1]);
    return out;
  }
  function parse(src) {
    if (exprCache[src]) return exprCache[src];
    var t = tokens(src), i = 0;
    function peek() { return t[i]; }
    function or() { var n = and(); while (peek() === '||') { i++; n = { op: '||', a: n, b: and() }; } return n; }
    function and() { var n = not(); while (peek() === '&&') { i++; n = { op: '&&', a: n, b: not() }; } return n; }
    function not() {
      if (peek() === '!') { i++; return { op: '!', a: not() }; }
      if (peek() === '(') { i++; var n = or(); if (peek() === ')') i++; return n; }
      var left = t[i++], op = peek();
      if (['=', '==', '!=', '>', '<', '>=', '<='].indexOf(op) > -1) { i++; return { op: op, l: left, r: t[i++] }; }
      return { op: 'v', l: left };
    }
    var tree = t.length ? or() : { op: 'v', l: 'true' };
    exprCache[src] = tree;
    return tree;
  }
  function evaluate(src, scope) {
    function run(n) {
      switch (n.op) {
        case '||': return run(n.a) || run(n.b);
        case '&&': return run(n.a) && run(n.b);
        case '!': return !run(n.a);
        case 'v': return truthy(operand(n.l, scope, true));
        default: {
          var a = operand(n.l, scope, true), b = operand(n.r, scope, false);
          if (n.op === '=' || n.op === '==') return same(a, b);
          if (n.op === '!=') return !same(a, b);
          a = +a; b = +b;
          return n.op === '>' ? a > b : n.op === '<' ? a < b : n.op === '>=' ? a >= b : a <= b;
        }
      }
    }
    try { return run(parse(String(src))); } catch (e) { fail('expression "' + src + '": ' + e.message); return false; }
  }
  /* "a=1; b='x y'; c=@d" → [[a, '1'], …], split on ; outside quotes and braces */
  function pairs(src) {
    var out = [], depth = 0, q = null, cur = '';
    String(src).split('').forEach(function (ch) {
      if (q) { if (ch === q) q = null; cur += ch; return; }
      if (ch === "'" || ch === '"') { q = ch; cur += ch; return; }
      if (ch === '{') depth++;
      if (ch === '}') depth--;
      if (ch === ';' && !depth) { out.push(cur); cur = ''; return; }
      cur += ch;
    });
    out.push(cur);
    return out.map(function (s) { return s.trim(); }).filter(Boolean).map(function (s) {
      var i = s.search(/[:=]/);
      return i < 0 ? [s, 'true'] : [s.slice(0, i).trim(), s.slice(i + 1).trim()];
    });
  }

  /* ── the store ───────────────────────────────────────────────────────── */
  function set(key, v, quiet) {
    if (same(S[key], v) && typeof S[key] === typeof v) return;
    S[key] = v;
    if (!quiet) schedule();
  }
  function schedule() {
    if (rendering) { dirty = true; return; }
    dirty = true;
    (window.requestAnimationFrame || setTimeout)(function () { if (dirty) render(); });
  }
  function snapshot() { var o = {}; Object.keys(S).forEach(function (k) { if (!/^(count|total)\./.test(k)) o[k] = S[k]; }); return o; }

  /* ── lists ───────────────────────────────────────────────────────────── */
  function dataset() { return S.data == null || S.data === '' ? null : String(S.data); }
  function rows(name) {
    var raw = LIVE[name];
    if (raw === undefined) { fail('data-pf-list="' + name + '": pf-data has no "' + name + '"'); return []; }
    if (Array.isArray(raw)) return raw;
    var ds = dataset();
    if (ds && raw[ds]) return raw[ds];
    if (ds && ds !== 'many' && !raw[ds]) return [];
    var first = Object.keys(raw)[0];
    return raw.many || raw[first] || [];
  }
  function filtered(el, name) {
    var items = rows(name).map(function (item, index) { return { item: item, index: index }; });
    var f = el.getAttribute('data-pf-filter');
    if (f) {
      var cs = f.split(';').map(function (c) {
        var m = c.match(/^\s*([\w.]+)\s*(>=|<=|!=|~|=|>|<)\s*(.+?)\s*$/);
        return m && { field: m[1], op: m[2], src: m[3] };
      }).filter(Boolean);
      items = items.filter(function (r) {
        return cs.every(function (c) {
          var want = value(c.src, r);
          if (want === undefined || want === null || want === '' || want === 'all' || want === 'any') return true;
          var have = field(r.item, c.field);
          if (c.op === '=') return same(have, want);
          if (c.op === '!=') return !same(have, want);
          if (c.op === '~') return String(have == null ? '' : have).toLowerCase().indexOf(String(want).toLowerCase()) > -1;
          var a = +have, b = +want;
          return c.op === '>' ? a > b : c.op === '<' ? a < b : c.op === '>=' ? a >= b : a <= b;
        });
      });
    }
    var q = el.getAttribute('data-pf-search');
    if (q) {
      var parts = q.split(':'), term = String(S[parts[0].replace(/^@/, '').trim()] || '').toLowerCase().trim();
      var fields = parts[1] ? parts[1].trim().split(/[\s,]+/) : null;
      if (term) items = items.filter(function (r) {
        var keys = fields || Object.keys(r.item);
        return keys.some(function (k) { var v = field(r.item, k); return v != null && String(v).toLowerCase().indexOf(term) > -1; });
      });
    }
    var sortKey = el.getAttribute('data-pf-sort');
    if (sortKey) {
      var by = String(value(sortKey) || '');
      if (by) {
        var desc = by[0] === '-', k = by.replace(/^[-+]/, '');
        items.sort(function (x, y) {
          var a = field(x.item, k), b = field(y.item, k);
          var r = (typeof a === 'number' && typeof b === 'number') ? a - b : String(a == null ? '' : a).localeCompare(String(b == null ? '' : b), undefined, { numeric: true });
          return desc ? -r : r;
        });
      }
    }
    return items;
  }
  function renderList(el) {
    var name = el.getAttribute('data-pf-list');
    var tpl = el.querySelector(':scope > template');
    if (!tpl) { fail('data-pf-list="' + name + '" has no <template> child'); return; }
    var items = filtered(el, name);
    /* the counts, for empty and no-results states: count.<name> and total.<name> — or, for a
       second list of the same rows (a dialog's one row), its own data-pf-count key */
    var key = el.getAttribute('data-pf-count') || (counted[name] ? null : name);
    if (key) {
      counted[name] = true;
      set('total.' + key, rows(name).length, true);
      set('count.' + key, items.length, true);
    }
    var sig = JSON.stringify(items.map(function (r) { return [r.index, r.item]; }));
    if (el.__pfSig === sig) return;
    el.__pfSig = sig;
    Array.prototype.slice.call(el.children).forEach(function (c) { if (c.__pfItem) c.remove(); });
    var frag = document.createDocumentFragment();
    items.forEach(function (r, n) {
      var clone = tpl.content.cloneNode(true);
      Array.prototype.forEach.call(clone.children, function (c) { c.__pfItem = { item: r.item, index: n, source: r.index, list: name }; c.setAttribute('data-pf-item', name + ':' + r.index); });
      frag.appendChild(clone);
    });
    el.insertBefore(frag, tpl);
  }
  /* skeleton rows: the list's own row, filled like a real one (its first row's shape), then
     every text a bar of its length and every control a block of its size — so they follow the
     row's columns, whatever the row is */
  function renderSkeleton(el) {
    if (el.__pfSkel) return;
    var name = el.getAttribute('data-pf-skeleton');
    var target = document.querySelector('[data-pf-list="' + name + '"]');
    var tpl = target && target.querySelector(':scope > template');
    if (!tpl) { fail('data-pf-skeleton="' + name + '": no such list'); return; }
    var all = rows(name);
    if (!all.length) { var raw = LIVE[name] || []; all = Array.isArray(raw) ? raw : (raw.many || raw[Object.keys(raw)[0]] || []); }   /* the shape of a row even when the list is empty */
    var sample = (all.filter(function (r) { return !r.status || r.status === 'open'; })[0]) || all[0] || {};
    var n = +(el.getAttribute('data-pf-rows') || 5);
    for (var i = 0; i < n; i++) {
      var frag = tpl.content.cloneNode(true), tops = Array.prototype.slice.call(frag.children);
      tops.forEach(function (c) { c.__pfItem = { item: sample, index: i, list: name }; });
      Array.prototype.forEach.call(frag.querySelectorAll(BIND), function (e) { bind(e, { item: sample, index: i, list: name }); });
      tops.forEach(function (c) { if (c.matches(BIND)) bind(c, { item: sample, index: i, list: name }); });
      Array.prototype.forEach.call(frag.querySelectorAll('*'), function (e) {
        if (e.__pfHidden) { e.remove(); return; }
        Array.prototype.slice.call(e.attributes).forEach(function (at) { if (/^data-pf-/.test(at.name)) e.removeAttribute(at.name); });
      });
      Array.prototype.forEach.call(frag.querySelectorAll('i.pfk-riyal, svg[data-pf-riyal], svg.pfk-icon, .pfk-icon'), function (e) { e.remove(); });
      Array.prototype.forEach.call(frag.querySelectorAll('button, [role=button], a, .pfk-btn, .wf-btn'), function (e) {
        var bar = document.createElement('span');
        bar.className = 'pfk-skel pfk-skel--block';
        bar.style.cssText = 'display:inline-block;width:' + Math.min(220, Math.max(64, (e.textContent || '').trim().length * 8)) + 'px;height:36px';
        e.replaceWith(bar);
      });
      var walker = document.createTreeWalker(frag, NodeFilter.SHOW_TEXT), texts = [];
      for (var t = walker.nextNode(); t; t = walker.nextNode()) if (t.textContent.trim()) texts.push(t);
      texts.forEach(function (t) {
        var bar = document.createElement('span');
        bar.className = 'pfk-skel';
        bar.style.width = Math.min(180, Math.max(24, t.textContent.trim().length * 7)) + 'px';
        t.replaceWith(bar);
      });
      tops.forEach(function (c) { delete c.__pfItem; c.removeAttribute('data-pf-item'); c.setAttribute('data-pf-skeleton-row', ''); c.setAttribute('aria-hidden', 'true'); });
      el.appendChild(frag);
    }
    el.__pfSkel = true;
  }

  /* ── bindings ────────────────────────────────────────────────────────── */
  function scopeOf(el) {
    for (var e = el; e && e !== document; e = e.parentNode) if (e.__pfItem) return e.__pfItem;
    return null;
  }
  function show(el, on) {
    if (on) {
      if (el.__pfHidden) { el.style.removeProperty('display'); if (el.__pfDisplay) el.style.setProperty('display', el.__pfDisplay[0], el.__pfDisplay[1]); el.__pfHidden = false; }
    } else if (!el.__pfHidden) {
      var d = el.style.getPropertyValue('display');
      el.__pfDisplay = d ? [d, el.style.getPropertyPriority('display')] : null;
      el.style.setProperty('display', 'none', 'important');
      el.__pfHidden = true;
    }
  }
  var fmt = {
    n: function (v) { return v === '' || v == null || isNaN(+v) ? v : (+v).toLocaleString('en-US'); },
    upper: function (v) { return String(v).toUpperCase(); },
  };
  var BIND = '[data-pf-show],[data-pf-text],[data-pf-class],[data-pf-attr],[data-pf-value],[data-pf-overlay],[data-pf-menu-panel]';
  function render() {
    rendering = true;
    try {
      for (var pass = 0; pass < 3 && dirty; pass++) {
        dirty = false;
        counted = {};
        Array.prototype.forEach.call(document.querySelectorAll('[data-pf-list]'), function (el) { if (!el.closest('template')) renderList(el); });
        Array.prototype.forEach.call(document.querySelectorAll('[data-pf-skeleton]'), function (el) { if (!el.closest('template')) renderSkeleton(el); });
        Array.prototype.forEach.call(document.querySelectorAll(BIND), function (el) {
          if (el.closest('template') || el.closest('[data-pf-skeleton-row]')) return;
          bind(el, scopeOf(el));
        });
      }
    } catch (e) { fail('render: ' + e.message); }
    rendering = false;
    post({ pf: 'state', state: snapshot() });
  }
  function bind(el, scope) {
          var a;
          if ((a = el.getAttribute('data-pf-overlay')) !== null) show(el, same(S.overlay, a) && !!a);
          if ((a = el.getAttribute('data-pf-menu-panel')) !== null) show(el, same(S.menu, a) && !!a);
          if ((a = el.getAttribute('data-pf-show')) !== null) show(el, evaluate(a, scope));
          if ((a = el.getAttribute('data-pf-text')) !== null) {
            var v = value(a[0] === '@' || a[0] === '$' || a[0] === '{' ? a : '@' + a, scope);
            var f = el.getAttribute('data-pf-fmt');
            if (v === undefined || v === null || v === '') v = el.getAttribute('data-pf-default') || '';
            else if (f && fmt[f]) v = fmt[f](v);
            if (el.textContent !== String(v)) el.textContent = String(v);
          }
          if ((a = el.getAttribute('data-pf-class')) !== null) pairs(a).forEach(function (p) {
            p[0].split(/\s+/).forEach(function (c) { if (c) el.classList.toggle(c, evaluate(p[1], scope)); });
          });
          if ((a = el.getAttribute('data-pf-attr')) !== null) pairs(a).forEach(function (p) {
            var on = evaluate(p[1], scope);
            if (on) el.setAttribute(p[0], p[0] === 'aria-disabled' || p[0] === 'aria-selected' || p[0] === 'aria-pressed' ? 'true' : '');
            else el.removeAttribute(p[0]);
          });
          if ((a = el.getAttribute('data-pf-value')) !== null && document.activeElement !== el) {
            var cur = S[a.replace(/^@/, '')];
            if (el.type === 'checkbox') el.checked = truthy(cur);
            else if (el.value !== String(cur == null ? '' : cur)) el.value = cur == null ? '' : cur;
          }
  }

  /* ── actions ─────────────────────────────────────────────────────────── */
  function applyPairs(src, scope) { pairs(src).forEach(function (p) { set(p[0], value(p[1], scope)); }); }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, fast ? 0 : ms); }); }
  function listWhere(name, where, fn) {
    var raw = LIVE[name];
    if (!raw) { fail('action: no list "' + name + '"'); return; }
    var arr = Array.isArray(raw) ? raw : rows(name);
    arr.forEach(function (item, index) { if (evaluate(where || 'true', { item: item, index: index })) fn(item, index, arr); });
  }
  function steps(list, scope) {
    var chain = Promise.resolve();
    (list || []).forEach(function (st) {
      chain = chain.then(function () { return step(st, scope); });
    });
    return chain;
  }
  function step(st, scope) {
    if (typeof st === 'string') {
      if (ACTIONS[st]) return steps(ACTIONS[st], scope);
      return (applyPairs(st, scope), undefined);
    }
    if (st.set) Object.keys(st.set).forEach(function (k) { set(k, typeof st.set[k] === 'string' ? value(st.set[k], scope) : st.set[k]); });
    if (st.open !== undefined) set('overlay', st.open);
    if (st.close) { set('overlay', ''); set('menu', ''); }
    if (st.toast) toast(st.toast, scope);
    if (st.update) listWhere(st.update, st.where, function (item) {
      var w = st.with || {};
      Object.keys(w).forEach(function (k) { item[k] = typeof w[k] === 'string' ? value(w[k], scope) : w[k]; });
    });
    if (st.remove) {
      var gone = [];
      listWhere(st.remove, st.where, function (item) { gone.push(item); });
      var arr0 = rows(st.remove);
      gone.forEach(function (item) { var i = arr0.indexOf(item); if (i > -1) arr0.splice(i, 1); });
    }
    if (st.add) {
      var arr = rows(st.add);
      if (LIVE[st.add] === undefined) fail('action: no list "' + st.add + '"');
      else arr[st.at === 'end' ? 'push' : 'unshift'](JSON.parse(JSON.stringify(st.item || {})));
    }
    if (st.update || st.remove || st.add) Array.prototype.forEach.call(document.querySelectorAll('[data-pf-list]'), function (el) { el.__pfSig = null; });
    schedule();
    if (st.if !== undefined) return steps(evaluate(st.if, scope) ? st.then : st.else, scope);
    if (st.do) return steps(ACTIONS[st.do] || (fail('action "' + st.do + '" is not in pf-actions'), []), scope);
    if (st.page) { page(st.page); return; }
    if (st.go) { post({ pf: 'go', state: st.go }); return; }
    if (st.wait) return wait(st.wait);
  }
  function run(el, e) {
    var scope = scopeOf(el), a;
    if ((a = el.getAttribute('data-pf-set')) !== null) applyPairs(a, scope);
    if ((a = el.getAttribute('data-pf-toggle')) !== null) a.split(/[\s,]+/).forEach(function (k) { if (k) set(k, !truthy(S[k])); });
    if ((a = el.getAttribute('data-pf-menu')) !== null) set('menu', same(S.menu, a) ? '' : a);
    if ((a = el.getAttribute('data-pf-open')) !== null) { set('overlay', a); set('menu', ''); }
    if (el.hasAttribute('data-pf-close')) { if (S.menu) set('menu', ''); else set('overlay', ''); }
    if ((a = el.getAttribute('data-pf-toast')) !== null) toast(a, scope);
    if ((a = el.getAttribute('data-pf-href')) !== null) toast('Opens ' + a.replace(/^https?:\/\//, '').replace(/\/$/, '') + ', outside the prototype', scope);
    var go = el.getAttribute('data-pf-go');
    if (go) { if (/\.html($|[?#])/.test(go)) shell(go, el); else post({ pf: 'go', state: go }); }
    if ((a = el.getAttribute('data-pf-page')) !== null) page(value(a, scope) || a);
    if ((a = el.getAttribute('data-pf-do')) !== null) return steps(a.split(/[\s,]+/).filter(Boolean).map(function (n) { return ACTIONS[n] ? { do: n } : (fail('data-pf-do="' + n + '": no such action in pf-actions'), {}); }), scope);
    return Promise.resolve();
  }
  var ACT = '[data-pf-set],[data-pf-toggle],[data-pf-menu],[data-pf-open],[data-pf-close],[data-pf-toast],[data-pf-href],[data-pf-go],[data-pf-page],[data-pf-do]';
  function disabled(el) {
    for (var e = el; e && e.nodeType === 1; e = e.parentElement) {
      if (e.hasAttribute('disabled') || e.getAttribute('aria-disabled') === 'true') return true;
      if (e.hasAttribute('data-pf-item') || e.hasAttribute('data-pf-list')) break;
    }
    return false;
  }
  document.addEventListener('click', function (e) {
    var t = e.target.nodeType === 1 ? e.target : e.target.parentElement;
    if (!t) return;
    var el = t.closest(ACT);
    /* a click outside an open menu closes it (its own trigger toggles it) */
    if (S.menu && !t.closest('[data-pf-menu-panel="' + S.menu + '"]') && !(el && el.hasAttribute('data-pf-menu'))) set('menu', '');
    if (closeShellOnOutside(t)) { e.preventDefault(); return; }
    /* a scrim: a click on the backdrop itself (not what sits on it) closes the menu or overlay */
    if (t.hasAttribute('data-pf-scrim')) { e.preventDefault(); if (S.menu) set('menu', ''); else set('overlay', ''); return; }
    if (el && !disabled(el)) {
      e.preventDefault(); e.stopPropagation();
      var ms = +(el.getAttribute('data-pf-busy') || 0);
      if (ms && !fast) {
        if (el.__pfBusy) return;
        el.__pfBusy = true; el.classList.add('pfk-busy', 'pf-btn-loading'); el.setAttribute('aria-busy', 'true');
        setTimeout(function () { el.__pfBusy = false; el.classList.remove('pfk-busy', 'pf-btn-loading'); el.removeAttribute('aria-busy'); run(el, e); }, ms);
      } else run(el, e);
      return;
    }
    if (el) return;                                  // disabled: nothing happens, as in the product
    if (shellClick(t, e)) return;
    var a = t.closest('a[href]');
    if (a) { e.preventDefault(); linkOut(a); return; }
    var looks = t.closest('button, [role=button], [role=tab], [role=menuitem], [role=option], [role=switch], [role=checkbox], .pf-btn');
    if (looks && !disabled(looks) && !looks.closest('[data-pf-inert]')) {
      var label = (looks.getAttribute('aria-label') || looks.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 40);
      dead.push(label || looks.tagName.toLowerCase());
      toast('“' + (label || 'This control') + '” is not wired in this prototype');
    }
  }, true);
  document.addEventListener('input', function (e) {
    var el = e.target, k = el.getAttribute && el.getAttribute('data-pf-value');
    if (k === null || k === undefined) return;
    k = k.replace(/^@/, '');
    clearTimeout(el.__pfT);
    el.__pfT = setTimeout(function () { set(k, el.type === 'checkbox' ? el.checked : el.type === 'number' ? literal(el.value) : el.value); }, fast ? 0 : 120);
  }, true);
  document.addEventListener('change', function (e) {
    var el = e.target, k = el.getAttribute && el.getAttribute('data-pf-value');
    if (k) set(k.replace(/^@/, ''), el.type === 'checkbox' ? el.checked : el.value);
  }, true);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (closeShell()) return;
      if (S.menu) set('menu', ''); else if (S.overlay) set('overlay', '');
    } else if ((e.key === 'm' || e.key === 'M') && !/input|textarea|select/i.test((e.target.tagName || ''))) post({ pf: 'platform' });
  });

  /* ── toasts ──────────────────────────────────────────────────────────── */
  function toast(what, scope) {
    var host = document.getElementById('pfk-toasts');
    if (!host) {
      host = document.createElement('div');
      host.id = 'pfk-toasts';
      host.className = 'pfk-toasts';
      host.setAttribute('role', 'status');
      document.body.appendChild(host);
    }
    var tpl = document.querySelector('template[data-pf-toast="' + what + '"]'), node;
    if (tpl) {
      node = document.createElement('div');
      node.appendChild(tpl.content.cloneNode(true));
      node.__pfItem = scope || null;
    } else {
      node = document.createElement('div');
      node.className = 'pfk-toast';
      node.textContent = what;
    }
    host.appendChild(node);
    schedule();
    setTimeout(function () { node.classList.add('pfk-toast--out'); setTimeout(function () { node.remove(); }, 240); }, fast ? 3200 : 3000);
  }

  /* ── pages: another screen of the prototype, or a compiled product page ── */
  function page(to) {
    if (!to) return;
    if (inFrame) post({ pf: 'page', to: String(to), state: snapshot() });
    else toast('Opens ' + to + ' in the bundled prototype');
  }
  function linkOut(a) {
    var href = a.getAttribute('href') || '';
    var label = (a.textContent || '').replace(/\s+/g, ' ').trim();
    var route = (BOOT.labels || {})[label];
    if (route) return page(route);
    if (/^https?:/.test(href)) return toast('Opens ' + href.replace(/^https?:\/\//, '').split('/')[0] + ', outside the prototype');
    if (/^\//.test(href)) return page(href);
    toast('“' + (label || href) + '” is not part of this prototype');
  }

  /* ── the shell: rail and header, the product's own ───────────────────── */
  var shellOpen = null;        // {nodes: [...], path}
  var railSaved = null;
  function railKey(li) {
    var id = li.getAttribute('data-menu-id') || '';
    return id.replace(/^rc-menu-uuid-\d+-\d+-/, '');
  }
  /* the header's links that leave the product: where they go */
  var SHELL_OUT = { 'Download App': 'Opens the Profolio app in the App Store or Google Play', 'Go to Bayut.sa': 'Opens bayut.sa in a new tab', 'Help & Support': 'Opens Help & Support' };
  function shellClick(t, e) {
    var sh = t.closest('[data-pf-shell-root], .pf-layout-header, .pf-layout-sider');
    if (sh) {
      var c = t.closest('button, a, [role=button], [role=menuitem], li, div');
      for (var n = t; n && n !== sh; n = n.parentElement) {
        var lab = (n.textContent || '').replace(/\s+/g, ' ').trim();
        if (SHELL_OUT[lab]) { e.preventDefault(); e.stopPropagation(); toast(SHELL_OUT[lab] + ' — outside the prototype'); return true; }
        if (lab.length > 40) break;
      }
    }
    var li = t.closest('[data-menu-id]');
    if (li && li.closest('.pf-layout-sider, [data-pf-rail]')) {
      e.preventDefault(); e.stopPropagation();
      var key = railKey(li), label = (li.getAttribute('title') || li.textContent || '').replace(/\s+/g, ' ').trim();
      var route = (BOOT.menu || {})[key] || (BOOT.labels || {})[label];
      if (route) page(route); else toast('“' + label + '” is not part of this prototype');
      return true;
    }
    return false;
  }
  function request(path) {
    return new Promise(function (resolve) {
      if (!inFrame) {
        fetch(path).then(function (r) { return r.ok ? r.text() : ''; }).then(resolve, function () { resolve(''); });
        return;
      }
      var id = Math.random().toString(36).slice(2);
      function on(ev) {
        var m = ev.data;
        if (!m || m.pf !== 'file' || m.id !== id) return;
        window.removeEventListener('message', on);
        resolve(m.html || '');
      }
      window.addEventListener('message', on);
      post({ pf: 'file', id: id, path: path, from: BOOT.file || '' });
      setTimeout(function () { window.removeEventListener('message', on); resolve(''); }, 4000);
    });
  }
  var OVERLAY = '.pf-popover, .pf-dropdown, .pf-drawer, .pf-modal-root, .pf-modal-wrap, .pf-modal-mask, .pf-tooltip, .pf-picker-dropdown, .pf-select-dropdown, [class*="menu-positioner"], .pf-body-scrim--v2, .pf-rail-scrim, [data-pf-overlay-root]';
  function sig(el) { return el.tagName + '.' + String(el.className || '').split(/\s+/).sort().join('.'); }
  function shell(path, trigger) {
    if (/rail-expanded/.test(path)) { toggleRail(path); return; }
    if (shellOpen && shellOpen.path === path) { closeShell(); return; }
    closeShell();
    request(path).then(function (html) {
      if (!html) { toast('This opens a screen that is not part of this prototype'); return; }
      var doc = new DOMParser().parseFromString(html, 'text/html');
      var have = {};
      Array.prototype.forEach.call(document.querySelectorAll(OVERLAY), function (e) { have[sig(e) + '|' + (e.textContent || '').length] = true; });
      var found = Array.prototype.filter.call(doc.querySelectorAll(OVERLAY), function (e) {
        if (e.parentElement && e.parentElement.closest(OVERLAY)) return false;
        return !have[sig(e) + '|' + (e.textContent || '').length];
      });
      if (!found.length) { toast('Nothing opens here in this prototype'); return; }
      var nodes = found.map(function (e) {
        /* the overlay goes where it sits in the product: under the nearest ancestor this screen
           also has (by id, or by a class list only one element here carries), inside copies of
           the plain wrappers between — they may position it */
        var chain = [], p = e.parentElement, host = null;
        for (; p && p.tagName !== 'BODY' && p.tagName !== 'HTML'; p = p.parentElement) {
          host = p.id ? document.getElementById(p.id) : null;
          if (!host && p.classList.length) {
            var sel = p.tagName.toLowerCase() + Array.prototype.map.call(p.classList, function (c) { return '.' + (window.CSS && CSS.escape ? CSS.escape(c) : c); }).join('');
            var all = document.querySelectorAll(sel);
            host = all.length === 1 && !all[0].closest('[data-pf-list]') ? all[0] : null;
          }
          if (host) break;
          chain.unshift(p);
        }
        host = host || document.body;
        var top = null;
        chain.forEach(function (w) { var c = document.importNode(w, false); c.setAttribute('data-pf-shell-open', ''); host.appendChild(c); if (!top) top = c; host = c; });
        var n = document.importNode(e, true);
        n.setAttribute('data-pf-shell-open', '');
        host.appendChild(n);
        return top || n;
      });
      Array.prototype.forEach.call(document.querySelectorAll('[data-pf-shell-open] [data-pf-go]'), function (n) { n.removeAttribute('data-pf-go'); });
      shellOpen = { nodes: nodes, path: path, trigger: trigger };
    });
  }
  function closeShell() {
    if (!shellOpen) return false;
    shellOpen.nodes.forEach(function (n) { n.remove(); });
    shellOpen = null;
    return true;
  }
  function closeShellOnOutside(t) {
    if (!shellOpen) return false;
    if (shellOpen.trigger && shellOpen.trigger.contains(t)) return false;
    var inside = shellOpen.nodes.some(function (n) { return n.contains(t) && !/scrim|mask/.test(String(t.className || '')); });
    if (inside) {
      var closeBtn = t.closest('.pf-modal-close, .pf-drawer-close, [aria-label="Close"], [aria-label="close"]');
      if (closeBtn) { closeShell(); return true; }
      return false;
    }
    closeShell();
    return true;
  }
  function toggleRail(path) {
    var rail = document.querySelector('.pf-layout-sider');
    if (!rail) return;
    if (railSaved) { rail.replaceWith(railSaved); railSaved = null; return; }
    request(path).then(function (html) {
      if (!html) return;
      var doc = new DOMParser().parseFromString(html, 'text/html');
      var wide = doc.querySelector('.pf-layout-sider');
      if (!wide) return;
      var fresh = document.importNode(wide, true);
      /* the selected item and any item this design added stay as they are here */
      var mine = {};
      Array.prototype.forEach.call(rail.querySelectorAll('[data-menu-id]'), function (li) { mine[railKey(li)] = li; });
      var theirs = {};
      Array.prototype.forEach.call(fresh.querySelectorAll('[data-menu-id]'), function (li) {
        var k = railKey(li); theirs[k] = li;
        li.classList.toggle('pf-menu-item-selected', !!(mine[k] && mine[k].classList.contains('pf-menu-item-selected')));
      });
      var prev = null;
      Array.prototype.forEach.call(rail.querySelectorAll('[data-menu-id]'), function (li) {
        var k = railKey(li);
        if (!theirs[k]) {
          var add = li.cloneNode(true);
          if (prev && prev.parentNode) prev.parentNode.insertBefore(add, prev.nextSibling);
          prev = add;
        } else prev = theirs[k];
      });
      Array.prototype.forEach.call(fresh.querySelectorAll('[data-pf-go*="rail-expanded"]'), function (b) { b.setAttribute('data-pf-go', path); });
      railSaved = rail;
      rail.replaceWith(fresh);
      fresh.addEventListener('mouseleave', function () { if (railSaved && fresh.isConnected) { fresh.replaceWith(railSaved); railSaved = null; } });
    });
  }
  /* the product opens the rail on hover */
  document.addEventListener('mouseover', function (e) {
    var rail = e.target.closest && e.target.closest('.pf-layout-sider');
    if (!rail || railSaved || rail.__pfHover) return;
    var btn = rail.querySelector('[data-pf-go*="rail-expanded"]');
    if (btn) { rail.__pfHover = true; setTimeout(function () { rail.__pfHover = false; }, 400); toggleRail(btn.getAttribute('data-pf-go')); }
  });
  /* tooltips the product shows on hover: a data-pf-go to a …/tooltip-… state */
  document.addEventListener('mouseover', function (e) {
    var t = e.target.closest && e.target.closest('[data-pf-go*="tooltip-"]');
    if (t && (!shellOpen || shellOpen.trigger !== t)) { shell(t.getAttribute('data-pf-go'), t); t.addEventListener('mouseleave', function out() { t.removeEventListener('mouseleave', out); if (shellOpen && shellOpen.trigger === t) closeShell(); }); }
  });

  /* ── boot ────────────────────────────────────────────────────────────── */
  function json(id) {
    var out = {};
    Array.prototype.forEach.call(document.querySelectorAll('script[type="application/json"]#' + id + ', script[type="application/json"][data-pf="' + id.replace(/^pf-/, '') + '"]'), function (s) {
      try { var o = JSON.parse(s.textContent || '{}'); Object.keys(o).forEach(function (k) { out[k] = o[k]; }); } catch (e) { fail(id + ' is not valid JSON: ' + e.message); }
    });
    return out;
  }
  function reset() {
    S = JSON.parse(JSON.stringify(INIT));
    LIVE = JSON.parse(JSON.stringify(RAW));
    if (S.overlay === undefined) S.overlay = '';
    if (S.menu === undefined) S.menu = '';
    Array.prototype.forEach.call(document.querySelectorAll('[data-pf-list]'), function (el) { el.__pfSig = null; });
  }
  /* a named state: {set: {…}, do: [steps]} — from the start, without waiting */
  function apply(state, carry) {
    closeShell();
    var toasts = document.getElementById('pfk-toasts');
    if (toasts) toasts.textContent = '';                     /* a state starts clean: no toast from the last one */
    reset();
    if (carry) Object.keys(carry).forEach(function (k) { if (!/^(count|total)\./.test(k) && k !== 'overlay' && k !== 'menu') S[k] = carry[k]; });
    state = state || {};
    Object.keys(state.set || {}).forEach(function (k) { S[k] = state.set[k]; });
    dirty = true; render();
    fast = true;
    return steps([].concat(state.do || []).map(function (d) { return typeof d === 'string' && ACTIONS[d] ? { do: d } : d; })).then(function () {
      fast = false; dirty = true; render();
    }, function (e) { fast = false; fail('state: ' + e.message); });
  }
  function boot() {
    INIT = json('pf-state');
    RAW = json('pf-data');
    ACTIONS = json('pf-actions');
    reset();
    var start = BOOT.state ? apply(BOOT.state, BOOT.carry) : (dirty = true, render(), Promise.resolve());
    start.then(function () { post({ pf: 'ready', screen: BOOT.screen || '', state: snapshot(), errors: errors }); });
  }
  window.addEventListener('message', function (ev) {
    var m = ev.data;
    if (!m || !m.pf) return;
    if (m.pf === 'apply') apply(m.state, m.carry).then(function () { post({ pf: 'applied', id: m.id, state: snapshot(), errors: errors }); });
    else if (m.pf === 'set') { set(m.key, m.value); }
    else if (m.pf === 'qa') {
      var go = function () { Promise.resolve(window.pfQA ? window.pfQA(m.options || {}) : { issues: [], note: 'qa.js is not loaded' }).then(function (r) { r.errors = errors.slice(); r.dead = dead.slice(); post({ pf: 'qa', id: m.id, result: r }); }); };
      setTimeout(go, m.delay || 60);
    }
  });

  window.pf = {
    version: '2.0',
    shellOut: SHELL_OUT,
    get: function (k) { return k ? S[k] : snapshot(); },
    set: function (k, v) { set(k, v); },
    apply: apply,
    run: function (name) { return steps([{ do: name }]); },
    toast: toast,
    errors: errors,
    dead: dead,
    evaluate: evaluate,
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
