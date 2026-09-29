#!/usr/bin/env python3
"""Hold the Profolio KSA skill package — or a design made with it — to the system.

    python3 qa/validate.py                      the whole package and every design in designs/ (run from skill/)
    python3 qa/validate.py designs/x.html ...   only those designs: checks 1-3
    python3 qa/validate.py --package designs/x.html   those designs, and the package's checks 4-7
    python3 qa/validate.py --design-only        every design in designs/: checks 1-3

On a .skill install (no atoms/, molecules/, organisms/) the package checks
4-7 are skipped and say so; they never fail a design.

Exits 1 when any check fails. Standard library only.

The checks
  1  no style value outside the copied sources
  2  a hex or rgb colour in a design        (outside css/; not in a compiled reference)
  3  a class on a page that registry.json does not know
  4  a registry entry whose file does not exist
  5  a page missing a state its registry entry lists
  6  a component class that neither stylesheet defines
  7  a component's used_on, used_in_states and the pages' component lists
     disagree with each other or with what the compiled files draw

References and designs. The files under pages/ and atoms/ molecules/
organisms/ are compiled from the product's own render and carry its inline
styles and literal colours, exactly as the product paints them; they are
marked <meta name="pf-compiled"> or <meta name="pf-component">. Checks 1 and
2 bind what is WRITTEN with the skill, not the product as shipped. A design
names every compiled file it copied from: the one it started from —
<meta name="pf-base" content="pages/dashboard.html">, a state file included
(pages/agency-staff/modal-set-credits-limit.html) — and every other file a
block came from — <meta name="pf-also" content="pages/dashboard/error.html">
(a comma-separated list, or one meta per file).

Check 1 holds each design to ITS OWN sources, never to the product as a
whole. A style attribute passes when
  - an element of its pf-base or a pf-also file carries the same style (a
    block copied from a compiled page keeps its own style attributes), or
  - it sits on an element antd positions at runtime (registry.json
    runtime_geometry: the tab ink bar and nav list) and every declaration is
    left, width, height or transform, in px or %, or
  - in the new My Listings (pf-base in pages/listings-new), every
    declaration is one its sources paint, or a var(--pf-ml-*) token.
A style on an element carrying data-pf-new-copy always fails: an element
you create or retype takes a registry utility (fz-12, mb-8 …), never a style
attribute — in the new theme, only var(--pf-ml-*) declarations.
"""
import html as entities
import json
import os
import re
import sys
from collections import Counter
from html.parser import HTMLParser

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MAX_SHOWN = 12

CLASS_RE = re.compile(r'\sclass="([^"]*)"')
STYLE_RE = re.compile(r'\sstyle="([^"]*)"')
COLOUR_RE = re.compile(r'#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)')
META_TAG_RE = re.compile(r'<meta\b[^>]*>', re.I)
ATTR_RE = re.compile(r'([\w:-]+)\s*=\s*"([^"]*)"')
SCRIPT_STYLE_RE = re.compile(r'<(script|style)\b[^>]*>.*?</\1>', re.S | re.I)
CSS_CLASS_RE = re.compile(r'\.(-?[_a-zA-Z][\w-]*)')
MARK_I_RE = re.compile(r'\sdata-pf-i="([^"]*)"')
MARK_SRC_RE = re.compile(r'\sdata-pf-src="([^":]*)')
MARK_C_RE = re.compile(r'\sdata-pf-c="([^"]*)"')

# antd writes these elements' position inline at runtime (the tab ink bar
# under the selected tab, the scrolled tab list); registry.json
# runtime_geometry overrides this default
RUNTIME_GEOMETRY = ['.pf-tabs-ink-bar', '.pf-tabs-nav-list']
LENGTH = r'-?(?:\d+(?:\.\d+)?|\.\d+)(?:px|%)|0'
GEOMETRY = {
    'left': re.compile(rf'^(?:{LENGTH})$'),
    'width': re.compile(rf'^(?:{LENGTH})$'),
    'height': re.compile(rf'^(?:{LENGTH})$'),
    'transform': re.compile(rf'^(?:translate[XY]?\(\s*(?:{LENGTH})(?:\s*,\s*(?:{LENGTH}))?\s*\)\s*)+$'),
}


