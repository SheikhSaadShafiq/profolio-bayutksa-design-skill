#!/usr/bin/env node
/**
 * Receive captures of REAL, signed-in Profolio screens, straight from a browser.
 *
 * measure-real.mjs takes a SingleFile, because in the sandbox this project
 * started in there was no route to anybody's browser. On a machine where the
 * product runs locally and someone is signed in to staging, there is: the page
 * itself can run the capture walker and hand the result over. This is the
 * other end of that hand-over.
 *
 *   node scripts/receive-real.mjs            listens on 127.0.0.1:3199
 *
 * Then, in the signed-in tab (viewport 1440 wide), run:
 *
 *   const src = await (await fetch('http://127.0.0.1:3199/capture.js')).text();
 *   const cap = (0, eval)(src);
 *   await fetch('http://127.0.0.1:3199/capture?name=dashboard', { method: 'POST', body: JSON.stringify(cap) });
 *
 * Writes data/live/<name>.real.capture.json — the same shape as every other
 * capture, so qa-fidelity.mjs and derive-layout.mjs read it unchanged.
 *
 * PRIVACY. The walker records geometry, an allow-list of computed styles,
 * class names and icon names — no text, href, src, value, id or data-*. This
 * re-proves that with scripts/leaks.mjs on every capture BEFORE writing, and
 * refuses the whole capture if anything slipped through. It listens on the
 * loopback address only and accepts a page only from the local dev server.
 * No screenshot is taken or stored: a picture of a real account is a picture
 * of real listings, prices and people.
 */
import { createServer } from 'node:http';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { findLeaks } from './leaks.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'data', 'live');
const PORT = Number(process.env.RECEIVE_PORT || 3199);
/* the signed-in dev server; nothing else may post */
const ALLOWED = new Set(['http://localhost:3000', 'http://127.0.0.1:3000']);

const cors = (req) => {
  const o = req.headers.origin;
  return ALLOWED.has(o) ? { 'Access-Control-Allow-Origin': o, 'Access-Control-Allow-Methods': 'GET, POST', 'Access-Control-Allow-Headers': 'content-type', Vary: 'Origin' } : {};
};

createServer((req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
  const h = cors(req);
  if (req.method === 'OPTIONS') { res.writeHead(204, h); return res.end(); }
  if (!h['Access-Control-Allow-Origin']) { res.writeHead(403); return res.end('origin not allowed'); }

  if (req.method === 'GET' && url.pathname === '/capture.js') {
    res.writeHead(200, { ...h, 'Content-Type': 'text/javascript' });
    return res.end(readFileSync(join(ROOT, 'tools/profolio-capture/capture.js'), 'utf8'));
  }

  if (req.method === 'POST' && url.pathname === '/capture') {
    const name = url.searchParams.get('name') || '';
    if (!/^[a-z0-9][a-z0-9-]*$/.test(name)) { res.writeHead(400, h); return res.end('name must be a route slug'); }
    let body = '';
    req.on('data', (d) => { body += d; if (body.length > 64e6) req.destroy(); });
    req.on('end', () => {
      let cap;
      try { cap = JSON.parse(body); } catch { res.writeHead(400, h); return res.end('not JSON'); }
      if (cap?.viewport?.w !== 1440) { res.writeHead(422, h); return res.end(`viewport is ${cap?.viewport?.w} wide; captures are taken at 1440`); }
      cap.source = 'real-account';
      cap.route = name;
      const json = JSON.stringify(cap);
      const leaks = findLeaks(json);
      if (leaks.length) {
        console.error(`  REFUSED ${name} — ${leaks.join(' · ')}`);
        res.writeHead(422, h); return res.end('refused: ' + leaks.join(' · '));
      }
      mkdirSync(OUT, { recursive: true });
      writeFileSync(join(OUT, `${name}.real.capture.json`), json);
      console.log(`  wrote ${name}.real.capture.json  ${cap.nodes} nodes  page ${cap.viewport.page.w}×${cap.viewport.page.h}`);
      res.writeHead(200, { ...h, 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, name, nodes: cap.nodes, page: cap.viewport.page }));
    });
    return;
  }
  res.writeHead(404, h); res.end();
}).listen(PORT, '127.0.0.1', () => console.log(`  receiving real captures on http://127.0.0.1:${PORT}`));
