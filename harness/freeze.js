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
  const nameOf = (t) => (t && typeof t !== 'string' ? (t.displayName || t.name || '') : '');
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
        if (u.origin !== location.origin) return null;
        const res = await fetch(u.href);
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

  /* form state lives in properties, not attributes; outerHTML only sees attributes */
  for (const el of document.querySelectorAll('input, textarea, select')) {
    if (el.tagName === 'TEXTAREA') el.textContent = el.value;
    else if (el.tagName === 'SELECT') [...el.options].forEach((o) => o.toggleAttribute('selected', o.selected));
    else if (el.type === 'checkbox' || el.type === 'radio') el.toggleAttribute('checked', el.checked);
    else if (el.type !== 'file' && el.type !== 'password') el.setAttribute('value', el.value);
  }

  const canvases = [...document.querySelectorAll('canvas')].map((c) => { try { return c.toDataURL(); } catch { return null; } });
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
  doc.querySelectorAll('meta').forEach((m) => { if (!/^(charset|viewport)$/i.test(m.getAttribute('name') || (m.hasAttribute('charset') ? 'charset' : ''))) m.remove(); });

  const vis = (sel) => [...document.querySelectorAll(sel)].some((el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; });
  return {
    html: '<!doctype html>\n' + doc.outerHTML,
    css, unreadable, sc, generated,
    scroll: { x: Math.round(scrollX), y: Math.round(scrollY) },
    overlay: { modal: vis('.ant-modal'), drawer: vis('.ant-drawer-content'), popover: vis('.ant-popover'), dropdown: vis('.ant-dropdown'), tour: vis('.ant-tour') },
    title: document.title,
  };
})();