def read(path):
    with open(path, encoding='utf-8', errors='replace') as f:
        return f.read()


def rel(path):
    return os.path.relpath(path, ROOT)


def html_files(*dirs):
    for d in dirs:
        top = os.path.join(ROOT, d)
        for base, _, names in os.walk(top):
            for n in sorted(names):
                if n.endswith('.html'):
                    yield os.path.join(base, n)


def metas(html):
    """the pf-* metas of a file; pf-also may repeat, and its values add up"""
    out = {}
    head = html[:max(html.find('</head>'), 20000)]
    for tag in META_TAG_RE.findall(head):
        a = dict(ATTR_RE.findall(tag))
        name, content = a.get('name', ''), entities.unescape(a.get('content', ''))
        if name == 'pf-also':
            out[name] = ', '.join(x for x in (out.get(name), content) if x)
        elif name.startswith('pf-'):
            out.setdefault(name, content)
    return out


def sources_of(m):
    """the compiled files a design names: pf-base, then every pf-also"""
    also = [x for x in re.split(r'[,\s]+', m.get('pf-also', '')) if x]
    return ([m['pf-base']] if m.get('pf-base') else []) + [x for x in also if x != m.get('pf-base')]


def classes_in(html):
    out = set()
    for value in CLASS_RE.findall(html):
        out.update(c for c in value.split() if c)
    return out


def body_colours(html):
    """colours written in the markup: style attributes, fill/stroke/colour
    attributes, <style> blocks — not the text of a script"""
    text = re.sub(r'<script\b[^>]*>.*?</script>', '', html, flags=re.S | re.I)
    return COLOUR_RE.findall(text)


class Report:
    def __init__(self):
        self.checks = []

    def add(self, number, title, failures, passed_note):
        self.checks.append((number, title, failures, passed_note))

    def print(self):
        failed = 0
        for number, title, failures, note in self.checks:
            mark = 'FAIL' if failures else 'ok  '
            print(f'  {mark} {number} {title}' + ('' if failures else f' — {note}'))
            for f in failures[:MAX_SHOWN]:
                print(f'         {f}')
            if len(failures) > MAX_SHOWN:
                print(f'         … and {len(failures) - MAX_SHOWN} more')
            failed += bool(failures)
        print(f'\n  {len(self.checks) - failed} of {len(self.checks)} checks pass')
        return failed


def load_registry():
    path = os.path.join(ROOT, 'registry.json')
    if not os.path.exists(path):
        print('  registry.json is missing — run the package build (npm run package)')
        sys.exit(2)
    return json.loads(read(path))


def known_classes(reg):
    known = set(reg.get('utilities', []))
    for c in reg.get('components', {}).values():
        known.update(c.get('classes', []))
    for p in reg.get('pages', {}).values():
        known.update(p.get('own', []))
    return known


def stylesheet_classes():
    out = set()
    for name in ('profolio.css', 'profolio.mobile.css'):
        path = os.path.join(ROOT, 'css', name)
        if os.path.exists(path):
            out.update(CSS_CLASS_RE.findall(read(path)))
    return out


PHONE_ONLY = ('375', '360')


def state_files(page, state, entry):
    """a state listed as "name", "name@web", or "name@375" / "name@360" (the
    phone only — 360 is the new My Listings' base); returns its files"""
    name, _, only = state.partition('@')
    folder = os.path.join(ROOT, os.path.dirname(entry['file']), page)
    files = []
    if only not in PHONE_ONLY:
        files.append(os.path.join(folder, f'{name}.html'))
    if only in PHONE_ONLY or (not only and entry.get('mobile')):
        files.append(os.path.join(folder, f'{name}.mobile.html'))
    return files


def declarations(style):
    return [d.strip() for d in style.split(';') if ':' in d]


def new_theme_tokens():
    path = os.path.join(ROOT, 'css', 'new-theme', 'tokens.css')
    return set(re.findall(r'(--pf-ml-[\w-]+)\s*:', read(path))) if os.path.exists(path) else set()


TOKEN_VAR = re.compile(r'var\((--pf-ml-[\w-]+)\)')


