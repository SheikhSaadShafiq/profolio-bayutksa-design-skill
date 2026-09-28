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
const docs = [
  'design-system.html',
  ...list('').filter((f) => f !== 'design-system.html' && isCompiled(f)),
  ...list('states', 'states/'),
  ...list('components', 'components/'),
];
const packed = {};
let raw = 0;
for (const rel of docs) {
  const html = readFileSync(join(D, rel), 'utf8');
  raw += html.length;
  packed[rel] = gzipSync(Buffer.from(html, 'utf8'), { level: 9 }).toString('base64');
}

/* the stylesheets — ds.css imports fonts.css, which a blob URL cannot resolve, so inline it */
const fonts = readFileSync(join(D, 'fonts.css'), 'utf8');
const sheets = {
  'profolio.css': readFileSync(join(D, 'profolio.css'), 'utf8'),
  'ds.css': readFileSync(join(D, 'ds.css'), 'utf8').replace(/@import url\("fonts\.css"\);?/, fonts),
  'fonts.css': fonts,
  'tokens.css': existsSync(join(D, 'tokens.css')) ? readFileSync(join(D, 'tokens.css'), 'utf8') : '',
  'components/states.css': existsSync(join(D, 'components', 'states.css')) ? readFileSync(join(D, 'components', 'states.css'), 'utf8') : '',
};
const images = {};
if (existsSync(join(D, 'components', 'img'))) {
  for (const f of readdirSync(join(D, 'components', 'img'))) if (f.endsWith('.png')) images[`components/img/${f}`] = `data:image/png;base64,${readFileSync(join(D, 'components', 'img', f)).toString('base64')}`;
}

const payload = JSON.stringify({ docs: packed, sheets, images }).replace(/<\//g, '<\\/');
const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Profolio KSA — design system (single file)</title>
<style>
  html, body { margin: 0; height: 100%; background: #fff; font: 13px/1.4 system-ui, -apple-system, "Segoe UI", sans-serif; }
  .pk-bar { position: fixed; inset: 0 0 auto 0; height: 36px; display: flex; align-items: center; gap: 12px; padding: 0 14px; background: #006169; color: #fff; z-index: 2; }
  .pk-bar b { font-weight: 700; }
  .pk-bar button { border: 0; background: rgba(255,255,255,.16); color: #fff; border-radius: 4px; padding: 4px 10px; font: inherit; cursor: pointer; }
  .pk-bar button:disabled { opacity: .4; cursor: default; }
  .pk-bar span { opacity: .8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  iframe { position: fixed; inset: 36px 0 0 0; width: 100%; height: calc(100% - 36px); border: 0; }
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
    html = html.replace(/ src="([^"]+\\.png)"/g, (m, s) => { const r = resolve(path, s); return r && DATA.images[r] ? ' src="' + DATA.images[r] + '"' : m; });
    if (push && current) history.push(current);
    current = path;
    document.getElementById('back').disabled = !history.length;
    document.getElementById('where').textContent = path;
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
        else if (/^\\.\\.\\/kb\\/|^\\.\\.\\/\\.\\.\\/kb\\//.test(href)) { e.preventDefault(); window.open(href.replace(/^(\\.\\.\\/)+/, 'kb/'), '_blank'); }
      });
    };
    view.srcdoc = html;
    return true;
  };
  document.getElementById('back').onclick = () => { const k = history.pop(); if (k) show(k, false); };
  document.getElementById('home').onclick = () => show('design-system.html');
  show('design-system.html');
})();
</script>
</body>
</html>
`;
writeFileSync(join(D, 'profolio-ksa.html'), html);
console.log(`  deliverables/profolio-ksa.html — ${docs.length} documents (${(raw / 1048576).toFixed(1)} MB of HTML) in ${(html.length / 1048576).toFixed(1)} MB`);
