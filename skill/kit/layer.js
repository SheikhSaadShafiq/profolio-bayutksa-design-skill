/* The shell layer (kit/layer.js). The product's compiled state for a shell control is shown
   over a design screen, in its own frame with its own stylesheet, so it looks exactly as the
   product draws it on any page, 2.0 or current. Covered states:
     - the expanded rail;
     - the phone menu;
     - the bell, the avatar, Post a Listing, help;
     - a tooltip.
   The runtime (kit/runtime.js) opens this frame, transparent, over the whole screen. This
   script shows only the state's top layer and hides the rest of the compiled page, so the
   design stays visible underneath. It then tells the runtime what the user does there.

   window.PF_LAYER = { mode: 'overlay' | 'rail' | 'tooltip', path } is set by whoever builds
   the frame. The script reports ready (the boxes it shows and the font of their text), empty,
   close, go (another compiled state), or nav (a page, by the rail key or label clicked). */
(function () {
  'use strict';
  var L = window.PF_LAYER || { mode: 'overlay' };
  function send(m) { m.pfLayer = true; try { window.parent.postMessage(m, '*'); } catch (e) { /* no runtime */ } }
  function cs(e) { return getComputedStyle(e); }
  function seen(e) {
    for (var n = e, op = 1; n && n.nodeType === 1; n = n.parentElement) {
      var c = cs(n);
      if (c.display === 'none' || c.visibility === 'hidden') return false;
      op *= +c.opacity;
      if (op < 0.05) return false;
    }
    var r = e.getBoundingClientRect();
    return r.width > 4 && r.height > 4;
  }
  /* once the rest is hidden: an element's own visibility (it is inherited, so its own value is
     the truth), the opacity it gets from its ancestors, and a size */
  function shows(e) {
    if (cs(e).visibility !== 'visible') return false;
    for (var n = e, op = 1; n && n.nodeType === 1; n = n.parentElement) { op *= +cs(n).opacity; if (op < 0.05) return false; }
    var r = e.getBoundingClientRect();
    return r.width > 4 && r.height > 4;
  }
  var HEAD = '.pf-layout-header, header.pf-layout-header';
  var RAIL = '.pf-layout-sider';
  var SCRIM = '[class*="scrim"], .pf-drawer-mask, .pf-modal-mask';


  /* the rail as this design changes it (flow.json shell.rail), the same on every rail drawn (the
     design's own, the other pages', the expanded rail, the open group, the phone's menu):
     - add: an item after a neighbour (`after`), or inside a group (`under`: "reports", into its
       open submenu, after `after` or last). It is copied from an item of the same level, so it
       keeps the product's classes and markers; `icon` borrows another item's icon (top level);
       `tag: "NEW"` adds the product's own NEW chip (.pf-new-chip, the Post a Listing menu's), 6 px
       after the label as the product spaces it. A group drawn closed or flattened (the collapsed
       rail) shows no child, so nothing is added there;
     - selected: the item drawn selected. A group whose selected child is not drawn is drawn
       selected (antd), unless the rail is collapsed: there the product selects nothing.
     Keys are compared whole: "reports" is not "listing-reports". Returns what it did. */
  function editRail(sider, edits, selected) {
    var did = { added: [], skipped: [] };
    if (!sider || !edits) return did;
    function keyOf(e) { return (e.getAttribute('data-menu-id') || '').replace(/^rc-menu-uuid-\d+-\d+-/, ''); }
    function byKey(k) { var all = sider.querySelectorAll('[data-menu-id]'); for (var i = 0; i < all.length; i++) if (keyOf(all[i]) === k) return all[i]; return null; }
    function itemOf(e) { return !e ? null : e.matches('.pf-menu-submenu-title') ? e.closest('.pf-menu-submenu') : e.closest('li'); }
    function kids(list) { return Array.prototype.filter.call(list.children, function (c) { return c.matches('li[data-menu-id], li.pf-menu-submenu'); }); }
    (edits.add || []).forEach(function (a) {
      if (!a || !a.key) return;
      if (byKey(a.key)) { did.added.push(a.key); return; }
      var list, after, tpl;
      if (a.under) {
        var title = byKey(a.under), group = title && title.closest('.pf-menu-submenu');
        list = group && group.querySelector('ul.pf-menu-sub');
        if (!list) { did.skipped.push({ key: a.key, under: a.under || null }); return; }
        var ks = kids(list);
        tpl = ks.filter(function (c) { return c.matches('li[data-menu-id]'); }).pop();
        after = itemOf(a.after && byKey(a.after));
        if (!after || after.parentNode !== list) after = ks[ks.length - 1];
      } else {
        after = itemOf(a.after && byKey(a.after));
        if (!after) { did.skipped.push({ key: a.key, under: a.under || null }); return; }
        list = after.parentNode;
        tpl = after.matches('li.pf-menu-item[data-menu-id]') ? after : kids(list).filter(function (c) { return c.matches('li.pf-menu-item[data-menu-id]'); })[0];
      }
      if (!tpl || !after) { did.skipped.push({ key: a.key, under: a.under || null }); return; }
      var li = tpl.cloneNode(true);
      li.setAttribute('data-menu-id', (tpl.getAttribute('data-menu-id') || '').replace(/^(rc-menu-uuid-\d+-\d+-).*$/, '$1') + a.key);
      li.setAttribute('data-pf-rail-add', a.key);
      if (li.getAttribute('title')) li.setAttribute('title', a.label);   /* the collapsed rail's tooltip; an expanded rail's items carry none */
      li.classList.remove('pf-menu-item-selected', 'pf-menu-item-active');
      li.removeAttribute('data-pf-go');
      if (a.page) li.setAttribute('data-pf-page', a.page);
      Array.prototype.forEach.call(li.querySelectorAll('.pf-new-chip'), function (c) { c.remove(); });
      /* its label: the text outside its icon */
      var w = document.createTreeWalker(li, NodeFilter.SHOW_TEXT), host = null;
      for (var t = w.nextNode(); t; t = w.nextNode()) if (t.textContent.trim() && !(t.parentElement && t.parentElement.closest('.anticon, svg'))) { t.textContent = a.label; host = t.parentElement; break; }
      if (!host) { li.appendChild(document.createTextNode(a.label)); host = li; }
      var src = !a.under && a.icon && byKey(a.icon), ico = src && src.querySelector('.anticon'), dst = li.querySelector('.anticon');
      if (ico && dst) dst.replaceWith(ico.cloneNode(true));
      if (a.tag) {
        var chip = document.createElement('span');
        chip.className = 'pf-new-chip';
        chip.textContent = a.tag;
        chip.style.marginInlineStart = '6px';
        chip.style.verticalAlign = 'middle';
        host.appendChild(chip);
      }
      list.insertBefore(li, after.nextSibling);
      did.added.push(a.key);
    });
    if (selected) {
      Array.prototype.forEach.call(sider.querySelectorAll('.pf-menu-item-selected, .pf-menu-submenu-selected'), function (e) { e.classList.remove('pf-menu-item-selected', 'pf-menu-submenu-selected'); });
      var sel = byKey(selected), add = (edits.add || []).filter(function (a) { return a && a.key === selected; })[0];
      var item = itemOf(sel);
      if (item) {
        item.classList.add(item.matches('.pf-menu-submenu') ? 'pf-menu-submenu-selected' : 'pf-menu-item-selected');
        var up = item.parentNode && item.parentNode.closest && item.parentNode.closest('.pf-menu-submenu');
        if (up) up.classList.add('pf-menu-submenu-selected');
      } else if (add && add.under) {
        var g = itemOf(byKey(add.under));
        if (g && g.matches('.pf-menu-submenu')) g.classList.add('pf-menu-submenu-selected');
      }
    }
    return did;
  }

  function roots() {
    var out = [];
    if (L.mode === 'rail') {
      var s = document.querySelector(RAIL);
      L.did = editRail(s, L.rail, L.selected);
      if (s && seen(s)) out.push(s);
    } else {
      /* the top layer: positioned, above the page (z ≥ 100), visible — not the header or the rail themselves */
      Array.prototype.forEach.call(document.querySelectorAll('body *'), function (e) {
        var c = cs(e);
        if (c.position !== 'fixed' && c.position !== 'absolute') return;
        if (!(parseInt(c.zIndex, 10) >= 100)) return;
        if (e.matches(HEAD) || e.matches(RAIL) || e.matches(SCRIM)) return;
        if (e.closest('[class*="feedback"]')) return;                  /* the always-on feedback tab: chrome, not this state */
        if (!seen(e)) return;
        out.push(e);
      });
      out = out.filter(function (e) { return !out.some(function (o) { return o !== e && o.contains(e); }); });
    }
    /* the scrim the product lays behind it, when it shows one */
    Array.prototype.forEach.call(document.querySelectorAll(SCRIM), function (e) {
      if (seen(e) && out.indexOf(e) < 0 && !out.some(function (o) { return o.contains(e); })) out.push(e);
    });
    return out;
  }
  function start() {
    var found = roots();
    found.forEach(function (e) { e.setAttribute('data-pf-show-root', ''); });
    var st = document.createElement('style');
    /* visibility is inherited: the kept parts are set visible explicitly, over their hidden ancestors */
    st.textContent = 'html,body{background:transparent!important}' +
      'body *:not([data-pf-show-root]):not([data-pf-show-root] *){visibility:hidden!important}' +
      '[data-pf-show-root]{visibility:visible!important}' +
      (L.mode === 'tooltip' ? 'html{pointer-events:none!important}' : '');
    document.head.appendChild(st);
    /* an SVG's definitions (clip paths, masks, gradients) stay visible wherever they sit. A clip
       path whose shapes are hidden clips everything away, and an id can repeat in a compiled page:
       the rail's Post Listing icon used the header's #postListingIconClip, hidden with the header,
       and vanished. Inline !important outranks the rule above. */
    Array.prototype.forEach.call(document.querySelectorAll('defs, defs *, clipPath, clipPath *, mask, mask *, pattern, pattern *, marker, marker *, filter, filter *, linearGradient, linearGradient *, radialGradient, radialGradient *'), function (e) {
      if (e.style) e.style.setProperty('visibility', 'visible', 'important');
    });
    if (!found.length) { send({ type: 'empty' }); return; }
    void document.body.offsetHeight;                                   /* the rule applies before anything is measured */
    var fonts = {}, texts = 0;
    found.forEach(function (r) {
      var w = document.createTreeWalker(r, NodeFilter.SHOW_TEXT);
      for (var t = w.nextNode(); t && texts < 60; t = w.nextNode()) {
        if (!t.textContent.trim() || !shows(t.parentElement)) continue;
        texts++;
        var f = cs(t.parentElement).fontFamily.split(',')[0].replace(/["']/g, '').trim();
        fonts[f] = (fonts[f] || 0) + 1;
      }
    });
    send({
      type: 'ready',
      boxes: found.map(function (e) { var r = e.getBoundingClientRect(), c = cs(e); return { x: r.left, y: r.top, w: r.width, h: r.height, scrim: e.matches(SCRIM), bg: c.backgroundColor, visible: shows(e) }; }),
      texts: texts,
      fonts: fonts,
      rail: L.mode === 'rail' ? railItems(found[0]) : null,
    });
  }
  /* the rail's items as drawn: each label, and whether it is cut (its text runs past the item, or
     past the rail's edge), and what the design's rail edits did here */
  function railItems(sider) {
    if (!sider) return null;
    var edge = sider.getBoundingClientRect().right, range = document.createRange(), items = [];
    Array.prototype.forEach.call(sider.querySelectorAll('li[data-menu-id], .pf-menu-submenu-title[data-menu-id]'), function (li) {
      if (!shows(li)) return;
      var box = li.getBoundingClientRect(), right = 0, text = '';
      var w = document.createTreeWalker(li, NodeFilter.SHOW_TEXT);
      for (var t = w.nextNode(); t; t = w.nextNode()) {
        if (!t.textContent.trim()) continue;
        range.selectNodeContents(t);
        var r = range.getBoundingClientRect();
        if (r.width < 1) continue;
        right = Math.max(right, r.right);
        text += t.textContent;
      }
      var cut = false;
      for (var n = li; n && n !== sider.parentElement; n = n.parentElement) {
        var c = cs(n), b = n.getBoundingClientRect();
        if (/(hidden|clip)/.test(c.overflowX) && right > b.right + 1) { cut = true; break; }
      }
      /* an icon drawn through a clip path or mask that draws nothing: it is not there */
      var gone = Array.prototype.some.call(li.querySelectorAll('[clip-path^="url(#"], [mask^="url(#"]'), function (e) {
        var m = (e.getAttribute('clip-path') || e.getAttribute('mask') || '').match(/^url\(#([^)]+)\)/), d = m && document.getElementById(m[1]);
        return !d || !Array.prototype.some.call(d.querySelectorAll('*'), function (c) { return cs(c).visibility === 'visible' && cs(c).display !== 'none'; });
      });
      items.push({ key: (li.getAttribute('data-menu-id') || '').replace(/^rc-menu-uuid-\d+-\d+-/, ''), label: text.replace(/\s+/g, ' ').trim(), cut: cut || right > edge + 1, iconGone: gone, added: li.hasAttribute('data-pf-rail-add') });
    });
    return { items: items, did: L.did || null };
  }
  function label(e) { return (e.getAttribute('title') || e.getAttribute('aria-label') || e.textContent || '').replace(/\s+/g, ' ').trim(); }
  document.addEventListener('click', function (e) {
    var t = e.target.nodeType === 1 ? e.target : e.target.parentElement;
    e.preventDefault(); e.stopPropagation();
    var inside = t && t.closest('[data-pf-show-root]');
    if (!inside || inside.matches(SCRIM)) { send({ type: 'close' }); return; }
    var go = t.closest('[data-pf-go]');
    if (go) { send({ type: 'go', path: go.getAttribute('data-pf-go') }); return; }
    /* a group's title in the expanded rail, or in the phone's menu, opens or closes the group, as
       in the product: its compiled state, rail-expanded-<group> or mobile-menu-<group>
       (pages/<page>/rail-expanded-reports.html, mobile-menu-reports.mobile.html) */
    var sub = L.mode === 'rail' && t.closest('.pf-menu-submenu-title[data-menu-id]');
    if (sub) {
      var g = (sub.getAttribute('data-menu-id') || '').replace(/^rc-menu-uuid-\d+-\d+-/, '');
      var open = new RegExp('(rail-expanded|mobile-menu)-' + g + '((\\.mobile)?\\.html)$').test(L.path || '');
      var to = String(L.path || '').replace(/(rail-expanded|mobile-menu)(-[\w-]+)?((\.mobile)?\.html)$/, open ? '$1$3' : '$1-' + g + '$3');
      if (to !== L.path) { send({ type: 'go', path: to, hover: !!L.hover }); return; }
    }
    var li = t.closest('[data-menu-id]');
    if (li && li.getAttribute('data-pf-page')) { send({ type: 'page', to: li.getAttribute('data-pf-page') }); return; }
    if (li) { send({ type: 'nav', key: (li.getAttribute('data-menu-id') || '').replace(/^rc-menu-uuid-\d+-\d+-/, ''), label: label(li) }); return; }
    if (t.closest('[class*="close"], [aria-label="Close"], [aria-label="close"]')) { send({ type: 'close' }); return; }
    var a = t.closest('a, button, [role=button], [role=menuitem], li');
    if (a) send({ type: 'nav', label: label(a) });
  }, true);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') send({ type: 'close' }); });
  /* the expanded rail follows the pointer: moving off it closes it, as in the product */
  if (L.mode === 'rail' && L.hover) document.addEventListener('pointermove', function (e) {
    var r = document.querySelector('[data-pf-show-root]');
    if (r && !r.contains(e.target)) send({ type: 'close' });
  });
  if (document.readyState === 'complete') setTimeout(start, 30); else window.addEventListener('load', function () { setTimeout(start, 30); });
})();