# ── check 1 ────────────────────────────────────────────────────────────────

class StyledElements(HTMLParser):
    """every element carrying a style attribute, as (line, tag, classes,
    style, carries data-pf-new-copy); script and style text is not markup"""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.found = []

    def handle_starttag(self, tag, attrs):
        style, cls, new_copy = None, '', False
        for k, v in attrs:
            if k == 'style' and style is None:
                style = v or ''
            elif k == 'class' and not cls:
                cls = v or ''
            elif k == 'data-pf-new-copy':
                new_copy = True
        if style is not None and style.strip():
            self.found.append((self.getpos()[0], tag, cls.split(), style, new_copy))

    handle_startendtag = handle_starttag


def styled(html):
    p = StyledElements()
    p.feed(html)
    p.close()
    return p.found


def geometry_only(style):
    """left, width, height or transform, in px or % — nothing else"""
    ds = declarations(style)
    for d in ds:
        k, _, v = d.partition(':')
        rx = GEOMETRY.get(k.strip().lower())
        if not rx or not rx.match(v.strip()):
            return False
    return bool(ds)


def norm_decl(d):
    return re.sub(r'\s+', '', d.replace('!important', '')).lower()


class Sources:
    """what check 1 reads, each file once: a design's sources, the registry's
    one-declaration utilities, and where else in the product a style is"""

    def __init__(self, reg):
        self.reg = reg
        self.parsed = {}
        self._utilities = None
        self._ml = None
        self.geometry = {s.lstrip('.') for s in reg.get('runtime_geometry', RUNTIME_GEOMETRY)}

    def styles(self, path):
        if path not in self.parsed:
            found = styled(read(path))
            self.parsed[path] = ({s for _, _, _, s, _ in found}, {norm_decl(d) for _, _, _, s, _ in found for d in declarations(s)})
        return self.parsed[path]

    def ml_tokens(self):
        if self._ml is None:
            self._ml = new_theme_tokens()
        return self._ml

    def utility_for(self, decl):
        """the registry utility whose whole rule is this one declaration"""
        if self._utilities is None:
            self._utilities = {}
            utils = set(self.reg.get('utilities', []))
            path = os.path.join(ROOT, 'css', 'profolio.css')
            css = read(path) if os.path.exists(path) else ''
            for m in re.finditer(r'^\s*([^{}\n@]+?)\s*\{([^{}]*)\}', css, re.M):
                sels = [s.strip() for s in m.group(1).split(',')]
                if not all(re.fullmatch(r'\.[\w-]+', s) for s in sels):
                    continue
                names = [s[1:] for s in sels if s[1:] in utils]
                ds = declarations(m.group(2))
                if names and len(ds) == 1:
                    self._utilities.setdefault(norm_decl(ds[0]), names[0])
        return self._utilities.get(norm_decl(decl))

    def carriers(self, wanted):
        """which installed compiled files carry which of these styles, per
        theme — {(style, new theme?)} → {file: {style}}; one read of each file"""
        out = {False: {}, True: {}}
        if not wanted:
            return out
        for path in html_files('pages', 'atoms', 'molecules', 'organisms'):
            theme = os.sep + 'listings-new' in path
            want = {s for s, t in wanted if t == theme}
            if want:
                hit = {entities.unescape(raw) for raw in STYLE_RE.findall(read(path))} & want
                if hit:
                    out[theme][rel(path)] = hit
        return out


def page_of(f):
    """pages/lms-leads/empty.mobile.html → ('lms-leads', True)"""
    parts = f.replace(os.sep, '/').split('/')
    name = parts[1] if len(parts) > 1 else parts[0]
    return re.sub(r'(\.mobile)?\.html$', '', name), f.endswith('.mobile.html')


def cover(styles, carriers, base):
    """the fewest compiled files that carry these styles — the files a block
    was most likely copied from, the design's own page and layout first"""
    left, out = set(styles), {}
    page, phone = page_of(base or '')
    while left:
        best = max(carriers.items(), key=lambda kv: (len(kv[1] & left), page_of(kv[0])[0] == page, page_of(kv[0])[1] == phone, -len(kv[0])), default=None)
        if not best or not best[1] & left:
            break
        for s in best[1] & left:
            out[s] = best[0]
        left -= best[1]
    return out


