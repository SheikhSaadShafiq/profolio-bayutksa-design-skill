/**
 * Where each component is drawn — read off the compiled files' own markers.
 *
 * A compiled page or state is the product's DOM, frozen. harness/freeze.js
 * wrote `data-pf-i="Name@def Name2@def2"` on the first element each product
 * component instance draws (outermost first when several start on one
 * element), and `data-pf-src="file:line"` on every element, where the JSX
 * that made it is written, with `data-pf-c="Name"`, the component whose
 * render made it — which stands in for a marker freeze.js left out (scanFile).
 * antd's components are found by the class on their
 * root, as scripts/ds/collect.mjs found them (a base component's catalogue key
 * IS that class). One pass over every page and state file, web and 375:
 *
 *   used_on          component → every page any of whose files draws it
 *   used_in_states   component → the pages that draw it in a state only (the
 *                    states themselves: product/usage.md)
 *   part_of          component → the component every one of its instances sits in
 *   lists            page → { organisms, molecules, atoms } — what its files draw,
 *                    the shell's own components listed once (registry.shell)
 *   source           page → the route containers (package.mjs FOLD) its files draw
 *   shell            what the layout (withAdminLayout) draws on (nearly) every
 *                    signed-in page, and nowhere the layout is not
 *   mods             antd component → the modifier classes of its own it carries in
 *                    a minority of its files (overflow, open, error, disabled…), with a file
 *
 * Nothing here matches classes against classes: a component is where its
 * marker (its owner and file, where the marker is missing; or antd root class)
 * is, and only there. It is the DOM, not the
 * paint: a 1px divider or a closed menu counts (collect.mjs's visible-only
 * index, data/ds/catalogue.json `pages`, is a strict subset of this — checked
 * 2026-09-29: 0 file-hits it has that this lacks).
 *
 * Pure functions, node stdlib only. scripts/package.mjs calls them.
 */

/* ── resolving a marker ─────────────────────────────────────────────── */

/**
 * @param {object[]} catalogue          data/ds/catalogue.json
 * @param {Set<string>} fold            the route containers (package.mjs FOLD), `${name}@${def}`
 * @param {Map<string,string>} level    registry slug → 'atom' | 'molecule' | 'organism' ('icon' included)
 * @param {string} [layoutFile]         the file that draws the shell (src/home.js: `export default withAdminLayout(Home)`)
 */
export function makeContext(catalogue, fold, level, layoutFile = 'src/layout/withAdminLayout.js') {
  const byId = new Map();            /* Name@def → { slug } | { source } */
  const baseRoots = new Map();       /* root class → slug (antd, as the product themes it) */
  const byDef = new Map();           /* def → the registry slugs it defines (not icons) */
  const defOf = new Map();           /* slug → def */
  for (const c of catalogue) {
    if (c.family === 'base') { if (level.has(c.slug)) baseRoots.set(c.key, c.slug); continue; }
    const id = `${c.name}@${c.def}`;
    if (c.group === 'Icons') { if (level.has('icon')) byId.set(id, { slug: 'icon' }); continue; }
    if (c.level === 'page' && fold.has(id)) continue;
    if (!level.has(c.slug)) continue;
    byId.set(id, { slug: c.slug });
    (byDef.get(c.def) || byDef.set(c.def, []).get(c.def)).push(c.slug);
    defOf.set(c.slug, c.def);
  }
  /* a route container is the page's own, not a component — FOLD names it, catalogued or not */
  for (const id of fold) byId.set(id, { source: id.slice(id.indexOf('@') + 1) });
  return { byId, baseRoots, byDef, defOf, level, layoutFile, base: new Set(baseRoots.values()) };
}

/* ── one file ───────────────────────────────────────────────────────── */

