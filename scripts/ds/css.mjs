/**
 * A small, exact CSS splitter — enough to take a stylesheet apart into its
 * top-level rules and put it back together unchanged. Not a validating
 * parser: it tracks strings, comments, parentheses and brace depth, which is
 * all it takes to find where one rule ends and the next begins in CSS that a
 * browser has already serialised.
 */

/** Split CSS text into top-level items: 'sel{…}', '@media …{…}', '@layer a, b;' */
export function splitRules(css) {
  const out = [];
  let depth = 0, start = 0, i = 0, q = null;
  const n = css.length;
  while (i < n) {
    const c = css[i];
    if (q) { if (c === '\\') { i += 2; continue; } if (c === q) q = null; i++; continue; }
    if (c === '"' || c === "'") { q = c; i++; continue; }
    if (c === '/' && css[i + 1] === '*') { const e = css.indexOf('*/', i + 2); i = e < 0 ? n : e + 2; if (depth === 0) start = i; continue; }
    if (c === '{') depth++;
    else if (c === '}') { depth--; if (depth === 0) { const t = css.slice(start, i + 1).trim(); if (t) out.push(t); start = i + 1; } }
    else if (c === ';' && depth === 0) { const t = css.slice(start, i + 1).trim(); if (t) out.push(t); start = i + 1; }
    i++;
  }
  const rest = css.slice(start).trim();
  if (rest) out.push(rest);
  return out;
}

/** The selector (or at-rule prelude) of a top-level item. */
export const preludeOf = (rule) => rule.slice(0, rule.indexOf('{') < 0 ? rule.length : rule.indexOf('{')).trim();

/** The declarations of a plain style rule, as [prop, value, important] triples. */
export function declsOf(rule) {
  const a = rule.indexOf('{'), b = rule.lastIndexOf('}');
  if (a < 0 || b < 0) return [];
  const body = rule.slice(a + 1, b);
  const out = [];
  let depth = 0, start = 0, q = null;
  for (let i = 0; i <= body.length; i++) {
    const c = body[i];
    if (q) { if (c === '\\') { i++; continue; } if (c === q) q = null; continue; }
    if (c === '"' || c === "'") { q = c; continue; }
    if (c === '(') depth++;
    else if (c === ')') depth--;
    else if ((c === ';' && depth === 0) || i === body.length) {
      const d = body.slice(start, i).trim();
      start = i + 1;
      if (!d) continue;
      const k = d.indexOf(':');
      if (k < 0) continue;
      let v = d.slice(k + 1).trim();
      const imp = /!important\s*$/.test(v);
      if (imp) v = v.replace(/\s*!important\s*$/, '');
      out.push([d.slice(0, k).trim(), v, imp]);
    }
  }
  return out;
}

/**
 * Merge several ordered rule lists into one that keeps each list's order
 * wherever the lists agree — the cascade is order, so a merged stylesheet
 * that reorders two rules of equal specificity changes a page. A rule new to
 * the merge goes right after the rule that preceded it in its own list.
 * Where two lists disagree about two rules both already placed, the first
 * list's order stands, and the disagreement is counted so the render check
 * that follows knows where to look.
 */
export function mergeOrdered(lists) {
  /* a linked list with a rank per node, so an insertion is O(1) and "is A
     before B" is a number comparison; ranks are renumbered when a gap runs out */
  const head = { r: null, rank: 0, next: null };
  const tail = { r: null, rank: 2 ** 50, next: null };
  head.next = tail;
  const node = new Map();
  const renumber = () => { let k = 0; for (let x = head.next; x !== tail; x = x.next) x.rank = (++k) * 1024; tail.rank = (k + 2) * 1024; };
  let conflicts = 0;
  for (const list of lists) {
    let prev = head;
    for (const r of list) {
      const had = node.get(r);
      if (had) {
        if (had.rank < prev.rank) conflicts++;
        else prev = had;
        continue;
      }
      let rank = (prev.rank + prev.next.rank) / 2;
      if (!(rank > prev.rank && rank < prev.next.rank)) { renumber(); rank = (prev.rank + prev.next.rank) / 2; }
      const x = { r, rank, next: prev.next };
      prev.next = x;
      node.set(r, x);
      prev = x;
    }
  }
  const merged = [];
  for (let x = head.next; x !== tail; x = x.next) merged.push(x.r);
  return { merged, conflicts };
}