def tag_of(tag, classes):
    return f'<{tag}' + (f'.{classes[0]}' if classes else '') + '>'


def fetch_command(reg, path):
    """the qa/fetch.py command that installs a compiled file a design names:
    pages/<p>.html → <p>; pages/<p>.mobile.html → <p> --375; pages/<p>/<s>.html
    → <p> <s>; pages/<p>/<s>.mobile.html → <p> <s> --375; atoms/, molecules/
    or organisms/<slug>.html → --component <slug>. None when registry.json
    has no such page, state or component."""
    p = re.sub(r'^\./', '', path.replace(os.sep, '/'))
    m = re.fullmatch(r'pages/([^/]+?)(?:/([^/]+?))?(\.mobile)?\.html', p)
    if m:
        page, state, phone = m.groups()
        entry = reg.get('pages', {}).get(page)
        if not entry:
            return None
        ids = [s for s in entry.get('states', []) if s.partition('@')[0] == state]
        if state and not any(os.path.normpath(os.path.join(ROOT, p)) in map(os.path.normpath, state_files(page, s, entry)) for s in ids):
            return None                                      # no such state, or not on that device
        if not state and phone and not entry.get('mobile'):
            return None
        return f'python3 qa/fetch.py {page}' + (f' {state}' if state else '') + (' --375' if phone else '')
    m = re.fullmatch(r'(?:atoms|molecules|organisms)/([^/]+)\.html', p)
    if m and (reg.get('components', {}).get(m.group(1)) or {}).get('file') == p:
        return f'python3 qa/fetch.py --component {m.group(1)}'
    return None


def check_styles(path, html, m, src):
    """check 1 for one design: every style attribute against its own
    sources; returns (a reason the check cannot run, or None), and every
    style that fails as {(why, style): [first line, tag, count]}"""
    sources = sources_of(m)
    missing = [x for x in sources if not os.path.exists(os.path.join(ROOT, x))]
    if missing:
        how = list(dict.fromkeys(fetch_command(src.reg, x) or f'{x} is no file registry.json names — check the path' for x in missing))
        return f'{rel(path)}: the compiled file(s) it names are not installed ({", ".join(missing)}) — from skill/: {"; ".join(how)}', {}
    new_theme = 'listings-new' in m.get('pf-base', '')
    own_styles, own_decls = set(), set()
    for x in sources:
        s, d = src.styles(os.path.join(ROOT, x))
        own_styles |= s
        own_decls |= d
    ml = src.ml_tokens() if new_theme else set()

    def token_valued(d):
        used = TOKEN_VAR.findall(d)
        return bool(used) and all(t in ml for t in used) and not COLOUR_RE.search(TOKEN_VAR.sub('', d))

    found = {}                                               # (why, style) → [first line, tag, count]
    for line, tag, classes, style, new_copy in styled(html):
        if new_copy:
            if new_theme and all(token_valued(d) for d in declarations(style)):
                continue
            why = 'new copy'
        elif src.geometry & set(classes) and geometry_only(style):
            continue
        elif style in own_styles:
            continue
        elif new_theme and all(norm_decl(d) in own_decls or token_valued(d) for d in declarations(style)):
            continue
        else:
            why = 'not in sources'
        e = found.setdefault((why, style), [line, tag_of(tag, classes), 0])
        e[2] += 1
    return None, found