const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr', 'param', 'keygen']);
const TAG = /<(\/?)([a-zA-Z][\w:.-]*)((?:[^>"']|"[^"]*"|'[^']*')*)>/g;
const ATTR_I = /\sdata-pf-i="([^"]*)"/;
const ATTR_I_ALL = /\sdata-pf-i="([^"]*)"/g;
const ATTR_SRC = /\sdata-pf-src="([^":]*)/;
const ATTR_C = /\sdata-pf-c="([^"]*)"/;
const ATTR_CLASS = /\sclass="([^"]*)"/;
const NONE = Object.freeze([]);

/**
 * Scan one compiled file. Pure: html in, a summary out.
 * @returns {{ present: Map<string,number>, sources: Set<string>, enclosed: Map<string,Set<string>>,
 *   owned: Map<string,Set<string>>, inContent: Set<string>, layout: boolean, unresolved: Map<string,number> }}
 *   present     slug → instances in the file
 *   sources     the route containers the file draws (their def)
 *   enclosed    slug → the slugs around EVERY instance of it here — by marker, or by the
 *               file the enclosing markup is written in (an overlay is not inside its
 *               trigger's element, but its markup is written in the trigger's file); none
 *               when its only instance here is a missing marker's (below)
 *   owned       slug → every class on the elements it owns (its root, and what it draws
 *               down to the next component's root)
 *   inContent   the slugs with an instance inside a route container (the page's own content)
 *   layout      the file draws the shell (an element written in ctx.layoutFile)
 *   unresolved  markers naming no registry component and no route container
 *
 * A missing marker. freeze.js leaves some instances without their data-pf-i
 * (the same element is marked in one capture and not in another — most likely
 * because its defOf compares a child's _debugOwner with the fiber by identity,
 * and React keeps two copies of every fiber). Every element still carries data-pf-c, the name
 * of the component whose render made it (its owner), and data-pf-src, the
 * file its JSX is written in. When Name@that-file is a catalogued component
 * (or a route container) that no data-pf-i in the file names, the component
 * is drawn here all the same, and the first such element in the file (in
 * document order) is taken as marked — where freeze.js would have put the
 * marker of its first instance; its later elements are that instance's own
 * or further ones, present already. It cannot find a component whose every
 * element is another component's (SetStaffCreditLimit renders DataTable, and
 * its cells are antd's), so such a component is seen only where it is marked.
 */
