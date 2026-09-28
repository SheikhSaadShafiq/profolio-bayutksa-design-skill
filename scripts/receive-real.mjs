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

  if (req.method === 'GET' && (url.pathname === '/capture.js' || url.pathname === '/recorder.js')) {
    res.writeHead(200, { ...h, 'Content-Type': 'text/javascript' });
    return res.end(readFileSync(join(ROOT, 'tools/profolio-capture', url.pathname.slice(1)), 'utf8'));
  }

  /* API SHAPES — what the real API answers, as keys and types. The page
     side records shape only (arrays cut to one item, strings as their
     length); this side then keeps a string's VALUE only under keys that hold
     enumerations (slug, status, …), strips numeric ids out of paths, and
     merges into data/api-shapes.json, which scripts/check-fixtures.mjs holds
     harness/fixtures.mjs to. */
  if (req.method === 'POST' && url.pathname === '/shapes') {
    let body = '';
    req.on('data', (d) => { body += d; if (body.length > 16e6) req.destroy(); });
    req.on('end', () => {
      let got;
      try { got = JSON.parse(body); } catch { res.writeHead(400, h); return res.end('not JSON'); }
      const ENUM_KEYS = /^(slug|status|state|type|kind|action_performed|image_type|key|code|platform|purpose_slug|category|mode|currency)$/;
      const clean = (v, key = '') => {
        if (Array.isArray(v)) return v.map((x) => clean(x, key));
        if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, clean(x, k)]));
        if (typeof v === 'string' && /^"/.test(v) && !ENUM_KEYS.test(key)) return `string(${v.length - 2})`;
        return v;
      };
      /* a second account's shapes are kept apart (?account=b), so the delta
         between two real accounts can be read — scripts/delta-accounts.mjs */
      const acct = (url.searchParams.get('account') || '').replace(/[^a-z0-9]/g, '');
      const file = join(ROOT, 'data', acct ? `api-shapes.${acct}.json` : 'api-shapes.json');
      let all = {};
      try { all = JSON.parse(readFileSync(file, 'utf8')); } catch {}
      for (const [k, v] of Object.entries(got)) all[k.replace(/\/\d+(?=\/|$)/g, '/:id')] = clean(v);
      const json = JSON.stringify(all, null, 1);
      /* A shape's KEYS are the API's field names — id, title, name — and
         leaks.mjs, written for captures, rightly refuses those there. Here the
         question is the VALUES, so every leaf is held to what a shape may
         contain: a type, a length, a count, or an enumeration's slug. */
      const bad = [];
      const LEAF = /^(number|boolean|null|undefined|string\(\d+\)|\{…\}|×\d+|"[a-z][a-z0-9_-]{0,30}")$/;
      const walk = (v, at) => {
        /* q is the endpoint's query-parameter NAMES (page, platform_id[]) */
        if (/^\.[^.]+\.q$/.test(at) && Array.isArray(v)) return v.forEach((x) => { if (!/^[\w[\].-]{1,60}$/.test(x)) bad.push(`${at}=${x}`); });
        if (Array.isArray(v)) return v.forEach((x, i) => walk(x, `${at}[${i}]`));
        if (v && typeof v === 'object') return Object.entries(v).forEach(([k, x]) => walk(x, `${at}.${k}`));
        if (typeof v !== 'string' || !LEAF.test(v)) bad.push(`${at}=${String(v).slice(0, 30)}`);
      };
      walk(all, '');
      if (bad.length) { res.writeHead(422, h); return res.end('refused: ' + bad.slice(0, 5).join(' · ')); }
      writeFileSync(file, json);
      console.log(`  wrote ${file.slice(ROOT.length + 1)}  ${Object.keys(all).length} endpoints`);
      res.writeHead(200, h); res.end(JSON.stringify({ ok: true, endpoints: Object.keys(all).length }));
    });
    return;
  }

  if (req.method === 'POST' && url.pathname === '/capture') {
    const name = url.searchParams.get('name') || '';
    if (!/^[a-z0-9][a-z0-9-]*$/.test(name)) { res.writeHead(400, h); return res.end('name must be a route slug'); }
    let body = '';
    req.on('data', (d) => { body += d; if (body.length > 64e6) req.destroy(); });
    req.on('end', () => {
      let cap;
      try { cap = JSON.parse(body); } catch { res.writeHead(400, h); return res.end('not JSON'); }
      /* web captures are taken at 1440; a responsive one is named <page>--mobile
         and taken at phone width (the product's mobile layout is chosen by
         user agent, src/utility/general.js isMobile — so it must ALSO come
         from a mobile browser, which only the page can know) */
      const mobile = /--mobile$/.test(name);
      if (mobile ? !(cap?.viewport?.w >= 320 && cap?.viewport?.w <= 480) : cap?.viewport?.w !== 1440) {
        res.writeHead(422, h); return res.end(`viewport is ${cap?.viewport?.w} wide; web captures are 1440, --mobile captures 320–480`);
      }
      cap.source = 'real-account';
      cap.route = name;
      const json = JSON.stringify(cap);
      const leaks = findLeaks(json);
      if (leaks.length) {
        console.error(`  REFUSED ${name} — ${leaks.join(' · ')}`);
        res.writeHead(422, h); return res.end('refused: ' + leaks.join(' · '));
      }
      mkdirSync(OUT, { recursive: true });
      const acct = (url.searchParams.get('account') || '').replace(/[^a-z0-9]/g, '');
      const out = `${name}.real${acct ? '-' + acct : ''}.capture.json`;
      writeFileSync(join(OUT, out), json);
      console.log(`  wrote ${out}  ${cap.nodes} nodes  page ${cap.viewport.page.w}×${cap.viewport.page.h}`);
      res.writeHead(200, { ...h, 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, name, file: out, nodes: cap.nodes, page: cap.viewport.page }));
    });
    return;
  }
  res.writeHead(404, h); res.end();
}).listen(PORT, '127.0.0.1', () => console.log(`  receiving real captures on http://127.0.0.1:${PORT}`));
