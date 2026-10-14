#!/usr/bin/env node
/**
 * The composer: a design screen made from the product's compiled files, without rewriting
 * them by hand. Run from the skill's folder.
 *
 *   node qa/compose.mjs start <compiled file> designs/<feature>/[A|B|C/]<screen>.html [--direction B] [--empty "<selector>"]
 *       a screen from a compiled page or state (pages/<page>.html, pages/<page>/<state>.html,
 *       .mobile.html for the phone): its pf-base, its links to this folder's depth, no scripts,
 *       the stylesheets (kit.css and tokens.css; B and C also their new.css, made if missing) and
 *       the shared JSON beside flow.json (state.json, data.json, actions.json). --empty keeps an
 *       element and drops its children: a new page in the product's shell.
 *   node qa/compose.mjs find <file> "<selector>"
 *       every match: its index (for --nth), tag, classes, the start of its text.
 *   node qa/compose.mjs block <compiled file> "<selector>" [--nth N] [--out <file>]
 *       one element, whole, with its own inline styles: what a screen copies. Name its file in
 *       the screen's pf-also (the `also` command).
 *   node qa/compose.mjs replace <screen> "<selector>" <html file | -> [--nth N]
 *   node qa/compose.mjs insert  <screen> "<selector>" <html file | -> --before|--after|--prepend|--append [--nth N]
 *       put a block (from `block`) or your own markup in a screen; - reads it from stdin.
 *   node qa/compose.mjs also <screen> <compiled file> [...]
 *       add compiled files to the screen's pf-also, where qa/validate.py check 1 looks.
 *
 * Selectors: a tag, .class, #id, [attr], [attr="v"], [attr*="v"], [attr^="v"], combined
 * (div.pf-card[data-pf-c="Card"]), and a descendant chain separated by spaces
 * ("aside.pf-layout-sider li[data-menu-id$=leads]" takes [attr$="v"] too). The first match unless
 * --nth (0-based, from `find`). The compiled files are the product's own markup: copy, never
 * retype.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname, resolve, relative, posix } from 'node:path';
import { fileURLToPath } from 'node:url';

const SKILL = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const opt = (n) => { const i = argv.indexOf(n); return i > -1 ? argv[i + 1] : null; };
const flag = (n) => argv.includes(n);
const pos = argv.filter((a, i) => !a.startsWith('--') && !['--nth', '--out', '--direction', '--empty'].includes(argv[i - 1]));
const die = (m) => { console.error('  ' + m); process.exit(2); };
const read = (p) => readFileSync(p, 'utf8');
const abs = (p) => resolve(SKILL, p);
const toPosix = (p) => p.split('\\').join('/');

/* ── the markup: tags, elements, selectors ─────────────────────────────── */
const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr', 'param', 'keygen']);
const RAW = new Set(['script', 'style', 'textarea', 'title']);
const TAG = /<!--[\s\S]*?-->|<(\/?)([a-zA-Z][\w:-]*)((?:[^>"']|"[^"]*"|'[^']*')*)>/g;
function attrsOf(s) {
  const out = {};
  for (const m of s.matchAll(/([^\s=/]+)(?:\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) out[m[1].toLowerCase()] = m[3] ?? m[4] ?? m[5] ?? '';
  return out;
}
/* every start tag: { name, attrs, start, open: end of the start tag, end: end of the element } */
function elements(html) {
  const out = [], stack = [];
  TAG.lastIndex = 0;
  let m;
  while ((m = TAG.exec(html))) {
    if (m[0].startsWith('<!--')) continue;
    const name = m[2].toLowerCase();
    if (!m[1]) {
      const el = { name, attrs: attrsOf(m[3]), start: m.index, open: TAG.lastIndex, end: TAG.lastIndex };
      out.push(el);
      if (VOID.has(name) || /\/\s*$/.test(m[3])) continue;
      if (RAW.has(name)) {
        const close = html.toLowerCase().indexOf(`</${name}`, TAG.lastIndex);
        const stop = close < 0 ? html.length : html.indexOf('>', close) + 1;
        el.end = stop; TAG.lastIndex = stop;
        continue;
      }
      stack.push(el);
    } else {
      for (let i = stack.length - 1; i >= 0; i--) if (stack[i].name === name) { stack[i].end = TAG.lastIndex; stack.length = i; break; }
    }
  }
  for (const el of stack) el.end = html.length;
  return out;
}
function parseCompound(s) {
  const c = { tag: null, classes: [], id: null, attrs: [] };
  const re = /^([a-zA-Z][\w-]*)|\.(-?[_a-zA-Z][\w-]*)|#([\w-]+)|\[\s*([^\s~|^$*=\]]+)\s*(?:([*^$]?=)\s*(?:"([^"]*)"|'([^']*)'|([^\]\s]*)))?\s*\]/y;
  let i = 0;
  while (i < s.length) {
    re.lastIndex = i;
    const m = re.exec(s);
    if (!m) die(`selector: cannot read "${s.slice(i)}" in "${s}"`);
    if (m[1]) c.tag = m[1].toLowerCase(); else if (m[2]) c.classes.push(m[2]); else if (m[3]) c.id = m[3];
    else c.attrs.push({ name: m[4].toLowerCase(), op: m[5] || null, value: m[6] ?? m[7] ?? m[8] ?? '' });
    i = re.lastIndex;
  }
  return c;
}
function splitSelector(sel) {
  const parts = []; let cur = '', depth = 0, q = null;
  for (const ch of sel.trim()) {
    if (q) { cur += ch; if (ch === q) q = null; continue; }
    if (ch === '"' || ch === "'") { q = ch; cur += ch; continue; }
    if (ch === '[') depth++; else if (ch === ']') depth--;
    if (/\s/.test(ch) && !depth) { if (cur) parts.push(cur); cur = ''; } else cur += ch;
  }
  if (cur) parts.push(cur);
  return parts.map(parseCompound);
}
const matches = (el, c) => (!c.tag || el.name === c.tag) && (!c.id || el.attrs.id === c.id)
  && c.classes.every((k) => (el.attrs.class || '').split(/\s+/).includes(k))
  && c.attrs.every((a) => {
    const v = el.attrs[a.name];
    if (v === undefined) return false;
    return !a.op || (a.op === '=' ? v === a.value : a.op === '*=' ? v.includes(a.value) : a.op === '^=' ? v.startsWith(a.value) : v.endsWith(a.value));
  });
function select(html, sel) {
  const els = elements(html), chain = splitSelector(sel);
  let scope = [[0, html.length]];
  let found = [];
  chain.forEach((c, k) => {
    found = els.filter((el) => matches(el, c) && scope.some(([a, b]) => el.start >= a && el.end <= b && !(k && el.start === a)));
    scope = found.map((el) => [el.start, el.end]);
  });
  return found;
}
function one(html, sel, file) {
  const found = select(html, sel), n = Number(opt('--nth') || 0);
  if (!found.length) die(`${file}: nothing matches "${sel}" (node qa/compose.mjs find ${file} "<selector>")`);
  if (n >= found.length) die(`${file}: "${sel}" has ${found.length} match(es); --nth ${n} is past them`);
  return found[n];
}
const content = (src) => (src === '-' ? readFileSync(0, 'utf8') : existsSync(abs(src)) ? read(abs(src)) : src);

/* ── the screen's head: metas, links, scripts ──────────────────────────── */
const meta = (html, name) => { const m = html.match(new RegExp(`<meta\\s+name="${name}"\\s+content="([^"]*)"`, 'i')); return m ? m[1] : null; };
function setAlso(html, files) {
  const have = (meta(html, 'pf-also') || '').split(',').map((x) => x.trim()).filter(Boolean);
  const all = [...new Set([...have, ...files])].filter((f) => f !== meta(html, 'pf-base'));
  if (!all.length) return html;
  const tag = `<meta name="pf-also" content="${all.join(', ')}">`;
  return meta(html, 'pf-also') !== null ? html.replace(/<meta\s+name="pf-also"\s+content="[^"]*">/i, tag) : html.replace(/(<meta\s+name="pf-base"[^>]*>)/i, `$1\n${tag}`);
}
function retarget(html, fromDir, toDir) {
  return html.replace(/\s(href|src)="([^"]+)"/g, (all, a, url) => {
    if (/^([a-z]+:|#|\/|data:|\{)/i.test(url)) return all;
    const target = resolve(fromDir, url.split(/[?#]/)[0]);
    return ` ${a}="${toPosix(relative(toDir, target)) || '.'}${url.slice(url.split(/[?#]/)[0].length)}"`;
  });
}
function featureDir(from) {
  for (let d = from; d.startsWith(join(SKILL, 'designs')); d = dirname(d)) if (existsSync(join(d, 'flow.json'))) return d;
  return null;
}

const NEW_CSS = {
  B: `/* Direction B · competitor-led: new patterns (pfx-* classes only), in the product's colours and type.
   Every colour, border and face is a product token: var(--pf-…) from css/tokens.css (tokens.md).
   Never a literal colour or font here, never a product class (.pf-…): wrap one in a pfx- container. */
`,
  C: `/* Direction C · bold: new patterns (pfx-* classes only) and a new visual language.
   Declare each new colour or face once, here, as a --pfx-* token with its reason, then use var():
   :root { --pfx-ink: #0b3d2e; /* [new] a deeper green for the insight band */ }
   Every value without a [new] note is a product token: var(--pf-…). Never a product class (.pf-…). */
:root {
}
`,
};

/* ── the commands ──────────────────────────────────────────────────────── */
const cmd = pos[0];
if (cmd === 'start') {
  const [, from, to] = pos;
  if (!from || !to) die('usage: node qa/compose.mjs start <compiled file> designs/<feature>/[A|B|C/]<screen>.html [--direction B] [--empty "<selector>"]');
  const src = abs(from), dst = abs(to);
  if (!existsSync(src)) die(`${from} is not here — python3 qa/fetch.py <page> [<state>] [--375]`);
  if (!toPosix(relative(SKILL, dst)).startsWith('designs/')) die('a screen lives under designs/<feature>/');
  let html = read(src);
  if (!meta(html, 'pf-compiled')) console.log(`  note: ${from} carries no pf-compiled meta — a compiled page or state is the base of a screen`);
  const dstDir = dirname(dst);
  html = retarget(html, dirname(src), dstDir);
  html = html.replace(/<meta\s+name="pf-compiled"[^>]*>/i, `<meta name="pf-base" content="${toPosix(relative(SKILL, src))}">`);
  html = html.replace(/<script\b(?![^>]*application\/json)[^>]*>[\s\S]*?<\/script>/gi, '');
  const dirOpt = (opt('--direction') || (/(^|\/)(A|B|C)\/[^/]+$/.exec(toPosix(relative(SKILL, dst))) || [])[2] || '').toUpperCase();
  const up = (p) => toPosix(relative(dstDir, join(SKILL, p)));
  const links = [`<link rel="stylesheet" href="${up('css/tokens.css')}">`, `<link rel="stylesheet" href="${up('kit/kit.css')}">`];
  if (NEW_CSS[dirOpt]) {
    links.push('<link rel="stylesheet" href="new.css">');
    mkdirSync(dstDir, { recursive: true });
    if (!existsSync(join(dstDir, 'new.css'))) writeFileSync(join(dstDir, 'new.css'), NEW_CSS[dirOpt]);
  }
  const feat = featureDir(dstDir) || (existsSync(join(dirname(dstDir), 'flow.json')) ? dirname(dstDir) : dstDir);
  const json = [['pf-state', 'state.json'], ['pf-data', 'data.json'], ['pf-actions', 'actions.json']]
    .filter(([id, f]) => existsSync(join(feat, f)) && !new RegExp(`id="${id}"`).test(html))
    .map(([id, f]) => `<script type="application/json" id="${id}" data-src="${toPosix(relative(dstDir, join(feat, f)))}"></script>`);
  html = html.replace(/<\/head>/i, `${links.join('')}${json.join('')}</head>`);
  const empty = opt('--empty');
  if (empty) { const el = one(html, empty, from); html = html.slice(0, el.open) + html.slice(html.lastIndexOf('</', el.end - 1)); }
  mkdirSync(dstDir, { recursive: true });
  writeFileSync(dst, html);
  console.log(`  ${toPosix(relative(SKILL, dst))} — from ${toPosix(relative(SKILL, src))}${dirOpt ? ` · direction ${dirOpt}` : ''} · ${links.length} stylesheet(s) · ${json.length} JSON block(s)${empty ? ` · "${empty}" emptied` : ''}`);
  if (!json.length) console.log('  note: no state.json, data.json or actions.json beside flow.json yet — write them, then run start again or add the blocks');
} else if (cmd === 'find') {
  const [, file, sel] = pos;
  if (!file || !sel) die('usage: node qa/compose.mjs find <file> "<selector>"');
  const html = read(abs(file)), found = select(html, sel);
  if (!found.length) { console.log(`  nothing matches "${sel}"`); process.exit(1); }
  found.slice(0, 40).forEach((el, i) => {
    const text = html.slice(el.open, el.end).replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60);
    console.log(`  ${String(i).padStart(2)}  <${el.name}${el.attrs.class ? ` class="${el.attrs.class.slice(0, 60)}"` : ''}>  ${(el.end - el.start).toLocaleString()} chars  “${text}”`);
  });
  if (found.length > 40) console.log(`  … ${found.length - 40} more`);
} else if (cmd === 'block') {
  const [, file, sel] = pos;
  if (!file || !sel) die('usage: node qa/compose.mjs block <compiled file> "<selector>" [--nth N] [--out file]');
  const html = read(abs(file)), el = one(html, sel, file), out = html.slice(el.start, el.end);
  if (opt('--out')) { writeFileSync(abs(opt('--out')), out); console.log(`  ${opt('--out')} — ${out.length.toLocaleString()} chars from ${file}; add it to the screen's pf-also: node qa/compose.mjs also <screen> ${file}`); }
  else process.stdout.write(out + '\n');
} else if (cmd === 'replace' || cmd === 'insert') {
  const [, file, sel, src] = pos;
  if (!file || !sel || !src) die(`usage: node qa/compose.mjs ${cmd} <screen> "<selector>" <html file | -> ${cmd === 'insert' ? '--before|--after|--prepend|--append ' : ''}[--nth N]`);
  let html = read(abs(file));
  const el = one(html, sel, file), add = content(src);
  if (cmd === 'replace') html = html.slice(0, el.start) + add + html.slice(el.end);
  else {
    const where = ['--before', '--after', '--prepend', '--append'].find(flag);
    if (!where) die('insert needs --before, --after, --prepend or --append');
    const closeAt = html.lastIndexOf('</', el.end - 1);
    const at = { '--before': el.start, '--after': el.end, '--prepend': el.open, '--append': closeAt > el.open ? closeAt : el.end }[where];
    html = html.slice(0, at) + add + html.slice(at);
  }
  writeFileSync(abs(file), html);
  console.log(`  ${file}: ${cmd === 'replace' ? 'replaced' : 'inserted ' + ['--before', '--after', '--prepend', '--append'].find(flag).slice(2)} "${sel}" (${add.length.toLocaleString()} chars)`);
} else if (cmd === 'also') {
  const [, file, ...files] = pos;
  if (!file || !files.length) die('usage: node qa/compose.mjs also <screen> <compiled file> [...]');
  for (const f of files) if (!existsSync(abs(f))) die(`${f} is not here — python3 qa/fetch.py …`);
  writeFileSync(abs(file), setAlso(read(abs(file)), files.map((f) => toPosix(relative(SKILL, abs(f))))));
  console.log(`  ${file}: pf-also ${meta(read(abs(file)), 'pf-also')}`);
} else {
  console.log(readFileSync(fileURLToPath(import.meta.url), 'utf8').split('*/')[0].replace(/^#!.*\n\/\*\*?\n?/, '').replace(/^ \* ?/gm, ''));
  process.exit(cmd ? 2 : 0);
}