export function scanFile(html, ctx) {
  const body = html.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '').replace(/<!--[\s\S]*?-->/g, '');
  const present = new Map(), sources = new Set(), enclosed = new Map(), owned = new Map(), unresolved = new Map(), inContent = new Set();
  let layout = false;
  /* every Name@def a marker in this file names; an owner-and-file pair naming another is a missing marker */
  const marked = new Set();
  for (const m of body.matchAll(ATTR_I_ALL)) for (const id of m[1].split(' ')) if (id) marked.add(id);
  const unmarked = new Set();                                /* taken as marked once already: the first element only */
  /* a frame per open element: the components that own it, the components (and
     the components whose files wrote the markup) around it, inside a route? */
  const stack = [{ tag: '#root', owners: NONE, around: NONE, route: false }];
  TAG.lastIndex = 0;
  let m;
  while ((m = TAG.exec(body))) {
    const tag = m[2].toLowerCase();
    if (m[1]) {                                             /* a closing tag: back to its element */
      for (let k = stack.length - 1; k > 0; k--) if (stack[k].tag === tag) { stack.length = k; break; }
      continue;
    }
    const attrs = m[3];
    const top = stack[stack.length - 1];
    const cm = attrs.includes('class=') ? attrs.match(ATTR_CLASS) : null;
    const cls = cm ? cm[1].split(/\s+/).filter(Boolean) : NONE;
    const im = attrs.includes('data-pf-i=') ? attrs.match(ATTR_I) : null;
    const sm = attrs.includes('data-pf-src=') ? attrs.match(ATTR_SRC) : null;
    const file = sm ? sm[1] : null;
    if (file === ctx.layoutFile) layout = true;
    let here = null, route = top.route;                    /* the components rooted on this element */
    let guessed = null;                                     /* the one a missing marker stands in for */
    if (im) for (const id of im[1].split(' ')) {
      if (!id) continue;
      const r = ctx.byId.get(id);
      if (!r) { unresolved.set(id, (unresolved.get(id) || 0) + 1); continue; }
      if (r.source) { sources.add(r.source); route = true; continue; }
      (here || (here = [])).push(r.slug);
    }
    /* a missing marker (above): taken as marked on the first element its owner and file name —
       inside the markers here (the element's JSX is the innermost), outside antd's root */
    if (file && attrs.includes('data-pf-c=')) {
      const c = attrs.match(ATTR_C);
      const id = c && `${c[1]}@${file}`;
      const r = id && !marked.has(id) && !unmarked.has(id) ? ctx.byId.get(id) : null;
      if (r) {
        unmarked.add(id);
        if (r.source) { sources.add(r.source); route = true; } else if (!(here && here.includes(r.slug))) { (here || (here = [])).push(r.slug); guessed = r.slug; }
      }
    }
    for (const x of cls) { const s = ctx.baseRoots.get(x); if (s) (here || (here = [])).push(s); }
    let owners = top.owners, around = top.around;
    if (here) {
      here = [...new Set(here)];
      here.forEach((s, i) => {
        present.set(s, (present.get(s) || 0) + 1);
        if (route) inContent.add(s);
        /* a missing marker's instance does not narrow what it sits in: the components around
           it (and those sharing its root) may be unmarked as well */
        if (s === guessed) return;
        /* outermost first: each sits inside what is around the element and the ones before it */
        const set = new Set(around);
        for (let k = 0; k < i; k++) set.add(here[k]);
        set.delete(s);
        const prev = enclosed.get(s);
        if (!prev) enclosed.set(s, set);
        else for (const x of prev) if (!set.has(x)) prev.delete(x);
      });
      owners = here;
    }
    if (cls.length) for (const s of owners) { const o = owned.get(s) || owned.set(s, new Set()).get(s); for (const x of cls) o.add(x); }
    if (!VOID.has(tag) && !attrs.endsWith('/')) {
      /* what the children sit in: this element's components, and the component whose
         file wrote it — when the file defines several and none of them is around yet
         (an overlay written in its trigger's file), all of them */
      const peers = (file && ctx.byDef.get(file)) || NONE;
      const byFile = peers.length > 1 && peers.some((s) => around.includes(s) || (here && here.includes(s))) ? NONE : peers;
      const add = [...(here || NONE), ...byFile].filter((s) => !around.includes(s));
      stack.push({ tag, owners, around: add.length ? [...around, ...new Set(add)] : around, route });
    }
  }
  return { present, sources, enclosed, owned, inContent, layout, unresolved };
}

/* ── every file ─────────────────────────────────────────────────────── */

export const emptyUsage = () => ({ files: [], comp: new Map(), unresolved: new Map() });

/**
 * Fold one file's scan into the running totals (the reducer package.mjs calls
 * in section 3, where it reads each file anyway).
 * @param acc   from emptyUsage()
 * @param file  { page, state (null for the page itself), dev: 'web' | 'mobile', out: its path in skill/ }
 * @param scan  from scanFile()
 */
export function addFile(acc, file, scan) {
  const fi = acc.files.push({ page: file.page, state: file.state, dev: file.dev, out: file.out, sources: scan.sources, layout: scan.layout }) - 1;
  for (const [slug] of scan.present) {
    let c = acc.comp.get(slug);
    if (!c) acc.comp.set(slug, c = { files: [], enclosed: null, classes: new Map(), inContent: false, outsideLayout: false });
    c.files.push(fi);
    const around = scan.enclosed.get(slug);             /* none: drawn here by a missing marker only */
    if (around && c.enclosed === null) c.enclosed = new Set(around);
    else if (around) for (const x of c.enclosed) if (!around.has(x)) c.enclosed.delete(x);
    if (scan.inContent.has(slug)) c.inContent = true;
    if (!scan.layout) c.outsideLayout = true;
    for (const x of scan.owned.get(slug) || []) { const f = c.classes.get(x); if (f) f.push(fi); else c.classes.set(x, [fi]); }
  }
  for (const [id, n] of scan.unresolved) acc.unresolved.set(id, (acc.unresolved.get(id) || 0) + n);
  return acc;
}

