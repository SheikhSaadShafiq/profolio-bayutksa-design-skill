/**
 * The global tokens a component resets inside itself — for tokens.md.
 *
 * WHY: tokens.md gives every --pf-* token its :root value (css/tokens.css).
 * The product's antd theme then resets some of them per component: antd
 * writes a component's own theme as custom properties on
 * `.<cssVar key>.<component>` — the key is `styleProfolio`
 * (profolio-reactjs src/App.jsx: `cssVar: { key: 'styleProfolio' }`), a class
 * on every antd component's root. So profolio.css has
 *
 *   .styleProfolio.pf-btn { --pf-control-height: 36px; --pf-control-height-sm: 32px; … }
 *
 * and a button is 36px tall, not the 32px the token's :root row says. The
 * cold test's credits session measured it in a browser because tokens.md
 * said 32px for "inputs, selects and buttons" (defect #14).
 *
 * This reads the compiled stylesheets and returns, per global token:
 *   - a tokens.md row for every component that resets it to another value
 *     ("| `--pf-control-height` inside `.pf-btn` | `36px` | [src] profolio.css,
 *     profolio.mobile.css .styleProfolio.pf-btn | button height |"), to go
 *     under the token's own row — the source is the selector to grep;
 *   - on the token's own row, a pointer to those resets;
 *   - for the control-height tokens, the "controls" wording of the :root row,
 *     from the rules that consume the token and are NOT reset.
 *
 * Pure functions; the caller reads the files. Used by scripts/package.mjs
 * section 10.
 */

/* ── a small CSS reader: rules with their selectors, declarations and the
   @media / @supports / @container they sit in ─────────────────────────── */
export function parseRules(css) {
  const rules = [];
  const text = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const stack = [];                                            /* at-rule contexts */
  let i = 0, start = 0;
  const skipBlock = (from) => {                                /* index after the block that opens at `from` ('{') */
    let depth = 0;
    for (let k = from; k < text.length; k++) {
      const ch = text[k];
      if (ch === '"' || ch === "'") { k = text.indexOf(ch, k + 1); if (k < 0) return text.length; continue; }
      if (ch === '{') depth++;
      else if (ch === '}' && --depth === 0) return k + 1;
    }
    return text.length;
  };
  while (i < text.length) {
    const ch = text[i];
    if (ch === '"' || ch === "'") { const e = text.indexOf(ch, i + 1); i = e < 0 ? text.length : e + 1; continue; }
    if (ch === '{') {
      const prelude = text.slice(start, i).trim();
      if (/^@(media|supports|container|layer)\b/i.test(prelude)) { stack.push(prelude); i++; start = i; continue; }
      if (prelude.startsWith('@')) { i = skipBlock(i); start = i; continue; }  /* @keyframes, @font-face … */
      const end = skipBlock(i);
      rules.push({ selector: prelude, body: text.slice(i + 1, end - 1), at: stack.join(' '), decls: declarations(text.slice(i + 1, end - 1)) });
      i = end; start = i; continue;
    }
    if (ch === '}') { stack.pop(); i++; start = i; continue; }
    if (ch === ';' && !stack.length && text.slice(start, i).trim().startsWith('@')) { i++; start = i; continue; }  /* @import …; */
    i++;
  }
  return rules;
}

/** a rule body's declarations, [property, value], split at top-level ';' */
export function declarations(body) {
  const out = [];
  let depth = 0, quote = '', cur = '';
  for (const ch of body) {
    if (quote) { cur += ch; if (ch === quote) quote = ''; continue; }
    if (ch === '"' || ch === "'") { quote = ch; cur += ch; continue; }
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (ch === ';' && depth === 0) { push(cur); cur = ''; continue; }
    cur += ch;
  }
  push(cur);
  return out;
  function push(d) {
    const k = d.indexOf(':');
    if (k > 0) out.push([d.slice(0, k).trim(), d.slice(k + 1).trim().replace(/\s*!important$/, '')]);
  }
}

/** the :root custom properties of css/tokens.css → Map(token → value) */
export function globalTokens(tokensCss) {
  return new Map([...tokensCss.matchAll(/(--pf-[\w-]+)\s*:\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]));
}

