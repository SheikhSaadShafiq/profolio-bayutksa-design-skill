#!/usr/bin/env node
/**
 * Emits deliverables/profolio-ksa.html — the whole design system in ONE file.
 *
 * The deliverables are a small site: design-system.html, a page per
 * component, the compiled pages and every state, one stylesheet. This packs
 * all of it into a single file that opens from file:// with no network and
 * nothing beside it — the thing to hand to someone who just wants to open one
 * thing.
 *
 * HOW
 *   · every document is gzipped and stored as base64; the browser inflates the
 *     one being viewed with DecompressionStream, so ~34MB of HTML travels as a
 *     few MB
 *   · the stylesheets become blob: URLs, and each document's <link> points at
 *     the blob, so one copy of profolio.css serves every page
 *   · images become data: URLs
 *   · a document is shown in an iframe (srcdoc, so same-origin); a click on a
 *     link to another packed document opens that document instead of leaving
 *
 * Links into kb/ are not packed — the knowledge base is its own site — and
 * open in a new tab when the file sits beside the repo.
 *
 *   node scripts/combine.mjs
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const D = join(ROOT, 'deliverables');
const list = (dir, rel = '') => (existsSync(join(D, dir)) ? readdirSync(join(D, dir)).filter((f) => f.endsWith('.html')).map((f) => rel + f) : []);

/* the documents: the index, every compiled page, every state, every component */
const isCompiled = (rel) => /<meta name="pf-compiled"/.test(readFileSync(join(D, rel), 'utf8').slice(0, 8000));
const HOME = ['design-system.html', ...(existsSync(join(D, 'design-qa.html')) ? ['design-qa.html'] : [])];
/* Three files, not one: packed together the site is ~87 MB — over what
   GitHub will take without complaint (50 MB) and heading for its hard limit
   (100 MB). Each file is whole on its own (the index opens in every one of
   them); a link into another file opens that file at the page it names. */
const BUNDLES = [
  { out: 'profolio-ksa.html', title: 'web pages & states', docs: [...HOME, ...list('').filter((f) => !HOME.includes(f) && isCompiled(f)), ...list('states', 'states/')] },
  { out: 'profolio-ksa-responsive.html', title: 'responsive pages & states', docs: [...HOME, ...list('mobile', 'mobile/').filter(isCompiled), ...list('mobile/states', 'mobile/states/')] },
  { out: 'profolio-ksa-components.html', title: 'components', docs: [...HOME, ...list('components', 'components/')] },
];
const home = {};                                     /* doc → the bundle it lives in (the index: the first) */
for (const b of BUNDLES) for (const d of b.docs) if (!HOME.includes(d)) home[d] = b.out;
/* The prototype's navigation assigns location.href, which inside a packed
   document has no file to go to. Each document's scripts are rewritten to hand
   the target to the viewer (window.parent.__pfOpen), which resolves it
   against the document being shown; prototype.js is inlined, with the root it
   would have computed from its own URL. */
const PROTO = existsSync(join(D, 'prototype.js')) ? readFileSync(join(D, 'prototype.js'), 'utf8') : '';
const viaViewer = (js) => js.replace(/location\.href\s*=\s*([^;}\n]+)/g, 'window.parent.__pfOpen($1)');
/* where each element came from (data-pf-src, -c, -i) is for the scripts that
   build the design system; a viewer shows the same pixels without it, in a
   fraction of the size. The compiled pages keep it. */
const pack = (rel, html) => html
  .replace(/ data-pf-(src|c|i)="[^"]*"/g, '')
  .replace(/<script src="(\.\.\/)*prototype\.js"><\/script>/, () => `<script>${viaViewer(PROTO.replace(/var root = [^;]+;/, `var root = '${/(^|\/)states\//.test(rel) ? '../' : ''}';`))}</script>`)
  .replace(/<script>([\s\S]*?)<\/script>/g, (m, js) => `<script>${viaViewer(js)}</script>`);