/* the modifier classes a design needs to know: antd's and the product's
   state suffixes. One a component carries in a minority of its files is a
   state it can be in — the majority is its default. */
const MOD_STATES = [
  [/-ping-(?:left|right|top|bottom)$/, 'overflow'],
  [/-ellipsis$/, 'ellipsis'],
  [/-(?:open|opened)$/, 'open'],
  [/-(?:active|selected)$/, 'active'],
  [/-(?:checked|indeterminate)$/, 'checked'],
  [/-disabled$/, 'disabled'],
  [/(?:-error|-has-error)$/, 'error'],
  [/-warning$/, 'warning'],
  [/-focused$/, 'focus'],
  [/-loading$/, 'loading'],
  [/-(?:expanded|collapsed)$/, 'collapsed'],
];
/* not a state of the component: motion frames, an icon's own name, a popover trigger's flag */
const NOT_MOD = /^(?:anticon|wave-|pf-(?:motion|zoom|fade|slide|move)|pf-popover-open$|pf-dropdown-open$|pf-tooltip-open$)|-(?:appear|enter|leave)(?:-|$)/;
const modState = (x) => { if (NOT_MOD.test(x)) return null; for (const [re, name] of MOD_STATES) if (re.test(x)) return name; return null; };

/**
 * Everything derived from the scan.
 * @param acc                 the totals (addFile)
 * @param opts.publicPages    Set — the pages with no account and no shell (roles ['public'])
 * @param opts.shellShare     the shell is what the layout draws on at least this share of the signed-in pages (0.9)
 * @param opts.ctx            makeContext's (levels, antd roots, defs)
 * @returns {{ usedOn: Map<slug,page[]>, statesOnly: Map<slug,page[]>, inStates: Map<slug,Map<page,state[]>>,
 *   partOf: Map<slug,slug>, lists: Map<page,{organisms,molecules,atoms}>, sources: Map<page,Set<def>>,
 *   shell: Set<slug>, mods: Map<slug,Map<state,{ex,files,classes}>>, signedIn: page[], fileCount, unresolved }}
 */
