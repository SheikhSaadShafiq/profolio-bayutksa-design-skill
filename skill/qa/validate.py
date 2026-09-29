#!/usr/bin/env python3
"""Hold the Profolio KSA skill package — or a design made with it — to the system.

    python3 qa/validate.py                      the whole package and every design in designs/ (run from skill/)
    python3 qa/validate.py designs/x.html ...   those designs, plus the package's own checks
    python3 qa/validate.py --design-only designs/x.html

Exits 1 when any check fails. Standard library only.

The checks
  1  a style attribute in a design          (not in a compiled reference)
  2  a hex or rgb colour in a design        (outside css/; not in a compiled reference)
  3  a class on a page that registry.json does not know
  4  a registry entry whose file does not exist
  5  a page missing a state its registry entry lists
  6  a component class that neither stylesheet defines

References and designs. The files under pages/ and atoms/ molecules/
organisms/ are compiled from the product's own render and carry its inline
styles and literal colours, exactly as the product paints them; they are
marked <meta name="pf-compiled"> or <meta name="pf-component">. Checks 1 and
2 bind what is WRITTEN with the skill, not the product as shipped. A design
that starts from a compiled page names it —
<meta name="pf-base" content="pages/dashboard.html">; a block copied from a
compiled page or a component keeps the product's own styles and colours.
Only a style value or a colour the product never uses counts.
"""
import json
import os
import re
import sys
from collections import Counter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MAX_SHOWN = 12

CLASS_RE = re.compile(r'\sclass="([^"]*)"')
STYLE_RE = re.compile(r'\sstyle="([^"]*)"')
COLOUR_RE = re.compile(r'#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)')
META_RE = re.compile(r'<meta name="(pf-compiled|pf-component|pf-base)"[^>]*?content="([^"]*)"')
SCRIPT_STYLE_RE = re.compile(r'<(script|style)\b[^>]*>.*?</\1>', re.S | re.I)
CSS_CLASS_RE = re.compile(r'\.(-?[_a-zA-Z][\w-]*)')


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
    return {k: v for k, v in META_RE.findall(html[:20000])}


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


def state_files(page, state, entry):
    """a state listed as "name", "name@web" or "name@375"; returns the files it must have"""
    name, _, only = state.partition('@')
    folder = os.path.join(ROOT, os.path.dirname(entry['file']), page)
    files = []
    if only != '375':
        files.append(os.path.join(folder, f'{name}.html'))
    if only == '375' or (not only and entry.get('mobile')):
        files.append(os.path.join(folder, f'{name}.mobile.html'))
    return files


def check_design(path, html, base_html, product, failures_style, failures_colour):
    # a style or colour the product itself uses — on the base page, or on any
    # compiled page or component a block was copied from — is the product's
    # own; only what the product never has is new
    known_styles = product['styles'] | set(STYLE_RE.findall(base_html or ''))
    added_styles = Counter(s for s in STYLE_RE.findall(html) if s not in known_styles)
    for style, n in added_styles.items():
        failures_style.append(f'{rel(path)}: style="{style[:70]}"' + (f' ×{n}' if n > 1 else ''))
    known_colours = product['colours'] | set(body_colours(base_html or ''))
    added_colours = Counter(c for c in body_colours(html) if c not in known_colours)
    for colour, n in added_colours.items():
        failures_colour.append(f'{rel(path)}: {colour}' + (f' ×{n}' if n > 1 else '') + ' — use a token (tokens.md) or a class from registry.json')


def main(argv):
    design_only = '--design-only' in argv
    designs = [os.path.abspath(a) for a in argv if not a.startswith('--')]
    reg = load_registry()
    known = known_classes(reg)
    report = Report()
    print(f'\n  Profolio KSA skill — {rel(ROOT) if ROOT != os.getcwd() else "."}' + (f' · {len(designs)} design(s)' if designs else ''))

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
    if not design_only:
        for path in html_files('designs'):
            if os.path.abspath(path) not in designs:
                designs.append(os.path.abspath(path))
    for path in designs:
        if not os.path.exists(path):
            print(f'  no such file: {path}')
            return 2
        html = read(path)
        pairs.append((path, html, metas(html), False))

    # 1 and 2 — what is written with the skill, against what the product has
    style_fail, colour_fail = [], []
    written = [(p, h, m) for p, h, m, ref in pairs if not ref]
    product = {'styles': set(), 'colours': set()}
    if written:
        refs = [(h) for p, h, m, ref in pairs if ref]
        if design_only:
            refs = [read(f) for f in html_files('pages', 'atoms', 'molecules', 'organisms')]
        for h in refs:
            product['styles'].update(STYLE_RE.findall(h))
            product['colours'].update(body_colours(h))
    for path, html, m in written:
        base_html = None
        if 'pf-base' in m:
            base = os.path.join(ROOT, m['pf-base'])
            if not os.path.exists(base):
                style_fail.append(f'{rel(path)}: its pf-base {m["pf-base"]} does not exist')
                continue
            base_html = read(base)
        check_design(path, html, base_html, product, style_fail, colour_fail)
    report.add(1, 'no style attribute in a design', style_fail, f'{len(written)} design(s) checked; {len(pairs) - len(written)} compiled references are the product as shipped')
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

    if not design_only:
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

    failed = report.print()
    return 1 if failed else 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