def style_failures(written, src):
    """check 1 over every design: the failures, each design's summary first"""
    results = []
    for path, html, m in written:
        fatal, found = check_styles(path, html, m, src)
        results.append((path, m, fatal, found))
    theme = lambda m: 'listings-new' in m.get('pf-base', '')
    wanted = {(s, theme(m)) for _, m, _, found in results for why, s in found if why == 'not in sources'}
    carriers = src.carriers(wanted)
    heads, lines = [], []
    for path, m, fatal, found in results:
        if fatal:
            heads.append(fatal)
            continue
        if not found:
            continue
        new_theme = theme(m)
        where = cover([s for why, s in found if why == 'not in sources'], carriers[new_theme], m.get('pf-base'))
        n_new = sum(1 for why, _ in found if why == 'new copy')
        n_out = len(found) - n_new
        summary = []
        if not m.get('pf-base'):
            summary.append('names no pf-base — a design names the compiled file it started from')
        if n_out:
            files = Counter(where.values())
            summary.append(f'{n_out} style(s) not on its pf-base or pf-also' + (' — on ' + ', '.join(f'{f} ({k})' for f, k in files.most_common(3)) + ': name the file a block came from in pf-also' if files else ''))
        if n_new:
            summary.append(f'{n_new} style(s) on new copy (data-pf-new-copy)')
        heads.append(f'{rel(path)}: ' + '; '.join(summary))
        for (why, style), (line, tag, n) in found.items():
            head = f'{rel(path)}:{line} {tag} style="{style[:70]}"' + (f' ×{n}' if n > 1 else '')
            utils = [u for u in (src.utility_for(d) for d in declarations(style)) if u]
            use = f'use {", ".join("." + u for u in utils)}' if utils else 'use a registry utility or the component\'s own markup'
            if why == 'new copy':
                lines.append(f'{head} — on new copy: ' + ('only var(--pf-ml-…) declarations' if new_theme else use))
            elif where.get(style):
                lines.append(f'{head} — {where[style]} has it')
            else:
                lines.append(f'{head} — no compiled file has it: {use}')
    return heads + lines


# ── check 7 ────────────────────────────────────────────────────────────────

H1_RE = re.compile(r'<h1>([^<]+)</h1>')
COMPONENT_META_RE = re.compile(r'<meta name="pf-component" content="([^"]*)"')


def drawn_by_marker(pages):
    """Name@file → {page: does the page's own file draw it} for every page whose
    compiled files draw that component — pages/<page>.html and
    <page>.mobile.html (its own files), <page>/<state>(.mobile).html (its
    states). Drawn is its marker (data-pf-i), or, where the compile left the
    marker out, an element whose owner and file name it: data-pf-c="Name" (the
    component whose render made the element) with data-pf-src="file:…" (where
    its JSX is written). The new theme's files are not the product's (their
    shell is grafted)."""
    seen = {}
    for path in html_files('pages'):
        parts = rel(path).split(os.sep)
        page = re.sub(r'(\.mobile)?\.html$', '', parts[1])
        if page not in pages or page == 'listings-new':
            continue
        html = read(path)
        keys = {key for value in MARK_I_RE.findall(html) for key in value.split()}
        for m in MARK_C_RE.finditer(html):
            # the data-pf-src of the same tag: between its '<' and its '>'
            src = MARK_SRC_RE.search(html, max(html.rfind('<', 0, m.start()), 0), html.find('>', m.end()))
            if src:
                keys.add(f'{m.group(1)}@{src.group(1)}')
        own = len(parts) == 2
        for key in keys:
            on = seen.setdefault(key, {})
            on[page] = on.get(page, False) or own
    return seen