export function deriveUsage(acc, { publicPages = new Set(), shellShare = 0.9, ctx }) {
  const { files } = acc;
  const level = ctx.level;
  const stateDevs = new Map();                     /* page → state → Set(dev) */
  for (const f of files) if (f.state) {
    const s = stateDevs.get(f.page) || stateDevs.set(f.page, new Map()).get(f.page);
    (s.get(f.state) || s.set(f.state, new Set()).get(f.state)).add(f.dev);
  }
  const allPages = [...new Set(files.map((f) => f.page))].sort();
  const signedIn = allPages.filter((p) => !publicPages.has(p));
  const onPage = new Map();                         /* slug → Set(page) */
  const usedOn = new Map(), inStates = new Map(), statesOnly = new Map();
  for (const [slug, c] of acc.comp) {
    const pages = new Set(c.files.map((i) => files[i].page));
    onPage.set(slug, pages);
    usedOn.set(slug, [...pages].sort());
    /* the pages that draw it in a state only — never on the page itself, web or 375 */
    const own = new Set(c.files.filter((i) => !files[i].state).map((i) => files[i].page));
    const only = new Map();                         /* page → state → Set(dev) */
    for (const i of c.files) {
      const f = files[i];
      if (!f.state || own.has(f.page)) continue;
      const s = only.get(f.page) || only.set(f.page, new Map()).get(f.page);
      (s.get(f.state) || s.set(f.state, new Set()).get(f.state)).add(f.dev);
    }
    if (!only.size) continue;
    statesOnly.set(slug, [...only.keys()].sort());
    /* a state as pages[x].states writes it: "name" when both of its files draw it,
       name@web / name@375 when only that device's file does */
    inStates.set(slug, new Map([...only.entries()].sort().map(([page, st]) => [page, [...st.entries()].sort().map(([state, devs]) => {
      const all = stateDevs.get(page).get(state);
      return `${state}${devs.size === all.size && all.size === 2 ? '' : devs.has('web') ? '@web' : '@375'}`;
    })])));
  }
  /* the shell: what the layout draws around the content on (nearly) every
     signed-in page — never inside a route's own content, never in a file
     without the layout. Listed once (registry.shell), not on every page. */
  const cut = Math.ceil(signedIn.length * shellShare);
  const shell = new Set([...acc.comp.entries()].filter(([slug, c]) => !c.inContent && !c.outsideLayout
    && signedIn.filter((p) => onPage.get(slug).has(p)).length >= cut).map(([s]) => s));
  /* pages[x]: what its files draw, less the shell on a page that has one */
  const lists = new Map(), sources = new Map();
  for (const f of files) { const s = sources.get(f.page) || sources.set(f.page, new Set()).get(f.page); for (const d of f.sources) s.add(d); }
  for (const page of allPages) {
    const out = { organisms: [], molecules: [], atoms: [] };
    for (const [slug, pages] of onPage) {
      if (!pages.has(page) || (shell.has(slug) && !publicPages.has(page))) continue;
      const l = level.get(slug);
      if (l) out[`${l}s`].push(slug);
    }
    for (const k of Object.keys(out)) out[k].sort();
    lists.set(page, out);
  }
  /* part_of: the innermost feature component around every instance, in every
     file. Not antd, not a common building block or the layout (src/components/
     common, src/layout), not an icon. A sub-component written in another
     component's file (CardComponent in notification-center.js) stands for
     that file's main component — the peer around every one of its instances. */
  const generic = (z) => z === 'icon' || ctx.base.has(z) || /^src\/(?:components\/common|layout)\//.test(ctx.defOf.get(z) || '');
  const around = (z) => (acc.comp.get(z) || {}).enclosed || new Set();
  /* the main component of z's file: a peer (same def) around every instance of z */
  const mainOf = (z) => {
    const outer = (ctx.byDef.get(ctx.defOf.get(z)) || []).filter((w) => w !== z && around(z).has(w));
    return outer.sort((a, b) => around(a).size - around(b).size || a.localeCompare(b))[0] || z;
  };
  const partOf = new Map();
  for (const [slug, c] of acc.comp) {
    if (generic(slug)) continue;
    const cands = [...(c.enclosed || [])].filter((z) => z !== slug && !generic(z) && acc.comp.has(z));
    let pick = null;
    if (cands.length) {
      /* innermost: the one the most other candidates are around */
      const depth = (z) => cands.filter((o) => o !== z && around(z).has(o)).length;
      pick = cands.sort((a, b) => depth(b) - depth(a) || a.localeCompare(b))[0];
      pick = mainOf(pick);
    } else if (mainOf(slug) !== slug) pick = mainOf(slug);
    if (pick && pick !== slug) partOf.set(slug, pick);
  }
  /* modifier states: antd's — a state class an antd component carries in a
     minority of its files, of its own family (pf-tabs-… on antd-tabs). A
     product component built on one takes its states from it. A "-hidden"
     class it drops in exactly those files adds the part it then shows
     (antd-tabs overflowing: …-nav-operations without …-hidden). A closed
     overlay's "-hidden" is its default, not a state. */
  const mods = new Map();
  const stemOf = new Map([...ctx.baseRoots].map(([cls, s]) => [s, `${cls.split('-').slice(0, 2).join('-')}-`]));
  for (const [slug, c] of acc.comp) {
    if (!stemOf.has(slug)) continue;
    const stem = stemOf.get(slug);
    const total = c.files.length;
    const byState = new Map();                      /* state@dev → { classes, files } */
    for (const [x, fis] of c.classes) {
      const name = x.startsWith(stem) ? modState(x) : null;
      if (!name || fis.length * 2 > total) continue;
      const devs = new Set(fis.map((i) => files[i].dev));
      const key = `${name}${devs.size === 2 ? '' : devs.has('web') ? '@web' : '@375'}`;
      const e = byState.get(key) || byState.set(key, { classes: new Set(), files: new Set() }).get(key);
      e.classes.add(x);
      fis.forEach((i) => e.files.add(i));
    }
    for (const e of byState.values()) {
      for (const [h, hf] of c.classes) {
        if (!h.endsWith('-hidden')) continue;
        const shown = h.slice(0, -'-hidden'.length), sf = c.classes.get(shown);
        const hs = new Set(hf);
        if (sf && [...e.files].every((i) => !hs.has(i)) && [...e.files].every((i) => sf.includes(i))) e.classes.add(shown);
      }
      /* the example: a page's own file before a state's, then the shortest path */
      e.ex = [...e.files].map((i) => files[i]).sort((a, b) => (!!a.state - !!b.state) || a.out.length - b.out.length || a.out.localeCompare(b.out))[0].out;
    }
    if (byState.size) mods.set(slug, new Map([...byState.entries()].sort().map(([k, e]) => [k, { ex: e.ex, files: e.files.size, classes: [...e.classes].sort() }])));
  }
  return { usedOn, statesOnly, inStates, partOf, lists, sources, shell, mods, signedIn, fileCount: files.length, unresolved: acc.unresolved };
}