const norm = (v) => String(v).toLowerCase().replace(/\s+/g, '').replace(/#([0-9a-f])\1([0-9a-f])\2([0-9a-f])\3\b/g, '#$1$2$3').replace(/\b0\./g, '.');

/* ── where a reset applies ──────────────────────────────────────────────── */
const KEY = 'styleProfolio';                                    /* antd's cssVar key: on every antd component */
/** one selector of a rule → the scope it names: `.styleProfolio.pf-btn` →
    `.pf-btn`; a styled-component's hashed variant (`--v29`) is its base */
export function scopeOf(selector) {
  let s = selector.replace(/:is\([^)]*\)|:(hover|focus|active|focus-visible|focus-within)\b|\[data-pf-(hover|focus|active)\]/g, '').trim();
  s = s.replace(/--v\d+\b/g, '');
  if (s === `.${KEY}`) return { scope: `.${KEY}`, root: true };
  s = s.replace(new RegExp(`\\.${KEY}(?=[.\\s]|$)`, 'g'), '').replace(/\s+/g, ' ').trim();
  return { scope: s, root: !s };
}
const stateOf = (selector) => (/:is\(:hover|:hover\b|data-pf-hover/.test(selector) ? 'hover' : /:focus|data-pf-focus/.test(selector) ? 'focus' : /:active\b|data-pf-active/.test(selector) ? 'active' : '');

/** the antd component a class belongs to: pf-select-single → select,
    pf-btn-sm → btn, pf-select-css-var → select */
export function componentOf(cls) {
  return String(cls).replace(/^\./, '').replace(/^pf-/, '').replace(/--v\d+$/, '')
    .replace(/-(css-var|styled|single|multiple|sm|lg|top|bottom|horizontal|vertical|element|item-control-input|inner|close|close-x)$/, '')
    .replace(/-(css-var|styled|single|multiple|sm|lg)$/, '');
}
const WORDS = { btn: 'button', picker: 'date picker', 'button-styled': 'styled button', 'form-item': 'form row', 'bottom-sheet-drawer': 'bottom sheet' };
/** a component, in words */
export function nounOf(cls) {
  const raw = String(cls).replace(/^\./, '').replace(/^pf-/, '').replace(/--v\d+$/, '');
  const c = componentOf(cls);
  return WORDS[raw] || WORDS[c] || c.replace(/-/g, ' ');
}
/* the control-height wording's words for the antd components that consume it */
const PLURAL = { 'form-item': 'form rows', modal: "the modal's ✕", tooltip: 'tooltips', tabs: 'tab bars', segmented: 'segmented controls', input: 'textareas', slider: 'sliders', skeleton: 'skeleton blocks', steps: 'steps', btn: 'buttons', picker: 'date pickers', select: 'selects' };
/** a scope in words: its first class, and its last part when it has two */
function scopeWords(scope) {
  const parts = scope.split(' ').filter(Boolean);
  const first = (parts[0].match(/\.(-?[\w-]+)/) || [])[1] || parts[0];
  const last = parts.length > 1 ? (parts[parts.length - 1].match(/\.(-?[\w-]+)/) || [])[1] : null;
  const words = [nounOf(first)];
  if (last) for (const w of nounOf(last).split(' ')) if (!words.join(' ').split(' ').includes(w)) words.push(w);
  return words.join(' ');
}
/** what a token sets, in words, from its name — antd's naming */
function aspectOf(token) {
  const t = token.replace(/^--pf-/, '');
  const size = { sm: 'small ', lg: 'large ', xs: 'extra-small ', xxs: '2× extra-small ', xl: 'extra-large ' }[(t.match(/-(sm|lg|xs|xxs|xl)$/) || [])[1]] || '';
  if (/^control-height/.test(t)) return `${size}height`;
  if (/^border-radius/.test(t)) return `${size}corner radius`;
  if (/^box-shadow/.test(t)) return 'shadow';
  if (/^(padding|margin)/.test(t)) return `${size}${t.split('-')[0]}`;
  if (/^font-size/.test(t)) return `${size}text size`;
  if (t === 'color-split') return 'divider colour';
  if (t === 'color-bg-spotlight') return 'tooltip background';
  const w = t.replace(/^color-/, '').split('-').map((x) => (x === 'bg' ? 'background' : x));
  return w.includes('background') ? w.join(' ') : `${w.join(' ')} colour`;
}

/**
 * every reset of a global token inside a component, from the stylesheets
 * @param {Record<string,string>} cssByFile  {'profolio.css': text, 'profolio.mobile.css': text}
 * @param {Map<string,string>} globals      globalTokens(tokens.css)
 * @param {Record<string,object[]>} [parsed]  the same files through parseRules, when the caller has them
 * @returns {{token,value,global,scope,root,states:string[],at,files:string[],selectors:string[],variants:number,uses:{component,prop,n}[]}[]}
 */
export function scopedOverrides(cssByFile, globals, parsed = Object.fromEntries(Object.entries(cssByFile).map(([f, css]) => [f, parseRules(css)]))) {
  const found = new Map();
  for (const [file, rules] of Object.entries(parsed)) {
    for (const r of rules) {
      for (const [prop, value] of r.decls) {
        if (!globals.has(prop) || norm(value) === norm(globals.get(prop))) continue;
        for (const sel of splitSelectors(r.selector)) {
          const { scope, root } = scopeOf(sel);
          const state = stateOf(sel);
          const k = [prop, norm(value), scope, r.at].join('\u0000');
          const e = found.get(k) || found.set(k, { token: prop, value, global: globals.get(prop), scope, root, states: [], at: r.at, files: [], selectors: [], variantSet: new Set() }).get(k);
          if (state && !e.states.includes(state)) e.states.push(state);
          if (!e.files.includes(file)) e.files.push(file);
          if (!e.selectors.includes(sel)) e.selectors.push(sel);
          for (const v of sel.match(/--v\d+\b/g) || []) e.variantSet.add(v);
        }
      }
    }
  }
  /* what the token sizes or paints there: the properties that consume it in
     the scope's own rules (for the root scope, in every rule) */
  const all = Object.values(parsed).flat();
  for (const e of found.values()) { e.uses = consumers(all, e.token, e.root ? null : e.scope); e.variants = e.variantSet.size; delete e.variantSet; }
  /* a reset on every antd component that no rule reads changes nothing */
  return [...found.values()].filter((e) => !e.root || e.uses.length).sort((a, b) => a.token.localeCompare(b.token) || a.scope.localeCompare(b.scope));
}

/** a selector list split at top-level commas */
export function splitSelectors(list) {
  const out = [];
  let depth = 0, cur = '';
  for (const ch of list) {
    if (ch === '(' || ch === '[') depth++;
    if (ch === ')' || ch === ']') depth--;
    if (ch === ',' && depth === 0) { out.push(cur.trim()); cur = ''; continue; }
    cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

/** the components and properties that consume var(token): [{component,
    prop, n}] in stylesheet order; `within` limits it to the rules of that
    scope's component */
export function consumers(rules, token, within = null) {
  const re = new RegExp(`var\\(${token.replace(/-/g, '\\-')}\\s*[,)]`);
  const only = within ? componentOf((within.match(/\.(-?[\w-]+)/) || [])[1] || '') : null;
  const tally = new Map();
  for (const r of rules) {
    for (const [prop, value] of r.decls) {
      if (prop.startsWith('--') || !re.test(value)) continue;
      const component = componentOf((r.selector.match(/\.(pf-[\w-]+)/) || [])[1] || r.selector);
      if (only && component !== only) continue;
      const k = `${component}\u0000${prop}`;
      tally.set(k, (tally.get(k) || 0) + 1);
    }
  }
  return [...tally.entries()].map(([k, n]) => { const [component, prop] = k.split('\u0000'); return { component, prop, n }; });
}

/* ── tokens.md ──────────────────────────────────────────────────────────── */
function whatOf(e) {
  if (e.root) return `${aspectOf(e.token)}, in every antd component — read by ${[...new Set(e.uses.map((c) => nounOf(c.component)))].slice(0, 4).join(', ')}`;
  const noun = scopeWords(e.scope);
  const states = e.states.length ? ` on ${e.states.join(', ')}` : '';
  const media = e.at ? ` at ${e.at.replace(/^@media\s*/, '')}` : '';
  const variants = e.variants ? `, and ${e.variants} styled variant${e.variants > 1 ? 's' : ''}` : '';
  const own = /^var\(/.test(e.value) ? `: its own ${e.value.replace(/^var\(([^,)]+).*$/, '$1')}` : '';
  return `${noun} ${aspectOf(e.token)}${states}${media}${variants}${own}`;
}
const fileList = (files) => files.join(', ');

/** one tokens.md row for a reset, in the table's own format */
export function rowOf(e) {
  const inside = e.root ? `inside \`.${KEY}\`` : `inside \`${e.scope}\``;
  const first = e.selectors.find((x) => !/--v\d+\b/.test(x)) || e.selectors[0];
  const sel = first.length > 70 ? (e.root ? `.${KEY}` : e.scope) : first;
  return `| \`${e.token}\` ${inside} | \`${e.value}\` | [src] ${fileList(e.files)} ${sel.replace(/\|/g, '/')} | ${whatOf(e).replace(/\|/g, '/')} |`;
}

/**
 * everything section 10 needs, from the stylesheets
 * @returns {{ overrides, rowsFor(token): string[], wording(token, fallback): string, rows: string[] }}
 */
export function scopedTokens(cssByFile, globals) {
  const parsed = Object.fromEntries(Object.entries(cssByFile).map(([f, css]) => [f, parseRules(css)]));
  const overrides = scopedOverrides(cssByFile, globals, parsed);
  const byToken = new Map();
  for (const e of overrides) (byToken.get(e.token) || byToken.set(e.token, []).get(e.token)).push(e);
  const all = Object.values(parsed).flat();
  return {
    overrides,
    rows: overrides.map(rowOf),
    rowsFor: (token) => (byToken.get(token) || []).map(rowOf),
    /** the :root row's "controls": for the control heights, what consumes
        the token where no component resets it, and where it is reset; any
        other token keeps `fallback`, and points at its resets */
    wording(token, fallback) {
      const resets = (byToken.get(token) || []).filter((e) => !e.root && !e.states.length && !e.at);
      if (!/^--pf-control-height/.test(token)) {
        const every = (byToken.get(token) || []).filter((e) => e.root).map((e) => `every antd component ${e.value}`);
        const where = [...every, ...new Set((byToken.get(token) || []).filter((e) => !e.root).map((e) => scopeWords(e.scope)))];
        return where.length ? `${fallback}; reset inside ${where.slice(0, 4).join(', ')}${where.length > 4 ? ' …' : ''} (rows below)`.replace(/^; /, '') : fallback;
      }
      const reset = new Set(resets.map((e) => componentOf((e.scope.match(/\.(-?[\w-]+)/) || [])[1])));
      const kept = new Map();
      for (const c of consumers(all, token)) if (!reset.has(c.component)) (kept.get(c.component) || kept.set(c.component, new Set()).get(c.component)).add(c.prop);
      const used = [...kept].map(([c, props]) => (PLURAL[c] || nounOf(c)) + ([...props].every((p) => /^min-/.test(p)) ? ` (${[...props].map((p) => p.replace(/-/g, ' ')).join(', ')})` : ''));
      const byValue = new Map();
      for (const e of resets) { const c = componentOf((e.scope.match(/\.(-?[\w-]+)/) || [])[1]); (byValue.get(e.value) || byValue.set(e.value, []).get(e.value)).push(PLURAL[c] || scopeWords(e.scope)); }
      const resetText = [...byValue].map(([v, n]) => `${[...new Set(n)].join(' and ')} ${v}`).join(', ');
      return `${aspectOf(token).replace(/height$/, 'control height')} where no component resets it: ${used.join(', ') || 'none'}${resetText ? ` — reset: ${resetText} (rows below)` : ''}`;
    },
  };
}
