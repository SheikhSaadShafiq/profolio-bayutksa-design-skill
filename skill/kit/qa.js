/* Profolio KSA Design QA, inside a screen (kit/qa.js). window.pfQA(options) measures the
   rendered screen and returns { issues: [{ level, check, message, box }], stats }. Every
   number it reports is measured.

   A headless run calls it for every state, web and phone: qa/prototype.mjs, before a
   prototype is delivered. In the player it runs on the state on screen (the QA button).
   { draw: true } also outlines each issue on the screen.

   Checks:
     align     a column's header does not line up with its cells (any edge, > 2 px)
     controls  a button is not the height of the other buttons in its column (> 4 px), or is squashed
     overlap   two pieces of visible text overlap
     clip      text cut by its box, with no ellipsis
     fonts     a web font the page uses is missing, or did not load
     images    an image that did not load
     dead      a control that does nothing: not wired (data-pf-*), not the shell's, not data-pf-inert
     overflow  the page is wider than its viewport
     currency  "SAR", "ر.س" or U+20C1 beside a number, or the 2.0 handover's rough riyal sketch
     vars      an inline var(--x) with no value and no fallback
     skeleton  a loading skeleton whose blocks don't follow the columns of the table above it
     spacing   a button's label split into flex items, the gap between every word
     rows      (warning) cells of one row aligned differently: some top, some centre
     targets   (warning, phone) a control smaller than the build's 32 px (the platforms ask 44)
     small     (warning) visible text under 11 px */
