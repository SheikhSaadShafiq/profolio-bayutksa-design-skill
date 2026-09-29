/**
 * product/flags.md and the flags in registry.json, read from the product.
 *
 * The KSA tenant flags are the keys of `appConstants` in
 * src/tenant/bayut/constants/constants.js, which `@constants` resolves to in
 * the KSA build (vite.config.js). For each key this module gives:
 *
 *   - its full value — object values parsed to balanced braces, one sub-row
 *     per key; a value that is an expression, not a literal, is marked `expr`
 *   - every file that reads it (the `tenantConstants` / `@constants` binding),
 *     with the lines
 *   - what each reading file renders: the registry components it defines and
 *     the pages whose compiled markers (data-pf-src / data-pf-i) include it
 *   - an effect, only where the code at the reference shows one (a conditional
 *     render, a ternary, an early return, a conditional spread, a skipped
 *     fetch) — otherwise [TBC]
 *
 * and, per page, every flag read by a file compiled into any of the page's
 * files (web, 375, every state). Files drawn on (nearly) every signed-in page
 * are the shell's: their flags are listed once, on registry.shell.flags. A
 * data module with no marker of its own (menuList.js, a filter list) counts
 * where a compiled file that imports it — directly or through an index.js —
 * draws its entries (drawnThrough): the rail's entries are menuList.js's, so
 * IS_LMS_ENABLED, HIDE_INBOX … are shell flags.
 * A condition too long to print is cut round the flag (condFor / excerpt),
 * and a flag that is one operand of an `||` is said to be (orPartners).
 *
 * Pure functions; the only I/O is in `loadProduct` and `readPageMarkers`,
 * which take their paths as arguments. package.mjs calls `flagsFor`.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, relative, dirname, normalize } from 'node:path';
import { execSync } from 'node:child_process';

/* ── 1 · a JSX-aware scanner ─────────────────────────────────────────────
   One pass over the source. It marks what each character is (code, string,
   comment, JSX text), pairs every bracket in code (JSX expression containers
   included) and records every JSX element with its span. Enough to split an
   object literal, strip comments safely and find what a condition controls. */
const CODE = 0, STR = 1, COMMENT = 2, JSXTEXT = 3, JSXTAG = 4;
const KW_BEFORE_EXPR = new Set(['return', 'typeof', 'case', 'do', 'else', 'in', 'of', 'new', 'delete', 'void', 'throw', 'yield', 'await', 'instanceof']);
const isIdStart = (c) => /[A-Za-z_$]/.test(c);
const isId = (c) => /[\w$]/.test(c);

export function scan(src) {
  const n = src.length;
  const kind = new Uint8Array(n);                 /* CODE by default */
  const match = new Int32Array(n).fill(-1);       /* bracket partner, both ways */
  const elements = [];                            /* {name, start, end, openEnd} */
  const stack = [{ m: 'js', open: [] }];          /* frames */
  let prev = '';                                  /* last significant JS token: 'id' | 'num' | ')' | punct | keyword */
  const exprAllowed = () => (prev === '' || (prev !== 'id' && prev !== 'num' && prev !== ')' && prev !== ']' && prev !== '}')) || KW_BEFORE_EXPR.has(prev);
  const top = () => stack[stack.length - 1];
  const elStack = [];
  const containers = new Set();                   /* offsets of the `{` of JSX expression containers */
  let i = 0;
  const pair = (a, b) => { match[a] = b; match[b] = a; };
  while (i < n) {
    const f = top();
    const c = src[i], d = src[i + 1];
    if (f.m === 'js' || f.m === 'tplexpr' || f.m === 'container') {
      if (c === '/' && d === '/') { const e = src.indexOf('\n', i); const end = e < 0 ? n : e; kind.fill(COMMENT, i, end); i = end; continue; }
      if (c === '/' && d === '*') { const e = src.indexOf('*/', i + 2); const end = e < 0 ? n : e + 2; kind.fill(COMMENT, i, end); i = end; continue; }
      if (c === '"' || c === "'") {
        let j = i + 1; while (j < n && src[j] !== c && src[j] !== '\n') j += src[j] === '\\' ? 2 : 1;
        kind.fill(STR, i, j + 1); i = j + 1; prev = 'num'; continue;
      }
      if (c === '`') { kind[i] = STR; stack.push({ m: 'tpl' }); i++; continue; }
      if (c === '/' && exprAllowed()) {                      /* a regex literal */
        let j = i + 1, cls = false;
        while (j < n && src[j] !== '\n') { if (src[j] === '\\') { j += 2; continue; } if (src[j] === '[') cls = true; else if (src[j] === ']') cls = false; else if (src[j] === '/' && !cls) break; j++; }
        j++; while (j < n && /[a-z]/.test(src[j])) j++;
        kind.fill(STR, i, j); i = j; prev = 'num'; continue;
      }
      if (c === '<' && exprAllowed() && (isIdStart(d || '') || d === '>')) {   /* a JSX element opens */
        const el = { name: '', start: i, end: -1, openEnd: -1 };
        let j = i + 1; while (j < n && /[\w$.:-]/.test(src[j])) j++;
        el.name = src.slice(i + 1, j);
        kind.fill(JSXTAG, i, j);
        elements.push(el); elStack.push(el);
        stack.push({ m: 'tag', el, closing: false }); i = j; continue;
      }
      if (c === '(' || c === '[' || c === '{') { f.open.push(i); prev = c; i++; continue; }
      if (c === ')' || c === ']' || c === '}') {
        if (c === '}' && !f.open.length && (f.m === 'container' || f.m === 'tplexpr')) {
          pair(f.start, i); stack.pop();
          if (f.m === 'tplexpr') kind[i] = STR;
          i++; continue;
        }
        const o = f.open.pop(); if (o !== undefined) pair(o, i);
        prev = c; i++; continue;
      }
      if (isIdStart(c)) { let j = i; while (j < n && isId(src[j])) j++; const w = src.slice(i, j); prev = KW_BEFORE_EXPR.has(w) ? w : 'id'; i = j; continue; }
      if (/[0-9]/.test(c)) { let j = i; while (j < n && /[\w.]/.test(src[j])) j++; prev = 'num'; i = j; continue; }
      if (/\s/.test(c)) { i++; continue; }
      if (c === '=' && d === '>') { prev = '=>'; i += 2; continue; }
      if (c === '?' && d === '.') { prev = '.'; i += 2; continue; }
      if ((c === '+' || c === '-') && d === c) { i += 2; continue; }   /* x++ keeps `prev` */
      prev = c; i++; continue;
    }
    if (f.m === 'tpl') {
      kind[i] = STR;
      if (c === '\\') { kind[i + 1] = STR; i += 2; continue; }
      if (c === '`') { stack.pop(); prev = 'num'; i++; continue; }
      if (c === '$' && d === '{') { kind[i + 1] = STR; stack.push({ m: 'tplexpr', open: [], start: i + 1 }); prev = ''; i += 2; continue; }
      i++; continue;
    }
    if (f.m === 'tag') {
      /* comments are allowed between attributes */
      if (c === '/' && d === '/') { const e = src.indexOf('\n', i); const end = e < 0 ? n : e; kind.fill(COMMENT, i, end); i = end; continue; }
      if (c === '/' && d === '*') { const e = src.indexOf('*/', i + 2); const end = e < 0 ? n : e + 2; kind.fill(COMMENT, i, end); i = end; continue; }
      kind[i] = JSXTAG;
      if (c === '"' || c === "'") { let j = i + 1; while (j < n && src[j] !== c) j++; kind.fill(STR, i, j + 1); i = j + 1; continue; }
      if (c === '{') { kind[i] = CODE; containers.add(i); stack.push({ m: 'container', open: [], start: i }); prev = ''; i++; continue; }
      if (c === '/' && d === '>') {                                /* self-closing */
        kind[i + 1] = JSXTAG; stack.pop(); const el = elStack.pop(); el.end = i + 2; el.openEnd = i + 2;
        i += 2; if (top().m !== 'children') prev = ')'; continue;
      }
      if (c === '>') {
        stack.pop();
        if (f.closing) {                                           /* </X> ends the element */
          const ch = stack.pop(); const el = ch && ch.el; if (el) { el.end = i + 1; elStack.pop(); }
          i++; if (top().m !== 'children') prev = ')'; continue;
        }
        f.el.openEnd = i + 1;
        stack.push({ m: 'children', el: f.el }); i++; continue;
      }
      i++; continue;
    }
    if (f.m === 'children') {
      if (c === '{') { containers.add(i); stack.push({ m: 'container', open: [], start: i }); prev = ''; i++; continue; }
      if (c === '<' && d === '/') {
        let j = i + 2; while (j < n && src[j] !== '>') j++;
        kind.fill(JSXTAG, i, j); stack.push({ m: 'tag', el: f.el, closing: true }); i = j; continue;
      }
      if (c === '<') {
        const el = { name: '', start: i, end: -1, openEnd: -1 };
        let j = i + 1; while (j < n && /[\w$.:-]/.test(src[j])) j++;
        el.name = src.slice(i + 1, j); kind.fill(JSXTAG, i, j);
        elements.push(el); elStack.push(el); stack.push({ m: 'tag', el, closing: false }); i = j; continue;
      }
      kind[i] = JSXTEXT; i++; continue;
    }
    i++;
  }
  const lineStarts = [0];
  for (let k = 0; k < n; k++) if (src[k] === '\n') lineStarts.push(k + 1);
  const lineOf = (pos) => { let lo = 0, hi = lineStarts.length - 1; while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (lineStarts[mid] <= pos) lo = mid; else hi = mid - 1; } return lo + 1; };
  /* comments blanked, everything else kept at its offset */
  let code = '';
  for (let k = 0; k < n; k++) code += kind[k] === COMMENT && src[k] !== '\n' ? ' ' : src[k];
  const elAt = new Map(elements.filter((e) => e.end > 0).map((e) => [e.start, e]));
  const elEnd = new Map(elements.filter((e) => e.end > 0).map((e) => [e.end, e.start]));
  return { src, code, kind, match, elements, elAt, elEnd, containers, lineOf, lineStarts };
}

/* ── 2 · the constants: every key, its full value ──────────────────────── */
const collapse = (s) => s.replace(/\s+/g, ' ').replace(/\(\s+/g, '(').replace(/\s+\)/g, ')').trim();

