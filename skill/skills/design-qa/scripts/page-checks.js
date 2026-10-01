/* design-qa's checks inside a rendered screen. scripts/render.mjs injects this file into each
   screen at each width and calls window.__dqa. Every number a finding reports is measured from
   the render; nothing here knows which product it is looking at.

   __dqa.run(opt)        the layout, accessibility, resource and motion checks → { findings, stats }
   __dqa.extremes(kind)  puts a content extreme into the first row of each repeated structure
   __dqa.triggers()      the controls that open something: menus, dialogs, sheets, popovers
   __dqa.mark()          marks what is visible now, so opened() can tell what a click added
   __dqa.opened(label)   what became visible since mark(), checked: in view, not clipped, styled
   __dqa.focusState()    the active element and how it looks, for the focus-ring pass */
(function () {
  'use strict';
  var SYSTEM = /^(system-ui|-apple-system|blinkmacsystemfont|segoe ui|roboto|helvetica neue|helvetica|arial|sans-serif|serif|monospace|times|times new roman|georgia|courier|courier new|menlo|monaco|apple color emoji|segoe ui emoji|noto color emoji|inherit|initial|cursive|fantasy|ui-sans-serif|ui-monospace)$/i;
  var CONTROL = 'button, [role=button], a[href], [role=tab], [role=menuitem], [role=option], [role=switch], [role=checkbox], [role=radio], select, input:not([type=hidden]), textarea, summary';
  function cs(e) { return getComputedStyle(e); }
  function box(e) { var r = e.getBoundingClientRect(); return [Math.round(r.left + scrollX), Math.round(r.top + scrollY), Math.round(r.width), Math.round(r.height)]; }
  function shown(e) {
    if (e.checkVisibility && !e.checkVisibility()) return false;        /* also content-visibility: hidden, e.g. a closed <details> */
    for (var n = e; n && n.nodeType === 1; n = n.parentElement) {
      var s = cs(n);
      if (s.display === 'none' || s.visibility === 'hidden' || +s.opacity === 0) return false;
    }
    var r = e.getBoundingClientRect();
    return r.width > 0.5 && r.height > 0.5 && r.right > 0 && r.bottom > 0 && r.left < innerWidth + 2;
  }
  function label(e) {
    var t = ((e.textContent || '').replace(/\s+/g, ' ').trim() || (e.getAttribute && (e.getAttribute('aria-label') || e.getAttribute('title') || e.getAttribute('alt'))) || e.tagName.toLowerCase());
    return t.length > 40 ? t.slice(0, 38) + '…' : t;
  }
  function path(e) {
    var parts = [];
    for (var n = e; n && n.nodeType === 1 && n !== document.body && parts.length < 6; n = n.parentElement) {
      var p = n.tagName.toLowerCase();
      if (n.id) { parts.unshift(p + '#' + n.id); break; }
      var cls = String(n.className && n.className.baseVal !== undefined ? n.className.baseVal : n.className || '').trim().split(/\s+/).filter(Boolean)[0];
      if (cls) p += '.' + cls;
      var sib = n.parentElement ? Array.prototype.filter.call(n.parentElement.children, function (c) { return c.tagName === n.tagName; }) : [];
      if (sib.length > 1) p += ':nth-of-type(' + (sib.indexOf(n) + 1) + ')';
      parts.unshift(p);
    }
    return parts.join(' > ');
  }
  function node(e) { var n = e && e.closest && e.closest('[data-node-id],[data-id]'); return n ? (n.getAttribute('data-node-id') || n.getAttribute('data-id')) : null; }
  function median(xs) { var s = xs.slice().sort(function (a, b) { return a - b; }); return s.length ? s[Math.floor(s.length / 2)] : 0; }
  function bgOf(e) { for (var n = e; n && n.nodeType === 1; n = n.parentElement) { var b = cs(n).backgroundColor; if (b !== 'rgba(0, 0, 0, 0)' && b !== 'transparent') return b; } return 'rgb(255, 255, 255)'; }
  function ownPaint(e) {
    var s = cs(e), b = s.backgroundColor;
    if (b !== 'rgba(0, 0, 0, 0)' && b !== 'transparent' && b !== bgOf(e.parentElement)) return true;
    if (parseFloat(s.borderTopWidth) > 0 && s.borderTopStyle !== 'none' && parseFloat(s.borderBottomWidth) > 0) return true;
    return s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0;
  }
  function textSize(e) {
    var max = 0, w = document.createTreeWalker(e, NodeFilter.SHOW_TEXT);
    for (var n = w.nextNode(); n; n = w.nextNode()) if (n.textContent.trim() && n.parentElement) max = Math.max(max, parseFloat(cs(n.parentElement).fontSize) || 0);
    return max || parseFloat(cs(e).fontSize) || 14;
  }
  /* the box of what an element draws: its text, images, icons and the boxes that paint themselves */
  function content(el) {
    var b = null, range = document.createRange(), cell = el.getBoundingClientRect();
    function add(r) { if (!r || r.width < 0.5 || r.height < 0.5) return; b = b ? { l: Math.min(b.l, r.left), r: Math.max(b.r, r.right), t: Math.min(b.t, r.top), b: Math.max(b.b, r.bottom) } : { l: r.left, r: r.right, t: r.top, b: r.bottom }; }
    var walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, { acceptNode: function (n) {
      if (n.nodeType === 1) {
        var s = cs(n);
        if (s.display === 'none' || s.visibility === 'hidden' || +s.opacity === 0) return NodeFilter.FILTER_REJECT;
        if (/^(IMG|SVG|svg|INPUT|SELECT|TEXTAREA|CANVAS|VIDEO|BUTTON|I)$/.test(n.tagName)) return NodeFilter.FILTER_ACCEPT;
        var r = n.getBoundingClientRect();
        return ownPaint(n) && r.width < cell.width * 0.95 && r.height < 120 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
      }
      return n.textContent.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
    } });
    for (var n = walk.nextNode(); n; n = walk.nextNode()) {
      if (n.nodeType === 3) { range.selectNodeContents(n); Array.prototype.forEach.call(range.getClientRects(), add); }
      else { add(n.getBoundingClientRect()); var last = n; while (last.lastChild) last = last.lastChild; walk.currentNode = last; }
    }
    return b;
  }
  function edges(cell) { var c = content(cell); return c && { l: c.l, r: c.r, c: (c.l + c.r) / 2, t: c.t, b: c.b }; }
  /* buttons: the innermost box that paints itself around a short label someone can press */
  function buttonsIn(scope) {
    var all = Array.prototype.filter.call(scope.querySelectorAll('*'), function (e) {
      var t = (e.textContent || '').replace(/\s+/g, ' ').trim();
      if (!t || t.length > 40 || !ownPaint(e) || !shown(e)) return false;
      if (e.closest('[class*="tag"], [class*="badge"], [class*="pill"], [class*="chip"]')) return false;
      var br = e.getBoundingClientRect();
      if (br.width < 40 || (textSize(e) <= 12 && br.height <= 22)) return false;
      return cs(e).cursor === 'pointer' || /^(BUTTON|A)$/.test(e.tagName) || /button/.test(e.getAttribute('role') || '');
    });
    return all.filter(function (e) { return !all.some(function (o) { return o !== e && e.contains(o); }); });
  }
  /* tables: rows that share one set of columns (a grid, or flex rows of the same shape) */
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
    Array.prototype.forEach.call(document.querySelectorAll('table'), function (t) {
      var rows = Array.prototype.filter.call(t.rows, shown);
      if (rows.length >= 2 && rows[0].cells.length >= 3) groups['table#' + path(t)] = rows;
    });
    return Object.keys(groups).map(function (k) { return groups[k]; }).filter(function (g) { return g.length >= 2; });
  }
  function cellsOf(row) { return row.cells ? Array.prototype.slice.call(row.cells) : Array.prototype.slice.call(row.children); }
  function isHead(row, group) {
    if (row.querySelector && row.querySelector('th, [role=columnheader]')) return true;
    if (/thead|table-head|header-row|\bth\b/i.test(String(row.className))) return true;
    return row === group[0] && !row.querySelector('button, [role=button], img') && (row.textContent || '').length < 160;
  }
  /* WCAG relative luminance and contrast, with the background composited under alpha */
  function rgba(s) { var m = /rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?/.exec(s); return m ? [+m[1], +m[2], +m[3], m[4] === undefined ? 1 : +m[4]] : null; }
  function over(top, under) { var a = top[3]; return [top[0] * a + under[0] * (1 - a), top[1] * a + under[1] * (1 - a), top[2] * a + under[2] * (1 - a), 1]; }
  function lum(c) { var f = function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); }
  function background(e) {
    var stack = [];
    for (var n = e; n && n.nodeType === 1; n = n.parentElement) {
      var s = cs(n);
      if (s.backgroundImage && s.backgroundImage !== 'none') return null;          /* over an image or a gradient: not measurable from styles */
      var b = rgba(s.backgroundColor);
      if (b && b[3] > 0) { stack.push(b); if (b[3] >= 1) break; }
    }
    var c = [255, 255, 255, 1];
    for (var i = stack.length - 1; i >= 0; i--) c = over(stack[i], c);
    return c;
  }

  function run(opt) {
    opt = opt || {};
    var out = [], stats = { tables: 0, controls: 0, texts: 0 };
    var minTarget = opt.minTarget || 24, gapMin = opt.gapMin || 8, touch = !!opt.touch, wire = opt.profile === 'wireframe';
    function add(check, message, el, extra) {
      if (out.some(function (o) { return o.check === check && o.message === message; })) return;
      var f = { check: check, message: message, css_path: el && el.nodeType === 1 ? path(el) : null, node: el && el.nodeType === 1 ? node(el) : null, box: el && el.getBoundingClientRect ? box(el) : null };
      if (extra) for (var k in extra) f[k] = extra[k];
      out.push(f);
    }
    /* lay.align, lay.controls, lay.rows */
    var found = tables();
    stats.tables = found.length;
    found.forEach(function (group) {
      var head = isHead(group[0], group) ? group[0] : null;
      var body = group.filter(function (r) { return r !== head; });
      var n = Math.min.apply(null, group.map(function (r) { return cellsOf(r).length; }));
      for (var k = 0; k < n; k++) {
        var rowsE = body.map(function (r) { return edges(cellsOf(r)[k]); }).filter(Boolean);
        if (head && rowsE.length) {
          var h = edges(cellsOf(head)[k]);
          if (h) {
            var cst = cs(cellsOf(body[0])[k]), jc = /flex/.test(cst.display) ? cst.justifyContent : '';
            var axis = /end|right/.test(jc) ? 'r' : /center/.test(jc) ? 'c' : /right|end/.test(cst.textAlign) ? 'r' : /center/.test(cst.textAlign) ? 'c' : 'l';
            if (cst.direction === 'rtl' && axis !== 'c' && !/end|right|left/.test(jc + cst.textAlign)) axis = 'r';
            var near = h[axis] - median(rowsE.map(function (e) { return e[axis]; }));
            if (Math.abs(near) > 2) add('lay.align', 'Column header “' + label(cellsOf(head)[k]) + '” sits ' + Math.round(Math.abs(near)) + ' px ' + (near > 0 ? 'right' : 'left') + ' of its column’s content, which aligns on its ' + (axis === 'l' ? 'left edge' : axis === 'r' ? 'right edge' : 'centre'), cellsOf(head)[k], { expected: 0, actual: Math.round(near) });
          }
        }
        var btns = [];
        body.forEach(function (r) { var cell = cellsOf(r)[k]; if (cell) btns = btns.concat(buttonsIn(cell)); });
        if (btns.length >= 2) {
          var hs = btns.map(function (b) { return b.getBoundingClientRect().height; }), mode = median(hs);
          btns.forEach(function (b, i) { if (Math.abs(hs[i] - mode) > 4) add('lay.controls', '“' + label(b) + '” is ' + Math.round(hs[i]) + ' px tall; the other buttons in its column are ' + Math.round(mode) + ' px', b, { expected: Math.round(mode), actual: Math.round(hs[i]) }); });
        }
      }
      var mixed = 0;
      body.slice(0, 8).forEach(function (r) {
        var rr = r.getBoundingClientRect(), tops = [], mids = [];
        cellsOf(r).forEach(function (c) { var e = edges(c); if (e) { tops.push(e.t - rr.top); mids.push((e.t + e.b) / 2 - (rr.top + rr.bottom) / 2); } });
        if (tops.length >= 3 && Math.max.apply(null, tops) - Math.min.apply(null, tops) > 6 && Math.max.apply(null, mids) - Math.min.apply(null, mids) > 6) mixed++;
      });
      if (mixed >= 2) add('lay.rows', 'Cells in the same row are aligned differently (some top, some centre) in ' + mixed + ' rows', body[0]);
    });
    /* lay.squashed: a button shorter than its label needs */
    buttonsIn(document.body).forEach(function (p) {
      var r = p.getBoundingClientRect(), fs = textSize(p);
      if (r.height < Math.max(24, fs * 1.6)) add('lay.squashed', '“' + label(p) + '” is squashed: ' + Math.round(r.height) + ' px tall for ' + fs + ' px text', p, { expected: Math.round(Math.max(24, fs * 1.6)), actual: Math.round(r.height) });
    });
    /* lay.spacing: a label split into flex items, the gap between every word */
    Array.prototype.forEach.call(document.querySelectorAll('button, [role=button], a'), function (b) {
      var st = cs(b);
      if (!/flex/.test(st.display) || !(parseFloat(st.columnGap) > 0) || !shown(b)) return;
      var items = Array.prototype.filter.call(b.childNodes, function (x) { return x.nodeType === 3 ? x.textContent.trim() : x.nodeType === 1 && (x.textContent || '').trim() && cs(x).display !== 'none' && !/^(svg|SVG|IMG|I)$/.test(x.tagName) && !ownPaint(x); });
      if (items.length >= 3) add('lay.spacing', '“' + label(b) + '”: its words are ' + items.length + ' flex items, each ' + st.columnGap + ' apart', b);
    });
    /* controls: a11y.target, a11y.gap */
    var controls = Array.prototype.filter.call(document.querySelectorAll(CONTROL), shown);
    stats.controls = controls.length;
    controls.forEach(function (c) {
      /* a field's hit area is the box drawn around it, when one is: the wrapper takes the tap */
      var hitBox = c.matches('input, select, textarea') && c.parentElement && ownPaint(c.parentElement) ? c.parentElement : c;
      /* a control wrapped by a pointer box it fills alone (a tab's padded cell): the box takes the tap */
      for (var up = 0, w = hitBox.parentElement; w && up < 2 && w.children.length === 1 && cs(w).cursor === 'pointer'; up++, w = w.parentElement) hitBox = w;
      var r = hitBox.getBoundingClientRect();
      if (c.matches('a[href]') && cs(c).display === 'inline' && c.closest('p, li') && !touch) return;     /* a link in running text: WCAG 2.5.8 exempts it */
      /* WCAG 2.5.8's spacing exception (the web minimum only): an undersized target passes when a
         24px circle centred on it meets no other target and no other such circle */
      if ((r.width < minTarget || r.height < minTarget) && opt.wcag && minTarget <= 24) {
        var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        var clear = controls.every(function (o) {
          if (o === c || o.contains(c) || c.contains(o)) return true;
          var q = o.getBoundingClientRect(), ox = Math.max(q.left, Math.min(cx, q.right)), oy = Math.max(q.top, Math.min(cy, q.bottom));
          if (Math.hypot(ox - cx, oy - cy) < 12) return false;
          var small = q.width < minTarget || q.height < minTarget;
          return !small || Math.hypot(q.left + q.width / 2 - cx, q.top + q.height / 2 - cy) >= 24;
        });
        if (clear) return;
      }
      if (r.width < minTarget || r.height < minTarget) add('a11y.target', '“' + label(c) + '” is ' + Math.round(r.width) + ' × ' + Math.round(r.height) + ' px; the minimum here is ' + minTarget, c, { expected: minTarget, actual: Math.round(Math.min(r.width, r.height)) });
    });
    if (touch) for (var i = 0; i < controls.length && i < 400; i++) for (var j = i + 1; j < controls.length && j < 400; j++) {
      var a = controls[i].getBoundingClientRect(), b2 = controls[j].getBoundingClientRect();
      if (controls[i].contains(controls[j]) || controls[j].contains(controls[i])) continue;
      var dx = Math.max(0, Math.max(a.left, b2.left) - Math.min(a.right, b2.right)), dy = Math.max(0, Math.max(a.top, b2.top) - Math.min(a.bottom, b2.bottom));
      var gap = Math.max(dx, dy);
      if ((dx === 0 || dy === 0) && gap < gapMin && (dx > 0 || dy > 0)) add('a11y.gap', '“' + label(controls[i]) + '” and “' + label(controls[j]) + '” are ' + Math.round(gap) + ' px apart; the minimum here is ' + gapMin, controls[i], { expected: gapMin, actual: Math.round(gap) });
    }
    /* a11y.contrast.ui: a field's edge, where its border is all that shows it, at 3:1 against what is behind it */
    if (!wire) Array.prototype.forEach.call(document.querySelectorAll('input:not([type=hidden]):not([type=checkbox]):not([type=radio]), select, textarea'), function (f) {
      if (!shown(f)) return;
      var box = f.parentElement && ownPaint(f.parentElement) && cs(f).borderTopStyle === 'none' ? f.parentElement : f, st = cs(box);
      if (!(parseFloat(st.borderTopWidth) > 0) || st.borderTopStyle === 'none') return;
      var edge = rgba(st.borderTopColor), behind = background(box.parentElement || box), fill = rgba(st.backgroundColor);
      if (!edge || !behind) return;
      if (fill && fill[3] > 0.5) { var fl = lum(over(fill, behind)), bl = lum(behind); if ((Math.max(fl, bl) + 0.05) / (Math.min(fl, bl) + 0.05) >= 3) return; }   /* the fill shows the field */
      var e = lum(over(edge, behind)), g = lum(behind), ratio = (Math.max(e, g) + 0.05) / (Math.min(e, g) + 0.05);
      if (ratio < 3) add('a11y.contrast.ui', 'The edge of “' + label(f) + '” is ' + ratio.toFixed(2) + ':1 against what is behind it; a field shown only by its border needs 3:1', box, { expected: 3, actual: +ratio.toFixed(2) });
    });
    /* text: lay.overlap, lay.clip, a11y.small, a11y.contrast, cpy.undefined */
    var texts = [], range = document.createRange();
    var walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (var t = walk.nextNode(); t && texts.length < 3000; t = walk.nextNode()) {
      if (!t.textContent.trim() || !t.parentElement || /^(SCRIPT|STYLE|TEMPLATE|NOSCRIPT)$/.test(t.parentElement.tagName) || t.parentElement.closest('template')) continue;
      if (!shown(t.parentElement)) continue;
      range.selectNodeContents(t);
      var r = range.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) continue;
      var cx0 = Math.min(innerWidth - 1, Math.max(0, r.left + r.width / 2)), cy0 = Math.min(innerHeight - 1, Math.max(0, r.top + r.height / 2));
      var top = document.elementFromPoint(cx0, cy0);
      var covered = r.top < innerHeight && r.bottom > 0 && top && !(top === t.parentElement || t.parentElement.contains(top) || top.contains(t.parentElement));
      texts.push({ node: t, el: t.parentElement, r: r, lines: Array.prototype.slice.call(range.getClientRects()).filter(function (q) { return q.width >= 1 && q.height >= 1; }), covered: !!covered });
    }
    stats.texts = texts.length;
    var buckets = {}, seen = {};
    texts.forEach(function (x, i) { for (var bx = Math.floor(x.r.left / 80); bx <= Math.floor(x.r.right / 80); bx++) for (var by = Math.floor(x.r.top / 40); by <= Math.floor(x.r.bottom / 40); by++) (buckets[bx + ',' + by] = buckets[bx + ',' + by] || []).push(i); });
    Object.keys(buckets).forEach(function (k) {
      var ids = buckets[k];
      for (var a = 0; a < ids.length; a++) for (var b = a + 1; b < ids.length; b++) {
        var A = texts[ids[a]], B = texts[ids[b]], key = ids[a] + ':' + ids[b];
        if (seen[key]) continue; seen[key] = 1;
        if (A.el === B.el || A.el.contains(B.el) || B.el.contains(A.el) || A.covered || B.covered) continue;
        var best = null;
        A.lines.forEach(function (p) { B.lines.forEach(function (q) {
          var w = Math.min(p.right, q.right) - Math.max(p.left, q.left), h = Math.min(p.bottom, q.bottom) - Math.max(p.top, q.top);
          if (w < 2 || h < 2) return;
          var share = (w * h) / Math.min(p.width * p.height, q.width * q.height);
          if (!best || share > best.share) best = { share: share, cx: Math.max(p.left, q.left) + w / 2, cy: Math.max(p.top, q.top) + h / 2 };
        }); });
        if (!best || best.share < 0.3) continue;
        var hit = document.elementFromPoint(best.cx, best.cy);
        if (!hit || !(A.el.contains(hit) || hit.contains(A.el) || B.el.contains(hit) || hit.contains(B.el))) continue;
        add('lay.overlap', '“' + label(A.el) + '” overlaps “' + label(B.el) + '”', A.el);
      }
    });
    var clipped = [];
    texts.forEach(function (x) {
      for (var n = x.el, i = 0; n && i < 3; n = n.parentElement, i++) {
        var s = cs(n);
        /* cut at the bottom: a box of fixed height that hides the rest (a line clamp is on purpose) */
        if ((s.overflowY === 'hidden' || s.overflowY === 'clip') && n.scrollHeight > n.clientHeight + 1 && !(s.webkitLineClamp && s.webkitLineClamp !== 'none') && clipped.indexOf(n) < 0 && !n.closest('[aria-hidden="true"]')) {
          var vb = n.getBoundingClientRect();
          if (vb.height >= 4 && x.r.bottom > vb.bottom + 1) { clipped.push(n); add('lay.clip', 'Text “' + label(n) + '” is cut at ' + Math.round(vb.height) + ' px high; it needs ' + n.scrollHeight, n, { expected: n.scrollHeight, actual: Math.round(vb.height) }); break; }
        }
        if ((s.overflowX === 'hidden' || s.overflowX === 'clip') && n.scrollWidth > n.clientWidth + 1 && s.textOverflow !== 'ellipsis' && clipped.indexOf(n) < 0 && !n.closest('[aria-hidden="true"]')) {
          var bx = n.getBoundingClientRect();
          if (bx.width < 4) break;                                       /* a box of no width hides on purpose */
          if (x.r.right > bx.right + 1 || x.r.left < bx.left - 1) { clipped.push(n); add('lay.clip', 'Text “' + label(n) + '” is cut at ' + Math.round(bx.width) + ' px; it needs ' + n.scrollWidth, n, { expected: n.scrollWidth, actual: Math.round(bx.width) }); }
          break;
        }
      }
      var st = cs(x.el), fs = parseFloat(st.fontSize);
      if (fs < 11 && !x.el.closest('[class*="badge"], [class*="count"], sup, sub')) add('a11y.small', 'Text “' + label(x.el) + '” is ' + fs + ' px', x.el, { expected: 11, actual: fs });
      if (!wire) {
        var fg = rgba(st.color), bg = background(x.el);
        if (fg && bg && !x.covered) {
          var c = over(fg, bg), L1 = lum(c), L2 = lum(bg), ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
          var large = fs >= 24 || (fs >= 18.66 && (+st.fontWeight || 400) >= 700);
          var need = large ? 3 : 4.5;
          if (ratio < need - 0.01 && !x.el.closest('[disabled], [aria-disabled="true"], [inert]')) add(large ? 'a11y.contrast.large' : 'a11y.contrast.body', 'Text “' + label(x.el) + '” is ' + ratio.toFixed(2) + ':1 (' + st.color + ' on ' + 'rgb(' + bg.slice(0, 3).map(Math.round).join(', ') + '); needs ' + need + ':1', x.el, { expected: need, actual: +ratio.toFixed(2) });
        }
      }
      if (/\b(undefined|NaN)\b|\[object Object\]|^\s*null\s*$|Invalid Date/.test(x.node.textContent)) add('cpy.undefined', 'A value renders as “' + x.node.textContent.trim().slice(0, 30) + '”: the data is missing and the design has no fallback', x.el);
    });
    /* res.font, res.image, brk.render */
    if (!wire) {
      var fams = {}, faces = {};
      texts.slice(0, 1500).forEach(function (x) { var f = cs(x.el).fontFamily.split(',')[0].replace(/["']/g, '').trim(); if (f && !SYSTEM.test(f)) fams[f] = x.el; });
      if (document.fonts) document.fonts.forEach(function (f) { var n = f.family.replace(/["']/g, ''); (faces[n] = faces[n] || []).push(f.status); });
      Object.keys(fams).forEach(function (f) {
        if (!faces[f]) add('res.font', 'The font “' + f + '” is used but not included: its @font-face is missing, so text falls back', fams[f]);
        else if (faces[f].indexOf('loaded') < 0) add('res.font', 'The font “' + f + '” did not load (' + faces[f].join(', ') + ')', fams[f]);
      });
    }
    Array.prototype.forEach.call(document.images, function (im) { if (im.complete && !im.naturalWidth && shown(im)) add('res.image', 'An image did not load: ' + (im.getAttribute('src') || '').slice(0, 60), im); });
    var sw = document.scrollingElement ? document.scrollingElement.scrollWidth : 0;
    if (sw > innerWidth + 1) add('brk.render', 'At ' + innerWidth + ' px the screen is ' + (sw - innerWidth) + ' px wider than the viewport: it scrolls sideways', document.body, { expected: innerWidth, actual: sw });
    /* mot.budget, mot.infinite */
    if (!wire) {
      var budget = opt.motionBudget || 500;
      Array.prototype.forEach.call(document.querySelectorAll('body *'), function (e) {
        var s = cs(e);
        var longest = Math.max.apply(null, (s.transitionDuration + ',' + s.animationDuration).split(',').map(function (v) { v = v.trim(); return v.slice(-2) === 'ms' ? parseFloat(v) : parseFloat(v) * 1000 || 0; }));
        if (longest > budget && shown(e)) add('mot.budget', '“' + label(e) + '” moves for ' + longest + ' ms; the budget here is ' + budget, e, { expected: budget, actual: longest });
        if (s.animationName !== 'none' && /infinite/.test(s.animationIterationCount) && shown(e) && !/load|spin|skel|progress|shimmer|pulse/i.test(String(e.className) + ' ' + s.animationName + ' ' + (e.getAttribute('role') || ''))) add('mot.infinite', '“' + label(e) + '” animates forever (' + s.animationName + ') and is not a loader', e);
      });
    }
    return { findings: out, stats: stats, viewport: [innerWidth, innerHeight] };
  }

  /* motion that is still running under prefers-reduced-motion: reduce */
  function stillMoving() {
    var out = [];
    Array.prototype.forEach.call(document.querySelectorAll('body *'), function (e) {
      var s = cs(e);
      if (s.animationName === 'none' || !shown(e)) return;
      var d = Math.max.apply(null, s.animationDuration.split(',').map(function (v) { v = v.trim(); return v.slice(-2) === 'ms' ? parseFloat(v) : parseFloat(v) * 1000 || 0; }));
      if (d > 10) out.push({ check: 'mot.reduced', message: '“' + label(e) + '” still animates (' + s.animationName + ', ' + d + ' ms) with reduced motion requested', css_path: path(e), node: node(e), box: box(e) });
    });
    return out;
  }

  /* content extremes: the first row of every repeated structure, rewritten */
  var EXTREME = {
    long: function (t) { return 'Abdulrahmanalzahraniabdulrahmanalzahrani'.repeat(5).slice(0, 200); },
    big_number: function (t) { return /\d/.test(t) ? t.replace(/[\d][\d,.\s]*/, '999,999,999') : null; },
    zero: function (t) { return /\d/.test(t) ? t.replace(/[\d][\d,.\s]*/, '0') : null; },
    negative: function (t) { return /\d/.test(t) ? t.replace(/[\d][\d,.\s]*/, '-1,250') : null; },
    empty_string: function () { return ''; },
    single_char: function () { return 'A'; },
    arabic: function (t) { return /\d/.test(t) && t.replace(/[\d,.\s%+-]/g, '').length < 3 ? null : 'عبدالرحمن بن فهد الزهراني، حي الملقا الشمالي، الرياض'; },
  };
  function repeated() {
    var firsts = [];
    Array.prototype.forEach.call(document.querySelectorAll('body *'), function (p) {
      if (p.children.length < 3 || !shown(p)) return;
      var sig = function (c) { return c.tagName + '.' + String(c.className && c.className.baseVal !== undefined ? c.className.baseVal : c.className || '').split(/\s+/)[0]; };
      var kids = Array.prototype.filter.call(p.children, shown), counts = {};
      kids.forEach(function (c) { if ((c.textContent || '').trim()) counts[sig(c)] = (counts[sig(c)] || 0) + 1; });
      var best = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; })[0];
      if (!best || counts[best] < 3) return;
      /* the first body row: a header row is repeated structure too, but holds no data */
      var same = kids.filter(function (c) { return sig(c) === best; });
      var headLike = function (c) { return /head|thead|header/i.test(String(c.className)) || !!c.querySelector('th, [role=columnheader]') || c.getAttribute('role') === 'row' && !!c.querySelector('[role=columnheader]'); };
      var first = same.filter(function (c) { return !headLike(c); })[0] || same[0];
      if (first.children.length < 1 || firsts.some(function (f) { return f.contains(first) || first.contains(f); })) return;
      firsts.push(first);
    });
    return firsts.slice(0, 12);
  }
  function extremes(kind) {
    var make = EXTREME[kind], rows = repeated(), changed = 0;
    if (make) rows.forEach(function (row) {
      var leaves = Array.prototype.filter.call(row.querySelectorAll('*'), function (e) { return !e.children.length && (e.textContent || '').trim() && shown(e) && !e.closest('button, [role=button], a, th'); });
      leaves.forEach(function (e) { var v = make(e.textContent.trim()); if (v !== null && v !== undefined) { e.textContent = v; changed++; } });
      if (kind === 'empty_string') row.setAttribute('data-dqa-h', row.getBoundingClientRect().height);
    });
    if (kind === 'no_image') rows.forEach(function (row) { Array.prototype.forEach.call(row.querySelectorAll('img'), function (im) { im.setAttribute('data-dqa-h', row.getBoundingClientRect().height); im.src = 'data:,'; changed++; }); });
    return { rows: rows.length, changed: changed };
  }
  function collapsed() {
    var out = [];
    Array.prototype.forEach.call(document.querySelectorAll('[data-dqa-h]'), function (e) {
      var row = e.tagName === 'IMG' ? e.parentElement : e, before = +e.getAttribute('data-dqa-h'), now = row.getBoundingClientRect().height;
      if (before > 0 && now < before * 0.6) out.push({ message: 'A row collapses from ' + Math.round(before) + ' to ' + Math.round(now) + ' px', css_path: path(row), node: node(row), box: box(row) });
    });
    return out;
  }

  /* interaction: what a control opens */
  function triggers() {
    var sel = '[aria-haspopup]:not([aria-haspopup="false"]), [aria-expanded], [aria-controls], details > summary, [popovertarget], [data-toggle], [data-bs-toggle]';
    var out = [], had = {};
    Array.prototype.forEach.call(document.querySelectorAll(sel), function (e) {
      if (!shown(e) || e.matches('[role=tab], [role=tab] *')) return;          /* a tab switches a panel; it does not open one */
      var k = path(e);
      if (had[k]) return; had[k] = 1;
      var r = e.getBoundingClientRect();
      out.push({ label: label(e), css_path: k, x: r.left + r.width / 2, y: r.top + r.height / 2 });
    });
    return out.slice(0, 24);
  }
  function mark() { Array.prototype.forEach.call(document.querySelectorAll('body *'), function (e) { if (shown(e)) e.setAttribute('data-dqa-seen', ''); }); }
  function opened(name) {
    var fresh = Array.prototype.filter.call(document.querySelectorAll('body *:not([data-dqa-seen])'), function (e) { return shown(e) && (e.textContent || '').trim(); });
    fresh = fresh.filter(function (e) { return !fresh.some(function (o) { return o !== e && o.contains(e); }); });
    var out = [];
    if (!fresh.length) return { opened: 0, findings: [{ check: 'int.dead', message: '“' + name + '” opens nothing' }] };
    fresh.slice(0, 4).forEach(function (p) {
      var r = p.getBoundingClientRect(), v = { l: r.left, t: r.top, r: r.right, b: r.bottom };
      for (var a = p.parentElement; a && a !== document.documentElement; a = a.parentElement) {
        var ac = cs(a);
        if (!/(hidden|clip|auto|scroll)/.test(ac.overflowX + ' ' + ac.overflowY)) continue;
        var ar = a.getBoundingClientRect();
        v = { l: Math.max(v.l, ar.left), t: Math.max(v.t, ar.top), r: Math.min(v.r, ar.right), b: Math.min(v.b, ar.bottom) };
      }
      var inView = { l: Math.max(r.left, 0), t: Math.max(r.top, 0), r: Math.min(r.right, innerWidth), b: Math.min(r.bottom, innerHeight) };
      var full = r.width * r.height;
      var shownArea = Math.max(0, Math.min(v.r, innerWidth) - Math.max(v.l, 0)) * Math.max(0, Math.min(v.b, innerHeight) - Math.max(v.t, 0));
      var viewArea = Math.max(0, inView.r - inView.l) * Math.max(0, inView.b - inView.t);
      if (full > 0 && viewArea / full < 0.95) out.push({ check: 'int.offscreen', message: '“' + name + '” opens partly off the screen: ' + Math.round((1 - viewArea / full) * 100) + '% of it is outside the viewport', css_path: path(p), node: node(p), box: box(p) });
      else if (full > 0 && shownArea / full < 0.95) out.push({ check: 'int.clip', message: '“' + name + '” opens cut off: ' + Math.round((1 - shownArea / full) * 100) + '% of it is hidden by a container that clips it', css_path: path(p), node: node(p), box: box(p) });
      var w = document.createTreeWalker(p, NodeFilter.SHOW_TEXT);
      for (var t = w.nextNode(); t; t = w.nextNode()) {
        if (!t.textContent.trim() || !t.parentElement) continue;
        var f = cs(t.parentElement).fontFamily.split(',')[0].replace(/["']/g, '').trim();
        if (/^(times|times new roman|serif|-webkit-standard)$/i.test(f)) { out.push({ check: 'int.unstyled', message: '“' + name + '” opens unstyled: its text falls back to ' + f, css_path: path(p), node: node(p), box: box(p) }); break; }
      }
    });
    return { opened: fresh.length, findings: out };
  }
  function focusState() {
    var e = document.activeElement;
    if (!e || e === document.body) return null;
    var s = cs(e), r = e.getBoundingClientRect();
    /* WCAG 2.4.11: the focused element is not entirely hidden by something drawn over it (a sticky bar) */
    var pts = [[r.left + 2, r.top + 2], [r.right - 2, r.top + 2], [r.left + 2, r.bottom - 2], [r.right - 2, r.bottom - 2], [r.left + r.width / 2, r.top + r.height / 2]];
    var hidden = pts.every(function (p) { var h = document.elementFromPoint(Math.min(innerWidth - 1, Math.max(0, p[0])), Math.min(innerHeight - 1, Math.max(0, p[1]))); return h && !(h === e || e.contains(h) || h.contains(e)); });
    var over = hidden ? document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2) : null;
    return { css_path: path(e), node: node(e), label: label(e), box: box(e), tabindex: e.getAttribute('tabindex'), obscured: over ? label(over) || path(over) : null, look: [s.outlineStyle, s.outlineWidth, s.outlineColor, s.boxShadow, s.borderColor, s.backgroundColor, s.color, s.textDecorationLine].join('|') };
  }
  function lookOf(p) { var e = document.querySelector(p); if (!e) return null; var s = cs(e); return [s.outlineStyle, s.outlineWidth, s.outlineColor, s.boxShadow, s.borderColor, s.backgroundColor, s.color, s.textDecorationLine].join('|'); }

  /* how every focusable element looks before it has focus, so a Tab pass can tell whether focus shows */
  function focusables() {
    var out = {};
    Array.prototype.forEach.call(document.querySelectorAll('a[href], button, input:not([type=hidden]), select, textarea, summary, [tabindex]:not([tabindex="-1"]), [contenteditable="true"]'), function (e) {
      if (shown(e) && !e.disabled) out[path(e)] = lookOf(path(e));
    });
    return out;
  }

  window.__dqa = { run: run, stillMoving: stillMoving, extremes: extremes, collapsed: collapsed, triggers: triggers, mark: mark, opened: opened, focusState: focusState, lookOf: lookOf, focusables: focusables };
})();