/* ── writing it down ────────────────────────────────────────────────── */

/**
 * The registry fields, dense. package.mjs spreads the result into
 * components[slug] (used_on always; used_in_states, part_of only when there).
 * used_in_states is the pages that draw it in a state only ("all": every page
 * in used_on); the states themselves are in product/usage.md.
 */
export function registryFields(u, slug) {
  return {
    used_on: u.usedOn.get(slug) || [],
    /* "all": every page in used_on draws it only in a state */
    ...(u.statesOnly.has(slug) ? { used_in_states: u.statesOnly.get(slug).length === (u.usedOn.get(slug) || []).length ? 'all' : u.statesOnly.get(slug) } : {}),
    ...(u.partOf.has(slug) ? { part_of: u.partOf.get(slug) } : {}),
  };
}

/** the modifier states' names, to append to components[slug].states */
export const modStateNames = (u, slug) => [...((u.mods.get(slug) || new Map()).keys())];

/** product/usage.md — grep it by component id */
export function usageMarkdown(u) {
  const rows = [];
  for (const [slug, pages] of [...u.inStates.entries()].sort()) for (const [page, states] of pages) rows.push(`| ${slug} | ${page} | ${states.join(' · ')} |`);
  const modRows = [];
  for (const [slug, m] of [...u.mods.entries()].sort()) for (const [state, e] of m) modRows.push(`| ${slug} | ${state} | ${e.classes.map((x) => `\`.${x}\``).join(' ')} | ${e.files} | \`${e.ex}\` |`);
  return `# Usage — where each component is drawn

Read off the compiled files' own markers (\`data-pf-i\`; antd by its root class) — and where the compile left a marker out, an element's owner and file (\`data-pf-c="Name"\` with \`data-pf-src="<its source>:…"\`) — every page and state, web and 375. \`registry.json\` → \`components[x].used_on\` is every page that draws it; \`used_in_states\` the pages that draw it only in a state (\`"all"\`: every one of them); \`part_of\` the component it always sits in. \`registry.shell.components\` are drawn by the layout on every signed-in page and are not repeated in \`pages[x]\`.

## Drawn only in a state — the state files

\`pages/<page>/<state>.html\` (and \`.mobile.html\`); \`@web\` / \`@375\`: only that file draws it. A lower bound: a component whose root element is another component's (set-staff-credit-limit's is data-table's, header-link's is link-with-icon's) is seen only in the files that carry its marker, so a row can lack a state, and a page listed can draw it in its own file too. Before calling a file without it, grep it for the component's source and for the words it shows (\`components[x].anatomy\`): \`grep -l 'data-pf-src="<components[x].source>' pages/<page>.html pages/<page>/*.html\`.

| component | page | states |
|---|---|---|
${rows.join('\n')}

## Modifier states — classes a component carries in some files only

The compiled pages already show these; before calling a behaviour absent, grep \`pages/\` for its classes. A state's files: \`grep -l <class> pages/*.html pages/*/*.html\`.

| component | state | classes | files | e.g. |
|---|---|---|---|---|
${modRows.join('\n')}
`;
}

