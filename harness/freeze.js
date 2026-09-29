/**
 * Injected into a harness page by scripts/compile.mjs. Freezes what is on
 * screen into markup plus the CSS that paints it, and says where each piece
 * came from in the product's source.
 *
 * It only ever runs on the HARNESS — the fixture account, invented data — so
 * unlike tools/profolio-capture/capture.js it keeps text: the text is the
 * fixture's, and a page without its words is not the page.
 *
 * Returns { html, css: [{ text, base }], unreadable: [href], sc: {componentId: {src, dn}},
 *           generated: {className: componentId}, scroll: {x, y}, overlay }
 */
(async () => {
  /* ── 1 · provenance, from React's own fiber tree ───────────────────────
     In development every fiber made by JSX carries _debugSource — the file,
     line and column of the JSX that made it. The nearest one inside src/ is
     the product code that asked for this element; a styled component's fiber
     also carries its styledComponentId, which is the class it paints with. */
  const rootEl = document.getElementById('root');
  const ck = rootEl && Object.keys(rootEl).find((k) => k.startsWith('__reactContainer'));
  const rel = (f) => f.replace(/^.*?\/src\//, 'src/').replace(/\?.*$/, '');
  const sc = {};
  /* the first DOM element a composite fiber renders, in document order */
  const hostOf = (fiber) => {
    for (let c = fiber.child; c; c = c.sibling) {
      if (c.stateNode instanceof Element) return c.stateNode;
      const h = hostOf(c);
      if (h) return h;
    }
    return null;
  };
  const nameOf = (t) => (t && typeof t !== 'string' ? (t.displayName || t.name || nameOf(t.type) || nameOf(t.render) || '') : '');
  /* where a component is DEFINED: the file of the JSX it renders itself —
     the first fiber below it whose owner is this very fiber */
  const defOf = (fiber) => {
    const q = [fiber.child];
    for (let n = 0; q.length && n < 400; n++) {
      const f = q.shift();
      if (!f) continue;
      if (f._debugOwner === fiber && f._debugSource && /\/src\//.test(f._debugSource.fileName)) return rel(f._debugSource.fileName);
      q.push(f.child, f.sibling);
    }
    return null;
  };
  /* INSTANCES. Every product component rendered here marks the first DOM
     element it draws with its name (data-pf-i, outermost first when several
     components share a root) — that element is where the design system cuts
     the component out. components{} says which file defines each. */
  const components = {};
  if (ck) {
    const stack = [rootEl[ck]];
    while (stack.length) {
      const f = stack.pop();
      if (!f) continue;
      const src = f._debugSource && /\/src\//.test(f._debugSource.fileName) ? f._debugSource : null;
      if (f.type && f.type.styledComponentId && !sc[f.type.styledComponentId]) {
        sc[f.type.styledComponentId] = {
          dn: f.type.displayName || '',
          src: src ? `${rel(src.fileName)}:${src.lineNumber}:${src.columnNumber || 0}` : null,
        };
      }
      if (src && typeof f.type !== 'string' && f.type && !f.type.styledComponentId) {
        const name = nameOf(f.type);
        const def = name && defOf(f);
        const el = def && hostOf(f);
        if (el) {
          const key = `${name}@${def}`;
          components[key] ||= { name, def, n: 0 };
          components[key].n++;
          const had = el.getAttribute('data-pf-i');
          if (!had || !had.split(' ').includes(key)) el.setAttribute('data-pf-i', had ? `${had} ${key}` : key);
        }
      }
      if (src) {
        const el = f.stateNode instanceof Element ? f.stateNode : hostOf(f);
        /* deepest wins: the DFS reaches an outer JSX element before the inner
           one that shares its first DOM node, and the inner one is the more
           specific answer to "who drew this" */
        if (el) {
          el.setAttribute('data-pf-src', `${rel(src.fileName)}:${src.lineNumber}`);
          const owner = nameOf(f._debugOwner && f._debugOwner.type);
          if (owner) el.setAttribute('data-pf-c', owner);
        }
      }
      stack.push(f.sibling, f.child);
    }
  }

  /* the generated class sits right after its componentId in the class list
     (styled-components v5: foldedIds, componentId, generatedClass, props.className) */
  const generated = {};
  for (const el of document.querySelectorAll('[class]')) {
    const cls = [...el.classList];
    for (let i = 0; i < cls.length; i++) {
      if (sc[cls[i]] && cls[i + 1] && !sc[cls[i + 1]]) generated[cls[i + 1]] = cls[i];
    }
  }

  /* ── 2 · the CSS that paints this state, in cascade order ───────────────
     A rule is kept when any part of its selector matches something in the
     document once its dynamic pseudo-classes are set aside — so :hover and
     :focus rules for an element that is here survive, and the page stays
     alive to the pointer. Order is document order, which is the cascade. */
  const PSEUDO_EL = /::?(before|after|placeholder|selection|marker|backdrop|first-letter|first-line|-webkit-[\w-]+|-moz-[\w-]+)/g;
  const matches = (selectorText) => {
    for (const part of selectorText.split(/,(?![^(]*\))/)) {
      let s = part.replace(PSEUDO_EL, '').replace(/:(hover|focus-visible|focus-within|focus|active|visited|target|-webkit-autofill|-moz-focusring)\b/g, '').trim();
      if (!s || /[>+~]$/.test(s)) s = (s + ' *').trim();
      try { if (document.querySelector(s)) return true; } catch { return true; }
    }
    return false;
  };
  const keep = (rule) => {
    if (rule instanceof CSSStyleRule) return matches(rule.selectorText) ? rule.cssText : '';
    if (rule.cssRules && (rule instanceof CSSMediaRule || rule instanceof CSSSupportsRule
      || (window.CSSLayerBlockRule && rule instanceof CSSLayerBlockRule)
      || (window.CSSContainerRule && rule instanceof CSSContainerRule))) {
      const inner = [...rule.cssRules].map(keep).filter(Boolean);
      if (!inner.length) return '';
      const head = rule.cssText.slice(0, rule.cssText.indexOf('{')).trim();
      return `${head} {\n${inner.join('\n')}\n}`;
    }
    return rule.cssText;               /* @font-face, @keyframes, @property, @layer a, b; */
  };
  const css = [];
  const unreadable = [];
  const walkSheet = (sheet) => {
    let rules;
    try { rules = sheet.cssRules; } catch { unreadable.push(sheet.href); return; }
    const base = sheet.href || document.baseURI;
    const kept = [];
    for (const r of rules) {
      if (r instanceof CSSImportRule && r.styleSheet) { if (kept.length) { css.push({ text: kept.join('\n'), base }); kept.length = 0; } walkSheet(r.styleSheet); continue; }
      const t = keep(r);
      if (t) kept.push(t);
    }
    if (kept.length) css.push({ text: kept.join('\n'), base });
  };
  for (const sheet of document.styleSheets) {
    if (sheet.disabled) continue;
    walkSheet(sheet);
  }

  /* ── 3 · everything a file:// page cannot fetch, as data URIs ───────── */
  const cache = new Map();
  const dataUrl = async (url) => {
    if (cache.has(url)) return cache.get(url);
    const p = (async () => {
      try {
        const u = new URL(url, document.baseURI);
        if (u.protocol === 'data:') return url;
        /* another origin only when it answers (the harness serves the phone
           field's flags locally, with CORS); everything else it refuses */
        const res = await fetch(u.href, u.origin === location.origin ? {} : { mode: 'cors' });
        if (!res.ok) return null;
        const blob = await res.blob();
        return await new Promise((ok) => { const fr = new FileReader(); fr.onload = () => ok(fr.result); fr.onerror = () => ok(null); fr.readAsDataURL(blob); });
      } catch { return null; }
    })();
    cache.set(url, p);
    return p;
  };
  const inlineUrls = async (text, base) => {
    const found = [...text.matchAll(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g)];
    let out = text;
    for (const m of found) {
      if (m[2].startsWith('data:') || m[2].startsWith('#')) continue;
      const abs = new URL(m[2], base).href;
      const d = await dataUrl(abs);
      out = out.split(m[0]).join(d ? `url("${d}")` : 'none');
    }
    return out;
  };
  for (const c of css) c.text = await inlineUrls(c.text, c.base);

  /* scroll lives in properties too: an element scrolled inside the page (a
     form panel, a table scrolled sideways to reach a cell) is recorded as
     data-pf-scroll and put back when the compiled file loads — the window's
     own scroll is returned separately */
  let scrolled = 0;
  for (const el of document.querySelectorAll('body *')) {
    if (el.scrollTop > 0 || el.scrollLeft > 0) { el.setAttribute('data-pf-scroll', `${Math.round(el.scrollLeft)},${Math.round(el.scrollTop)}`); scrolled++; }
  }

  /* form state lives in properties, not attributes; outerHTML only sees attributes */
  for (const el of document.querySelectorAll('input, textarea, select')) {
    if (el.tagName === 'TEXTAREA') el.textContent = el.value;
    else if (el.tagName === 'SELECT') [...el.options].forEach((o) => o.toggleAttribute('selected', o.selected));
    else if (el.type === 'checkbox' || el.type === 'radio') el.toggleAttribute('checked', el.checked);
    else if (el.type !== 'file' && el.type !== 'password') el.setAttribute('value', el.value);
  }

  const canvases = [...document.querySelectorAll('canvas')].map((c) => { try { return c.toDataURL(); } catch { return null; } });
  /* the pointer and the focus are state too: what was hovered, focused or
     pressed when the page was frozen is marked, and compile.mjs makes the
     product's :hover, :focus… rules match the mark — the copy shows what the
     product showed, with no pointer over it */
  for (const [pc, attr] of [[':hover', 'data-pf-hover'], [':focus', 'data-pf-focus'], [':focus-visible', 'data-pf-focus-visible'], [':focus-within', 'data-pf-focus-within'], [':active', 'data-pf-active']]) {
    try { for (const el of document.querySelectorAll(pc)) if (el !== document.documentElement && el !== document.body) el.setAttribute(attr, ''); } catch {}
  }
  const doc = document.documentElement.cloneNode(true);
  doc.querySelectorAll('canvas').forEach((c, i) => {
    const img = document.createElement('img');
    if (canvases[i]) img.setAttribute('src', canvases[i]);
    for (const a of c.attributes) if (a.name !== 'width' && a.name !== 'height') img.setAttribute(a.name, a.value);
    img.setAttribute('width', c.getAttribute('width') || ''); img.setAttribute('height', c.getAttribute('height') || '');
    img.setAttribute('data-pf-was', 'canvas');
    c.replaceWith(img);
  });
  for (const img of doc.querySelectorAll('img[src]')) {
    const d = await dataUrl(img.getAttribute('src'));
    if (d) img.setAttribute('src', d); else img.removeAttribute('src');
    img.removeAttribute('srcset');
  }
  for (const im of doc.querySelectorAll('image')) {
    const h = im.getAttribute('href') || im.getAttribute('xlink:href');
    if (h && !h.startsWith('data:')) { const d = await dataUrl(h); if (d) im.setAttribute('href', d); }
  }
  for (const el of doc.querySelectorAll('[style*="url("]')) el.setAttribute('style', await inlineUrls(el.getAttribute('style'), document.baseURI));
  doc.querySelectorAll('script, noscript, style, iframe, link, template').forEach((n) => n.remove());
  /* comments draw nothing, and the product's index.html carries a commented-
     out tag-manager iframe that would read as a network dependency */
  { const w = document.createTreeWalker(doc, NodeFilter.SHOW_COMMENT); const cs = []; while (w.nextNode()) cs.push(w.currentNode); cs.forEach((c) => c.remove()); }
  doc.querySelectorAll('meta').forEach((m) => { if (!/^(charset|viewport)$/i.test(m.getAttribute('name') || (m.hasAttribute('charset') ? 'charset' : ''))) m.remove(); });
  /* Markup React builds and the HTML parser cannot keep — a <div> in a <p>,
     a link in a link, a button in a button, a form in a form, a heading right
     inside a heading — comes apart when the file is read back. Each such
     element is written <pf-el data-pf-tag="…"> and made real again as the
     page loads (the rules are scripts/lib/nested-a.mjs's; compile.mjs puts
     them in the placeholder below). The CSS above was collected from the live
     document, so every selector that names the real tag is kept. */
  /* an element still entering (antd's -appear/-enter motion classes) is
     written as it will be once it has: the copy has no animation to finish */
  for (const el of doc.querySelectorAll('[class*="-appear"], [class*="-enter"]')) {
    const keep = [...el.classList].filter((c) => !/^ant-[\w-]+-(appear|enter)(-(active|prepare|start))?$/.test(c));
    if (keep.length !== el.classList.length) el.setAttribute('class', keep.join(' '));
  }
  const unparsable = typeof __UNPARSABLE__ === 'function' ? __UNPARSABLE__ : null;
  if (unparsable) unparsable(doc);

  const vis = (sel) => [...document.querySelectorAll(sel)].some((el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; });
  return {
    html: '<!doctype html>\n' + doc.outerHTML,
    css, unreadable, sc, generated, components,
    scroll: { x: Math.round(scrollX), y: Math.round(scrollY) },
    /* boxes scrolled inside the page: a full-page shot resizes the viewport,
       their heights with it, and re-clamps where they are scrolled to */
    scrolled,
    overlay: { modal: vis('.ant-modal'), drawer: vis('.ant-drawer-content'), popover: vis('.ant-popover'), dropdown: vis('.ant-dropdown:not(.ant-dropdown-hidden)'), tour: vis('.ant-tour'),
      select: vis('.ant-select-dropdown:not(.ant-select-dropdown-hidden)'), picker: vis('.ant-picker-dropdown:not(.ant-picker-dropdown-hidden)'), tooltip: vis('.ant-tooltip:not(.ant-tooltip-hidden)') },
    title: document.title,
  };
})();