/* split the inside of a bracket pair at its own commas */
function splitTop(S, from, to) {
  const parts = [];
  let s = from;
  for (let k = from; k < to; k++) {
    if (S.kind[k] !== CODE) continue;
    const c = S.src[k];
    if ((c === '(' || c === '[' || c === '{') && S.match[k] > k) { k = S.match[k]; continue; }
    if (c === ',') { parts.push([s, k]); s = k + 1; }
  }
  if (S.code.slice(s, to).trim()) parts.push([s, to]);
  return parts;
}
const trimSpan = (S, [a, b]) => {
  while (a < b && (/\s/.test(S.src[a]) || S.kind[a] === COMMENT)) a++;
  while (b > a && (/\s/.test(S.src[b - 1]) || S.kind[b - 1] === COMMENT)) b--;
  return [a, b];
};
/* the comment right before an entry: the product's own note on it */
const noteBefore = (S, a, floor) => {
  const back = (k) => { while (k >= floor && /\s/.test(S.src[k]) && S.kind[k] !== COMMENT) k--; return k; };
  const k = back(a - 1);
  if (k < floor || S.kind[k] !== COMMENT) return '';
  /* whole comment lines only: one that follows code on its line belongs to that code */
  const ownLine = (p) => /^\s*$/.test(S.src.slice(S.src.lastIndexOf('\n', p - 1) + 1, p));
  let j = k;
  for (;;) {
    while (j > floor && S.kind[j - 1] === COMMENT) j--;
    const w = back(j - 1);
    if (w >= floor && S.kind[w] === COMMENT) { j = w; continue; }
    break;
  }
  while (j <= k && !ownLine(j)) {
    const nl = S.src.indexOf('\n', j);
    if (nl < 0 || nl > k) return '';
    j = nl + 1; while (j <= k && S.kind[j] !== COMMENT) j++;
  }
  const text = S.src.slice(j, k + 1).split('\n').map((l) => l.replace(/^\s*(?:\/\/+|\/\*+|\*+\/?)\s?/, '').replace(/\*\/\s*$/, '')).join(' ');
  return collapse(text);
};
const LITERAL = /^(true|false|null|undefined|-?\d[\d_.]*|'[^'\\]*(?:\\.[^'\\]*)*'|"[^"\\]*(?:\\.[^"\\]*)*"|`[^`$]*`)$/;
function valueOf(S, a, b, resolve, path, depth = 0) {
  [a, b] = trimSpan(S, [a, b]);
  const raw = S.src.slice(a, b);
  const c = S.src[a];
  if ((c === '{' || c === '[') && S.match[a] === b - 1 && depth < 6) {
    const kids = [];
    const parts = splitTop(S, a + 1, b - 1);
    if (c === '[' && parts.every(([x, y]) => !/[{[(]/.test(S.code.slice(x, y)))) return { kind: 'const', text: collapse(raw) };
    parts.forEach((span, idx) => {
      const [x, y] = trimSpan(S, span);
      if (x >= y) return;
      const note = noteBefore(S, x, a + 1);
      if (c === '[') { kids.push({ path: `${path}[${idx}]`, note, ...valueOf(S, x, y, resolve, `${path}[${idx}]`, depth + 1) }); return; }
      const m = S.code.slice(x, y).match(/^\s*(?:(['"]?)([\w$]+)\1\s*:)?/);
      if (m && m[2] && m[0].includes(':')) { const off = x + m[0].length; kids.push({ key: m[2], path: `${path}.${m[2]}`, note, ...valueOf(S, off, y, resolve, `${path}.${m[2]}`, depth + 1) }); }
      else if (/^[\w$]+$/.test(S.code.slice(x, y).trim())) { const k = S.code.slice(x, y).trim(); const r = resolve(k); kids.push({ key: k, path: `${path}.${k}`, note, ...(r ? valueOf(S, r[0], r[1], resolve, `${path}.${k}`, depth + 1) : { kind: 'expr', text: k }) }); }
      else kids.push({ path: `${path}.…`, note, kind: 'expr', text: collapse(S.src.slice(x, y)) });
    });
    return { kind: c === '{' ? 'object' : 'array', text: collapse(raw), children: kids };
  }
  if (/^[A-Z_][A-Z0-9_]*$/.test(raw.trim())) { const r = resolve(raw.trim()); if (r) return valueOf(S, r[0], r[1], resolve, path, depth + 1); }
  if (LITERAL.test(raw.trim()) || (S.kind[a] === STR && S.src[a] === '/' && [...raw].every((_, k) => S.kind[a + k] === STR))) return { kind: 'const', text: collapse(raw) };
  if (/=>|^function\b/.test(raw)) return { kind: 'fn', text: collapse(raw) };
  return { kind: 'expr', text: collapse(raw) };
}

/**
 * parseConstants(src) → [{ key, line, note, kind, text, children? }]
 * `src` is constants.js. kind: const | expr | fn | object | array.
 */
export function parseConstants(src) {
  const S = scan(src);
  const decl = (name) => {                                  /* `const NAME = …;` at the top of the file */
    const re = new RegExp(`(^|\\n)\\s*(?:export\\s+)?const\\s+${name}\\s*=\\s*`, 'g');
    const m = re.exec(S.code); if (!m) return null;
    const a = m.index + m[0].length;
    for (let k = a; k < src.length; k++) {
      if (S.kind[k] !== CODE) continue;
      const ch = src[k];
      if ((ch === '(' || ch === '[' || ch === '{') && S.match[k] > k) { k = S.match[k]; continue; }
      if (ch === ';' || (ch === '\n' && /^\s*(const|export|import)\b/.test(src.slice(k + 1)))) return [a, k];
    }
    return [a, src.length];
  };
  const m = S.code.match(/Object\.freeze\(\s*\{/) || S.code.match(/const\s+appConstants\s*=\s*\{/);
  if (!m) throw new Error('constants: no appConstants object found');
  const open = m.index + m[0].length - 1;
  const close = S.match[open];
  const out = [];
  for (const span of splitTop(S, open + 1, close)) {
    const [x, y] = trimSpan(S, span);
    if (x >= y) continue;
    const note = noteBefore(S, x, open + 1);
    const head = S.code.slice(x, y).match(/^\s*(['"]?)([\w$]+)\1\s*(:)?\s*/);
    if (!head) continue;
    const key = head[2];
    const v = head[3] ? valueOf(S, x + head[0].length, y, decl, key) : (decl(key) ? valueOf(S, ...decl(key), decl, key) : { kind: 'expr', text: key });
    out.push({ key, line: S.lineOf(x), note, ...v });
  }
  return out;
}

/* ── 3 · who reads each key ─────────────────────────────────────────────── */
const BINDING_IMPORT = /import\s+([\w$]+)\s+from\s+['"](?:@constants|[./]*(?:tenant\/bayut\/)?constants(?:\/index)?)['"]/g;
/**
 * findReferences(file, src, keys) → [{ file, key, sub, line, pos }]
 * A reference is `<binding>.KEY`, `<binding>?.KEY`, `<binding>['KEY']` or a
 * destructured `{ KEY } = <binding>`; `<binding>` is `tenantConstants` or a
 * default import of `@constants`. Comments do not count.
 */
export function findReferences(file, src, keys, S = scan(src)) {
  const binds = new Set(['tenantConstants']);
  for (const m of S.code.matchAll(BINDING_IMPORT)) if (/@constants|constants['"]$/.test(m[0]) && !/data\/constants/.test(m[0])) binds.add(m[1]);
  const B = [...binds].join('|');
  const out = [];
  const inCode = (p) => S.kind[p] === CODE || S.kind[p] === JSXTAG;
  const re = new RegExp(`\\b(${B})\\s*(?:\\?\\.|\\.)\\s*([A-Za-z_$][\\w$]*)(?:\\s*(?:\\?\\.|\\.)\\s*([A-Za-z_$][\\w$]*))?|\\b(${B})\\s*(?:\\?\\.)?\\[\\s*['"]([\\w$]+)['"]\\s*\\]`, 'g');
  for (const m of S.code.matchAll(re)) {
    if (!inCode(m.index)) continue;
    if (m.index > 0 && /[\w$.]/.test(S.code[m.index - 1])) continue;       /* x.tenantConstants.X */
    const key = m[2] || m[5];
    out.push({ file, key, sub: m[3] || null, line: S.lineOf(m.index), pos: m.index, len: m[0].length, known: keys.has(key) });
    /* an object key bound to a name — `const form = tenantConstants.FORM || {}`,
       `const config = useMemo(() => tenantConstants.CAPTCHA_CONFIG, [])` — is read through it */
    if (m[3] || !m[2]) continue;
    const before = S.code.slice(Math.max(0, m.index - 80), m.index), after = S.code.slice(m.index + m[0].length, m.index + m[0].length + 40);
    const bound = before.match(/\b(?:const|let|var)\s+([\w$]+)\s*=\s*\(?\s*$/)
      || before.match(/\b(?:const|let|var)\s+([\w$]+)\s*=\s*(?:React\.)?use(?:Memo|Callback)\s*\(\s*\(\s*\)\s*=>\s*\(?\s*$/);
    const memo = bound && /use(?:Memo|Callback)\s*\(\s*\(\s*\)\s*=>\s*\(?\s*$/.test(before);
    /* the statement ends there — not a line that goes on (`\n    ? null : …` is a ternary, not a binding) */
    const ends = '[ \\t]*(?:;|\\n(?!\\s*(?:\\?|:|&&|\\|\\||\\.)))';
    if (bound && new RegExp(memo ? `^\\s*\\)?\\s*,\\s*\\[[^\\]]*\\]\\s*\\)${ends}` : `^\\s*(?:(?:\\|\\||\\?\\?)\\s*\\{\\s*\\}\\s*)?\\)?${ends}`).test(after)) {
      const re2 = new RegExp(`(?<![\\w$.])${bound[1].replace(/\$/g, '\\$')}\\s*(?:\\?\\.|\\.)\\s*([A-Za-z_$][\\w$]*)`, 'g');
      for (const u of S.code.matchAll(re2)) if (u.index > m.index && inCode(u.index)) out.push({ file, key, sub: u[1], line: S.lineOf(u.index), pos: u.index, len: u[0].length, known: keys.has(key), via: bound[1] });
    }
    const des = before.match(/\b(?:const|let|var)\s*\{([^}]*)\}\s*=\s*\(?\s*$/);
    if (des) for (const part of des[1].split(',')) { const k = part.split(':')[0].split('=')[0].trim(); if (k) out.push({ file, key, sub: k, line: S.lineOf(m.index), pos: m.index, len: m[0].length, known: keys.has(key), destructured: true }); }
  }
  const dre = new RegExp(`\\b(?:const|let|var)\\s*\\{([^}]*)\\}\\s*=\\s*(${B})\\b(?!\\s*(?:\\?\\.|\\.))`, 'g');
  for (const m of S.code.matchAll(dre)) {
    if (!inCode(m.index)) continue;
    for (const part of m[1].split(',')) {
      const k = part.split(':')[0].split('=')[0].trim();
      if (k) out.push({ file, key: k, sub: null, line: S.lineOf(m.index), pos: m.index, len: m[0].length, known: keys.has(k), destructured: true });
    }
  }
  return out.filter((r) => /^[A-Z][A-Z0-9_]*$/.test(r.key));
}

/* ── 4 · what the code at a reference does ─────────────────────────────── */
const listOf = (xs, n) => xs.slice(0, n).join(', ') + (xs.length > n ? `, +${xs.length - n}` : '');
const code = (s) => (String(s).includes('`') ? `\`\` ${s} \`\`` : `\`${s}\``);
const short = (s, n = 90) => { s = collapse(s).replace(/\btenantConstants\s*\??\.\s*/g, ''); return s.length > n ? s.slice(0, n - 1) + '…' : s; };
const tagsIn = (S, a, b) => S.elements.filter((e) => e.start >= a && e.start < b && e.name).map((e) => e.name);
const labelsIn = (S, a, b) => [...S.code.slice(a, b).matchAll(/\b(?:title|label|name)\s*:\s*(?:t\(\s*)?(['"])([^'"]+)\1/g)].map((m) => m[2]);
/* the routes a part names: `path: '/x'`, `path: \`${path}/x\`` → '/x' */
export const pathsIn = (S, a, b, withPrefix = false) => [...new Set([...S.code.slice(a, b).matchAll(/\b(?:path|route|basePath)\s*:\s*[`'"]((?:\$\{[^}]*\})?[^`'"$]*)[`'"]/g)].map((m) => (withPrefix && /^\$\{/.test(m[1]) ? '…' : '') + m[1].replace(/^\$\{[^}]*\}/, '').replace(/\/\*$/, '')).filter((x) => /^…?\//.test(x)))];
/* an object literal's keys, or an array's items by their `key:` */
const keysIn = (S, a, b) => {
  while (a < b && /\s/.test(S.src[a])) a++;
  if (S.src[a] === '{' && S.match[a] > a && S.match[a] < b) return splitTop(S, a + 1, S.match[a]).map(([x, y]) => (S.code.slice(x, y).match(/^\s*(?:\.\.\.)?\s*['"]?([\w$]+)/) || [])[1]).filter(Boolean);
  if (S.src[a] === '[' && S.match[a] > a) return [...S.code.slice(a, S.match[a]).matchAll(/\bkey\s*:\s*['"]([^'"]+)['"]/g)].map((m) => m[1]);
  return [];
};

/* walk out from the reference to the expression it is part of */
function enclosing(S, pos) {
  const src = S.src;
  const isAssign = (k) => src[k] === '=' && !/[=!<>+\-*/%&|^?]/.test(src[k - 1] || '') && !/[=>]/.test(src[k + 1] || '');
  const isArrow = (k) => src[k] === '>' && src[k - 1] === '=';
  const isPropColon = (k) => src[k] === ':' && /(?:^|[{,(\n])\s*['"]?[\w$-]+['"]?\s*$/.test(S.code.slice(Math.max(0, k - 80), k));
  let k = pos;
  for (; k > 0; k--) {
    const p = k - 1;
    if (S.kind[p] !== CODE) {
      if (S.kind[p] === JSXTAG) { const st = S.elEnd.get(p + 1); if (st !== undefined && st < p) { k = st + 1; continue; } break; }
      if (S.kind[p] === JSXTEXT) break;
      if (src[p] === '{' && src[p - 1] === '$' && S.match[p] >= pos) break;         /* the `${` of a template */
      continue;
    }
    const ch = src[p];
    if ((ch === ')' || ch === ']' || ch === '}') && S.match[p] >= 0 && S.match[p] < p) { k = S.match[p] + 1; continue; }
    if ((ch === '(' || ch === '[' || ch === '{') && (S.match[p] < 0 || S.match[p] >= pos)) break;
    if (ch === '{' && src[p - 1] === '$' && S.match[p] >= pos) break;                 /* the `${` of a template */
    if (ch === ';' || ch === ',' || isAssign(p) || isArrow(p) || isPropColon(p)) break;
    if (ch === '\n' && /^\s*(?:const|let|var|return|if|case)\b/.test(src.slice(k))) break;
  }
  const a = k;
  for (k = pos; k < src.length; k++) {
    if (S.kind[k] !== CODE) {
      if (S.kind[k] === JSXTAG) { const el = S.elAt.get(k); if (el && el.end > k) { k = el.end - 1; continue; } break; }
      if (S.kind[k] === JSXTEXT) break;
      if (src[k] === '}' && S.match[k] >= 0 && S.match[k] < pos) break;               /* the `}` closing a template's `${` */
      continue;
    }
    const ch = src[k];
    if ((ch === '(' || ch === '[' || ch === '{') && S.match[k] > k) { k = S.match[k]; continue; }
    if (ch === ')' || ch === ']' || ch === '}' || ch === ';' || ch === ',') break;
  }
  return [a, k];
}

/* split `lhs && rhs && …` / `c ? x : y` at the top level of [a,b) */
function topOps(S, a, b) {
  const ops = [];
  for (let k = a; k < b; k++) {
    if (S.kind[k] !== CODE) continue;
    const ch = S.src[k];
    if ((ch === '(' || ch === '[' || ch === '{') && S.match[k] > k && S.match[k] < b) { k = S.match[k]; continue; }
    if (ch === '&' && S.src[k + 1] === '&') { ops.push(['&&', k]); k++; continue; }
    if (ch === '|' && S.src[k + 1] === '|') { ops.push(['||', k]); k++; continue; }
    if (ch === '?' && S.src[k + 1] === '?') { ops.push(['??', k]); k++; continue; }
    if (ch === '?' && S.src[k + 1] !== '.') ops.push(['?', k]);
    else if (ch === ':' ) ops.push([':', k]);
  }
  return ops;
}

/* [a,b) without the white space round it */
const trimWs = (S, a, b) => { while (a < b && /\s/.test(S.src[a])) a++; while (b > a && /\s/.test(S.src[b - 1])) b--; return [a, b]; };
/* the operands of [a,b) split at its top-level `op`s (one of '&&' '||') */
const operands = (S, a, b, op) => {
  const at = topOps(S, a, b).filter(([o]) => o === op).map(([, k]) => k);
  const segs = [];
  let s0 = a;
  for (const k of at) { segs.push(trimWs(S, s0, k)); s0 = k + 2; }
  segs.push(trimWs(S, s0, b));
  return segs;
};
const readText = (S, a, b) => collapse(S.code.slice(a, b)).replace(/\btenantConstants\s*\??\.\s*/g, '');
/* `!…`, `(…)`, `!(…)` round an operand: the inside, when pos is in it */
const unwrap = (S, a, b, pos) => {
  let k = a;
  while (k < b && (S.src[k] === '!' || /\s/.test(S.src[k]))) k++;
  if (S.src[k] === '(' && S.match[k] === b - 1 && pos > k && pos < b - 1) return { pre: S.src.slice(a, k).replace(/\s+/g, ''), inner: trimWs(S, k + 1, b - 1) };
  return null;
};

/* the end of the read at pos: `tenantConstants?.LMS_ENABLED?.IS_INSIGHTS_ENABLED`, `maxDate` */
const readEnd = (S, pos, b) => {
  let k = pos;
  while (k < b) {
    if (/[\w$]/.test(S.src[k])) { k++; continue; }
    const dot = S.src[k] === '.' ? 1 : S.src[k] === '?' && S.src[k + 1] === '.' ? 2 : 0;
    if (dot && /[A-Za-z_$]/.test(S.src[k + dot] || '')) { k += dot; continue; }
    break;
  }
  return k;
};
/* condFor — the condition as the Gates column prints it (`pre` + condition + `post`, n
   characters): cut from the head as always while that keeps the whole flag, else excerpt() */
export function condFor(S, x, y, pos, n = 90, pre = '', post = '') {
  [x, y] = trimWs(S, x, y);
  const whole = `${pre}${readText(S, x, y)}${post}`;
  if (whole.length <= n) return whole;
  /* the head cut holds the whole flag: as it always was */
  if (pos == null || pos < x || pos >= y || `${pre}${readText(S, x, readEnd(S, pos, y))}`.length <= n - 1) return whole.slice(0, n - 1) + '…';
  return `${pre}${excerpt(S, x, y, pos, n - pre.length - post.length)}${post}`;
}
/**
 * excerpt(S, x, y, pos, n) — the condition [x,y) as text, at most about n
 * characters, cut round the flag read at pos rather than from the head: the
 * operand that holds the flag is always there whole (or, when it alone is too
 * long, a window round the flag's own name), with as many of the other
 * operands as fit — the first ones, then its neighbours — and '…' for the
 * rest: `!!user?.is_credit_user && … && (ALLOW_CREDITS_TOPTUP || IS_CREDIT_CAPPING_ENABLED)`.
 */
export function excerpt(S, x, y, pos, n = 90) {
  [x, y] = trimWs(S, x, y);
  const whole = readText(S, x, y);
  if (whole.length <= n) return whole;
  if (pos == null || pos < x || pos >= y) return whole.slice(0, n - 1) + '…';
  const fit = (a, b, room) => {
    const t = readText(S, a, b);
    if (t.length <= room) return t;
    for (const op of ['||', '&&']) {
      const segs = operands(S, a, b, op);
      if (segs.length < 2) continue;
      const texts = segs.map(([p, q]) => readText(S, p, q));
      const f = segs.findIndex(([p, q]) => pos >= p && pos < q);
      if (f < 0) break;
      const kept = new Map([[f, texts[f].length <= room - 8 ? texts[f] : fit(...segs[f], room - 8)]]);
      let used = kept.get(f).length + 8;
      const order = [];
      for (let d = 0; d < segs.length; d++) for (const i of [d, f - d - 1, f + d + 1]) if (i >= 0 && i < segs.length && !order.includes(i)) order.push(i);
      for (const i of order) { if (kept.has(i) || used + texts[i].length + 4 > room) continue; kept.set(i, texts[i]); used += texts[i].length + 4; }
      let s = '';
      for (let i = 0; i < segs.length; i++) {
        const sep = i ? ` ${op} ` : '';
        if (kept.has(i)) s += sep + kept.get(i);
        else if (i === 0 || kept.has(i - 1)) s += sep + '…';
      }
      return s;
    }
    const u = unwrap(S, a, b, pos);
    if (u) return `${u.pre}(${fit(...u.inner, room - u.pre.length - 2)})`;
    /* one operand, too long: a window round the flag's name, never through it */
    const r1 = readEnd(S, pos, b);
    const read = readText(S, pos, r1), head = readText(S, a, pos) + (/\s/.test(S.src[pos - 1]) ? ' ' : ''), tail = (/\s/.test(S.src[r1]) ? ' ' : '') + readText(S, r1, b);
    const left = Math.max(0, Math.floor((room - read.length) / 2) - 1), right = Math.max(0, room - read.length - left - 2);
    return `${head.length > left ? `…${head.slice(head.length - left)}` : head}${read}${tail.length > right ? `${tail.slice(0, right)}…` : tail}`;
  };
  return fit(x, y, n);
}
/* the operands ORed with the flag read at pos inside the condition [x,y) — && binds tighter:
   `a && (FLAG || OTHER)` → ['OTHER'] — [] when the flag alone decides the condition's side */
export function orPartners(S, x, y, pos) {
  let [a, b] = trimWs(S, x, y);
  for (let guard = 0; guard < 8 && pos >= a && pos < b; guard++) {
    const ors = operands(S, a, b, '||');
    /* `X || false` is X: a literal fallback is no other operand */
    if (ors.length > 1) { const f = ors.findIndex(([p, q]) => pos >= p && pos < q); return f < 0 ? [] : ors.filter((_, i) => i !== f).map(([p, q]) => readText(S, p, q)).filter((t) => !/^(?:false|null|undefined|0|''|""|\{\}|\[\])$/.test(t)); }
    const ands = operands(S, a, b, '&&');
    if (ands.length > 1) { const f = ands.findIndex(([p, q]) => pos >= p && pos < q); if (f < 0) return []; [a, b] = ands[f]; continue; }
    const u = unwrap(S, a, b, pos);
    if (!u) return [];
    [a, b] = u.inner;
  }
  return [];
}

/* an array or object literal filling [a,b): what it is, for an effect's branch — never
   the first JSX tag a prop of one of its items holds (`title: <br />` of a tour step) */
const literalDesc = (S, a, b) => {
  [a, b] = trimWs(S, a, b);
  const c = S.src[a];
  if ((c !== '[' && c !== '{') || S.match[a] !== b - 1) return null;
  const items = splitTop(S, a + 1, b - 1).map((s) => trimWs(S, ...s)).filter(([p, q]) => q > p);
  if (!items.length) return null;
  if (c === '[') {
    if (items.length && items.every(([p]) => S.kind[p] === JSXTAG)) return null;          /* [<A/>, <B/>]: its tags say it */
    const obj = items.find(([p]) => S.src[p] === '{');
    const ks = obj ? keysIn(S, ...obj) : [];
    return `an array of ${items.length} item${items.length === 1 ? '' : 's'}${ks.length ? ` ${code(`{ ${listOf(ks, 4)} }`)}` : ''}`;
  }
  const ks = keysIn(S, a, b);
  return ks.length ? `an object ${code(`{ ${listOf(ks, 5)} }`)}` : 'an object';
};

const jsxDesc = (S, a, b) => {
  const tags = [...new Set(tagsIn(S, a, b))];
  if (!tags.length) return null;
  const lead = tags.filter((t) => /^[A-Z]/.test(t));
  const shown = (lead.length ? lead : tags).slice(0, 4).map((t) => `<${t}>`).join(' ');
  return code(shown + ((lead.length ? lead : tags).length > 4 ? ' …' : ''));
};

/* a `(` that groups, not one that calls or heads a statement */
const grouping = (S, p) => {
  if (S.src[p] !== '(') return false;
  const before = S.code.slice(Math.max(0, p - 12), p);
  if (/\b(?:if|while|for|switch|catch|function)\s*$/.test(before)) return false;
  return !/[\w$)\]]\s*$/.test(before) || /\b(?:return|case|typeof|void|await|yield)\s*$/.test(before);
};
/* the context an expression [a,b) sits in */
function contextOf(S, a) {
  const before = S.code.slice(Math.max(0, a - 200), a);
  if (/\.\.\.\s*\(?\s*$/.test(before)) return { ctx: 'spread' };
  if (S.src[a - 1] === '{' && S.containers.has(a - 1)) {
    const attr = before.match(/([\w$-]+)\s*=\s*\{$/);
    if (attr && S.kind[a - 2] !== CODE) {
      const el = [...S.elements].reverse().find((e) => e.start < a && (e.openEnd < 0 || e.openEnd > a));
      return { ctx: 'attr', name: attr[1], tag: el ? el.name : '' };
    }
    return { ctx: 'child' };
  }
  if (S.src[a - 1] === '(' && /\bif\s*\($/.test(before)) return { ctx: 'if', close: S.match[a - 1] };
  const asg = before.match(/\b(?:const|let|var)\s+([\w$]+)\s*=\s*$/) || before.match(/(?:^|[;{}\n])\s*([\w$.]+)\s*=\s*$/);
  if (asg) return { ctx: 'assign', name: asg[1] };
  const prop = before.match(/([\w$]+)['"]?\s*:\s*$/);
  if (prop) return { ctx: 'prop', name: prop[1] };
  if (/\breturn\s*$/.test(before)) return { ctx: 'return' };
  return { ctx: '' };
}

/* the function a position sits in: a component's name, or what calls the callback */
function fnAt(S, pos) {
  let k = pos;
  for (let guard = 0; guard < 40; guard++) {
    let p = k - 1, open = -1;
    for (; p >= 0; p--) {
      if (S.kind[p] !== CODE) continue;
      const ch = S.src[p];
      if ((ch === ')' || ch === ']' || ch === '}') && S.match[p] >= 0 && S.match[p] < p) { p = S.match[p]; continue; }
      if ((ch === '(' || ch === '[' || ch === '{') && S.match[p] > pos) { open = p; break; }
    }
    if (open < 0) return null;
    if (S.src[open] === '{') {
      let j = open - 1; while (j >= 0 && /\s/.test(S.src[j])) j--;
      let arrow = false;
      if (S.src[j] === '>' && S.src[j - 1] === '=') { arrow = true; j -= 2; while (j >= 0 && /\s/.test(S.src[j])) j--; }
      let ps = -1;
      if (S.src[j] === ')' && S.match[j] >= 0 && S.match[j] < j) ps = S.match[j];
      else if (arrow && /[\w$]/.test(S.src[j])) { ps = j; while (ps > 0 && /[\w$]/.test(S.src[ps - 1])) ps--; }
      if (ps >= 0) {
        const pre = S.code.slice(Math.max(0, ps - 120), ps).replace(/async\s*$/, '');
        let m;
        if (!arrow) {
          if ((m = pre.match(/function\s*\*?\s*([\w$]*)\s*$/))) return m[1] || 'a function';
          if ((m = pre.match(/(?:^|[\s,{;])([\w$]+)\s*$/)) && !/^(if|for|while|switch|catch|with)$/.test(m[1])) return m[1];
        } else {
          if ((m = pre.match(/(?:const|let|var)\s+([\w$]+)\s*=\s*$/))) return m[1];
          if ((m = pre.match(/\b(use[A-Z][\w$]*)\s*\(\s*$/))) return `its ${m[1]} callback`;
          if ((m = pre.match(/([\w$]+)\s*:\s*$/))) return m[1];
          if ((m = pre.match(/([\w$.]+)\s*\(\s*$/))) return `a ${m[1]}() callback`;
          return 'a function';
        }
      }
    }
    k = open;
  }
  return null;
}

/**
 * effectAt(S, pos) → { kind, cond, what, region:[x,y] } — or { kind:'tbc', cond } when
 * the code there shows no effect on its own. kinds:
 *   render   cond && <X>            (a JSX child, a returned value)
 *   ternary  cond ? A : B
 *   spread   ...(cond ? [..] : [])  /  ...(cond && {..})
 *   return   if (cond) return …     (an early exit of the function named)
 *   skip     skip: cond             (an RTK query is not run)
 *   attr     <X attr={cond && …}>
 *   alias    const x = cond         → the uses of x in the same file, each classified
 */
export function effectAt(S, pos, depth = 0) {
  let cr = null;                                   /* the range the effect's condition was last cut from */
  const e = effectAt0(S, pos, depth, (x, y) => { cr = [x, y]; });
  /* a flag ORed with another operand does not decide the condition alone */
  const or = cr ? orPartners(S, ...cr, pos).map((o) => short(o, 50)) : [];
  return or.length ? { ...e, or } : e;
}
function effectAt0(S, pos, depth, track) {
  const at = (p) => { let [x, y] = enclosing(S, p); const kw = S.code.slice(x, y).match(/^\s*(?:return|case|else|yield|await|throw)\b\s*/); if (kw) x += kw[0].length; return [x, y]; };
  let [a, b] = at(pos);
  /* climb out of grouping parentheses: `(A || FLAG) && <X>` — not out of a spread's */
  for (let guard = 0; guard < 8 && S.src[a - 1] === '(' && S.match[a - 1] === b && grouping(S, a - 1) && !/\.\.\.\s*$/.test(S.code.slice(Math.max(0, a - 6), a - 1)); guard++) [a, b] = at(a - 1);
  while (a < b && /\s/.test(S.src[a])) a++;
  while (b > a && /\s/.test(S.src[b - 1])) b--;
  const ops = topOps(S, a, b);
  const cx = contextOf(S, a);
  /* the condition, cut round the flag (excerpt), never from the head alone */
  const cond = (x, y, n = 90, pre = '', post = '') => { track(x, y); return condFor(S, x, y, pos, n, pre, post); };
  const say = (x, y) => {
    /* an array or object literal is said as one (its items' labels, else its kind), not by a tag a prop holds */
    const j = jsxDesc(S, x, y);
    const lit = j ? literalDesc(S, x, y) : null;                /* the JSX sits in a prop of the literal's items */
    if (j && !lit) return j;
    const l = [...new Set(labelsIn(S, x, y))]; if (l.length) return l.map((v) => `'${v}'`).join(' ');
    const ps = pathsIn(S, x, y); if (ps.length) return ps.map((v) => `'${v}'`).join(' ');
    const ks = keysIn(S, x, y); if (ks.length) return code(`{ ${listOf(ks, 5)} }`);
    if (lit) return lit;
    return code(short(S.code.slice(x, y), 50));
  };
  const lead = cx.ctx === 'attr' ? `${code(`<${cx.tag}> ${cx.name}`)}=` : cx.ctx === 'prop' ? `${cx.name}: ` : cx.ctx === 'assign' ? `${cx.name} = ` : '';
  const plain = cx.ctx === 'attr' ? `<${cx.tag}> ${cx.name}=` : lead;
  /* the ternary whose test holds pos — in a chain `t1 ? x : t2 ? y : z`, any t */
  const qc = ops.filter(([o]) => o === '?' || o === ':');
  const prevOp = qc.filter(([, k]) => k < pos).pop(), q = qc.find(([, k]) => k > pos);
  if (q && q[0] === '?' && (!prevOp || prevOp[0] === ':')) {
    const t0 = prevOp ? prevOp[1] + 1 : a;
    let depthQ = 0, colon = null;
    for (const op of qc) { if (op[1] <= q[1]) continue; if (op[0] === '?') depthQ++; else { if (!depthQ) { colon = op; break; } depthQ--; } }
    const A = [q[1] + 1, colon ? colon[1] : b], B = colon ? [colon[1] + 1, b] : null;
    const test = cond(t0, q[1]);
    if (cx.ctx === 'spread') return { kind: 'spread', cond: test, what: `adds ${say(...A)}${B && !/^(\[\]|\{\}|null|undefined)$/.test(S.code.slice(...B).trim()) ? ` · else ${say(...B)}` : ''}`, region: [q[1] + 1, b] };
    if (cx.ctx === 'assign' && depth === 0 && !prevOp) {
      const al = aliasUses(S, cx.name, b);
      if (al.length) return { kind: 'alias', cond: `${cx.name} = ${cond(a, b)}`, what: al.map((u) => `:${u.line} ${u.kind === 'render' ? '' : code(u.cond) + ' → '}${u.what}`).slice(0, 3).join('; ') + (al.length > 3 ? `; +${al.length - 3} more` : ''), region: al[0].region, uses: al };
    }
    return { kind: 'ternary', cond: test, what: `${lead}${say(...A)} · else ${B ? say(...B) : '—'}`, region: [q[1] + 1, b] };
  }
  const ands = ops.filter(([o]) => o === '&&');
  if (ands.length && ops.every(([o]) => o === '&&' || o === '||' || o === '??') && pos < ands[ands.length - 1][1]) {
    const last = ands[ands.length - 1][1];
    const R = [last + 2, b];
    const j = jsxDesc(S, ...R);
    if (cx.ctx === 'spread') return { kind: 'spread', cond: cond(a, last), what: `adds ${say(...R)}`, region: R };
    if (j && cx.ctx !== 'assign' && cx.ctx !== 'prop') return { kind: 'render', cond: cond(a, last), what: `${lead}renders ${j}`, region: R };
    if (cx.ctx === 'child') return { kind: 'render', cond: cond(a, last), what: `renders ${code(short(S.code.slice(...R), 60))}`, region: R };
    if (cx.ctx === 'attr') return { kind: 'attr', cond: cond(a, last), what: `${lead}${code(short(S.code.slice(...R), 60))}`, region: R };
  }
  if (cx.ctx === 'if') {
    const rest = S.code.slice(cx.close + 1, cx.close + 240);
    const r = rest.match(/^\s*\{?\s*return\b\s*(null|undefined|false|''|""|\[\]|<>\s*<\/>)?\s*[;\n}]/);
    if (r) return { kind: 'return', cond: cond(a, b), what: `${fnAt(S, a) || 'the function'} returns ${r[1] || 'nothing'} (early exit)`, region: null };
    const rv = rest.match(/^\s*\{?\s*return\b\s*([^;\n{}<]{1,60}?)\s*;?\s*(?:\n|\})/);
    const balanced = (t) => (t.match(/\(/g) || []).length === (t.match(/\)/g) || []).length && (t.match(/\[/g) || []).length === (t.match(/\]/g) || []).length;
    if (rv && balanced(rv[1])) return { kind: 'return', cond: cond(a, b), what: `${fnAt(S, a) || 'the function'} returns ${code(collapse(rv[1]))} (early exit)`, region: null };
    /* the statement or block the `if` runs: JSX in it is what the condition draws */
    let x = cx.close + 1; while (/\s/.test(S.src[x])) x++;
    const y = S.src[x] === '{' && S.match[x] > x ? S.match[x] : enclosing(S, x + 1)[1];
    const j = jsxDesc(S, x, y);
    if (j) return { kind: 'render', cond: cond(a, b), what: `renders ${j} (the if block)`, region: [x, y] };
    return { kind: 'tbc', cond: cond(a, b, 60, 'if (', ')') };
  }
  if (cx.ctx === 'prop' && cx.name === 'skip') return { kind: 'skip', cond: cond(a, b), what: 'query skipped while this holds', region: null };
  if (cx.ctx === 'assign' && depth === 0) {
    const al = aliasUses(S, cx.name, b);
    if (al.length) return { kind: 'alias', cond: `${cx.name} = ${cond(a, b)}`, what: al.map((u) => `:${u.line} ${u.kind === 'render' ? '' : code(u.cond) + ' → '}${u.what}`).slice(0, 3).join('; ') + (al.length > 3 ? `; +${al.length - 3} more` : ''), region: al[0].region, uses: al };
  }
  if (cx.ctx === 'return' && ops.every(([o]) => o !== '?')) return { kind: 'tbc', cond: cond(a, b, 60, 'return ') };
  return { kind: 'tbc', cond: cond(a, b, 60, plain) };
}
/* the uses of a name bound to a flag, each classified (one level) */
function aliasUses(S, name, from) {
  const out = [];
  const bare = name.split('.').pop();
  const re = new RegExp(`(?<![\\w$.])${bare.replace(/\$/g, '\\$')}(?![\\w$])`, 'g');
  for (const m of S.code.matchAll(re)) {
    if (m.index < from || S.kind[m.index] !== CODE) continue;
    const e = effectAt(S, m.index, 1);
    if (e.kind !== 'tbc') out.push({ ...e, line: S.lineOf(m.index) });
  }
  /* what draws first: a render, an early return, a branch that draws JSX */
  const rank = (u) => (u.kind === 'render' ? 0 : u.kind === 'return' ? 1 : /`</.test(u.what) ? 2 : u.kind === 'spread' ? 3 : 4);
  return out.sort((x, y) => rank(x) - rank(y) || x.line - y.line);
}

/* ── 5 · the compiled pages: which source files each page file draws ────── */
/* a page file's key in the output: '' = the page, '@375' its phone layout, 'state' / 'state@375' */
const stateKey = (f) => `${f.state || ''}${f.dev === 'mobile' ? '@375' : ''}`;
/**
 * readPageMarkers(pageFiles) → Map(page → { files:Set, lines: Map(file → Map(line → Set(key))), insts: Map(id → Set(key)), texts: Map(text → Set(file)) })
 * pageFiles: [{ src, dev, page, state }] — package.mjs section 3's list. A file
 * is "in" a page when any of its page files carries it in data-pf-src or as
 * the def of a data-pf-i instance.
 */
export function readPageMarkers(pageFiles) {
  const out = new Map();
  for (const f of pageFiles) {
    const html = readFileSync(f.src, 'utf8');
    const p = out.get(f.page) || out.set(f.page, { files: new Set(), lines: new Map(), insts: new Map(), texts: new Map() }).get(f.page);
    const sk = stateKey(f);
    for (const m of html.matchAll(/data-pf-src="([^":]+):(\d+)"/g)) {
      p.files.add(m[1]);
      const byLine = p.lines.get(m[1]) || p.lines.set(m[1], new Map()).get(m[1]);
      (byLine.get(+m[2]) || byLine.set(+m[2], new Set()).get(+m[2])).add(sk);
    }
    /* the words a marked element draws first (lower-cased) → the files that draw them:
       `<div data-pf-src="src/layout/MenueItems.js:153">TruLeads<` */
    for (const m of html.matchAll(/data-pf-src="([^":]+):\d+"[^>]*>\s*([^<>]{2,80}?)\s*</g)) {
      const t = m[2].replace(/&amp;/g, '&').replace(/\s+/g, ' ').toLowerCase();
      if (/\p{L}/u.test(t)) (p.texts.get(t) || p.texts.set(t, new Set()).get(t)).add(m[1]);
    }
    for (const m of html.matchAll(/data-pf-i="([^"]+)"/g)) for (const id of m[1].split(/\s+/)) {
      const at = id.indexOf('@'); if (at < 0) continue;
      p.files.add(id.slice(at + 1));
      (p.insts.get(id) || p.insts.set(id, new Set()).get(id)).add(sk);
    }
  }
  return out;
}

/* ── 6 · the product's source files ─────────────────────────────────────── */
/**
 * loadProduct(repo) → { sha, constantsFile, constants, sources:[{file, src}], aliases }
 * aliases: vite.config.js's resolve.alias for the bayut tenant ('@x' → 'src/…').
 */
export function loadProduct(repo, tenant = 'bayut') {
  const files = [];
  (function walk(dir) {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, e.name);
      if (e.isDirectory()) { if (e.name !== 'node_modules') walk(p); }
      else if (/\.(jsx?|mjs)$/.test(e.name)) files.push(p);
    }
  })(join(repo, 'src'));
  files.sort();                                             /* the same order on every machine */
  let sha = 'unknown';
  try { sha = execSync('git rev-parse --short HEAD', { cwd: repo, encoding: 'utf8' }).trim(); } catch { /* not a checkout */ }
  const vite = existsSync(join(repo, 'vite.config.js')) ? readFileSync(join(repo, 'vite.config.js'), 'utf8') : '';
  const aliases = Object.fromEntries([...vite.matchAll(/'(@[\w]*)':\s*resolve\(__dirname,\s*[`']([^`']+)[`']\)/g)].map((m) => [m[1], m[2].replace(/\$\{tenantName\}/g, tenant)]));
  const constantsFile = `src/tenant/${tenant}/constants/constants.js`;
  /* what else index.js spreads into the same object (filterConstants): defined, but not flags */
  const indexFile = join(repo, `src/tenant/${tenant}/constants/index.js`);
  const merged = [];
  if (existsSync(indexFile)) {
    const idx = readFileSync(indexFile, 'utf8');
    for (const m of idx.matchAll(/import\s*\{\s*([\w$]+)\s*\}\s*from\s*'\.\/([\w-]+)'/g)) {
      if (!new RegExp(`\\.\\.\\.${m[1]}\\b`).test(idx) || !existsSync(join(repo, `src/tenant/${tenant}/constants/${m[2]}.js`))) continue;
      const src = readFileSync(join(repo, `src/tenant/${tenant}/constants/${m[2]}.js`), 'utf8');
      const body = (src.match(new RegExp(`export\\s+const\\s+${m[1]}\\s*=\\s*\\{([^}]*)\\}`)) || [])[1] || '';
      for (const k of body.split(',')) { const key = k.split(':')[0].trim(); if (key) merged.push({ key, from: `src/tenant/${tenant}/constants/${m[2]}.js` }); }
    }
  }
  return { sha, constantsFile, constants: readFileSync(join(repo, constantsFile), 'utf8'), merged, sources: files.map((p) => ({ file: relative(repo, p), src: readFileSync(p, 'utf8') })), aliases };
}

/* a JSX tag in a file → the catalogue def it renders, through the file's imports */
function importsOf(S) {
  const out = new Map();
  for (const m of S.code.matchAll(/import\s+([^'";]+?)\s+from\s+['"]([^'"]+)['"]/g)) {
    const [, what, from] = m;
    const def = what.match(/^([\w$]+)/); if (def && !what.startsWith('{')) out.set(def[1], from);
    const named = what.match(/\{([^}]*)\}/);
    if (named) for (const part of named[1].split(',')) { const [orig, as] = part.split(/\s+as\s+/).map((x) => x.trim()); if (orig) out.set(as || orig, from); }
  }
  return out;
}
function resolveModule(file, spec, aliases, known) {
  let base;
  if (spec.startsWith('.')) base = normalize(join(dirname(file), spec));
  else { const al = Object.keys(aliases).sort((x, y) => y.length - x.length).find((k) => spec === k || spec.startsWith(k + '/')); if (!al) return null; base = normalize(join(aliases[al], spec.slice(al.length))); }
  for (const c of [base, `${base}.js`, `${base}.jsx`, `${base}/index.js`, `${base}/index.jsx`]) if (known.has(c)) return c;
  return null;
}

/* ── 7 · everything together ───────────────────────────────────────────── */
const OTHER_TENANT = /^src\/tenant\/(?!bayut\/|common\/)[a-z]+\//;
const valueCell = (v) => `${code(v.text)}${v.kind === 'expr' ? ' *expr*' : v.kind === 'fn' ? ' *fn*' : ''}`;
const flat = (entries) => {
  const rows = [];
  const walk = (e, depth) => { rows.push({ ...e, depth }); for (const k of e.children || []) walk({ ...k, key: k.path }, depth + 1); };
  for (const e of entries) walk(e, 0);
  return rows;
};
const isGate = (v) => v.kind === 'const' && /^(true|false)$/.test(v.text);
const mdEsc = (s) => String(s).replace(/\|/g, '\\|');

/**
 * flagsFor({ product, catalogue, components, pageFiles, routes, publicPages, shellShare })
 *   product     loadProduct(repo)
 *   catalogue   data/ds/catalogue.json
 *   components  registry.components (slug → { source, … }), section 6
 *   pageFiles   section 3's list [{ src, dev, page, state }]
 *   routes      slug → route (pages-list.mjs ALL): a flag around a part naming a
 *               compiled page's route gates that page ('KEY=v (route)')
 *   publicPages page slugs drawn without the shell (package.mjs PUBLIC)
 *   shellShare  a file in ≥ this share of the signed-in pages is the shell's
 * → { md, pageFlags: { slug: ['KEY=v (route)', 'KEY=v', 'OBJ.SUB=v'] }, shellFlags, shellFiles, refs, entries, sha }
 */
export function flagsFor({ product, catalogue, components, pageFiles, routes = {}, publicPages = new Set(), shellShare = 0.9 }) {
  const entries = parseConstants(product.constants);
  const keys = new Set(entries.map((e) => e.key));
  const byKey = new Map(entries.map((e) => [e.key, e]));
  const known = new Set(product.sources.map((x) => x.file));

  /* references, in every source file but the tenants' own constants */
  const scans = new Map();
  const refs = [];
  for (const { file, src } of product.sources) {
    if (/^src\/tenant\/[a-z]+\/constants\//.test(file)) continue;
    if (!/tenantConstants|@constants/.test(src)) continue;
    const S = scan(src);
    scans.set(file, S);
    for (const r of findReferences(file, src, keys, S)) refs.push(r);
  }
  /* a sub-key only counts when the key's value is an object that has it */
  for (const r of refs) if (r.sub) { const e = byKey.get(r.key); if (!e || e.kind !== 'object' || !(e.children || []).some((c) => c.key === r.sub)) r.sub = null; }
  /* a key (or sub-key) whose value is not true/false is read for its value */
  const valueKey = (r) => {
    const e = byKey.get(r.key); if (!e) return false;
    const v = r.sub ? (e.children || []).find((k) => k.key === r.sub) || e : e;
    return !(isGate(v) || v.kind === 'expr');
  };
  for (const r of refs) {
    const S = scans.get(r.file);
    if (!r.destructured) { r.effect = effectAt(S, r.pos); if (r.effect.kind === 'tbc' && valueKey(r)) r.effect = { kind: 'value', cond: r.effect.cond }; continue; }
    const al = aliasUses(S, r.key, r.pos + r.len);
    r.effect = al.length ? { kind: 'alias', cond: `{ ${r.key} } = tenantConstants`, what: al.slice(0, 3).map((u) => `:${u.line} ${u.kind === 'render' ? '' : code(u.cond) + ' → '}${u.what}`).join('; ') + (al.length > 3 ? `; +${al.length - 3} more` : ''), region: al[0].region, uses: al } : { kind: 'tbc', cond: `{ ${r.key} } = tenantConstants` };
  }

  /* which compiled files draw each page; the shell's files */
  const marks = readPageMarkers(pageFiles);
  const signed = [...marks.keys()].filter((p) => !publicPages.has(p));
  const share = new Map();
  for (const p of signed) for (const f of marks.get(p).files) share.set(f, (share.get(f) || 0) + 1);
  const shellFiles = new Set([...share].filter(([, n]) => n >= Math.ceil(signed.length * shellShare)).map(([f]) => f));
  const pagesOf = (file) => [...marks.entries()].filter(([, m]) => m.files.has(file)).map(([p]) => p).sort();

  /* file → the registry components it defines; the page containers (folded) → their pages */
  const slugsOf = new Map(), containerOf = new Map(), byName = new Map();
  for (const c of catalogue) {
    if (!c.def) continue;
    (byName.get(c.name) || byName.set(c.name, []).get(c.name)).push(c);
    if (components[c.slug]) (slugsOf.get(c.def) || slugsOf.set(c.def, []).get(c.def)).push(c.slug);
    else if (c.level === 'page') (containerOf.get(c.def) || containerOf.set(c.def, new Set()).get(c.def)).add(c.name);
  }
  for (const [s, c] of Object.entries(components)) if (String(c.source).includes(' · ')) for (const d of c.source.split(' · ')) { const l = slugsOf.get(d) || slugsOf.set(d, []).get(d); if (!l.includes(s)) l.push(s); }
  /* a JSX tag in a file → the instance id it draws (Name@def), through the file's imports */
  const instDefs = new Map();                                /* instance name → Set(def), from the markers */
  for (const m of marks.values()) for (const id of m.insts.keys()) { const at = id.indexOf('@'); const n = id.slice(0, at); (instDefs.get(n) || instDefs.set(n, new Set()).get(n)).add(id.slice(at + 1)); }
  const catKey = new Map(catalogue.map((c) => [c.key || `${c.name}@${c.def}`, c]));
  const tagId = (file, S, tag) => {
    const name = tag.split('.').pop();
    const spec = (S.imports || (S.imports = importsOf(S))).get(tag.split('.')[0]);
    const mod = spec ? resolveModule(file, spec, product.aliases || {}, known) : null;
    const defs = [...(instDefs.get(name) || [])], cands = byName.get(name) || [];
    let def = null;
    if (mod && !/\/index\.jsx?$/.test(mod) && !tag.includes('.')) def = mod;
    else if (mod) def = defs.find((d) => d.startsWith(dirname(mod) + '/')) || (cands.find((c) => c.def.startsWith(dirname(mod) + '/')) || {}).def || null;
    else if (!spec) def = defs.includes(file) ? file : defs.length === 1 ? defs[0] : cands.length === 1 ? cands[0].def : null;
    if (!def) return null;
    /* the catalogue may name a component otherwise than its instances do (SetStaffCreditLimit /
       SetCreditsLimit, one def): by name first, else the def's only entry */
    const sameDef = catalogue.filter((x) => x.def === def && components[x.slug]);
    const c = catKey.get(`${name}@${def}`) || (sameDef.length === 1 ? sameDef[0] : null);
    return { id: `${name}@${def}`, slug: c && components[c.slug] ? c.slug : null };
  };

  /* how many source files import each component: an instance is evidence of *this* call site only
     when one or two files import it (a Button is drawn from everywhere) */
  /* barrels: index.js files that re-export — name → the module it comes from */
  const barrel = new Map();
  for (const { file, src } of product.sources) {
    if (!/\/index\.jsx?$/.test(file)) continue;
    const ex = new Map();
    for (const m of src.matchAll(/export\s*\{([^}]*)\}\s*from\s*['"]([^'"]+)['"]/g)) {
      const mod = resolveModule(file, m[2], product.aliases || {}, known); if (!mod) continue;
      for (const part of m[1].split(',')) { const [orig, as] = part.split(/\s+as\s+/).map((x) => x.trim()); if (orig) ex.set(as || orig, mod); }
    }
    if (ex.size) barrel.set(file, ex);
  }
  const importers = new Map(), importedBy = new Map();
  const addImp = (mod, file) => (importedBy.get(mod) || importedBy.set(mod, new Set()).get(mod)).add(file);
  for (const { file, src } of product.sources) {
    if (!/\bimport\b/.test(src)) continue;
    for (const m of src.matchAll(/import\s+([^'";]+?)\s+from\s+['"]([^'"]+)['"]/g)) {
      const mod = resolveModule(file, m[2], product.aliases || {}, known); if (!mod) continue;
      addImp(mod, file);
      const names = [];
      const d = m[1].match(/^([A-Z][\w$]*)/); if (d) names.push([d[1], mod]);
      const nm = m[1].match(/\{([^}]*)\}/);
      if (nm) for (const part of nm[1].split(',')) {
        const orig = part.split(/\s+as\s+/)[0].trim(); if (!/^[A-Z]/.test(orig)) continue;
        const via = barrel.get(mod) && barrel.get(mod).get(orig);
        if (via) addImp(via, file);
        names.push([orig, via || (/\/index\.jsx?$/.test(mod) ? null : mod), dirname(mod)]);
      }
      for (const [n, md, dir] of names) {
        const def = md || [...(instDefs.get(n) || [])].find((x) => x.startsWith(dir + '/'));
        if (def) { const id = `${n}@${def}`; (importers.get(id) || importers.set(id, new Set()).get(id)).add(file); }
      }
    }
  }
  const specific = (id) => (importers.get(id) || new Set()).size <= 2;
  /* a file with no marker of its own: the compiled files that import it — walking up
     through index.js barrels (menuList.js → menuList/index.js → MenueItems.js) */
  const isBarrel = (f) => /\/index\.jsx?$/.test(f);
  const srcOf = new Map(product.sources.map((x) => [x.file, x.src]));
  /* the names a barrel gives what it takes from `child` — `import { menuList } from './menuList'`,
     `import getLeadsStaffFilters from './leads-staff-filters'`; '*' when it re-exports it whole
     (`export * from`, or spreads it: `{ ...routes }`) */
  const namesFor = (barrel, child) => {
    const src = srcOf.get(barrel) || '', names = new Set();
    const to = (spec) => resolveModule(barrel, spec, product.aliases || {}, known) === child;
    for (const m of src.matchAll(/import\s+([^'";]+?)\s+from\s+['"]([^'"]+)['"]/g)) {
      if (!to(m[2])) continue;
      const d = m[1].trim().match(/^([\w$]+)/); if (d) names.add(d[1]);
      const nm = m[1].match(/\{([^}]*)\}/); if (nm) for (const part of nm[1].split(',')) { const [orig, as] = part.split(/\s+as\s+/).map((x) => x.trim()); if (orig) names.add(as || orig); }
    }
    for (const m of src.matchAll(/export\s*\{([^}]*)\}\s*from\s*['"]([^'"]+)['"]/g)) if (to(m[2])) for (const part of m[1].split(',')) { const [orig, as] = part.split(/\s+as\s+/).map((x) => x.trim()); if (orig) names.add(as || orig); }
    for (const m of src.matchAll(/export\s*\*\s*from\s*['"]([^'"]+)['"]/g)) if (to(m[1])) names.add('*');
    for (const n of [...names]) if (new RegExp(`\\.\\.\\.\\s*${n.replace(/\$/g, '\\$')}\\b`).test(src)) names.add('*');
    return names;
  };
  const uses = (file, n) => new RegExp(`(?<![\\w$])${n.replace(/\$/g, '\\$')}(?![\\w$])`).test(srcOf.get(file) || '');
  const importersVia = (file) => {
    const out = new Set(), seen = new Set([file]);
    const stack = [...(importedBy.get(file) || [])].map((f) => ({ f, from: file, need: null }));
    while (stack.length) {
      const { f, from, need } = stack.pop();
      if (seen.has(f)) continue;
      /* through a barrel, only the files that use the module's name there */
      if (need && !need.has('*') && ![...need].some((n) => uses(f, n))) continue;
      seen.add(f);
      if (pagesOf(f).length) { out.add(f); continue; }
      if (!isBarrel(f)) continue;
      const nm = need && !need.has('*') ? need : namesFor(f, from);
      for (const g of importedBy.get(f) || []) stack.push({ f: g, from: f, need: nm });
    }
    return [...out].sort();
  };
  const whereIs = (f) => (shellFiles.has(f) ? 'shell' : listOf(pagesOf(f), 3));
  /* file names, with their folder where two share a name (upgrade-listing.js ×2) */
  const names = (fs) => { const b = (f) => f.split('/').pop(); return fs.map((f) => (fs.filter((g) => b(g) === b(f)).length > 1 ? f.split('/').slice(-2).join('/') : b(f))); };
  const renderedBy = (file) => { const fs = importersVia(file); return names(fs).map((n, i) => `${n} (${whereIs(fs[i])})`); };
  /* a component file (JSX of its own) that a compiled file imports directly: said on its own line, never in the "N more" summary */
  const importedComponent = (file) => !!(scans.get(file) && scans.get(file).elements.length) && [...(importedBy.get(file) || [])].some((f) => pagesOf(f).length && !isBarrel(f));
  /* A data module — no JSX of its own, no marker (menuList.js, leads-staff-filters.js) — is
     drawn where a compiled file that imports it draws its entries. The evidence: one of its
     labels (title: / label: / name:) that at most one other KSA file spells is drawn, by a
     file that does not spell it — 'TruLeads' by MenueItems.js:153 (a shell file: the rail),
     'Last Interaction Source' by Label.js on lms-leads, where leads-management.js (which
     imports it through @filters) is drawn. A shell importer counts only when a shell file
     draws the label; a page importer, when the page's content does. */
  const ksaSources = product.sources.filter((x) => !OTHER_TENANT.test(x.file));
  const spellRe = (l) => new RegExp(`(['"\`>]\\s*)${l.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\s*['"\`<])`);
  const spells = new Map(), rare = new Map();
  const spelled = (file, l) => { const k = `${file}\u0001${l}`; if (!spells.has(k)) spells.set(k, new RegExp(spellRe(l).source, 'i').test(srcOf.get(file) || '')); return spells.get(k); };
  const specificLabel = (l) => { if (!rare.has(l)) { const re = spellRe(l); rare.set(l, ksaSources.filter((x) => x.src.includes(l) && re.test(x.src)).length <= 2); } return rare.get(l); };
  /* the pages (a page importer's content) and whether the shell draws one of `labels` of `file` */
  const evidence = (file, labels) => {
    const ls = [...new Set(labels)].filter((l) => l.length >= 2 && /\p{L}/u.test(l) && specificLabel(l));
    const res = { pages: new Set(), shell: false, via: new Set() };
    if (!ls.length) return res;
    const onShell = new Set(), shellVia = new Set();
    for (const via of importersVia(file)) {
      const sh = shellFiles.has(via);
      for (const p of pagesOf(via)) for (const l of ls) for (const d of marks.get(p).texts.get(l.toLowerCase()) || []) {
        if (d === file || spelled(d, l) || sh !== shellFiles.has(d)) continue;
        if (sh) { onShell.add(p); shellVia.add(via); } else { res.pages.add(p); res.via.add(via); }
      }
    }
    /* the shell draws it when it does so on most signed-in pages (the rail) — not a header title on five */
    if (onShell.size >= signed.length / 2) { res.shell = true; for (const v of shellVia) res.via.add(v); }
    return res;
  };
  const isDataModule = (file) => { const S = scans.get(file); return !!S && !S.elements.length && !pagesOf(file).length; };
  const throughMemo = new Map();
  /* where a data module's entries are drawn: [{ via, pages }] ('shell' for a shell importer) */
  const drawnThrough = (file) => {
    if (throughMemo.has(file)) return throughMemo.get(file);
    let out = [];
    if (isDataModule(file)) {
      const S = scans.get(file);
      const ev = evidence(file, labelsIn(S, 0, S.src.length));
      out = [...ev.via].sort().map((via) => ({ via, pages: shellFiles.has(via) ? ['shell'] : pagesOf(via).filter((p) => ev.pages.has(p)) }));
    }
    throughMemo.set(file, out);
    return out;
  };
  /* the list a reference decides an entry of: the array literal round it (not past a function
     body), else the part its effect controls — HIDE_INBOX's `...(!HIDE_INBOX ? [{ title: 'Inbox' }] : [])`
     sits in menus()' array, whose 'TruLeads' the rail draws */
  const listOf_ = (S, pos, region) => {
    for (let p = pos - 1; p >= 0; p--) {
      if (S.kind[p] !== CODE) continue;
      const ch = S.src[p];
      if ((ch === ')' || ch === ']' || ch === '}') && S.match[p] >= 0 && S.match[p] < p) { p = S.match[p]; continue; }
      if (S.match[p] > pos && (ch === '[' || ch === '{' || ch === '(')) {
        if (ch === '[') return [p, S.match[p] + 1];
        if (ch === '{' && /(?:=>|\))\s*$/.test(S.code.slice(Math.max(0, p - 4), p))) break;
      }
    }
    return region || null;
  };
  /* a part that names a compiled page's route: the flag decides whether that route (or its menu entry) exists */
  const bySlugRoute = new Map(Object.entries(routes).filter(([sl]) => marks.has(sl)).map(([sl, r]) => [r, sl]));
  const routeGate = new Map();                               /* page → Set(flag) */
  /* exact route; a path built on a parent's (`${path}/licenses`) may also match one compiled route by its tail */
  const routeSlug = (x) => {
    const rel = x.startsWith('…'), p = x.replace(/^…/, '');
    if (bySlugRoute.has(p)) return bySlugRoute.get(p);
    if (!rel || p.split('/').length < 2) return null;
    const tail = [...bySlugRoute].filter(([r]) => r.endsWith(p));
    return tail.length === 1 ? tail[0][1] : null;
  };
  const routesOf = (S, region) => (region ? pathsIn(S, ...region, true).map(routeSlug).filter(Boolean) : []);

  /* where the part a reference controls is drawn: its host elements' lines, its component tags' instances */
  const drawnOf = (file, S, region) => {
    if (!region) return { where: [], slugs: [] };
    const [x, y] = region;
    const els = S.elements.filter((e) => e.start >= x && e.start < y && e.name);
    const hostLines = new Set(els.filter((e) => /^[a-z]/.test(e.name)).map((e) => S.lineOf(e.start)));
    const hits = els.filter((e) => /^[A-Z]/.test(e.name)).map((e) => tagId(file, S, e.name)).filter(Boolean);
    const ids = new Set(hits.map((h) => h.id).filter(specific));
    const slugs = [...new Set(hits.map((h) => h.slug).filter(Boolean))];
    const where = [];
    for (const [p, m] of marks) {
      if (!m.files.has(file)) continue;
      const ks = new Set();
      const byLine = m.lines.get(file);
      if (byLine) for (const ln of hostLines) for (const k of byLine.get(ln) || []) ks.add(k);
      for (const id of ids) for (const k of m.insts.get(id) || []) ks.add(k);
      if (!ks.size) continue;
      if (ks.has('')) { where.push(p); continue; }
      if (ks.has('@375')) { where.push(`${p}@375`); continue; }
      /* web states first, then the shortest names — a state's own name before its variants */
      const names = [...new Set([...ks].map((k) => (ks.has(k.replace(/@375$/, '')) ? k.replace(/@375$/, '') : k)))]
        .sort((x, y) => x.endsWith('@375') - y.endsWith('@375') || x.length - y.length || (x < y ? -1 : 1));
      where.push(`${p} (${listOf(names, 3)})`);
    }
    return { where, slugs };
  };

  const refsOf = new Map();                                  /* KEY → Map(file → refs) */
  for (const r of refs) { const m = refsOf.get(r.key) || refsOf.set(r.key, new Map()).get(r.key); (m.get(r.file) || m.set(r.file, []).get(r.file)).push(r); }
  const MAX_FILES = 12, MAX_REFS = 4;
  const gatesCell = (file, rs, label = file.split('/').pop()) => {
    const S = scans.get(file);
    const slugs = slugsOf.get(file) || [];
    const cont = containerOf.get(file);
    const on = pagesOf(file);
    const shell = shellFiles.has(file);
    const head = [
      slugs.length ? listOf(slugs, 3) : '',
      cont ? `page ${on.length ? listOf(on, 4) : [...cont].join('/')}` : '',
      shell ? 'shell' : cont ? '' : on.length ? `on ${listOf(on, 4)}`
        : drawnThrough(file).length ? (() => { const dt = drawnThrough(file); const on = [...new Set(dt.flatMap((x) => x.pages))]; return `no marker of its own; its entries are drawn on ${on.includes('shell') ? 'the shell' : listOf(on.sort(), 4)} — imported there by ${listOf(names(dt.map((x) => x.via)), 3)}`; })()
        : renderedBy(file).length ? `no marker of its own; imported by ${listOf(renderedBy(file), 3)}` : 'on no compiled page',
    ].filter(Boolean).join(' · ');
    const bits = [];
    const vals = rs.filter((r) => r.effect.kind === 'value');
    if (vals.length) bits.push(`:${[...new Set(vals.map((r) => r.line))].join(',')} uses the value`);
    /* one entry per distinct effect; the rest counted */
    const seen = new Set();
    const shown = rs.filter((r) => { if (r.effect.kind === 'value') return false; const sig = `${r.effect.kind}|${r.effect.cond}|${r.effect.what || ''}`; if (seen.has(sig)) return false; seen.add(sig); return true; });
    const room = Math.max(1, MAX_REFS - bits.length);
    for (const [i, r] of shown.entries()) {
      const e = r.effect;
      if (i === room) { bits.push(`+${shown.length - room} more (Referenced in has the lines)`); break; }
      /* the condition is already cut round the flag (excerpt); a flag ORed with another operand is said so */
      const orNote = e.or && e.or.length ? ` (ORed with ${listOf(e.or.map((o) => code(mdEsc(o))), 3)}: this flag alone does not decide it)` : '';
      if (e.kind === 'tbc') { bits.push(`:${r.line} [TBC] ${code(mdEsc(e.cond))}${orNote}`); continue; }
      const d = shell ? { where: [], slugs: [] } : drawnOf(file, S, e.region);
      const rt = e.kind === 'alias' ? [] : routesOf(S, e.region);
      bits.push(`:${r.line} ${code(mdEsc(e.cond))}${orNote} → ${mdEsc(e.what)}${d.slugs.length ? ` [${d.slugs.join(' ')}]` : ''}${rt.length ? ` — route of ${[...new Set(rt)].join(', ')}` : ''}${d.where.length ? ` — drawn: ${d.where.slice(0, 2).join('; ')}${d.where.length > 2 ? `; +${d.where.length - 2} pages` : ''}` : ''}`);
    }
    return `**${label}** ${head} — ${bits.join('; ')}`;
  };

  const rows = [];
  for (const row of flat(entries)) {
    const top = row.key.split(/[.[]/)[0];
    const sub = row.depth === 1 && byKey.get(top).kind === 'object' ? row.key.slice(top.length + 1) : null;
    const files = refsOf.get(top) || new Map();
    const use = row.depth === 0 ? [...files.entries()] : sub ? [...files.entries()].map(([f, rs]) => [f, rs.filter((r) => r.sub === sub)]).filter(([, rs]) => rs.length) : [];
    const ksa = use.filter(([f]) => !OTHER_TENANT.test(f) || pagesOf(f).length);
    const other = use.length - ksa.length;
    const ref = ksa.slice(0, MAX_FILES).map(([f, rs]) => `\`${f}:${[...new Set(rs.map((r) => r.line))].join(',')}\``).join(' ')
      + (ksa.length > MAX_FILES ? ` +${ksa.length - MAX_FILES} more: ${ksa.slice(MAX_FILES).map(([f]) => `\`${f}\``).join(' ')}` : '')
      + (other ? ` (+${other} in other tenants' folders, on no compiled page)` : '');
    /* the top row of an object key gates through its sub-keys: its own cell covers the reads of the whole object */
    const whole = row.depth === 0 && row.kind === 'object' ? ksa.map(([f, rs]) => [f, rs.filter((r) => !r.sub)]).filter(([, rs]) => rs.length) : ksa;
    /* the shortest path tail that tells this row's files apart */
    const label = (f) => { const parts = f.split('/'); for (let n = 1; n < parts.length; n++) { const t = parts.slice(-n).join('/'); if (whole.filter(([g]) => g === t || g.endsWith('/' + t)).length === 1) return t; } return f; };
    /* files on no compiled page whose code shows no effect: one line (Referenced in has their lines) */
    const quiet = whole.filter(([f, rs]) => !pagesOf(f).length && !drawnThrough(f).length && !importedComponent(f) && rs.every((r) => r.effect.kind === 'tbc' || r.effect.kind === 'value'));
    const gate = [...whole.filter((x) => !quiet.includes(x)).map(([f, rs]) => gatesCell(f, rs, label(f))),
      ...(quiet.length ? [`${quiet.length} more on no compiled page, no effect shown (${quiet.every(([, rs]) => rs.every((r) => r.effect.kind === 'value')) ? 'the value is used' : '[TBC]'}): ${quiet.map(([f]) => label(f)).join(', ')}`] : [])].join('<br>');
    const name = row.depth ? `↳ \`${row.key}\`` : `\`${row.key}\``;
    const val = row.children ? `*${row.kind}*` : valueCell(row);
    const inner = row.depth > 1 || (row.depth === 1 && !sub);            /* read through its parent row */
    rows.push(`| ${name} | ${mdEsc(val)}${row.note ? ` — *${mdEsc(row.note)}*` : ''} | ${inner ? '' : ref || '—'} | ${inner ? '' : gate || (row.depth === 0 && row.kind === 'object' && ksa.length ? 'see the sub-rows' : '—')} |`);
  }

  /* keys KSA files read that the KSA constants do not define: undefined, so falsy */
  const mergedKeys = new Set((product.merged || []).map((x) => x.key));
  const undef = new Map();
  for (const r of refs) if (!keys.has(r.key) && !mergedKeys.has(r.key) && !OTHER_TENANT.test(r.file)) (undef.get(r.key) || undef.set(r.key, new Set()).get(r.key)).add(`${r.file}:${r.line}`);

  /* per page: every true/false key (or sub-key) read by a file compiled into it */
  const gateOf = (r) => {
    const e = byKey.get(r.key); if (!e) return null;
    if (r.sub) { const c = (e.children || []).find((k) => k.key === r.sub); return c && isGate(c) ? `${r.key}.${r.sub}=${c.text}` : null; }
    return isGate(e) ? `${r.key}=${e.text}` : null;
  };
  const order = new Map(flat(entries).map((x, i) => [x.key, i]));
  const sorted = (xs) => [...new Set(xs.filter(Boolean))].sort((x, y) => (order.get(x.split('=')[0]) ?? 1e6) - (order.get(y.split('=')[0]) ?? 1e6));
  const byFile = new Map();
  for (const r of refs) (byFile.get(r.file) || byFile.set(r.file, []).get(r.file)).push(r);
  for (const r of refs) if (r.effect.region && r.effect.kind !== 'alias' && r.effect.kind !== 'tbc' && !OTHER_TENANT.test(r.file)) for (const sl of routesOf(scans.get(r.file), r.effect.region)) { const g = gateOf(r); if (g) (routeGate.get(sl) || routeGate.set(sl, new Set()).get(sl)).add(g); }
  /* a data module's flag counts where the list it decides an entry of is drawn: the rail's
     entries are menuList.js's (IS_LMS_ENABLED, HIDE_INBOX … → shell.flags); the lms-leads
     filters are leads-staff-filters.js's */
  const modFlags = new Map(), shellMod = [];
  for (const [f, rs] of byFile) {
    if (OTHER_TENANT.test(f) || !drawnThrough(f).length) continue;
    const S = scans.get(f);
    for (const r of rs) {
      const g = gateOf(r); if (!g) continue;
      const list = listOf_(S, r.pos, r.effect && r.effect.region);
      if (!list) continue;
      const ev = evidence(f, labelsIn(S, ...list));
      if (ev.shell) shellMod.push(g);
      for (const p of ev.pages) (modFlags.get(p) || modFlags.set(p, new Set()).get(p)).add(g);
    }
  }
  const pageFlags = {};
  for (const [p, m] of marks) {
    const rg = routeGate.get(p) || new Set();
    const own = sorted([...[...m.files].filter((f) => publicPages.has(p) || !shellFiles.has(f)).flatMap((f) => (byFile.get(f) || []).map(gateOf)), ...(modFlags.get(p) || [])]).filter((x) => !rg.has(x));
    pageFlags[p] = [...sorted([...rg]).map((x) => `${x} (route)`), ...own];
  }
  const shellFlags = sorted([...[...shellFiles].flatMap((f) => (byFile.get(f) || []).map(gateOf)), ...shellMod]);

  const gates = flat(entries).filter(isGate).length;
  const md = `<!-- GENERATED by scripts/skill/flags.mjs from profolio-reactjs@${product.sha} — do not edit by hand -->

# KSA tenant flags

${entries.length} keys of \`appConstants\` in \`${product.constantsFile}\` — ${gates} values, keys and sub-keys, are true/false. They define what Profolio KSA *is*.${(product.merged || []).length ? ` (\`@constants\` also spreads in ${[...new Set(product.merged.map((x) => `\`${x.from}\``))].join(', ')} — ${product.merged.map((x) => `\`${x.key}\``).join(', ')}: helpers, not flags.)` : ''}

**These are compile-time constants, the same for every KSA account.** No account has a flag "off". A flag-off state cannot be seen on live: QA it against a local build with the constant flipped, or against the compiled reference (\`pages/<page>/<state>.html\`). A value marked *expr* is not a literal: it is worked out as the app loads, from the build's environment, the browser or the URL — never the account.

- **Value** — the full value; an object's keys are its \`↳\` sub-rows. *Italic* after a value is the product's own comment on the key.
- **Referenced in** — every file that reads the key (\`tenantConstants.KEY\`, \`?.KEY\`, a destructure), with the lines. On a sub-row: the files that read that sub-key.
- **Gates** — per reading file: the registry components it defines and the pages its markers are compiled into (\`shell\` = on nearly every signed-in page; those flags are \`registry.shell.flags\`), then per reference what the code there shows — \`condition\` → effect, [the registry components that part renders], and where that part is drawn with the flag as it is (a page, or \`page (states)\`). **[TBC]**: the code at that line shows no effect on its own (a hook, a payload, a value passed on) — state none. A condition too long to print is cut round the flag, \`…\` for the rest; **(ORed with X: this flag alone does not decide it)**: the flag is one operand of an \`||\`: its value alone does not decide what it guards.
- A file with **no marker of its own**: \`its entries are drawn on <pages | the shell>\` — a data module (a menu, a filter list): a label only it and at most one other file spell is drawn there, by a file that does not spell it (\`menuList.js\`: the rail's entries, so its flags are \`registry.shell.flags\`); \`imported by <file> (<pages>)\` — a compiled file imports it, directly or through an \`index.js\`, nothing shows its output is drawn; \`on no compiled page\` — no compiled file imports it.

\`registry.json\` → \`pages[x].flags\`: every true/false key and sub-key read by a file compiled into any of the page's files (web, 375, every state), the shell's files aside, or by a data module whose entries the page draws (\`its entries are drawn on\`, the flag's own list among them). \`registry.shell.flags\`: the same for the shell's files and the data modules the shell draws. \`(route)\`: the flag decides whether the page's route or its menu entry exists (\`— route of <page>\` below).

| Flag | Value | Referenced in | Gates |
|---|---|---|---|
${rows.join('\n')}
${undef.size ? `
## Read, but not defined for KSA

Read by KSA files, absent from \`${product.constantsFile}\`: for KSA these are \`undefined\` (falsy).

| Key | Referenced in |
|---|---|
${[...undef].sort().map(([k, s]) => `| \`${k}\` | ${[...s].map((x) => `\`${x}\``).join(' ')} |`).join('\n')}
` : ''}`;
  return { md, pageFlags, shellFlags, shellFiles: [...shellFiles].sort(), refs, entries, sha: product.sha };
}