def registry_consistency(reg):
    """a  pages[x] lists y                          -> x is in components[y].used_on
    b  x in used_on but pages[x] does not list y -> y is in shell.components and x is signed in
    c  a public page (roles ['public']) draws no shell component (the shell is signed in)
    d  part_of names a component; used_in_states is "all" or a subset of used_on
    e  a product component's used_on is exactly the pages whose files draw it: its
       marker Name@source (Name: its component page's <h1>), or an element whose
       data-pf-c and data-pf-src name it (drawn_by_marker) — never empty where it is
       drawn, never a page that does not draw it
    f  its used_in_states ("all": every page in used_on) is exactly the pages that
       draw it in a state file only — never a page whose own file (pages/<page>.html
       or .mobile.html) draws it, and every page that draws it in states alone.
       antd (found by root class) and the icon atom are held by a-d only."""
    comps, pages = reg.get('components', {}), reg.get('pages', {})
    shell = set(reg.get('shell', {}).get('components', []))
    listed = {p: set(e.get('organisms', []) + e.get('molecules', []) + e.get('atoms', [])) for p, e in pages.items()}
    public = {p for p, e in pages.items() if e.get('roles') == ['public']}
    out = []
    for p, have in listed.items():
        for y in sorted(have):
            if y not in comps:
                out.append(f'pages.{p} lists {y}, which is not a component')
            elif p not in comps[y].get('used_on', []):
                out.append(f'{y}: listed on pages.{p}, missing from its used_on')
    for y, c in comps.items():
        for p in c.get('used_on', []):
            if p not in pages:
                out.append(f'{y}: used_on names {p}, which is not a page')
            elif y in shell and p in public:
                out.append(f'{y}: a shell component, drawn on {p}, which is public (no shell, no account) — the page or its roles are wrong')
            elif y not in listed[p] and y not in shell:
                out.append(f'{y}: used_on names {p}, absent from pages.{p}\'s lists')
        if c.get('part_of') and c['part_of'] not in comps:
            out.append(f'{y}: part_of {c["part_of"]}, which is not a component')
        uis = c.get('used_in_states')
        if uis is not None and uis != 'all' and not (isinstance(uis, list) and set(uis) <= set(c.get('used_on', []))):
            out.append(f'{y}: used_in_states is neither "all" nor a subset of its used_on')
    for y in sorted(shell - set(comps)):
        out.append(f'shell.components names {y}, which is not a component')
    names = {}
    for path in html_files('atoms', 'molecules', 'organisms'):
        h = read(path)
        m, n = COMPONENT_META_RE.search(h[:20000]), H1_RE.search(h)
        if m and n:
            names[m.group(1)] = entities.unescape(n.group(1))
    drawn = drawn_by_marker(pages)
    for y, c in comps.items():
        src = c.get('source', '')
        if y not in names or not src.startswith('src/') or ' · ' in src:
            continue
        key = f'{names[y]}@{src}'
        on = drawn.get(key, {})
        want, have = set(on), set(c.get('used_on', []))
        if want - have:
            out.append(f'{y}: used_on lacks {", ".join(sorted(want - have))}, whose files draw {key}')
        if have - want:
            out.append(f'{y}: used_on names {", ".join(sorted(have - want))}, where no file draws {key}')
        states = c.get('used_in_states')
        only = have if states == 'all' else set(states if isinstance(states, list) else [])
        own = {p for p, by_own in on.items() if by_own}
        if only & own:
            out.append(f'{y}: used_in_states names {", ".join(sorted(only & own))}, whose own file (pages/<page>.html or .mobile.html) draws {key}')
        if (want & have) - own - only:
            out.append(f'{y}: used_in_states lacks {", ".join(sorted((want & have) - own - only))}, where only state files draw {key}')
    return out


