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


  /* the rail as this design changes it (flow.json shell.rail): a new item after a neighbour, with
     another item's icon; which item is selected. The same edits run on every rail drawn. */
  function editRail(sider, edits, selected) {
    if (!sider || !edits) return;
    (edits.add || []).forEach(function (a) {
      if (sider.querySelector('[data-menu-id$="-' + a.key + '"]')) return;
      var after = sider.querySelector('[data-menu-id$="-' + a.after + '"]');
      if (!after) return;
      var li = after.cloneNode(true);
      li.setAttribute('data-menu-id', (after.getAttribute('data-menu-id') || '').replace(/^(rc-menu-uuid-\d+-\d+-).*$/, '$1') + a.key);
      li.setAttribute('title', a.label);
      li.classList.remove('pf-menu-item-selected');
      if (a.page) li.setAttribute('data-pf-page', a.page);
      /* its label: the text outside its icon (an expanded rail's items carry an empty title) */
      var w = document.createTreeWalker(li, NodeFilter.SHOW_TEXT), swapped = false;
      for (var t = w.nextNode(); t; t = w.nextNode()) if (t.textContent.trim() && !(t.parentElement && t.parentElement.closest('.anticon, svg'))) { t.textContent = a.label; swapped = true; break; }
      if (!swapped) li.appendChild(document.createTextNode(a.label));
      var src = a.icon && sider.querySelector('[data-menu-id$="-' + a.icon + '"] .anticon'), dst = li.querySelector('.anticon');
      if (src && dst) dst.replaceWith(src.cloneNode(true));
      after.parentNode.insertBefore(li, after.nextSibling);
    });
    if (selected) {
      var sel = sider.querySelector('[data-menu-id$="-' + selected + '"]');
      if (sel) { Array.prototype.forEach.call(sider.querySelectorAll('.pf-menu-item-selected'), function (e) { e.classList.remove('pf-menu-item-selected'); }); sel.classList.add('pf-menu-item-selected'); }
    }
  }

  function roots() {
    var out = [];
    if (L.mode === 'rail') {
      var s = document.querySelector(RAIL);
      editRail(s, L.rail, L.selected);
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
    });
  }
  function label(e) { return (e.getAttribute('title') || e.getAttribute('aria-label') || e.textContent || '').replace(/\s+/g, ' ').trim(); }
  document.addEventListener('click', function (e) {
    var t = e.target.nodeType === 1 ? e.target : e.target.parentElement;
    e.preventDefault(); e.stopPropagation();
    var inside = t && t.closest('[data-pf-show-root]');
    if (!inside || inside.matches(SCRIM)) { send({ type: 'close' }); return; }
    var go = t.closest('[data-pf-go]');
    if (go) { send({ type: 'go', path: go.getAttribute('data-pf-go') }); return; }
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
