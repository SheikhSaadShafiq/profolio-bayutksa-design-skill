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
     blank     a bound value that renders nothing, or "undefined", "null", "NaN", when the data lacks it
     covered   a control something else lies over at its centre (not an open dialog, menu or scrim):
               nobody can click it
     contrast  text under WCAG AA against what is behind it (4.5:1; 3:1 for large text): an error in a
               direction's own pattern (pfx-*), a warning in the product's or the kit's palette
     squeezed  text in a box too narrow for it: three lines or more of a word or two each
     unstyled  a button, select or input in the browser's own default style (an outset or inset
               border, which the product's CSS never draws): its stylesheet is missing
     rail      the shell is not the product's: on the web, a rail not 60 px when the screen opens
               (it ships collapsed), items its compiled page does not draw or that are gone, or
               no rail where the compiled page has one; a header missing, or not its height
               (qa/prototype.mjs passes { rail: { w, keys }, header: { h } }, measured on the
               pf-base); in the sweep, a label cut off in the expanded rail, an icon clipped
               away, or a flow.json shell.rail item that does not show where it should
     shell     (in the sweep) a product state that opens nothing, off the screen, unstyled, or an
               expanded rail lying over the page instead of pushing it aside
     clip      (in the sweep, too) a menu or dialog cut off by a container or the screen's edge
     rows      (warning) cells of one row aligned differently: some top, some centre
     targets   (phone) a control under 24 px: an error; under the build's 32 px: a warning (the
               platforms ask 44). A link inside a sentence is exempt
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
  /* what lies over the page on purpose: an open menu, dialog, drawer, popover, toast or scrim */
  var LAYER = '[data-pf-menu-panel], [data-pf-overlay], .pfk-menu, .pfk-mask, .pfk-toast, .pfk-toasts, .pf-modal-wrap, .pf-modal-mask, .pf-drawer, .pf-dropdown, .pf-select-dropdown, .pf-popover, .pf-picker-dropdown, .pf-message, .pf-notification, .pf-tooltip, [role="dialog"], [role="menu"], [role="listbox"]';
  /* WCAG relative luminance and contrast, from computed rgb()/rgba() */
  function rgba(c) { var m = String(c).match(/rgba?\(([^)]+)\)/); if (!m) return null; var p = m[1].split(/[ ,\/]+/).filter(Boolean).map(parseFloat); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; }
  function lum(c) { return [c.r, c.g, c.b].map(function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }).reduce(function (s, v, i) { return s + v * [0.2126, 0.7152, 0.0722][i]; }, 0); }
  function over(top, under) { var a = top.a; return { r: top.r * a + under.r * (1 - a), g: top.g * a + under.g * (1 - a), b: top.b * a + under.b * (1 - a), a: 1 }; }
  /* what is behind a text: the stacked fills of its ancestors over white; null where an image,
     a gradient or a dimmed (disabled) ancestor makes it unknown */
  function behind(e) {
    var fills = [];
    for (var n = e; n && n.nodeType === 1; n = n.parentElement) {
      var s = cs(n);
      if (s.backgroundImage && s.backgroundImage !== 'none') return null;
      if (+s.opacity < 1) return null;
      var b = rgba(s.backgroundColor);
      if (b && b.a > 0) { fills.push(b); if (b.a >= 1) break; }
    }
    var c = { r: 255, g: 255, b: 255, a: 1 };
    for (var i = fills.length - 1; i >= 0; i--) c = over(fills[i], c);
    return c;
  }
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
            /* the column's own alignment, from its cells' CSS — the edge they are set to align on
               (a flex cell's justify-content, else its text-align): left for text, right for an
               end column, centre for a centred one. Not guessed from text widths, which differ by
               font. The header is held to that edge. */
            var cst = cs(body[0].children[k]), jc = /flex/.test(cst.display) ? cst.justifyContent : '';
            var axis = /end|right/.test(jc) ? 'r' : /center/.test(jc) ? 'c' : /right|end/.test(cst.textAlign) ? 'r' : /center/.test(cst.textAlign) ? 'c' : 'l';
            if (cst.direction === 'rtl' && axis !== 'c' && !/end|right|left/.test(jc + cst.textAlign)) axis = 'r';
            var off = function (a) { return h[a] - median(rowsE.map(function (e) { return e[a]; })); };
            var edge = axis === 'l' ? 'left edge' : axis === 'r' ? 'right edge' : 'centre';
            var near = off(axis);
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
    /* a link inside a sentence is exempt (WCAG 2.5.8): its line is its target */
    function inSentence(c) {
      var p = c.parentElement;
      return c.tagName === 'A' && p && cs(c).display === 'inline' && (p.textContent || '').trim().length > (c.textContent || '').trim().length + 8;
    }
    if (phone) controls.forEach(function (c) {
      var rr = c.getBoundingClientRect();
      if (!((rr.width < 32 || rr.height < 32) && rr.width > 0) || inShell(c) || inSentence(c)) return;
      var tiny = rr.width < 24 || rr.height < 24;
      add(tiny ? 'error' : 'warn', 'targets', '“' + label(c) + '” is ' + Math.round(rr.width) + ' × ' + Math.round(rr.height) + ' px — ' + (tiny ? 'under 24 px, too small to tap on a phone: give it padding or a bigger row' : 'under the build\'s 32 px on a phone (the platforms ask 44)'), c);
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
      /* the shell is the product's, and the runtime's to wire; antd's internals are not controls
         (a virtual list's scrollbar, a hidden listbox's options, a select's search box) */
      if (c.closest('[data-pf-shell-root], .pf-layout-sider, .pf-layout-header')) return;
      if (c.closest('.rc-virtual-list-scrollbar, [role="listbox"], .pf-select-selection-search')) return;
      add('error', 'dead', '“' + (label(c) || c.tagName.toLowerCase()) + '” looks clickable and does nothing — wire it (data-pf-…) or mark it data-pf-inert="why"', c);
    });

    /* interaction: what a click opened (the QA's sweep passes it in) */
    var it = opt.interaction;
    if (it && it.target) {
      var nm = '“' + (it.target.label || it.target.key) + '”';
      if (it.layer) {
        var inf = it.layer.info || {};
        if (inf.missing) add('error', 'shell', nm + ' opens a product state this prototype does not hold (' + it.layer.path + ')');
        else if (inf.type === 'empty' || inf.timeout) add('error', 'shell', nm + ' opens nothing' + (inf.timeout ? ' — the product state did not load' : ' — the product state shows no layer here'));
        else {
          var boxes = (inf.boxes || []).filter(function (b) { return !b.scrim && b.visible !== false; });
          if (!boxes.length) add('error', 'shell', nm + ' opens nothing visible — the product state\'s layer is hidden');
          else if (!inf.texts && it.layer.mode !== 'rail') add('warn', 'shell', nm + ' opens a layer with no text in it');
          var inView = boxes.some(function (b) {
            var w = Math.min(b.x + b.w, innerWidth) - Math.max(b.x, 0), h = Math.min(b.y + b.h, innerHeight) - Math.max(b.y, 0);
            return w > 0 && h > 0 && w * h >= 0.3 * b.w * b.h;
          });
          if (boxes.length && !inView) add('error', 'shell', nm + ' opens off the screen');
          var bad = Object.keys(inf.fonts || {}).filter(function (f) { return /^(times|times new roman|serif|-webkit-standard)$/i.test(f); });
          if (bad.length) add('error', 'shell', nm + ' renders unstyled — its text falls back to ' + bad[0] + ' (the state\'s stylesheet did not load)');
          if (it.layer.covered && !it.layer.scrim) add('error', 'shell', nm + ': the expanded rail lies over ' + it.layer.covered + ' piece(s) of the page\'s text — the product pushes the page aside');
          if (inf.rail) {
            (inf.rail.items || []).forEach(function (x) {
              if (x.cut) add('error', 'rail', nm + ': “' + x.label + '” is cut off in the expanded rail (220 px). Shorten the label (design-copy) and put it to the designer');
              if (x.iconGone) add('error', 'rail', nm + ': “' + x.label + '”’s icon draws nothing: its clip path or mask is hidden or missing');
            });
            ((inf.rail.did || {}).skipped || []).forEach(function (x) {
              if (x.under && !(it.target.kind === 'group' && it.target.key === x.under)) return;   /* a closed group shows no child */
              add('error', 'rail', nm + ': flow.json shell.rail adds “' + x.key + '”' + (x.under ? ' under “' + x.under + '”' : '') + ', and it does not show here: its ' + (x.under ? '`under` group or `after`' : '`after`') + ' names no item of this rail (node qa/registry.mjs shell)');
            });
          }
        }
      } else if (!it.panels) add('error', 'dead', nm + ' opens nothing — ' + it.selector + ' does not show');
      else Array.prototype.forEach.call(document.querySelectorAll(it.selector), function (p) {
        if (!shown(p)) return;
        /* a menu or a dialog cut by a container that clips it, or by the screen's edge */
        var r = p.getBoundingClientRect(), v = { l: r.left, t: r.top, r: r.right, b: r.bottom };
        for (var a = p.parentElement; a && a !== document.documentElement; a = a.parentElement) {
          var ac = cs(a);
          if (!/(hidden|clip|auto|scroll)/.test(ac.overflowX + ' ' + ac.overflowY)) continue;
          var ar = a.getBoundingClientRect();
          v = { l: Math.max(v.l, ar.left), t: Math.max(v.t, ar.top), r: Math.min(v.r, ar.right), b: Math.min(v.b, ar.bottom) };
        }
        v = { l: Math.max(v.l, 0), t: Math.max(v.t, 0), r: Math.min(v.r, innerWidth), b: Math.min(v.b, innerHeight) };
        var full = r.width * r.height, seenA = Math.max(0, v.r - v.l) * Math.max(0, v.b - v.t);
        if (full > 0 && seenA / full < 0.95) add('error', 'clip', nm + ' opens cut off: ' + Math.round((1 - seenA / full) * 100) + '% of it is hidden by the container that clips it, or the screen\'s edge', p);
      });
    }

    /* blank: a value the data lacks renders nothing — a design shows a fallback, or hides it */
    var isShown = function (e) { for (var n = e; n && n.nodeType === 1; n = n.parentElement) { var c = cs(n); if (c.display === 'none' || c.visibility === 'hidden') return false; } return true; };
    Array.prototype.forEach.call(document.querySelectorAll('[data-pf-item] [data-pf-text], [data-pf-item][data-pf-text]'), function (e) {
      if ((e.textContent || '').trim() || !isShown(e) || e.closest('[data-pf-skeleton-row], template')) return;
      var f = e.getAttribute('data-pf-text').replace(/^[@$.]+/, '');
      add('error', 'blank', '“' + f + '” shows nothing when the data lacks it — give it a fallback (data-pf-default="Not shared") or hide it (data-pf-show="$.' + f + '")', e.closest('[data-pf-item]') || e);
    });

    /* spacing: a button or chip whose words are separate flex items get the gap between each */
    Array.prototype.forEach.call(document.querySelectorAll('button, [role=button], a, .pfk-btn, .wf-btn, [data-pf-do], [data-pf-set], [data-pf-open]'), function (b) {
      var st = cs(b);
      if (!/flex/.test(st.display) || /column/.test(st.flexDirection) || !(parseFloat(st.columnGap) > 0) || !shown(b) || inShell(b)) return;   /* stacked lines (a stat tile) are not one label */
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
      /* where it draws: each line clipped by the boxes that clip it (an ellipsis, a scroll box) */
      var cut = { left: -1e9, top: -1e9, right: 1e9, bottom: 1e9 };
      for (var an = t.parentElement; an && an !== document.body; an = an.parentElement) {
        var ao = cs(an);
        if (/(hidden|clip|auto|scroll)/.test(ao.overflowX + ' ' + ao.overflowY)) { var ab = an.getBoundingClientRect(); cut = { left: Math.max(cut.left, ab.left), top: Math.max(cut.top, ab.top), right: Math.min(cut.right, ab.right), bottom: Math.min(cut.bottom, ab.bottom) }; }
      }
      var lines = Array.prototype.slice.call(range.getClientRects()).map(function (q) { var l = Math.max(q.left, cut.left), tp = Math.max(q.top, cut.top), rt = Math.min(q.right, cut.right), bt = Math.min(q.bottom, cut.bottom); return { left: l, top: tp, right: rt, bottom: bt, width: rt - l, height: bt - tp }; }).filter(function (q) { return q.width >= 1 && q.height >= 1; });
      texts.push({ node: t, el: t.parentElement, r: r, lines: lines, covered: !!covered, layer: !!t.parentElement.closest(LAYER) });
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
        if (A.layer !== B.layer) continue;                 /* an open menu, dialog or toast over the page: layering, not a clash */
        /* line by line: a text that wraps has a box around both lines, which is not where it draws */
        var best = null;
        A.lines.forEach(function (a) { B.lines.forEach(function (b2) {
          var w = Math.min(a.right, b2.right) - Math.max(a.left, b2.left), h = Math.min(a.bottom, b2.bottom) - Math.max(a.top, b2.top);
          if (w < 2 || h < 2) return;
          var share = (w * h) / Math.min(a.width * a.height, b2.width * b2.height);
          if (!best || share > best.share) best = { share: share, cx: Math.max(a.left, b2.left) + w / 2, cy: Math.max(a.top, b2.top) + h / 2 };
        }); });
        if (!best || best.share < 0.3) continue;
        var cx = best.cx, cy = best.cy;
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

    /* contrast: each text against what is behind it, WCAG AA (4.5:1; 3:1 at 24 px, or 18.66 px bold) */
    var hex = function (c) { return '#' + [c.r, c.g, c.b].map(function (v) { return ('0' + Math.round(v).toString(16)).slice(-2); }).join(''); };
    var lowSeen = {};
    texts.slice(0, 1500).forEach(function (x) {
      if (x.covered || x.el.closest('[aria-hidden="true"], [data-pf-skeleton-row], [disabled], [aria-disabled="true"]')) return;
      var s = cs(x.el), fg = rgba(s.color), bg = behind(x.el);
      if (!fg || !bg || fg.a < 0.1) return;
      fg = over(fg, bg);
      var L1 = lum(fg), L2 = lum(bg), ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
      var fs = parseFloat(s.fontSize), bold = (+s.fontWeight || 400) >= 700, large = fs >= 24 || (fs >= 18.66 && bold);
      var need = large ? 3 : 4.5, key = hex(fg) + hex(bg);
      if (ratio + 0.005 >= need || lowSeen[key + label(x.el)]) return;
      lowSeen[key + label(x.el)] = 1;
      /* a direction's own pattern (pfx-*) is the design's choice: under AA it fails. The product's and
         the kit's palette (2.0's white on green is 2.76:1) is the designer's to know: a warning */
      var own = !!x.el.closest('[class*="pfx-"]');
      add(own ? 'error' : 'warn', 'contrast', 'Text “' + label(x.el) + '” is ' + ratio.toFixed(2) + ':1 (' + hex(fg) + ' on ' + hex(bg) + ') — WCAG AA asks ' + need + ':1' + (own ? '' : ': the product\'s own palette, for the designer'), x.el);
    });
    /* squeezed: three lines or more of a word or two each — its box is too narrow for it */
    var squeezedSeen = [];
    texts.forEach(function (x) {
      var n = x.el, words = (n.textContent || '').trim().split(/\s+/).length, lines = x.lines.length;
      if (lines < 3 || words < 3 || words / lines > 2 || squeezedSeen.indexOf(n) > -1 || x.covered) return;
      squeezedSeen.push(n);
      add('error', 'squeezed', '“' + label(n) + '” wraps to ' + lines + ' lines of a word or two (' + Math.round(n.getBoundingClientRect().width) + ' px wide): its box is too narrow', n);
    });
    /* covered: a control something else lies over at its centre — not an open layer, which covers
       the page on purpose — cannot be clicked */
    controls.forEach(function (c) {
      if (inShell(c) || c.closest(LAYER + ', template, [disabled], [aria-disabled="true"], [data-pf-skeleton-row]')) return;
      var r = c.getBoundingClientRect();
      if (r.width < 4 || r.height < 4) return;
      var x = r.left + r.width / 2, y = r.top + r.height / 2;
      if (x < 0 || y < 0 || x >= innerWidth || y >= innerHeight) return;
      var hit = document.elementFromPoint(x, y);
      if (!hit || hit === c || c.contains(hit) || hit.contains(c)) return;
      if (hit.closest(LAYER) || hit.closest('iframe[data-pf-layer], .pfp-qa-layer, #pfk-qa-layer') || inShell(hit)) return;
      if (cs(c).pointerEvents === 'none') return;
      add('error', 'covered', '“' + (label(c) || c.tagName.toLowerCase()) + '” is covered by “' + (label(hit) || hit.tagName.toLowerCase()) + '” at its centre — nobody can click it', c);
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
      if (/\b(undefined|NaN)\b|\[object Object\]|^\s*null\s*$/.test(s)) add('error', 'blank', 'A value renders as “' + s.trim().slice(0, 30) + '” — the data is missing and the design has no fallback', x.el);
      if (/(\bSAR\b|ر\.س|⃁)\s*[\d٠-٩]|[\d٠-٩][\d,.٠-٩]*\s*(\bSAR\b|ر\.س|⃁)/.test(s) && !x.el.closest('[contenteditable="true"], textarea, input')) add('error', 'currency', 'An amount is written with “SAR”, “ر.س” or U+20C1 — draw the riyal glyph (kit/riyal.svg) before the number: “' + s.trim().slice(0, 40) + '”', x.el);
    });
    if (document.querySelector('svg path[d^="M7.9 0 9.9 0"]')) add('error', 'currency', 'The 2.0 handover\'s rough riyal sketch is drawn — use the official sign, kit/riyal.svg', document.querySelector('svg path[d^="M7.9 0 9.9 0"]').closest('svg'));
    var rootStyle = cs(document.documentElement);
    Array.prototype.forEach.call(document.querySelectorAll('[style*="var(--"]'), function (e) {
      var re = /var\((--[\w-]+)\s*\)/g, m, st = e.getAttribute('style');
      while ((m = re.exec(st))) if (!rootStyle.getPropertyValue(m[1]).trim() && !cs(e).getPropertyValue(m[1]).trim()) { add('error', 'vars', 'var(' + m[1] + ') has no value here — the token is not defined (link its stylesheet, or add a fallback)', e); break; }
    });

    /* unstyled: a control in the browser's own default style. An outset or inset border is the
       browser's alone (the product's CSS draws none), so the control's rules are missing: markup
       copied without its stylesheet, or a control written by hand */
    Array.prototype.forEach.call(document.querySelectorAll('button, select, input[type=button], input[type=submit], input[type=reset]'), function (b) {
      if (!shown(b)) return;
      var c = cs(b);
      if (c.borderTopStyle === 'outset' || c.borderTopStyle === 'inset') add('error', 'unstyled', 'The control “' + label(b) + '” is drawn in the browser\'s default style (a ' + c.borderTopWidth + ' ' + c.borderTopStyle + ' border): its stylesheet is missing. Copy the product\'s component with its stylesheet, never by hand', b);
    });

    /* rail: on the web, the product's own, as compiled. It ships collapsed (60 px) and the runtime
       expands it on a click; its items are its compiled page's, plus flow.json shell.rail's */
    var sider = !phone && document.querySelector('.pf-layout-sider'), base = opt.rail || null;
    var keyOf = function (e) { return (e.getAttribute('data-menu-id') || '').replace(/^rc-menu-uuid-\d+-\d+-/, ''); };
    stats.rail = sider && shown(sider) ? Math.round(sider.getBoundingClientRect().width) : null;
    if (stats.rail != null) {
      var want = base && base.w ? base.w : 60;
      if (Math.abs(stats.rail - want) > 1) add('error', 'rail', 'The rail is ' + stats.rail + ' px wide when the screen opens; the product\'s ships collapsed at ' + want + ' px and expands on a click. Keep the compiled page\'s rail as it is, and change it with flow.json shell.rail', sider);
      if (base && base.keys) {
        var have = Array.prototype.filter.call(sider.querySelectorAll('[data-menu-id]'), function (e) { return !e.closest('[data-pf-rail-add]'); }).map(keyOf);
        var extra = have.filter(function (k) { return base.keys.indexOf(k) < 0; }), gone = base.keys.filter(function (k) { return have.indexOf(k) < 0; });
        if (extra.length) add('error', 'rail', 'The rail has item(s) its compiled page does not draw: ' + extra.join(', ') + '. A new rail item is flow.json shell.rail (add, after or under a group), never written by hand', sider);
        if (gone.length) add('error', 'rail', 'The rail lost item(s) its compiled page draws: ' + gone.join(', ') + '. Keep the compiled rail; a role that sees fewer items starts from that role\'s page', sider);
      }
    } else if (base && base.w && !phone) add('error', 'rail', 'The product\'s rail is missing: this screen\'s compiled page (pf-base) draws it at ' + base.w + ' px. Keep it; never draw a navigation of your own', document.body);
    /* the header, likewise: where the pf-base draws the product's, the screen keeps it, at its height */
    var head = document.querySelector('.pf-layout-header'), hb = opt.header || null;
    stats.header = head && shown(head) ? Math.round(head.getBoundingClientRect().height) : null;
    if (hb && hb.h && stats.header == null) add('error', 'rail', 'The product\'s header is missing: this screen\'s compiled page (pf-base) draws it at ' + hb.h + ' px. Keep it; never draw a header of your own', document.body);
    else if (hb && hb.h && Math.abs(stats.header - hb.h) > 1) add('error', 'rail', 'The header is ' + stats.header + ' px tall; the product\'s is ' + hb.h + ' px (its compiled page). Keep the compiled header as it is', head);

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