/* the stylesheets — ds.css imports fonts.css, which a blob URL cannot resolve, so inline it */
const fonts = readFileSync(join(D, 'fonts.css'), 'utf8');
const sheets = {
  'profolio.css': readFileSync(join(D, 'profolio.css'), 'utf8'),
  'profolio.mobile.css': existsSync(join(D, 'profolio.mobile.css')) ? readFileSync(join(D, 'profolio.mobile.css'), 'utf8') : '',
  'ds.css': readFileSync(join(D, 'ds.css'), 'utf8').replace(/@import url\("fonts\.css"\);?/, fonts),
  'fonts.css': fonts,
  'tokens.css': existsSync(join(D, 'tokens.css')) ? readFileSync(join(D, 'tokens.css'), 'utf8') : '',
  'components/states.css': existsSync(join(D, 'components', 'states.css')) ? readFileSync(join(D, 'components', 'states.css'), 'utf8') : '',
};

for (const B of BUNDLES) {
  const packed = {};
  let raw = 0;
  for (const rel of B.docs) {
    const html = pack(rel, readFileSync(join(D, rel), 'utf8'));
    raw += html.length;
    packed[rel] = gzipSync(Buffer.from(html, 'utf8'), { level: 9 }).toString('base64');
  }
  /* only the images a packed document shows (the index's thumbnails): every
     variant's reference shot is in components/img/, and most are shown nowhere */
  const used = new Set();
  for (const rel of B.docs) {
    const html = readFileSync(join(D, rel), 'utf8');
    for (const m of html.matchAll(/ src="([^"]+\.png)"/g)) {
      const r = new URL(m[1], 'https://pk.local/' + rel);
      if (r.origin === 'https://pk.local') used.add(decodeURIComponent(r.pathname.slice(1)));
    }
  }
  const images = {};
  for (const rel of used) if (existsSync(join(D, rel))) images[rel] = `data:image/png;base64,${readFileSync(join(D, rel)).toString('base64')}`;
  /* where every document this bundle does not hold lives */
  const elsewhere = Object.fromEntries(Object.entries(home).filter(([d, f]) => f !== B.out));
  const payload = JSON.stringify({ docs: packed, sheets, images, elsewhere }).replace(/<\//g, '<\\/');
const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Profolio KSA — design system (${B.title})</title>
<style>
  html, body { margin: 0; height: 100%; background: #fff; font: 13px/1.4 system-ui, -apple-system, "Segoe UI", sans-serif; }
  .pk-bar { position: fixed; inset: 0 0 auto 0; height: 36px; display: flex; align-items: center; gap: 12px; padding: 0 14px; background: #006169; color: #fff; z-index: 2; }
  .pk-bar b { font-weight: 700; }
  .pk-bar button { border: 0; background: rgba(255,255,255,.16); color: #fff; border-radius: 4px; padding: 4px 10px; font: inherit; cursor: pointer; }
  .pk-bar button:disabled { opacity: .4; cursor: default; }
  .pk-bar span { opacity: .8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  iframe { position: fixed; inset: 36px 0 0 0; width: 100%; height: calc(100% - 36px); border: 0; }
  /* a responsive page is shown at the phone's width, where its breakpoints match */
  iframe.pk-phone { left: 50%; width: 375px; margin-left: -187.5px; box-shadow: 0 0 0 1px #d0d7de, 0 8px 30px rgba(0,0,0,.12); }
  body.pk-has-phone { background: #eef1f4; }
</style>
</head>
<body>
<div class="pk-bar"><b>Profolio KSA</b><button id="back" disabled>← Back</button><button id="home">Design system</button><span id="where"></span></div>
<iframe id="view" title="Profolio KSA design system"></iframe>
<script id="pk-data" type="application/json">${payload}</script>
<script>
(() => {
  const DATA = JSON.parse(document.getElementById('pk-data').textContent);
  const blobs = {};
  for (const [k, css] of Object.entries(DATA.sheets)) blobs[k] = URL.createObjectURL(new Blob([css], { type: 'text/css' }));
  const cache = {};
  const inflate = async (key) => {
    if (cache[key]) return cache[key];
    const bytes = Uint8Array.from(atob(DATA.docs[key]), (c) => c.charCodeAt(0));
    const text = await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).text();
    return (cache[key] = text);
  };
  const resolve = (from, href) => {
    try { const u = new URL(href, 'https://pk.local/' + from); return u.origin === 'https://pk.local' ? decodeURIComponent(u.pathname.slice(1)) + u.hash : null; } catch { return null; }
  };
  const view = document.getElementById('view');
  const history = [];
  let current = null;
  const show = async (key, push = true) => {
    const [path, hash] = key.split('#');
    if (!DATA.docs[path]) return false;
    let html = await inflate(path);
    html = html.replace(/<link rel="stylesheet" href="([^"]+)">/g, (m, h) => { const r = resolve(path, h); return r && blobs[r] ? '<link rel="stylesheet" href="' + blobs[r] + '">' : m; });
    /* a component page's responsive examples are documents of their own, in
       srcdoc attributes, where the same links are written with &quot; */
    html = html.replace(/&lt;link rel=&quot;stylesheet&quot; href=&quot;([^&]+)&quot;&gt;/g, (m, h) => { const r = resolve(path, h); return r && blobs[r] ? '&lt;link rel=&quot;stylesheet&quot; href=&quot;' + blobs[r] + '&quot;&gt;' : m; });
    html = html.replace(/ src="([^"]+\\.png)"/g, (m, s) => { const r = resolve(path, s); return r && DATA.images[r] ? ' src="' + DATA.images[r] + '"' : m; });
    if (push && current) history.push(current);
    current = path;
    document.getElementById('back').disabled = !history.length;
    document.getElementById('where').textContent = path;
    const phone = path.startsWith('mobile/');
    view.classList.toggle('pk-phone', phone);
    document.body.classList.toggle('pk-has-phone', phone);
    view.onload = () => {
      const doc = view.contentDocument;
      if (hash) doc.getElementById(hash)?.scrollIntoView();
      doc.addEventListener('click', (e) => {
        const a = e.target.closest('a[href]');
        if (!a) return;
        const href = a.getAttribute('href');
        if (href.startsWith('#')) return;
        const r = resolve(path, href);
        if (r && DATA.docs[r.split('#')[0]]) { e.preventDefault(); show(r); }
        else if (r && DATA.elsewhere[r.split('#')[0]]) { e.preventDefault(); window.open(DATA.elsewhere[r.split('#')[0]] + '#' + encodeURIComponent(r), '_blank'); }
        else if (/^\\.\\.\\/kb\\/|^\\.\\.\\/\\.\\.\\/kb\\//.test(href)) { e.preventDefault(); window.open(href.replace(/^(\\.\\.\\/)+/, 'kb/'), '_blank'); }
      });
    };
    view.srcdoc = html;
    return true;
  };
  /* a packed document's prototype navigation lands here */
  window.__pfOpen = (href) => { const r = resolve(current, href); if (r && DATA.docs[r.split('#')[0]]) show(r); else if (r && DATA.elsewhere[r.split('#')[0]]) window.open(DATA.elsewhere[r.split('#')[0]] + '#' + encodeURIComponent(r), '_blank'); };
  document.getElementById('back').onclick = () => { const k = history.pop(); if (k) show(k, false); };
  document.getElementById('home').onclick = () => show('design-system.html');
  /* a link from another bundle names the page after the # */
  const start = decodeURIComponent(location.hash.slice(1));
  show(start && DATA.docs[start.split('#')[0]] ? start : 'design-system.html');
})();
</script>
</body>
</html>
`;
  writeFileSync(join(D, B.out), html);
  console.log(`  deliverables/${B.out} — ${B.docs.length} documents (${(raw / 1048576).toFixed(1)} MB of HTML) in ${(html.length / 1048576).toFixed(1)} MB`);
}