def main(argv):
    designs = [os.path.abspath(a) for a in argv if not a.startswith('--')]
    # named designs are checked alone (1-3) unless --package asks for the rest
    design_only = '--design-only' in argv or (bool(designs) and '--package' not in argv)
    core = not all(os.path.isdir(os.path.join(ROOT, d)) for d in ('atoms', 'molecules', 'organisms'))
    reg = load_registry()
    missing_css = [a for a in (reg.get('source') or {}).get('assets', []) if a.startswith('css/') and not os.path.exists(os.path.join(ROOT, a))]
    if missing_css:
        print(f'  css/ is not installed ({len(missing_css)} files) — the checks read it. From skill/: python3 qa/fetch.py --css')
        return 2
    known = known_classes(reg)
    report = Report()

    # every html file in the package: reference or design?
    package_files = [] if design_only else list(html_files('pages', 'atoms', 'molecules', 'organisms'))
    pairs = []
    for path in package_files:
        html = read(path)
        m = metas(html)
        is_reference = 'pf-compiled' in m or 'pf-component' in m
        pairs.append((path, html, m, is_reference))
    # designs/ holds what is written with the skill: a design there is a
    # design, whatever metas its copied page still carries
    # with no design named, every design in designs/ is checked
    if not designs:
        for path in html_files('designs'):
            designs.append(os.path.abspath(path))
    print(f'\n  Profolio KSA skill — {rel(ROOT) if ROOT != os.getcwd() else "."}' + (f' · {len(designs)} design(s)' if designs else '') + (' · designs only, checks 1-3' if design_only else ''))
    for path in designs:
        if not os.path.exists(path):
            print(f'  no such file: {path}')
            return 2
        html = read(path)
        pairs.append((path, html, metas(html), False))
    written = [(p, h, m) for p, h, m, ref in pairs if not ref]

    # 1 — every style in a design, against the compiled files it names
    style_fail = style_failures(written, Sources(reg))
    report.add(1, 'no style value outside the copied sources', style_fail, f'{len(written)} design(s), each against its own pf-base and pf-also')

    # 2 — a colour in a design, against what the product has; two themes,
    # two pools: a current-theme design is held to the current product, a
    # new-theme design (its pf-base in pages/listings-new) to the new My
    # Listings — never one to the other
    colour_fail = []
    is_new = lambda p: os.sep + 'listings-new' in p
    pools = {False: set(), True: set()}
    if written:
        refs = [(p, h) for p, h, m, ref in pairs if ref]
        if design_only:
            refs = [(f, read(f)) for f in html_files('pages', 'atoms', 'molecules', 'organisms')]
        for p, h in refs:
            pools[is_new(p)].update(body_colours(h))
    for path, html, m in written:
        sources = sources_of(m)
        if any(not os.path.exists(os.path.join(ROOT, x)) for x in sources):
            continue                                         # check 1 says which
        base_html = '\n'.join(read(os.path.join(ROOT, x)) for x in sources)
        known_colours = pools['listings-new' in m.get('pf-base', '')] | set(body_colours(base_html))
        added = Counter(c for c in body_colours(html) if c not in known_colours)
        for colour, n in added.items():
            colour_fail.append(f'{rel(path)}: {colour}' + (f' ×{n}' if n > 1 else '') + ' — use a token (tokens.md) or a class from registry.json')
    report.add(2, 'no hex or rgb in a design outside css/', colour_fail, f'{len(written)} design(s) checked')

    # 3 — every class a page uses is in the registry
    unknown = {}
    for path, html, m, ref in pairs:
        # the pages and the designs; a component file's own page chrome (ds-*) is not a product class
        if ref and not rel(path).startswith('pages' + os.sep):
            continue
        for c in classes_in(SCRIPT_STYLE_RE.sub('', html)) - known:
            unknown.setdefault(c, rel(path))
    report.add(3, 'every class on a page is in registry.json', [f'.{c} — first on {where}' for c, where in sorted(unknown.items())], f'{len(known)} classes known')

    if not design_only and core:
        print('  .skill install: the package checks 4-7 need atoms/, molecules/ and organisms/ — skipped')
    if not design_only and not core:
        # 4 — every registry file exists
        missing = []
        for kind in ('components', 'pages'):
            for slug, entry in reg.get(kind, {}).items():
                for key in ('file', 'mobile'):
                    f = entry.get(key)
                    if f and not os.path.exists(os.path.join(ROOT, f)):
                        missing.append(f'{kind}.{slug}.{key}: {f}')
        report.add(4, 'every registry entry has its file', missing, f'{len(reg.get("components", {}))} components, {len(reg.get("pages", {}))} pages')

        # 5 — every state a page lists exists
        lost = []
        count = 0
        for slug, entry in reg.get('pages', {}).items():
            for state in entry.get('states', []):
                for f in state_files(slug, state, entry):
                    count += 1
                    if not os.path.exists(f):
                        lost.append(f'{slug}: {state} → {rel(f)}')
        report.add(5, 'every listed state has its file', lost, f'{count} state files')

        # 6 — every component class is defined by a stylesheet
        defined = stylesheet_classes()
        undefined = []
        for slug, entry in reg.get('components', {}).items():
            for c in entry.get('classes', []):
                if c not in defined:
                    undefined.append(f'{slug}: .{c}')
        report.add(6, 'every component class is in css/', undefined, f'{len(defined)} classes defined by the two stylesheets')

        # 7 — used_on and the pages' lists say the same thing
        report.add(7, 'used_on, used_in_states and the pages\' component lists agree', registry_consistency(reg), f'{len(reg.get("components", {}))} components against {len(reg.get("pages", {}))} pages and what every compiled file draws')

    failed = report.print()
    return 1 if failed else 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