(function () {
  'use strict';
  var SYSTEM = /^(system-ui|-apple-system|blinkmacsystemfont|segoe ui|roboto|helvetica neue|helvetica|arial|sans-serif|serif|monospace|times|times new roman|georgia|courier|courier new|menlo|monaco|apple color emoji|segoe ui emoji|noto color emoji|inherit|initial|cursive|fantasy|ui-sans-serif|ui-monospace)$/i;
  var ACT = '[data-pf-set],[data-pf-toggle],[data-pf-menu],[data-pf-open],[data-pf-close],[data-pf-toast],[data-pf-href],[data-pf-go],[data-pf-page],[data-pf-do],[data-pf-value],[data-pf-inert]';

  function cs(e) { return getComputedStyle(e); }
  function rect(e) { var r = e.getBoundingClientRect(); return { x: Math.round(r.left + scrollX), y: Math.round(r.top + scrollY), w: Math.round(r.width), h: Math.round(r.height) }; }
  function shown(e) {
    for (var n = e; n && n.nodeType === 1; n = n.parentElement) {
      var s = cs(n);
      if (s.display === 'none' || s.visibility === 'hidden' || +s.opacity === 0) return false;
    }
    var r = e.getBoundingClientRect();
    return r.width > 0.5 && r.height > 0.5 && r.right > 0 && r.bottom > 0 && r.left < innerWidth + 2;
  }
  function label(e) {
    var t = (e.textContent || '').replace(/\s+/g, ' ').trim() || (e.getAttribute && (e.getAttribute('aria-label') || e.getAttribute('title'))) || '';
    t = t.replace(/\s+/g, ' ').trim();
    return t.length > 40 ? t.slice(0, 38) + '…' : t;
  }
  /* the box of what an element draws: its text, its images and icons, and any box that draws
     itself inside it (a button, a pill, an icon drawn as a box) — whole, not its label */
  function content(el) {
    var box = null, range = document.createRange();
    function add(r) {
      if (!r || r.width < 0.5 || r.height < 0.5) return;
      box = box ? { l: Math.min(box.l, r.left), r: Math.max(box.r, r.right), t: Math.min(box.t, r.top), b: Math.max(box.b, r.bottom) } : { l: r.left, r: r.right, t: r.top, b: r.bottom };
    }
    var cell = el.getBoundingClientRect();
    var walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, {
      acceptNode: function (n) {
        if (n.nodeType === 1) {
          var s = cs(n);
          if (s.display === 'none' || s.visibility === 'hidden' || +s.opacity === 0) return NodeFilter.FILTER_REJECT;
          if (/^(IMG|SVG|svg|INPUT|SELECT|TEXTAREA|CANVAS|VIDEO|BUTTON|I)$/.test(n.tagName)) return NodeFilter.FILTER_ACCEPT;
          var r = n.getBoundingClientRect();
          if (ownPaint(n) && r.width < cell.width * 0.95 && r.height < 120) return NodeFilter.FILTER_ACCEPT;
          return NodeFilter.FILTER_SKIP;
        }
        return n.textContent.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
      },
    });
    for (var n = walk.nextNode(); n; n = walk.nextNode()) {
      if (n.nodeType === 3) { range.selectNodeContents(n); Array.prototype.forEach.call(range.getClientRects(), add); }
      else {
        add(n.getBoundingClientRect());
        var last = n;                                             /* the box counts whole: go on after what is inside it */
        while (last.lastChild) last = last.lastChild;
        walk.currentNode = last;
      }
    }
    return box;
  }
  function median(xs) { var s = xs.slice().sort(function (a, b) { return a - b; }); return s.length ? s[Math.floor(s.length / 2)] : 0; }
  function painted(e) {
    for (var i = 0, n = e; n && i < 4; i++, n = n.parentElement) {
      var s = cs(n);
      if (s.backgroundColor !== 'rgba(0, 0, 0, 0)' && s.backgroundColor !== 'transparent') return n;
      if (parseFloat(s.borderTopWidth) > 0 && s.borderTopStyle !== 'none') return n;
      if (s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0) return n;
      if (s.boxShadow && s.boxShadow !== 'none') return n;
      if (n.hasAttribute && n.hasAttribute('data-pf-item')) break;
    }
    return null;
  }

  var SHELL = '[data-pf-shell-root], [data-pf-shell], .pf-layout-sider, .pf-layout-header, [data-pf-rail]';
  function inShell(e) { return !!(e && e.closest && e.closest(SHELL)); }
  function bgOf(e) { for (var n = e; n && n.nodeType === 1; n = n.parentElement) { var b = cs(n).backgroundColor; if (b !== 'rgba(0, 0, 0, 0)' && b !== 'transparent') return b; } return 'rgb(255, 255, 255)'; }
  /* a box that draws itself: a fill unlike what is behind it, a border or an outline */
  function ownPaint(e) {
    var s = cs(e), b = s.backgroundColor;
    if (b !== 'rgba(0, 0, 0, 0)' && b !== 'transparent' && b !== bgOf(e.parentElement)) return true;
    if (parseFloat(s.borderTopWidth) > 0 && s.borderTopStyle !== 'none' && parseFloat(s.borderBottomWidth) > 0) return true;
    return s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0;
  }
  /* the size of the text an element holds (its biggest), not the font it inherits */
  function textSize(e) {
    var max = 0, w = document.createTreeWalker(e, NodeFilter.SHOW_TEXT);
    for (var n = w.nextNode(); n; n = w.nextNode()) if (n.textContent.trim() && n.parentElement) max = Math.max(max, parseFloat(cs(n.parentElement).fontSize) || 0);
    return max || parseFloat(cs(e).fontSize) || 14;
  }
  /* buttons: the innermost box that draws itself around a short label someone can press */
  function buttonsIn(scope) {
    var all = Array.prototype.filter.call(scope.querySelectorAll('*'), function (e) {
      var t = (e.textContent || '').replace(/\s+/g, ' ').trim();
      if (!t || t.length > 40 || !ownPaint(e) || !shown(e) || inShell(e)) return false;
      if (e.closest('.pfk-pill, [class*="tag"], [class*="badge"], [class*="pill"], .pfk-skel')) return false;
      var br = e.getBoundingClientRect();
      if (br.width < 40 || (textSize(e) <= 12 && br.height <= 22)) return false;   /* a tag or a pill */
      return cs(e).cursor === 'pointer' || /^(BUTTON|A)$/.test(e.tagName) || /button/.test(e.getAttribute('role') || '') ||
        !!e.closest('[data-pf-do],[data-pf-open],[data-pf-page],[data-pf-set],[data-pf-go],[data-pf-toggle],[data-pf-menu]');
    });
    return all.filter(function (e) { return !all.some(function (o) { return o !== e && e.contains(o); }); });   /* the innermost box */
  }
  /* placeholder blocks: light grey, no text — a skeleton, whatever its class */
  function placeholders(scope) {
    function grey(c) { var v = c.split(',').map(function (x) { return +x; }); return Math.max(v[0], v[1], v[2]) - Math.min(v[0], v[1], v[2]) < 12 && v[0] > 200 && v[0] < 252; }
    return Array.prototype.filter.call(scope.querySelectorAll('*'), function (e) {
      if (e.children.length || (e.textContent || '').trim() || /^(svg|SVG|IMG|PATH|path|INPUT)$/.test(e.tagName)) return false;
      if (e.closest('[data-pf-item], .wf-blur, .pfk-teaser, [class*="blur"]') && !e.closest('[data-pf-skeleton-row]')) return false;
      var r = e.getBoundingClientRect();
      if (r.height < 6 || r.height > 140 || r.width < 10 || !shown(e)) return false;
      if (/skel/i.test(String(e.className))) return true;
      var s = cs(e), m = /rgba?\((\d+, \d+, \d+)(?:, ([\d.]+))?\)/.exec(s.backgroundColor);
      if (m && !(m[2] !== undefined && +m[2] < 0.5) && grey(m[1])) return true;
      var g = /gradient/.test(s.backgroundImage) && (s.backgroundImage.match(/rgba?\((\d+, \d+, \d+)/g) || []).map(function (x) { return x.replace(/rgba?\(/, ''); });
      return !!(g && g.length && g.every(grey));
    });
  }
  /* ── tables: rows that share one set of columns ─────────────────────── */
  function tables() {
    var groups = {};
    Array.prototype.forEach.call(document.querySelectorAll('body *'), function (e) {
      var s = cs(e);
      if (s.display !== 'grid' && s.display !== 'inline-grid') return;
      var tracks = s.gridTemplateColumns.split(/\s+(?![^(]*\))/).filter(Boolean);
      if (tracks.length < 3 || e.children.length < 3 || !shown(e)) return;
      var r = e.getBoundingClientRect();
      var key = tracks.map(function (t) { return Math.round(parseFloat(t)); }).join(',') + '@' + Math.round(r.left) + '/' + Math.round(r.width);
      (groups[key] = groups[key] || []).push(e);
    });
    /* flex rows: three or more siblings with the same number of children */
    Array.prototype.forEach.call(document.querySelectorAll('body *'), function (p) {
      var kids = Array.prototype.filter.call(p.children, function (c) { var st = cs(c); return st.display === 'flex' && !/column/.test(st.flexDirection) && c.children.length >= 3 && shown(c); });
      if (kids.length < 3) return;
      var n = kids[0].children.length;
      if (!kids.every(function (k) { return k.children.length === n; })) return;
      var head = null;
      for (var prev = p.previousElementSibling; prev && !head; prev = prev.previousElementSibling) {
        var cand = prev.children.length === n && cs(prev).display === 'flex' ? prev : prev.querySelector && Array.prototype.filter.call(prev.querySelectorAll('*'), function (x) { return x.children.length === n && cs(x).display === 'flex'; })[0];
        if (cand && shown(cand)) head = cand;
      }
      var key = 'flex@' + (head ? 'h' : '') + Math.round(p.getBoundingClientRect().left) + '#' + Array.prototype.indexOf.call(document.querySelectorAll('*'), p);
      groups[key] = (head ? [head] : []).concat(kids);
    });
    return Object.keys(groups).map(function (k) { return groups[k]; }).filter(function (g) { return g.length >= 2; });
  }
  function isHead(row, group) {
    if (row.querySelector('[role=columnheader], .pfk-th, th')) return true;
    if (/thead|table-head|header-row/i.test(row.className)) return true;
    return row === group[0] && !row.querySelector('button, [role=button], img, svg[data-pf-riyal]') && (row.textContent || '').length < 160;
  }
  function edges(cell) { var c = content(cell); return c && { l: c.l, r: c.r, c: (c.l + c.r) / 2, t: c.t, b: c.b }; }

  window.pfQA = function (opt) {
    opt = opt || {};
    var out = [], stats = { tables: 0, controls: 0, texts: 0 };
    var phone = innerWidth < 600;
    function add(level, check, message, el) {
      if (out.some(function (o) { return o.check === check && o.message === message; })) return;
      out.push({ level: level, check: check, message: message, box: el && el.getBoundingClientRect ? rect(el) : null });
      if (opt.draw && el && el.getBoundingClientRect) draw(el, level, out.length);
    }

    /* skeleton: under a column header, the blocks start where the columns start */
    var skelDone = [];
    function checkSkeleton(head) {
      if (skelDone.indexOf(head) > -1) return;
      skelDone.push(head);
      var card = head.parentElement;
      for (var up = 0; card && up < 3 && card.getBoundingClientRect().height < head.getBoundingClientRect().height * 3; up++) card = card.parentElement;
      if (!card) return;
      var hb = head.getBoundingClientRect();
      var blocks = placeholders(card).filter(function (b) { return b.getBoundingClientRect().top > hb.bottom - 2 && !head.contains(b); });
      if (blocks.length < 4) return;
      var starts = Array.prototype.map.call(head.children, function (c) { var e = edges(c); return e ? e.l : c.getBoundingClientRect().left; });
      var lefts = blocks.map(function (b) { return b.getBoundingClientRect().left; });
      var hits = starts.filter(function (x) { return lefts.some(function (l) { return Math.abs(l - x) <= 16; }); }).length;
      if (hits < Math.ceil(starts.length * 0.6)) add('error', 'skeleton', 'The loading skeleton does not follow the table\'s ' + starts.length + ' columns (blocks start under ' + hits + ' of them) — build it from the list\'s own row: data-pf-skeleton', blocks[0]);
    }

    /* align + controls + rows */
    var found = tables();
    /* a column header alone (its rows are not drawn: loading, empty) — checked for the skeleton */
    Array.prototype.forEach.call(document.querySelectorAll('body *'), function (e) {
      var s = cs(e);
      if (s.display !== 'grid' || e.children.length < 3 || !shown(e) || inShell(e)) return;
      var kids = Array.prototype.slice.call(e.children);
      if (!kids.every(function (c) { var t = (c.textContent || '').trim(); return t && t.length < 24 && !c.querySelector('button, input, img'); })) return;
      if (e.getBoundingClientRect().width < 600 || e.getBoundingClientRect().height > 64) return;
      if (found.some(function (g) { return g.indexOf(e) > 0; })) return;
      checkSkeleton(e);
    });
    stats.tables = found.length;
    found.forEach(function (group) {
      var head = isHead(group[0], group) ? group[0] : null;
      var body = group.filter(function (r) { return r !== head; });
      var n = Math.min.apply(null, group.map(function (r) { return r.children.length; }));
      for (var k = 0; k < n; k++) {
        var rowsE = body.map(function (r) { return edges(r.children[k]); }).filter(Boolean);
        if (head && rowsE.length) {
          var h = edges(head.children[k]);
          if (h) {
            /* the column's own alignment, from its cells: the edge they agree on (left for text,
               right for an end column, centre for a centred one); the header is held to that edge */
            var spread = function (k2) { var v = rowsE.map(function (e) { return e[k2]; }); return Math.max.apply(null, v) - Math.min.apply(null, v); };
            var axis = ['l', 'r', 'c'].sort(function (a, b2) { return spread(a) - spread(b2) || (a === 'l' ? -1 : 1); })[0];
            if (rowsE.length < 2) axis = 'l';
            var near = h[axis] - median(rowsE.map(function (e) { return e[axis]; }));
            var edge = axis === 'l' ? 'left edge' : axis === 'r' ? 'right edge' : 'centre';
            if (Math.abs(near) > 2) add('error', 'align', 'Column header “' + label(head.children[k]) + '” sits ' + Math.round(Math.abs(near)) + ' px ' + (near > 0 ? 'right' : 'left') + ' of its column\'s content (the column aligns on its ' + edge + ') — give header and cells one padding and one alignment (kit: .pfk-th / .pfk-td)', head.children[k]);
          }
        }
        /* buttons in one column share a height */
        var btns = [];
        body.forEach(function (r) { var cell = r.children[k]; if (cell) buttonsIn(cell).forEach(function (b) { if (!b.closest('[data-pf-inert]')) btns.push(b); }); });
        if (btns.length >= 2) {
          var hs = btns.map(function (b) { return b.getBoundingClientRect().height; }), mode = median(hs);
          btns.forEach(function (b, i) {
            if (Math.abs(hs[i] - mode) > 4) add('error', 'controls', '“' + label(b) + '” is ' + Math.round(hs[i]) + ' px tall; the other buttons in its column are ' + Math.round(mode) + ' px', b);
          });
        }
      }
      /* rows: one vertical alignment per row */
      var mixed = 0;
      body.slice(0, 8).forEach(function (r) {
        var rr = r.getBoundingClientRect(), tops = [], mids = [];
        Array.prototype.forEach.call(r.children, function (c) { var e = edges(c); if (e) { tops.push(e.t - rr.top); mids.push((e.t + e.b) / 2 - (rr.top + rr.bottom) / 2); } });
        if (tops.length >= 3 && Math.max.apply(null, tops) - Math.min.apply(null, tops) > 6 && Math.max.apply(null, mids) - Math.min.apply(null, mids) > 6) mixed++;
      });
      if (mixed >= 2) add('warn', 'rows', 'Cells in the same row are aligned differently (some top, some centre) — ' + mixed + ' rows; use one alignment (kit rows centre)', body[0]);
      if (head) checkSkeleton(head);
    });

    /* controls: squashed buttons anywhere */
    var controls = Array.prototype.filter.call(document.querySelectorAll('button, [role=button], a[href], [role=tab], [role=menuitem], [role=option], [role=switch], [role=checkbox], select, input, textarea, .pf-btn, [data-pf-do], [data-pf-open], [data-pf-page], [data-pf-set], [data-pf-go], [data-pf-toggle], [data-pf-menu]'), shown);
    Array.prototype.forEach.call(document.querySelectorAll('body *'), function (e) {
      if (controls.length > 4000) return;
      if (cs(e).cursor === 'pointer' && !(e.parentElement && cs(e.parentElement).cursor === 'pointer') && shown(e) && controls.indexOf(e) < 0) controls.push(e);
    });
    stats.controls = controls.length;
    buttonsIn(document.body).forEach(function (p) {
      var r = p.getBoundingClientRect(), fs = textSize(p);
      if (r.height < Math.max(24, fs * 1.6)) add('error', 'controls', '“' + label(p) + '” is squashed: ' + Math.round(r.height) + ' px tall for ' + fs + ' px text', p);
    });
    if (phone) controls.forEach(function (c) {
      var rr = c.getBoundingClientRect();
      if ((rr.width < 32 || rr.height < 32) && rr.width > 0 && !inShell(c)) add('warn', 'targets', '“' + label(c) + '” is ' + Math.round(rr.width) + ' × ' + Math.round(rr.height) + ' px — under the build\'s 32 px on a phone (the platforms ask 44)', c);
    });
    /* dead: looks clickable, does nothing */
    controls.forEach(function (c) {
      if (c.matches('input:not([type=checkbox]):not([type=radio]):not([type=button]):not([type=submit]), textarea') && !c.closest('[data-pf-value]') && !c.hasAttribute('data-pf-value')) {
        if (!c.readOnly && !c.disabled) add('warn', 'dead', 'The field “' + label(c) + '” is not bound (data-pf-value) — what is typed changes nothing', c);
        return;
      }
      if (c.closest(ACT) || c.closest('[disabled], [aria-disabled="true"]')) return;
      if (c.closest('[data-menu-id]') && c.closest('.pf-layout-sider, [data-pf-rail]')) return;
      if (c.closest('a[href]')) return;                                  /* the runtime opens a link's page, or says it leaves */
      if (c.closest('[data-pf-shell-open]')) return;
      if (window.pf && pf.shellOut && inShell(c)) { var lb = label(c); if (Object.keys(pf.shellOut).some(function (k) { return lb.indexOf(k) === 0; })) return; }
      if (c.closest('template')) return;
      var shellPart = c.closest('[data-pf-shell-root], .pf-layout-sider, .pf-layout-header');
      add(shellPart ? 'warn' : 'error', 'dead', '“' + (label(c) || c.tagName.toLowerCase()) + '” looks clickable and does nothing — wire it (data-pf-…) or mark it data-pf-inert="why"', c);
    });

    /* spacing: a button or chip whose words are separate flex items get the gap between each */
    Array.prototype.forEach.call(document.querySelectorAll('button, [role=button], a, .pfk-btn, .wf-btn, [data-pf-do], [data-pf-set], [data-pf-open]'), function (b) {
      var st = cs(b);
      if (!/flex/.test(st.display) || !(parseFloat(st.columnGap) > 0) || !shown(b) || inShell(b)) return;
      /* words: text runs and plain inline elements — a count pill or an icon is its own item */
      var items = Array.prototype.filter.call(b.childNodes, function (n) { return n.nodeType === 3 ? n.textContent.trim() : n.nodeType === 1 && (n.textContent || '').trim() && cs(n).display !== 'none' && !/^(svg|SVG|IMG|I)$/.test(n.tagName) && !ownPaint(n); });
      if (items.length >= 3) add('error', 'spacing', '“' + label(b) + '”: its words are ' + items.length + ' flex items, each ' + st.columnGap + ' apart — wrap the label in one element', b);
    });

    /* text: overlap, clip, small */
    var texts = [], range = document.createRange();
    var walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (var t = walk.nextNode(); t && texts.length < 3000; t = walk.nextNode()) {
      if (!t.textContent.trim() || !t.parentElement || /^(SCRIPT|STYLE|TEMPLATE|NOSCRIPT)$/.test(t.parentElement.tagName) || t.parentElement.closest('template')) continue;
      if (!shown(t.parentElement) || inShell(t.parentElement)) continue;
      range.selectNodeContents(t);
      var r = range.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) continue;
      var cx0 = Math.min(innerWidth - 1, Math.max(0, r.left + r.width / 2)), cy0 = Math.min(innerHeight - 1, Math.max(0, r.top + r.height / 2));
      var top = document.elementFromPoint(cx0, cy0);
      var covered = r.top < innerHeight && r.bottom > 0 && top && !(top === t.parentElement || t.parentElement.contains(top) || top.contains(t.parentElement));
      texts.push({ node: t, el: t.parentElement, r: r, covered: !!covered });
    }
    stats.texts = texts.length;
    var buckets = {};
    texts.forEach(function (x, i) {
      for (var bx = Math.floor(x.r.left / 80); bx <= Math.floor(x.r.right / 80); bx++) for (var by = Math.floor(x.r.top / 40); by <= Math.floor(x.r.bottom / 40); by++) (buckets[bx + ',' + by] = buckets[bx + ',' + by] || []).push(i);
    });
    var seen = {};
    Object.keys(buckets).forEach(function (k) {
      var ids = buckets[k];
      for (var a = 0; a < ids.length; a++) for (var b = a + 1; b < ids.length; b++) {
        var A = texts[ids[a]], B = texts[ids[b]], key = ids[a] + ':' + ids[b];
        if (seen[key]) continue; seen[key] = 1;
        if (A.el === B.el || A.el.contains(B.el) || B.el.contains(A.el) || A.covered || B.covered) continue;
        var w = Math.min(A.r.right, B.r.right) - Math.max(A.r.left, B.r.left), h = Math.min(A.r.bottom, B.r.bottom) - Math.max(A.r.top, B.r.top);
        if (w < 2 || h < 2) continue;
        var area = w * h, small = Math.min(A.r.width * A.r.height, B.r.width * B.r.height);
        if (area < small * 0.3) continue;
        var cx = Math.max(A.r.left, B.r.left) + w / 2, cy = Math.max(A.r.top, B.r.top) + h / 2;
        var hit = document.elementFromPoint(cx, cy);
        if (!hit || !(A.el.contains(hit) || hit.contains(A.el) || B.el.contains(hit) || hit.contains(B.el))) continue;   /* one of them is covered: an overlay, not a clash */
        add('error', 'overlap', '“' + label(A.el) + '” overlaps “' + label(B.el) + '”', A.el);
      }
    });
    var clipped = [];
    texts.forEach(function (x) {
      for (var n = x.el, i = 0; n && i < 3; n = n.parentElement, i++) {
        var s = cs(n);
        if ((s.overflowX === 'hidden' || s.overflowX === 'clip') && n.scrollWidth > n.clientWidth + 1 && s.textOverflow !== 'ellipsis' && clipped.indexOf(n) < 0 && !n.closest('[aria-hidden="true"]')) {
          var box = n.getBoundingClientRect();
          if (x.r.right > box.right + 1 || x.r.left < box.left - 1) { clipped.push(n); add('error', 'clip', 'Text “' + label(n) + '” is cut at ' + Math.round(box.width) + ' px (it needs ' + n.scrollWidth + ')', n); }
          break;
        }
      }
      var fs = parseFloat(cs(x.el).fontSize);
      if (fs < 11 && !x.el.closest('[class*="badge"], [class*="count"], sup, sub')) add('warn', 'small', 'Text “' + label(x.el) + '” is ' + fs + ' px', x.el);
    });

    /* fonts: every web font a visible text uses is present and loaded */
    var fams = {};
    texts.slice(0, 1500).forEach(function (x) { var f = cs(x.el).fontFamily.split(',')[0].replace(/["']/g, '').trim(); if (f && !SYSTEM.test(f)) fams[f] = x.el; });
    var faces = {};
    if (document.fonts) document.fonts.forEach(function (f) { var n = f.family.replace(/["']/g, ''); faces[n] = faces[n] || []; faces[n].push(f.status); });
    Object.keys(fams).forEach(function (f) {
      if (!faces[f]) add('error', 'fonts', 'The font “' + f + '” is used but not included — its @font-face is missing, so text falls back', fams[f]);
      else if (faces[f].indexOf('loaded') < 0) add('error', 'fonts', 'The font “' + f + '” did not load (' + faces[f].join(', ') + ')', fams[f]);
    });

    /* images, overflow, currency, vars */
    Array.prototype.forEach.call(document.images, function (im) { if (im.complete && !im.naturalWidth && shown(im)) add('error', 'images', 'An image did not load: ' + (im.getAttribute('src') || '').slice(0, 60), im); });
    var sw = document.scrollingElement ? document.scrollingElement.scrollWidth : 0;
    if (sw > innerWidth + 1) add('error', 'overflow', 'The page is ' + (sw - innerWidth) + ' px wider than its ' + innerWidth + ' px viewport — it scrolls sideways', document.body);
    texts.forEach(function (x) {
      var s = x.node.textContent;
      if (/(\bSAR\b|ر\.س|⃁)\s*[\d٠-٩]|[\d٠-٩][\d,.٠-٩]*\s*(\bSAR\b|ر\.س|⃁)/.test(s) && !x.el.closest('[contenteditable="true"], textarea, input')) add('error', 'currency', 'An amount is written with “SAR”, “ر.س” or U+20C1 — draw the riyal glyph (kit/riyal.svg) before the number: “' + s.trim().slice(0, 40) + '”', x.el);
    });
    if (document.querySelector('svg path[d^="M7.9 0 9.9 0"]')) add('error', 'currency', 'The 2.0 handover\'s rough riyal sketch is drawn — use the official sign, kit/riyal.svg', document.querySelector('svg path[d^="M7.9 0 9.9 0"]').closest('svg'));
    var rootStyle = cs(document.documentElement);
    Array.prototype.forEach.call(document.querySelectorAll('[style*="var(--"]'), function (e) {
      var re = /var\((--[\w-]+)\s*\)/g, m, st = e.getAttribute('style');
      while ((m = re.exec(st))) if (!rootStyle.getPropertyValue(m[1]).trim() && !cs(e).getPropertyValue(m[1]).trim()) { add('error', 'vars', 'var(' + m[1] + ') has no value here — the token is not defined (link its stylesheet, or add a fallback)', e); break; }
    });

    out.sort(function (a, b) { return (a.level === 'error' ? 0 : 1) - (b.level === 'error' ? 0 : 1); });
    return Promise.resolve({ issues: out, stats: stats, viewport: [innerWidth, innerHeight] });
  };

  /* outlines for the player's QA view */
  function draw(el, level, n) {
    var host = document.getElementById('pfk-qa-layer');
    if (!host) { host = document.createElement('div'); host.id = 'pfk-qa-layer'; host.style.cssText = 'position:absolute;left:0;top:0;width:0;height:0;z-index:2147483646;pointer-events:none'; document.body.appendChild(host); }
    var r = el.getBoundingClientRect(), box = document.createElement('div');
    var colour = level === 'error' ? '#d92d20' : '#dc8b00';
    box.style.cssText = 'position:absolute;left:' + (r.left + scrollX - 2) + 'px;top:' + (r.top + scrollY - 2) + 'px;width:' + (r.width + 4) + 'px;height:' + (r.height + 4) + 'px;outline:2px solid ' + colour + ';border-radius:3px';
    var tag = document.createElement('span');
    tag.textContent = n;
    tag.style.cssText = 'position:absolute;left:-2px;top:-18px;background:' + colour + ';color:#fff;font:600 11px/16px system-ui;padding:0 5px;border-radius:3px';
    box.appendChild(tag);
    host.appendChild(box);
  }
})();