/** the component page's section — the same states, where the component is shown */
export function modsSection(u, slug, esc = (s) => s) {
  const m = u.mods.get(slug);
  if (!m || !m.size) return '';
  return `
<section class="ds-section" id="page-states">
<h2>States in the pages <small>${m.size}</small></h2>
<p class="ds-note">Modifier classes this component carries in some of the compiled files only — open the file to see it.</p>
<table class="ds-table"><tr><th>state</th><th>classes</th><th>e.g.</th></tr>
${[...m].map(([s, e]) => `<tr><td><code>${esc(s)}</code></td><td>${e.classes.map((x) => `<code>.${esc(x)}</code>`).join(' ')}</td><td><a href="../${esc(e.ex)}"><code>${esc(e.ex)}</code></a> · ${e.files} files</td></tr>`).join('\n')}
</table>
</section>`;
}

/* ── the checks ─────────────────────────────────────────────────────── */

/**
 * The registry's promises about usage, on the registry alone (qa/validate.py
 * check 7 is the same in python). package.mjs runs it before writing.
 *   a  pages[x] lists y                          ⇒ x ∈ components[y].used_on
 *   b  x ∈ used_on, but pages[x] does not list y ⇒ y ∈ shell.components and x is signed in
 *   c  a public page (roles ['public']) draws no shell component (#21)
 *   d  part_of names a component; used_in_states ⊆ used_on
 * @returns {string[]} failures
 */
export function checkUsage(registry) {
  const fail = [];
  const comps = registry.components || {}, pages = registry.pages || {};
  const shell = new Set((registry.shell || {}).components || []);
  const isPublic = (p) => JSON.stringify((pages[p] || {}).roles || []) === '["public"]';
  const L = new Map(Object.keys(pages).map((p) => [p, new Set(['organisms', 'molecules', 'atoms'].flatMap((k) => pages[p][k] || []))]));
  for (const [p, set] of L) for (const y of set) {
    if (!comps[y]) fail.push(`pages.${p} lists ${y}, not a component`);
    else if (!(comps[y].used_on || []).includes(p)) fail.push(`pages.${p} lists ${y}; components.${y}.used_on has no ${p}`);
  }
  for (const [y, c] of Object.entries(comps)) {
    for (const p of c.used_on || []) {
      if (!pages[p]) { fail.push(`components.${y}.used_on: ${p} is not a page`); continue; }
      if (shell.has(y) && isPublic(p)) fail.push(`${p} is public (no shell, no account) but draws the shell's ${y}`);
      else if (!L.get(p).has(y) && !shell.has(y)) fail.push(`components.${y}.used_on has ${p}; pages.${p} does not list it`);
    }
    if (c.part_of && !comps[c.part_of]) fail.push(`components.${y}.part_of: ${c.part_of} is not a component`);
    if (c.used_in_states !== undefined && c.used_in_states !== 'all' && !Array.isArray(c.used_in_states)) fail.push(`components.${y}.used_in_states: neither "all" nor a list`);
    for (const p of Array.isArray(c.used_in_states) ? c.used_in_states : []) if (!(c.used_on || []).includes(p)) fail.push(`components.${y}.used_in_states: ${p} is not in its used_on`);
  }
  for (const y of shell) if (!comps[y]) fail.push(`shell.components: ${y} is not a component`);
  return fail;
}
