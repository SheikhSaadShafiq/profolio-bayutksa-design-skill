/**
 * The recorder for a signed-in session — injected into a page on the local dev
 * server by fetching it from scripts/receive-real.mjs (/recorder.js). It
 * records what the API ANSWERS as keys and types only (strings become their
 * length unless they look like an enum slug), captures what a screen LOOKS like
 * with tools/profolio-capture/capture.js (geometry, allow-listed styles, class
 * names — no text), and posts both to the receiver under an account name.
 *
 *   (0, eval)(await (await fetch('http://127.0.0.1:3199/recorder.js')).text());
 *   await __pfVisit('/listings');           // navigate inside the app, settle
 *   await __pfCap('listings', 'b');         // capture this screen as account b
 *   await __pfFlush('b');                   // post the shapes recorded so far
 *
 * Installing it twice is harmless; a full page load removes it, so re-inject.
 */
(() => {
  if (window.__pfRecorder) return 'already installed';
  window.__pfRecorder = true;
  window.__shapes = window.__shapes || {};
  const SLUG = /^[a-z][a-z0-9_-]{1,30}$/;
  const leaf = (v) => (typeof v === 'string' ? (SLUG.test(v) ? `"${v}"` : `string(${v.length})`) : v === null ? 'null' : typeof v);
  const merge = (a, b) => {
    if (a === undefined) return b;
    if (b === undefined) return a;
    if (a && typeof a === 'object' && !Array.isArray(a) && b && typeof b === 'object' && !Array.isArray(b)) { const o = { ...a }; for (const k of Object.keys(b)) o[k] = merge(a[k], b[k]); return o; }
    if (Array.isArray(a) && Array.isArray(b)) return a.length ? a : b;
    return a === 'null' ? b : a;
  };
  /* arrays: the union of every item's keys, so row variants are all seen */
  const shape = (v, d = 0) => {
    if (Array.isArray(v)) { if (!v.length) return []; let u; for (const x of v.slice(0, 50)) u = merge(u, shape(x, d + 1)); return [u, `×${v.length}`]; }
    if (v && typeof v === 'object') { if (d > 8) return '{…}'; const o = {}; for (const k of Object.keys(v).slice(0, 120)) o[k] = shape(v[k], d + 1); return o; }
    return leaf(v);
  };
  const record = (m, u, j) => {
    const key = `${m} ${u.pathname}`;
    const prev = window.__shapes[key];
    window.__shapes[key] = { q: [...new Set([...(prev ? prev.q : []), ...u.searchParams.keys()])], shape: prev ? merge(prev.shape, shape(j)) : shape(j) };
  };
  const open = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (m, u) { this.__u = u; this.__m = m; return open.apply(this, arguments); };
  const send = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.send = function () {
    this.addEventListener('load', () => { try { const u = new URL(this.__u, location.href); if (/\/api\//.test(u.pathname)) record(this.__m, u, JSON.parse(this.responseText)); } catch {} });
    return send.apply(this, arguments);
  };
  const f = window.fetch;
  window.fetch = async function (input, init) {
    const res = await f.apply(this, arguments);
    try {
      const u = new URL(typeof input === 'string' ? input : input.url, location.href);
      const m = (init && init.method) || (typeof input !== 'string' && input.method) || 'GET';
      if (/\/api\//.test(u.pathname) && u.origin === location.origin || /\/api\//.test(u.pathname)) res.clone().json().then((j) => record(m, u, j)).catch(() => {});
    } catch {}
    return res;
  };
  const R = 'http://127.0.0.1:3199';
  window.__pfFlush = async (account) => {
    const r = await f(`${R}/shapes${account ? `?account=${account}` : ''}`, { method: 'POST', body: JSON.stringify(window.__shapes) });
    return `${r.status} ${(await r.text()).slice(0, 80)}`;
  };
  window.__pfCap = async (name, account, hide = '') => {
    const st = document.createElement('style');
    st.textContent = 'html{scrollbar-width:none}html::-webkit-scrollbar{display:none}' + hide;
    document.head.appendChild(st);
    await new Promise((r) => setTimeout(r, 700));
    const cap = (0, eval)(await (await f(`${R}/capture.js`)).text());
    st.remove();
    const r = await f(`${R}/capture?name=${name}${account ? `&account=${account}` : ''}`, { method: 'POST', body: JSON.stringify(cap) });
    return `${name} ${r.status} ${cap.nodes}n ${cap.viewport.page.w}x${cap.viewport.page.h}`;
  };
  window.__pfVisit = async (route) => {
    if (location.pathname !== '/en' + route) { history.pushState({}, '', '/en' + route); dispatchEvent(new PopStateEvent('popstate')); }
    await new Promise((r) => setTimeout(r, 1500));
    const t0 = Date.now();
    while (Date.now() - t0 < 15000) {
      const busy = [...document.querySelectorAll('.ant-spin-spinning,.ant-skeleton-active')].some((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; });
      if (!busy && document.querySelector('.ant-layout-content, main')) break;
      await new Promise((r) => setTimeout(r, 400));
    }
    await new Promise((r) => setTimeout(r, 2000));
    const vis = (s) => [...document.querySelectorAll(s)].some((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; });
    return { at: location.pathname, tour: vis('.ant-tour:not(.ant-tour-hidden)'), modal: vis('.ant-modal-wrap:not([style*="display: none"]) .ant-modal'), nodes: document.querySelectorAll('body *').length };
  };
  return 'installed';
})();
